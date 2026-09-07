# Place code by its business owner

Use these roles when adding or moving modules. The orders filenames illustrate the convention; create only the files the feature needs.

| Path within `features/orders/` | Responsibility and creation condition |
| --- | --- |
| `ui/OrderDetails.tsx` | Feature presentation; component name matches the PascalCase filename. Both Server and Client Components belong in `ui/`. |
| `ui/OrderDetails/useOrderDetails.ts` | React interaction coordinated for that view, when a hook adds behavior. |
| `model/order.schema.ts` | Zod input and DTO schemas with inferred types beside them. |
| `model/order-cancellation.ts` | Pure cancellation rules shared by UI and server, or substantial enough to understand separately. |
| `model/order.types.ts` | Internal types that need a separate module and have no runtime schema. |
| `model/order.constants.ts` | Related fixed business values used by several feature modules. Keep a value beside its only consumer otherwise. |
| `order.queries.ts` | Related public server reads, including access checks and safe result selection. |
| `cancel-order.use-case.ts` | Public business mutation or workflow, including verification, rules, and persistence. |
| `order.actions.ts` | Next.js Server Actions using `'use server'`, only when the UI uses that transport. |
| `order.api.ts` | Browser-safe feature HTTP/RPC request functions; related reads and writes can share it. |
| `order.query-options.ts` | Reusable TanStack query definitions, when using a client query cache. |
| `order.mutation-options.ts` | Shared mutation configuration when multiple consumers need it. |
| `order.rpc.ts` | RPC procedures adapting requests to public feature operations. |
| `order.client.ts` | Feature-typed RPC client and query utilities, when using that integration. |
| `order.repository.ts` | Private persistence shared by operations or substituted in tests. Direct database calls in queries and use cases remain valid. |
| `order.dto.ts` | Private server mapper when conversion is shared or needs separation for clarity. Always select safe fields, including when mapping inline. |
| `order.table.ts` | Feature-owned table declarations, when using schema-as-code persistence. |

## Keep model code independent

Keep pure rules, calculations, constants, and schemas free of Next.js, database, and network dependencies. Share a rule between presentation and the server when both need it; the server applies it to current facts.

Use Zod as the RFAStack default for runtime validation and infer schema-backed types with `z.infer`. Keep an existing validation library when the task does not include replacing it, and record the deviation. A refinement can call a pure rule; perform authorization and database lookups in server operations. [Zod basics](https://zod.dev/basics)

Name extracted behavior after its concern, such as `order-pricing.ts`. Related small functions may stay together. An ORM record describes persistence; define the feature's public contract from the fields callers may receive.

## Expose deliberate imports

Use explicit imports such as `@/features/orders/order.queries` or `@/features/orders/cancel-order.use-case`. A server export is public to other application modules without being a browser endpoint. Keep UI, actions, and server reads in distinct imports so their runtime constraints stay visible.

Mark ordinary Next.js server modules with `import 'server-only'`. Use `'use server'` for action modules and `'use client'` at the smallest useful interactive boundary. Keep browser API, schemas, and shared query options free of server implementation imports. Directory names alone do not establish runtime boundaries. [Next.js server and client boundaries](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)

Keep a feature's repositories and mappers private even when they export functions for use within the feature. App-level RPC assembly may import procedure exports. Auth entry points may mount `auth.provider.ts`; ordinary callers use auth's public queries.

Table declarations may reference another feature's table columns solely for foreign-key declarations. Keep this exception inside the schema relationship, such as a column's `.references()` call. Runtime data access and re-exports through that table import remain outside the public boundary.

## Keep composition with its owner

Route-only presentation belongs in `app/.../_components`. UI that expresses business behavior belongs in its feature even when one route uses it. Shared code must be describable without naming a feature and changeable without changing a feature's business rules. Generic currency formatting can be shared; pricing and tax policy stay in the owning feature.

A workflow such as checkout owns a use case that calls inventory and orders through their public queries and use cases. Each participating feature retains its rules and persistence. Simple composition of feature views stays in a page. Start business coordination with direct typed calls; introduce events when delayed work and independent failure fit the workflow.

Platform configures integration clients and factories. Keep feature-specific requests and persistence in the feature, including when they use those clients. Add a workspace package when multiple applications need a stable reusable contract.

## Name operations by their role

| Prefix | Meaning | Example |
| --- | --- | --- |
| `list` | Collection read; empty is a valid result | `listOrders` |
| `get` | One resource or aggregate; define absence behavior | `getOrderDetails` |
| `fetch` | HTTP/RPC read request | `fetchOrderDetails` |
| `find` | Optional repository lookup | `findOrderForAccount` |
| `require` | Required verified context; fails when unavailable | `requireMembership` |
| Business verb | Mutation | `cancelOrder` / `cancelOrderUseCase` |

Preserve framework special filenames and library-generated method names. Follow an existing consistent read naming convention during a scoped refactor.

RFAStack sources: [folder structure](https://github.com/ishk-sftckz/RFAStack/blob/main/docs/folder-structure.md), [concepts](https://github.com/ishk-sftckz/RFAStack/blob/main/docs/concepts.md).
