/**
 * AuthResult — Contrato normalizado que retorna initAuth()
 *
 * Tanto el flujo real (Keycloak) como el mock producen este mismo objeto.
 * El Shell Store y el resto del código solo conocen AuthResult,
 * nunca manipulan la instancia de Keycloak directamente.
 */
import type { UserProfile } from '@sipabanca/shared-types'

export interface AuthResult {
  authenticated: boolean
  token: string | null
  userProfile: UserProfile | null
  /** true cuando se usó el modo mock — nunca debe llegar a producción */
  isMock: boolean
  /**
   * Función para cerrar sesión.
   * En Keycloak redirige al IdP. En mock limpia el estado local.
   */
  logout: () => void
}
