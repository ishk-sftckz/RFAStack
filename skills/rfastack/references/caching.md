# Define reuse and invalidation together

Inspect the installed Next.js version, `next.config`, and deployment runtime before choosing APIs. Preserve the application's caching model. Enabling Cache Components changes rendering behavior and needs its own migration decision.

For each affected cached read, identify the stored result, its authorized visibility scope, acceptable age, key inputs, and all mutations that change it. Identify whether the visible value is owned by server rendering, a browser query, or both.

| Mechanism | Use and boundary |
| --- | --- |
| React `cache()` | Repeated work in one React server request context. Share the same memoized function and stable arguments. Ordinary Route Handler calls do not receive this React-context reuse. |
| Server Data Cache without Cache Components | Explicit `fetch` cache options or `unstable_cache` for non-fetch reads. Use the installed version's semantics. |
| Full Route Cache without Cache Components | Prerendered output; distinguish it from the underlying data cache. |
| Cache Components | Eligible async function/component output under `'use cache'`, with a defined lifetime and deployment-appropriate storage. |
| Browser Router Cache | Navigation and prefetched route payloads. |
| TanStack Query | Results owned by a `QueryClient` and indexed by query keys. |

React memoization is request-scoped; it is not persistent server storage. An uncached fetch also does not by itself prove that every visit renders fresh output. [React cache](https://react.dev/reference/react/cache), [Next.js caching without Cache Components](https://nextjs.org/docs/app/guides/caching-without-cache-components)

## Scope protected cached results

Use the public protected query to verify access, then call a private cached helper with the authorized scope. Account ID alone suffices only if every authorized caller in that account may see the same result. Include additional visibility dimensions where permissions differ. Keep secrets out of keys and tags.

Read request APIs outside ordinary `'use cache'` and pass verified values into the helper. Keep authorization outside the shared cached body so a hit does not skip it. [Next.js authentication with Cache Components](https://nextjs.org/docs/app/guides/authentication-with-cache-components)

Arguments distinguish cached results; tags group results for invalidation. Check the deployment's configured cache handler when reuse or invalidation must span instances. Use `'use cache: remote'` or `'use cache: private'` only when supported by the installed version and their storage behavior fits the requirement. Consult the [remote](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote) or [private](https://nextjs.org/docs/app/api-reference/directives/use-cache-private) directive reference when choosing either.

## Refresh every affected copy after a successful write

| Need | Applicable mechanism, subject to installed version |
| --- | --- |
| A Server Action must read its own write from tagged data | `updateTag(tag)` expires tagged entries; it is Server Action only. |
| A handler, webhook, or HTTP RPC mutation permits stale data during refresh | `revalidateTag(tag, 'max')`. |
| A handler or HTTP RPC mutation needs the next tagged read to wait for fresh data | `revalidateTag(tag, { expire: 0 })`. |
| Invalidate route output and its data dependencies | `revalidatePath(path)`; identify shared tagged data separately. |
| Request the current UI's new server render | Server Action `refresh()` or client `router.refresh()`; invalidate stale server data separately. |
| Update TanStack-owned data | Update or invalidate affected query keys; invalidate any server cache behind those reads separately. |

Verify these contracts when changing invalidation: [updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag), [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag), [revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath), [router.refresh](https://nextjs.org/docs/app/api-reference/functions/use-router#userouter), [TanStack invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation).

Keep route refresh in the adapter. When actions, RPC procedures, or handlers share a mutation, make server invalidation reachable from every write path; a shared feature server policy can own it. An HTTP RPC handler cannot use an action-only API merely because it runs on the server.

Invalidate affected lists, details, and aggregates. A webhook's server invalidation does not push new data into an already open browser; choose polling, another request, or a subscription if the screen must learn about it.

TanStack `staleTime` sets freshness and `gcTime` controls inactive retention. Staleness alone does not schedule polling. On account changes or sign-out, prevent reuse of the previous actor's visible data through scoped keys and the application's cache reset policy. [TanStack defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

## Verify through real request paths

Use a production build of the consuming application. Exercise reads from different requests, every changed mutation transport, account or permission changes, navigation, and browser query refetch where present. Check which work runs again and whether lists, details, and totals show the intended result. For shared storage, verify the intended deployment topology.

RFAStack source: [caching](https://github.com/ishk-sftckz/RFAStack/blob/main/docs/caching.md).
