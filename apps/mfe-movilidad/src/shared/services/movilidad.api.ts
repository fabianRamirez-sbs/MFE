import axios from 'axios'
import type { Cotizacion, Poliza, PolizaRenovable, Vehiculo, Titular, Cobertura } from '../types/movilidad.types'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_MOVILIDAD_URL ?? '/api/movilidad',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor para inyectar el token desde el store compartido
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const movilidadApi = {
  // ─── Cotización ────────────────────────────────────────────────────────────

  async cotizar(vehiculo: Vehiculo): Promise<Cotizacion> {
    const { data } = await api.post<Cotizacion>('/cotizaciones', vehiculo)
    return data
  },

  async getCotizacion(id: string): Promise<Cotizacion> {
    const { data } = await api.get<Cotizacion>(`/cotizaciones/${id}`)
    return data
  },

  async actualizarCoberturas(id: string, coberturas: Cobertura[]): Promise<Cotizacion> {
    const { data } = await api.patch<Cotizacion>(`/cotizaciones/${id}/coberturas`, { coberturas })
    return data
  },

  // ─── Pre-emisión ───────────────────────────────────────────────────────────

  async registrarTitular(cotizacionId: string, titular: Titular): Promise<Poliza> {
    const { data } = await api.post<Poliza>(`/cotizaciones/${cotizacionId}/titular`, titular)
    return data
  },

  // ─── Emisión ───────────────────────────────────────────────────────────────

  async emitirPoliza(polizaId: string): Promise<Poliza> {
    const { data } = await api.post<Poliza>(`/polizas/${polizaId}/emitir`)
    return data
  },

  // ─── Renovación ────────────────────────────────────────────────────────────

  async getPolizasRenovables(): Promise<PolizaRenovable[]> {
    const { data } = await api.get<PolizaRenovable[]>('/polizas/renovables')
    return data
  },

  async renovarPoliza(polizaId: string): Promise<Poliza> {
    const { data } = await api.post<Poliza>(`/polizas/${polizaId}/renovar`)
    return data
  },
}
