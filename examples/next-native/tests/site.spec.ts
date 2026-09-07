import { test, expect, type Page } from '@playwright/test'
import { Pool } from 'pg'

test('proxy redirects missing, empty, and unrelated cookies on protected paths', async ({
  request,
}) => {
  for (const cookie of [
    '',
    'rfa-customer.session_token=',
    '__Secure-rfa-customer.session_token=',
    'better-auth.session_token=unverified',
  ]) {
    for (const path of ['/account', '/account/preferences', '/orders/example']) {
      const response = await request.get(path, {
        headers: { Cookie: cookie },
        maxRedirects: 0,
      })
      expect(response.status()).toBe(307)
      expect(new URL(response.headers().location, response.url()).href).toBe(
        new URL('/sign-in', response.url()).href,
      )
    }
  }
})

for (const cookieName of ['rfa-customer.session_token', '__Secure-rfa-customer.session_token']) {
  test(`protected operations reject a forged ${cookieName} cookie`, async ({ page, request }) => {
    const headers = { Cookie: `${cookieName}=forged-session` }
    // A matched but nonexistent page reaches routing when the cookie is present.
    const earlyResponse = await request.get('/account/proxy-probe', {
      headers,
      maxRedirects: 0,
    })
    expect(earlyResponse.status()).toBe(404)

    await page.setExtraHTTPHeaders(headers)
    await page.goto('/account')
    await expect(page).toHaveURL(/\/sign-in$/)
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
    await expect(page.getByText('Signed in as', { exact: false })).toHaveCount(0)

    const response = await request.get('/api/auth/get-session', {
      headers,
      maxRedirects: 0,
    })
    expect(response.status()).toBe(200)
    expect(await response.json()).toBeNull()
  })
}

async function login(page: Page, name = 'alice') {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill(`${name}@example.test`)
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText(`Signed in as ${name}`)).toBeVisible()
}

test('customer can place an order, cancel it, and change preferences', async ({ page }) => {
  await login(page)
  await page.getByLabel('Notebook quantity').fill('2')
  await page.getByRole('button', { name: 'Place order', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Order placed:' })).toBeVisible()
  const text = await page.getByRole('status').filter({ hasText: 'Order placed:' }).innerText()
  await page.getByRole('link', { name: text.replace('Order placed: ', '') }).click()
  await expect(page.getByText('Total: $24.00', { exact: true })).toBeVisible()
  await expect(page.getByText('Estimated delivery: 3 business days.')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel order', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: /^cancelled$/ })).toBeVisible()
  await page.goto('/account')
  await page.getByLabel('Delivery speed').selectOption('express')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Delivery: express')).toBeVisible()
})

test('account boundaries hold for protected pages', async ({ page }) => {
  await page.goto('/orders/order-alice')
  await expect(page).toHaveURL(/sign-in/)
  await login(page, 'bob')
  await expect(page.getByRole('link', { name: 'order-alice', exact: true })).toHaveCount(0)
  await page.goto('/orders/order-alice')
  await expect(page.getByRole('heading', { name: 'Not found', exact: true })).toBeVisible()
})

test('logout discards personalized data before another customer signs in', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page).toHaveURL(/sign-in/)
  await login(page, 'bob')
  await expect(page.getByText('Delivery: standard')).toBeVisible()
  await expect(page.getByRole('link', { name: 'order-alice', exact: true })).toHaveCount(0)
})

test('refresh tracking reads current status and updates cancellation eligibility', async ({
  page,
}) => {
  await login(page)
  await page.goto('/orders/order-alice')
  await expect(page.getByRole('status').filter({ hasText: /^pending$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel order', exact: true })).toBeVisible()
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    await pool.query('UPDATE customer_order SET status = $1 WHERE id = $2', [
      'shipped',
      'order-alice',
    ])
    await page.getByRole('button', { name: 'Refresh tracking' }).click()
    await expect(page.getByRole('status').filter({ hasText: /^shipped$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel order', exact: true })).toHaveCount(0)
  } finally {
    await pool.query('UPDATE customer_order SET status = $1 WHERE id = $2', [
      'pending',
      'order-alice',
    ])
    await pool.end()
  }
})

test('quantity controls keep totals valid and prevent empty orders', async ({ page }) => {
  await login(page)
  const quantity = page.getByRole('spinbutton', { name: 'Notebook quantity', exact: true })
  const submit = page.getByRole('button', { name: 'Place order', exact: true })
  await expect(submit).toBeDisabled()
  await page.getByRole('button', { name: 'Increase Notebook', exact: true }).click()
  await expect(quantity).toHaveValue('1')
  await expect(submit).toBeEnabled()
  await quantity.fill('21')
  await expect(quantity).toHaveValue('20')
  await expect(page.getByRole('button', { name: 'Increase Notebook', exact: true })).toBeDisabled()
  await quantity.fill('1')
  await page.getByRole('button', { name: 'Decrease Notebook', exact: true }).click()
  await expect(quantity).toHaveValue('0')
  await expect(submit).toBeDisabled()
  await expect(page.locator('.total-line')).toContainText('$0.00')
})
