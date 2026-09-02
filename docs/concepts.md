---
title: Concepts
description: The established architectural ideas synthesized and adapted by RFAStack.
---

# Concepts

RFAStack combines established ideas into one operating model for a Next.js application. The synthesis is original; the foundations are not presented as new inventions.

The central move is simple: organize the application by business capability, keep each capability vertically complete, make dependencies point toward behavior, and treat framework code as an adapter at the edge.

## Four foundations, one application model

### Screaming Architecture: reveal the business

Robert C. Martin’s [Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html) asks what a repository communicates at first glance. Does its top-level structure reveal a business domain, or only the frameworks and technical categories used to build it?

RFAStack applies that test through `src/features`:

```text
features/
  billing/
  identity/
  orders/
  reporting/
```

The directory names expose product capabilities. A reader can begin with what the system does before learning how a route or ORM delivers it.

This does not hide Next.js. `src/app` remains an explicit framework boundary. It changes the order in which the repository explains itself: business capabilities are stable; delivery mechanics are visible at the edge.

### Vertical Slice Architecture: keep a change together

[Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/) is associated with Jimmy Bogard’s work on organizing code around use cases instead of horizontal technical layers. Its history also traces through earlier feature-folder and command/query ideas, documented by the [Vertical Slice Architecture project](https://verticalslicearchitecture.com/learn/cookbook/history.html).

RFAStack treats a feature as a vertical full-stack slice. An `orders` capability may own:

- order-specific UI;
- schemas and types;
- pure business rules;
- read and mutation interfaces;
- server-only use cases;
- its repository contract or implementation when that complexity is warranted.

The slice is not required to contain every possible layer. It is required to own the behavior end to end.

### Clean Architecture: control dependency direction

[Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) separates policy from volatile delivery and infrastructure details. RFAStack borrows the dependency principle without reproducing the concentric-circle template folder for folder.

The business rule should not need to import Next.js to decide whether an order can be cancelled. Database configuration should not decide that policy. A route or form action can depend on the feature operation, while the pure rule remains framework-free.

```mermaid
flowchart TD
  App[App Router adapters] --> Public[Feature public interface]
  Public --> Rule[Feature rules and use cases]
  Rule --> Port[Feature integration contract]
  Port --> Platform[Platform implementation]
  App -. allowed .-> Shared[Shared primitives]
  Rule -. allowed .-> Shared
```

This is dependency direction, not ceremony. A direct feature query can be enough. Introduce a port and adapter when the business operation needs isolation, substitution, or independent testing—not because a diagram contains a box for it.

### Domain-Driven Design: name and protect capabilities

Eric Evans’ [Domain-Driven Design reference](https://www.domainlanguage.com/ddd/reference/) provides language for modeling a domain, separating bounded contexts, and aligning code with business concepts.

RFAStack uses selected DDD habits:

- name features in the language of the product;
- keep rules near the capability that owns them;
- make cross-feature coordination explicit;
- avoid a universal model that every part of the application mutates;
- distinguish domain behavior from technical integration.

It does not require tactical DDD patterns everywhere. An entity, aggregate, repository, or domain service should exist because it clarifies real behavior. A read-only dashboard card does not need an aggregate root to qualify as architecture.

## The RFAStack synthesis

Together, the foundations produce a feature-based modular architecture with vertical full-stack slices:

| Foundation | Question it contributes | RFAStack mechanism |
| --- | --- | --- |
| Screaming Architecture | What does this system do? | Top-level feature names reveal business capabilities. |
| Vertical Slice Architecture | What changes together? | UI, rules, reads, mutations, and server work live with the feature. |
| Clean Architecture | Which direction may dependencies point? | Framework and integration details depend on feature contracts and behavior. |
| Domain-Driven Design | Who owns this concept? | Product language defines boundaries and cross-feature relationships. |

The result governs more than location. It defines the legal direction of knowledge.

## Seven operating principles

### 1. Organize business behavior by feature

A capability is the primary unit of ownership. Technical categories can exist inside the feature when they improve navigation.

### 2. Keep framework entries thin

Pages, layouts, Route Handlers, and Server Actions adapt framework inputs and outputs. They compose and delegate; they do not become the default home of policy.

### 3. Separate integration from decision

Platform modules connect to a database, queue, email provider, or observability service. Features decide when and why those integrations are used.

### 4. Share deliberately

Shared code must be generic in both name and behavior. Repeated feature code is allowed to remain repeated until a stable common concept emerges.

### 5. Expose small feature interfaces

Other parts of the application import the operation or component a feature intentionally exposes. They do not deep-import whichever internal file is convenient.

```ts
// preferred: the feature chooses its public surface
import { getOrderDetails } from '@/features/orders/order.queries'

// avoid: another module couples itself to implementation layout
import { getOrderDetails } from '@/features/orders/server/internal/query-builder'
```

### 6. Make server and client ownership visible

Server-only code sits behind an obvious boundary and imports `server-only` when appropriate. Client components use `'use client'` at the smallest meaningful interactive boundary. A feature can span both environments without making either ambiguous.

### 7. Add layers for observed complexity

A feature can begin with a component and a query. It can later acquire a model, use case, repository contract, or adapter. Architecture should make growth safe without charging every small feature the maximum structural cost on day one.

## Features are not isolated islands

Business capabilities interact. The architecture makes that interaction visible instead of pretending it does not exist.

When `checkout` needs a price from `catalog`, choose an explicit relationship:

- import a small public query exposed by `catalog`;
- pass data from an orchestrating entry or application operation;
- publish an event when temporal decoupling is real;
- extract a genuinely shared domain concept only when both capabilities own the same stable meaning.

Avoid deep cross-feature imports. They make private structure part of an accidental public API and turn a local refactor into a repository-wide event.

## The architecture test

A structure is doing useful work when it can answer these questions without guesswork:

1. Which feature owns this behavior?
2. Which module is allowed to call it?
3. Where does the framework stop and application behavior begin?
4. Which code is server-only?
5. Which integration detail can change without rewriting the rule?
6. What is intentionally public to another feature?

If the answers come only from team memory, the boundaries are conceptual but not yet encoded.

## When the model fits—and when it does not

RFAStack is useful when an application has multiple business capabilities, full-stack changes, a mix of server and client execution, and enough contributors that discoverability matters.

It can be excessive for a short-lived campaign page, a narrow prototype, or a small read-only site. Keep those systems direct. The structure should respond to change pressure, not architectural aspiration.

The tradeoff is ongoing discipline. Teams must review dependency direction, resist vague shared folders, and move code when ownership becomes clearer. That work is visible and discussable—which is precisely the point.

Next: [map these concepts onto a concrete Next.js folder structure](./folder-structure).
