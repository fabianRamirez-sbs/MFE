<script setup lang="ts">
/**
 * LegacyMfeWrapper.vue
 *
 * Estrategia de integración para el MFE Legacy (Vue 2).
 *
 * Modo IFRAME (recomendado para Fase 2):
 *   - Aislamiento total de estilos y JS
 *   - Comunicación vía postMessage (protocolo definido en shared-utils)
 *   - El Legacy puede leer su URL sin conocer al Shell
 *
 * Modo Module Federation (si el legacy es servido como remote):
 *   - Requiere que el proyecto Vue 2 tenga su propio vite.config con federation
 *   - Más frágil con dependencias compartidas (Vue 2 vs Vue 3)
 *   - Solo viable si se usa @vitejs/plugin-vue2 en el remote
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useShellStore } from '../stores/shell.store'
import { IframeBridge } from '@sipabanca/shared-utils'

const route = useRoute()
const shellStore = useShellStore()
const iframeRef = ref<HTMLIFrameElement | null>(null)
let bridge: IframeBridge | null = null

// Construir URL del legacy preservando el sub-path
// pathMatch es string[] cuando hay sub-ruta (/legacy/foo/bar) y "" cuando es solo /legacy
const legacyUrl = computed(() => {
  const basePath = import.meta.env.VITE_MFE_LEGACY_BASE_URL
  const pathMatch = route.params.pathMatch
  const subPath = Array.isArray(pathMatch) ? pathMatch.join('/') : (pathMatch ?? '')
  return subPath ? `${basePath}/${subPath}` : basePath
})

onMounted(() => {
  if (!iframeRef.value) return

  // Inicializar el bridge de comunicación Shell <-> iframe
  bridge = new IframeBridge(iframeRef.value, {
    // Enviar el token al legacy cuando el iframe esté listo
    onReady: () => {
      bridge?.send({
        type: 'AUTH_TOKEN',
        payload: { token: shellStore.accessToken },
      })
    },
    // Escuchar eventos del legacy (ej: navegación, logout)
    onMessage: (event) => {
      if (event.type === 'NAVIGATE') {
        // El legacy pide al shell navegar a otra ruta
      }
      if (event.type === 'LOGOUT') {
        shellStore.logout()
      }
    },
  })
})

// Reactivo: cuando el token se renueve, notificar al iframe
watch(
  () => shellStore.accessToken,
  (newToken) => {
    bridge?.send({ type: 'AUTH_TOKEN', payload: { token: newToken } })
  }
)

onUnmounted(() => {
  bridge?.destroy()
})

import { computed } from 'vue'
</script>

<template>
  <div class="legacy-wrapper">
    <iframe
      ref="iframeRef"
      :src="legacyUrl"
      class="legacy-wrapper__frame"
      title="Módulo legacy SipaBanca"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  </div>
</template>

<style scoped>
.legacy-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.legacy-wrapper__frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
