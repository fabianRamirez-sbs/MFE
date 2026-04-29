import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'
import { resolve } from 'path'
import { baseViteConfig } from '../../vite.config.base'

// Los .env se centralizan en la raíz del monorepo
const rootDir = resolve(__dirname, '../..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')

  return {
    ...baseViteConfig,
    envDir: rootDir,
    plugins: [
      vue(),
      federation({
        name: 'shell',
        /**
         * El Shell NO expone módulos — es el consumidor.
         * Sólo remotes apuntan a los MFEs desplegados.
         */
        remotes: {
          // En desarrollo: puertos locales. En producción: URLs del CDN/K8s.
          'mfe-dashboard': env.VITE_MFE_DASHBOARD_URL ?? 'http://localhost:3002/assets/remoteEntry.js',
          'mfe-accounts': env.VITE_MFE_ACCOUNTS_URL ?? 'http://localhost:3003/assets/remoteEntry.js',
          'mfe-transfers': env.VITE_MFE_TRANSFERS_URL ?? 'http://localhost:3004/assets/remoteEntry.js',
          'mfe-legacy': env.VITE_MFE_LEGACY_URL ?? 'http://localhost:3005/assets/remoteEntry.js',
        },
        /**
         * Shared: librerías que NO se duplican entre host y remotes.
         * vue y vue-router DEBEN ser singleton para evitar instancias múltiples.
         */
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
      port: 3001,
      cors: true,
    },
    preview: {
      port: 3001,
      cors: true,
    },
  }
})
