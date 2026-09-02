<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import FieldNoteNotFound from './FieldNoteNotFound.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #not-found><FieldNoteNotFound /></template>
  </DefaultTheme.Layout>
</template>
