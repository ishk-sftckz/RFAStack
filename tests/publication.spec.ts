import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const publicFiles = [
  'README.md',
  'package.json',
  'docs/index.md',
  'docs/background.md',
  'docs/concepts.md',
  'docs/folder-structure.md',
  'docs/data-fetching-and-mutation.md',
  'docs/.vitepress/config.ts',
]

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8')
}

test('public copy uses the approved identity consistently', () => {
  const tagline = 'An Opinionated React Fullstack Architecture for Next.js Applications'

  for (const path of ['README.md', 'docs/index.md', 'docs/.vitepress/config.ts']) {
    expect(read(path), `${path} must contain the approved tagline`).toContain(tagline)
  }

  const publication = publicFiles.map(read).join('\n')
  expect(publication).toContain('React Fullstack Architecture')
  expect(publication).not.toMatch(/NextJS|Nextjs|Next\.JS/)
  expect(publication).not.toMatch(/\bI believe\b|\bmy preference\b|\bthe best architecture\b/i)
  expect(publication).not.toMatch(/\bTODO\b|coming soon|lorem ipsum|placeholder/i)
})

test('public source contains no source-notebook references', () => {
  const publication = publicFiles.map(read).join('\n')
  expect(publication).not.toMatch(new RegExp(['not', 'ion'].join(''), 'i'))
})

test('the guide attributes its foundations and links primary framework sources', () => {
  const concepts = read('docs/concepts.md')
  const data = read('docs/data-fetching-and-mutation.md')

  for (const foundation of ['Screaming Architecture', 'Vertical Slice Architecture', 'Clean Architecture', 'Domain-Driven Design']) {
    expect(concepts).toContain(foundation)
  }

  for (const source of ['nextjs.org/docs', 'react.dev', 'tanstack.com/query', 'orpc.dev/docs']) {
    expect(data).toContain(source)
  }
})

test('repository includes the intended dual-license notices', () => {
  expect(read('LICENSE-CODE')).toContain('MIT License')
  expect(read('LICENSE-CONTENT')).toContain('Creative Commons Attribution 4.0 International')
  expect(read('LICENSE.md')).toContain('RFAStack by Ishk')
})
