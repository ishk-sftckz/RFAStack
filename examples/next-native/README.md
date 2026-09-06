# Customer order portal

Use this example for server-rendered pages and forms. Server Components call feature queries, forms
submit Server Actions, and customers refresh tracking details with a button.

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

Open [the local app](http://localhost:3101). PostgreSQL uses port 5411.

Sign in with one of these demo accounts. The password is `Demo-password-123!`.

| Email                | Role     | Access          |
| -------------------- | -------- | --------------- |
| `alice@example.test` | Customer | Alice’s account |
| `bob@example.test`   | Customer | Bob’s account   |

The seed command adds missing fixtures and preserves your changes. To start over, use
`bun run db:reset`; it clears and reseeds this example's application and authentication tables. Run
it only against this example's database. Credentials in `.env.example` are for local use.

## Place and cancel an order

Sign in as Alice, create an order, then open its details. Cancel it while it is pending and check
that the page updates. Sign in as Bob to see a separate account's orders.

The app starts a carrier simulator on port 4101 that returns a fixed three-day estimate. Purchases
are simulated; no payment is taken.

To follow checkout, open these files in order:

1. `src/features/checkout/checkout.actions.ts` receives the form submission.
2. `src/features/orders/create-order.use-case.ts` reads prices and stores the order.
3. `src/features/orders/order.queries.ts` reads the customer's orders.

Cancellation rules live in `src/features/orders/cancel-order.use-case.ts`. Change the rule there,
then run the checks below.

## Observe cache reads

Server Actions invalidate affected tags after a write and refresh the route. The tracking button
refreshes order details. The details page calls one memoized query from two Server Components.

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
