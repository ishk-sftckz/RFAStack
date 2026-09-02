<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <main class="not-found">
    <p class="manual-index">PAGE / 404</p>
    <h1>This page doesn't exist.</h1>
    <p>The link may be outdated, or the page may have moved.</p>
    <a class="manual-button" :href="withBase('/')">Return to the guide</a>
  </main>
</template>
