/**
 * env-config.ts — Registro central de variables de entorno
 *
 * ÚNICO LUGAR donde se leen las variables VITE_* del .env global.
 * El resto del código (MFEs, stores, servicios) importa desde aquí.
 * Nunca usar import.meta.env.VITE_* fuera de este archivo.
 *
 * Beneficios:
 *  - TypeScript valida que todas las variables existen
 *  - Si una variable cambia de nombre, el error es en un solo lugar
 *  - Los tests pueden mockear este módulo fácilmente
 */

export type AppEnvironment = 'development' | 'certification' | 'production'

export interface EnvConfig {
  /** Entorno actual */
  appEnv: AppEnvironment
  appVersion: string

  /** Configuración de Keycloak */
  keycloak: {
    url: string
    realm: string
    clientId: string
  }

  /**
   * Registro de URLs base de las APIs de backend.
   * Cada clave corresponde a un microservicio.
   * Consumir via:  createHttpClient(env.api.accounts)
   */
  api: {
    core: string
    accounts: string
    transfers: string
    notifications: string
  }

  /**
   * URLs de los remoteEntry.js de cada MFE (Module Federation).
   * El Shell las lee para registrar los remotes en tiempo de ejecución.
   */
  mfe: {
    dashboard: string
    accounts: string
    transfers: string
    legacy: string
    legacyBase: string
  }

  /** Timeout en ms para todas las instancias de Axios */
  httpTimeoutMs: number
}

function requireEnv(key: string): string {
  const value = import.meta.env[key]
  if (!value) {
    // En desarrollo lanzamos un error claro; en producción evitamos filtrar info
    if (import.meta.env.DEV) {
      throw new Error(
        `[env-config] Variable de entorno requerida no encontrada: "${key}"\n` +
        `Asegúrate de tener el archivo .env.development en la raíz del monorepo.`
      )
    }
    return ''
  }
  return value as string
}

/**
 * Configuración validada y tipada para el entorno actual.
 * Se evalúa UNA vez al cargar el módulo (build time en Vite).
 */
export const env: EnvConfig = {
  appEnv: (import.meta.env.VITE_APP_ENV ?? 'development') as AppEnvironment,
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.0.0',

  keycloak: {
    url: requireEnv('VITE_KEYCLOAK_URL'),
    realm: requireEnv('VITE_KEYCLOAK_REALM'),
    clientId: requireEnv('VITE_KEYCLOAK_CLIENT_ID'),
  },

  api: {
    core: requireEnv('VITE_API_CORE_URL'),
    accounts: requireEnv('VITE_API_ACCOUNTS_URL'),
    transfers: requireEnv('VITE_API_TRANSFERS_URL'),
    notifications: requireEnv('VITE_API_NOTIFICATIONS_URL'),
  },

  mfe: {
    dashboard: requireEnv('VITE_MFE_DASHBOARD_URL'),
    accounts: requireEnv('VITE_MFE_ACCOUNTS_URL'),
    transfers: requireEnv('VITE_MFE_TRANSFERS_URL'),
    legacy: requireEnv('VITE_MFE_LEGACY_URL'),
    legacyBase: requireEnv('VITE_MFE_LEGACY_BASE_URL'),
  },

  httpTimeoutMs: Number(import.meta.env.VITE_HTTP_TIMEOUT_MS ?? 15_000),
}

/** Helpers de conveniencia */
export const isDev = env.appEnv === 'development'
export const isCert = env.appEnv === 'certification'
export const isProd = env.appEnv === 'production'
