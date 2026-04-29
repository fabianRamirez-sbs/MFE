import { defineConfig, UserConfig } from 'vite'
import { resolve } from 'path'

/**
 * Configuración base de Vite compartida entre todos los proyectos del monorepo.
 * Cada app/lib extiende esta config y sobreescribe lo que necesita.
 *
 * envDir apunta a la raíz del monorepo para que TODOS los proyectos lean
 * el mismo conjunto de archivos .env:
 *   .env                  → valores por defecto (sin secretos)
 *   .env.development      → desarrollo local
 *   .env.certification    → ambiente de certificación
 *   .env.production       → producción
 *
 * Cómo funciona la carga de archivos (por prioridad, de mayor a menor):
 *   .env.[mode].local  >  .env.[mode]  >  .env.local  >  .env
 */

/** Raíz del monorepo — calculada a partir de este archivo */
export const MONOREPO_ROOT = resolve(__dirname)

export const baseViteConfig: UserConfig = {
  /**
   * Indica a Vite dónde buscar los archivos .env.
   * Al ser la raíz del monorepo, aplica a TODAS las apps sin configuración extra.
   */
  envDir: MONOREPO_ROOT,
  resolve: {
    alias: {},
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Variables globales disponibles en todos los componentes
        additionalData: `@use "@sipabanca/shared-ui/styles/tokens" as *;`,
      },
    },
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    reportCompressedSize: true,
    // No usar manualChunks aquí: @originjs/vite-plugin-federation ya
    // gestiona el chunking de vue/vue-router/pinia vía shared config.
    // Duplicar esa lógica genera conflictos en la negociación de módulos.
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
}
