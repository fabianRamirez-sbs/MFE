/**
 * @sipabanca/shared-auth
 *
 * Wrapper sobre keycloak-js que:
 * 1. Abstrae la inicialización y renovación de tokens
 * 2. Provee el cliente Keycloak como singleton (mismo en host y remotes)
 * 3. Expone un composable useAuth() para que los MFEs consuman
 *    el estado de autenticación SIN depender del Shell directamente
 *
 * Punto de entrada principal: initAuth()
 *   - En development con VITE_AUTH_MOCK_ENABLED=true → mock, sin Keycloak
 *   - En cualquier otro caso → Keycloak real
 */
import Keycloak from 'keycloak-js'
import type { KeycloakConfig } from 'keycloak-js'
import type { AuthResult } from './auth-result'
import { buildMockAuthResult } from './mock-auth'

export interface AuthConfig extends KeycloakConfig {
  /** Intervalo en segundos para renovar el token antes de que expire */
  tokenRefreshInterval?: number
  onTokenRefreshed?: (token: string) => void
}

let _keycloakInstance: Keycloak | null = null

/**
 * initAuth — Punto de entrada unificado para autenticación.
 *
 * Selecciona automáticamente el flujo según el entorno:
 *  - VITE_APP_ENV=development + VITE_AUTH_MOCK_ENABLED=true → mock local
 *  - cualquier otro caso → Keycloak real
 *
 * Uso en main.ts del Shell:
 *   const auth = await initAuth({ url, realm, clientId, onTokenRefreshed })
 *   shellStore.initFromAuth(auth)
 */
export async function initAuth(config: AuthConfig): Promise<AuthResult> {
  const isMockEnabled = import.meta.env.VITE_AUTH_MOCK_ENABLED === 'true'
  const isDev = import.meta.env.VITE_APP_ENV === 'development'

  if (isMockEnabled && isDev) {
    return buildMockAuthResult()
  }

  // Guardia de seguridad: bloquear mock fuera de development
  if (isMockEnabled && !isDev) {
    console.error(
      '[shared-auth] VITE_AUTH_MOCK_ENABLED=true detectado fuera de development. ' +
      'Se ignora y se usa Keycloak real.'
    )
  }

  const keycloak = await initKeycloak(config)

  return {
    authenticated: keycloak.authenticated ?? false,
    isMock: false,
    token: keycloak.token ?? null,
    userProfile: keycloak.authenticated && keycloak.tokenParsed
      ? buildProfileFromToken(keycloak.tokenParsed as Record<string, unknown>)
      : null,
    logout: () => keycloak.logout(),
  }
}

/**
 * initKeycloak — Inicializa Keycloak real.
 * Llamar directamente solo si se necesita la instancia de Keycloak.
 * Para el flujo normal usar initAuth().
 */
export async function initKeycloak(config: AuthConfig): Promise<Keycloak> {
  if (_keycloakInstance) {
    console.warn('[shared-auth] Keycloak ya fue inicializado. Se retorna la instancia existente.')
    return _keycloakInstance
  }

  const keycloak = new Keycloak({
    url: config.url,
    realm: config.realm!,
    clientId: config.clientId!,
  })

  await keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false,
    pkceMethod: 'S256',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  })

  _keycloakInstance = keycloak

  const interval = config.tokenRefreshInterval ?? 60
  setInterval(async () => {
    try {
      const refreshed = await keycloak.updateToken(interval)
      if (refreshed && keycloak.token && config.onTokenRefreshed) {
        config.onTokenRefreshed(keycloak.token)
      }
    } catch {
      console.error('[shared-auth] Sesión expirada — redirigiendo al login')
      keycloak.logout()
    }
  }, interval * 1000)

  return keycloak
}

/**
 * getKeycloak — Retorna la instancia activa de Keycloak.
 * Lanza si se llama en modo mock (no hay instancia real).
 */
export function getKeycloak(): Keycloak {
  if (!_keycloakInstance) {
    throw new Error(
      '[shared-auth] No hay instancia de Keycloak disponible. ' +
      'Si estás en modo mock, usa el store compartido en lugar de getKeycloak().'
    )
  }
  return _keycloakInstance
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function buildProfileFromToken(parsed: Record<string, unknown>) {
  return {
    id: String(parsed['sub'] ?? ''),
    username: String(parsed['preferred_username'] ?? ''),
    email: String(parsed['email'] ?? ''),
    fullName: String(parsed['name'] ?? ''),
    roles: (parsed['realm_access'] as { roles: string[] })?.roles ?? [],
  }
}

export { Keycloak }
