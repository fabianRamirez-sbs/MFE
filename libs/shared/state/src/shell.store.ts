/**
 * shared-state — Store Pinia compartido entre Shell y MFEs
 *
 * ESTRATEGIA DE COMUNICACIÓN SIN ACOPLAMIENTO:
 *
 * En lugar de que los MFEs importen el store del Shell directamente
 * (lo cual crearía un acoplamiento de módulo), definimos aquí un store
 * "espejo" con el mismo storeId ('shell').
 *
 * Gracias a que Pinia es singleton (compartido via Module Federation),
 * ambas definiciones operan sobre el MISMO store en memoria.
 * El Shell lo hidrata; los MFEs solo lo leen (o escriben preferencias).
 *
 * Resultado: Cero imports directos entre apps. El contrato es el storeId.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, UserPreferences } from '@sipabanca/shared-types'

export const useSharedStore = defineStore('shell', () => {
  // --- State (read-only para los MFEs) ---
  const userProfile = ref<UserProfile | null>(null)
  const accessToken = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const preferences = ref<UserPreferences>({
    locale: 'es',
    theme: 'light',
    currency: 'PEN',
  })

  // --- Getters ---
  const userRoles = computed(() => userProfile.value?.roles ?? [])

  // --- Actions permitidas a los MFEs ---
  function updatePreferences(patch: Partial<UserPreferences>) {
    preferences.value = { ...preferences.value, ...patch }
  }

  return {
    userProfile,
    accessToken,
    isAuthenticated,
    preferences,
    userRoles,
    updatePreferences,
  }
})
