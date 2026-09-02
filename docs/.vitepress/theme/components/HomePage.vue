<script setup lang="ts">
import { withBase } from 'vitepress'
import ArchitectureMap from './ArchitectureMap.vue'

const chapters = [
  ['01', 'Background & Motivation', 'Why organizing by technical layer makes product changes harder over time.', '/background'],
  ['02', 'Concepts', 'How feature modules, vertical slices, dependency direction, and domain boundaries fit together.', '/concepts'],
  ['03', 'Folder Structure', 'A concrete home for routes, features, integrations, and shared code.', '/folder-structure'],
  ['04', 'Data Fetching & Mutation', 'When to use Server Components, Server Actions, Route Handlers, TanStack Query, and oRPC.', '/data-fetching-and-mutation'],
] as const

const boundaries = [
  ['A', 'src/app', 'The Next.js boundary. Routes, layouts, pages, handlers, and route-only composition live here.'],
  ['F', 'src/features', 'Each business capability owns its UI, rules, reads, mutations, and server code.'],
  ['P', 'src/platform', 'Database, email, storage, observability, and other app-level integrations.'],
  ['S', 'src/shared', 'UI primitives, types, and utilities that carry no product-specific behavior.'],
] as const
</script>

<template>
  <main class="manual-home">
    <section class="manual-hero">
      <div class="manual-hero__copy">
        <p class="manual-index">REACT FULLSTACK ARCHITECTURE / NEXT.JS</p>
        <h1>RFAStack</h1>
        <p class="manual-tagline">An Opinionated React Fullstack Architecture for Next.js Applications</p>
        <p class="manual-lede">Organize a Next.js application around the product capabilities it delivers. Routes stay thin while each feature owns its UI, rules, reads, mutations, and server code.</p>
        <div class="manual-actions">
          <a class="manual-button" :href="withBase('/background')">Read the docs</a>
          <a class="manual-text-link" href="https://github.com/ishk-sftckz/RFAStack">View on GitHub →</a>
        </div>
      </div>
    </section>

    <section class="manual-map-section" aria-labelledby="architecture-at-a-glance">
      <header class="section-heading">
        <p class="manual-index">BOUNDARY MAP / REQUEST TO BEHAVIOR</p>
        <h2 id="architecture-at-a-glance">Architecture at a glance</h2>
        <p>A request enters through <code>src/app</code> and moves into the feature that owns the behavior. Features can call app-level integrations and small, generic building blocks.</p>
      </header>
      <ArchitectureMap />
    </section>

    <section class="boundary-section" aria-labelledby="responsibility-boundaries">
      <header class="section-heading section-heading--compact">
        <p class="manual-index">PLACEMENT RULES / CLEAR OWNERSHIP</p>
        <h2 id="responsibility-boundaries">Four folders, four responsibilities</h2>
      </header>
      <ol class="boundary-grid">
        <li v-for="([mark, title, copy], index) in boundaries" :key="title">
          <div class="boundary-card__head"><span>{{ mark }}</span><small>0{{ index + 1 }}</small></div>
          <h3>{{ title }}</h3>
          <p>{{ copy }}</p>
        </li>
      </ol>
    </section>

    <section class="reading-path" aria-labelledby="documentation">
      <header class="section-heading section-heading--compact">
        <p class="manual-index">DOCS / FOUR CHAPTERS</p>
        <h2 id="documentation">Documentation</h2>
      </header>
      <ol class="chapter-list">
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
