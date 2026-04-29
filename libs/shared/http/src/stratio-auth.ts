/**
 * stratio-auth.ts — Autenticación Stratio (independiente de Keycloak)
 *
 * Las APIs heredadas de SipaNew usan un token Stratio, no el token Keycloak.
 * Este módulo obtiene ese token vía POST /api/v1/login con las credenciales
 * del .env y lo cachea para no repetir el login en cada request.
 *
 * Credenciales administradas por entorno:
 *   VITE_STRATIO_USER     → development: "test"  | cert: "sbs"  | prod: "sbs"
 *   VITE_STRATIO_PASSWORD → development: "123456"| cert: <real> | prod: <real>
 *
 * Uso:
 *   import { getStratioToken } from '@sipabanca/shared-http'
 *   const token = await getStratioToken()
 */
import axios from 'axios'
import { env } from './env-config'

interface StratioLoginResponse {
  /** Token retornado por el endpoint POST /api/v1/login */
  token: string
  [key: string]: unknown
}

interface StratioTokenCache {
  token: string
  /** Timestamp en ms — el token se considera válido hasta este momento */
  expiresAt: number
}

/** Duración de caché en ms — 55 min (los tokens Stratio suelen expirar en 1h) */
const CACHE_TTL_MS = 55 * 60 * 1000

let _cache: StratioTokenCache | null = null

/**
 * getStratioToken — Obtiene (o reutiliza desde caché) el token Stratio.
 *
 * @param force  Si es true, ignora el caché y hace login aunque el token vigente
 *               aún no haya expirado. Usar cuando la API retorna 401 con token cacheado.
 */
export async function getStratioToken(force = false): Promise<string> {
  const now = Date.now()

  if (!force && _cache && _cache.expiresAt > now) {
    return _cache.token
  }

  // Instancia axios limpia: sin interceptores de Keycloak
  const response = await axios.post<StratioLoginResponse>(
    `${env.api.stratioAuth}/api/v1/login`,
    {
      username: env.stratio.user,
      password: env.stratio.password,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const token = response.data.token

  _cache = {
    token,
    expiresAt: now + CACHE_TTL_MS,
  }

  return token
}

/**
 * clearStratioTokenCache — Invalida el token cacheado.
 * Llamar cuando una API devuelve 401 después de haber obtenido el token.
 */
export function clearStratioTokenCache(): void {
  _cache = null
}
