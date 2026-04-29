<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useShellStore } from '../stores/shell.store'
import NavBar from './NavBar.vue'
import Sidebar from './Sidebar.vue'

const shellStore = useShellStore()
const router = useRouter()
const drawer = ref(false)
const userModules = computed(() => shellStore.userModules)

function handleLogout() {
  shellStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <!-- ── App Bar (Vuetify layout — hijo directo de v-app) ── -->
  <v-app-bar density="compact" elevation="1" color="primary">
    <NavBar
      :user="shellStore.userProfile"
      @logout="handleLogout"
      @toggle-drawer="drawer = !drawer"
    />
  </v-app-bar>

  <!-- ── Navigation Drawer (Vuetify layout — hijo directo de v-app) ── -->
  <v-navigation-drawer v-model="drawer" temporary width="400">
    <div class="d-flex flex-column" style="height: 100%;">

      <!-- Encabezado fijo -->
      <div class="nav-drawer__header px-4 pt-4 pb-2 flex-shrink-0">
        <div class="d-flex justify-space-between align-center mb-1">
          <h2 class="text-h6 font-weight-bold">Productos en Línea</h2>
          <v-btn
            icon
            size="small"
            variant="outlined"
            aria-label="Cerrar menú"
            @click="drawer = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <p class="text-body-2 text-medium-emphasis">
          Para comenzar selecciona uno de los productos.
        </p>
      </div>

      <v-divider class="flex-shrink-0" />

      <!-- Contenido con scroll -->
      <div class="overflow-y-auto flex-grow-1">

        <!-- Sin módulos -->
        <div
          v-if="userModules.length === 0"
          class="pa-8 text-center text-medium-emphasis"
        >
          <v-icon size="48" class="mb-3">mdi-menu-open</v-icon>
          <p>No hay módulos disponibles</p>
        </div>

        <!-- Grupos de módulos -->
        <template
          v-for="moduleMenu in userModules"
          :key="moduleMenu.moduleApp.moduleTitle"
        >
          <div class="nav-drawer__module-header px-4 py-2 d-flex align-center">
            <v-icon size="18" color="primary" class="mr-2">mdi-view-grid-outline</v-icon>
            <span class="text-subtitle-2 font-weight-bold text-primary">
              {{ moduleMenu.moduleApp.moduleTitle }}
            </span>
          </div>

          <v-divider />

          <v-row no-gutters class="px-3 py-2">
            <v-col
              v-for="subModule in moduleMenu.subModuleProfileAppAuthenticate"
              :key="subModule.subModuleApp.moduleTitle"
              cols="4"
              class="pa-1"
            >
              <router-link
                :to="{ path: subModule.appComponent.path }"
                class="text-decoration-none"
                @click="drawer = false"
              >
                <v-card
                  variant="text"
                  rounded="lg"
                  class="nav-drawer__item d-flex flex-column align-center text-center pa-2"
                >
                  <v-icon size="28" color="primary" class="mb-1">
                    mdi-file-document-outline
                  </v-icon>
                  <span class="text-caption nav-drawer__item-label">
                    {{ subModule.subModuleApp.moduleTitle }}
                  </span>
                </v-card>
              </router-link>
            </v-col>
          </v-row>

          <v-divider />
        </template>
      </div>
    </div>
  </v-navigation-drawer>

  <!-- ── Contenido principal (Vuetify layout) ── -->
  <v-main>
    <div class="app-shell__body">
      <Sidebar :roles="shellStore.userRoles" />
      <div class="app-shell__content">
        <Suspense>
          <slot />
          <template #fallback>
            <div class="app-shell__loading">Cargando módulo...</div>
          </template>
        </Suspense>
      </div>
    </div>
  </v-main>
</template>

<style scoped lang="scss">
.app-shell {
  &__body {
    display: flex;
    height: 100%;
    overflow: hidden;
  }

  &__content {
    flex: 1;
    overflow: auto;
    padding: var(--spacing-4, 1rem);
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-secondary);
  }
}

.nav-drawer {
  &__header {
    background: rgba(var(--v-theme-primary), 0.04);
  }

  &__module-header {
    background: rgba(var(--v-theme-primary), 0.06);
  }

  &__item {
    min-height: 72px;
    transition: background 0.15s;

    &:hover {
      background: rgba(var(--v-theme-primary), 0.08) !important;
    }
  }

  &__item-label {
    line-height: 1.3;
    overflow-wrap: break-word;
    word-break: break-word;
  }
}
</style>
