/**
 * Auth Store — Dominio de autenticación
 *
 * Gestiona el perfil del usuario, el token de acceso y el estado de sesión.
 * Usa el storeId 'shell' (mismo que useSharedStore en @sipabanca/shared-state)
 * para que los MFEs lean el mismo store en memoria gracias al singleton de Pinia.
 *
 * Consumidores internos del Shell: usar useAuthStore() directamente.
 * Consumidores externos (MFEs): usar useSharedStore() de @sipabanca/shared-state.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type Keycloak from 'keycloak-js'
import type { AuthResult } from '@sipabanca/shared-auth'
import type { UserProfile } from '@sipabanca/shared-types'

export const useAuthStore = defineStore('shell', () => {
  // --- State ---
  const userProfile = ref<UserProfile | null>(null)
  const accessToken = ref<string | null>(null)
  const isAuthenticated = ref(false)

  // --- Getters ---
  const userRoles = computed(() => userProfile.value?.roles ?? [])
  const hasRole = (role: string) => userRoles.value.includes(role)

  // --- Actions ---

  /**
   * initFromAuth — Hidrata el store desde el AuthResult unificado (mock o Keycloak real).
   * Es el método principal de inicialización en main.ts.
   */
  function initFromAuth(auth: AuthResult) {
    if (!auth.authenticated) return

    isAuthenticated.value = true
    accessToken.value = auth.token
    userProfile.value = auth.userProfile
  }

  /**
   * initFromKeycloak — Compatibilidad con código legado.
   * Para nuevas integraciones preferir initFromAuth().
   */
  function initFromKeycloak(keycloak: Keycloak) {
    if (!keycloak.authenticated) return

    isAuthenticated.value = true
    accessToken.value = keycloak.token ?? null

    const parsed = keycloak.tokenParsed as Record<string, unknown>
    userProfile.value = {
      id: typeof parsed['sub'] === 'string' ? parsed['sub'] : '',
      username: typeof parsed['preferred_username'] === 'string' ? parsed['preferred_username'] : '',
      email: typeof parsed['email'] === 'string' ? parsed['email'] : '',
      fullName: typeof parsed['name'] === 'string' ? parsed['name'] : '',
      roles: (parsed['realm_access'] as { roles: string[] })?.roles ?? [],
    }
  }

  function setToken(token: string) {
    accessToken.value = token
  }

  /** Limpia únicamente el estado de autenticación. */
  function logout() {
    userProfile.value = null
    accessToken.value = null
    isAuthenticated.value = false
  }

  return {
    userProfile,
    accessToken,
    isAuthenticated,
    userRoles,
    hasRole,
    initFromAuth,
    initFromKeycloak,
    setToken,
    logout,
  }
})
