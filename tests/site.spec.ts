import { expect, test } from '@playwright/test'

const publicRoutes = [
  { path: './', heading: 'RFAStack' },
  { path: './background', heading: 'Background & Motivation' },
  { path: './concepts', heading: 'Concepts' },
  { path: './folder-structure', heading: 'Folder Structure' },
  { path: './data-fetching-and-mutation', heading: 'Data Fetching & Mutation' },
  { path: './protected-resources', heading: 'Protected Resources' },
  { path: './caching', heading: 'Caching' },
  { path: './examples', heading: 'Runnable Examples' },
] as const

test('every public route renders its document', async ({ page }) => {
  for (const route of publicRoutes) {
    const response = await page.goto(route.path)

    expect(response?.ok()).toBe(true)
    await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible()
    expect(await page.title()).toContain(route.heading)
    if (route.path === './') {
      await expect(page.locator('.reading-time')).toHaveCount(0)
    } else {
      await expect(page.locator('.vp-doc h1 + .reading-time')).toHaveText(/About [1-9]\d* min read/)
    }
  }
})

test('reading time updates when navigating between chapters', async ({ page }) => {
  await page.goto('./background')
  const backgroundTime = await page.locator('.reading-time').textContent()

  await page.locator('.vp-doc').getByRole('link', {
    name: 'see the architectural foundations behind ownership and dependency direction',
  }).click()

  await expect(page).toHaveURL(/\/RFAStack\/concepts$/)
  await expect(page.locator('.reading-time')).toHaveCount(1)
  await expect(page.locator('.reading-time')).not.toHaveText(backgroundTime!)
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
    name: 'You can know the Next.js APIs and still be unsure where your code belongs',
  })).toBeVisible()
  await expect(page.getByText(
    'A Next.js application rarely becomes hard to maintain overnight. It happens one reasonable shortcut at a time, until nobody is sure where business logic belongs or what a small change might break. RFAStack gives you an opinionated architecture to follow before the codebase reaches that point.',
    { exact: true },
  )).toBeVisible()
  await expect(page.getByText('Another page calls an internal endpoint')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'A small change should not begin with a repository-wide search' })).toBeVisible()
  await expect(page.getByText('That uncertainty slows reviews')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Give every business rule an owner and every data path a reason' })).toBeVisible()

  const model = page.getByLabel('RFAStack architectural concerns')

  for (const concern of [
    'Start with the operation',
    'Business rules belong to features',
    'Reads and mutations should be traceable',
    'Extra structure needs a requirement',
  ]) {
    await expect(model.getByRole('heading', { level: 3, name: concern })).toBeVisible()
  }

  await expect(page.getByRole('heading', { level: 2, name: 'From code ownership to data flow' })).toBeVisible()

  const readingPathLinks = [
    ['Background & Motivation', 'background'],
    ['Architecture Foundations', 'concepts'],
    ['Data Fetching & Mutation', 'data-fetching-and-mutation'],
    ['Protected Resources', 'protected-resources'],
    ['Caching', 'caching'],
    ['Runnable Examples', 'examples'],
  ] as const

  const readingPath = page.getByLabel('RFAStack reading path')

  for (const [name, path] of readingPathLinks) {
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

test('homepage typography is isolated from guide prose styles', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Desktop sizing exercises the full editorial scale.')
  await page.goto('./')

  const typography = await page.evaluate(() => {
    const metrics = (selector: string) => {
      const styles = getComputedStyle(document.querySelector(selector)!)
      return {
        fontSize: Number.parseFloat(styles.fontSize),
        fontWeight: styles.fontWeight,
        lineHeight: Number.parseFloat(styles.lineHeight),
      }
    }

    return {
      hero: metrics('.manual-hero h1'),
      section: metrics('.section-heading h2'),
      concern: metrics('.concern-grid h3'),
      chapter: metrics('.chapter-list strong'),
    }
  })

  expect(typography.hero.fontSize).toBeGreaterThan(100)
  expect(typography.hero.fontWeight).toBe('500')
  expect(typography.section.fontSize).toBeGreaterThanOrEqual(44)
  expect(typography.concern.fontSize).toBeGreaterThanOrEqual(29)
  expect(typography.chapter.lineHeight / typography.chapter.fontSize).toBeLessThanOrEqual(1.1)
})

test('headings and short editorial copy use intentional text wrapping', async ({ page }) => {
  await page.goto('./')

  await expect(page.locator('.manual-tagline')).toHaveCSS('text-wrap', 'balance')
  await expect(page.locator('.manual-lede')).toHaveCSS('text-wrap', 'pretty')

  await page.goto('./background')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('text-wrap', 'balance')
  await expect(page.locator('.VPDoc .vp-doc > div > p').first()).toHaveCSS('text-wrap', 'pretty')
})

test('homepage actions have responsive feedback and usable targets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Desktop controls expose all actions at once.')
  await page.goto('./')

  const primary = page.getByRole('link', { name: 'Read the docs' })
  const secondary = page.getByRole('link', { name: 'View on GitHub' })
  const secondaryBox = await secondary.boundingBox()

  expect(secondaryBox?.height).toBeGreaterThanOrEqual(44)
  await expect(primary).toHaveCSS(
    'transition-property',
    'background-color, color, transform, scale',
  )

  await primary.hover()
  await page.mouse.down()
  await expect(primary).toHaveCSS('scale', '0.96')
  await page.mouse.move(0, 0)
  await page.mouse.up()

  const appearance = page.locator('.VPNavBarAppearance .VPSwitchAppearance')
  const appearanceTarget = await appearance.evaluate((element) => {
    const styles = getComputedStyle(element, '::before')
    return [Number.parseFloat(styles.width), Number.parseFloat(styles.height)]
  })
  const socialBox = await page.locator('.VPNavBarSocialLinks .VPSocialLink').boundingBox()

  expect(appearanceTarget).toEqual([40, 40])
  expect(socialBox?.width).toBeGreaterThanOrEqual(40)
  expect(socialBox?.height).toBeGreaterThanOrEqual(40)
})

