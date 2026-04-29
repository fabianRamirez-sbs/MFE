/** Perfil del usuario autenticado */
export interface UserProfile {
  id: string
  username: string
  email: string
  fullName: string
  roles: string[]
}

/** Preferencias del usuario (persisten en localStorage) */
export interface UserPreferences {
  locale: 'es' | 'en'
  theme: 'light' | 'dark'
  currency: 'PEN' | 'USD' | 'EUR'
}

/** Respuesta genérica de la API */
export interface ApiResponse<T> {
  data: T
  meta?: {
    page?: number
    total?: number
    pageSize?: number
  }
}

/** Error estandarizado de la API */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
  traceId?: string
}

/** Contrato que todo MFE remoto debe satisfacer para ser cargado por el Shell */
export interface MfeManifest {
  name: string
  version: string
  routes: string[]
  requiredRoles: string[]
}

/**
 * Aplicación/perfil disponible para el usuario autenticado.
 * Se obtiene de GET /api-int/api/v1/sbs/getUserApp/user/{fullName}
 */
export interface UserApp {
  applicationCode: number
  profileCode: number
  applicationDescription: string
  profileDescription: string
}

/**
 * Aplicación seleccionada por el usuario en el PreLogin.
 * Se persiste en el store global para que todos los MFEs puedan leerla.
 */
export interface SelectedApp {
  applicationCode: number
  profileCode: number
  applicationDescription: string
  profileDescription: string
}
