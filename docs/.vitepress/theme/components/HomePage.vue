<script setup lang="ts">
import { withBase } from 'vitepress'
import ArchitectureMap from './ArchitectureMap.vue'

const chapters = [
  ['01', 'Background & Motivation', 'One shortcut looks harmless. This chapter follows what happens when every feature invents its own path.', '/background'],
  ['02', 'Concepts', 'Screaming Architecture, Vertical Slices, Clean Architecture, and DDD each answer a different question. RFAStack brings those answers together.', '/concepts'],
  ['03', 'Folder Structure', 'The four folders are easy to copy. The ownership and import rules are what make them useful.', '/folder-structure'],
  ['04', 'Data Fetching & Mutation', 'Decide from the operation first; choose Server Actions, Route Handlers, TanStack Query, or oRPC second.', '/data-fetching-and-mutation'],
] as const

const concerns = [
  ['01', 'Business rules stay with the feature', 'The orders feature owns what cancellation means. Pages and handlers may start the operation; they do not decide whether it is allowed.'],
  ['02', 'Server renders call the feature directly', 'A Server Component can call a feature query without creating an internal API. Add an HTTP boundary when a browser, mobile app, webhook, or external caller needs one.'],
  ['03', 'First-party mutations start with Server Actions', 'Use a Server Action for a form or interactive UI that belongs to this application. When another client needs the mutation, put the same feature use case behind a Route Handler or RPC procedure.'],
  ['04', 'Integrations do the work; features make the decision', 'Database, email, storage, and telemetry belong in platform code. The feature decides when to use them and which business rule applies.'],
] as const
</script>

<template>
  <main class="manual-home">
    <section class="manual-hero">
      <div class="manual-hero__copy">
        <p class="manual-index">REACT FULLSTACK ARCHITECTURE / NEXT.JS</p>
        <h1>RFAStack</h1>
        <p class="manual-tagline">An Opinionated React Fullstack Architecture for Next.js Applications</p>
        <p class="manual-lede">A Next.js application rarely becomes hard to maintain overnight. It happens one reasonable shortcut at a time, until nobody is sure where business logic belongs or what a small change might break. RFAStack gives you an opinionated architecture to follow before the codebase reaches that point.</p>
        <div class="manual-actions">
          <a class="manual-button" :href="withBase('/background')">Read the docs</a>
          <a class="manual-text-link" href="https://github.com/ishk-sftckz/RFAStack">View on GitHub →</a>
        </div>
      </div>
    </section>

    <section class="positioning-section" aria-labelledby="why-rfastack">
      <header class="section-heading">
        <p class="manual-index">THE GAP / NEXT.JS STOPS AT THE FRAMEWORK</p>
        <h2 id="why-rfastack">Next.js gives you the pieces. You still have to design the application.</h2>
        <p>Pages, Server Components, Server Actions, and Route Handlers tell you where code runs. They do not tell you where an order rule belongs, which feature may call it, or how a mutation should reach the database. RFAStack gives those decisions a default.</p>
      </header>
      <div class="problem-ledger">
        <article>
          <p class="ledger-index">01 / THE SHORTCUT</p>
          <p>The page needs data, so it calls the database. The form needs to write, so its handler owns the mutation. Both choices are reasonable.</p>
        </article>
        <article>
          <p class="ledger-index">02 / SIX FILES LATER</p>
          <p>Then cancellation changes. The rule is in a component, authorization is in a handler, and cache invalidation lives somewhere else. You have to trace the whole path again.</p>
        </article>
        <article class="problem-ledger__answer">
          <p class="ledger-index">03 / THE DEFAULT</p>
          <p>Put order behavior in <code>features/orders</code>. Let the route receive the request and platform code talk to the database. One feature owns the change.</p>
        </article>
      </div>
    </section>

    <section class="outcome-section" aria-labelledby="local-reasoning">
      <p class="manual-index">THE DEFAULT / FEATURE OWNS THE CHANGE</p>
      <div class="outcome-statement">
        <h2 id="local-reasoning">Order behavior belongs in the orders feature</h2>
        <p>Open <code>features/orders</code> and you should find the order UI, validation, reads, mutations, and business rules. If changing cancellation sends you through unrelated technical folders, the ownership is still too vague. A small read-only site can stay simpler; this boundary earns its keep when changes cross UI, server code, and storage.</p>
      </div>
    </section>

    <section class="model-section" aria-labelledby="full-stack-model">
      <header class="section-heading">
        <p class="manual-index">DATA FLOW / START WITH THE OPERATION</p>
        <h2 id="full-stack-model">A folder structure cannot tell you how data should move</h2>
        <p>A page can sit in the right folder and still call the wrong layer. Start with the operation: is it a read or mutation, where must it run, and who consumes it? Those answers tell you whether to use a direct server call, Server Action, Route Handler, or client query.</p>
      </header>
      <ol class="concern-grid" aria-label="RFAStack architectural concerns">
        <li v-for="([number, title, copy]) in concerns" :key="title">
          <span class="concern-card__index">{{ number }}</span>
          <h3>{{ title }}</h3>
          <p>{{ copy }}</p>
        </li>
      </ol>
    </section>

    <section class="manual-map-section" aria-labelledby="architecture-at-a-glance">
      <header class="section-heading">
        <p class="manual-index">SOURCE TREE / FOUR FOLDERS, FOUR JOBS</p>
        <h2 id="architecture-at-a-glance">The folder tree should tell you who owns the code</h2>
        <p>A neat folder tree is easy to copy and easy to misuse. <code>src/app</code> owns Next.js entry points, not order policy. <code>src/features</code> owns product behavior. <code>src/platform</code> handles integrations, while <code>src/shared</code> holds code with no product-specific rule. Copy the names without the ownership rules and you get four new junk drawers.</p>
      </header>
      <ArchitectureMap />
    </section>

    <section class="reading-path" aria-labelledby="documentation">
      <header class="section-heading">
        <p class="manual-index">READING PATH / RULES BEFORE FOLDERS</p>
        <h2 id="documentation">Understand the rules before you copy the folders</h2>
        <p>Start with why local choices become expensive and which architecture ideas RFAStack borrows. Then use the folder and data-flow guides to decide where code belongs and how each operation should run.</p>
      </header>
      <ol class="chapter-list" aria-label="RFAStack reading path">
        <li v-for="chapter in chapters" :key="chapter[0]">
          <a :href="withBase(chapter[3])">
            <span class="chapter-list__index">{{ chapter[0] }}</span>
            <span class="chapter-list__body"><strong>{{ chapter[1] }}</strong><small>{{ chapter[2] }}</small></span>
            <span class="chapter-list__arrow" aria-hidden="true">↗</span>
          </a>
        </li>
      </ol>
    </section>
  </main>
</template>
