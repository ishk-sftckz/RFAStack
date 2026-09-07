# Enforce access in public feature operations

Every protected query or use case establishes the caller and enforces access internally, including when called directly by another server module. A route group, hidden control, layout check, or adapter middleware cannot substitute for that boundary. Public operations return safe minimal DTOs. [Next.js data security](https://nextjs.org/docs/app/guides/data-security#data-access-layer)

| Owner | Responsibility |
| --- | --- |
| Proxy, or Middleware on older supported Next.js versions | Lightweight route checks and early redirects. |
| `features/auth` | Sign-in UI, session verification, authentication persistence and provider assembly. |
| `features/membership` | Membership, roles, account-scope resolution and membership preferences. Calls auth's public session query. |
| Resource feature | Access to its records, business eligibility, writes, and safe returned fields. |
| UI | Available controls, pending state, and result feedback. |

Add `user` or `account` features when profiles or business account lifecycle need their own operations. Preserve the application's provider and domain model. A single-user application need not invent a tenant model; still enforce ownership using its verified actor.

## Share membership verification through its public wrapper

When operations share membership verification, `membership.queries.ts` may export `withMembership` beside `requireMembership`. This is a public access API that other features may import directly. Keep it server-only.

The wrapper accepts an operation and returns a function taking request headers followed by the operation's arguments. Verify membership on each invocation before calling the operation with the verified member and remaining arguments. Preserve argument and result types and propagate failures. Never accept a caller-supplied membership object as proof of access.

Resource operations still own input validation, record scoping, business permissions, and safe DTOs. Keep membership verification outside shared cached bodies and pass only the authorized visibility inputs into cached helpers. The wrapper adds no automatic caching. Direct membership reads remain valid for workflows that need the returned member. Test denied access without callback execution, changed or expired membership/session state, argument forwarding, and callback errors.

## Trace a protected read or mutation

1. Establish the session through auth and resolve applicable membership or permissions through the owning public operation.
2. Validate input at the operation's trust boundary. Parse transport input in the adapter too when needed for its response contract. A TypeScript type is not runtime validation.
3. Treat submitted account and resource IDs as requested scope. Verify the caller may use that scope and constrain persistence reads to it.
4. For mutations, load current state and apply the feature's rules. Make the write conditional on the authorized scope and facts checked, or use an appropriate transaction/concurrency mechanism. For cancellation, a concurrent shipment must not be overwritten after eligibility was checked.
5. Return only selected, permitted fields. Keep browser-consumed DTO schemas in `model/`; server record mappers remain private.

The operation is protected when each public entry path enforces these checks, including direct server calls. Exercise a denied caller, another owner's ID, invalid input, and changed state where applicable.

For background jobs or alternative credentials, define an explicit trusted actor context established by each server entry point. Authenticate the job or API caller and check its permissions for the operation. Keep business rules independent of browser cookies; a client-supplied `userId` or role is not a trusted actor.

Proxy checks remain lightweight. Cookie presence can guide a redirect but cannot prove session validity. Use the installed Next.js version's convention; Next.js 16 renamed Middleware to Proxy. Protect private files at their serving boundary as well. [Next.js authentication](https://nextjs.org/docs/app/guides/authentication), [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

## Better Auth, when selected

Place `src/proxy.ts` beside `app` as a framework entry point. Keep literal matchers scoped to the pages needing early redirects, with login, auth endpoints, and framework assets reachable. API endpoints enforce access through their own transport. Proxy may import `getSessionCookie` from `better-auth/cookies` with the provider's configured cookie prefix; keep provider instances, membership queries, and resource operations out of this lightweight check. Test missing and empty cookies, ordinary and secure cookie names, and rejection of forged or expired sessions by protected operations.

Put the browser provider client in `platform/auth/client.ts` and a provider factory in `platform/auth/server.ts`. The auth feature supplies its tables and assembles `auth.provider.ts`. Mount that instance in the auth HTTP entry point; other features call `auth.queries.ts`. Platform must remain free of feature imports.

Distinguish Better Auth's linked login `Account` from an application's business account or tenant. Choose session-cache policy in auth; operations requiring current session storage checks can bypass cookie caching using the provider's supported API. Verify options against the installed provider version. [Better Auth database model](https://better-auth.com/docs/concepts/database#account), [session management](https://better-auth.com/docs/concepts/session-management)

## Keep authorization outside shared cache hits

Resolve the caller and current visibility scope in the public operation before calling a private shared-cache helper. Include every result-affecting visibility dimension in cache inputs, or leave the result uncached. Recheck mutation eligibility against current storage even if the UI displays a cached result. Read [caching](caching.md) when introducing reuse.

RFAStack source: [protected resources](https://github.com/ishk-sftckz/RFAStack/blob/main/docs/protected-resources.md).
