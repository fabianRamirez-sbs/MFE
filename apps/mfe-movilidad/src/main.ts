/**
 * main.ts — Entrada standalone del MFE Movilidad
 *
 * Permite desarrollar el MFE de forma independiente sin levantar el Shell.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { movilidadRoutes } from './router/routes'
import { createVuetify } from '@sipabanca/shared-ui'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App)
const pinia = createPinia()

const { useSharedStore } = await import('@sipabanca/shared-state')
app.use(pinia)
app.use(createVuetify())

const store = useSharedStore()
Object.assign(store, {
  isAuthenticated: true,
  userProfile: {
    id: 'dev-user-1',
    username: 'dev.user',
    email: 'dev@sipabanca.com',
    fullName: 'Developer User',
    roles: ['user', 'admin'],
  },
  accessToken: 'mock-token-for-development',
})

const router = createRouter({
  history: createWebHistory(),
  routes: movilidadRoutes,
})

app.use(router)
app.mount('#app')
