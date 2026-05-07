import type { RouteRecordRaw } from 'vue-router'
import { homeRoutes }        from '../modules/home/routes'
import { cotizacionRoutes }  from '../modules/cotizacion/routes'
import { preEmisionRoutes }  from '../modules/pre-emision/routes'
import { emisionRoutes }     from '../modules/emision/routes'
import { renovacionRoutes }  from '../modules/renovacion/routes'

export const movilidadRoutes: RouteRecordRaw[] = [
  // Redirect raíz al home del módulo
  { path: '/', redirect: '/home' },

  // Módulos
  ...homeRoutes,
  ...cotizacionRoutes,
  ...preEmisionRoutes,
  ...emisionRoutes,
  ...renovacionRoutes,

  // Fallback
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]