test('reading-path hover feedback does not shift the chapter layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Pointer hover is a desktop interaction.')
  await page.goto('./')

  const chapter = page.locator('.chapter-list a').first()
  const arrow = chapter.locator('svg.chapter-list__arrow')
  await chapter.scrollIntoViewIfNeeded()

  const before = await chapter.boundingBox()
  await chapter.hover()
  await expect(arrow).not.toHaveCSS('transform', 'none')
  const after = await chapter.boundingBox()

  expect(after?.x).toBe(before?.x)
  expect(after?.width).toBe(before?.width)
  await expect(chapter).toHaveCSS('transition-property', 'background-color')
})

test('architecture map entrance waits until the diagram is in view', async ({ page }) => {
  await page.goto('./')

  const figure = page.locator('.architecture-figure')
  const firstNode = figure.locator('.map-node').first()

  await expect(figure).toHaveClass(/is-motion-ready/)
  await expect(figure).not.toHaveClass(/is-visible/)
  await expect(firstNode).toHaveCSS('animation-name', 'none')

  await figure.scrollIntoViewIfNeeded()
  await expect(figure).toHaveClass(/is-visible/)
  await expect(firstNode).toHaveCSS('animation-name', 'map-enter')
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

  await expect(page.getByRole('link', { name: /Previous chapter Architecture Foundations/ })).toHaveAttribute(
    'href',
    '/RFAStack/concepts',
  )
  await expect(page.getByRole('link', { name: /Next chapter Data Fetching & Mutation/ })).toHaveAttribute(
    'href',
    '/RFAStack/data-fetching-and-mutation',
  )

  await page.goto('./data-fetching-and-mutation')
  await page.getByRole('link', { name: /Next chapter Protected Resources/ }).click()
  await expect(page).toHaveURL(/\/RFAStack\/protected-resources$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Protected Resources' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Previous chapter Data Fetching & Mutation/ })).toHaveAttribute(
    'href',
    '/RFAStack/data-fetching-and-mutation',
  )

  await page.getByRole('link', { name: /Next chapter Caching/ }).click()
  await expect(page).toHaveURL(/\/RFAStack\/caching$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Caching' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Previous chapter Protected Resources/ })).toHaveAttribute(
    'href',
    '/RFAStack/protected-resources',
  )
})

