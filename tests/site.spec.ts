import { expect, test } from '@playwright/test'

const publicRoutes = [
  { path: './', heading: 'RFAStack' },
  { path: './background', heading: 'Background & Motivation' },
  { path: './concepts', heading: 'Concepts' },
  { path: './folder-structure', heading: 'Folder Structure' },
  { path: './data-fetching-and-mutation', heading: 'Data Fetching & Mutation' },
] as const

test('every public route renders its document', async ({ page }) => {
  for (const route of publicRoutes) {
    const response = await page.goto(route.path)

    expect(response?.ok()).toBe(true)
    await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible()
    expect(await page.title()).toContain(route.heading)
  }
})

test('homepage exposes the complete RFAStack reading path', async ({ page }) => {
  await page.goto('./')

  await expect(page.getByRole('heading', { level: 1, name: 'RFAStack' })).toBeVisible()
  await expect(page.getByText('An Opinionated React Fullstack Architecture for Next.js Applications')).toBeVisible()

  const guideLinks = [
    ['Background & Motivation', 'background'],
    ['Concepts', 'concepts'],
    ['Folder Structure', 'folder-structure'],
    ['Data Fetching & Mutation', 'data-fetching-and-mutation'],
  ] as const

  const main = page.locator('#VPContent')

  for (const [name, path] of guideLinks) {
    await expect(main.getByRole('link', { name: new RegExp(name) })).toHaveAttribute(
      'href',
      `/RFAStack/${path}`,
    )
  }
})

test('architecture map names and explains the four responsibility boundaries', async ({ page }) => {
  await page.goto('./')

  const map = page.getByRole('img', { name: 'RFAStack architecture map' })
  await expect(map).toBeVisible()

  for (const boundary of ['App Router', 'Features', 'Platform', 'Shared']) {
    await expect(map.getByText(boundary, { exact: true })).toBeVisible()
  }

  await expect(page.getByText('Text alternative: the App Router delegates')).toBeVisible()
})

test('internal links retain the GitHub Pages base path', async ({ page }) => {
  await page.goto('./folder-structure')

  const links = await page.locator('a[href^="/"]').evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute('href')),
  )

  expect(links.length).toBeGreaterThan(0)
  expect(links.every((href) => href?.startsWith('/RFAStack/'))).toBe(true)
})

test('local search finds a concept across the guide', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Desktop search interaction is covered here.')
  await page.goto('./')

  await page.getByRole('button', { name: 'Search' }).click()
  await page.locator('#localsearch-input').fill('vertical slice')

  await expect(page.locator('#localsearch-list')).toBeVisible()
  await expect(page.locator('#localsearch-list').getByText(/Concepts|Folder Structure/).first()).toBeVisible()
})

test('appearance switch toggles dark and light modes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'The mobile switch is inside a separate nav flow.')
  await page.goto('./background')

  const appearance = page.getByRole('switch', { name: 'Switch to dark theme' })
  await appearance.click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('switch', { name: 'Switch to light theme' }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
})

test('code examples expose working copy controls', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Copy behavior does not vary by viewport.')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('./folder-structure')
  await expect(page.getByRole('heading', { level: 1, name: 'Folder Structure' })).toBeVisible()

  const copy = page.locator('div[class*="language-"] button.copy').first()
  await copy.click()
  await expect(copy).toHaveClass(/copied/)
})

test('chapter navigation follows the intended reading order', async ({ page }) => {
  await page.goto('./folder-structure')

  await expect(page.getByRole('link', { name: /Previous field note Concepts/ })).toHaveAttribute(
    'href',
    '/RFAStack/concepts',
  )
  await expect(page.getByRole('link', { name: /Next field note Data Fetching & Mutation/ })).toHaveAttribute(
    'href',
    '/RFAStack/data-fetching-and-mutation',
  )
})

test('mobile readers can open the site navigation and chapter sidebar', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only navigation contract.')
  await page.goto('./background')

  const siteNavigation = page.getByRole('button', { name: 'mobile navigation' })
  await siteNavigation.click()
  await expect(siteNavigation).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#VPNavScreen').getByRole('link', { name: 'Guide' })).toBeVisible()

  await siteNavigation.click()
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(page.getByLabel('Sidebar Navigation')).toBeVisible()
})

test('unknown routes render the custom field-note 404', async ({ page }) => {
  await page.goto('./missing-page')

  await expect(page.getByRole('heading', { level: 1, name: 'This route has no field note.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return to the architecture map' })).toHaveAttribute(
    'href',
    '/RFAStack/',
  )
})
