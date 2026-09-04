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

test('homepage presents RFAStack as a full-stack architecture model', async ({ page }) => {
  await page.goto('./')

  await expect(page.getByRole('heading', { level: 1, name: 'RFAStack' })).toBeVisible()
  await expect(page.getByText('An Opinionated React Fullstack Architecture for Next.js Applications')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Read the docs' })).toHaveAttribute(
    'href',
    '/RFAStack/background',
  )
  await expect(page.getByRole('link', { name: 'View on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/ishk-sftckz/RFAStack',
  )

  await expect(page.getByRole('heading', {
    level: 2,
    name: 'Next.js gives you the pieces. You still have to design the application.',
  })).toBeVisible()
  await expect(page.getByText(
    'A Next.js application rarely becomes hard to maintain overnight. It happens one reasonable shortcut at a time, until nobody is sure where business logic belongs or what a small change might break. RFAStack gives you an opinionated architecture to follow before the codebase reaches that point.',
    { exact: true },
  )).toBeVisible()
  await expect(page.getByText('Then cancellation changes')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Order behavior belongs in the orders feature' })).toBeVisible()
  await expect(page.getByText('this boundary earns its keep when changes cross UI')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'A folder structure cannot tell you how data should move' })).toBeVisible()

  const model = page.getByLabel('RFAStack architectural concerns')

  for (const concern of [
    'Business rules stay with the feature',
    'Server renders call the feature directly',
    'First-party mutations start with Server Actions',
    'Integrations do the work; features make the decision',
  ]) {
    await expect(model.getByRole('heading', { level: 3, name: concern })).toBeVisible()
  }

  await expect(page.getByRole('heading', { level: 2, name: 'Understand the rules before you copy the folders' })).toBeVisible()

  const guideLinks = [
    ['Background & Motivation', 'background'],
    ['Concepts', 'concepts'],
    ['Folder Structure', 'folder-structure'],
    ['Data Fetching & Mutation', 'data-fetching-and-mutation'],
  ] as const

  const readingPath = page.getByLabel('RFAStack reading path')

  for (const [name, path] of guideLinks) {
    await expect(readingPath.getByRole('link', { name: new RegExp(name) })).toHaveAttribute(
      'href',
      `/RFAStack/${path}`,
    )
  }
})

test('desktop navigation stays focused on docs and source', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Desktop navigation is hidden on mobile.')
  await page.goto('./')

  const links = page.locator('.VPNavBarMenuLink')
  await expect(links).toHaveCount(2)
  await expect(links.nth(0)).toHaveText('Docs')
  await expect(links.nth(0)).toHaveAttribute('href', '/RFAStack/background')
  await expect(links.nth(1)).toHaveText('GitHub')
  await expect(links.nth(1)).toHaveAttribute('href', 'https://github.com/ishk-sftckz/RFAStack')
})

test('architecture map names and explains the four responsibility boundaries', async ({ page }) => {
  await page.goto('./')

  const map = page.getByRole('img', { name: 'RFAStack architecture map' })
  await expect(map).toBeVisible()

  for (const boundary of ['src/app', 'src/features', 'src/platform', 'src/shared']) {
    await expect(map.getByText(boundary, { exact: true })).toBeVisible()
  }

  await expect(page.getByText('Text alternative: requests enter through src/app')).toBeVisible()
})

test('architecture map labels do not overlap their examples', async ({ page }) => {
  await page.goto('./')

  const overlaps = await page.locator('.map-node--platform').evaluate((node) => {
    const title = node.querySelector<SVGGraphicsElement>('.map-node__title')?.getBBox()
    const examples = node.querySelector<SVGGraphicsElement>('.map-node__copy')?.getBBox()

    if (!title || !examples) return true
    return !(
      title.x + title.width <= examples.x ||
      examples.x + examples.width <= title.x ||
      title.y + title.height <= examples.y ||
      examples.y + examples.height <= title.y
    )
  })

  expect(overlaps).toBe(false)
})

