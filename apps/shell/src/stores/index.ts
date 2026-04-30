/**
 * stores/index.ts — Punto de entrada público del sistema de stores del Shell
 *
 * Re-exporta los stores por dominio para nuevo código:
 *
 *   import { useAuthStore }       from '../stores'   // sesión / token / roles
 *   import { useNavigationStore } from '../stores'   // menú y módulos del login empresarial
 *   import { useAppStore }        from '../stores'   // app seleccionada y preferencias
 *
 * También exporta useShellStore() — facade que agrupa los tres stores bajo la misma
 * API que tenía el store monolítico original. Esto permite que el código existente
 * funcione sin modificaciones mientras se migra gradualmente a los stores individuales.
 */
import type { AuthResult } from '@sipabanca/shared-auth'
import type Keycloak from 'keycloak-js'
import type { UserPreferences, SelectedApp, LoginSessionResult } from '@sipabanca/shared-types'

export { useAuthStore } from './auth'
export { useNavigationStore } from './navigation'
export { useAppStore } from './app'

import { useAuthStore } from './auth'
import { useNavigationStore } from './navigation'
import { useAppStore } from './app'

/**
 * useShellStore — Facade de compatibilidad con el store monolítico original.
 *
 * Delega cada propiedad y acción al sub-store correspondiente.
 * La reactividad se preserva porque los getters acceden directamente a los stores
 * de Pinia (que son reactive() internamente), por lo que Vue rastrea las dependencias
 * correctamente dentro de templates y computeds.
 *
 * Para nuevo código se recomienda usar los stores individuales.
 */
export function useShellStore() {
  const auth = useAuthStore()
  const nav = useNavigationStore()
  const app = useAppStore()

  return {
    // ── Auth ────────────────────────────────────────────────────────────────
    get userProfile() { return auth.userProfile },
    get accessToken() { return auth.accessToken },
    get isAuthenticated() { return auth.isAuthenticated },
    get userRoles() { return auth.userRoles },
    hasRole: (role: string) => auth.hasRole(role),
    initFromAuth: (result: AuthResult) => auth.initFromAuth(result),
    initFromKeycloak: (keycloak: Keycloak) => auth.initFromKeycloak(keycloak),
    setToken: (token: string) => auth.setToken(token),

    // ── Navigation ──────────────────────────────────────────────────────────
    get userModules() { return nav.userModules },
    get appComponents() { return nav.appComponents },
    setUserSession: (result: LoginSessionResult) => nav.setUserSession(result),

    // ── App ─────────────────────────────────────────────────────────────────
    get preferences() { return app.preferences },
    get selectedApp() { return app.selectedApp },
    updatePreferences: (patch: Partial<UserPreferences>) => app.updatePreferences(patch),
    setSelectedApp: (selected: SelectedApp) => app.setSelectedApp(selected),

    // ── Composite ───────────────────────────────────────────────────────────
    /** Cierra la sesión completa: limpia auth, menú y app seleccionada. */
    logout() {
      auth.logout()
      nav.clear()
      app.clear()
    },
  }
}
