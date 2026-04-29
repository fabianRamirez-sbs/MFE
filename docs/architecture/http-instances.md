# HTTP Instances — Guía de uso de instancias Axios

## Contexto

`@sipabanca/shared-http` expone instancias Axios **pre-configuradas y listas para usar**.
Cada instancia apunta automáticamente al backend correcto según el entorno activo
(`.env.development`, `.env.certification`, `.env.production`).

No es necesario construir instancias manualmente ni leer variables de entorno directamente.

---

## Instancias disponibles

### Nuevos servicios MFE

| Instancia exportada   | Variable de entorno          | Descripción                            |
|-----------------------|------------------------------|----------------------------------------|
| `coreHttp`            | `VITE_API_CORE_URL`          | Core bancario: usuario y permisos      |
| `accountsHttp`        | `VITE_API_ACCOUNTS_URL`      | Cuentas y saldos                       |
| `transfersHttp`       | `VITE_API_TRANSFERS_URL`     | Transferencias                         |
| `notificationsHttp`   | `VITE_API_NOTIFICATIONS_URL` | Notificaciones y alertas               |

### APIs heredadas de SipaNew

| Instancia exportada    | Variable de entorno               | Origen en SipaNew (`prod.env.js`)       |
|------------------------|-----------------------------------|-----------------------------------------|
| `integrationHttp`      | `VITE_API_INTEGRATION_URL`        | `PRODUCTION_URLSERVICES` (api-int)      |
| `modyoHttp`            | `VITE_API_MODYO_URL`              | `PRODUCTION_URLSBSMODYO`                |
| `dictionariesHttp`     | `VITE_API_DICTIONARIES_URL`       | `PRODUCTION_URLDICTIONARIES` (api-biz)  |
| `stratioAuthHttp`      | `VITE_API_STRATIO_AUTH_URL`       | `PRODUCTION_URLSTRATIO` (api-auth)      |
| `reportsHttp`          | `VITE_API_REPORTS_URL`            | `PRODUCTION_URLREPORTES` (api-rpt)      |
| `daasDictionaryHttp`   | `VITE_API_DAAS_DICTIONARY_URL`    | `PRODUCTION_URLDAASDICTIONARY` (api-dict) |
| `fileProcessingHttp`   | `VITE_API_FILE_PROCESSING_URL`    | `PRODUCTION_URLFILEPROCESSING`          |
| `sipaHttp`             | `VITE_API_SIPA_URL`               | `PRODUCTION_URLAPISIPA` (api-sipa)      |
| `webHttp`              | `VITE_API_WEB_URL`                | `DEVELOP_URLAPIWEB` (api-web)           |
| `certifierHttp`        | `VITE_API_CERTIFIER_URL`          | `PRODUCTION_URLAPICERTIFIER`            |
| `certifierSbsHttp`     | `VITE_API_CERTIFIER_SBS_URL`      | `DEVELOP_URLSBSAPICERTIFIER`            |

---

## Cómo usar las instancias en un MFE

### Caso 1 — Llamada GET simple

```ts
import { sipaHttp } from '@sipabanca/shared-http'

const response = await sipaHttp.get('/polizas')
const polizas = response.data
```

### Caso 2 — POST con payload tipado

```ts
import { integrationHttp } from '@sipabanca/shared-http'

interface CrearSolicitudPayload {
  tipo: string
  monto: number
}

const { data } = await integrationHttp.post<{ id: string }>(
  '/solicitudes',
  { tipo: 'credito', monto: 5_000_000 } satisfies CrearSolicitudPayload
)
```

### Caso 3 — Manejo de errores (formato `ApiError`)

Todos los errores de red o respuestas con código ≥ 400 se normalizan al tipo `ApiError`:

```ts
import { reportsHttp } from '@sipabanca/shared-http'
import type { ApiError } from '@sipabanca/shared-types'

try {
  const { data } = await reportsHttp.get('/reportes/cartera')
  // ...
} catch (error) {
  const apiError = error as ApiError
  console.error(apiError.code)    // ej: 'NOT_FOUND'
  console.error(apiError.message) // ej: 'El reporte no existe'
  console.error(apiError.traceId) // ID de trazabilidad del backend
}
```

### Caso 4 — Dentro de un store Pinia

```ts
// apps/mfe-dashboard/src/stores/dashboard.store.ts
import { defineStore } from 'pinia'
import { sipaHttp, dictionariesHttp } from '@sipabanca/shared-http'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    polizas: [] as Poliza[],
    catalogos: {} as Record<string, string[]>,
  }),
  actions: {
    async cargarPolizas() {
      const { data } = await sipaHttp.get<Poliza[]>('/polizas')
      this.polizas = data
    },
    async cargarCatalogos() {
      const { data } = await dictionariesHttp.get('/catalogos/tipos-poliza')
      this.catalogos = data
    },
  },
})
```

---

## Cuándo crear una instancia propia en lugar de usar las compartidas

Usa `createHttpClient` directamente **solo si** el MFE necesita:

- Headers personalizados que no aplican a otros MFEs
- Un `baseURL` que no existe en el registro global de entornos
- Un timeout diferente al global (`VITE_HTTP_TIMEOUT_MS`)

```ts
// apps/mfe-dashboard/src/services/http.ts
import { createHttpClient } from '@sipabanca/shared-http'

export const dashboardHttp = createHttpClient({
  service: 'accounts',
  headers: { 'X-MFE-Source': 'dashboard' },
})
```

---

## Comportamiento automático de todas las instancias

Todas las instancias (compartidas o propias) incluyen de forma transparente:

| Comportamiento | Descripción |
|---|---|
| **Bearer token** | El JWT del usuario se inyecta automáticamente en cada request vía interceptor |
| **Renovación 401** | Si el token expiró, se renueva con Keycloak antes de reintentar la llamada |
| **Logout forzado** | Si el token no se puede renovar, se redirige a `/login` |
| **Formato `ApiError`** | Todos los errores se normalizan a `{ code, message, details, traceId }` |
| **Timeout global** | Configurado con `VITE_HTTP_TIMEOUT_MS` (por defecto 15 000 ms) |

---

## Levantar el entorno de desarrollo

El modo activo determina qué archivo `.env` carga Vite y, por tanto, a qué URLs
apuntan todas las instancias Axios.

| Comando | Archivo `.env` cargado | APIs heredadas SipaNew |
|---|---|---|
| `npm run dev:all` | `.env.development` | `localhost` (servicios levantados localmente) |
| `npm run dev:all:remote` | `.env.development-remote` | `devsyli.sbseguros.co` (servidores de certificación) |

> **Equivalencia con SipaNew**
> - `npm run dev:all` → `dev-local.env.js`
> - `npm run dev:all:remote` → `dev-pre.env.js`

En ambos casos los MFEs siguen corriendo en `localhost` — solo cambian las URLs
de los backends heredados.

---

## Archivos relacionados

| Archivo | Descripción |
|---|---|
| [libs/shared/http/src/instances.ts](../../libs/shared/http/src/instances.ts) | Definición de todas las instancias compartidas |
| [libs/shared/http/src/http-client.ts](../../libs/shared/http/src/http-client.ts) | Fábrica `createHttpClient` con interceptores |
| [libs/shared/http/src/env-config.ts](../../libs/shared/http/src/env-config.ts) | Registro central de variables de entorno |
| [docs/architecture/environment-config.md](./environment-config.md) | Cómo funciona la configuración de entornos |
| [.env.production](../../.env.production) | URLs de producción |
| [.env.certification](../../.env.certification) | URLs de certificación |
