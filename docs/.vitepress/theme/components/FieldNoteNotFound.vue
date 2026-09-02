<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <main class="not-found">
    <p class="manual-index">FIELD NOTE / 404</p>
    <h1>This route has no field note.</h1>
    <p>The architecture is still intact. The requested page is not part of this manual.</p>
    <a class="manual-button" :href="withBase('/')">Return to the architecture map</a>
  </main>
</template>
