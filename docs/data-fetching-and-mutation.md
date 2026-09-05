---
title: Data Fetching & Mutation
description: A decision model for reads, mutations, execution location, and consumers in a Next.js application.
---

# Data Fetching & Mutation

Next.js shows you how to [fetch data](https://nextjs.org/docs/app/getting-started/fetching-data) and [handle mutations](https://nextjs.org/docs/app/getting-started/mutating-data). Real applications still need different strategies for loading a page, keeping order status fresh, or accepting cancellations from a mobile app. As the project grows, you need a clear strategy for making those decisions consistently across features.

## Choose a project-wide data strategy

When each feature chooses its own request client and cache rules, developers have to relearn how data moves whenever they work on another feature. Choose a default strategy for the project and use it consistently for comparable operations.

| Strategy | Choose it when | Typical application | Additional work |
| --- | --- | --- | --- |
| **Next.js native** | Server-rendered reads and form submissions cover most interactions. | A content site, customer portal, or internal tool with straightforward forms. | Define feature queries, Server Actions, and any required HTTP endpoints. |
| **Next.js + React Query** | Browser views need shared cached data, polling, background refresh, or optimistic updates. | An operations dashboard or interactive workspace using an existing HTTP API. | Maintain query keys, cache updates, and the request functions that call the API. |
| **Next.js + React Query + oRPC** | You control the API and want typed operations shared across features or application clients. | A product with web and mobile clients using the same business operations. | Maintain procedure contracts, request context, transport setup, and client cache rules. |

Choose from the application’s requirements and existing backend. A large project can use Next.js native APIs successfully. Frequent browser updates or a shared API are more useful reasons to introduce additional tools than project size alone.

React Query manages cached server data and request state for client consumers. oRPC provides typed operations and integrates with React Query’s options. Both can work alongside Next.js server rendering. [TanStack server-rendering guide](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr), [oRPC integration](https://orpc.dev/docs/integrations/tanstack-query)

## Apply the strategy consistently

Choosing the libraries is only part of the decision. Also establish how the project handles server reads, browser requests, mutations, and updates after a successful write.

For example, a project choosing **React Query + oRPC** could follow these rules:

| Operation | Project default |
| --- | --- |
| Read data during server rendering | Call the feature’s server query directly. |
| Read data that needs ongoing browser updates | Use React Query with oRPC query options. |
| Submit an application mutation from the browser | Use React Query with oRPC mutation options. The procedure calls the feature use case. |
| Update the browser after a mutation | Invalidate or update the affected client queries. Revalidate cached server data separately when affected. |
| Receive a webhook | Use a Route Handler that validates the request and calls the feature operation. |

These rules give each execution path a defined responsibility. Contributors can follow the same approach when adding another feature.

Use the [operation matrix](#choose-the-default-that-matches-the-caller) within the chosen strategy. When new requirements justify another library or transport, update the project’s strategy and document where the new approach applies.

## Choose the data path from the operation

Before adding a query or mutation, answer three questions:

1. **What does it do?** A read retrieves data. A mutation changes application state or triggers an effect.
2. **Who calls it?** A Server Component, browser code, or another client such as a mobile app or external integration?
3. **What does the caller need afterward?** One result, a refreshed page, or data that stays updated through polling, background refresh, or a shared client cache?

Changing a filter, page number, or search parameter usually selects different data to read. Classify the operation by what it does to application state. Opening a menu or changing an unsaved form field can stay in component state.

## Read during rendering through a Server Component

Call the feature query directly from the Server Component. Fetching through this application’s own Route Handler adds an HTTP round trip and can fail during build-time prerendering. [Next.js Backend for Frontend guide](https://nextjs.org/docs/app/guides/backend-for-frontend#server-components)

Server Components support asynchronous reads through `fetch`, an ORM, or a database client. [Next.js data-fetching guide](https://nextjs.org/docs/app/getting-started/fetching-data)

Use Zod for runtime schemas and validation. Define the fields this example’s UI may receive in the feature’s schema file, alongside any existing input schemas:

```ts
// src/features/orders/model/order.schema.ts
import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'shipped',
  'cancelled',
])

export const orderSummarySchema = z.object({
  id: z.string().min(1),
  status: orderStatusSchema,
  totalInCents: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
})

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type OrderSummary = z.infer<typeof orderSummarySchema>
```

This extends the schema file from the [folder structure example](./folder-structure#use-zod-schemas-and-infer-their-types); keep its existing `orderStatusSchema` definition when adding `orderSummarySchema`. Zod checks values at runtime and infers the corresponding TypeScript type. [Zod basics](https://zod.dev/basics)

The query scopes the database read to the account and maps its records into that schema:

```ts
// src/features/orders/server/order.queries.ts
import 'server-only'
import { requireAccount } from '@/features/identity/server/identity.queries'
import { database } from '@/platform/database/client'
import { orderSummarySchema } from '../model/order.schema'

export async function listOrders() {
  const account = await requireAccount()
  const rows = await database.order.findMany({
    where: { accountId: account.id },
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

```tsx
// src/app/(authenticated)/orders/page.tsx
import { listOrders } from '@/features/orders/server/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'

export default async function OrdersPage() {
  const orders = await listOrders()

  return <OrderList orders={orders} />
}
```

The call goes directly from the page to the feature:

```text
Server Component → feature query → database or external service
```

The page handles rendering. The feature decides which orders the account can see and which fields to return. When another route needs the same read, it imports the query directly from `server/order.queries.ts`.

The result is a data transfer object, or DTO: the fields the UI needs and the caller is allowed to receive. The query selects those fields explicitly and converts the database date to an ISO string. The examples use a Prisma-style client supplied by `platform/database/client`.

This query selects and maps the result itself. When several reads share that mapping or it needs a separate module for clarity, [extract a `toOrderSummary` mapper](#extract-a-dto-mapper-when-reads-share-the-conversion) into `server/order.dto.ts`. The returned fields must be safe for the caller in either arrangement. The Zod schema and inferred type stay in `model/`, where browser code can use them without importing the server mapper.

`requireAccount` is the identity feature’s public server operation for verifying the session and resolving an account the caller may use. The query calls it internally, so each caller receives the same protection. A validated ID alone does not authorize a read. The [protected-resources guide](./protected-resources) explains where those checks belong.

Keep database credentials and query implementation in server-only code. React’s [Server Components reference](https://react.dev/reference/rsc/server-components) explains how server execution keeps those dependencies outside the client bundle. Parse data from external services with a Zod schema before relying on its shape.

### Verify the requested account in a detail read

The detail examples also identify an account so browser cache entries remain separate. Treat that ID as a requested scope and verify it inside the query. Define the input alongside the existing schemas:

```ts
// src/features/orders/model/order.schema.ts
export const orderReferenceInputSchema = z.object({
  accountId: z.string().min(1),
  orderId: z.string().min(1),
})

export type OrderReferenceInput = z.infer<typeof orderReferenceInputSchema>
```

Add the detail read to the same server query module. Keep the imports and `listOrders` implementation above, and add these schema imports:

```ts
// src/features/orders/server/order.queries.ts
import { orderReferenceInputSchema } from '../model/order.schema'
import type { OrderReferenceInput } from '../model/order.schema'

export async function getOrderDetails(input: OrderReferenceInput) {
  const account = await requireAccount()
  const { accountId, orderId } = orderReferenceInputSchema.parse(input)

  if (accountId !== account.id) throw new Error('Access denied')

  const row = await database.order.findFirst({
    where: { id: orderId, accountId: account.id },
    select: { id: true, status: true, totalInCents: true, createdAt: true },
  })

  if (!row) throw new Error('Order not found')

  return orderSummarySchema.parse({
    id: row.id,
    status: row.status,
    totalInCents: row.totalInCents,
    createdAt: row.createdAt.toISOString(),
  })
}
```

This example serves one authorized account context per request. The identity feature decides how that context is selected and verified. A page, HTTP handler, or RPC procedure can call this query; none can grant access by supplying a different account ID. Adapt expected failures to the response each caller needs.

### Extract a DTO mapper when reads share the conversion

A separate `order.dto.ts` file is optional. Keep a short mapping inside its query until sharing it or separating the conversion makes the code clearer. The list and detail reads above return the same fields and convert the same database date, so they can share one mapper:

```ts
// src/features/orders/server/order.dto.ts
import 'server-only'
import { orderSummarySchema, type OrderSummary } from '../model/order.schema'

export function toOrderSummary(row: {
  id: string
  status: string
  totalInCents: number
  createdAt: Date
}): OrderSummary {
  return orderSummarySchema.parse({
    id: row.id,
    status: row.status,
    totalInCents: row.totalInCents,
    createdAt: row.createdAt.toISOString(),
  })
}
```

The parameter describes the selected database fields, including its `Date` value. The returned DTO follows `orderSummarySchema`, with `createdAt` converted to a string. Keep that schema and its inferred `OrderSummary` type in `model/` so Client Components can use the data contract without importing the server mapper.

In `order.queries.ts`, replace the direct `orderSummarySchema` import with `toOrderSummary`. The list read becomes:

```ts
// src/features/orders/server/order.queries.ts
import 'server-only'
import { requireAccount } from '@/features/identity/server/identity.queries'
import { database } from '@/platform/database/client'
import { toOrderSummary } from './order.dto'

export async function listOrders() {
  const account = await requireAccount()
  const rows = await database.order.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, totalInCents: true, createdAt: true },
  })

  return rows.map(toOrderSummary)
}
```

Keep the detail read and its input-schema imports in the same query module. After its existing account check, scoped database read, and missing-order check, replace the inline mapping with:

```ts
return toOrderSummary(row)
```

The queries still verify access and select the allowed fields. The mapper only converts and validates those fields; it does not load data or authorize the caller. Keep it private to the feature. Routes, RPC procedures, and other features continue calling the public queries.

### Start independent reads together

Independent protected queries can start together and each verify the caller internally. Awaiting one before starting the other makes the second read wait unnecessarily.

```tsx
export default async function DashboardPage() {
  const ordersPromise = listRecentOrders()
  const balancePromise = getAccountBalance()

  const [orders, balance] = await Promise.all([
    ordersPromise,
    balancePromise,
  ])

  return <Dashboard orders={orders} balance={balance} />
}
```

If one read is slow and the surrounding page is useful without it, move that read into a smaller async Server Component behind `<Suspense>`. The rest of the page can appear while that component waits for its data. [Next.js streaming guide](https://nextjs.org/docs/app/getting-started/fetching-data#streaming)

## Pass server data into client interaction

A Client Component does not need to refetch data merely because it is interactive. Pass a serializable DTO from the Server Component:

```tsx
// Server Component
const order = await getOrderDetails({ accountId: account.id, orderId })
return <OrderEditor initialOrder={order} />
```

Here, the server obtains `account` from the authenticated request. This fits an editor that loads an order and lets the user change fields locally before saving. Add browser fetching when the editor also needs fresh server data while it stays open.

You can also pass a promise to a Client Component and read it with React’s [`use` API](https://react.dev/reference/react/use). A Suspense boundary shows the fallback while the promise resolves:

```tsx
// Server Component
import { Suspense } from 'react'
import { listOrders } from '@/features/orders/server/order.queries'
import { InteractiveOrderList } from '@/features/orders/ui/InteractiveOrderList'
import { OrderListSkeleton } from '@/features/orders/ui/OrderListSkeleton'

export function OrdersPanel() {
  const orders = listOrders()

  return (
    <Suspense fallback={<OrderListSkeleton />}>
      <InteractiveOrderList orders={orders} />
    </Suspense>
  )
}
```

The query obtains and verifies the account itself; the panel only passes its promise to the client component.

```tsx
// src/features/orders/ui/InteractiveOrderList.tsx
'use client'

import { use } from 'react'
import type { OrderSummary } from '../model/order.schema'
import { OrderTable } from './OrderTable'

export function InteractiveOrderList({
  orders,
}: {
  orders: Promise<OrderSummary[]>
}) {
  const items = use(orders)
  return <OrderTable items={items} />
}
```

Await the data and pass a serializable prop by default. Pass a promise when showing the surrounding UI earlier helps the user, and choose a fallback that makes sense for the waiting component.

## Share data with deeply nested components

An orders page fetches an order and passes it through a panel, tabs, and a toolbar before it reaches the status badge. Those intermediate components now accept an `order` prop they never use.

Keep server fetching as the default for rendering data. Choose how to share the result based on which components consume it and whether they need updates after the page loads.

### Fetch where a Server Component needs the data

A nested Server Component can call the feature query directly. The page does not have to load every result for the tree.

When several Server Components need the same database read, export a shared query wrapped in React’s `cache()`:

```ts
// src/features/orders/server/order.queries.ts
import 'server-only'
import { cache } from 'react'

// Keep the existing query implementation and authorization scope.
export const getOrderDetailsForRender = cache(
  (accountId: string, orderId: string) =>
    getOrderDetails({ accountId, orderId }),
)
```

Each Server Component imports the same exported function. Calls with the same account and order IDs reuse the result within the server request. Passing primitive IDs also avoids cache misses caused by creating a new input object for each call. React clears this memoization between server requests. [React `cache` reference](https://react.dev/reference/react/cache)

The component supplies the order ID and requested account scope. The underlying query verifies that scope against the authenticated account. Memoization does not replace authorization.

### Use context when client descendants share server-provided data

An order editor may need the initial order in several tabs and controls. If those components share the loaded result without independently refreshing it, provide the DTO through a feature-scoped context.

```tsx
// src/features/orders/ui/OrderProvider.tsx
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { OrderSummary } from '../model/order.schema'

const OrderContext = createContext<OrderSummary | null>(null)

export function OrderProvider({
  order,
  children,
}: {
  order: OrderSummary
  children: ReactNode
}) {
  return (
    <OrderContext.Provider value={order}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  const order = useContext(OrderContext)

  if (order === null) {
    throw new Error('useOrder must be used within OrderProvider')
  }

  return order
}
```

The Server Component passes the authorized result into the provider:

```tsx
const order = await getOrderDetails({
  accountId: account.id,
  orderId,
})

return (
  <OrderProvider order={order}>
    <OrderEditor />
  </OrderProvider>
)
```

A deeply nested Client Component reads the value directly:

```tsx
// src/features/orders/ui/OrderStatusBadge.tsx
'use client'

import { useOrder } from './OrderProvider'

export function OrderStatusBadge() {
  const order = useOrder()
  return <span>{order.status}</span>
}
```

Place the provider around the subtree that needs the order. Client descendants can consume its context. Server Components passed as children can remain Server Components, but they cannot read that context. [Next.js context providers](https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers)

This provider exposes the order supplied by the server. Keep unsaved form changes in the editor’s draft state. Context itself does not refetch the order or invalidate stale data after a mutation.

When streaming improves the screen, the provider can instead receive a server-created promise. Client consumers read the promise with React’s `use()` under a Suspense boundary. Next.js documents this variation for sharing server data across a client subtree. [Next.js promise-through-context example](https://nextjs.org/docs/app/guides/single-page-applications#using-reacts-use-within-a-context-provider)

### Use TanStack Query when client consumers need ongoing updates

An order’s status badge, details panel, and cancellation control may all need fresh data after cancellation. Use TanStack Query when several client views must share server data and keep it updated.

Each consumer reads the same query through the same QueryClient. After a successful mutation, update or invalidate the affected queries. Use oRPC when you want typed procedures and generated query and mutation options for those calls. [oRPC TanStack Query integration](https://orpc.dev/docs/integrations/tanstack-query)

The initial read can still happen in a Server Component. Populate the query cache on the server and hydrate it around the client subtree, as shown in the [prefetching example](#prefetch-when-the-client-needs-the-same-data-afterward) later in this guide:

```text
Server Component → feature query → hydrated query cache
                                      ↓
                          nested client consumers
                                      ↓
                         mutation → invalidate query
```

Let those client consumers render the values that TanStack Query keeps updated. A browser refetch does not update a separate copy rendered by a Server Component. Keep server QueryClients scoped to a request and configure `staleTime` according to how fresh the data needs to be. [TanStack server rendering and data ownership](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#data-ownership-and-revalidation)

For an interactive dashboard, prefer TanStack Query for browser data that changes through filtering, polling, or mutations. We recommend oRPC for a new shared typed API. An existing HTTP API can supply the same query cache.

## Fetch from the browser when the interaction needs it

Some screens need more data after the initial render:

- Search results change as the user types.
- Order status refreshes while the page stays open.
- Infinite scrolling loads another batch.
- Pagination updates the list without navigation.
- A request depends on input from a browser API.
- Several mounted views use the same cached data.

Browser code reaches server data through HTTP or RPC. Use a Route Handler, an external API, or an RPC client for those requests.

A one-off request can use `fetch` directly. Add a query library when you need to coordinate caching, retries, background refresh, or requests shared by several components.

### Let Route Handlers adapt HTTP to feature queries

[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) use the standard Web `Request` and `Response` APIs. Put the handler in `app` and call the feature query from it:

```ts
// src/app/api/orders/route.ts
import { listOrders } from '@/features/orders/server/order.queries'

export async function GET() {
  const orders = await listOrders()

  return Response.json(orders)
}
```

The handler handles the HTTP request and response. The query verifies the session, scopes the read to the authorized account, and returns the order summaries. This snippet shows the successful path; translate authentication failures into an appropriate HTTP error response.

If you add pagination, extend the query with validated pagination input. Let the handler read query-string values and translate them into that input.

Route Handlers also fit webhooks, mobile clients, external integrations, and responses such as files or feeds. Keep each handler focused on translating its request into a feature operation and returning the appropriate response.

## Call an existing API for mutations

An existing backend may already expose order cancellation through HTTP or RPC. If it supports authenticated browser calls, put that request in `order.api.ts`. This is an alternative to submitting through a Next.js Server Action.

The cancellation input belongs to the feature’s schema file:

```ts
// src/features/orders/model/order.schema.ts
export const cancelOrderInputSchema = z.object({
  orderId: z.string().min(1),
})

export type CancelOrderInput = z.infer<typeof cancelOrderInputSchema>
```

Add this to the schema file above, which already imports Zod. The request function parses the input and sends it to the API:

```ts
// src/features/orders/order.api.ts
import {
  cancelOrderInputSchema,
  type CancelOrderInput,
} from './model/order.schema'

export async function cancelOrder(input: CancelOrderInput) {
  const body = cancelOrderInputSchema.parse(input)
  const response = await fetch(
    'https://api.example.com/orders/cancel',
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    throw new Error('Unable to cancel order')
  }
}
```

This example assumes the API uses a browser session cookie, allows credentialed requests from the frontend through CORS, and returns `204 No Content` on success. The API still authenticates the caller, validates input, and enforces ownership and cancellation rules. Client-side parsing provides early feedback. [MDN: sending credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)

A component can call the function directly and use React state for request feedback:

```tsx
// src/features/orders/ui/CancelOrderButton.tsx
'use client'

import { useState } from 'react'
import { cancelOrder } from '../order.api'

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<
    'idle' | 'pending' | 'success' | 'error'
  >('idle')

  async function handleCancel() {
    setStatus('pending')

    try {
      await cancelOrder({ orderId })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return <p role="status">Order cancelled.</p>
  }

  return (
    <>
      <button
        type="button"
        disabled={status === 'pending'}
        onClick={handleCancel}
      >
        {status === 'pending' ? 'Cancelling…' : 'Cancel order'}
      </button>

      {status === 'error' && (
        <p role="alert">Unable to cancel order.</p>
      )}
    </>
  )
}
```

[`useState`](https://react.dev/reference/react/useState) tracks the feedback in this component. After success, update or refetch any other order data displayed by the parent view. This path needs neither an actions file nor TanStack Query. If the feature later uses TanStack, its [mutation options](#share-mutation-configuration-when-several-consumers-need-it) can call the same `cancelOrder` function.

If the external API requires a private key, keep that request on the server and expose the operation through a Server Action or Route Handler. The API’s credential requirements determine where the request can run. [Next.js server and client responsibilities](https://nextjs.org/docs/app/getting-started/server-and-client-components#when-to-use-server-and-client-components)

## Use Server Actions for UI mutations handled by Next.js

A cancellation form may instead submit to this Next.js application, which checks whether the account can cancel the order and updates the screen. Use a Server Action for this path.

Here, “Server Action” means the Next.js mechanism for invoking a React Server Function from an action or transition, such as a form submission. Use `.actions.ts` specifically for those functions. [Next.js mutation guide](https://nextjs.org/docs/app/getting-started/mutating-data)

The action uses the same cancellation input schema to parse the form submission before calling the use case. Cancellation’s ownership checks, eligibility rule, and update belong in that use case from the first implementation:

```ts
// src/features/orders/server/order.actions.ts
'use server'

import { refresh } from 'next/cache'
import { cancelOrderInputSchema } from '../model/order.schema'
import { cancelOrderUseCase } from './cancel-order.use-case'

export async function cancelOrder(formData: FormData) {
  const input = cancelOrderInputSchema.parse({
    orderId: formData.get('orderId'),
  })

  await cancelOrderUseCase(input)

  refresh()
}
```

```tsx
// src/features/orders/ui/CancelOrderForm.tsx
import { canCancelOrder } from '../model/order-cancellation'
import type { OrderStatus } from '../model/order.schema'
import { cancelOrder } from '../server/order.actions'

export function CancelOrderForm({
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus
}) {
  if (!canCancelOrder(status)) return null

  return (
    <form action={cancelOrder}>
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit">Cancel order</button>
    </form>
  )
}
```

The details view supplies the form’s order ID and displayed status. `canCancelOrder` is the shared pure rule from the [model example](./folder-structure#extract-business-behavior-when-it-needs-its-own-module). Hiding the control does not authorize a request: the action parses the submitted ID, while `cancelOrderUseCase` verifies the caller, validates its input, and checks ownership and cancellation eligibility against the current stored order. The [cancellation walkthrough](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order) shows those checks and an update that rejects a concurrent status change.

A form rendered in a Server Component can submit before JavaScript loads or when JavaScript is disabled. A Client Component can import an action from a dedicated `'use server'` file when it needs pending feedback, optimistic state, or event-handler invocation. [Next.js Server Function examples](https://nextjs.org/docs/app/getting-started/mutating-data#server-components)

### Update the screen after the mutation succeeds

The example calls [`refresh()`](https://nextjs.org/docs/app/api-reference/functions/refresh) after cancellation succeeds. This refreshes the client router so the page can render the updated result from the direct database query.

If you cache the order query, also revalidate the affected cached data. Refreshing the page alone does not invalidate tagged data. Choose the revalidation behavior that matches how you cached the read. [Next.js mutation guide](https://nextjs.org/docs/app/getting-started/mutating-data#refresh-data)

The example shows a successful submission. For expected failures, such as invalid input or an order that can no longer be cancelled, return a result the form can display. Adapt the action for `useActionState` to show that message and pending feedback beside the control. [Next.js error-handling guide](https://nextjs.org/docs/app/getting-started/error-handling#server-functions)

### Check access inside every Server Action

Server Functions are reachable through direct POST requests. A caller can submit a request without using the rendered form. [Next.js mutation guide](https://nextjs.org/docs/app/getting-started/mutating-data#what-are-server-functions)

Every action must enforce these checks during its execution, directly or through the protected operation it calls:

1. Authenticate callers when the operation requires an account.
2. Authorize the operation against the target resource.
3. Validate untrusted input with Zod.
4. Return only data safe for that caller.
5. Keep secrets and server implementation in server-only modules.

Treat the hidden `orderId` field as user input. Check ownership and cancellation rules on the server, even when the UI only shows the button for orders that appear eligible.

### Keep independent reads out of Server Actions

Server Functions can return data, but Server Actions are designed for mutations from the UI. Next.js queues action calls, so using them to fetch independent data introduces sequential execution. [Next.js Backend for Frontend guide](https://nextjs.org/docs/app/guides/backend-for-frontend#server-actions)

Read through feature queries during server rendering. Use HTTP or RPC when browser code needs to request data.

## Use Route Handlers for mutations consumed through an API

A mobile app or external integration needs an endpoint with a defined request and response. The Route Handler validates its input with Zod and imports the public protected use case directly from the orders feature. The use case verifies the caller internally:

```ts
// src/app/api/orders/[orderId]/cancel/route.ts
import { cancelOrderInputSchema } from '@/features/orders/model/order.schema'
import { cancelOrderUseCase } from '@/features/orders/server/cancel-order.use-case'

export async function POST(
  _request: Request,
  context: RouteContext<'/api/orders/[orderId]/cancel'>,
) {
  const { orderId } = await context.params
  const input = cancelOrderInputSchema.parse({ orderId })

  await cancelOrderUseCase(input)

  return new Response(null, { status: 204 })
}
```

The action and handler both call `cancelOrderUseCase`, so they enforce the same ownership and cancellation rules. Each entry handles the response its caller needs: the action refreshes the page, while the handler returns an HTTP response.

The use case is a public server operation implemented in `server/cancel-order.use-case.ts` and protected with `import 'server-only'`. It needs no forwarding file at the feature root. The folder contains public operations alongside private repositories and internal mappers; the [public-import rules](./folder-structure#expose-the-operations-and-components-callers-need) define which exports callers may use.

This example shows the successful response. Translate validation failures, denied access, and rejected cancellations into deliberate HTTP status codes and safe response bodies. Use authentication appropriate to the API consumer; the example assumes the caller uses the application’s account session.

## Add TanStack Query for caching and background updates

If an order screen needs to refetch in the background, retry failed requests, or share data with other mounted views, use [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview). It tracks request status and cached server data in the browser.

For a browser read through this application’s HTTP API, keep the request in `order.api.ts`:

```ts
// src/features/orders/order.api.ts
import { orderSummarySchema } from './model/order.schema'

export async function getOrderDetails(
  input: { accountId: string; orderId: string },
  signal?: AbortSignal,
) {
  const accountId = encodeURIComponent(input.accountId)
  const orderId = encodeURIComponent(input.orderId)
  const response = await fetch(
    `/api/accounts/${accountId}/orders/${orderId}`,
    { signal },
  )

  if (!response.ok) throw new Error('Unable to load order')
  return orderSummarySchema.parse(await response.json())
}
```

Related API requests can share this file. Export the TanStack definition from `order.query-options.ts`; its [`queryOptions` helper](https://tanstack.com/query/latest/docs/framework/react/guides/query-options) keeps the key, request function, and cache policy together with type inference:

```ts
// src/features/orders/order.query-options.ts
import { queryOptions } from '@tanstack/react-query'
import { getOrderDetails } from './order.api'

export function orderDetailsOptions(input: {
  accountId: string
  orderId: string
}) {
  return queryOptions({
    queryKey: ['orders', input.accountId, 'details', input.orderId],
    queryFn: ({ signal }) => getOrderDetails(input, signal),
    staleTime: 60_000,
  })
}
```

This detail view displays the four fields in `OrderSummary`. The example assumes an HTTP endpoint at `/api/accounts/[accountId]/orders/[orderId]`. Its handler passes the requested account and order IDs to the protected `getOrderDetails` query and adapts the response. The query verifies the session, rejects an account mismatch, scopes the read to both IDs, and returns the same DTO.

The account ID distinguishes cache entries; it does not grant access. Include inputs that change the result in the [query key](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys). Clear account data when ending a session, and scope the application’s client cache appropriately when switching accounts.

The component consumes the options directly:

```tsx
// src/features/orders/ui/LiveOrderDetails.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { orderDetailsOptions } from '../order.query-options'
import { OrderDetails } from './OrderDetails'

export function LiveOrderDetails(input: {
  accountId: string
  orderId: string
}) {
  const order = useQuery(orderDetailsOptions(input))

  if (order.isPending) return <p role="status">Loading order…</p>
  if (order.isError) return <p role="alert">Unable to load order.</p>
  return <OrderDetails order={order.data} />
}
```

This assumes a `QueryClientProvider` is configured. Add a custom hook when it coordinates React behavior beyond consuming the query. The options remain available to components, cache operations, and server rendering without calling a hook.

`server/order.queries.ts` executes the direct server read. `order.api.ts` makes the HTTP request. `order.query-options.ts` returns configuration; creating the options does not run that request. Keep server-only imports out of the API and options modules, and leave them free of `'use client'` when Server Components need to call the options factory.

### Prefetch when the client needs the same data afterward

An order screen may need data during server rendering and then keep it updated in the browser. Read through the feature’s server query and populate the cache under the key returned by the shared options:

```tsx
// src/app/(authenticated)/orders/[orderId]/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { requireAccount } from '@/features/identity/server/identity.queries'
import { getOrderDetails } from '@/features/orders/server/order.queries'
import { orderDetailsOptions } from '@/features/orders/order.query-options'
import { LiveOrderDetails } from '@/features/orders/ui/LiveOrderDetails'

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const account = await requireAccount()
  const { orderId } = await params
  const input = { accountId: account.id, orderId }
  const queryClient = new QueryClient()
  const order = await getOrderDetails(input)

  queryClient.setQueryData(orderDetailsOptions(input).queryKey, order)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LiveOrderDetails {...input} />
    </HydrationBoundary>
  )
}
```

This is an alternative to the page that renders a DTO directly. It creates a QueryClient for this server render, calls the direct read, and stores the result with [`setQueryData`](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientsetquerydata). `dehydrate` and `HydrationBoundary` transfer that data into the client cache. The application still needs its provider setup. [TanStack advanced server rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

The browser and server share the query identity and result contract. This server example does not execute the options’ relative-URL fetch; it accesses the feature query directly. A complete options factory can also run in both environments when its request function and authentication setup support both. For calls to this application’s own data, keep the direct server path. [Next.js server fetching](https://nextjs.org/docs/app/guides/backend-for-frontend#server-components)

The example’s positive `staleTime` keeps the freshly hydrated data from immediately refetching. Keep server QueryClients scoped to a request. Choose whether each displayed value is owned by the client cache or by Server Components: a client refetch does not update a separately rendered server value. [TanStack data ownership and revalidation](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#data-ownership-and-revalidation)

Start with a Server Component query when the page only needs data for rendering. Add this cache and hydration setup when browser interaction continues using the query after the initial render.

### Share mutation configuration when several consumers need it

A form can call a Server Action directly. When the UI needs TanStack mutation state, its mutation function can call a Server Action, HTTP endpoint, or RPC procedure. Update or invalidate affected client queries after success so mounted views receive the changed data. [TanStack mutation invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)

Keep one consumer’s configuration beside that consumer. When several consumers share the definition, extract an options factory. For the [external API cancellation](#call-an-existing-api-for-mutations), reuse its ordinary request function:

```ts
// src/features/orders/order.mutation-options.ts
import { mutationOptions } from '@tanstack/react-query'
import { cancelOrder } from './order.api'

export function cancelOrderOptions() {
  return mutationOptions({
    mutationKey: ['orders', 'cancel'],
    mutationFn: cancelOrder,
  })
}
```

This factory and the plain React button call the same API request. `useMutation(cancelOrderOptions())` accepts `{ orderId }` when you call `mutate`. In the consuming component, compose an `onSuccess` handler that invalidates the affected account’s order queries. Keep navigation and notifications near the screen that needs them. TanStack’s [mutation-options example](https://tanstack.com/query/latest/docs/framework/react/typescript#typing-mutation-options) shows how the factory can also supply mutation-status consumers.

For a UI that uses a Server Action, `mutationFn` can instead reference the export from `server/order.actions.ts`. The action shown in this guide accepts `FormData`; that becomes the input to `mutate` for that version. Import the dedicated `'use server'` module so Next.js provides the client-callable function. [Next.js Server Functions in Client Components](https://nextjs.org/docs/app/api-reference/directives/use-server#using-server-functions-in-a-client-component)

`order.mutation-options.ts` is optional. Server callers invoke the appropriate feature operation directly; they do not need mutation options to perform the write.

## Add oRPC when callers need a shared typed API

Several interactive views may call the same order operations. You then need to keep request inputs, response types, and error handling consistent across those calls.

We recommend oRPC when you introduce a new shared typed API. Keep the procedures with the feature, expose them through an HTTP adapter, and call them through a typed client. An existing HTTP API can continue supplying TanStack Query without an oRPC migration.

oRPC defines the callable API and carries its input and result types to the client. TanStack Query manages cached results, request state, and refetching. You can call an oRPC client directly for a one-off request or use its [TanStack Query integration](https://orpc.dev/docs/integrations/tanstack-query) when the browser needs that lifecycle.

The order-details read follows this path:

```text
Client Component → TanStack Query → oRPC client → Next.js HTTP adapter
  → order-details procedure → feature query
```

The examples below reuse the order query, cancellation use case, and schemas from this guide. Follow the official [installation guide](https://orpc.dev/docs/getting-started#installation) for the oRPC packages; the application also needs the TanStack Query provider described earlier.

### Adapt order requests to the existing feature operations

Both procedures identify an order within an account. Reuse `orderReferenceInputSchema` from the [detail read](#verify-the-requested-account-in-a-detail-read). The browser supplies `accountId` so the query identity includes the selected account. The server must check that selection against the authenticated request.

Define the procedures beside the server operations they call:

```ts
// src/features/orders/server/order.rpc.ts
import 'server-only'
import { ORPCError, os } from '@orpc/server'
import { requireAccount } from '@/features/identity/server/identity.queries'
import { orderReferenceInputSchema, orderSummarySchema } from '../model/order.schema'
import { getOrderDetails } from './order.queries'
import { cancelOrderUseCase } from './cancel-order.use-case'

const accountOrderProcedure = os
  .input(orderReferenceInputSchema)
  .use(async ({ next }, input) => {
    const account = await requireAccount()

    if (input.accountId !== account.id) {
      throw new ORPCError('FORBIDDEN')
    }

    return next({ context: { account } })
  })

export const orderRouter = {
  details: accountOrderProcedure
    .output(orderSummarySchema)
    .handler(({ input, context }) =>
      getOrderDetails({ accountId: context.account.id, orderId: input.orderId }),
    ),

  cancel: accountOrderProcedure.handler(async ({ input }) => {
    await cancelOrderUseCase({ orderId: input.orderId })
  }),
}
```

The shared procedure validates the input, obtains the account from the request, and rejects a different account ID. Its middleware passes the authenticated account to each handler. [oRPC middleware](https://orpc.dev/docs/middleware#middleware-input)

This example assumes `requireAccount` rejects unauthenticated API calls rather than redirecting to a login page. Adapt authentication failures to an `UNAUTHORIZED` oRPC error at the API boundary. The query and use case verify the account internally as well, so direct server callers receive the same protection. The query scopes the read to the requested account; the use case enforces ownership, cancellation eligibility, and the concurrent-update check from the [cancellation walkthrough](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order).

The read returns the existing `OrderSummary` DTO. Cancellation returns no data. The UI below shows a generic failure message; when it needs specific recovery advice, translate known feature failures into deliberate oRPC errors. Keep error messages and data safe for the caller, and keep oRPC-specific error types out of pure business rules. [oRPC error handling](https://orpc.dev/docs/error-handling)

### Mount the procedures and connect the client

The application assembles the API router from feature exports:

```ts
// src/app/api/rpc/router.ts
import 'server-only'
import { orderRouter } from '@/features/orders/server/order.rpc'

export const router = { orders: orderRouter }
```

Mount it through a catch-all Route Handler so nested procedure paths reach the adapter:

```ts
// src/app/api/rpc/[...rest]/route.ts
import { RPCHandler } from '@orpc/server/fetch'
import { router } from '../router'

const handler = new RPCHandler(router)

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: {},
  })

  return response ?? new Response('Not found', { status: 404 })
}

