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
  await page.getByLabel('Email', { exact: true }).fill('south@example.test')
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Signed in as south')).toBeVisible()
  await expect.poll(() => count('operator-preferences', 'warehouse-south')).toBeGreaterThan(0)
  const shared = count('warehouse-summary', 'warehouse-south')
  const personal = count('operator-preferences', 'warehouse-south')
  await page.getByRole('link', { name: 'Fulfillment dashboard', exact: true }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/')
  await page.goBack()
  await expect(page.getByText('Signed in as south')).toBeVisible()
  expect(count('operator-preferences', 'warehouse-south')).toBe(personal)
  await page.reload()
  await expect(page.getByText('Signed in as south')).toBeVisible()
  await expect
    .poll(() => count('operator-preferences', 'warehouse-south'))
    .toBeGreaterThan(personal)
  expect(count('warehouse-summary', 'warehouse-south')).toBe(shared)
})

test('a revoked session cannot reuse warmed protected server data', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill('south@example.test')
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Signed in as south')).toBeVisible()
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    await pool.query('DELETE FROM auth_session WHERE "userId" = $1', ['south'])
  } finally {
    await pool.end()
  }
  await page.reload()
  await expect(page).toHaveURL(/sign-in/)
})

test('an expired session cannot reuse warmed protected server data', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill('south@example.test')
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Signed in as south')).toBeVisible()
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    await pool.query(
      'UPDATE auth_session SET "expiresAt" = NOW() - INTERVAL \'1 hour\' WHERE "userId" = $1',
      ['south'],
    )
  } finally {
    await pool.end()
  }
  await page.reload()
  await expect(page).toHaveURL(/sign-in/)
})
