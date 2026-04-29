<template>
  <v-app-bar-nav-icon
    color="white"
    aria-label="Abrir menú lateral"
    @click="$emit('toggle-drawer')"
  />

  <v-app-bar-title>
    <router-link to="/dashboard" class="navbar__brand text-decoration-none">
      <strong class="text-white">SipaBanca</strong>
    </router-link>
  </v-app-bar-title>

  <v-spacer />

  <span v-if="user" class="text-white text-body-2 mr-4">
    {{ user.fullName }}
  </span>

  <v-btn
    icon
    size="small"
    color="white"
    variant="text"
    aria-label="Cerrar sesión"
    @click="$emit('logout')"
  >
    <v-icon>mdi-logout</v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import type { UserProfile } from '@sipabanca/shared-types'

defineProps<{ user: UserProfile | null }>()
defineEmits<{ logout: []; 'toggle-drawer': [] }>()
</script>
