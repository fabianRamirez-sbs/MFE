# SipaBanca MFE — Arquitectura de Micro-Frontends

## Visión General

SipaBanca utiliza una arquitectura de **Micro-Frontends (MFE)** sobre un monorepo **Nx**, con
**Vite + Module Federation** como mecanismo de integración en runtime. El objetivo es permitir
que equipos independientes entreguen módulos bancarios de forma autónoma, con un Shell
centralizado que garantiza autenticación y experiencia de usuario consistente.

---

## Estructura del Monorepo

```
SipaBanca-MFE/
│
├── apps/                          # Aplicaciones desplegables independientemente
│   ├── shell/                     # ⭐ Orquestador — puerto 3000
│   │   ├── src/
│   │   │   ├── main.ts            # Bootstrap: Keycloak → Pinia → Router → Vue
│   │   │   ├── App.vue
│   │   │   ├── router/            # Rutas de primer nivel + navigation guards
│   │   │   ├── stores/            # shell.store.ts — estado global hidratado
│   │   │   ├── components/
│   │   │   │   ├── AppShell.vue   # Layout principal (NavBar + Sidebar + Slot)
│   │   │   │   └── LegacyMfeWrapper.vue  # Wrapper iframe para Vue 2
│   │   │   └── views/             # LoginView, NotFoundView, UnauthorizedView
│   │   ├── vite.config.ts         # federation remotes: { mfe-dashboard, ... }
│   │   └── .env.example
│   │
│   ├── mfe-dashboard/             # MFE Vue 3 — puerto 3001
│   │   ├── src/
│   │   │   ├── bootstrap.ts       # Punto expuesto: exposes { './App': bootstrap }
│   │   │   ├── main.ts            # Entrada standalone (dev sin Shell)
│   │   │   ├── router/routes.ts
│   │   │   ├── stores/            # Stores PRIVADOS del módulo
│   │   │   └── views/
│   │   └── vite.config.ts         # federation exposes: { './App': bootstrap }
│   │
│   ├── mfe-accounts/              # MFE Vue 3 — puerto 3002
│   ├── mfe-transfers/             # MFE Vue 3 — puerto 3003
│   └── mfe-legacy-vue2/           # Wrapper del proyecto Vue 2 — puerto 3004
│       ├── src/
│       │   ├── LegacyAppBridge.js # Adaptador postMessage Shell ↔ iframe
│       │   └── styles/
│       │       └── STYLE_ISOLATION.md
│       └── vite.config.ts
│
├── libs/                          # Librerías compartidas (NO desplegables solas)
│   └── shared/
│       ├── auth/                  # @sipabanca/shared-auth
│       │   └── src/
│       │       ├── keycloak.ts    # initKeycloak(), getKeycloak() — singleton
│       │       ├── composables/
│       │       │   └── useAuth.ts # Composable para MFEs
│       │       └── index.ts
│       │
│       ├── state/                 # @sipabanca/shared-state
│       │   └── src/
│       │       ├── shell.store.ts # Store Pinia con storeId='shell' (espejo)
│       │       ├── event-bus.ts   # MfeBus — comunicación desacoplada entre MFEs
│       │       └── index.ts
│       │
│       ├── http/                  # @sipabanca/shared-http
│       │   └── src/
│       │       ├── http-client.ts # createHttpClient() — fábrica Axios con auth
│       │       └── index.ts
│       │
│       ├── ui/                    # @sipabanca/shared-ui (Design System)
│       │   └── src/
│       │       ├── components/    # SbButton, SbCard, SbInput, SbModal...
│       │       ├── styles/
│       │       │   └── _tokens.scss  # Design Tokens (colores, spacing, tipografía)
│       │       └── index.ts
│       │
│       ├── utils/                 # @sipabanca/shared-utils
│       │   └── src/
│       │       ├── iframe-bridge.ts  # IframeBridge — protocolo postMessage tipado
│       │       └── index.ts
│       │
│       └── types/                 # @sipabanca/shared-types
│           └── src/
│               └── index.ts       # UserProfile, ApiResponse, MfeManifest...
│
├── tools/
│   ├── scripts/
│   │   ├── build-all.sh           # Build secuencial respetando dependencias
│   │   └── check-federation.sh    # Verificar que los remoteEntry son accesibles
│   └── generators/
│       └── mfe/                   # Nx generator para crear nuevos MFEs
│           └── schema.json
│
├── docs/
│   ├── architecture/
│   │   └── README.md              # Este archivo
│   └── decisions/
│       ├── ADR-001-module-federation.md
│       ├── ADR-002-pinia-singleton.md
│       └── ADR-003-legacy-iframe.md
│
├── nx.json
├── package.json
├── tsconfig.base.json
├── vite.config.base.ts
└── .eslintrc.json
```

---

## Estrategia de Comunicación (sin acoplamiento rígido)

### Flujo de autenticación

```
main.ts (Shell)
    │
    ├─── initKeycloak() ──→ Keycloak Server
    │         │
    │         └── keycloak.authenticated = true
    │
    ├─── createPinia()  ──→ instancia singleton
    │
    ├─── useShellStore().initFromKeycloak(keycloak)
    │         │
    │         └── [hydrata] userProfile, accessToken, roles
    │
    └─── app.mount('#app')
              │
              └── MFE cargado vía Module Federation
                        │
                        └── useSharedStore()  ← MISMO store (storeId='shell')
                                  │
                                  └── lee userProfile, accessToken, roles
```

