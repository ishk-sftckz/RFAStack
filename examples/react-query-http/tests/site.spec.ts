import { test, expect, type Page } from '@playwright/test'
import { createHmac } from 'node:crypto'

test('proxy redirects missing, empty, and unrelated cookies on protected paths', async ({
  request,
}) => {
  for (const cookie of [
    '',
    'rfa-fulfillment.session_token=',
    '__Secure-rfa-fulfillment.session_token=',
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

for (const cookieName of [
  'rfa-fulfillment.session_token',
  '__Secure-rfa-fulfillment.session_token',
]) {
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

async function login(page: Page, name = 'north') {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill(`${name}@example.test`)
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText(`Signed in as ${name}`)).toBeVisible()
}

test('operators pack and dispatch, then receive a signed carrier event', async ({
  page,
  request,
}) => {
  await login(page)
  await page.getByRole('button', { name: 'shipment-north', exact: true }).click()
  const packedResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/fulfillment/shipments') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Pack shipment-north' }).click()
  expect(await (await packedResponse).json()).toEqual({ tag: 'warehouse:warehouse-north' })
  await expect(page.getByText('shipment-north: packed', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Dispatch shipment-north' }).click()
  await expect(page.getByText('shipment-north: dispatched', { exact: true })).toBeVisible()
  await expect(page.getByText('Summary: 1 shipments; 1 dispatched.')).toBeVisible()
  const body = JSON.stringify({
    eventId: 'test-delivery',
    shipmentId: 'shipment-north',
    status: 'delivered',
  })
  const headers = {
    'X-Signature': createHmac('sha256', process.env.INTEGRATION_SECRET!).update(body).digest('hex'),
  }
  expect(
    (await request.post('http://127.0.0.1:4102/events/carrier', { data: body, headers })).ok(),
  ).toBeTruthy()
  await expect(page.getByText('shipment-north: delivered', { exact: true })).toBeVisible({
    timeout: 12000,
  })
  const duplicate = await request.post('http://127.0.0.1:4102/events/carrier', {
    data: body,
    headers,
  })
  expect(await duplicate.json()).toEqual({ duplicate: true })
})

test('backend and frontend enforce warehouse, role, and origin boundaries', async ({
  page,
  request,
}) => {
  expect((await request.get('http://127.0.0.1:4102/fulfillment/shipments')).status()).toBe(401)
  await login(page, 'south')
  await expect(page.getByRole('button', { name: 'shipment-north', exact: true })).toHaveCount(0)
  const origin = { Origin: 'http://localhost:3102' }
  expect(
    (
      await page.request.post('/api/fulfillment/shipments', {
        headers: origin,
        data: { id: 'shipment-north', status: 'packed' },
      })
    ).status(),
  ).toBe(404)
  expect(
    (
      await page.request.post('/api/fulfillment/products', {
        headers: origin,
        data: { id: 'notebook', price: 1 },
      })
    ).status(),
  ).toBe(403)
  expect(
    (
      await page.request.post('/api/fulfillment/shipments', {
        headers: { Origin: 'https://untrusted.example' },
        data: { id: 'shipment-south', status: 'packed' },
      })
    ).status(),
  ).toBe(403)
  expect((await request.post('http://127.0.0.1:4102/events/carrier', { data: {} })).status()).toBe(
    401,
  )
})

test('supervisors update prices and preferences, and logout isolates cached data', async ({
  page,
}) => {
  await login(page, 'supervisor')
  await page.getByLabel('Notebook price in cents').fill('1400')
  const priceResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/fulfillment/products') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Update Notebook' }).click()
  expect(await (await priceResponse).json()).toEqual({ tag: 'catalog' })
  await expect(page.getByText('Notebook: $14.00', { exact: true })).toBeVisible()
  await page.getByLabel('Delivery speed').selectOption('express')
  await page.getByLabel('Default queue status').selectOption('dispatched')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Saved delivery preference: express')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Status filter')).toHaveValue('dispatched')
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page).toHaveURL(/sign-in/)
  await login(page, 'south')
  await expect(page.getByText('Saved delivery preference: standard')).toBeVisible()
  await expect(page.getByRole('button', { name: 'shipment-north', exact: true })).toHaveCount(0)
  await page.getByLabel('Status filter').selectOption('delivered')
  await expect(page.getByText('No shipments match this filter.')).toBeVisible()
})

test('shipment search combines with status filters and can be cleared', async ({ page }) => {
  await login(page, 'south')
  await page.getByLabel('Search shipments', { exact: true }).fill('SHIPMENT-SOUTH')
  await expect(page.getByRole('button', { name: 'shipment-south', exact: true })).toBeVisible()
  await page.getByLabel('Search shipments', { exact: true }).fill('missing shipment')
  await expect(page.getByText('No shipments match your search.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByLabel('Search shipments', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Status filter')).toHaveValue('all')
  await page.getByRole('button', { name: 'shipment-south', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Selected shipment' })).toBeVisible()
  await page.getByRole('button', { name: 'Close details' }).click()
  await expect(page.getByRole('heading', { name: 'Selected shipment' })).toHaveCount(0)
})

test('membership owns the protected preferences endpoint', async ({ page, request }) => {
  const input = { preference: 'express', savedFilter: 'packed' }
  const origin = { Origin: 'http://localhost:3102' }
  expect(
    (await request.post('/api/membership/preferences', { headers: origin, data: input })).status(),
  ).toBe(401)
  await login(page, 'north')
  expect(
    (
      await page.request.post('/api/fulfillment/preferences', { headers: origin, data: input })
    ).status(),
  ).toBe(404)
  expect(
    (
      await page.request.post('/api/membership/preferences', {
        headers: { Origin: 'https://untrusted.example' },
        data: input,
      })
    ).status(),
  ).toBe(403)
  expect(
    (
      await page.request.post('/api/membership/preferences', {
        headers: origin,
        data: { preference: 'invalid', savedFilter: 'packed' },
      })
    ).status(),
  ).toBe(400)
  const saved = await page.request.post('/api/membership/preferences', {
    headers: origin,
    data: input,
  })
  expect(saved.ok()).toBeTruthy()
  expect(await saved.json()).toEqual({ tag: 'preferences:north' })
  await page.reload()
  await expect(page.getByText('Saved delivery preference: express')).toBeVisible()
  await expect(page.getByLabel('Status filter')).toHaveValue('packed')
})
