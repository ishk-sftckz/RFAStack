# B2B ordering

Use this example to share a typed API between a browser and a command-line client. React Query calls
oRPC procedures for interactive reads and writes. Server-rendered pages call feature queries
directly.

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

Sign in with one of these demo accounts. The password is `Demo-password-123!`.

| Email                     | Role     | Access    |
| ------------------------- | -------- | --------- |
| `alice@example.test`      | Buyer    | Company A |
| `approver-a@example.test` | Approver | Company A |
| `bob@example.test`        | Buyer    | Company B |
| `approver-b@example.test` | Approver | Company B |

The seed command adds missing fixtures and preserves your changes. To start over, use
`bun run db:reset`; it clears and reseeds this example's application and authentication tables. Run
it only against this example's database. Credentials in `.env.example` are for local use.

## Submit and approve an order

Sign in as Alice and submit an order. Sign out, then sign in as the company A approver to approve or
reject it. Buyers submit orders; approvers decide them. Company B has its own catalog and orders.

You can also use the API from the command line while the app is running:

```bash
bun run client
bun run client submit notebook-a
DEMO_EMAIL=bob@example.test COMPANY_ID=company-b bun run client
```

The CLI signs in as Alice by default and signs out when done. Set `DEMO_EMAIL`, `DEMO_PASSWORD`, and
`COMPANY_ID` to use another account.

To follow an approval, open `src/features/orders/order.rpc.ts`, then
`src/features/orders/decide-order.use-case.ts`. The use case checks company membership, approver
permissions, and order status. Both clients use these checks.

## Observe cache reads

Mutations invalidate affected Next.js tags and browser queries, then refresh server-rendered values.
Logout clears the React Query client and navigates away.

Build and run in production mode to observe caching:

```bash
bun run build
CACHE_TRACE=1 bun run start
```

The logs show underlying reads by operation and scope. Read the
[caching guide](https://ishk-sftckz.github.io/RFAStack/caching) for cache lifetimes and invalidation
rules.

## Run the checks

With the database running, migrated, and seeded:

```bash
bun run typecheck
bun run check:boundaries
bun run format:check
bun run test:unit
bunx playwright install chromium
bun run test
```

Playwright resets this example's database, builds the app, and starts production services. Stop your
development or production server before running it. Tests set `E2E_TEST=1` to disable login rate
limiting for repeated sign-ins.

If the database won't connect, check Docker and the PostgreSQL port. After changing the app port,
update the origin configuration and Playwright base URL. Use `bun run format` to fix formatting.

Executable source is MIT. Prose, documentation snippets, and visual material are CC BY 4.0,
attributed to **RFAStack by Ishk**. See the repository [license boundaries](../../LICENSE.md).
