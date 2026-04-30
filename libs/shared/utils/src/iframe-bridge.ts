/**
 * IframeBridge — Protocolo seguro de comunicación Shell <-> iframe Legacy
 *
 * Implementa un protocolo de mensajes tipado sobre window.postMessage.
 * Valida el origen de los mensajes para prevenir ataques de clickjacking.
 */

export type BridgeMessageType = 'AUTH_TOKEN' | 'AUTH_SESSION' | 'NAVIGATE' | 'LOGOUT' | 'READY' | 'PREFERENCES'

/**
 * Payload de AUTH_SESSION — transporta la sesión completa del Shell a mfe-sipa-new.
 * El iframe lo usa para hidratar su Vuex store y registrar las rutas dinámicas
 * sin necesidad de hacer su propio POST /api/v1/sbs/login.
 */
export interface AuthSessionPayload {
  token: string
  user: string
  email: string
  profileUser: Record<string, unknown>
  componentsUser: Array<{ path: string; component: string; name: string }>
  modulesUser: unknown[]
  profileApp: { profileCode: number; applicationCode: number }
  userAppId: number
  /** Ruta inicial dentro de mfe-sipa-new (ej: "/polizas/nueva") */
  targetPath: string
}

export interface BridgeMessage<T = unknown> {
  type: BridgeMessageType
  payload: T
  /** Identificador único del mensaje para correlacionar request/response */
  id: string
}

export interface IframeBridgeOptions {
  allowedOrigin?: string
  onReady?: () => void
  onMessage?: (msg: BridgeMessage) => void
}

export class IframeBridge {
  private iframe: HTMLIFrameElement
  private options: IframeBridgeOptions
  private listener: (event: MessageEvent) => void

  constructor(iframe: HTMLIFrameElement, options: IframeBridgeOptions = {}) {
    this.iframe = iframe
    this.options = options

    this.listener = (event: MessageEvent) => {
      // Validar origen del mensaje (seguridad)
      const allowed = options.allowedOrigin ?? import.meta.env.VITE_MFE_LEGACY_BASE_URL
      if (allowed && event.origin !== allowed) return

      const msg = event.data as BridgeMessage
      if (!msg?.type) return

      if (msg.type === 'READY') {
        options.onReady?.()
        return
      }

      options.onMessage?.(msg)
    }

    window.addEventListener('message', this.listener)
  }

  send<T = unknown>(message: Omit<BridgeMessage<T>, 'id'>) {
    const full: BridgeMessage<T> = {
      ...message,
      id: crypto.randomUUID(),
    }
    this.iframe.contentWindow?.postMessage(
      full,
      this.options.allowedOrigin ?? '*'
    )
  }

  destroy() {
    window.removeEventListener('message', this.listener)
  }
}
