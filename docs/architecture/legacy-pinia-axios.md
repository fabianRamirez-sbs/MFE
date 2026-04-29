# Estado global y Axios en el contexto del legacy

## El problema de fondo

SipaNew (Vue 2 + Vuex) y los MFEs nuevos (Vue 3 + Pinia) **no pueden compartir
directamente ni el store ni las instancias Axios**: son runtimes de Vue incompatibles
que viven en contextos JavaScript separados.

La arquitectura resuelve esto con una **frontera de aislamiento** (el `<iframe>`) y un
**protocolo de mensajes** (`postMessage`) como único canal de comunicación.

```
┌──────────────────────────────────────────────────────────────┐
│  Shell + MFEs nuevos (Vue 3 + Pinia + @sipabanca/shared-http)│
│                                                              │
│   useSharedStore()                createHttpClient()         │
│         │                                │                   │
│         │  postMessage (IframeBridge)     │                   │
│  ┌──────▼──────────────────────────────────────────────┐    │
│  │  <iframe> — SipaNew (Vue 2 + Vuex + Axios propio)   │    │
│  │                                                      │    │
│  │   ShellBridge.onTokenReceived()                      │    │
│  │      └─▶ store.commit('auth/SET_TOKEN', token)       │    │
│  │                                                      │    │
│  │   axios.defaults.headers.Authorization = Bearer ...  │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Pinia global: qué ve el legacy y qué no

El store Pinia (`useSharedStore`) es singleton dentro del mundo Vue 3.
El legacy **no puede importarlo** — está en un iframe con su propio scope de JS.

Lo que sí recibe el legacy, vía `postMessage`, es una **proyección** del estado:

| Dato en Pinia (`useSharedStore`) | Mensaje enviado al iframe | Lo recibe el legacy como |
|---|---|---|
| `accessToken` | `AUTH_TOKEN` | `store.commit('auth/SET_TOKEN', token)` |
| `preferences` | `PREFERENCES` | `store.commit('preferences/SET', prefs)` |
| — | ← `NAVIGATE` | El legacy pide navegar |
| — | ← `LOGOUT` | El legacy pide cerrar sesión |

El Shell escucha cambios reactivos en Pinia (con `watch`) y los propaga automáticamente:

```ts
// apps/shell/src/components/LegacyMfeWrapper.vue
watch(
  () => shellStore.accessToken,
  (newToken) => {
    bridge?.send({ type: 'AUTH_TOKEN', payload: { token: newToken } })
  }
)
```

---

## Axios en el legacy: dos estrategias

### Estrategia A — Configurar el Axios del propio legacy (recomendada)

El legacy sigue usando su instancia Axios actual. Solo se cambia cómo recibe el token:

```js
// docs/SipaNew/src/services/http.js  (o donde se configure Axios en SipaNew)

// ANTES (token hardcodeado o desde Vuex directamente)
axios.defaults.headers.common['Authorization'] = `Bearer ${store.state.auth.token}`

// DESPUÉS (token inyectado por el Shell vía postMessage)
// En LegacyAppBridge.js, onTokenReceived ya hace:
//   store.commit('auth/SET_TOKEN', token)
// Solo asegurarse de que el interceptor Axios lee desde Vuex:
axios.interceptors.request.use((config) => {
  const token = store.state.auth.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

Las URLs de los backends del legacy se siguen leyendo desde sus propias variables
de entorno de webpack (`PRODUCTION_URLSERVICES`, etc.) — **no cambia nada** en el
código Vue 2 existente.

### Estrategia B — Usar las instancias de `@sipabanca/shared-http` desde el Shell

Si el Shell necesita hacer llamadas a APIs del legacy en nombre del usuario
(sin pasar por el iframe), puede usar las instancias compartidas directamente:

```ts
// Desde cualquier MFE Vue 3 o el propio Shell
import { integrationHttp, sipaHttp } from '@sipabanca/shared-http'

// La instancia ya lleva el token automáticamente vía interceptor
const { data } = await sipaHttp.get('/polizas')
```

Esta estrategia **no involucra al iframe** — es una llamada directa al backend
desde el mundo Vue 3. Útil cuando se quiere mostrar datos del legacy en el Shell
(ej: saldo en la NavBar) sin esperar a que el iframe esté montado.

---

## Flujo completo al hacer login

```
1. Shell — Keycloak autentica → initFromAuth(authResult)
       │
       ▼
2. useShellStore().accessToken = "eyJ..."
   useShellStore().userProfile  = { id, username, email, roles }
       │
       ├─▶ 3a. MFEs Vue 3: leen el store via useSharedStore()
       │         Los interceptores Axios del shared-http
       │         inyectan el token en cada request automáticamente
       │
       └─▶ 3b. LegacyMfeWrapper monta el <iframe>
                 IframeBridge.onReady():
                   bridge.send({ type: 'AUTH_TOKEN', payload: { token } })
                       │
                       ▼
                 LegacyAppBridge.onTokenReceived(token):
                   store.commit('auth/SET_TOKEN', token)
                       │
                       ▼
                 Interceptor Axios del legacy:
                   Authorization: Bearer eyJ...
```

---

## Renovación de token (reautenticación silenciosa)

Keycloak puede renovar el token en background. El Shell lo detecta y lo propaga:

```ts
// El interceptor 401 en shared-http/http-client.ts renueva el token:
await keycloak.updateToken(30)

// El watch en LegacyMfeWrapper lo reenvía al iframe automáticamente:
watch(() => shellStore.accessToken, (newToken) => {
  bridge?.send({ type: 'AUTH_TOKEN', payload: { token: newToken } })
})
```

El legacy recibe el token renovado sin necesidad de hacer login de nuevo.

---

## Resumen de responsabilidades

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Shell | Vue 3 + Pinia | Autenticar, hidratar el store, propagar token al iframe |
| `@sipabanca/shared-state` | Pinia singleton | Contrato de estado compartido entre MFEs Vue 3 |
| `@sipabanca/shared-http` | Axios + interceptores | Instancias listas con token automático para MFEs Vue 3 |
| `IframeBridge` | `postMessage` | Canal tipado y seguro Shell ↔ legacy |
| `LegacyAppBridge.js` | JS puro | Recibe mensajes del Shell y los aplica al Vuex/Axios del legacy |
| SipaNew (legacy) | Vue 2 + Vuex | Gestiona su propio estado y sus propias instancias Axios |

---

## Archivos relacionados

| Archivo | Descripción |
|---|---|
| [apps/shell/src/components/LegacyMfeWrapper.vue](../../apps/shell/src/components/LegacyMfeWrapper.vue) | Monta el iframe y gestiona el bridge desde el Shell |
| [apps/mfe-legacy-vue2/src/LegacyAppBridge.js](../../apps/mfe-legacy-vue2/src/LegacyAppBridge.js) | Recibe mensajes y los aplica al Vuex/Axios del legacy |
| [libs/shared/utils/src/iframe-bridge.ts](../../libs/shared/utils/src/iframe-bridge.ts) | Implementación del protocolo `postMessage` tipado |
| [libs/shared/state/src/shell.store.ts](../../libs/shared/state/src/shell.store.ts) | Store Pinia compartido entre MFEs Vue 3 |
| [libs/shared/http/src/instances.ts](../../libs/shared/http/src/instances.ts) | Instancias Axios compartidas para MFEs Vue 3 |
| [docs/architecture/http-instances.md](./http-instances.md) | Guía de uso de instancias Axios |