export { handleRequest as GET, handleRequest as POST }
```

The route adapts HTTP to the assembled router. Order behavior stays in the feature. See the [oRPC Next.js adapter](https://orpc.dev/docs/adapters/next) for transport configuration.

Keep the shared HTTP link in `platform`. It does not import any features:

```ts
// src/platform/rpc/client.ts
import { RPCLink } from '@orpc/client/fetch'

export const rpcLink = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('Use a direct query or local oRPC client on the server')
    }

    return new URL('/api/rpc', window.location.origin).toString()
  },
})
```

This link sends browser requests to the same origin, using the application’s session cookie. The URL matches the handler prefix. An application deployed under a Next.js `basePath` must include that prefix in the browser URL.

The orders feature supplies its own client type and query utilities:

```ts
// src/features/orders/order.client.ts
import { createORPCClient } from '@orpc/client'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { rpcLink } from '@/platform/rpc/client'
import type { orderRouter } from './server/order.rpc'

export const orderClient: RouterClient<{ orders: typeof orderRouter }> =
  createORPCClient(rpcLink)

export const orpc = createTanstackQueryUtils(orderClient)
```

The `orders` key matches the application router. This client knows only the orders procedures. Its server-module import is type-only, so the procedure implementation is absent from the browser bundle. oRPC supports typing a client from its server router. [oRPC client setup](https://orpc.dev/docs/client/client-side#setup)

The files have these responsibilities:

| File | Responsibility |
| --- | --- |
| `features/orders/model/order.schema.ts` | Shared input schemas and DTO schema |
| `features/orders/server/order.rpc.ts` | Procedures that authenticate, validate, and call feature operations |
| `app/api/rpc/router.ts` | Assemble feature procedures into the application API |
| `app/api/rpc/[...rest]/route.ts` | Expose the API through HTTP |
| `platform/rpc/client.ts` | Shared browser transport |
| `features/orders/order.client.ts` | Typed order client and TanStack Query utilities |

Keep shared runtime schemas free of server-only dependencies. Other features call public server queries and use cases directly; repositories and internal mappers remain private. This follows the [folder dependency rules](./folder-structure#keep-feature-server-operations-in-server).

### Read through generated query options

Replace the earlier manual HTTP options factory with the oRPC version. Keep the shared freshness policy in the factory:

```ts
// src/features/orders/order.query-options.ts
import { orpc } from './order.client'
import type { OrderReferenceInput } from './model/order.schema'

