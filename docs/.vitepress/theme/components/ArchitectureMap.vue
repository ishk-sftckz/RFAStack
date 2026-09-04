<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const figure = ref<HTMLElement | null>(null)
const motionReady = ref(false)
const isVisible = ref(false)
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    isVisible.value = true
    return
  }

  motionReady.value = true
  observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return

    isVisible.value = true
    observer?.disconnect()
    observer = undefined
  }, { threshold: 0.15 })

  if (figure.value) observer.observe(figure.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <figure
    ref="figure"
    class="architecture-figure"
    :class="{ 'is-motion-ready': motionReady, 'is-visible': isVisible }"
    tabindex="0"
    aria-label="Scrollable RFAStack architecture map"
  >
    <svg class="architecture-map" viewBox="0 0 960 590" role="img" aria-label="RFAStack architecture map" xmlns="http://www.w3.org/2000/svg">
      <title>RFAStack architecture map</title>
      <desc>Requests enter through src/app and delegate to a feature in src/features. Feature code may call integrations in src/platform and generic primitives in src/shared.</desc>
      <defs>
        <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" class="map-grid-line" /></pattern>
        <marker id="arrow-cobalt" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="map-arrow-head" /></marker>
      </defs>
      <rect x="1" y="1" width="958" height="588" rx="3" class="map-sheet" />
      <rect x="1" y="1" width="958" height="588" rx="3" fill="url(#map-grid)" />
      <text x="34" y="42" class="map-plate">CALL FLOW · OWNERSHIP STAYS WITH BUSINESS CAPABILITIES</text>
      <text x="926" y="42" text-anchor="end" class="map-scale">NOT TO SCALE</text>
      <path d="M480 164 L480 215" class="map-arrow" marker-end="url(#arrow-cobalt)" />
      <path d="M360 410 L285 472" class="map-arrow" marker-end="url(#arrow-cobalt)" />
      <path d="M600 410 L675 472" class="map-arrow" marker-end="url(#arrow-cobalt)" />
      <g class="map-node map-node--app">
        <rect x="250" y="72" width="460" height="92" rx="2" />
        <text x="278" y="102" class="map-node__mark">A / NEXT.JS BOUNDARY</text>
        <text x="278" y="137" class="map-node__title">src/app</text>
        <text x="682" y="136" text-anchor="end" class="map-node__copy">pages · layouts · handlers</text>
      </g>
      <g class="map-node map-node--feature">
        <rect x="130" y="216" width="700" height="194" rx="2" />
        <text x="160" y="250" class="map-node__mark">F / BUSINESS CAPABILITIES</text>
        <text x="160" y="294" class="map-node__title">src/features</text>
        <text x="160" y="326" class="map-node__copy">orders / billing / identity / reporting</text>
        <line x1="160" y1="351" x2="800" y2="351" class="map-rule" />
        <text x="160" y="382" class="map-node__note">UI · model · queries · mutations · server</text>
        <text x="800" y="382" text-anchor="end" class="map-node__note">OWNS THE BEHAVIOR</text>
      </g>
      <g class="map-node map-node--platform">
        <rect x="70" y="473" width="370" height="96" rx="2" />
        <text x="96" y="501" class="map-node__mark">P / INTEGRATIONS</text>
        <text x="96" y="531" class="map-node__title map-node__title--small">src/platform</text>
        <text x="96" y="553" class="map-node__copy">database · email · telemetry</text>
      </g>
      <g class="map-node map-node--shared">
        <rect x="520" y="473" width="370" height="96" rx="2" />
        <text x="546" y="501" class="map-node__mark">S / GENERIC PRIMITIVES</text>
        <text x="546" y="531" class="map-node__title map-node__title--small">src/shared</text>
        <text x="546" y="553" class="map-node__copy">UI · types · utilities</text>
      </g>
    </svg>
    <figcaption><strong>Text alternative:</strong> requests enter through <code>src/app</code> and delegate to feature-owned behavior in <code>src/features</code>. Features may call integrations in <code>src/platform</code> and generic primitives in <code>src/shared</code>.</figcaption>
  </figure>
</template>
