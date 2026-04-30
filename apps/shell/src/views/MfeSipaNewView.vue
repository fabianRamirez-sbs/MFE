<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useShellStore } from '../stores/shell.store'
import { IframeBridge } from '@sipabanca/shared-utils'

const route = useRoute()
const shellStore = useShellStore()
const iframeRef = ref<HTMLIFrameElement | null>(null)
let bridge: IframeBridge | null = null

// El iframe siempre carga la URL base — mfe-sipa-new usa router en modo "abstract"
// por lo que la sub-ruta no se puede poner en la URL. La navegación se hace
// vía postMessage (AUTH_SESSION con targetPath + mensajes NAVIGATE subsiguientes).
const sipaNewUrl = computed(() => import.meta.env.VITE_MFE_SIPA_NEW_BASE_URL as string)

/** Devuelve el path relativo de mfe-sipa-new según la ruta activa del Shell */
function getCurrentSubPath(): string {
  const pathMatch = route.params.pathMatch
  // Vue Router 4 decodifica los params automáticamente: si la URL tiene %20,
  // pathMatch tendrá el espacio literal. Lo enviamos SIN re-encodar porque
  // Vue Router 3 (en mfe-sipa-new, modo abstract) registra rutas como strings
  // literales (ej: "/Consulta Copropiedades") y compara directamente.
  const raw = Array.isArray(pathMatch) ? pathMatch.join('/') : (pathMatch ?? '')
  return raw ? '/' + raw : '/'
}

onMounted(() => {
  if (!iframeRef.value) return

  bridge = new IframeBridge(iframeRef.value, {
    // Debe coincidir con el origen real de mfe-sipa-new para que
    // postMessage no sea descartado por el browser en ambas direcciones
    allowedOrigin: import.meta.env.VITE_MFE_SIPA_NEW_BASE_URL,
    onReady: () => {
      // Enviar sesión completa + ruta inicial para que mfe-sipa-new hidrate su
      // Vuex store y navegue al componente correcto sin hacer su propio /login.
      // JSON.parse/stringify es necesario para quitar los Proxies reactivos de
      // Pinia — postMessage usa structured clone y falla con Proxy objects.
      bridge?.send({
        type: 'AUTH_SESSION',
        payload: {
          token: shellStore.accessToken ?? '',
          user: shellStore.userProfile?.fullName ?? '',
          email: shellStore.userProfile?.email ?? '',
          profileUser: {},
          componentsUser: JSON.parse(JSON.stringify(shellStore.appComponents ?? [])),
          modulesUser: JSON.parse(JSON.stringify(shellStore.userModules ?? [])),
          profileApp: {
            profileCode: shellStore.selectedApp?.profileCode ?? 0,
            applicationCode: shellStore.selectedApp?.applicationCode ?? 0,
          },
          userAppId: 0,
          targetPath: getCurrentSubPath(),
        },
      })
    },
    onMessage: (event) => {
      if (event.type === 'LOGOUT') {
        shellStore.logout()
      }
    },
  })
})

// Cuando el usuario cambia de módulo en el drawer del Shell, actualizar la
// ruta dentro del iframe sin recargarlo (evita perder el estado de mfe-sipa-new)
watch(
  () => route.params.pathMatch,
  () => {
    bridge?.send({ type: 'NAVIGATE', payload: { path: getCurrentSubPath() } })
  }
)

watch(
  () => shellStore.accessToken,
  (newToken) => {
    // Solo actualizar el token cuando rota — la sesión completa ya fue enviada en onReady
    bridge?.send({ type: 'AUTH_TOKEN', payload: { token: newToken } })
  }
)

onUnmounted(() => {
  bridge?.destroy()
})
</script>

<template>
  <div class="sipa-new-wrapper">
    <iframe
      ref="iframeRef"
      :src="sipaNewUrl"
      class="sipa-new-wrapper__frame"
      title="SipaNew"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  </div>
</template>

<style scoped>
.sipa-new-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sipa-new-wrapper__frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