test('mobile readers can open the site navigation and chapter sidebar', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only navigation contract.')
  await page.goto('./background')

  const siteNavigation = page.getByRole('button', { name: 'mobile navigation' })
  await expect(page.locator('.VPSwitchAppearance').first()).toHaveAttribute('title', /Switch to/)
  await siteNavigation.click()
  await expect(siteNavigation).toHaveAttribute('aria-expanded', 'true')
  const navScreen = page.locator('#VPNavScreen')
  await expect(navScreen.getByRole('link', { name: 'Docs' })).toBeVisible()

  const appearanceTarget = await navScreen.locator('.VPSwitchAppearance').evaluate((element) => {
    const styles = getComputedStyle(element, '::before')
    return [Number.parseFloat(styles.width), Number.parseFloat(styles.height)]
  })
  const socialBox = await navScreen.locator('.VPSocialLink').boundingBox()

  expect(appearanceTarget).toEqual([44, 44])
  expect(socialBox?.width).toBeGreaterThanOrEqual(44)
  expect(socialBox?.height).toBeGreaterThanOrEqual(44)

  await siteNavigation.click()
  await page.getByRole('button', { name: 'Menu' }).click()
  const sidebar = page.getByLabel('Sidebar Navigation')
  await expect(sidebar).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'RFAStack home' })).toBeVisible()
  await expect(sidebar.locator('.sidebar-brand__logo.light')).toHaveAttribute('src', '/RFAStack/wordmark.svg')

  const sidebarTargets = await sidebar.locator('.VPSidebarItem .link, .VPSidebarItem .caret').evaluateAll(
    (elements) => elements
      .filter((element) => (element as HTMLElement).offsetParent !== null)
      .map((element) => element.getBoundingClientRect().height),
  )

  expect(sidebarTargets.length).toBeGreaterThan(0)
  expect(sidebarTargets.every((height) => height >= 44)).toBe(true)
})

test('guide prose uses Geist while headings retain the editorial display face', async ({ page }) => {
  await page.goto('./background')

  await expect(page.getByText(/React gives you the building blocks for user interfaces/)).toHaveCSS(
    'font-family',
    /Geist Variable/,
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /Newsreader Variable/)
})

test('sidebar exposes the guide sections, protected resources, and caching', async ({ page }, testInfo) => {
  await page.goto('./background')

  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Menu' }).click()
  }

  const sidebar = page.getByLabel('Sidebar Navigation')
  const introduction = sidebar.getByRole('link', { name: 'Introduction', exact: true })
  const foundations = sidebar.getByRole('link', { name: 'Architecture Foundations', exact: true })
  const background = sidebar.getByRole('link', { name: 'Background & Motivation' })
  const concepts = sidebar.getByRole('link', { name: 'Concepts', exact: true })
  const folderStructure = sidebar.getByRole('link', { name: 'Folder Structure' })
  const dataFetching = sidebar.getByRole('link', { name: 'Data Fetching & Mutation', exact: true })
  const protectedResources = sidebar.getByRole('link', { name: 'Protected Resources', exact: true })
  const caching = sidebar.getByRole('link', { name: 'Caching', exact: true })

  await expect(introduction).toBeVisible()
  await expect(introduction).toHaveAttribute('href', '/RFAStack/background')
  await expect(foundations).toBeVisible()
  await expect(foundations).toHaveAttribute('href', '/RFAStack/concepts')
  await expect(background).toBeVisible()
  await expect(concepts).toBeVisible()
  await expect(folderStructure).toBeVisible()
  await expect(dataFetching).toBeVisible()
  await expect(dataFetching).toHaveCount(1)
  await expect(dataFetching).toHaveAttribute('href', '/RFAStack/data-fetching-and-mutation')
  await expect(protectedResources).toBeVisible()
  await expect(protectedResources).toHaveAttribute('href', '/RFAStack/protected-resources')
  await expect(caching).toBeVisible()
  await expect(caching).toHaveAttribute('href', '/RFAStack/caching')

  await introduction.locator('..').getByRole('button', { name: 'toggle section' }).click()
  await expect(background).toBeHidden()
  await expect(folderStructure).toBeVisible()

  await foundations.locator('..').getByRole('button', { name: 'toggle section' }).click()
  await expect(concepts).toBeHidden()
  await expect(folderStructure).toBeHidden()

  await expect(dataFetching).toBeVisible()
  await expect(dataFetching.locator('..').getByRole('button', { name: 'toggle section' })).toHaveCount(0)
})

test('unknown routes render the custom 404 page', async ({ page }) => {
  await page.goto('./missing-page')

  await expect(page.getByRole('heading', { level: 1, name: "This page doesn't exist." })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return to the guide' })).toHaveAttribute(
    'href',
    '/RFAStack/',
  )
})
