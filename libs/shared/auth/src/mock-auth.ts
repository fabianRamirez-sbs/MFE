/**
 * mock-auth.ts — Autenticación simulada para desarrollo local
 *
 * Se activa cuando VITE_AUTH_MOCK_ENABLED=true en .env.development.
 * Lee el usuario directamente del .env y construye un AuthResult
 * sin realizar ninguna petición a Keycloak.
 *
 * SEGURIDAD:
 *  - La guardia de entorno en initAuth() impide que este módulo
 *    se ejecute en certification o production, aunque alguien
 *    ponga VITE_AUTH_MOCK_ENABLED=true por error.
 *  - El token mock NUNCA llega a un backend real en producción.
 */
import type { AuthResult } from './auth-result'

export function buildMockAuthResult(): AuthResult {
  const rolesRaw = import.meta.env.VITE_AUTH_MOCK_ROLES ?? 'user'
  const roles = String(rolesRaw)
    .split(',')
    .map((r: string) => r.trim())
    .filter(Boolean)

  console.warn(
    '[shared-auth] ⚠️  Modo MOCK activado.\n' +
    `  Usuario : ${import.meta.env.VITE_AUTH_MOCK_FULL_NAME}\n` +
    `  Email   : ${import.meta.env.VITE_AUTH_MOCK_EMAIL}\n` +
    `  Roles   : ${roles.join(', ')}\n` +
    '  Keycloak NO se está usando. Solo válido en desarrollo local.'
  )

  return {
    authenticated: true,
    isMock: true,
    token: import.meta.env.VITE_AUTH_MOCK_TOKEN ?? 'mock-token',
    userProfile: {
      id: import.meta.env.VITE_AUTH_MOCK_USER_ID ?? 'mock-001',
      username: import.meta.env.VITE_AUTH_MOCK_USERNAME ?? 'mock.user',
      email: import.meta.env.VITE_AUTH_MOCK_EMAIL ?? 'mock@sipabanca.com',
      fullName: import.meta.env.VITE_AUTH_MOCK_FULL_NAME ?? 'Mock User',
      roles,
    },
    logout: () => {
      // En mock: recargar la página simula un "logout"
      window.location.reload()
    },
  }
}
