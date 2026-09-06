# Fulfillment dashboard

Use this example when your browser needs ongoing updates from an HTTP service. React Query polls the
shipment queue; a separate backend checks permissions and stores shipment changes.

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

Open [the local app](http://localhost:3102). PostgreSQL uses port 5412.

Sign in with one of these demo accounts. The password is `Demo-password-123!`.

| Email                     | Role       | Access                          |
| ------------------------- | ---------- | ------------------------------- |
| `north@example.test`      | Operator   | North warehouse                 |
| `south@example.test`      | Operator   | South warehouse                 |
| `supervisor@example.test` | Supervisor | North warehouse; product prices |

The seed command adds missing fixtures and preserves your changes. To start over, use
`bun run db:reset`; it clears and reseeds this example's application and authentication tables. Run
it only against this example's database. Credentials in `.env.example` are for local use.

## Pack, dispatch, and deliver a shipment

Sign in as the north operator, then pack and dispatch `shipment-north`. With the app running,
simulate delivery:

```bash
bun run carrier shipment-north delivery-001
```

Repeat the command to check that the backend ignores a duplicate event. The queue polls every five
seconds. Reload to update the server-rendered summary after delivery.

The backend starts with the app on port 4102. Operators can access their assigned warehouse; the
north supervisor can also edit product prices.

Follow `src/features/fulfillment/fulfillment.api.ts` through the HTTP adapters to
`backend/features/fulfillment`. The frontend owns requests and presentation. The backend owns
warehouse checks, shipment rules, and database access.

## Observe cache reads

UI mutations invalidate affected browser queries and refresh server-rendered values. Carrier events
enter a database outbox, which sends signed cache-invalidation requests to the frontend. Failed
requests stay queued and retry every three seconds, including after a backend restart.

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
