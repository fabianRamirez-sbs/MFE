import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'
import { resolve } from 'path'
import { baseViteConfig } from '../../vite.config.base'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    ...baseViteConfig,
    plugins: [
      vue(),
      federation({
        name: 'mfe-dashboard',
        filename: 'remoteEntry.js',
        /**
         * Exponer sólo lo que el Shell necesita montar.
         * NUNCA exponer stores, composables internos ni servicios privados.
         */
        exposes: {
          './App': resolve(__dirname, 'src/bootstrap.ts'),
        },
        shared: {
          vue: { singleton: true, requiredVersion: '^3.4.0' },
          'vue-router': { singleton: true, requiredVersion: '^4.3.0' },
          pinia: { singleton: true, requiredVersion: '^2.1.0' },
        } as Record<string, unknown>,
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3002,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    preview: {
      port: 3002,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  }
})
