<script setup lang="ts">
import { withBase } from 'vitepress'
import ArchitectureMap from './ArchitectureMap.vue'

const chapters = [
  ['01', 'Background & Motivation', 'See why technical-layer folders make feature work expensive as a product grows.', '/background'],
  ['02', 'Concepts', 'Connect vertical slices, Screaming Architecture, dependency direction, and domain boundaries.', '/concepts'],
  ['03', 'Folder Structure', 'Place routes, business capabilities, integrations, and shared primitives with intent.', '/folder-structure'],
  ['04', 'Data Fetching & Mutation', 'Choose an execution boundary from operation type, execution location, and consumers.', '/data-fetching-and-mutation'],
] as const

const boundaries = [
  ['A', 'App Router', 'Thin framework entry adapters: routes, layouts, pages, loading states, and HTTP boundaries.'],
  ['F', 'Features', 'Business capabilities: their UI, rules, use cases, queries, mutations, and server code.'],
  ['P', 'Platform', 'App-local infrastructure: databases, observability, email, storage, and vendor adapters.'],
  ['S', 'Shared', 'Deliberately generic primitives with no feature ownership and no hidden business policy.'],
] as const
</script>

<template>
  <main class="manual-home">
    <section class="manual-hero">
      <div class="manual-hero__copy">
        <p class="manual-index">FIELD MANUAL / REACT + NEXT.JS</p>
        <h1>RFAStack</h1>
        <p class="manual-tagline">An Opinionated React Fullstack Architecture for Next.js Applications</p>
        <p class="manual-lede">A feature-based modular application architecture organized as vertical full-stack slices and adapted to Next.js.</p>
        <p class="manual-clarifier">“Stack” is the project name. RFAStack describes how an application is shaped—not a fixed inventory of libraries.</p>
        <div class="manual-actions">
          <a class="manual-button" :href="withBase('/background')">Start with the problem</a>
          <a class="manual-text-link" :href="withBase('/folder-structure')">Inspect the structure →</a>
        </div>
      </div>
      <div class="manual-hero__stamp" aria-hidden="true"><span>RFA</span><small>01 / 04</small></div>
    </section>

    <section class="manual-map-section" aria-labelledby="architecture-at-a-glance">
      <header class="section-heading">
        <p class="manual-index">PLATE 01 / RESPONSIBILITY MAP</p>
        <h2 id="architecture-at-a-glance">Architecture at a glance</h2>
        <p>Framework code receives the request. A feature owns the behavior. Platform adapters perform integration work. Shared code stays small and generic.</p>
      </header>
      <ArchitectureMap />
    </section>

    <section class="boundary-section" aria-labelledby="responsibility-boundaries">
      <header class="section-heading section-heading--compact">
        <p class="manual-index">FOUR BOUNDARIES / ONE DIRECTION</p>
        <h2 id="responsibility-boundaries">Responsibility before reuse</h2>
      </header>
      <ol class="boundary-grid">
        <li v-for="([mark, title, copy], index) in boundaries" :key="title">
          <div class="boundary-card__head"><span>{{ mark }}</span><small>0{{ index + 1 }}</small></div>
          <h3>{{ title }}</h3>
          <p>{{ copy }}</p>
        </li>
      </ol>
    </section>

    <section class="reading-path" aria-labelledby="read-the-field-manual">
      <header class="section-heading section-heading--compact">
        <p class="manual-index">READING ORDER / 35 MINUTES</p>
        <h2 id="read-the-field-manual">Read the field manual</h2>
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
