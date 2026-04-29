/**
 * Shell Store (Pinia)
 *
 * Es el "contrato" de estado global que el Shell comparte con todos los MFEs.
 * Los MFEs NO importan este store directamente — lo consumen a través
 * de @sipabanca/shared-state, que re-exporta la interfaz tipada.
 *
 * Esto desacopla a los MFEs del Shell: si cambia la implementación interna,
 * el contrato público (IShellState) no cambia.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { KeycloakInstance } from 'keycloak-js'
import type { AuthResult } from '@sipabanca/shared-auth'
import type { UserProfile, UserPreferences } from '@sipabanca/shared-types'

export const useShellStore = defineStore('shell', () => {
  // --- State ---
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
  const hasRole = (role: string) => userRoles.value.includes(role)

  // --- Actions ---

  /**
   * initFromAuth — Método principal de hidratación.
   * Acepta el AuthResult unificado (mock o Keycloak real).
   * Úsalo en main.ts en lugar de initFromKeycloak.
   */
  function initFromAuth(auth: AuthResult) {
    if (!auth.authenticated) return

    isAuthenticated.value = true
    accessToken.value = auth.token
    userProfile.value = auth.userProfile
  }

  /**
   * initFromKeycloak — Compatibilidad con código existente.
   * Para nuevas integraciones preferir initFromAuth().
   */
  function initFromKeycloak(keycloak: KeycloakInstance) {
    if (!keycloak.authenticated) return

    isAuthenticated.value = true
    accessToken.value = keycloak.token ?? null

    const parsed = keycloak.tokenParsed as Record<string, unknown>
    userProfile.value = {
      id: String(parsed['sub'] ?? ''),
      username: String(parsed['preferred_username'] ?? ''),
      email: String(parsed['email'] ?? ''),
      fullName: String(parsed['name'] ?? ''),
      roles: (parsed['realm_access'] as { roles: string[] })?.roles ?? [],
    }
  }

  function setToken(token: string) {
    accessToken.value = token
  }

  function updatePreferences(patch: Partial<UserPreferences>) {
    preferences.value = { ...preferences.value, ...patch }
  }

  function logout() {
    userProfile.value = null
    accessToken.value = null
    isAuthenticated.value = false
  }

  return {
    userProfile,
    accessToken,
    isAuthenticated,
    preferences,
    userRoles,
    hasRole,
    initFromAuth,
    initFromKeycloak,
    setToken,
    updatePreferences,
    logout,
  }
})

