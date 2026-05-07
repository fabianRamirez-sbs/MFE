import { defineStore } from 'pinia'
import type { Poliza, Titular } from '../../../shared/types/movilidad.types'
import { movilidadApi } from '../../../shared/services/movilidad.api'

// ─── Seed para desarrollo ─────────────────────────────────────────────────────
// Permite entrar directo a /pre-emision sin pasar por cotizacion.
// En producción no tiene efecto (el guard de ruta redirige si no hay cotizacion).
const DEV_SEED = import.meta.env.DEV ? {
  cotizacionId: 'COT-DEV-001',
  vehiculo: {
    marca:          'Toyota',
    modelo:         'Corolla',
    anio:           2022,
    placa:          'ABC-123',
    tipoUso:        'particular' as const,
    valorComercial: 45_000_000,
  },
  coberturas: [
    { codigo: 'RC',   nombre: 'Responsabilidad Civil',  descripcion: 'Daños a terceros', valorAsegurado: 50_000_000, prima: 180_000, seleccionada: true,  obligatoria: true  },
    { codigo: 'HUR',  nombre: 'Hurto',                  descripcion: 'Robo del vehículo',valorAsegurado: 45_000_000, prima: 320_000, seleccionada: true,  obligatoria: false },
    { codigo: 'DATP', nombre: 'Daños Propios',          descripcion: 'Colisión y volcamiento', valorAsegurado: 45_000_000, prima: 280_000, seleccionada: false, obligatoria: false },
  ],
  primaTotal:  500_000,
  estado:      'pre-emision' as const,
} : null

export const usePreEmisionStore = defineStore('movilidad-pre-emision', {
  state: () => ({
    poliza:   DEV_SEED as Partial<Poliza> | null,
    cargando: false,
    error:    null as string | null,
  }),

  actions: {
    inicializarDesde(polizaParcial: Partial<Poliza>) {
      this.poliza = polizaParcial
    },

    async registrarTitular(titular: Titular) {
      if (!this.poliza?.cotizacionId) return
      this.cargando = true
      this.error    = null
      try {
        const polizaCreada = await movilidadApi.registrarTitular(this.poliza.cotizacionId, titular)
        this.poliza = { ...this.poliza, ...polizaCreada, titular }
        return polizaCreada
      } catch (e: any) {
        this.error = e?.message ?? 'Error al registrar titular'
        throw e
      } finally {
        this.cargando = false
      }
    },

    reset() {
      this.poliza = null
      this.error  = null
    },
  },
})
