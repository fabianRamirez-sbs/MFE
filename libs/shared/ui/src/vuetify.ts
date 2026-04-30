/**
 * vuetify.ts — Fábrica de instancia Vuetify para SipaBanca
 *
 * TREESHAKING EN MICROFRONTENDS:
 *   vite-plugin-vuetify (autoImport: true) escanea cada template en build-time
 *   e importa únicamente los componentes Vuetify que esa app realmente usa.
 *
 *   Declarar Vuetify como `singleton: true` en Module Federation garantiza que
 *   en runtime el Shell provee UNA sola instancia compartida con todos los MFEs,
 *   eliminando duplicación de código y conflictos de instancia.
 *
 * TEMAS POR MFE:
 *   Todos los temas se registran aquí. Cada MFE/layout elige el suyo envolviendo
 *   su contenido con <MfeThemeProvider theme="nombreTema"> (shared-ui).
 *
 *   Temas disponibles:
 *     sipabancaLight    → Global claro (shell, login, app-select)
 *     sipabancaDark     → Global oscuro
 *     dashboardTheme    → Dashboard: azul profundo, datos
 *     accountsTheme     → Cuentas/ahorro: verde institucional
 *     transfersTheme    → Transferencias: índigo, formularios
 *
 * ICONOS:
 *   Usa @mdi/font (CSS class-based). Importar una vez en el Shell:
 *     import '@mdi/font/css/materialdesignicons.css'
 */
import { createVuetify as _createVuetify, type ThemeDefinition } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// ── Temas globales ──────────────────────────────────────────────────────────

const sipabancaLight: ThemeDefinition = {
  dark: false,
  colors: {
    primary:              '#9E1C64',
    'primary-darken-1':   '#7A1549',
    secondary:            '#2563eb',
    'secondary-darken-1': '#1d4ed8',
    background:           '#f9fafb',
    surface:              '#ffffff',
    error:                '#ef4444',
    warning:              '#f59e0b',
    success:              '#22c55e',
    info:                 '#3b82f6',
  },
}

const sipabancaDark: ThemeDefinition = {
  dark: true,
  colors: {
    primary:              '#c9266e',
    'primary-darken-1':   '#9E1C64',
    secondary:            '#3b82f6',
    background:           '#111827',
    surface:              '#1f2937',
    error:                '#ef4444',
    warning:              '#f59e0b',
    success:              '#22c55e',
    info:                 '#60a5fa',
  },
}

// ── Temas por MFE ───────────────────────────────────────────────────────────

/** Dashboard: azul profundo para visualización de datos */
const dashboardTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary:              '#1e40af',
    'primary-darken-1':   '#1e3a8a',
    secondary:            '#0891b2',
    'secondary-darken-1': '#0e7490',
    background:           '#f0f4ff',
    surface:              '#ffffff',
    error:                '#ef4444',
    warning:              '#f59e0b',
    success:              '#22c55e',
    info:                 '#3b82f6',
  },
}

/** Cuentas/Ahorro: verde para transmitir solidez financiera */
const accountsTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary:              '#166534',
    'primary-darken-1':   '#14532d',
    secondary:            '#0f766e',
    'secondary-darken-1': '#0d6b63',
    background:           '#f0fdf4',
    surface:              '#ffffff',
    error:                '#ef4444',
    warning:              '#f59e0b',
    success:              '#16a34a',
    info:                 '#0891b2',
  },
}

/** Transferencias: índigo para formularios y flujos de acción */
const transfersTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary:              '#4338ca',
    'primary-darken-1':   '#3730a3',
    secondary:            '#7c3aed',
    'secondary-darken-1': '#6d28d9',
    background:           '#f5f3ff',
    surface:              '#ffffff',
    error:                '#ef4444',
    warning:              '#f59e0b',
    success:              '#22c55e',
    info:                 '#6366f1',
  },
}

/** Movilidad: naranja energético para seguros de transporte y vehículos */
const movilidadTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary:              '#c2410c',
    'primary-darken-1':   '#9a3412',
    secondary:            '#b45309',
    'secondary-darken-1': '#92400e',
    background:           '#fff7ed',
    surface:              '#ffffff',
    error:                '#ef4444',
    warning:              '#f59e0b',
    success:              '#22c55e',
    info:                 '#0ea5e9',
  },
}

// ── Defaults globales ──────────────────────────────────────────────────────

const globalDefaults = {
  VBtn: {
    variant: 'elevated' as const,
    rounded: 'sm',
    color: 'primary',
  },
  VTextField: {
    variant: 'outlined' as const,
    density: 'comfortable' as const,
    color: 'primary',
  },
  VSelect: {
    variant: 'outlined' as const,
    density: 'comfortable' as const,
    color: 'primary',
  },
  VCard: {
    rounded: 'lg',
    elevation: 2,
  },
}

export function createVuetify() {
  return _createVuetify({
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: { mdi },
    },
    theme: {
      defaultTheme: 'sipabancaLight',
      themes: {
        sipabancaLight,
        sipabancaDark,
        dashboardTheme,
        accountsTheme,
        transfersTheme,
        movilidadTheme,
      },
    },
    defaults: globalDefaults,
  })
}

/**
 * Nombres de temas disponibles — exportar para uso con MfeThemeProvider
 * sin strings mágicos en los MFEs.
 */
export type MfeThemeName =
  | 'sipabancaLight'
  | 'sipabancaDark'
  | 'dashboardTheme'
  | 'accountsTheme'
  | 'transfersTheme'
  | 'movilidadTheme'
