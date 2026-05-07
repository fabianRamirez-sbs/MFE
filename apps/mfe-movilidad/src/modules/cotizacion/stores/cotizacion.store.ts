import { defineStore } from 'pinia'
import type { Vehiculo, Cotizacion, Cobertura } from '../../../shared/types/movilidad.types'
import { movilidadApi } from '../../../shared/services/movilidad.api'

export const useCotizacionStore = defineStore('movilidad-cotizacion', {
  state: () => ({
    vehiculo:   null as Vehiculo | null,
    cotizacion: null as Cotizacion | null,
    cargando:   false,
    error:      null as string | null,
  }),

  getters: {
    primaTotal:       (s) => s.cotizacion?.primaTotal ?? 0,
    coberturasActivas:(s) => s.cotizacion?.coberturas.filter(c => c.seleccionada) ?? [],
  },

  actions: {
    setVehiculo(vehiculo: Vehiculo) {
      this.vehiculo = vehiculo
    },

    async cotizar() {
      if (!this.vehiculo) return
      this.cargando = true
      this.error    = null
      try {
        this.cotizacion = await movilidadApi.cotizar(this.vehiculo)
      } catch (e: any) {
        this.error = e?.message ?? 'Error al cotizar'
        throw e
      } finally {
        this.cargando = false
      }
    },

    async actualizarCoberturas(coberturas: Cobertura[]) {
      if (!this.cotizacion) return
      this.cargando = true
      try {
        this.cotizacion = await movilidadApi.actualizarCoberturas(this.cotizacion.id, coberturas)
      } finally {
        this.cargando = false
      }
    },

    reset() {
      this.vehiculo   = null
      this.cotizacion = null
      this.error      = null
    },
  },
})