### Por qué no hay acoplamiento rígido

| Mecanismo | Descripción |
|-----------|-------------|
| **Pinia singleton** | `vue` y `pinia` en `shared` de Module Federation garantizan UNA instancia. El Shell hidrata el store con storeId `'shell'`; los MFEs lo leen con el mismo id. Sin imports cruzados entre apps. |
| **useAuth() composable** | Los MFEs importan de `@sipabanca/shared-auth`, no del Shell. Si el Shell cambia su implementación interna, el contrato del composable no cambia. |
| **Event Bus** | Para notificaciones entre MFEs que no pasan por el estado global. Tipado con `MfeEventType`. |
| **IframeBridge** | Para el legacy Vue 2. Protocolo `postMessage` validado por origen. |

### Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│                    SHELL (puerto 3000)                       │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────────────┐  │
│  │  Keycloak   │  │  Pinia   │  │  Vue Router (L1 routes)│  │
│  │  bootstrap  │  │ shell    │  │                        │  │
│  └──────┬──────┘  │ store    │  └────────────────────────┘  │
│         │         └────┬─────┘                              │
└─────────┼──────────────┼──────────────────────────────────-─┘
          │              │ (Module Federation shared)
    ┌─────▼──────────────▼─────────────────────────────────┐
    │              SHARED LIBRARIES                         │
    │  shared-auth  shared-state  shared-http  shared-ui   │
    └─────┬──────────────┬──────────────────────────────────┘
          │              │ (importadas por los MFEs)
    ┌─────▼──────┐  ┌────▼────────┐  ┌───────────────────┐
    │ mfe-dash   │  │ mfe-accounts│  │  mfe-legacy (iframe│
    │ (Vue 3)    │  │ (Vue 3)     │  │   + postMessage)   │
    └────────────┘  └─────────────┘  └───────────────────-┘
```

---

## Hoja de Ruta por Fases

### Fase 1 — Workspace + Shell + Shared Libs ✅
- [x] Configurar Nx monorepo con workspace `sipabanca`
- [x] Shell con Vite + Module Federation (consumer)
- [x] `shared-auth`: wrapper Keycloak con singleton y renovación automática
- [x] `shared-state`: Pinia store espejo + Event Bus
- [x] `shared-http`: Axios factory con interceptores de auth
- [x] `shared-ui`: Design Tokens + componentes base (SbButton)
- [x] `shared-types`: contratos TypeScript compartidos
- [ ] Pipeline CI/CD básico (GitHub Actions o GitLab CI)
- [ ] Configurar Keycloak realm `sipabanca` con client `shell-spa`

### Fase 2 — Integración Legacy Vue 2
- [x] `LegacyAppBridge.js`: adaptador postMessage
- [x] `LegacyMfeWrapper.vue`: wrapper iframe en el Shell
- [x] Documentación de aislamiento de estilos
- [ ] Conectar el proyecto Vue 2 real al bridge
- [ ] Validar que el token fluye correctamente al legacy
- [ ] Pruebas de coexistencia de estilos en diferentes navegadores

### Fase 3 — Nuevos MFEs Vue 3
- [x] `mfe-dashboard` como MFE canónico de referencia
- [ ] `mfe-accounts`: gestión de cuentas
- [ ] `mfe-transfers`: transferencias interbancarias
- [ ] Nx Generator para crear nuevos MFEs con la estructura estándar
- [ ] Storybook para el Design System (`shared-ui`)
- [ ] Tests E2E con Playwright a nivel de integración Shell + MFE

---

## Estándar para nuevos MFEs Vue 3

Todo nuevo MFE debe seguir esta lista de verificación:

```
✅ vite.config.ts con federation exposes: { './App': './src/bootstrap.ts' }
✅ bootstrap.ts que exporta un componente Vue por defecto
✅ main.ts para desarrollo standalone con mock del shell store
✅ Stores locales NUNCA expuestos (privados al MFE)
✅ Usa useAuth() de @sipabanca/shared-auth (NO keycloak-js directo)
✅ Usa createHttpClient() de @sipabanca/shared-http (NO axios directo)
✅ Usa componentes de @sipabanca/shared-ui (NO estilos inline en layout)
✅ Emite eventos al bus (mfeBus) para notificar efectos secundarios
✅ Puerto único asignado (3001, 3002, 3003...)
✅ .env.example con VITE_API_BASE_URL
✅ project.json Nx con targets build/serve/test/lint
```

---

## Mantenibilidad — Estrategia anti-duplicación

| Categoría | Estrategia |
|-----------|------------|
| **UI Components** | `@sipabanca/shared-ui` — Design System con Storybook. PRs al DS pasan por revisión del equipo de UX. |
| **Autenticación** | `@sipabanca/shared-auth` — Zero código Keycloak en los MFEs. |
| **HTTP/API** | `@sipabanca/shared-http` — `createHttpClient()` obligatorio. Prohíbe `import axios from 'axios'` directo vía ESLint rule custom. |
| **Tipos** | `@sipabanca/shared-types` — Single source of truth para interfaces de dominio. |
| **Nx Affected** | `nx affected --target=build` — Solo rebuilds los proyectos impactados por los cambios. |
| **Versioning** | Las libs usan `*` en el workspace. En producción, se podría usar Changesets para versionado semántico. |
