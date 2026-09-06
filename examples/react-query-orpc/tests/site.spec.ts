import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { test, expect, type Page } from '@playwright/test'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { router } from '../src/app/api/rpc/router'

async function login(page: Page, name = 'alice') {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill(`${name}@example.test`)
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText(`Signed in as ${name}`)).toBeVisible()
}

async function clientFor(page: Page) {
  const cookies = await page.context().cookies()

  return createORPCClient<RouterClient<typeof router>>(
    new RPCLink({
      url: 'http://localhost:3103/api/rpc',
      headers: {
        Cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
        Origin: 'http://localhost:3103',
      },
    }),
  )
}

test('buyers submit purchase orders and approvers decide through the same API', async ({
  page,
}) => {
  await login(page)
  await page.getByLabel('Company A notebook quantity').fill('2')
  await page.getByRole('button', { name: 'Submit for approval' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Purchase order submitted:' }),
  ).toBeVisible()
  await expect(
    page.getByRole('spinbutton', { name: 'Company A notebook quantity', exact: true }),
  ).toHaveValue('0')
  await expect(page.getByRole('button', { name: 'Submit for approval' })).toBeDisabled()
  const id = (
    await page.getByRole('status').filter({ hasText: 'Purchase order submitted:' }).innerText()
  ).split(': ')[1]
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await login(page, 'approver-a')
  await page.getByRole('button', { name: `Approve ${id}`, exact: true }).click()
  await expect(page.getByRole('listitem').filter({ hasText: id })).toContainText('approved')
  await page.getByLabel('Delivery speed').selectOption('express')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Delivery: express')).toBeVisible()
})

test('typed clients enforce company scope, role, and input contracts', async ({ page }) => {
  await login(page)
  const client = await clientFor(page)
  await expect(client.orders.list({ scopeId: 'company-b' })).rejects.toMatchObject({
    code: 'FORBIDDEN',
  })
  await expect(
    client.orders.decide({ orderId: 'purchase-a', decision: 'approved' }),
  ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  await expect(client.orders.submit({ items: [] })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  await expect(
    client.orders.submit({ items: [{ productId: 'notebook-b', quantity: 1 }] }),
  ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  const submitted = await client.orders.submit({
    items: [{ productId: 'notebook-a', quantity: 1 }],
  })
  expect(
    (await client.orders.list({ scopeId: 'company-a' })).some((order) => order.id === submitted.id),
  ).toBeTruthy()
})

test('logout and company changes discard browser data', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await login(page, 'bob')
  await expect(page.getByText('purchase-a', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Company A notebook', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Delivery: standard')).toBeVisible()
})

test('the CLI lists and submits through the typed API and rejects an approver submission', async () => {
  const run = promisify(execFile)
  const result = await run('bun', ['scripts/client.ts'], { cwd: process.cwd() })
  expect(result.stdout).toContain('purchase-a')
  const submitted = await run('bun', ['scripts/client.ts', 'submit', 'notebook-a'], {
    cwd: process.cwd(),
  })
  expect(JSON.parse(submitted.stdout).id).toMatch(/^[0-9a-f-]{36}$/)
  await expect(
    run('bun', ['scripts/client.ts', 'submit', 'notebook-a'], {
      cwd: process.cwd(),
      env: { ...process.env, DEMO_EMAIL: 'approver-a@example.test' },
    }),
  ).rejects.toMatchObject({ code: 1 })
})

test('quantity controls keep totals valid and prevent empty orders', async ({ page }) => {
  await login(page)
  const quantity = page.getByRole('spinbutton', {
    name: 'Company A notebook quantity',
    exact: true,
  })
  const submit = page.getByRole('button', { name: 'Submit for approval', exact: true })
  await expect(submit).toBeDisabled()
  await page.getByRole('button', { name: 'Increase Company A notebook', exact: true }).click()
  await expect(quantity).toHaveValue('1')
  await expect(submit).toBeEnabled()
  await quantity.fill('21')
  await expect(quantity).toHaveValue('20')
  await expect(
    page.getByRole('button', { name: 'Increase Company A notebook', exact: true }),
  ).toBeDisabled()
  await quantity.fill('1')
  await page.getByRole('button', { name: 'Decrease Company A notebook', exact: true }).click()
  await expect(quantity).toHaveValue('0')
  await expect(submit).toBeDisabled()
  await expect(page.locator('.total-line')).toContainText('$0.00')
})

test('purchase orders can be filtered and inspected before a decision', async ({ page }) => {
  await login(page, 'approver-b')
  await page.getByLabel('Order status', { exact: true }).selectOption('rejected')
  await expect(page.getByText('No orders with this status.')).toBeVisible()
  await page.getByRole('button', { name: 'Show all orders' }).click()
  const order = page
    .getByRole('listitem')
    .filter({ has: page.getByText('purchase-b', { exact: true }) })
  await order.locator('summary').click()
  await expect(order.getByRole('listitem')).toContainText('Company b notebook')
})
