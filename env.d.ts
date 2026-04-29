/// <reference types="vite/client" />

/**
 * Shim para que TypeScript acepte importaciones de archivos .vue
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/**
 * Shims para importaciones de efectos secundarios (CSS / SCSS).
 * Vite los procesa correctamente en runtime; estos shims solo silencian el error de TS.
 */
declare module '*.css' {}
declare module '*.scss' {}
declare module 'vuetify/styles' {}
declare module '@mdi/font/css/materialdesignicons.css' {}

/**
 * Declaraciones de módulos remotos de Module Federation.
 * TypeScript no los resuelve en tiempo de compilación — se cargan en runtime.
 */
declare module 'mfe-dashboard/App' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
declare module 'mfe-accounts/App' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
declare module 'mfe-transfers/App' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
declare module 'mfe-legacy/App' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