test('dark mode uses a legible wordmark asset', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Desktop navigation exposes the wordmark.')
  await page.goto('./')

  await page.getByRole('switch', { name: 'Switch to dark theme' }).click()

  const darkWordmark = page.locator('.VPNavBarTitle img.logo.dark')
  await expect(darkWordmark).toBeVisible()
  await expect(darkWordmark).toHaveAttribute('src', '/RFAStack/wordmark-dark.svg')
})

test('homepage tagline has enough leading when it wraps', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Desktop width reproduces the reported headline issue.')
  await page.goto('./')

  const spacing = await page.locator('.manual-tagline').evaluate((element) => {
    const styles = getComputedStyle(element)
    return Number.parseFloat(styles.lineHeight) / Number.parseFloat(styles.fontSize)
  })

  expect(spacing).toBeGreaterThanOrEqual(1.1)
})

test('homepage title stays on one line on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only hero layout contract.')
  await page.goto('./')

  const title = page.getByRole('heading', { level: 1, name: 'RFAStack' })
  const lines = await title.evaluate((element) => {
    const styles = getComputedStyle(element)
    return element.getBoundingClientRect().height / Number.parseFloat(styles.lineHeight)
  })

  expect(lines).toBeLessThan(1.2)
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

  await expect(page.getByRole('link', { name: /Previous chapter Concepts/ })).toHaveAttribute(
    'href',
    '/RFAStack/concepts',
  )
  await expect(page.getByRole('link', { name: /Next chapter Data Fetching & Mutation/ })).toHaveAttribute(
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
  await expect(page.locator('#VPNavScreen').getByRole('link', { name: 'Docs' })).toBeVisible()

  await siteNavigation.click()
  await page.getByRole('button', { name: 'Menu' }).click()
  const sidebar = page.getByLabel('Sidebar Navigation')
  await expect(sidebar).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'RFAStack home' })).toBeVisible()
  await expect(sidebar.locator('.sidebar-brand__logo.light')).toHaveAttribute('src', '/RFAStack/wordmark.svg')
})

test('guide prose uses Geist while headings retain the editorial display face', async ({ page }) => {
  await page.goto('./background')

  await expect(page.getByText(/React is a UI library that leaves broader application architecture/)).toHaveCSS(
    'font-family',
    /Geist Variable/,
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /Newsreader Variable/)
})

test('sidebar separates introductory chapters from collapsible guides', async ({ page }, testInfo) => {
  await page.goto('./background')

  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Menu' }).click()
  }

  const sidebar = page.getByLabel('Sidebar Navigation')
  const introduction = sidebar.getByRole('link', { name: 'Introduction', exact: true })
  const guides = sidebar.getByRole('link', { name: 'Guides', exact: true })
  const background = sidebar.getByRole('link', { name: 'Background & Motivation' })
  const folderStructure = sidebar.getByRole('link', { name: 'Folder Structure' })

  await expect(introduction).toBeVisible()
  await expect(introduction).toHaveAttribute('href', '/RFAStack/background')
  await expect(guides).toBeVisible()
  await expect(guides).toHaveAttribute('href', '/RFAStack/folder-structure')
  await expect(background).toBeVisible()
  await expect(folderStructure).toBeVisible()

  await introduction.locator('..').getByRole('button', { name: 'toggle section' }).click()
  await expect(background).toBeHidden()
  await expect(folderStructure).toBeVisible()

  await guides.locator('..').getByRole('button', { name: 'toggle section' }).click()
  await expect(folderStructure).toBeHidden()
})

test('unknown routes render the custom 404 page', async ({ page }) => {
  await page.goto('./missing-page')

  await expect(page.getByRole('heading', { level: 1, name: "This page doesn't exist." })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return to the guide' })).toHaveAttribute(
    'href',
    '/RFAStack/',
  )
})
