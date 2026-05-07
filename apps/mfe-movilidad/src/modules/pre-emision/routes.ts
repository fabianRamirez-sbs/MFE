import type { RouteRecordRaw } from 'vue-router'
import { usePreEmisionStore } from './stores/pre-emision.store'
import PreEmisionView from './views/PreEmisionView.vue'

export const preEmisionRoutes: RouteRecordRaw[] = [
  {
    path: '/pre-emision',
    name: 'movilidad-pre-emision',
    component: PreEmisionView,
    beforeEnter: () => {
      if (!import.meta.env.DEV) {
        const store = usePreEmisionStore()
        if (!store.poliza?.cotizacionId) return { name: 'movilidad-cotizacion' }
      }
    },
  },
]
