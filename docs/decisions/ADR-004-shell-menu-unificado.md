# ADR-004 — Menú único en el Shell (Opción 4)

**Estado:** Propuesto  
**Fecha:** 2026-04-29  
**Autores:** Equipo SipaBanca MFE

---

## Contexto

En el estado actual el usuario ve **dos menús simultáneos**:

1. El drawer del **Shell** (`AppShell.vue`) — Vue 3 + Vuetify 3 + Pinia — construido con los datos de `moduleProfileAppAuthenticate` que devuelve `POST /api/v1/sbs/login`.
2. El `<NavBar />` de **mfe-sipa-new** (`App.vue`) — Vue 2 + Vuetify 2 + Vuex — que hace su propio login interno y construye su propio menú con los mismos datos.

El objetivo es que **el Shell sea el único dueño del menú**, convirtiendo mfe-sipa-new en un MFE embebido sin UI de navegación propia.

---

## Decisión

Implementar la **Opción 4**: el Shell construye el menú completo a partir de `appComponents` y `userModules` almacenados en Pinia. mfe-sipa-new recibe la sesión vía `IframeBridge` (`postMessage`) y desactiva su propio `<NavBar />`.

No se modifica el backend ni la base de datos.

---

## Flujo objetivo

```
Usuario autenticado con Keycloak
        │
        ▼
AppSelectView.vue (Shell)
  └─ POST /api/v1/sbs/login
        │
        ▼ resultObject
  shellStore.setUserSession()
  ├─ userModules  → drawer del Shell  ──► rutas /sipa-new/{path}
  └─ appComponents → registradas en mfe-sipa-new vía IframeBridge

        │
        ▼ navega a /sipa-new/...
MfeSipaNewView.vue (Shell)
  └─ <iframe src="...">
        │  postMessage AUTH_SESSION
        ▼
  mfe-sipa-new/main.js (listener)
  └─ store.commit("userStore/auth_success", payload)
  └─ store.commit("userStore/token_success", token)
  └─ localStorage.setItem("isAuthTrue", "true")
  └─ router llama registerComponents()
  └─ router.push(path) ──► renderiza el componente solicitado
```

---

## Cambios por archivo

### Paso 1 — Extender `BridgeMessageType` en shared-utils

**Archivo:** `libs/shared/utils/src/iframe-bridge.ts`

Añadir el nuevo tipo de mensaje `AUTH_SESSION` al union type:

```diff
- export type BridgeMessageType = 'AUTH_TOKEN' | 'NAVIGATE' | 'LOGOUT' | 'READY' | 'PREFERENCES'
+ export type BridgeMessageType = 'AUTH_TOKEN' | 'AUTH_SESSION' | 'NAVIGATE' | 'LOGOUT' | 'READY' | 'PREFERENCES'
```

`AUTH_SESSION` transporta todo lo necesario para hidratar el store de mfe-sipa-new de una vez:

```ts
// Payload de AUTH_SESSION
interface AuthSessionPayload {
  token: string                          // tokenSBS de Stratio
  user: string                           // fullName del usuario
  email: string                          // email del usuario
  profileUser: Record<string, unknown>   // person de /login
  componentsUser: AppComponent[]         // appComponents de /login
  modulesUser: ModuleMenu[]              // moduleProfileAppAuthenticate de /login
  profileApp: { profileCode: number; applicationCode: number }
  userAppId: number
}
```

---

### Paso 2 — Enviar `AUTH_SESSION` desde `MfeSipaNewView.vue`

**Archivo:** `apps/shell/src/views/MfeSipaNewView.vue`

Actualmente `onReady` solo envía `AUTH_TOKEN`. Extenderlo para enviar `AUTH_SESSION`:

```ts
onReady: () => {
  const store = shellStore

  bridge?.send({
    type: 'AUTH_SESSION',
    payload: {
      token: store.accessToken,
      user: store.userProfile?.fullName ?? '',
      email: store.userProfile?.email ?? '',
      profileUser: {},                        // mfe-sipa-new no lo usa visualmente
      componentsUser: store.appComponents,
      modulesUser: store.userModules,
      profileApp: {
        profileCode: store.selectedApp?.profileCode ?? 0,
        applicationCode: store.selectedApp?.applicationCode ?? 0,
      },
      userAppId: 0,                           // disponible en LoginSessionResult si se tipifica
    },
  })
},
```

> **Nota:** `LoginSessionResult` ya tiene `userAppId`. Si se necesita, agregar `userAppId` al `shell.store.ts` y al `setUserSession()`.

---

### Paso 3 — Prefijo `/sipa-new/` en el drawer de `AppShell.vue`

**Archivo:** `apps/shell/src/components/AppShell.vue`

El drawer ya itera `subModule.appComponent.path`. Corregir el `router-link` para que use el prefijo del MFE:

```diff
- <router-link :to="{ path: subModule.appComponent.path }" ...>
+ <router-link :to="{ path: '/sipa-new/' + subModule.appComponent.path }" ...>
```

> Cuando existan MFEs independientes (dashboard, accounts, etc.) con sus propias rutas, este prefijo deberá ser dinámico. Para esta fase es estático `/sipa-new/`.

---

### Paso 4 — Listener `postMessage` en `mfe-sipa-new/main.js`

**Archivo:** `apps/mfe-sipa-new/src/main.js`

