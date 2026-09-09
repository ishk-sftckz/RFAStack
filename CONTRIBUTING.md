# Contributing to RFAStack

We welcome corrections and proposals that make the architecture more precise, useful, and honest about its tradeoffs.

## Before opening a pull request

1. Open an issue for a substantial architectural or editorial change.
2. Describe the concrete failure mode the change addresses.
3. Explain the mechanism, not only the desired conclusion.
4. Include tradeoffs and the conditions where the guidance does not fit.
5. Cite primary sources for claims about framework behavior.
6. Keep examples newly written for RFAStack.

## Local checks

```bash
bun install --frozen-lockfile
bun run docs:build
bun run test
```

Pull requests must preserve the public routes, GitHub Pages base path, accessibility contract, and dual-license boundaries.

## Editorial conventions

- Expand RFA as “React Fullstack Architecture.”
- Use “full-stack application” and “full-stack slice” in ordinary prose.
- Spell the framework name “Next.js.”
- Persuade with failure modes, mechanisms, examples, and tradeoffs.
- Avoid claims of universal superiority.

## Translations

The English guides live in `docs/`; their Indonesian translations live in `docs/id/` with matching filenames. When changing a guide, update its translation in the same pull request. Keep code examples, identifiers, primary-source links, and technical meaning aligned. Translate explanations and diagram labels in the direct voice described in `VOICE.md`; retain framework names and the approved tagline.

Keep explicit section anchors aligned across languages so cross-references and language switching preserve the reader's place. Register new pages in both sidebars, both homepage reading paths, and the route tests. Locale navigation and search labels live in `docs/.vitepress/id.ts`; custom homepage and diagram copy live in the theme components. Follow [VitePress internationalization](https://vitepress.dev/guide/i18n) for locale configuration.

By contributing, you agree that source-code contributions are licensed under MIT and content or visual contributions are licensed under CC BY 4.0 under the repository’s existing terms.
