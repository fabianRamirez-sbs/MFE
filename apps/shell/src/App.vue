<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppShell from './components/AppShell.vue'
</script>

<template>
  <v-app>
    <AppShell>
      <RouterView />
    </AppShell>
  </v-app>
</template>
