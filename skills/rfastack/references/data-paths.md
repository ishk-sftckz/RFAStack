# Choose the data path from the caller

Keep a consistent project strategy for comparable operations. Choose Next.js native reads and Server Actions when rendering and forms cover the interaction. Add TanStack Query when browser consumers need shared cached results, polling, background updates, or coordinated request state. Choose the API client to match the backend: Eden Fetch provides typed HTTP requests for Elysia; oRPC fits shared procedures, common middleware, and generated query options. Project size alone does not justify either library.

| Caller and need | Execution path |
| --- | --- |
| Server Component renders application-owned data | Call the feature's public server query directly. |
| Client Component needs initial data | Pass a serializable DTO from the server. Use a promise with `use()` and Suspense when streaming benefits the screen. |
| Deep client descendants share loaded data | Feature context; keep unsaved changes in draft state. |
| Browser requests additional data | Feature HTTP/RPC request; use the project's query library when selected. |
| Next.js form submits a mutation under the native strategy | Feature Server Action → protected feature use case. |
| Browser submits a mutation under an HTTP/RPC strategy | Feature request/procedure → protected use case on the backend owning the operation. |
| Mobile app, integration, or webhook invokes application behavior | HTTP/RPC adapter → protected feature query or use case, with consumer-appropriate authentication. |
| Interaction changes only unsaved UI state | Component state, or existing client state coordination when needed. |

Server Components call queries near the consumer. Start independent reads together; use a smaller async component with Suspense when a slow read should not hold up surrounding UI. Keep self-HTTP requests out of the server rendering path: they add a round trip and depend on the application's HTTP server being available. Use HTTP for a separate backend or an actual HTTP consumer. Independent reads belong in queries or browser endpoints; Server Actions serve UI mutations. [Next.js Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)

## Keep adapters thin

Actions parse form input, call a use case, adapt expected errors, and refresh the UI. Route Handlers and RPC procedures adapt their request and response contracts. Use cases own authentication/authorization through public access operations, business decisions, and effects. Keep route refresh and transport error types outside pure rules.

Treat validation failures, denied access, and rejected state changes as deliberate response paths. Render pending and expected-error feedback in the UI; select safe HTTP statuses or RPC errors for API consumers. An adapter's checks supplement the protected operation's own checks.

If an existing backend owns the mutation, call its supported API from `<entity>.api.ts`; keep its authoritative business rules on that backend. A request requiring private credentials runs in server-only feature code using a platform client. Client validation provides feedback and leaves server validation intact.

For every private read or business mutation, also read [resource protection](resource-protection.md). For a cached read or a mutation that affects cached values, read [caching](caching.md).

## TanStack Query

Keep HTTP request functions in `<entity>.api.ts`; check response status and parse external response data. Export query-options factories with the key, request function, and shared freshness policy. Prefer consuming these options directly over hooks that only wrap `useQuery` or `useMutation`. Extract mutation options when consumers share configuration.

Include the selected account, resource IDs, and relevant filters in query identity. The server verifies the selected account independently. A context provider shares data but supplies no refetch or invalidation mechanism by itself.

When hydrating, create a request-scoped server `QueryClient`, call the protected feature query directly, and populate the exact key the browser will use. Keep the authorized DTO shape identical for server seeding and browser refetch. Shared option modules must be safe in both environments; use their keys without executing a browser HTTP link on the server. Choose one owner for a displayed value or explicitly refresh each copy. [TanStack advanced server rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

## Elysia and Eden Fetch

When the backend uses Elysia, Eden Fetch can infer request and response types from its exported app type. Use `import type` for the API dependency; keep server implementations out of the frontend runtime. Put shared browser-safe schemas in a workspace package when both applications need runtime validation. Keep business operations inside backend features and query keys and invalidation in the frontend's query options. [Eden Fetch](https://elysiajs.com/eden/fetch)

The HTTP example uses `apps/web`, `apps/api`, and `packages/contracts` under Bun workspaces and Turborepo. Browser requests pass through Next.js handlers that preserve the Elysia success response and invalidate server caches after mutations. Server reads call Elysia directly. When adding an endpoint, align both HTTP adapters; a type imported from Elysia cannot verify a separately implemented Next.js response. Test their status and body contracts together.

## oRPC

Keep procedures in `<entity>.rpc.ts`, app router assembly and HTTP mounting in `app`, generic transport in `platform/rpc/client.ts`, and the feature-typed client in `<entity>.rpc-client.ts`. A type-only procedure import can supply client typing without bundling its implementation; keep runtime server imports out of that client.

Use generated query or mutation options directly when sufficient. Add an options factory for a shared policy; add an API wrapper only when it contributes behavior. Preserve the application's actual endpoint and base path.

Cross-feature server business calls still use public queries and use cases. If a server caller specifically needs procedure middleware, invoke it locally through oRPC's `call` or `createRouterClient` with authenticated request context. [oRPC server-side clients](https://orpc.dev/docs/client/server-side)

Generated options do not identify every read affected by a mutation. Select invalidation keys explicitly. When migrating manual keys to generated keys, migrate prefetching, cache writes, and invalidation together.

RFAStack source: [data fetching and mutation](https://github.com/ishk-sftckz/RFAStack/blob/main/docs/data-fetching-and-mutation.md). Worked applications: [Next.js native](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/next-native), [HTTP backend](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-http), [oRPC](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-orpc). Consult an example only when its transport matches the task; its demo providers and business rules are not defaults for the target application.
