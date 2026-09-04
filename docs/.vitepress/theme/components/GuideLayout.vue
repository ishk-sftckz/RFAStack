<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { withBase } from 'vitepress'
import NotFoundPage from './NotFoundPage.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #sidebar-nav-before>
      <a class="sidebar-brand" :href="withBase('/')" aria-label="RFAStack home">
        <img class="sidebar-brand__logo light" :src="withBase('/wordmark.svg')" alt="RFAStack">
        <img class="sidebar-brand__logo dark" :src="withBase('/wordmark-dark.svg')" alt="RFAStack">
      </a>
    </template>
    <template #not-found><NotFoundPage /></template>
  </DefaultTheme.Layout>
</template>
