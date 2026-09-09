<script setup lang="ts">
import { useLocale } from '../locale'

const { t, localeLink } = useLocale()
</script>

<template>
  <main class="not-found">
    <p class="manual-index">{{ t('PAGE / 404', 'HALAMAN / 404') }}</p>
    <h1>{{ t("This page doesn't exist.", 'Halaman ini tidak ditemukan.') }}</h1>
    <p>{{ t('The link may be outdated, or the page may have moved.', 'Tautan mungkin sudah lama, atau halaman telah dipindahkan.') }}</p>
    <a class="manual-button" :href="localeLink('/')">{{ t('Return to the guide', 'Kembali ke panduan') }}</a>
  </main>
</template>
