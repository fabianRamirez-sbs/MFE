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

// ── Menú dinámico (resultado de POST /api/v1/sbs/login) ─────────────────────

/** Ruta de componente registrada dinámicamente en el router del Shell */
export interface AppComponent {
  /** Segmento de URL, ej: "polizas/nueva" */
  path: string
  /** Ruta relativa al directorio views del legacy, ej: "views/Polizas/Nueva" */
  component: string
  /** Nombre de la ruta para vue-router */
  name: string
}

/** Información del módulo padre en el menú lateral */
export interface ModuleApp {
  moduleTitle: string
  /** Nombre del archivo de ícono dentro de /assets/images/nav/ */
  image: string
}

/** Sub-módulo dentro de un grupo de menú */
export interface SubModuleApp {
  moduleTitle: string
  image: string
}

/** Entrada de sub-módulo con su componente asociado */
export interface SubModuleEntry {
  subModuleApp: SubModuleApp
  appComponent: AppComponent
}

/**
 * Grupo de menú con sus sub-módulos.
 * Mapea `resultObject.moduleProfileAppAuthenticate` del endpoint
 * POST /api-int/api/v1/sbs/login.
 */
export interface ModuleMenu {
  moduleApp: ModuleApp
  subModuleProfileAppAuthenticate: SubModuleEntry[]
}

/**
 * Resultado relevante del endpoint POST /api-int/api/v1/sbs/login.
 * El servidor retorna { resultObject: LoginSessionResult }.
 */
export interface LoginSessionResult {
  resultCode: number
  person: Record<string, unknown>
  appComponents: AppComponent[]
  moduleProfileAppAuthenticate: ModuleMenu[]
  profileApp: {
    profileCode: number
    applicationCode: number
  }
  userAppId: number
  status?: {
    code: string
    message: string
  }
}
