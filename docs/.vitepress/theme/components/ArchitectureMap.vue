<template>
  <figure class="architecture-figure" tabindex="0" aria-label="Scrollable RFAStack architecture map">
    <svg class="architecture-map" viewBox="0 0 960 590" role="img" aria-label="RFAStack architecture map" xmlns="http://www.w3.org/2000/svg">
      <title>RFAStack architecture map</title>
      <desc>App Router entry adapters delegate into business feature slices. Features use platform adapters and may use shared generic primitives. Platform and shared code do not depend on features.</desc>
      <defs>
        <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" class="map-grid-line" /></pattern>
        <marker id="arrow-cobalt" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="map-arrow-head" /></marker>
      </defs>
      <rect x="1" y="1" width="958" height="588" rx="3" class="map-sheet" />
      <rect x="1" y="1" width="958" height="588" rx="3" fill="url(#map-grid)" />
      <text x="34" y="42" class="map-plate">PLATE 01 · DEPENDENCIES POINT TOWARD BUSINESS CAPABILITIES</text>
      <text x="926" y="42" text-anchor="end" class="map-scale">NOT TO SCALE</text>
      <path d="M480 164 L480 215" class="map-arrow" marker-end="url(#arrow-cobalt)" />
      <path d="M360 410 L285 472" class="map-arrow" marker-end="url(#arrow-cobalt)" />
      <path d="M600 410 L675 472" class="map-arrow" marker-end="url(#arrow-cobalt)" />
      <g class="map-node map-node--app">
        <rect x="250" y="72" width="460" height="92" rx="2" />
        <text x="278" y="102" class="map-node__mark">A / FRAMEWORK ENTRY</text>
        <text x="278" y="137" class="map-node__title">App Router</text>
        <text x="682" y="136" text-anchor="end" class="map-node__copy">receive · adapt · delegate</text>
      </g>
      <g class="map-node map-node--feature">
        <rect x="130" y="216" width="700" height="194" rx="2" />
        <text x="160" y="250" class="map-node__mark">F / BUSINESS CAPABILITIES</text>
        <text x="160" y="294" class="map-node__title">Features</text>
        <text x="160" y="326" class="map-node__copy">orders / billing / identity / reporting</text>
        <line x1="160" y1="351" x2="800" y2="351" class="map-rule" />
        <text x="160" y="382" class="map-node__note">UI · model · queries · mutations · server</text>
        <text x="800" y="382" text-anchor="end" class="map-node__note">OWN THE CHANGE</text>
      </g>
      <g class="map-node map-node--platform">
        <rect x="70" y="473" width="370" height="86" rx="2" />
        <text x="96" y="503" class="map-node__mark">P / INTEGRATIONS</text>
        <text x="96" y="536" class="map-node__title map-node__title--small">Platform</text>
        <text x="414" y="535" text-anchor="end" class="map-node__copy">database · email · telemetry</text>
      </g>
      <g class="map-node map-node--shared">
        <rect x="520" y="473" width="370" height="86" rx="2" />
        <text x="546" y="503" class="map-node__mark">S / GENERIC PRIMITIVES</text>
        <text x="546" y="536" class="map-node__title map-node__title--small">Shared</text>
        <text x="864" y="535" text-anchor="end" class="map-node__copy">UI · types · utilities</text>
      </g>
    </svg>
    <figcaption><strong>Text alternative:</strong> the App Router delegates to feature-owned behavior. Features may call platform integrations and shared generic primitives. Platform and shared code never reach back into a feature.</figcaption>
  </figure>
</template>
