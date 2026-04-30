import type { RouteRecordRaw } from 'vue-router'

export const movilidadRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'movilidad-home',
    component: () => import('../views/MovilidadView.vue'),
  },
]
