<script setup lang="ts">
/**
 * DashboardView.vue — Vista principal del MFE Dashboard
 *
 * Ejemplo canónico de cómo un MFE consume datos del Shell:
 * 1. useAuth() para datos del usuario autenticado
 * 2. useDashboardStore() para estado local del módulo
 * 3. createHttpClient() para llamadas API con token automático
 */
import { onMounted } from 'vue'
import { useAuth } from '@sipabanca/shared-auth'
import { SbButton } from '@sipabanca/shared-ui'
import { useDashboardStore } from '../stores/dashboard.store'

const auth = useAuth()
const store = useDashboardStore()

onMounted(() => {
  store.fetchSummary()
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <h1 class="dashboard__title">
        Bienvenido, {{ auth.user.value?.fullName ?? 'Usuario' }}
      </h1>
    </header>

    <section class="dashboard__summary">
      <div v-if="store.loading" class="dashboard__skeleton" />
      <template v-else>
        <div
          v-for="account in store.accounts"
          :key="account.id"
          class="dashboard__account-card"
        >
          <span>{{ account.name }}</span>
          <strong>{{ account.balance }}</strong>
        </div>
      </template>
    </section>

    <SbButton variant="primary" @click="store.fetchSummary">
      Actualizar
    </SbButton>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  padding: var(--spacing-4);

  &__header {
    margin-bottom: var(--spacing-6);
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__summary {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-6);
  }

  &__account-card {
    padding: var(--spacing-4);
    background: #fff;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__skeleton {
    height: 120px;
    background: var(--color-border);
    border-radius: var(--border-radius);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
}
</style>
