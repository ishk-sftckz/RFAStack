---
title: Runnable Examples
description: Choose an application, run it locally, and follow a request through its feature code.
---

# Runnable Examples

Runnable examples show how routes, feature code, and a database work together. Choose the application closest to yours, run it locally, and follow a request from the UI to the stored result.

## Choose an example

| Application | Use it to study | Source and setup |
| --- | --- | --- |
| Customer order portal | Server-rendered pages and forms using native Next.js queries and Server Actions. | [Native Next.js](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/next-native) |
| Fulfillment dashboard | A polling queue using React Query and a separate backend over HTTP. | [React Query + HTTP](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-http) |
| B2B ordering | Typed operations shared by a browser and a command-line client. | [React Query + oRPC](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-orpc) |

Start with the customer portal for pages and forms. Use the dashboard when your browser needs ongoing updates from an HTTP service, or B2B ordering when you want to share a typed API across clients. The [data-fetching guide](./data-fetching-and-mutation#choose-the-default-that-matches-the-caller) explains these choices.

## Run it locally

Open the selected example's README for setup commands and demo accounts. You'll need Bun 1.4.0, Docker Compose, and Node.js 22 or later for test tools. Install dependencies inside that example; the root installation only covers the documentation site.

Each application has its own PostgreSQL database, ports, and tests. Shipping is simulated, so you don't need external credentials or payment setup. The examples omit public registration, email delivery, and production hosting.

## Follow one request

Each application keeps routes in `app`, business rules in `features`, integration setup in `platform`, and generic code in `shared`. See the [folder structure guide](./folder-structure) for the dependency rules.

Pick one workflow to trace:

- **Customer portal:** follow `checkout.actions.ts` into `create-order.use-case.ts`. The server reads product prices and stores the order.
- **Fulfillment dashboard:** start with `fulfillment.api.ts`, then open `backend/features/fulfillment`. The backend checks the operator's warehouse before changing a shipment.
- **B2B ordering:** follow `order.rpc.ts` into `decide-order.use-case.ts`. The use case checks company membership, approver permissions, and order status.

Change a rule in its owning feature, then run that example's checks. Each README includes the test commands and a way to observe cache reads after a write. For the reasoning behind those checks, read [resource protection](./protected-resources) and [caching](./caching).
