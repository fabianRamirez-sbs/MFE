<template>
  <component :is="MfeApp" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import MfeErrorView from './MfeErrorView.vue'

/**
 * Wrapper para cargar el MFE Dashboard vía Module Federation.
 * Vue Router NO acepta defineAsyncComponent directamente en las rutas —
 * hay que envolverlo en un componente normal con carga lazy.
 */
const MfeApp = defineAsyncComponent({
  loader: () => import('mfe-dashboard/App'),
  errorComponent: MfeErrorView,
  timeout: 10000,
})
</script>
