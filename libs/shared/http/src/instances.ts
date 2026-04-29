/**
 * instances.ts — Instancias Axios compartidas entre todos los MFEs
 *
 * PATRÓN SINGLETON: cada instancia se crea una sola vez al importar el módulo.
 * Los MFEs importan la instancia que necesitan:
 *
 *   import { integrationHttp, sipaHttp } from '@sipabanca/shared-http'
 *
 * La URL base se resuelve automáticamente según el entorno activo (.env.*).
 */
import { createHttpClient } from './http-client'

// ── Nuevos servicios MFE ──────────────────────────────────────────────────────
// includeClientHeader: true → estos backends sí permiten X-Client-App en CORS
export const coreHttp          = createHttpClient({ service: 'core', includeClientHeader: true })
export const accountsHttp      = createHttpClient({ service: 'accounts', includeClientHeader: true })
export const transfersHttp     = createHttpClient({ service: 'transfers', includeClientHeader: true })
export const notificationsHttp = createHttpClient({ service: 'notifications', includeClientHeader: true })

// ── APIs heredadas de SipaNew ─────────────────────────────────────────────────
// Sin includeClientHeader → los backends legacy rechazan X-Client-App en CORS
/** api-int — servicios de integración principal (PRODUCTION_URLSERVICES) */
export const integrationHttp   = createHttpClient({ service: 'integration' })
/** Modyo — portal de integración (PRODUCTION_URLSBSMODYO) */
export const modyoHttp         = createHttpClient({ service: 'modyo' })
/** api-biz — diccionarios de negocio (PRODUCTION_URLDICTIONARIES) */
export const dictionariesHttp  = createHttpClient({ service: 'dictionaries' })
/** api-auth — autenticación Stratio (PRODUCTION_URLSTRATIO) */
export const stratioAuthHttp   = createHttpClient({ service: 'stratioAuth' })
/** api-rpt — reportes (PRODUCTION_URLREPORTES) */
export const reportsHttp       = createHttpClient({ service: 'reports' })
/** api-dict — diccionario DAAS (PRODUCTION_URLDAASDICTIONARY) */
export const daasDictionaryHttp = createHttpClient({ service: 'daasDictionary' })
/** sbs-api-fileProcessing — procesamiento de archivos (PRODUCTION_URLFILEPROCESSING) */
export const fileProcessingHttp = createHttpClient({ service: 'fileProcessing' })
/** api-sipa — servicio SIPA (PRODUCTION_URLAPISIPA) */
export const sipaHttp          = createHttpClient({ service: 'sipa' })
/** api-web — API web (DEVELOP_URLAPIWEB) */
export const webHttp           = createHttpClient({ service: 'web' })
/** sbs-api-certifier principal (PRODUCTION_URLAPICERTIFIER) */
export const certifierHttp     = createHttpClient({ service: 'certifier' })
/** sbs-api-certifier variante SBS (DEVELOP_URLSBSAPICERTIFIER) */
export const certifierSbsHttp  = createHttpClient({ service: 'certifierSbs' })
