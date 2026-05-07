import type { RouteRecordRaw } from 'vue-router'
import { useEmisionStore } from './stores/emision.store'
import EmisionView from './views/EmisionView.vue'

export const emisionRoutes: RouteRecordRaw[] = [
  {
    path: '/emision',
    name: 'movilidad-emision',
    component: EmisionView,
    beforeEnter: () => {
      if (!import.meta.env.DEV) {
        const store = useEmisionStore()
        if (!store.poliza?.titular) return { name: 'movilidad-pre-emision' }
      }
    },
  },
]
