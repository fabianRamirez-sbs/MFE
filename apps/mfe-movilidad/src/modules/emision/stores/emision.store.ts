import { defineStore } from 'pinia'
import type { Poliza } from '../../../shared/types/movilidad.types'
import { movilidadApi } from '../../../shared/services/movilidad.api'

const DEV_SEED = import.meta.env.DEV ? {
  id:           'POL-DEV-001',
  cotizacionId: 'COT-DEV-001',
  vehiculo: {
    marca: 'Toyota', modelo: 'Corolla', anio: 2022,
    placa: 'ABC-123', tipoUso: 'particular' as const, valorComercial: 45_000_000,
  },
  titular: {
    nombre: 'Carlos', apellido: 'Rodríguez',
    tipoDocumento: 'CC' as const, documento: '80123456',
    email: 'carlos@ejemplo.com', telefono: '3001234567',
  },
  coberturas: [
    { codigo: 'RC',  nombre: 'Responsabilidad Civil', descripcion: 'Daños a terceros', valorAsegurado: 50_000_000, prima: 180_000, seleccionada: true,  obligatoria: true  },
    { codigo: 'HUR', nombre: 'Hurto',                 descripcion: 'Robo del vehículo',valorAsegurado: 45_000_000, prima: 320_000, seleccionada: true,  obligatoria: false },
  ],
  primaTotal: 500_000,
  estado:     'pre-emision' as const,
  vigencia:   { inicio: '2026-05-01', fin: '2027-05-01' },
} : null

export const useEmisionStore = defineStore('movilidad-emision', {
  state: () => ({
    poliza:       DEV_SEED as Poliza | null,
    polizaEmitida: null as Poliza | null,
    cargando:     false,
    error:        null as string | null,
  }),

  getters: {
    estaEmitida: (s) => s.polizaEmitida?.estado === 'emitida',
  },

  actions: {
    inicializarDesde(poliza: Poliza) {
      this.poliza = poliza
    },

    async emitir() {
      if (!this.poliza?.id) return
      this.cargando = true
      this.error    = null
      try {
        this.polizaEmitida = await movilidadApi.emitirPoliza(this.poliza.id)
        return this.polizaEmitida
      } catch (e: any) {
        this.error = e?.message ?? 'Error al emitir la póliza'
        throw e
      } finally {
        this.cargando = false
      }
    },

    reset() {
      this.poliza        = null
      this.polizaEmitida = null
      this.error         = null
    },
  },
})
