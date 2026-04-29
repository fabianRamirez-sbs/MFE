/**
 * createHttpClient — Fábrica de instancias Axios
 *
 * PATRÓN: Cada MFE llama a createHttpClient('accounts') y obtiene una instancia
 * preconfigurada que apunta al backend correcto según el entorno activo.
 * La URL se resuelve automáticamente desde env-config.ts (registro central).
 *
 * Incluye:
 *   - Inyección automática del Bearer token (desde el store compartido)
 *   - Renovación de token en respuestas 401
 *   - Manejo estandarizado de errores
 *   - Timeout global leído desde VITE_HTTP_TIMEOUT_MS
 */
import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { useSharedStore } from '@sipabanca/shared-state'
import { getKeycloak } from '@sipabanca/shared-auth'
import type { ApiError } from '@sipabanca/shared-types'
import { env, type EnvConfig } from './env-config'

/** Claves válidas del registro de APIs definido en .env */
export type ApiServiceKey = keyof EnvConfig['api']

export interface HttpClientConfig {
  /**
   * Clave del servicio tal como está en env.api (ej: 'accounts', 'transfers').
   * La URL se resuelve automáticamente según el entorno activo.
   * Usar `baseURL` solo si necesitas apuntar a una URL completamente arbitraria.
   */
  service?: ApiServiceKey
  /** Sobreescribe la URL base si necesitas una URL personalizada */
  baseURL?: string
  /** Headers adicionales específicos del MFE */
  headers?: Record<string, string>
}

export function createHttpClient(config: HttpClientConfig): AxiosInstance {
  const resolvedBaseURL = config.baseURL ?? env.api[config.service!]

  if (!resolvedBaseURL) {
    throw new Error(
      `[shared-http] No se pudo resolver la URL para el servicio "${config.service}". ` +
      `Verifica que VITE_API_${String(config.service).toUpperCase()}_URL esté definido en tu .env.`
    )
  }

  const instance = axios.create({
    baseURL: resolvedBaseURL,
    timeout: env.httpTimeoutMs,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-App': 'sipabanca-mfe',
      ...config.headers,
    },
  })

  // Interceptor de REQUEST: inyectar el token JWT
  instance.interceptors.request.use((req: InternalAxiosRequestConfig) => {
    const store = useSharedStore()
    if (store.accessToken) {
      req.headers.Authorization = `Bearer ${store.accessToken}`
    }
    return req
  })

  // Interceptor de RESPONSE: manejar 401 y errores API
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

      // Intentar renovar el token si el 401 es por expiración
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        try {
          const keycloak = getKeycloak()
          await keycloak.updateToken(30)
          return instance(originalRequest)
        } catch {
          // Token no renovable — forzar logout
          const store = useSharedStore()
          store.updatePreferences({}) // Trigger reactivo
          window.location.href = '/login'
        }
      }

      // Normalizar el error al formato ApiError
      const apiError: ApiError = {
        code: error.response?.data?.code ?? 'UNKNOWN_ERROR',
        message: error.response?.data?.message ?? error.message,
        details: error.response?.data?.details,
        traceId: error.response?.headers?.['x-trace-id'],
      }

      return Promise.reject(apiError)
    }
  )

  return instance
}
