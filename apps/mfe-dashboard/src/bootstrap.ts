/**
 * bootstrap.ts — Punto de entrada expuesto por Module Federation
 *
 * IMPORTANTE: Este archivo es lo que el Shell importa como 'mfe-dashboard/App'.
 * Debe exportar un componente Vue que se monte en el slot del Shell.
 *
 * NO usar RouterView aquí — el Shell ya tiene su propio router y NO define
 * rutas hijas bajo /dashboard, por lo que RouterView renderizaría vacío.
 * En su lugar, exportamos DashboardView directamente.
 */
import { defineComponent, h } from 'vue'
import DashboardView from './views/DashboardView.vue'

export default defineComponent({
  name: 'MfeDashboard',
  setup() {
    return () => h(DashboardView)
  },
})
