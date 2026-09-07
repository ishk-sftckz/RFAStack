---
name: rfastack
description: "Apply RFAStack conventions when planning, building, or refactoring full-stack React applications with Next.js. Use when the user requests RFAStack or the target project adopts it, including feature ownership, module placement, data paths, authorization, and caching."
license: CC-BY-4.0
---

# RFAStack

Guide the requested Next.js work with explicit feature ownership and public operations. Apply the conventions to the affected behavior; preserve the user's scope and the target application's documented choices.

The target is the user's application workspace. Resolve bundled reference links relative to this skill's installation directory; resolve application paths relative to the target project. The skill works without a local RFAStack checkout.

## Establish the target and the operation

Read the target application's agent instructions, package manifest, Next.js configuration, and nearest relevant feature. Identify its router, runtime, import aliases, validation library, auth provider, and data strategy. Use that application's package manager and checks; the RFAStack documentation site's Bun version and GitHub Pages base path are not application requirements.

For each affected operation, identify its business owner, whether it reads or mutates, who calls it, and what must update afterward. Trace existing callers before moving an operation. For a new application, choose a consistent data strategy from [data paths](references/data-paths.md); for an existing one, preserve its strategy unless the requested work changes it.

This skill targets the App Router. In a Pages Router or mixed application, apply ownership rules within the current router and identify any required adaptation. Treat an App Router migration as separate scope. Verify version-sensitive APIs against the installed packages and their official documentation before adopting an example.

Proceed once the affected operations, owners, callers, and runtime boundaries are identified. Record unresolved product decisions as assumptions or ask when they prevent choosing the behavior.

## Apply the shared architecture rules

| Location | Owns | Allowed dependencies |
| --- | --- | --- |
| `src/app` | Routes, lifecycle files, transport entry points, page composition | Public feature interfaces, platform setup, shared primitives |
| `src/features/<capability>` | Business UI, schemas, rules, queries, mutations, workflows | Its own implementation, other features' explicit public interfaces, platform, shared |
| `src/platform` | Database connections, provider factories, common transport and integration clients | External packages, application configuration, shared primitives |
| `src/shared` | Generic UI and behavior independent of business policy | Other generic shared primitives |

Use product capabilities such as `orders`, `billing`, and `membership` for feature names. Keep presentation in `ui/`, schemas and pure business behavior in `model/`, and operation modules at the feature root. Match the target's source root and aliases when applying these locations.

Public server queries and use cases define the access boundary. Import them directly from their implementing modules. Keep repositories, server DTO mappers, and helpers private to the feature. Platform remains independent of features; shared remains independent of application business behavior. The narrowly scoped table foreign-key exception is in [file placement](references/file-placement.md).

Read the references that match the work before choosing files or writing the plan:

| Work touches | Required reference |
| --- | --- |
| New or moved modules, public interfaces, naming, shared code, cross-feature workflows | [File placement](references/file-placement.md) |
| Reads, mutations, Server Actions, HTTP, RPC, query options, hydration | [Data paths](references/data-paths.md) |
| Private data, authenticated operations, membership, provider setup, background actors | [Resource protection](references/resource-protection.md) |
| Cached reads, mutations affecting cached data, account switching, stale UI | [Caching](references/caching.md) |

Add only the roles the operation uses. A read-only feature can start with UI and a query. Every business mutation implemented by this application has a use case, even when short. Repositories, separate mappers, RPC, query libraries, and wrapper hooks each need a concrete reason.

## Produce the requested outcome

### Planning

Use the project's existing plan format. For each affected operation, make these decisions reviewable:

- Owning feature, concrete module paths, and public exports with intended callers.
- Request path from caller through adapter to query or use case, including any cross-feature calls.
- Input and result contracts, authorization scope, and business rules checked against stored state.
- Cache ownership and what each mutation path invalidates or refreshes, when caching applies.
- For a refactor, old-to-new module mapping, caller migration order, and preserved routes, payloads, and behavior.
- Acceptance checks that exercise the changed behavior and the boundaries it crosses.

State why each additional abstraction is needed. A plan is complete when an implementer can place every affected operation and trace its access and update behavior without inventing an architectural decision. Return the plan without beginning implementation when the user requested planning only.

### Implementation and refactoring

Build the affected feature operation and connect its callers through the chosen data path. Keep parsing and transport responses in adapters, business mutations in use cases, pure rules in `model/`, and persistence with the owning feature.

For refactors, move one coherent operation and migrate its callers together. Preserve its external contract unless changing it is part of the task. Remove obsolete modules once their callers have moved. If a staged migration needs a temporary adapter, give it a defined removal condition and keep it outside forbidden dependency directions.

## Verify the affected behavior

Inspect changed imports for both ownership and server/browser compatibility. Run the target application's relevant lint, type, build, and behavioral checks from its own configuration. For new behavior, cover the meaningful failure cases alongside success:

- Protected operations reject unauthenticated or unauthorized callers even when called without page or layout checks.
- Mutations enforce rules against current stored state and reject conflicting updates where state can race.
- Results expose only permitted fields; browser code reaches server operations through supported transport.
- Cached values update through every changed write path and remain separated by authorized visibility scope.
- Refactored callers retain their expected routes, payloads, UI states, and behavior.

Use a production build when checking Next.js cache behavior. Report what changed, the checks actually run, and any unresolved deviations. Mark an unrun check as unverified.

## Source and attribution

Adapted from [RFAStack by Ishk](https://github.com/ishk-sftckz/RFAStack), guide snapshot `73ae7c1`. This skill's prose and documentation examples are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This license does not change the consuming application's license.

The bundled references contain the conventions needed to use the skill outside the RFAStack checkout. Consult the linked upstream guides when a case needs more detail. When maintaining this skill, compare it with the current guides and update affected references and this source revision together.
