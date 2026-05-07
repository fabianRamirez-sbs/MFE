import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCotizacionStore } from '../stores/cotizacion.store'
import type { Vehiculo } from '../../../shared/types/movilidad.types'

export function useCotizacion() {
  const store  = useCotizacionStore()
  const router = useRouter()

  async function cotizar(vehiculo: Vehiculo) {
    store.setVehiculo(vehiculo)
    await store.cotizar()
    router.push('/cotizacion/resultado')
  }

  function toggleCobertura(codigo: string) {
    if (!store.cotizacion) return
    const coberturas = store.cotizacion.coberturas.map(c =>
      c.codigo === codigo && !c.obligatoria ? { ...c, seleccionada: !c.seleccionada } : c
    )
    store.actualizarCoberturas(coberturas)
  }

  return {
    vehiculo:   computed(() => store.vehiculo),
    cotizacion: computed(() => store.cotizacion),
    cargando:   computed(() => store.cargando),
    error:      computed(() => store.error),
    primaTotal: computed(() => store.primaTotal),
    cotizar,
    toggleCobertura,
  }
}
