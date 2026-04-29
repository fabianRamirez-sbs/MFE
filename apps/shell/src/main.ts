/**
 * main.ts — Bootstrap del Shell
 *
 * ORDEN DE INICIALIZACIÓN (crítico):
 * 1. Auth: autenticar antes de montar la app
 *    - En development con VITE_AUTH_MOCK_ENABLED=true → mock, sin Keycloak
 *    - En certification / production → Keycloak real
 * 2. Pinia: crear el store global ANTES de montar Vue
 * 3. Router: registrar rutas dinámicas según roles del token
 * 4. Montar la instancia de Vue
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { initAuth } from '@sipabanca/shared-auth'
import { useShellStore } from './stores/shell.store'
import { getStratioToken } from '@sipabanca/shared-http'
import { createVuetify } from '@sipabanca/shared-ui'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './styles/global.scss'

async function bootstrap() {
  // 1. Autenticar en paralelo: Keycloak + Stratio (son independientes)
  const [auth] = await Promise.all([
    initAuth({
      url: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
      logoutRedirectUri: import.meta.env.VITE_KEYCLOAK_LOGOUT_REDIRECT_URI,
      onTokenRefreshed: (token) => {
        shellStore.setToken(token)
      },
    }),
    // Obtener token Stratio solo si el backend no es localhost
    // (en development local los backends no están levantados)
    !import.meta.env.VITE_API_STRATIO_AUTH_URL?.includes('localhost')
      ? getStratioToken().catch((err) => {
          console.warn('[bootstrap] No se pudo obtener el token Stratio:', err)
        })
      : Promise.resolve(),
  ])

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(createVuetify())

  // 2. Hidratar el store global con los datos del usuario autenticado
  const shellStore = useShellStore()
  shellStore.initFromAuth(auth)

  // En modo mock (desarrollo local) no existe flujo AppSelectView —
  // se establece una app dummy para que el navigation guard no bloquee la navegación.
  if (auth.isMock) {
    shellStore.setSelectedApp({
      applicationCode: 0,
      profileCode: 0,
      applicationDescription: 'Dev Mock',
      profileDescription: 'Desarrollo local',
    })
  }

  // 3. Registrar router con guards de autenticación
  app.use(router)

  app.mount('#app')
}

bootstrap().catch(console.error)

