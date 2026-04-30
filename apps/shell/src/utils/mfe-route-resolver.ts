/**
 * mfe-route-resolver.ts
 *
 * Resuelve hacia qué ruta del Shell debe navegar un ítem del menú dinámico.
 *
 * Estrategia (en orden de prioridad):
 *   1. Si `appComponent.mfe` está definido (enviado por el backend), se usa directamente.
 *   2. Si `appComponent.component` coincide con algún patrón de MFE_PATTERNS, se usa ese MFE.
 *   3. Fallback: `/sipa-new/` (legacy Vue 2).
 *
 * Para agregar un nuevo MFE (ej: mfe-seguros en /seguros/), solo hay que añadir
 * una entrada en MFE_PATTERNS sin tocar ningún otro archivo.
 */

import type { AppComponent, MfeTarget } from '@sipabanca/shared-types'

/** Configuración de patrones de componente → MFE destino */
interface MfePatternRule {
  /**
   * Expresión regular aplicada sobre `appComponent.component`.
   * Ejemplos:
   *   /^views\/Dashboard/ -- componentes bajo views/Dashboard/...
   *   /^views\/Seguros/   -- componentes bajo views/Seguros/...
   */
  pattern: RegExp
  mfe: MfeTarget
}

/**
 * Tabla de patrones para resolución automática.
 *
 * CÓMO AÑADIR UN NUEVO MFE:
 *   { pattern: /^views\/MiNuevoModulo/, mfe: 'mi-nuevo-mfe' },
 *
 * El Shell debe tener una ruta registrada con ese mismo prefijo, ej:
 *   { path: '/mi-nuevo-mfe/:pathMatch(.*)*', component: () => import('../views/MfeMiNuevoView.vue') }
 */
const MFE_PATTERNS: MfePatternRule[] = [
  // Para agregar un nuevo MFE descomenta y ajusta la regla:
  // { pattern: /^views\/Dashboard/, mfe: 'dashboard' },
  // { pattern: /^views\/Seguros/, mfe: 'mfe-seguros' },
] as MfePatternRule[]

/**
 * Determina el MFE destino para un AppComponent dado.
 *
 * @param appComponent - Entrada del menú dinámico proveniente de POST /api/v1/sbs/login
 * @returns MfeTarget - identificador del MFE ('sipa-new', 'dashboard', etc.)
 */
export function resolveMfeTarget(appComponent: AppComponent): MfeTarget {
  // 1. El backend ya indicó explícitamente el MFE destino
  if (appComponent.mfe) {
    return appComponent.mfe
  }

  // 2. Buscar coincidencia por patrón en el campo `component`
  for (const rule of MFE_PATTERNS) {
    if (rule.pattern.test(appComponent.component)) {
      return rule.mfe
    }
  }

  // 3. Fallback: MFE legacy (mfe-sipa-new)
  return 'sipa-new'
}

/**
 * Construye la ruta completa del Shell para un ítem del menú.
 *
 * El path resultante es el que se pasa a <router-link :to="...">
 * o a router.push().
 *
 * Ejemplos:
 *   resolveMfeRoute({ path: 'EntidadesFinancieras', component: 'views/EntidadesFinancieras/index', name: 'ef' })
 *   → '/sipa-new/EntidadesFinancieras'
 *
 *   resolveMfeRoute({ path: 'resumen', component: 'views/Dashboard/resumen', name: 'dash', mfe: 'dashboard' })
 *   → '/dashboard/resumen'
 *
 * @param appComponent - Entrada del menú dinámico
 * @returns Ruta completa del Shell, lista para usar con vue-router
 */
export function resolveMfeRoute(appComponent: AppComponent): string {
  const mfe = resolveMfeTarget(appComponent)
  // encodeURIComponent para soportar rutas con espacios (ej: "Consulta Copropiedades")
  const subPath = encodeURIComponent(appComponent.path)
  return `/${mfe}/${subPath}`
}
