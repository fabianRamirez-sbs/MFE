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
import './styles/global.scss'

async function bootstrap() {
  // 1. Autenticar (mock local o Keycloak real según el entorno)
  const auth = await initAuth({
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm: import.meta.env.VITE_KEYCLOAK_REALM,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    logoutRedirectUri: import.meta.env.VITE_KEYCLOAK_LOGOUT_REDIRECT_URI,
    onTokenRefreshed: (token) => {
      // Propagar el token actualizado a todos los MFEs via el store
      shellStore.setToken(token)
    },
  })

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  // 2. Hidratar el store global con los datos del usuario autenticado
  const shellStore = useShellStore()
  shellStore.initFromAuth(auth)

  // 3. Registrar router con guards de autenticación
  app.use(router)

  app.mount('#app')
}

bootstrap().catch(console.error)

