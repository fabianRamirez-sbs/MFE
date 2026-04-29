<template>
  <aside class="sidebar">
    <nav>
      <router-link v-if="hasRole('user')" to="/dashboard">Dashboard</router-link>
      <router-link v-if="hasRole('user')" to="/accounts">Cuentas</router-link>
      <router-link v-if="hasRole('transfers')" to="/transfers">Transferencias</router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
const props = defineProps<{ roles: string[] }>()
const hasRole = (r: string) => props.roles.includes(r)
</script>

<style scoped lang="scss">
.sidebar {
  width: 220px;
  background: var(--sb-color-surface, #fff);
  border-right: 1px solid var(--sb-color-border, #e2e8f0);
  padding: 1rem 0;

  nav { display: flex; flex-direction: column; }

  a {
    padding: 0.75rem 1.5rem;
    text-decoration: none;
    color: var(--sb-color-text-primary, #1a1a2e);
    &.router-link-active { background: var(--sb-color-primary-light, #e8eaf6); font-weight: 600; }
  }
}
</style>
