<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { withBase } from 'vitepress'
import NotFoundPage from './NotFoundPage.vue'
import { useLocale } from '../locale'

const { t, localeLink } = useLocale()
</script>

<template>
  <DefaultTheme.Layout>
    <template #sidebar-nav-before>
      <a class="sidebar-brand" :href="localeLink('/')" :aria-label="t('RFAStack home', 'Beranda RFAStack')">
        <img class="sidebar-brand__logo light" :src="withBase('/wordmark.svg')" alt="RFAStack">
        <img class="sidebar-brand__logo dark" :src="withBase('/wordmark-dark.svg')" alt="RFAStack">
      </a>
    </template>
    <template #not-found><NotFoundPage /></template>
  </DefaultTheme.Layout>
</template>
