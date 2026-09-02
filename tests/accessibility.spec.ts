import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const routes = ['./', './background', './concepts', './folder-structure', './data-fetching-and-mutation']

for (const route of routes) {
  test(`${route} has no detectable WCAG A or AA violations`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()

    expect(results.violations).toEqual([])
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })
}

test('keyboard focus remains visible in the primary navigation', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1, name: 'RFAStack' })).toBeVisible()
  await page.keyboard.press('Tab')

  const focusedElement = page.locator(':focus')
  await expect(focusedElement).toBeVisible()
  await expect(focusedElement).toHaveCSS('outline-style', /solid|dotted|auto/)
})

test('diagram motion is removed when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')

  await expect(page.locator('.architecture-map .map-node').first()).toHaveCSS('animation-duration', '0s')
})
