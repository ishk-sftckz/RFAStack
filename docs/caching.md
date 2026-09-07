---
title: Caching
description: Understand Next.js cache lifetimes, choose feature caching boundaries, and refresh server and browser data after a write.
---

# Caching

Caching is one of the harder parts of building a Next.js application. A single screen can depend on several caches, each with different rules for rendering, navigation, and mutations. The challenge is understanding how those rules interact well enough to decide where caching belongs in your application.

The Next.js documentation can be difficult to follow when you're trying to connect those pieces. This page explains the mechanisms together, then shows how to choose cache boundaries and handle invalidation across your features. You should be able to use Next.js caching for its performance benefits and explain why your implementation behaves the way it does.

## Know which caching model your project uses

Next.js documents [Cache Components](https://nextjs.org/docs/app/getting-started/caching) and the [previous caching model](https://nextjs.org/docs/app/guides/caching-without-cache-components) separately. Check `next.config.ts` before applying a caching example:

| Configuration | How you express caching |
| --- | --- |
| Cache Components disabled | Use `fetch` cache options, `unstable_cache` for other server reads, and the previous route rendering controls. |
| `cacheComponents: true` | Use `'use cache'` on an async function or component, assign a lifetime, and compose cached content with work that runs at request time. |

Cache Components changes rendering as well as caching. Enabling it requires reviewing existing route configuration and where request-dependent work runs. Its runtime requirement is Node.js. Follow the [migration guide](https://nextjs.org/docs/app/guides/migrating-to-cache-components) when changing an existing application.

React request memoization and TanStack Query also have their own lifetimes. Choosing a Next.js caching model does not turn every cache in the application into the same store.

## Identify what is being reused

| Mechanism | Stored result | Reuse boundary |
| --- | --- | --- |
| Request memoization | A repeated server read or function result | One React server render/request context. |
| Data Cache, in the previous model | Opted-in `fetch` responses or `unstable_cache` results | Across server requests, subject to revalidation and the configured storage. |
| Full Route Cache, in the previous model | Prerendered HTML and React Server Component payload | Across requests for a statically rendered route. |
| Client Router Cache | Route payloads from navigation and prefetching | The current browser session, with reuse depending on navigation and freshness rules. |
| Cache Components | Output of an async function or component marked with `'use cache'` | Cached scopes with explicit lifetimes; runtime storage depends on the cache handler. |
| TanStack Query | Results indexed by application query keys | The owning `QueryClient`, usually in the browser after hydration. |

The React Server Component payload, or RSC payload, describes the server-rendered component result that Next.js uses to assemble and update the UI. A cached query result and a cached route payload can represent the same underlying order at different points in time. The following sections explain which operation refreshes each one.

## Reuse repeated reads within a server render

Keep caching opt-in. Add React's `cache()` when several Server Components need the same read during one render. Choose `'use cache'` separately when a result can be reused across requests and you have defined its acceptable age and invalidation rules.

| Decision | React cache() | Next.js 'use cache' |
| --- | --- | --- |
| What work should be reused? | Repeated calls with matching arguments during one server render. | A function's data or a component's output across requests, where cache storage permits. |
| What happens on a new server request? | The function runs again when called. | A valid cached result can be reused. |
| What controls freshness? | The request boundary. | `cacheLife` and invalidation after changes. |

These are separate mechanisms. React describes [request memoization](https://react.dev/reference/react/cache); Next.js describes [cached scopes and storage](https://nextjs.org/docs/app/api-reference/directives/use-cache).

In the native example, `OrderDetails` and `OrderTotal` both call `getOrder(orderId)`. They share one order read during the render. `listCachedOrders(scopeId)` uses `'use cache'` because the account page accepts a briefly outdated list, with invalidation after writes. Returning one order or a collection does not determine which cache to use.

For repeated component reads, export one shared memoized query:

```ts
// src/features/orders/order.queries.ts
import { cache } from 'react'

export const getOrderDetailsForRender = cache(
  (accountId: string, orderId: string) =>
    getOrderDetails({ accountId, orderId }),
)
```

Add this alongside the protected `getOrderDetails` query from the [data-fetching guide](./data-fetching-and-mutation#fetch-where-a-server-component-needs-the-data). Every caller imports the same exported function. Primitive account and order IDs allow equivalent calls to match without sharing an input object.

Repeated calls reuse the first result even if the database changes during the render. Errors are reused too: if `getOrder('123')` fails, another matching call rethrows that error instead of retrying. Object arguments match by identity: two newly created `{ orderId: '123' }` objects miss the cache. React clears these entries between requests; ordinary Route Handler calls are outside its cache context. [React cache reference](https://react.dev/reference/react/cache)

Caching adds storage and lookup work. A read called once gains no deduplication benefit, so avoid wrapping every query by default. Keep mutations and reads that must execute afresh outside this memoized path.

Matching `fetch` GET requests are memoized automatically during server rendering. This is separate from opting into storage across requests. Passing an `AbortController` signal opts out of that automatic memoization; Route Handlers are outside the React component tree. [Next.js fetch memoization](https://nextjs.org/docs/app/api-reference/functions/fetch#memoization)

Use this mechanism when the problem is repeated work during one render. It does not need a tag to invalidate on the next request.

Once repeated reads justify memoization, choose where the wrapper belongs. A separate render wrapper is useful when the underlying operation also has callers that supply their own request context. If it only serves rendering, wrap the query directly. The native example's memoized `getOrder(orderId)` supplies current headers to a private read protected by `withMembership`. Both components import the same `getOrder` function, so they share its membership check and order result during the render.

## Understand data and route caching without Cache Components

### The Data Cache reuses opted-in server reads

With Cache Components disabled, a server `fetch` can opt into caching through `cache: 'force-cache'`. `next.revalidate` gives it a revalidation interval, and `next.tags` labels the result for invalidation after a write. For a database query or SDK call, `unstable_cache` provides caching across requests. [Previous-model caching guide](https://nextjs.org/docs/app/guides/caching-without-cache-components)

The `unstable_cache` key includes the function and its arguments; `keyParts` supplies additional identity, such as values captured by a closure. Its tags group entries for invalidation and do not distinguish their contents. Its Data Cache can persist across deployments, subject to the backing storage. [unstable_cache reference](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)

Server `fetch` is not cached in the Data Cache by default. However, a route that can be prerendered may still read data at build time and reuse the rendered output. An uncached data request and a fresh page render on every visit are separate decisions. Explicit `cache: 'no-store'` requests fetch on each request in this model. [Next.js fetch defaults](https://nextjs.org/docs/app/api-reference/functions/fetch#optionscache)

### The Full Route Cache reuses the rendered page

A statically rendered route reuses its generated output. Some routes are generated at build time; others can be generated on the first visit. Incremental Static Regeneration, or ISR, regenerates that output after it becomes stale. It is request-driven: reaching a revalidation interval does not schedule a background job by itself. [Next.js ISR guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration)

Request-time APIs such as `cookies()` or `headers()` make the route depend on an incoming request. Under the previous model, that opts the route into dynamic rendering. Individual reads can still be cached where their own configuration allows it. `dynamic = 'force-dynamic'` goes further by forcing request-time rendering and uncached fetches throughout the route. [Previous-model route controls](https://nextjs.org/docs/app/guides/caching-without-cache-components#route-segment-config)

Revalidating data used by a prerendered route also requires regenerating the affected output. Rebuilding the application replaces its generated route output. Keep the distinction between that output and any persistent data store when planning deployments. [Next.js self-hosting and caching](https://nextjs.org/docs/app/guides/self-hosting#caching-and-isr)

## Cache Components gives reusable work its own boundary

Enable Cache Components in the Next.js application's configuration:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

Use `'use cache'` inside an async function to cache its returned data, or inside an async component to cache its output. Keep the directive at the smallest scope whose entire result can share the same freshness policy. The cache key includes serialized arguments, captured values, and function and build identity. [use cache reference](https://nextjs.org/docs/app/api-reference/directives/use-cache)

Next.js can prerender static content and eligible cached work into a shell. Request-dependent work can stream into that shell behind `Suspense`. The boundary supplies loading UI; wrapping synchronous content in `Suspense` does not make that content dynamic. [Next.js prerendering](https://nextjs.org/docs/app/getting-started/caching#prerendering)

### Give the cached result a lifetime and a tag

`cacheLife` controls when the result needs refreshing. Its three properties use seconds:

| Property | Meaning |
| --- | --- |
| `stale` | How long the client router can reuse the result before checking the server. |
| `revalidate` | Age after which a server request can receive the cached result while a refresh runs in the background. |
| `expire` | Age after which a server request must wait for a fresh result. Must exceed `revalidate`. |

For example, `cacheLife({ stale: 30, revalidate: 60, expire: 300 })` permits client reuse for 30 seconds, background server refresh after 60 seconds, and blocking refresh after five minutes without regeneration. These are illustrative values; choose them from the result's acceptable age. They do not poll an open tab. The client router enforces a minimum 30-second window for time-based expiration. [cacheLife reference](https://nextjs.org/docs/app/api-reference/functions/cacheLife)

`cacheTag` gives related entries a label so a write can invalidate them together. A tag such as `orders:account-123` can group that account's order reads. Arguments distinguish cache entries; tags identify groups to invalidate. [cacheTag reference](https://nextjs.org/docs/app/api-reference/functions/cacheTag)

### Match the storage to the deployment

Ordinary `'use cache'` uses memory for runtime entries by default. Reuse across requests depends on an instance retaining that memory; serverless instances may not. Build-time prerendering still benefits from cached work. [Runtime caching considerations](https://nextjs.org/docs/app/api-reference/directives/use-cache#runtime-caching-considerations)

`'use cache: remote'` uses a configured remote handler when runtime results need shared storage across instances. That adds a cache network request and storage costs, so assess whether a hit saves enough work. Its entries are still scoped by build or deployment identity. [Remote caching reference](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote)

For request-dependent content that should only be reused in browser memory, see the [private caching example](#use-private-caching-for-request-dependent-ui) below.

## Keep protected checks outside shared cached results

A cache hit skips the body of the cached function. If authorization only happens inside that body, the hit also skips the check. Keep the public protected operation responsible for establishing the caller before it reaches cached data.

For an order list whose display can tolerate briefly outdated data, the protected query can resolve the account and call a private cached helper:

```ts
// src/features/orders/order.queries.ts
import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { requireAccount } from '@/features/membership/membership.queries'
import { database } from '@/platform/database/client'
import { orderSummarySchema } from './model/order.schema'

export async function listOrders() {
  const account = await requireAccount()
  return listCachedOrdersForAccount(account.id)
}

async function listCachedOrdersForAccount(accountId: string) {
  'use cache'
  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag(`orders:${accountId}`)

  const rows = await database.order.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, totalInCents: true, createdAt: true },
  })

  return rows.map((row) => orderSummarySchema.parse({
    id: row.id,
    status: row.status,
    totalInCents: row.totalInCents,
    createdAt: row.createdAt.toISOString(),
  }))
}
```

This is a caching variant of the [protected order list](./protected-resources#make-a-protected-read-establish-its-caller), using its existing schema and database client. It assumes all callers authorized for an account may receive the same list. If permissions vary within an account, establish those permissions outside the cached helper and distinguish every visibility scope in its inputs, or leave the read uncached.

Keep the helper unexported. Other features call `listOrders()` and receive its access checks. Next.js documents this pattern of resolving identity in an exported operation before passing an ID into a private cached function. Use stable IDs in keys and tags; keep session tokens and other secrets out of them. [Authentication with Cache Components](https://nextjs.org/docs/app/guides/authentication-with-cache-components#step-4-cache-session-derived-data)

Ordinary `'use cache'` cannot read `cookies()` or `headers()`, including through a nested membership query. Read request information outside its scope. Passing a verified account ID into the helper allows caching for that ID, although the dependency on the current request prevents this personalized result from being part of the shared static shell. [Runtime APIs and caching](https://nextjs.org/docs/app/getting-started/caching#passing-runtime-values-to-cached-functions)

Render the protected read under a boundary that can wait for the account:

```tsx
// src/app/(authenticated)/orders/page.tsx
import { Suspense } from 'react'
import { listOrders } from '@/features/orders/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'

export default function OrdersPage() {
  return (
    <>
      <h1>Orders</h1>
      <Suspense fallback={<p>Loading orders…</p>}>
        <Orders />
      </Suspense>
    </>
  )
}

async function Orders() {
  const orders = await listOrders()
  return <OrderList orders={orders} />
}
```

The heading can render before the account lookup and order list finish. Keep cancellation eligibility and other mutation checks on current stored data inside the [use case](./protected-resources#authorize-mutations-against-the-current-resource). A cached list supplies display data; it cannot establish whether a write is still allowed.

### Combine the caches when the list has repeated render callers

If two Server Components need `listOrders()` during one render, memoize the public query while keeping the private helper's `'use cache'` directive. Replace the exported function above with:

```ts
import { cache } from 'react'

export const listOrders = cache(async () => {
  const account = await requireAccount()
  return listCachedOrdersForAccount(account.id)
})
```

The outer cache shares the account check and list result during that render. On the next request, the query checks access again before consulting the inner cache. Keep authorization outside the helper that reuses data across requests. Next.js shows [authorization memoization during rendering](https://nextjs.org/docs/app/guides/authentication#creating-a-data-access-layer-dal) and [authorization before shared cached reads](https://nextjs.org/docs/app/guides/authentication-with-cache-components#step-4-cache-session-derived-data).

The runnable native example instead accepts `listOrders(requestHeaders)`. If you wrap that signature in `cache()`, both components must pass the same `Headers` instance to share the result. Without the outer wrapper, each call checks membership even when the inner list cache hits. Add the wrapper when repeated callers need that reuse; keep the helper's existing lifetime and invalidation policy.

## Use private caching for request-dependent UI

`'use cache: private'` allows `headers()` and `cookies()` inside its scope. It runs on every server render; results are reused only in browser memory and disappear on reload. Enable `cacheComponents: true` as shown above. [Private caching reference](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)

As an alternative to the shared cached query above, use the [uncached protected `listOrders()`](./protected-resources#make-a-protected-read-establish-its-caller) inside a private component:

```tsx
// src/app/(authenticated)/orders/page.tsx
import { Suspense } from 'react'
import { cacheLife } from 'next/cache'
import { listOrders } from '@/features/orders/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'

export default function OrdersPage() {
  return (
    <Suspense fallback={<p>Loading orders…</p>}>
      <PrivateOrders />
    </Suspense>
  )
}

async function PrivateOrders() {
  'use cache: private'
  cacheLife({ stale: 30 })

  const orders = await listOrders()
  return <OrderList orders={orders} />
}
```

The query still establishes the account and scopes the read. Its membership query may access request headers within this private scope. The illustrative 30-second stale time permits browser reuse; it does not reduce database work on a new server render.

Use this when browser reuse is acceptable and the request-dependent work belongs together. Keep mutation checks on current data, and refresh affected UI after writes or account changes.

## Invalidate the affected result after a successful write

Choose the invalidation behavior from what the caller needs next:

| Operation | Where it runs | What happens next |
| --- | --- | --- |
| `updateTag(tag)` | Server Action only | Expires tagged entries; the next read waits for fresh data. |
| `revalidateTag(tag, 'max')` | Server Action or Route Handler | Marks tagged entries stale; the next read can serve old data while refreshing it. |
| `revalidateTag(tag, { expire: 0 })` | Server Action or Route Handler | Expires the entry so the next read blocks for fresh data. Useful outside an action. |
| `revalidatePath(path)` | Server Action or Route Handler | Revalidates a page or layout path. A handler marks it for the next visit. |
| `router.refresh()` | Client Component | Requests a new server render for the current route; server data caches remain intact. |

Use `updateTag` when a Server Action's next read must show the user's write. A webhook can use `revalidateTag` with the profile that matches its freshness requirement. Revalidation is triggered by subsequent reads, and the single-argument `revalidateTag(tag)` form is deprecated. [updateTag reference](https://nextjs.org/docs/app/api-reference/functions/updateTag), [revalidateTag reference](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

Path invalidation applies to that route's output and data dependencies. A tag names data that may be used across several routes, so invalidating one path does not replace invalidating shared tagged data everywhere. [revalidatePath reference](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)

For the cached order list above, extend the existing Server Action after the use case succeeds:

```ts
// src/features/orders/order.actions.ts
'use server'

import { refresh, updateTag } from 'next/cache'
import { requireAccount } from '@/features/membership/membership.queries'
import { cancelOrderInputSchema } from './model/order.schema'
import { cancelOrderUseCase } from './cancel-order.use-case'

export async function cancelOrder(formData: FormData) {
  const input = cancelOrderInputSchema.parse({
    orderId: formData.get('orderId'),
  })
  const account = await requireAccount()

  await cancelOrderUseCase(input)

  updateTag(`orders:${account.id}`)
  refresh()
}
```

The use case still establishes its caller and enforces the cancellation rule independently. This action reads the account to select the invalidation tag. `updateTag` expires the list; `refresh()` asks Next.js to refresh the client router from the Server Action. [Server Action refresh reference](https://nextjs.org/docs/app/api-reference/functions/refresh)

Keep route refresh behavior in the adapter. Every path that changes the same data must also invalidate its affected entries, including RPC procedures, Route Handlers, and external event handling. An HTTP-based RPC procedure cannot use an action-only API merely because it runs on the server. Use `revalidateTag` there. If several mutation paths share the same invalidation policy, keep that shared policy in the feature's server modules.

This example caches the order list only. If you also cache order details or totals, give those reads appropriate tags and invalidate them after changes that affect them.

## Treat browser navigation and query freshness separately

### The Router Cache reuses route payloads

Next.js keeps visited and prefetched RSC payloads in browser memory. Shared layouts and loading UI can be reused during navigation. Page reuse differs between ordinary navigation, prefetching, and browser back/forward; it is not a promise that every page stays cached until reload. [Next.js Client Cache glossary](https://nextjs.org/docs/app/glossary#client-cache)

Without Cache Components, the default dynamic page stale time is zero, while static or fully prefetched pages have different reuse rules. Shared layout and back/forward reuse still apply. With Cache Components, `cacheLife.stale` participates in client freshness. [Client stale-time configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes), [cacheLife client behavior](https://nextjs.org/docs/app/api-reference/functions/cacheLife#client-cache-behavior)

`router.refresh()` clears the current route's client cache and requests a new RSC payload. If the server read hits an unchanged data cache, the browser can receive the same old value again. [useRouter reference](https://nextjs.org/docs/app/api-reference/functions/use-router)

Server invalidation from a webhook also does not push a new UI into every open browser. The browser needs another request, navigation, polling, or an application subscription to learn about that change.

### TanStack Query owns another copy of the data

TanStack Query indexes results by query key. Its `staleTime` describes freshness, while `gcTime` controls how long inactive queries remain before garbage collection. Becoming stale makes a query eligible for refetch triggers; it does not schedule polling. [TanStack Query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

After a mutation, `queryClient.invalidateQueries()` marks matching queries stale and normally refetches active matches. It does not invalidate the server cache behind the request. If that request reads stale server data, the refreshed client query can receive it again. [TanStack query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)

For a mutation affecting both server-rendered UI and client queries, follow the data through both stores:

```text
Mutation → protected use case → committed database write
         → invalidate affected server entries
         → return success to the browser
         → invalidate or update affected TanStack queries
         → refresh the route if its Server Components also show changed data
```

The [data-fetching guide](./data-fetching-and-mutation#cancel-the-order-and-invalidate-affected-reads) shows query invalidation with oRPC. The transport supplies the operation; the feature still decides which server tags and client query keys changed.

Keep server-side `QueryClient` instances scoped to a request, then hydrate the browser where it needs ongoing query state. A client query refetch does not update a total rendered separately by a Server Component. Choose one owner for each displayed value, or explicitly refresh both. [TanStack server rendering and data ownership](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#data-ownership-and-revalidation)

## Check caching through the application's real request paths

Validate caching with a production build of the consuming Next.js application. Development fetch caching across hot reloads and browser hard-refresh headers can change the behavior you observe. [Next.js fetch troubleshooting](https://nextjs.org/docs/app/api-reference/functions/fetch#troubleshooting)

For a cached feature, exercise these cases:

- Repeat the same read during one render, then from a new request. Check which work executes again.
- Change data through each supported mutation path and verify the affected list, details, and totals.
- Read as two accounts and verify that neither receives the other's data. Repeat after changing permissions.
- Navigate away and back, refresh the route, and refetch the client query. Check each displayed value.
- Run on the intended deployment topology, including multiple instances when applicable. Confirm that cache hits and invalidation reach the stores you expect.

Record the acceptable age and invalidation triggers beside the feature's read. When a new mutation changes the same data, its author should be able to find the affected cache policy in that feature.
