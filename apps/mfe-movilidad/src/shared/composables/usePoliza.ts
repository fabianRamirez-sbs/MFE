/**
 * usePoliza — Composable compartido del flujo de contratación
 *
 * Mantiene el objeto "póliza en construcción" que se va llenando
 * a medida que el usuario avanza por los pasos del flujo:
 *   Cotización → Pre-emisión → Emisión
 *
 * Es un singleton dentro del MFE: todos los módulos leen el mismo ref.
 */
import { ref, computed } from 'vue'
import type { Poliza, Vehiculo, Cotizacion, Titular, Cobertura } from '../types/movilidad.types'

const _poliza = ref<Partial<Poliza>>({})

function setVehiculo(vehiculo: Vehiculo) {
  _poliza.value = { ..._poliza.value, vehiculo }
}

function setCotizacion(cotizacion: Cotizacion) {
  _poliza.value = {
    ..._poliza.value,
    cotizacionId: cotizacion.id,
    vehiculo:     cotizacion.vehiculo,
    coberturas:   cotizacion.coberturas,
    primaTotal:   cotizacion.primaTotal,
    vigencia:     cotizacion.vigencia,
  }
}

function setCoberturas(coberturas: Cobertura[]) {
  _poliza.value = { ..._poliza.value, coberturas }
}

function setTitular(titular: Titular) {
  _poliza.value = { ..._poliza.value, titular }
}

function setPolizaEmitida(poliza: Poliza) {
  _poliza.value = poliza
}

function reset() {
  _poliza.value = {}
}

export function usePoliza() {

  return {
    poliza:           computed(() => _poliza.value),
    tieneVehiculo:    computed(() => !!_poliza.value.vehiculo),
    tieneCotizacion:  computed(() => !!_poliza.value.cotizacionId),
    tieneTitular:     computed(() => !!_poliza.value.titular),
    estaEmitida:      computed(() => _poliza.value.estado === 'emitida'),
    setVehiculo,
    setCotizacion,
    setCoberturas,
    setTitular,
    setPolizaEmitida,
    reset,
  }
}
