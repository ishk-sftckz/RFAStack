# RFAStack

**An Opinionated React Fullstack Architecture for Next.js Applications**

RFAStack is a feature-based modular application architecture organized as vertical full-stack slices and adapted to Next.js.

“Stack” is the project name. RFAStack describes an architectural approach—module ownership, dependency direction, framework boundaries, server/client separation, and data flow—not a fixed list of technologies.

[Read the field manual →](https://ishk-sftckz.github.io/RFAStack/)

![RFAStack field manual preview](docs/public/social-preview.png)

## Inside the guide

- **Background & Motivation** — how technical-layer structures scatter one business change.
- **Concepts** — the synthesis of feature modularity, vertical slices, Screaming Architecture, Clean Architecture, and Domain-Driven Design.
- **Folder Structure** — concrete ownership rules for `src/app`, `src/features`, `src/platform`, and `src/shared`.
- **Data Fetching & Mutation** — a decision model for Server Components, Server Actions, Route Handlers, TanStack Query, and oRPC.

## Run locally

The repository pins Bun 1.4.0 through `packageManager` and `bun.lock`.

```bash
bun install --frozen-lockfile
bun run docs:dev
```

Build, preview, and test the publication:

```bash
bun run docs:build
bun run docs:preview
bun run test
```

## Contributing

Corrections, clearer examples, and evidence-backed challenges are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Architectural changes should explain the failure mode they address, the mechanism they introduce, and the tradeoff they create.

## Author

RFAStack is written and maintained by [Ishk](https://github.com/ishk-sftckz).

## License

Source code is licensed under the [MIT License](LICENSE-CODE). Original writing, diagrams, and visual assets are licensed under [Creative Commons Attribution 4.0 International](LICENSE-CONTENT) with the attribution **“RFAStack by Ishk.”** See [LICENSE.md](LICENSE.md) for the repository-wide summary.
