# Query options and feature file responsibilities

Research date: 2026-09-05. Discussion notes; no architecture migration approved.

## Recommendation for RFAStack

Keep TanStack Query optional. When a feature uses it, prefer an exported options factory in `order.query-options.ts` as the reusable definition. Components call `useQuery(orderDetailsOptions(id))`; add a custom hook when it contributes React-specific behavior. A hook that only wraps the options is optional convenience.

This does not replace `order.queries.ts`. In the current guide that file exports direct server reads, not React hooks. Explain that distinction before introducing another file. Consider `order.actions.ts` as an explicit name for Next.js Server Actions, with `order.mutation-options.ts` reserved for optional TanStack configuration. These filenames are proposed RFAStack conventions, not framework requirements.

| File | Proposed responsibility |
| --- | --- |
| `order.queries.ts` | Public server-only reads used by Server Components and server adapters. A small feature can implement them here. |
| `server/get-order-details.query.ts` | Optional extracted implementation when the public query module becomes large. |
| `order.query-options.ts` | Query key, browser-safe request function, and shared cache policy for TanStack consumers. |
| `order.actions.ts` | Server Action boundary: authenticate, validate input, invoke the use case, return a UI result or revalidate. |
| `order.mutation-options.ts` | Optional reusable TanStack mutation configuration. |
| `ui/useOrderDetails.ts` | Optional React behavior composed around query options, such as local interaction state. |

The current public-query alias just gives an implementation another exported name. It neither invokes the query nor creates a network endpoint. Its benefit is a stable import path while implementation files move. Show the direct implementation first; introduce the extra file only as a growth example.

## Verified behavior

- `queryOptions` keeps a query key, function, and options together while preserving TypeScript inference. It returns its input at runtime; it does not fetch data. TanStack demonstrates the result with hooks and imperative cache operations, and supports overriding options at the consumer. [Query options](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)
- `mutationOptions` similarly extracts typed mutation configuration. Official examples reuse it with `useMutation`, `useIsMutating`, and `queryClient.isMutating`. This is useful for sharing configuration; it is not a server use case or a query prefetch mechanism. [Typing mutation options](https://tanstack.com/query/latest/docs/framework/react/typescript#typing-mutation-options)
- A Next.js module marked `server-only` causes a build error if imported into Client Components. A shared options file must not import the database implementation. [Preventing environment poisoning](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)
- Server Components should read directly from the data source. Calling the application's own Route Handler adds HTTP overhead and can fail during build-time prerendering. Server-side fetch also needs an absolute URL. Server Actions are intended for mutations, and queued calls make them unsuitable for independent query fetching. [Backend for Frontend caveats](https://nextjs.org/docs/app/guides/backend-for-frontend#caveats)
- Server Components can prefetch into a QueryClient, then pass dehydrated state into a HydrationBoundary. Keep server QueryClients isolated per request; React `cache` can scope a shared server factory to that request. A positive stale time can prevent immediate browser refetch. Client refetches do not automatically update separately rendered Server Component values. TanStack recommends starting with framework fetching and adding Query only when needed. [Advanced server rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- Cache identity comes from the query key. Include variables that change the data being requested. [Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)

## What reuse across server and browser means

There are two reasonable arrangements:

1. Share the complete options factory when its request function works in both environments, such as an appropriately configured external API or RPC client.
2. Share the key and policy, but let server prefetch supply a direct server query function while the browser uses HTTP or RPC.

The second arrangement is a design recommendation inferred from the documented options, cache identity, hydration, and Next.js direct-source boundaries above. It is not presented as a verbatim framework recipe. The server and browser paths must produce the same authorized DTO for that cache identity. Putting an account identifier in a key does not perform authorization. Do not cache raw database rows under a key whose browser request returns a narrower DTO.

An options factory does not make a relative browser fetch portable to server rendering. For a same-application `/api/orders/...` request, prefer the direct server function during prefetch. Keep shared options free of `'use client'` when Server Components need to call the factory, and keep server-only imports outside its dependency graph.

Mutation reuse has a different purpose: share the operation and cache-update behavior across UI callers. On the server, call the action or use case appropriate to that caller rather than introducing TanStack mutation options merely for symmetry. Keep per-screen navigation and notifications close to the component; a hook remains useful when those behaviors must be composed with React state.

## Publication detail

The live TanStack `/latest` and `/v5` routes inspected today display `queryClient.query` in examples while still showing a v5 label. Older indexed examples show `prefetchQuery`. The dedicated `mutationOptions` reference redirects, but the current TypeScript page documents the helper. Before publishing runnable prefetch code, choose and verify the exact TanStack release; this discussion can explain the options and hydration responsibilities without committing to that method spelling.
