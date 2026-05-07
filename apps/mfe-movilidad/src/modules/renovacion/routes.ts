import type { RouteRecordRaw } from 'vue-router'
import RenovacionView from './views/RenovacionView.vue'

export const renovacionRoutes: RouteRecordRaw[] = [
  {
    path: '/renovacion',
    name: 'movilidad-renovacion',
    component: RenovacionView,
  },
]
