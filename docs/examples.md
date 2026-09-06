---
title: Runnable Examples
description: Follow three applications from their requirements to feature boundaries, data paths, protection, and caching.
---

# Runnable Examples

A runnable application lets you test an architecture decision through the whole request path. You can change a rule, submit a form, inspect the stored result, and check which screen refreshes afterward.

Start with the example whose requirements match yours. Each application chooses a consistent data strategy and keeps its source, dependencies, database, and tests together.

| Application | Why this strategy fits | Source and setup |
| --- | --- | --- |
| Customer order portal | Server-rendered pages and ordinary forms cover customer orders and preferences. | [Native Next.js](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/next-native) |
| Fulfillment dashboard | Warehouse staff share a polling queue backed by an existing HTTP service. | [React Query + HTTP](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-http) |
| B2B ordering | Buyers, approvers, and a command-line client use the same typed operations. | [React Query + oRPC](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-orpc) |

These are three different products within the ordering domain. The dashboard needs ongoing browser updates. The B2B application owns a shared API. The customer portal uses native Next.js reads, actions, and route refreshes. Use those requirements when choosing a strategy; a larger dependency list does not make an application more complete.

## Run one application independently

Each README provides commands for Bun 1.4.0, Docker Compose, migrations, and seed data. Next.js development, build, and production commands use `bun --bun next`, following the [Bun Next.js guide](https://bun.com/guides/ecosystem/nextjs). Node.js 22 or later is required for the test tools. Install dependencies inside the selected example with `bun install --frozen-lockfile`. The documentation site's root installation does not install the applications.

The databases and ports are separate, so you can run all three locally. Every example supplies real session-based login and two isolated customer, warehouse, or company scopes. Shipping is simulated; no external service credentials or payment setup are required.

## Follow a request through its owning feature

Each Next.js application has `app`, `features`, `platform`, and `shared` under `src`. Route files compose the screen and call public feature operations. Feature code owns the business rule and its persistence queries. Platform code configures the integration.

For the customer portal, follow `checkout.actions.ts` into `create-order.use-case.ts`. The browser supplies product IDs and quantities. The server obtains prices and account ownership, then stores an order with its price snapshots. `cancel-order.use-case.ts` requires the stored order to remain pending when the update executes.

In the fulfillment example, open both the frontend `fulfillment` feature and `backend/features/fulfillment`. The frontend owns query options and presentation. The separate backend verifies the operator's warehouse and applies shipment transitions. The frontend never reads the backend database directly.

For B2B ordering, begin with the feature's `order.rpc.ts` and `decide-order.use-case.ts`. The procedure adapts the API call; the use case verifies company membership, approver permissions, and the current order status. The CLI calls the same API as the browser.

These placements follow the [folder and dependency rules](./folder-structure). The boundary check and production build catch imports that cross private feature or runtime boundaries.

All three examples use `src/shared/utils/currency.ts` to export `formatCurrency(cents)`, which displays an amount as USD. Order totals and purchased price snapshots remain feature responsibilities. Generic React components live in `shared/ui`, including the native app's `ActionForm` and the React Query apps' `QueryProvider`.

## Find the fetching method you want to study

Use this table alongside the [data-fetching operation matrix](./data-fetching-and-mutation#choose-the-default-that-matches-the-caller). Paths below are relative to the indicated example.

| Method | Example and source |
| --- | --- |
| Direct server read and parallel fetching | Customer portal: `src/app/account/page.tsx` and feature queries |
| Repeated reads within a render | Customer portal: `src/features/orders/server/order.queries.ts` and the order details page |
| Serializable server data in client interaction | Customer portal: `src/features/checkout/ui/OrderDraft.tsx` |
| Server promise, Suspense, and React use | Customer portal: delivery queries and `src/features/orders/ui/Tracking.tsx` |
| Feature context for a local draft | Customer portal: `OrderDraft.tsx`; B2B ordering: `PurchaseDraft.tsx` |
| Native route refresh | Customer portal: `src/features/orders/ui/Tracking.tsx` refreshes server-rendered order details |
| Browser HTTP reads | Fulfillment dashboard: `fulfillment.api.ts`, called through React Query options |
| Server Action mutation | Customer portal: feature `.actions.ts` files |
| Existing API reads and mutations | Fulfillment dashboard: `fulfillment.api.ts`, same-origin adapters, and `backend/server.ts` |
| React Query hydration, polling, and shared state | Fulfillment dashboard: account page, query options, and `Dashboard.tsx` |
| Typed RPC queries and mutations | B2B ordering: feature clients, query options, and `.rpc.ts` files |
| A second API consumer | B2B ordering: `scripts/client.ts` |
| Authenticated external events | Fulfillment dashboard: carrier simulator and carrier use case |

Server Components call feature queries directly. The fulfillment queries access a separate upstream API because that service owns the data. They do not make a round trip through the frontend's own Route Handlers. [Next.js server data access](https://nextjs.org/docs/app/guides/backend-for-frontend#server-components)

The React Query applications hydrate a fresh QueryClient for each server render. Browser consumers use the same query identities. The oRPC example obtains these identities from generated query options. [TanStack server rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr), [oRPC query integration](https://orpc.dev/docs/integrations/tanstack-query)

## Check protection before and after a cache hit

Shared display caches authenticate before entering a cached helper. Arguments distinguish the permitted account, warehouse, or company. Authorization and state-transition checks run against current data when a write occurs.

| Application | Shared cache | Private cache |
| --- | --- | --- |
| Customer portal | Public products and account order summaries | Personalized recommendations |
| Fulfillment dashboard | Product references and authorized warehouse summaries | Operator delivery preferences and saved queue filters |
| B2B ordering | Company catalog and order summaries | Buyer preferences and suggested reorders |

Shared caches use `stale: 30`, `revalidate: 60`, and `expire: 300` as demonstration values. Private caches use `stale: 30`. Choose values from your application's acceptable data age when adapting the example.

`'use cache: private'` allows request APIs within the cached scope. It stores results in browser memory and runs on each server render. It does not supply a private server cache. [Next.js private caching](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)

The customer portal's Server Actions invalidate tags after a committed write. HTTP and RPC mutations also update affected browser queries. The fulfillment backend records external invalidation events in a durable outbox, then sends signed requests to the frontend. Events remain queued if that request fails. An external event does not push a new Server Component render into an already open tab.

Run the production browser tests to exercise account isolation, shared-cache reuse, private browser reuse, and session revocation. The customer portal also checks that two components share one memoized detail read within a render and execute it again on a new request.

## Change a rule and verify the result

Try changing cancellation eligibility in the customer portal, adding a warehouse transition in fulfillment, or changing approval permissions in B2B ordering. Keep the rule in its owning feature and run that example's database-backed tests, boundary checks, and production browser tests.

The examples deliberately omit payment processing, public registration, email delivery, and production hosting. Their READMEs document the local fixtures, cache behavior, and commands you need to reproduce the workflows.
