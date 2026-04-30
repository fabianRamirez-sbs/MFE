import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import federation from '@originjs/vite-plugin-federation'
import type { SharedConfig } from '@originjs/vite-plugin-federation'
import { resolve } from 'path'
import { baseViteConfig } from '../../vite.config.base'

declare module '@originjs/vite-plugin-federation' {
  interface SharedConfig {
    singleton?: boolean
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    ...baseViteConfig,
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      federation({
        name: 'mfe-movilidad',
        filename: 'remoteEntry.js',
        exposes: {
          './App': resolve(__dirname, 'src/bootstrap.ts'),
        },
        shared: {
          vue: { singleton: true, requiredVersion: '^3.4.0' },
          'vue-router': { singleton: true, requiredVersion: '^4.3.0' },
          pinia: { singleton: true, requiredVersion: '^2.1.0' },
          vuetify: { singleton: true, requiredVersion: '^3.0.0' },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3006,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    preview: {
      port: 3006,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    build: {
      target: 'esnext',
      minify: false,
      cssCodeSplit: false,
    },
  }
})
