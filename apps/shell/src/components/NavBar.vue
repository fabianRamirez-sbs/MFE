<template>
  <nav class="navbar">
    <div class="navbar__brand">SipaBanca</div>
    <div class="navbar__user" v-if="user">
      <span>{{ user.fullName }}</span>
      <button @click="$emit('logout')">Cerrar sesión</button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import type { UserProfile } from '@sipabanca/shared-types'

defineProps<{ user: UserProfile | null }>()
defineEmits<{ logout: [] }>()
</script>

<style scoped lang="scss">
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 56px;
  background: var(--sb-color-primary, #1a1a2e);
  color: #fff;

  &__brand { font-weight: 700; font-size: 1.2rem; }
  &__user { display: flex; align-items: center; gap: 1rem; }
}
</style>
