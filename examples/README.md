# Runnable examples

Choose an application, then open its README for setup and a workflow to try.

| Application | Data strategy | Start here |
| --- | --- | --- |
| Customer order portal | Native Next.js queries and Server Actions | [Run the portal](./next-native/README.md) |
| Fulfillment dashboard | React Query with a separate HTTP backend | [Run the dashboard](./react-query-http/README.md) |
| B2B ordering | React Query and oRPC, with a typed CLI client | [Run B2B ordering](./react-query-orpc/README.md) |

Each application uses PostgreSQL, Drizzle, Better Auth, and Cache Components. Install and run it
from its own directory; the examples have separate dependencies, databases, and tests.

Feature queries, actions, use cases, and supporting modules live at the feature root. Components
stay in `ui/`, and schemas and pure rules stay in `model/`. Server and Client Components share
`ui/`; imports and Next.js directives define their runtime boundaries. Follow the
[folder-structure guide](../docs/folder-structure.md#keep-operation-modules-at-the-feature-root)
for placement and public-import rules.
