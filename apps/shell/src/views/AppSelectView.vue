<template>
  <div class="app-select">
    <div v-if="loading" class="app-select__loading">
      <span>Cargando aplicaciones...</span>
    </div>

    <div v-else-if="error" class="app-select__error">
      <p>{{ error }}</p>
      <button @click="loadApps">Reintentar</button>
    </div>

    <div v-else class="app-select__cards">
      <div
        v-for="app in apps"
        :key="`${app.applicationCode}-${app.profileCode}`"
        class="app-select__card"
        @click="selectApp(app)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path d="M12.5 17.5H8.75" stroke="#9E1C64" stroke-width="2" stroke-linecap="round"/>
          <path d="M16.25 21.25H8.75" stroke="#9E1C64" stroke-width="2" stroke-linecap="round"/>
          <path d="M7 25H23C24.1046 25 25 24.1046 25 23V7C25 5.89543 24.1046 5 23 5H7C5.89543 5 5 5.89543 5 7V23C5 24.1046 5.89543 25 7 25Z" stroke="#9E1C64" stroke-width="2" stroke-linecap="round"/>
          <rect x="16.25" y="8.75" width="5" height="5" rx="1" stroke="#9E1C64" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h3>{{ app.applicationDescription }}</h3>
        <p><strong>Perfil:</strong> {{ app.profileDescription }}</p>
        <button class="app-select__btn" :disabled="selecting">
          {{ selecting ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShellStore } from '../stores/shell.store'
import { integrationHttp } from '@sipabanca/shared-http'
import { getStratioToken } from '@sipabanca/shared-http'
import type { UserApp, SelectedApp } from '@sipabanca/shared-types'

const router = useRouter()
const shellStore = useShellStore()

const apps = ref<UserApp[]>([])
const loading = ref(false)
const selecting = ref(false)
const error = ref<string | null>(null)

async function loadApps() {
  if (!shellStore.userProfile?.fullName) {
    error.value = 'No se pudo obtener el nombre del usuario'
    return
  }

  loading.value = true
  error.value = null

  try {
    const stratioToken = await getStratioToken()
    const encodedName = encodeURIComponent(shellStore.userProfile.fullName)

    const { data } = await integrationHttp.get(
      `/api/v1/sbs/getUserApp/user/${encodedName}`,
      { headers: { Authorization: `Bearer ${stratioToken}` } }
    )

    const rawList: Array<{
      applicationCode: number
      profileCode: number
      applicationDTO: { applicationDescription: string }
      profileAppDTO: { profileDescription: string }
    }> = data.userAppPreLoginDTO ?? []

    apps.value = rawList.map((item) => ({
      applicationCode: item.applicationCode,
      profileCode: item.profileCode,
      applicationDescription: item.applicationDTO.applicationDescription,
      profileDescription: item.profileAppDTO.profileDescription,
    }))

    // Si solo hay una app, seleccionarla automáticamente
    if (apps.value.length === 1) {
      await selectApp(apps.value[0])
    }
  } catch (err) {
    console.error('[AppSelectView] Error al cargar aplicaciones:', err)
    error.value = 'No se pudieron cargar las aplicaciones. Intente nuevamente.'
  } finally {
    loading.value = false
  }
}

async function selectApp(app: UserApp) {
  selecting.value = true
  error.value = null

  try {
    const stratioToken = await getStratioToken()

    // login2: establece la sesión del usuario para la aplicación seleccionada
    await integrationHttp.post(
      '/api/v1/sbs/login2',
      {
        user: shellStore.userProfile?.fullName,
        email: shellStore.userProfile?.email,
        applicationCode: app.applicationCode,
      },
      { headers: { Authorization: `Bearer ${stratioToken}` } }
    )

    const selected: SelectedApp = {
      applicationCode: app.applicationCode,
      profileCode: app.profileCode,
      applicationDescription: app.applicationDescription,
      profileDescription: app.profileDescription,
    }

    shellStore.setSelectedApp(selected)

    router.push('/dashboard')
  } catch (err) {
    console.error('[AppSelectView] Error al seleccionar aplicación:', err)
    error.value = 'No se pudo ingresar a la aplicación. Intente nuevamente.'
  } finally {
    selecting.value = false
  }
}

onMounted(() => loadApps())
</script>

<style scoped>
.app-select {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 0 100px;
}

.app-select__loading,
.app-select__error {
  text-align: center;
  font-size: 1rem;
  color: #555;
}

.app-select__error button {
  margin-top: 12px;
  padding: 8px 20px;
  background: #9E1C64;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.app-select__cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
}

.app-select__card {
  border: 2px solid #9E1C64;
  border-radius: 10px;
  padding: 24px 20px;
  width: calc(33.33% - 14px);
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.app-select__card:hover {
  box-shadow: 0 4px 16px rgba(158, 28, 100, 0.2);
}

.app-select__card h3 {
  font-size: 1rem;
  margin: 0;
  color: #222;
}

.app-select__card p {
  font-size: 0.9rem;
  color: #555;
  margin: 0;
}

.app-select__btn {
  background-color: #9E1C64;
  color: white;
  border: none;
  padding: 6px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.app-select__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
