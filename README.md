![RFAStack architecture guide preview](docs/public/social-preview.png)

# RFAStack

**An Opinionated React Fullstack Architecture for Next.js Applications**

A Next.js application rarely becomes hard to maintain overnight. It happens one reasonable shortcut at a time, until nobody is sure where business logic belongs or what a small change might break. RFAStack gives you an opinionated architecture to follow before the codebase reaches that point.

The guide connects code ownership with the decisions you make across a full-stack application: how reads and mutations run, where access checks belong, and how server and browser caches stay current. Worked examples follow an orders feature through those decisions.

[Read the docs →](https://ishk-sftckz.github.io/RFAStack/background)

## Keep business behavior with its feature

```text
src/
  app/          # Next.js routes and page composition
  features/     # Business capabilities across server and client
  platform/     # Database connections and external integrations
  shared/       # Code with generic behavior across features
```

An `orders` feature owns its UI, schemas, business rules, reads, and mutations. Its public server operations enforce access and return the data callers may receive. Pages, Server Actions, and Route Handlers use those operations through the boundary each caller needs.

Apply the ownership and dependency rules from the first feature. Add abstractions such as repositories when persistence needs to be shared or substituted. When a cancellation rule changes, you should be able to open `features/orders`, find the use case, and follow it to the stored order.

## Start reading

Follow the guides in order, or start with the decision you're working on:

| Guide | What it helps you decide |
| --- | --- |
| [Background & Motivation](https://ishk-sftckz.github.io/RFAStack/background) | Which recurring architecture decisions need a shared default before implementations drift. |
| [Concepts](https://ishk-sftckz.github.io/RFAStack/concepts) | How feature ownership, public interfaces, and dependency direction shape the application. |
| [Folder Structure](https://ishk-sftckz.github.io/RFAStack/folder-structure) | Where files belong, what callers may import, and when to introduce another module. |
| [Data Fetching & Mutation](https://ishk-sftckz.github.io/RFAStack/data-fetching-and-mutation) | How to choose consistent data paths and when TanStack Query or oRPC fits that strategy. |
| [Protected Resources](https://ishk-sftckz.github.io/RFAStack/protected-resources) | Where to verify sessions, enforce resource access, and limit the data returned to callers. |
| [Caching](https://ishk-sftckz.github.io/RFAStack/caching) | How Next.js caches interact, where cache policy belongs, and what to invalidate after a write. |

## Work on the documentation

This repository contains the guides and their VitePress site. Use Bun 1.4.0 to install dependencies and start the development server:

```bash
bun install --frozen-lockfile
bun run docs:dev
```

Edit guide content in `docs/*.md` and the site theme in `docs/.vitepress/theme/`. Follow [VOICE.md](VOICE.md) for public-facing copy.

| Command | Purpose |
| --- | --- |
| `bun run docs:build` | Build the documentation site. |
| `bun run docs:preview` | Preview an existing build locally. |
| `bun run test` | Run publication, navigation, interaction, and accessibility checks. |

Playwright builds and serves the site automatically for tests. To run only the route and interaction checks, use `bun run test -- tests/site.spec.ts`.

## Contributing

Corrections and clearer examples are welcome. For a substantial architectural or editorial change, open an issue describing the failure mode, your proposed change, and its tradeoffs. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Site source code is licensed under the [MIT License](LICENSE-CODE). Original writing, documentation examples, diagrams, and visual assets are licensed under [Creative Commons Attribution 4.0 International](LICENSE-CONTENT), with attribution to **RFAStack by Ishk**. See [LICENSE.md](LICENSE.md) for the boundaries when reusing material.
