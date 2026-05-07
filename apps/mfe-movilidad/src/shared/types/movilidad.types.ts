// ─── Enumeraciones ────────────────────────────────────────────────────────────

export type TipoUsoVehiculo = 'particular' | 'comercial' | 'mixto'
export type TipoDocumento   = 'CC' | 'NIT' | 'CE' | 'PA'
export type EstadoCotizacion = 'borrador' | 'cotizada' | 'expirada'
export type EstadoPoliza = 'pre-emision' | 'emitida' | 'vigente' | 'renovando' | 'vencida' | 'cancelada'

// ─── Vehículo ─────────────────────────────────────────────────────────────────

export interface Vehiculo {
  marca:          string
  modelo:         string
  anio:           number
  placa?:         string
  vin?:           string
  color?:         string
  cilindraje?:    number
  tipoUso:        TipoUsoVehiculo
  valorComercial: number
}

// ─── Titular / Tomador ───────────────────────────────────────────────────────

export interface Titular {
  nombre:          string
  apellido:        string
  tipoDocumento:   TipoDocumento
  documento:       string
  email:           string
  telefono:        string
  direccion?:      string
  ciudad?:         string
}

// ─── Cobertura ────────────────────────────────────────────────────────────────

export interface Cobertura {
  codigo:          string
  nombre:          string
  descripcion:     string
  valorAsegurado:  number
  prima:           number
  seleccionada:    boolean
  obligatoria:     boolean
}

// ─── Cotización ───────────────────────────────────────────────────────────────

export interface Cotizacion {
  id:             string
  vehiculo:       Vehiculo
  coberturas:     Cobertura[]
  primaTotal:     number
  fechaCreacion:  string
  vigencia:       { inicio: string; fin: string }
  estado:         EstadoCotizacion
}

// ─── Póliza ───────────────────────────────────────────────────────────────────

export interface Poliza {
  id?:           string
  numero?:       string
  cotizacionId:  string
  vehiculo:      Vehiculo
  titular:       Titular
  coberturas:    Cobertura[]
  primaTotal:    number
  estado:        EstadoPoliza
  vigencia?:     { inicio: string; fin: string }
  fechaEmision?: string
}

// ─── Respuesta de renovación ──────────────────────────────────────────────────

export interface PolizaRenovable {
  polizaId:       string
  numero:         string
  vehiculo:       Vehiculo
  vencimiento:    string
  primaAnterior:  number
  primaRenovacion: number
  estado:         'por-vencer' | 'vencida'
}
