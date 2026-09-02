<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import NotFoundPage from './NotFoundPage.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #not-found><NotFoundPage /></template>
  </DefaultTheme.Layout>
</template>