Agregar el listener **antes** de que Vue monte la app. Cuando llega `AUTH_SESSION`:

1. Hidrata el store Vuex con los mismos commits que hace `login2()`.
2. Setea `localStorage.isAuthTrue = "true"` para que el guard `router.beforeEach` no redirija a `/PreLogin`.
3. Llama a `registerComponents()` para registrar las rutas dinámicas en el router de Vue 2.
4. Navega a la ruta solicitada.

```js
// En main.js, antes de new Vue(...)
window.addEventListener('message', (event) => {
  if (!event.data?.type) return

  if (event.data.type === 'AUTH_SESSION') {
    const p = event.data.payload

    // 1. Hidratar Vuex
    store.commit('userStore/token_success', p.token)
    store.commit('userStore/auth_success', {
      user:           { user: p.user, email: p.email },
      profileUser:    p.profileUser,
      componentsUser: p.componentsUser,
      modulesUser:    p.modulesUser,
      profileApp:     p.profileApp,
    })

    // 2. Guardar sesión en localStorage para el guard del router
    localStorage.setItem('isAuthTrue', 'true')

    // 3. Registrar rutas dinámicas (equivale a registerComponents())
    p.componentsUser.forEach(e => {
      router.addRoutes([{
        path:      `/${e.path}`,
        component: () => import(`@/${e.component}`),
        name:      e.name,
        props:     true,
      }])
    })
    store.commit('userStore/registeredComponentsSuccess')

    // 4. Navegar a la ruta si el iframe ya fue cargado con una sub-ruta
    const hash = window.location.hash.replace('#', '') || '/'
    if (hash && hash !== '/') {
      router.push(hash).catch(() => {})
    }
  }
})
```

> **Seguridad:** en producción validar `event.origin` contra `VITE_MFE_SIPA_NEW_BASE_URL` del Shell antes de procesar el mensaje.

---

### Paso 5 — Ocultar `<NavBar />` en `mfe-sipa-new/App.vue`

**Archivo:** `apps/mfe-sipa-new/src/App.vue`

Cuando corre dentro de un iframe (embebido en el Shell) el NavBar no debe renderizarse:

```diff
  <div id="app">
    <v-app>
-     <NavBar />
+     <NavBar v-if="!isEmbedded" />
      <router-view></router-view>
    </v-app>
  </div>

  // en <script>:
+ data() {
+   return {
+     isEmbedded: window.self !== window.top,
+   }
+ },
```

Esto preserva la capacidad de que mfe-sipa-new corra standalone (con su propio menú) si alguna vez se necesita.

---

## Diagrama de secuencia

```
Shell                              mfe-sipa-new (iframe)
  │                                        │
  │── onMounted (MfeSipaNewView) ─────────►│
  │                                        │── window.onload ──► postMessage READY
  │◄─────────────────── READY ─────────────│
  │                                        │
  │── postMessage AUTH_SESSION ───────────►│
  │   { token, componentsUser,             │── store.commit auth_success
  │     modulesUser, profileApp }          │── localStorage.isAuthTrue = true
  │                                        │── registerComponents()
  │                                        │── router.push(hash)
  │                                        │
  │  [Usuario click en drawer del Shell]   │
  │── router.push('/sipa-new/{path}') ────►│
  │   (cambia src del iframe)              │── router navega a /{path}
  │                                        │
```

---

## Archivos modificados — Resumen

| Archivo | Tipo de cambio |
|---|---|
| `libs/shared/utils/src/iframe-bridge.ts` | Añadir tipo `AUTH_SESSION` |
| `apps/shell/src/views/MfeSipaNewView.vue` | Enviar `AUTH_SESSION` en `onReady` |
| `apps/shell/src/components/AppShell.vue` | Prefijo `/sipa-new/` en router-link del drawer |
| `apps/mfe-sipa-new/src/main.js` | Listener `postMessage` para `AUTH_SESSION` |
| `apps/mfe-sipa-new/src/App.vue` | `v-if="!isEmbedded"` en `<NavBar />` |

Sin cambios en: backend, base de datos, `shell.store.ts`, `AppSelectView.vue`, ni ninguna ruta del router del Shell.

---

## Criterios de aceptación

- [ ] Al navegar a `/sipa-new/alguna-ruta`, el iframe no muestra el NavBar de mfe-sipa-new.
- [ ] El drawer del Shell muestra todos los módulos y sub-módulos correctamente.
- [ ] Al hacer click en un sub-módulo del drawer, el iframe navega a la vista correcta de mfe-sipa-new.
- [ ] mfe-sipa-new puede seguir corriendo standalone (sin Shell) con su menú propio.
- [ ] El logout desde el Shell también limpia el estado de mfe-sipa-new (ya implementado vía mensaje `LOGOUT`).

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Race condition: `AUTH_SESSION` llega antes de que mfe-sipa-new monte Vue | Baja | El listener se registra en `main.js` antes de `new Vue()` |
| mfe-sipa-new no envía `READY` y el Shell nunca dispara `onReady` | Media | Añadir timeout fallback en `MfeSipaNewView.vue` con `window.load` del iframe |
| Rutas dinámicas ya registradas si el iframe recarga sin desmontar | Baja | `router.addRoutes` es idempotente en Vue Router 3 para nombres duplicados |
| `event.origin` no validado en desarrollo local | Baja | Aceptable en dev; en producción agregar validación explícita |
