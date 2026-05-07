import { defineStore } from 'pinia'
import type { PolizaRenovable, Poliza } from '../../../shared/types/movilidad.types'
import { movilidadApi } from '../../../shared/services/movilidad.api'

const DEV_POLIZAS: PolizaRenovable[] = import.meta.env.DEV ? [
  {
    polizaId:        'POL-2025-001',
    numero:          'MOV-2025-00123',
    vehiculo:        { marca: 'Mazda', modelo: 'CX-5', anio: 2020, placa: 'XYZ-789', tipoUso: 'particular', valorComercial: 65_000_000 },
    vencimiento:     '2026-05-15',
    primaAnterior:   620_000,
    primaRenovacion: 640_000,
    estado:          'por-vencer',
  },
  {
    polizaId:        'POL-2025-002',
    numero:          'MOV-2025-00456',
    vehiculo:        { marca: 'Renault', modelo: 'Logan', anio: 2019, placa: 'DEF-321', tipoUso: 'particular', valorComercial: 28_000_000 },
    vencimiento:     '2026-04-20',
    primaAnterior:   380_000,
    primaRenovacion: 400_000,
    estado:          'vencida',
  },
] : []

export const useRenovacionStore = defineStore('movilidad-renovacion', {
  state: () => ({
    polizas:         DEV_POLIZAS,
    polizaRenovada:  null as Poliza | null,
    cargando:        false,
    cargandoId:      null as string | null,   // ID de la póliza en proceso
    error:           null as string | null,
  }),

  actions: {
    async cargarPolizas() {
      this.cargando = true
      this.error    = null
      try {
        this.polizas = await movilidadApi.getPolizasRenovables()
      } catch (e: any) {
        this.error = e?.message ?? 'Error al cargar pólizas'
      } finally {
        this.cargando = false
      }
    },

    async renovar(polizaId: string) {
      this.cargandoId = polizaId
      this.error      = null
      try {
        this.polizaRenovada = await movilidadApi.renovarPoliza(polizaId)
        // Remover de la lista local tras renovación exitosa
        this.polizas = this.polizas.filter(p => p.polizaId !== polizaId)
        return this.polizaRenovada
      } catch (e: any) {
        this.error = e?.message ?? 'Error al renovar'
        throw e
      } finally {
        this.cargandoId = null
      }
    },

    reset() {
      this.polizas        = []
      this.polizaRenovada = null
      this.error          = null
    },
  },
})
