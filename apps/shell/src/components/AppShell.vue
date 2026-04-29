<script setup lang="ts">
/**
 * AppShell.vue — Layout principal del Orquestador
 *
 * Responsabilidades:
 * - Renderizar la barra de navegación global
 * - Renderizar el sidebar de módulos
 * - Proveer el slot para el contenido del MFE activo
 * - Mostrar indicadores de carga mientras el MFE se inicializa
 */
import { useRouter } from 'vue-router'
import { useShellStore } from '../stores/shell.store'
import NavBar from './NavBar.vue'
import Sidebar from './Sidebar.vue'

const shellStore = useShellStore()
const router = useRouter()

function handleLogout() {
  shellStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <NavBar
      :user="shellStore.userProfile"
      @logout="handleLogout"
    />
    <div class="app-shell__body">
      <Sidebar :roles="shellStore.userRoles" />
      <main class="app-shell__content">
        <Suspense>
          <slot />
          <template #fallback>
            <div class="app-shell__loading">Cargando módulo...</div>
          </template>
        </Suspense>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;

  &__body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  &__content {
    flex: 1;
    overflow: auto;
    padding: var(--spacing-4);
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-secondary);
  }
}
</style>
