# B2B ordering

Server rendering uses direct feature queries. React Query uses oRPC for interactive reads and
mutations. A typed command-line client calls the same procedures, including their access checks.

## Run the application

Use Bun 1.4.0 and Docker with Compose. Keep Node.js 22 or later installed for the test tools. Run
these commands from this directory:

```bash
cp .env.example .env
bun install --frozen-lockfile
bun run db:up
bun run db:migrate
bun run db:seed
bun run dev
```

Open [the local app](http://localhost:3103). PostgreSQL uses port 5413.

### Sign in with a seeded account

All demo accounts use the password `Demo-password-123!`.

| Email                     | Role     | Access    |
| ------------------------- | -------- | --------- |
| `alice@example.test`      | Buyer    | Company A |
| `approver-a@example.test` | Approver | Company A |
| `bob@example.test`        | Buyer    | Company B |
| `approver-b@example.test` | Approver | Company B |

The environment template contains local demonstration credentials. The seed command adds missing
fixtures without replacing existing changes. `bun run db:reset` clears this example's application
and authentication tables and reseeds them. Run it only against this example's database.

Use the second API consumer while the app is running:

```bash
bun run client
bun run client submit notebook-a
DEMO_EMAIL=bob@example.test COMPANY_ID=company-b bun run client
```

The CLI defaults to Alice's seeded credentials. Set `DEMO_EMAIL`, `DEMO_PASSWORD`, and `COMPANY_ID`
to select another account. It creates a session, calls the typed API, and signs out. An approver can
list orders but cannot submit them; a buyer cannot approve them.

Company A and company B have separate catalog entries. The server calculates totals using the
caller's company prices. Approval updates require the stored status to remain `submitted`, so two
decisions cannot both succeed.

## Run Next.js with Bun

The Next.js CLI runs on Bun for development, builds, and production. The package scripts use
`bun --bun next`, following the [Bun Next.js guide](https://bun.com/guides/ecosystem/nextjs). The
`--bun` flag selects Bun even though the CLI has a Node.js shebang.

Next.js is pinned to 16.3.4, with App Router, TypeScript, and Cache Components enabled. See the
[Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation) for the
framework setup.

| Command                | What it runs                                         |
| ---------------------- | ---------------------------------------------------- |
| `bun run dev`          | Development server and this example’s local services |
| `bun run build`        | Production build with Bun                            |
| `bun run start`        | Production server and local services after a build   |
| `bun run format`       | Format source, configuration, and Markdown           |
| `bun run format:check` | Check formatting without changing files              |

## Follow feature ownership

The `catalog` feature owns company prices; `orders` owns purchase orders and approval rules;
`checkout` owns draft interaction. Feature RPC exports are assembled by the application router.

```text
src/
  app/       Routes, page composition, and HTTP adapters
  features/  Feature UI, models, protected reads, and operations
  platform/  Database or upstream clients and framework setup
  shared/    Generic code organized by responsibility
```

Generic React components live in `src/shared/ui`; formatting and error helpers live in
`src/shared/utils`:

```text
shared/
  ui/
    QueryProvider.tsx React Query context for child components
  utils/
    currency.ts      Format an amount in cents as USD
    errors.ts        Common error type
```

`QueryProvider` supplies React Query context without feature-specific behavior. Database connections
and HTTP/RPC transport setup stay in `platform`.

Keep business schemas, types, and rules in feature models. Add shared `types`, `validation`, or
`hooks` directories when generic code needs them. Import files directly so each dependency remains
visible.

Queries and use cases are public feature operations. Persistence tables and helpers remain private.
Runtime schemas live in feature models. `bun run check:boundaries` checks dependency direction,
private table imports, and client/server imports; Next.js also checks server-only boundaries during
compilation.

## Trace caching after a write

Shared display caches use `stale: 30`, `revalidate: 60`, and `expire: 300`, in seconds. Authenticate
before entering a shared cached helper, and include the account, warehouse, or company in its
arguments. Display cache entries never authorize a mutation.

Private cached content reads the session inside its scope and uses `stale: 30`. Results live in
browser memory; the function executes on every server render. Reloading the page discards browser
reuse.
[Next.js private caching](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)

Successful application mutations expire affected Next.js tags, invalidate browser query keys where
applicable, and refresh server-rendered values. Logout clears browser state through a full
navigation and clears the React Query client.

Use `CACHE_TRACE=1 bun run start` after a production build to log underlying reads. Logs contain
operation names and scope IDs, never session cookies. Tests additionally set `CACHE_TRACE_FILE` to
observe cache execution without adding diagnostic endpoints to the application.

## Verify behavior

```bash
bun run typecheck
bun run check:boundaries
bun run format:check
bun run test:unit
bunx playwright install chromium
bun run test
```

Database-backed unit tests require migrations and seed data. Playwright migrates, resets the example
database, builds the application, and starts its production services. Do not start another server
before running it. The tests disable authentication rate limiting with the server-only `E2E_TEST=1`
environment flag because the test suite signs in repeatedly from one loopback address.

For a manual production run:

```bash
bun run build
bun run start
```

## Troubleshoot local setup

- **Database connection fails:** check that Docker is running and the PostgreSQL port is available.
- **Login fails after fixture changes:** run `bun run db:reset` against this example’s database.
- **Cache behavior differs in development:** repeat the observation with a production build.
- **You changed the app port:** update the origin configuration and Playwright base URL too.

## Read the architecture guidance

See the [runnable examples guide](https://ishk-sftckz.github.io/RFAStack/examples),
[folder structure](https://ishk-sftckz.github.io/RFAStack/folder-structure), and
[data-fetching guidance](https://ishk-sftckz.github.io/RFAStack/data-fetching-and-mutation).

Executable source is MIT. Prose, documentation snippets, and visual material are CC BY 4.0,
attributed to **RFAStack by Ishk**. See the repository [license boundaries](../../LICENSE.md).
