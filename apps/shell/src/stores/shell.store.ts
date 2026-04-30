/**
 * @deprecated Este archivo existe solo para compatibilidad con imports existentes.
 *
 * El store monolítico ha sido dividido en stores por dominio:
 *   - stores/auth/       → useAuthStore()       sesión, token, roles
 *   - stores/navigation/ → useNavigationStore()  menú y módulos del login empresarial
 *   - stores/app/        → useAppStore()          app seleccionada y preferencias
 *
 * Para nuevo código importar desde '@/stores' o la carpeta de dominio correspondiente.
 * La facade useShellStore() sigue disponible y mantiene la API original completa.
 */
export { useShellStore } from './index'

