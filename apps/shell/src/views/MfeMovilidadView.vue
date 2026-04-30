<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const MfeMovilidad = defineAsyncComponent(() => import('mfe-movilidad/App'))
</script>

<template>
  <MfeMovilidad />
</template>
