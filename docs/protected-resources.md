---
title: Protected Resources
description: Where to verify sessions, enforce resource access, and return safe data in a Next.js application.
---

# Protected Resources

Protecting resources is a core responsibility when building a full-stack Next.js application. You must control who can access private data and who can perform operations that change it. Those access controls need to be part of the application’s architecture from the start.

Use multiple layers of protection to secure those resources. We recommend Proxy for early route checks and login redirects, a shared identity helper for session verification, and a Data Access Layer (DAL) for enforcing access to data and operations. Each layer has a responsibility, and together they protect the different paths through the application.

Enforce authentication and authorization inside the feature operations that read or change protected resources. A page-level check does not protect its Server Actions, which can receive requests independently of the page. [Next.js data security](https://nextjs.org/docs/app/guides/data-security#authentication-and-authorization)

## Give each protection layer a clear responsibility

Authentication establishes who is making a request. Authorization decides what that caller may access or change. A valid login does not grant access to every order. [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

For an order cancellation, several decisions happen along the way:

| Layer | Responsibility |
| --- | --- |
| Proxy | Redirect visitors who do not meet the initial session check. |
| Identity feature | Validate the session and establish the account the caller may act through. |
| Orders feature | Verify access to the requested order and enforce cancellation rules. |
| UI | Show the available controls and explain the result. |

Each layer has different information. Proxy can decide whether to redirect a visitor, while the orders feature can check who owns an order and whether it has already shipped.

Keep those decisions with the code that owns them. The orders feature must enforce its rules even when a request reaches it without an earlier route check.

## Use Proxy for early redirects

Next.js 16 renamed Middleware to Proxy. Its `matcher` configuration determines which request paths run through it. [Next.js Proxy reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

We recommend Proxy for authenticated application areas. It gives you one place to direct signed-out visitors to login before rendering those routes. Next.js treats this layer as optional and recommends lightweight checks because Proxy can also run for prefetched routes. [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication#optimistic-checks-with-proxy-optional)

Keep resource-specific decisions in the feature operation. Checking order ownership in Proxy would tie the rule to URL matching and repeat it for every transport that exposes the same operation.

When you add a protected route, include it in the route policy. Also verify that its underlying operations reject unauthorized access independently.

A static private document needs separate attention: access must be enforced where the document is served. An application query cannot protect a file that users can retrieve directly from a public URL. [OWASP guidance on static resources](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#enforce-authorization-checks-on-static-resources)

## Put data protection in the feature’s server operations

A Data Access Layer, or DAL, controls access to application data. Next.js recommends that it run on the server, perform authorization checks, and return safe, minimal data transfer objects. It also demonstrates authentication inside a data operation, allowing the calling Server Action to remain thin. [Next.js DAL guidance](https://nextjs.org/docs/app/guides/data-security#data-access-layer)

Keep those responsibilities in the [existing feature structure](./folder-structure#keep-feature-server-operations-in-server):

| Location | Responsibility |
| --- | --- |
| `features/identity/server/` | Verify identity and resolve the caller’s authorized account context. |
| `features/orders/server/order.queries.ts` | Authorize order reads and return the fields the caller may receive. |
| `features/orders/server/cancel-order.use-case.ts` | Authorize cancellation and apply the business rules. |
| `features/orders/server/order.repository.ts` | Encapsulate persistence when a separate repository is useful. |

You do not need a global `dal/` directory to establish this boundary. Keep resource policies with their feature, and share identity verification through the identity feature.

For operations called on behalf of the current signed-in user, obtain the account inside the public protected query or use case. When another page imports that operation, its protection comes with it.

## Make a protected read establish its caller

Consider a query that lists orders. If it trusts a supplied account ID, every caller must know where that ID is allowed to come from. One caller might obtain it from a verified session while another forwards a URL parameter.

The protected operation can remove that choice from its callers:

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
    select: {
      id: true,
      status: true,
      totalInCents: true,
      createdAt: true,
    },
  })

  return rows.map((row) =>
    orderSummarySchema.parse({
      id: row.id,
      status: row.status,
      totalInCents: row.totalInCents,
      createdAt: row.createdAt.toISOString(),
    }),
  )
}
```

This uses the [order summary schema and Prisma-style database client](./data-fetching-and-mutation#read-during-rendering-through-a-server-component) from the data-fetching guide. `requireAccount()` must reject an invalid session and return an account the authenticated caller is allowed to use.

The query scopes the database read to that account and selects the fields it returns. The page only needs to call the operation and render its result:

```tsx
// src/app/(authenticated)/orders/page.tsx
import { listOrders } from '@/features/orders/server/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'

export default async function OrdersPage() {
  const orders = await listOrders()

  return <OrderList orders={orders} />
}
```

For a detail query, the caller still supplies the requested order ID. Validate that input, then look up the order within the authorized account. A correctly formatted ID establishes the input’s shape; the scoped lookup establishes whether this account can access that order.

Some reads also accept an account ID to identify the requested scope, as in the [browser query example](./data-fetching-and-mutation#add-tanstack-query-for-caching-and-background-updates). The protected query must verify that selection against the authenticated account. Including an account ID in a URL or cache key does not grant access to it.

## Authorize mutations against the current resource

A cancellation request supplies an order ID. The cancellation use case must establish the caller, find the order within that caller’s authorized account, and check its current status before updating it.

The UI may use the same pure cancellation rule to decide whether to display a button. The use case applies the rule again to stored data because the order may have changed since the page rendered.

Keep ownership and eligibility constraints in the write where the database supports them. The [cancellation example](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order) includes the account and the checked status in its update condition, so an order that changes concurrently is not cancelled using an outdated decision.

A Server Action, Route Handler, or RPC procedure can call this protected use case. Each adapter handles its transport: parsing submitted input, adapting failures, and refreshing the UI or returning a response.

The shared operation should report an authentication failure in a form its callers can adapt. A page may redirect to login; an API should return an appropriate error response.

## Reuse verification without relying on a layout

Calling the same identity helper from several protected operations keeps the authentication rule in one place. The maintenance problem starts when each operation implements its own version of session verification.

During Server Component rendering, React `cache()` can share repeated verification work. Its cache is reset across server requests, and callers outside React’s cache context do not receive the same memoization behavior. [React cache](https://react.dev/reference/react/cache)

Layout checks serve a different purpose. Layouts do not re-render on every navigation, and hiding their children does not prevent every nested route segment from executing. Keep resource checks close to data access even when the layout also uses session information. [Next.js layout authentication guidance](https://nextjs.org/docs/app/guides/authentication#layouts-and-auth-checks)

If an operation also needs background-job or alternative-credential callers, define an explicit trusted actor context for that implementation. Each entry point must establish the actor and its permissions. Keep the business rules independent of browser cookies.

## Keep Better Auth behind the identity boundary

Better Auth can implement session verification while feature operations depend on the application’s identity helper.

Given a configured Better Auth instance named `auth`, the server-side session lookup is:

```ts
import { headers } from 'next/headers'

const session = await auth.api.getSession({
  headers: await headers(),
})
```

This snippet shows the session lookup inside the identity integration. Reject a missing session before resolving the application’s account context.

Better Auth documents this API for Server Components and Server Actions. Its `getSessionCookie()` helper checks cookie presence only, so use that helper for optimistic redirects and validate the session before granting access to protected resources. [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next)

The identity helper must then resolve the application’s account context. Better Auth’s `Account` record represents a linked authentication method; it does not automatically represent your application’s customer account or tenant. [Better Auth database schema](https://better-auth.com/docs/concepts/database#account)

Choose session caching deliberately. With Better Auth’s cookie cache enabled, a revoked session may continue to be accepted until the cached data expires. Operations that require a current check against session storage can bypass that cookie cache with `disableCookieCache`. [Better Auth session management](https://better-auth.com/docs/concepts/session-management)

Keep that session policy in the identity integration. When an order’s access rule changes, the implementation should remain in the orders feature.

Next: [choose cache boundaries and refresh affected data](./caching).
