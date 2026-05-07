import type { RouteRecordRaw } from 'vue-router'
import CotizacionView from './views/CotizacionView.vue'
import CotizacionResultadoView from './views/CotizacionResultadoView.vue'

export const cotizacionRoutes: RouteRecordRaw[] = [
  {
    path: '/cotizacion',
    name: 'movilidad-cotizacion',
    component: CotizacionView,
  },
  {
    path: '/cotizacion/resultado',
    name: 'movilidad-cotizacion-resultado',
    component: CotizacionResultadoView,
    beforeEnter: () => {
      if (!import.meta.env.DEV) {
        const { useCotizacionStore } = require('./stores/cotizacion.store')
        const store = useCotizacionStore()
        if (!store.cotizacion) return { name: 'movilidad-cotizacion' }
      }
    },
  },
]
