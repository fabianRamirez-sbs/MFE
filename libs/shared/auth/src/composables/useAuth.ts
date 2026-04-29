/**
 * useAuth composable
 *
 * Los MFEs usan ESTE composable para acceder al estado de autenticación.
 * Consume el Shell Store via Pinia (misma instancia singleton gracias a
 * Module Federation shared: { pinia: { singleton: true } }).
 *
 * Si el MFE corre standalone (sin el Shell), devuelve valores mock/vacíos
 * para permitir el desarrollo independiente.
 */
import { computed } from 'vue'
import { useSharedStore } from '@sipabanca/shared-state'

export function useAuth() {
  const store = useSharedStore()

  return {
    isAuthenticated: computed(() => store.isAuthenticated),
    user: computed(() => store.userProfile),
    token: computed(() => store.accessToken),
    roles: computed(() => store.userRoles),
    hasRole: (role: string) => store.userRoles.includes(role),
    hasAnyRole: (...roles: string[]) => roles.some((r) => store.userRoles.includes(r)),
  }
}