export function orderDetailsOptions(input: OrderReferenceInput) {
  return orpc.orders.details.queryOptions({ input, staleTime: 60_000 })
}
```

The existing `LiveOrderDetails` component still calls `useQuery(orderDetailsOptions(input))` and renders its loading, error, and success states. oRPC now supplies the request function and query key. This path needs no `order.api.ts` wrapper.

Keep `order.query-options.ts` when it supplies shared policy or reusable configuration, as the `staleTime` does here. A single consumer can call `orpc.orders.details.queryOptions({ input })` directly. The integration also supplies mutation options and key helpers. [oRPC TanStack Query integration](https://orpc.dev/docs/integrations/tanstack-query)

### Cancel the order and invalidate affected reads

The cancellation control calls the procedure, then invalidates order queries after the write succeeds:

```tsx
// src/features/orders/ui/CancelOrderButton.tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '../order.client'
import type { OrderReferenceInput } from '../model/order.schema'

export function CancelOrderButton(input: OrderReferenceInput) {
  const queryClient = useQueryClient()
  const cancel = useMutation(orpc.orders.cancel.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orpc.orders.key() })
    },
  }))

  return (
    <>
      <button
        type="button"
        disabled={cancel.isPending || cancel.isSuccess}
        onClick={() => cancel.mutate(input)}
      >
        {cancel.isPending ? 'Cancelling…' : 'Cancel order'}
      </button>
      {cancel.isError && <p role="alert">Unable to cancel order.</p>}
      {cancel.isSuccess && <p role="status">Order cancelled.</p>}
    </>
  )
}
```

This replaces the earlier API-based button. Render it for a cancellable order and key it by account and order ID if the surrounding view switches orders without unmounting the control. The use case always checks the current stored status.

`orpc.orders.key()` matches queries beneath the orders router, including the details read and any order-list procedures added there. This deliberately invalidates all cached order queries; active matches refetch. Narrow the selection when the cache grows. Awaiting invalidation keeps the mutation pending while those refetches complete. [TanStack mutation invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)

Generated mutation options do not infer which reads changed. Choose the affected query keys explicitly. oRPC keys also differ from the manual `['orders', ...]` keys used earlier, so migrate prefetching, cache updates, and invalidation together. Plain HTTP queries still using manual keys need their own invalidation.

Keep this one consumer’s mutation configuration beside the control. Extract `order.mutation-options.ts` when several consumers share it. If the write also affects cached server-rendered data, revalidate that cache separately; TanStack invalidation only updates the client query cache.

### Keep server rendering on a direct path

For Server Components, use direct feature queries by default. The [hydration example](#prefetch-when-the-client-needs-the-same-data-afterward) works with the new `orderDetailsOptions`: fetch through `getOrderDetails`, then store the DTO under the generated query key before dehydrating.

Creating query options does not send a request. The browser link resolves its URL only when a procedure is called, so server rendering can use the options’ key without executing browser transport. Keep the client and options modules free of `'use client'` for that use.

When a server caller needs the procedure’s validation and middleware, use oRPC’s `call` or `createRouterClient` to invoke it locally. Supply the authenticated request context required by the procedures. Local calls avoid an HTTP round trip to this application’s API. [oRPC server-side clients](https://orpc.dev/docs/client/server-side)

oRPC adds procedures and transport configuration to maintain. Use it where typed browser calls and shared API behavior justify that setup. A page that only needs a direct server read can keep its feature query.

## Choose the default that matches the caller

Apply the [project’s chosen strategy](#choose-a-project-wide-data-strategy) to each caller. Use the same request and cache conventions for comparable operations across features.

| Situation | Path within the chosen strategy | Supporting behavior |
| --- | --- | --- |
| A Server Component needs data to render | Direct feature query near the consumer | React `cache()` for repeated database reads during the request |
| A Client Component needs initial data | Serializable prop from the server | A promise and `use()` when streaming improves the screen |
| Deep client descendants share the loaded data | Feature-scoped context | Draft state when editing locally |
| Browser code needs a read | The project’s HTTP or RPC client, through TanStack Query when selected for the project | Loading and error feedback |
| Client views need shared data that stays updated | TanStack Query with the project’s HTTP or RPC client | Server fetching and hydration for the initial render |
| A form or control submits a mutation handled by this Next.js application | The project’s chosen Server Action, HTTP, or RPC path calling a feature use case | Pending feedback, expected-error messages, and updates to affected data |
| The UI submits a mutation to an existing HTTP or RPC API | The existing API client, through TanStack Query when selected for the project | Mutation feedback and updates to affected data |
| A mobile app or external integration needs a mutation | The project’s HTTP endpoint or RPC procedure calling a feature use case | Authentication and responses appropriate to the consumer |
| A webhook delivers an event | Route Handler validating the event and calling a feature operation | A response that follows the provider’s webhook protocol |
| An interaction only changes local UI state | Component state | A state library when several parts of the client need to coordinate that state |

Next: [protect reads and mutations at the feature boundary](./protected-resources).
