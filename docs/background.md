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

None of those choices has to be wrong.

The problem begins when each feature answers the same questions differently. One page reads from the database directly while another calls an internal HTTP endpoint. One mutation keeps its rules in the feature while another puts them inside a route or component. Validation happens wherever the current implementation needs it.

The next developer has no clear rule to follow. They copy the closest example, even when that example was written for a different reason. As more features are added, those differences become part of the application.

Authorization and caching make the inconsistency harder to ignore. A protected operation needs a dependable place for its checks. A cached read needs a mutation path that knows when the data has changed. If reads, mutations, and business rules do not have clear owners, every new concern creates another place to look.

## Technical debt begins as uncertainty

The first cost is hesitation.

A change sounds small, but you cannot tell where to begin. Before editing the code, you search the repository to find which implementation is authoritative, which callers repeat the same rule, and what else might depend on the behavior.

Code reviews start debating personal preferences because the existing code gives conflicting answers. New developers learn the application by trial and error. Rules that only exist in someone’s head disappear when that person is unavailable.

The application may still run correctly, but ordinary changes require more investigation than they should. That uncertainty becomes technical debt: slower development, repeated mistakes, and the stress of never being sure what a change might break.

## RFAStack gives those decisions a default

RFAStack is an opinionated reference for engineering full-stack Next.js applications. It provides a starting point for the decisions the framework leaves to you.

Code should have a clear owner. Dependencies should follow a direction you can explain. Reads and mutations should take paths that match their callers and runtime. Framework boundaries should exist because the application needs them, not because an API happens to be available.

Folder structure is part of that architecture, but the same reasoning must continue beyond folders. It should also guide how data reaches a feature, where an operation runs, and where rules such as authorization or cache invalidation belong.

For RFAStack, a scalable application is one that can gain features and contributors without making every change harder to trace. The defaults in this guide are meant to keep that reasoning visible in the codebase.

## Add structure when the application asks for it

A small prototype or a short-lived page may only need a direct query and a nearby mutation. Adding boundaries before they solve a real problem makes the code harder to navigate.

More structure becomes useful when features share behavior, operations have several callers, or data crosses runtime and trust boundaries. Different requirements can lead to different paths, but each path should have a reason you can point to.

When you add a read, change a mutation, or protect a resource, you should know where the implementation begins, which feature owns the behavior, and which other code it can affect.

Next: [see the architectural foundations behind ownership and dependency direction](./concepts).
