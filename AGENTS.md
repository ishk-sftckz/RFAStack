# Agent Instructions

## Package Manager
- Use Bun 1.4.0: `bun install --frozen-lockfile`.

## Commands
| Task | Command |
|------|---------|
| Run docs locally | `bun run docs:dev` |
| Build docs | `bun run docs:build` |
| Test one file | `bun run test -- tests/site.spec.ts` |
| Test one case | `bun run test -- tests/site.spec.ts -g "test name"` |
| Run all tests | `bun run test` |

Playwright builds and serves the documentation through `playwright.config.ts`; do not start a preview server before tests.

## External References
| Need | File |
|------|------|
| Contribution and editorial rules | `CONTRIBUTING.md` |
| Architecture rationale | `docs/background.md`, `docs/concepts.md` |
| Folder and dependency rules | `docs/folder-structure.md` |
| Data-fetching guidance | `docs/data-fetching-and-mutation.md` |
| Routes, navigation, metadata, and Pages base path | `docs/.vitepress/config.ts` |
| Licensing boundaries | `LICENSE.md` |

## Key Conventions
- Treat `docs/*.md` and `docs/.vitepress/theme/` as source; do not edit generated `docs/.vitepress/dist/` or `docs/.vitepress/cache/` files.
- Preserve the `/RFAStack/` GitHub Pages base path in configuration, assets, internal links, and browser tests.
- When adding or renaming a guide page, update the sidebar, homepage reading path, and Playwright route coverage together.
- Keep the approved tagline exact: “An Opinionated React Fullstack Architecture for Next.js Applications.”
- Follow `CONTRIBUTING.md` terminology and cite primary sources for claims about framework behavior.
- Preserve the MIT boundary for source code and CC BY 4.0 boundary for prose, examples, diagrams, and visual assets.
- Put publication-copy checks in `tests/publication.spec.ts`, route and interaction checks in `tests/site.spec.ts`, and WCAG checks in `tests/accessibility.spec.ts`.
