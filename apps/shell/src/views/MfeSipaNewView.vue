<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useShellStore } from '../stores/shell.store'
import { IframeBridge } from '@sipabanca/shared-utils'

const route = useRoute()
const shellStore = useShellStore()
const iframeRef = ref<HTMLIFrameElement | null>(null)
let bridge: IframeBridge | null = null

const sipaNewUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_MFE_SIPA_NEW_BASE_URL
  const pathMatch = route.params.pathMatch
  const subPath = Array.isArray(pathMatch) ? pathMatch.join('/') : (pathMatch ?? '')
  return subPath ? `${baseUrl}/${subPath}` : baseUrl
})

onMounted(() => {
  if (!iframeRef.value) return

  bridge = new IframeBridge(iframeRef.value, {
    onReady: () => {
      bridge?.send({
        type: 'AUTH_TOKEN',
        payload: { token: shellStore.accessToken },
      })
    },
    onMessage: (event) => {
      if (event.type === 'LOGOUT') {
        shellStore.logout()
      }
    },
  })
})

watch(
  () => shellStore.accessToken,
  (newToken) => {
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
