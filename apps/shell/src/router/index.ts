/**
 * Router del Shell
 *
 * Define rutas de primer nivel. Cada ruta carga su MFE correspondiente
 * de forma lazy mediante Module Federation (import dinámico).
 *
 * El guard `requireAuth` verifica el store de Pinia — NO llama a Keycloak
 * directamente, ya que la autenticación ocurrió en main.ts.
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useShellStore } from '../stores/shell.store'

// Rutas internas del Shell (login fallback, error pages, etc.)
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import UnauthorizedView from '../views/UnauthorizedView.vue'
import ComingSoonView from '../views/ComingSoonView.vue'
import AppSelectView from '../views/AppSelectView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/app-select',
  },
  {
    path: '/app-select',
    name: 'app-select',
    component: AppSelectView,
    // Solo accesible cuando el usuario está autenticado pero aún no eligió app
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    // Wrapper que usa defineAsyncComponent internamente (Vue Router no lo acepta directo)
    component: () => import('../views/MfeDashboardView.vue'),
    meta: { requiredRoles: [] },
  },
  {
    path: '/accounts',
    name: 'accounts',
    // mfe-accounts aún no existe — muestra "Próximamente"
    component: ComingSoonView,
    meta: { requiredRoles: ['user'] },
  },
  {
    path: '/transfers',
    name: 'transfers',
    // mfe-transfers aún no existe — muestra "Próximamente"
    component: ComingSoonView,
    meta: { requiredRoles: ['user'] },
  },
  {
    // Ruta para el MFE Legacy Vue 2 — cargado vía wrapper
    path: '/legacy/:pathMatch(.*)*',
    name: 'legacy',
    component: () => import('../components/LegacyMfeWrapper.vue'),
    meta: { requiredRoles: ['user'] },
  },
  {
    // Ruta para SipaNew (webpack Vue 2) — cargado vía iframe
    path: '/sipa-new/:pathMatch(.*)*',
    name: 'sipa-new',
    component: () => import('../views/MfeSipaNewView.vue'),
    meta: { requiredRoles: ['user'] },
  },
  {
    // Ruta para el MFE Movilidad — Module Federation
    path: '/movilidad/:pathMatch(.*)*',
    name: 'movilidad',
    component: () => import('../views/MfeMovilidadView.vue'),
    meta: { requiredRoles: ['user'] },
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: UnauthorizedView,
    meta: { public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { public: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guard global
router.beforeEach((to, _from) => {
  const shellStore = useShellStore()

  if (to.meta.public) return true

  if (!shellStore.isAuthenticated) {
    return { name: 'login' }
  }

  // Usuario autenticado pero sin app seleccionada → forzar /app-select
  if (!shellStore.selectedApp && to.name !== 'app-select') {
    return { name: 'app-select' }
  }

  const requiredRoles = (to.meta.requiredRoles as string[]) ?? []
  if (requiredRoles.length > 0 && !requiredRoles.every((r) => shellStore.hasRole(r))) {
    return { name: 'unauthorized' }
  }

  return true
})
