import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Pool } from 'pg'

function count(name: string, scope: string) {
  try {
    return readFileSync('test-results/cache-trace.jsonl', 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
      .filter((event) => event.name === name && event.scope === scope).length
  } catch {
    return 0
  }
}

test('shared cache reuse and private browser reuse have different lifetimes', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill('bob@example.test')
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Signed in as bob')).toBeVisible()
  await expect.poll(() => count('recommendations', 'account-bob')).toBeGreaterThan(0)
  const shared = count('orders', 'account-bob')
  const personal = count('recommendations', 'account-bob')
  await page.getByRole('link', { name: 'Customer order portal', exact: true }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/')
  await page.goBack()
  await expect(page.getByText('Signed in as bob')).toBeVisible()
  expect(count('recommendations', 'account-bob')).toBe(personal)
  await page.reload()
  await expect(page.getByText('Signed in as bob')).toBeVisible()
  await expect.poll(() => count('recommendations', 'account-bob')).toBeGreaterThan(personal)
  expect(count('orders', 'account-bob')).toBe(shared)
})

test('a revoked session cannot reuse warmed protected server data', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill('bob@example.test')
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Signed in as bob')).toBeVisible()
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    await pool.query('DELETE FROM auth_session WHERE "userId" = $1', ['bob'])
  } finally {
    await pool.end()
  }
  await page.reload()
  await expect(page).toHaveURL(/sign-in/)
})

test('React memoization reuses a detail read only within one render', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill('bob@example.test')
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Signed in as bob')).toBeVisible()
  const before = count('order-detail', 'account-bob')
  await page.goto('/orders/order-bob')
  await expect(page.getByText('Estimated delivery: 3 business days.')).toBeVisible()
  expect(count('order-detail', 'account-bob') - before).toBe(1)
  await page.reload()
  await expect(page.getByText('Estimated delivery: 3 business days.')).toBeVisible()
  expect(count('order-detail', 'account-bob') - before).toBe(2)
})

test('an expired session cannot reuse warmed protected server data', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill('bob@example.test')
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Signed in as bob')).toBeVisible()
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    await pool.query(
      'UPDATE auth_session SET "expiresAt" = NOW() - INTERVAL \'1 hour\' WHERE "userId" = $1',
      ['bob'],
    )
  } finally {
    await pool.end()
  }
  await page.reload()
  await expect(page).toHaveURL(/sign-in/)
})
