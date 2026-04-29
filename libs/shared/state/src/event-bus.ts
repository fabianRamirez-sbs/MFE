/**
 * Event Bus — Canal de comunicación entre MFEs independiente del estado
 *
 * Casos de uso:
 * - MFE A notifica que se completó una operación (ej: transferencia exitosa)
 * - Shell escucha y actualiza el saldo en la NavBar
 * - MFE B escucha y refresca su lista de movimientos
 *
 * Implementado como un EventTarget nativo (sin dependencias externas).
 * El bus es singleton gracias a Module Federation.
 */

export type MfeEventType =
  | 'mfe:transfer:completed'
  | 'mfe:account:updated'
  | 'mfe:notification:show'
  | 'mfe:navigate'
  | 'mfe:auth:logout'

export interface MfeEvent<T = unknown> {
  type: MfeEventType
  payload: T
  source: string  // nombre del MFE que emite (ej: 'mfe-transfers')
  timestamp: number
}

class MfeBus extends EventTarget {
  emit<T = unknown>(event: Omit<MfeEvent<T>, 'timestamp'>) {
    const fullEvent: MfeEvent<T> = { ...event, timestamp: Date.now() }
    this.dispatchEvent(
      new CustomEvent(event.type, { detail: fullEvent })
    )
  }

  on<T = unknown>(
    type: MfeEventType,
    handler: (event: MfeEvent<T>) => void
  ): () => void {
    const listener = (e: Event) => handler((e as CustomEvent<MfeEvent<T>>).detail)
    this.addEventListener(type, listener)
    // Retorna una función de cleanup
    return () => this.removeEventListener(type, listener)
  }
}

// Singleton — una sola instancia en toda la aplicación
export const mfeBus = new MfeBus()
