---
title: Background & Motivation
description: Why a full-stack Next.js application needs shared rules for where code lives and how it works together.
---

# Background & Motivation

A Next.js application rarely becomes hard to maintain overnight. It happens one reasonable shortcut at a time, until nobody is sure where business logic belongs or what a small change might break. RFAStack gives you an opinionated architecture to follow before the codebase reaches that point.

## Next.js leaves some decisions to your application

[React](https://react.dev/) gives you the building blocks for user interfaces. [Next.js](https://nextjs.org/docs/app) adds routing, rendering, server execution, and other conventions for building a full-stack application.

The documentation explains how those parts work. Once you combine them in an application, you still have decisions to make.

Where should business logic live? Should a page read from the database directly? Should a mutation use a Server Action or a Route Handler? Where should validation and authorization happen? If several callers need the same operation, which part should they share?

Next.js cannot answer those questions without knowing your application. You need your own rules for how its features work together.

## Working code can still drift

When an application is small, you usually choose the shortest path that gets the feature working. A page reads from the database because it needs data. A mutation stays inside a Server Action because only one form uses it. A helper goes into `utils` because it does not have an obvious home.

Next.js permits those arrangements. Give each responsibility a consistent home from the first feature.

The problem begins when each feature answers the same questions differently. One page reads from the database directly while another calls an internal HTTP endpoint. One mutation keeps its rules in the feature while another puts them inside a route or component. Validation happens wherever the current implementation needs it.

The next developer has no clear rule to follow. They copy the closest example, even when that example was written for a different reason. As more features are added, those differences become part of the application.

Authorization and caching make the inconsistency harder to ignore. A protected operation needs a dependable place for its checks. A cached read needs a mutation path that knows when the data has changed. If reads, mutations, and business rules do not have clear owners, every new concern creates another place to look.

## Technical debt begins as uncertainty

The first cost is hesitation.

A change sounds small, but you cannot tell where to begin. Before editing the code, you search the repository to find which implementation is authoritative, which callers repeat the same rule, and what else might depend on the behavior.

Code reviews start debating personal preferences because the existing code gives conflicting answers. New developers learn the application by trial and error. Rules that only exist in someone’s head disappear when that person is unavailable.

The application may still run correctly, but ordinary changes require more investigation than they should. That uncertainty becomes technical debt: slower development, repeated mistakes, and the stress of never being sure what a change might break.

## Give recurring decisions a default

Use the recommendations in this guide as a starting point for the decisions the framework leaves to you.

Code should have a clear owner. Dependencies should follow a direction you can explain. Reads and mutations should take paths that match their callers and runtime. Routes and actions adapt requests and responses; the feature’s server operations own business work. Apply those boundaries when you introduce the operation.

Folder structure is part of that architecture, but the same reasoning must continue beyond folders. It should also guide how data reaches a feature, where an operation runs, and where rules such as authorization or cache invalidation belong.

A scalable application should be able to gain features and contributors without making every change harder to trace. The defaults in this guide are meant to keep that reasoning visible in the codebase.

## Apply the rules from the first feature

Follow feature ownership, file placement, and dependency rules from the start. A read-only feature can begin with a component and a server query. A feature that implements cancellation needs a business operation to enforce its rules, even if only one form calls it.

Create the modules required by those responsibilities. Add a repository abstraction when persistence needs to be shared or substituted, and a separate DTO mapper when mapping needs its own module. The query or use case can access the database and select safe result fields before either abstraction exists.

The feature’s size does not change where its business rules belong or which modules callers may import. When you add a read, change a mutation, or protect a resource, the same rules tell you where the implementation begins and which other code it can affect.

Next: [see the architectural foundations behind ownership and dependency direction](./concepts).
