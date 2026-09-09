import { expect, test } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
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
  'docs/protected-resources.md',
  'docs/caching.md',
  'docs/examples.md',
  'examples/README.md',
  'examples/next-native/README.md',
  'examples/react-query-http/README.md',
  'examples/react-query-orpc/README.md',
  'docs/.vitepress/config.ts',
  'docs/.vitepress/id.ts',
  'docs/.vitepress/theme/components/HomePage.vue',
  ...readdirSync(join(root, 'docs/id')).filter((file) => file.endsWith('.md')).map((file) => `docs/id/${file}`),
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

  const guides = publicFiles.filter((path) => /^docs\/[^/]+\.md$/.test(path)).map(read).join('\n')
  expect(guides).not.toMatch(/\b(?:in|for) RFAStack\b|\bRFAStack (?:uses|recommends|requires|reserves|organizes|applies|borrows)\b/i)
})

test('public source contains no source-notebook references', () => {
  const publication = publicFiles.map(read).join('\n')
  expect(publication).not.toMatch(new RegExp(['not', 'ion'].join(''), 'i'))
})

test('the guide attributes its foundations and links primary framework sources', () => {
  const concepts = read('docs/concepts.md')
  const data = read('docs/data-fetching-and-mutation.md')
  const protectedResources = read('docs/protected-resources.md')
  const caching = read('docs/caching.md')

  for (const foundation of ['Screaming Architecture', 'Vertical Slice Architecture', 'Clean Architecture', 'Domain-Driven Design']) {
    expect(concepts).toContain(foundation)
  }

  for (const source of ['nextjs.org/docs', 'react.dev', 'tanstack.com/query', 'orpc.dev/docs']) {
    expect(data).toContain(source)
  }

  for (const source of ['nextjs.org/docs', 'react.dev/reference/react/cache', 'cheatsheetseries.owasp.org', 'better-auth.com/docs']) {
    expect(protectedResources).toContain(source)
  }

  for (const source of ['nextjs.org/docs', 'react.dev/reference/react/cache', 'tanstack.com/query']) {
    expect(caching).toContain(source)
  }
})

test('repository includes the intended dual-license notices', () => {
  expect(read('LICENSE-CODE')).toContain('MIT License')
  expect(read('LICENSE-CONTENT')).toContain('Creative Commons Attribution 4.0 International')
  expect(read('LICENSE.md')).toContain('RFAStack by Ishk')
})

test('examples explain distinct requirements and link their runnable source', () => {
  const guide = read('docs/examples.md')
  for (const name of ['next-native', 'react-query-http', 'react-query-orpc']) {
    expect(guide).toContain(`examples/${name}`)
    expect(read(`examples/${name}/README.md`)).toContain('bun install --frozen-lockfile')
  }
  expect(guide).toContain('separate backend')
  expect(guide).toContain('command-line client')
})

test('Indonesian guides preserve the source examples, citations, and section structure', () => {
  const guides = readdirSync(join(root, 'docs')).filter((file) => file.endsWith('.md') && file !== 'index.md')
  const code = (source: string) => [...source.matchAll(/^```([^\n]*)\n[\s\S]*?^```/gm)]
    .filter((block) => !['mermaid', 'text'].includes(block[1])).map((block) => block[0])
  const links = (source: string) => [...source.matchAll(/\]\(([^\s)]+)\)/g)].map((link) => link[1])
  const headings = (source: string) => source.replace(/^```[^\n]*\n[\s\S]*?^```/gm, '')
    .match(/^#{1,6} /gm)

  for (const guide of guides) {
    const english = read(`docs/${guide}`)
    const indonesian = read(`docs/id/${guide}`)
    expect(code(indonesian), `${guide}: runnable examples stay aligned`).toEqual(code(english))
    expect(links(indonesian), `${guide}: citations and cross-references stay aligned`).toEqual(links(english))
    expect(headings(indonesian), `${guide}: every section is translated`).toEqual(headings(english))
    expect(indonesian).not.toMatch(/@@CODE|terjemahan menyusul/i)
  }
})
