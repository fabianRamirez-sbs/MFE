/**
 * Navigation Store — Dominio de menú y módulos
 *
 * Almacena la estructura de navegación que devuelve el login empresarial
 * (POST /api/v1/sbs/login): módulos del menú lateral y componentes de app.
 *
 * Se hidrata en AppSelectView tras seleccionar una aplicación.
 * AppShell.vue lo consume para renderizar el menú desplegable dinámico.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ModuleMenu, AppComponent, LoginSessionResult } from '@sipabanca/shared-types'

export const useNavigationStore = defineStore('shell/navigation', () => {
  // --- State ---
  const userModules = ref<ModuleMenu[]>([])
  const appComponents = ref<AppComponent[]>([])

  // --- Actions ---

  /**
   * setUserSession — Carga el menú y los componentes tras el login empresarial.
   * Llamar después de verificar resultCode === 1 en POST /api/v1/sbs/login.
   */
  function setUserSession(result: LoginSessionResult) {
    userModules.value = result.moduleProfileAppAuthenticate ?? []
    appComponents.value = result.appComponents ?? []
  }

  /** Limpia el estado de navegación (usar al cerrar sesión). */
  function clear() {
    userModules.value = []
    appComponents.value = []
  }

  return {
    userModules,
    appComponents,
    setUserSession,
    clear,
  }
})
