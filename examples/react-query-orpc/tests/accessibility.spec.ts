import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('public pages have accessible names, contrast, and landmarks', async ({ page }) => {
  for (const path of ['/', '/sign-in']) {
    await page.goto(path)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(result.violations).toEqual([])
  }
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Password', { exact: true })).toBeFocused()
})

test('the authenticated view remains accessible on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill('bob@example.test')
  await page.getByLabel('Password', { exact: true }).fill('Demo-password-123!')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByText('Signed in as bob')).toBeVisible()
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([])
})
