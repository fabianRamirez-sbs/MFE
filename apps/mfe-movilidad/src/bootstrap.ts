/**
 * bootstrap.ts — Punto de entrada expuesto por Module Federation
 *
 * Estrategia: router propio del MFE sin depender de RouterView ni de los
 * símbolos internos de Vue Router (routerViewLocationKey).
 *
 * - mfeRouter maneja toda la navegación interna (/home, /cotizacion, etc.)
 * - afterEach actualiza currentView cuando el router navega → re-render inmediato
 * - provide(routerKey) → useRouter() funciona en todos los hijos
 * - provide(routeLocationKey) → useRoute() funciona en todos los hijos
 * - No se usa <router-view /> ni RouterView; el componente matched se renderiza
 *   directamente, evitando el problema de START_LOCATION con matched:[]
 */
import {
  defineComponent,
  h,
  shallowRef,
  shallowReactive,
  provide,
  onMounted,
  onUnmounted,
  type Component,
} from 'vue'
import {
  createRouter,
  createWebHistory,
  routerKey,
  routeLocationKey,
  type RouteLocationNormalizedLoaded,
} from 'vue-router'
import { movilidadRoutes } from './router/routes'

const MFE_BASE = '/movilidad'

/**
 * Router singleton del MFE (se crea una vez al cargar el módulo).
 * createWebHistory(MFE_BASE) hace que /movilidad/home → /home internamente.
 */
const mfeRouter = createRouter({
  history: createWebHistory(MFE_BASE),
  routes: movilidadRoutes,
})

export default defineComponent({
  name: 'MfeMovilidad',
  setup() {
    /** Componente de la vista activa, se actualiza en afterEach */
    const currentView = shallowRef<Component | null>(null)

    /**
     * Objeto reactivo que replica la ruta actual del MFE.
     * Se usa para provide(routeLocationKey) → useRoute() en vistas hijas.
     * Object.assign lo actualiza en cada navegación.
     */
    const reactiveRoute = shallowReactive({} as RouteLocationNormalizedLoaded)

    /** Sincronizar vista + ruta reactiva tras cada navegación del mfeRouter */
    const stopAfterEach = mfeRouter.afterEach((to) => {
      Object.assign(reactiveRoute, to)
      const matched = to.matched
      currentView.value = matched.length > 0
        ? (matched.at(-1)?.components?.default as Component ?? null)
        : null
    })

    onUnmounted(stopAfterEach)

    // useRouter() y useRoute() disponibles para los componentes hijos del MFE
    provide(routerKey, mfeRouter)
    provide(routeLocationKey, reactiveRoute as RouteLocationNormalizedLoaded)

    onMounted(() => {
      const { pathname, search, hash } = globalThis.location
      const full = pathname + search + hash
      const mfePath = full.startsWith(MFE_BASE) ? full.slice(MFE_BASE.length) || '/' : '/'
      mfeRouter.replace(mfePath).catch(() => { /* guard redirige si la ruta no existe */ })
    })

    return () =>
      h('div', { id: 'mfe-movilidad' }, currentView.value ? [h(currentView.value)] : [])
  },
})


