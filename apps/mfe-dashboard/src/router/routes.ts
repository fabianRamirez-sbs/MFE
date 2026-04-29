import type { RouteRecordRaw } from 'vue-router'

/**
 * Rutas del MFE Dashboard.
 *
 * CONVENCIÓN: Las rutas del MFE usan paths relativos al punto de montaje.
 * El Shell monta este MFE en '/dashboard', así que '/' aquí = '/dashboard'.
 */
export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard-home',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/summary',
    name: 'dashboard-summary',
    component: () => import('../views/SummaryView.vue'),
  },
]
