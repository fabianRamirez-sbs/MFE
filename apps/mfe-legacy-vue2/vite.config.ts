/**
 * vite.config.ts — MFE Legacy Vue 2
 *
 * Este proyecto es el "puente" que envuelve el bundle de Vue 2 existente.
 *
 * OPCIÓN A (Fase 2 inicial): Servir el bundle Vue 2 AS-IS
 *   - vite actúa como servidor estático del dist Vue 2
 *   - El Shell lo carga en iframe
 *   - Cero cambios al proyecto legacy
 *
 * OPCIÓN B (Fase 2 avanzada): Exponer componentes Vue 2 via Module Federation
 *   - Requiere usar @vitejs/plugin-vue2 y configurar federation
 *   - Mayor integración pero más riesgo de conflictos
 *
 * Este archivo implementa la OPCIÓN B (preparada para cuando el equipo esté listo).
 */
import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import federation from '@originjs/vite-plugin-federation'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue2(),
    federation({
      name: 'mfe-legacy',
      filename: 'remoteEntry.js',
      exposes: {
        // Exponer sólo la app raíz del legacy
        './App': resolve(__dirname, 'src/LegacyAppBridge.js'),
      },
      shared: {
        // Vue 2 NO puede compartirse con Vue 3 — NO incluir en shared
        // Solo compartir utilidades agnósticas de framework
        axios: { singleton: true },
      } as Record<string, unknown>,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3004,
    cors: true,
    headers: {
      // Necesario para que el Shell pueda cargar el remoteEntry
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    target: 'es2018',  // axios moderno usa async generators — mínimo es2018
    cssCodeSplit: false,
  },
})
