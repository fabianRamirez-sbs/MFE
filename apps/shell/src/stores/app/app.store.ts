/**
 * App Store — Dominio de preferencias y aplicación seleccionada
 *
 * Gestiona las preferencias del usuario (locale, tema, divisa) y la aplicación
 * empresarial activa elegida en AppSelectView.
 *
 * El campo selectedApp es clave para el navigation guard del router:
 * un usuario autenticado sin app seleccionada es redirigido a /app-select.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserPreferences, SelectedApp } from '@sipabanca/shared-types'

const DEFAULT_PREFERENCES: UserPreferences = {
  locale: 'es',
  theme: 'light',
  currency: 'PEN',
}

export const useAppStore = defineStore('shell/app', () => {
  // --- State ---
  const preferences = ref<UserPreferences>({ ...DEFAULT_PREFERENCES })
  const selectedApp = ref<SelectedApp | null>(null)

  // --- Actions ---

  function updatePreferences(patch: Partial<UserPreferences>) {
    preferences.value = { ...preferences.value, ...patch }
  }

  function setSelectedApp(app: SelectedApp) {
    selectedApp.value = app
  }

  /** Limpia el estado de aplicación (usar al cerrar sesión). */
  function clear() {
    preferences.value = { ...DEFAULT_PREFERENCES }
    selectedApp.value = null
  }

  return {
    preferences,
    selectedApp,
    updatePreferences,
    setSelectedApp,
    clear,
  }
})
