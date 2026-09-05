<script setup lang="ts">
import { withBase } from 'vitepress'
import ArchitectureMap from './ArchitectureMap.vue'

const chapters = [
  ['01', 'Background & Motivation', 'Why working Next.js applications become harder to change when each feature follows a different rule.', '/background'],
  ['02', 'Architecture Foundations', 'How feature ownership, public interfaces, and dependency direction decide where code belongs.', '/concepts'],
  ['03', 'Data Fetching & Mutation', 'How to choose a path for reads and mutations across server code, browser state, and external callers.', '/data-fetching-and-mutation'],
  ['04', 'Protected Resources', 'Protect reads and mutations with session verification, resource access checks, and safe returned data.', '/protected-resources'],
  ['05', 'Caching', 'Understand what each cache reuses, where feature cache policy belongs, and how writes reach the server and browser views.', '/caching'],
] as const

const concerns = [
  ['01', 'Start with the operation', 'Decide what the code must do and who needs it before choosing a Server Action, Route Handler, or client-side library.'],
  ['02', 'Business rules belong to features', 'Put the rule in one feature, then let pages, actions, and handlers call it instead of rewriting it.'],
  ['03', 'Reads and mutations should be traceable', 'You should be able to follow the caller to the feature, then follow the feature to the database or outside service.'],
  ['04', 'Extra structure needs a requirement', 'Keep the direct path until the browser, an external caller, or protected data requires another boundary.'],
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
        <p class="manual-index">THE GAP / APPLICATION DECISIONS</p>
        <h2 id="why-rfastack">You can know the Next.js APIs and still be unsure where your code belongs</h2>
        <p>The documentation can show you how a Server Component, Server Action, or Route Handler works. Your application still needs rules for when to use each one, where business logic lives, and what several callers should share.</p>
      </header>
      <div class="problem-ledger">
        <article>
          <p class="ledger-index">01 / THE FIRST FEATURE</p>
          <p>A page reads from the database. A mutation stays in a Server Action. A helper goes into <code>utils</code>. Each choice works for the feature in front of you.</p>
        </article>
        <article>
          <p class="ledger-index">02 / THE PATTERNS DRIFT</p>
          <p>Another page calls an internal endpoint for the same kind of read. Another mutation keeps its checks somewhere else. Each implementation works, but the next developer has no clear pattern to follow.</p>
        </article>
        <article class="problem-ledger__answer">
          <p class="ledger-index">03 / THE SHARED RULE</p>
          <p>Keep business rules with the feature that owns them. Pages, Server Actions, and Route Handlers can call the same operation through the boundary they need.</p>
        </article>
      </div>
    </section>

    <section class="outcome-section" aria-labelledby="local-reasoning">
      <p class="manual-index">THE COST / UNCERTAINTY</p>
      <div class="outcome-statement">
        <h2 id="local-reasoning">A small change should not begin with a repository-wide search</h2>
        <p>You should be able to find the feature, see where its rules live, and follow each read or mutation to the data it touches. When two paths do the same work and nobody can explain why, every change starts with investigation. That uncertainty slows reviews, encourages repeated mistakes, and becomes technical debt.</p>
      </div>
    </section>

    <section class="model-section" aria-labelledby="full-stack-model">
      <header class="section-heading">
        <p class="manual-index">THE APPROACH / DEFAULTS WITH BOUNDARIES</p>
        <h2 id="full-stack-model">Give every business rule an owner and every data path a reason</h2>
        <p>The folder tree, server code, and the way data moves should support the same decisions. Start with the direct path, then add structure when the application gives you a reason.</p>
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
        <p class="manual-index">ARCHITECTURE FOUNDATIONS / OWNERSHIP</p>
        <h2 id="architecture-at-a-glance">The folder tree should show where product behavior belongs</h2>
        <p>A neat folder tree is easy to copy and easy to misuse. <code>src/app</code> contains Next.js entry points. <code>src/features</code> owns product behavior. <code>src/platform</code> handles databases and outside services. <code>src/shared</code> holds code with no product-specific rule. Copy the names without the ownership rules and you get four new junk drawers.</p>
      </header>
      <ArchitectureMap />
    </section>

    <section class="reading-path" aria-labelledby="documentation">
      <header class="section-heading">
        <p class="manual-index">READING PATH / RFASTACK</p>
        <h2 id="documentation">From code ownership to data flow</h2>
        <p>Follow the decisions that shape a Next.js application across features, framework boundaries, server code, and data sources.</p>
      </header>
      <ol class="chapter-list" aria-label="RFAStack reading path">
        <li v-for="chapter in chapters" :key="chapter[0]">
          <a :href="withBase(chapter[3])">
            <span class="chapter-list__index">{{ chapter[0] }}</span>
            <span class="chapter-list__body"><strong>{{ chapter[1] }}</strong><small>{{ chapter[2] }}</small></span>
            <svg class="chapter-list__arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
        </li>
      </ol>
    </section>
  </main>
</template>
