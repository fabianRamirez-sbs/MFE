# Configuración de Entornos — Variables de Entorno Centralizadas

## Contexto

El proyecto maneja **3 entornos** (desarrollo, certificación y producción), cada uno con su
propio backend. Se necesitaba una estrategia para que todos los MFEs del monorepo apuntaran
al backend correcto sin tener URLs hardcodeadas en el código.

---

## Archivos creados o modificados

### Archivos nuevos

| Archivo | Descripción |
|---------|-------------|
| `.env.example` | Plantilla con todas las variables disponibles. **Este es el único `.env` que va al repositorio.** |
| `.env.development` | Valores para desarrollo local (localhost). No va al repo. |
| `.env.certification` | Valores para el ambiente de certificación (QA). No va al repo. |
| `.env.production` | Valores para producción. No va al repo. |
| `libs/shared/http/src/env-config.ts` | Registro tipado central de variables de entorno. |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `vite.config.base.ts` | Se agregó `envDir` apuntando a la raíz del monorepo. |
| `libs/shared/http/src/http-client.ts` | `createHttpClient` ahora acepta una clave de servicio (`service`) en lugar de una URL directa. |
| `libs/shared/http/src/index.ts` | Se re-exporta `env`, `isDev`, `isCert`, `isProd` y los tipos de `env-config.ts`. |
| `nx.json` | Se agregaron `configurations` en `build` y `serve` para mapear cada entorno. |
| `.gitignore` | Se excluyeron los archivos `.env.*` con valores reales. Solo `.env.example` se commitea. |

---

## Estructura de variables por sección

```
VITE_APP_ENV            → 'development' | 'certification' | 'production'
VITE_APP_VERSION        → versión de la aplicación

VITE_KEYCLOAK_URL       → URL del servidor Keycloak
VITE_KEYCLOAK_REALM     → Realm de Keycloak
VITE_KEYCLOAK_CLIENT_ID → Client ID del Shell SPA en Keycloak

VITE_API_CORE_URL          → Backend: core bancario (usuario, permisos)
VITE_API_ACCOUNTS_URL      → Backend: cuentas y saldos
VITE_API_TRANSFERS_URL     → Backend: transferencias
VITE_API_NOTIFICATIONS_URL → Backend: notificaciones

VITE_MFE_DASHBOARD_URL  → remoteEntry.js del MFE Dashboard
VITE_MFE_ACCOUNTS_URL   → remoteEntry.js del MFE Accounts
VITE_MFE_TRANSFERS_URL  → remoteEntry.js del MFE Transfers
VITE_MFE_LEGACY_URL     → remoteEntry.js del MFE Legacy
VITE_MFE_LEGACY_BASE_URL → URL base del iframe legacy

VITE_HTTP_TIMEOUT_MS    → Timeout global para todas las llamadas Axios
```

---

## Cómo Vite resuelve los archivos `.env`

Vite carga los archivos en este orden (mayor prioridad primero):

```
.env.[mode].local  >  .env.[mode]  >  .env.local  >  .env
```

La opción `envDir` en `vite.config.base.ts` apunta a la **raíz del monorepo**, por lo que
todos los proyectos (`shell`, `mfe-dashboard`, `mfe-accounts`, etc.) leen los mismos archivos
de entorno sin necesitar cada uno sus propios `.env`.

---

## Comandos por entorno

### Desarrollo local (modo por defecto)
```bash
nx serve shell
nx serve mfe-dashboard
```

### Certificación
```bash
nx serve shell --configuration=certification
nx build shell --configuration=certification
nx run-many --target=build --all --configuration=certification
```

### Producción
```bash
nx build shell
nx run-many --target=build --all
```

---

## Registro tipado: `env-config.ts`

Este es el **único archivo** que lee variables `VITE_*` directamente.
El resto del código importa desde aquí, garantizando:

- TypeScript valida que todas las variables requeridas existan.
- Si una variable cambia de nombre, el error se corrige en un solo lugar.
- Los tests pueden mockear este módulo fácilmente con `vi.mock`.

```ts
import { env, isDev, isCert, isProd } from '@sipabanca/shared-http'

env.api.accounts   // → URL del backend de cuentas según el entorno
env.keycloak.url   // → URL de Keycloak según el entorno
isDev              // → true si VITE_APP_ENV=development
```

Si una variable requerida está vacía, `env-config.ts` lanza un error descriptivo
**en tiempo de arranque** (solo en modo desarrollo) para que el desarrollador sepa
exactamente qué variable falta.

---

## Cómo consumen los MFEs las URLs de backend

### Antes del ajuste ❌
```ts
// URL hardcodeada — no cambia entre entornos
const http = createHttpClient({
  baseURL: 'http://localhost:8091/api'
})
```

### Después del ajuste ✅
```ts
// La URL se resuelve automáticamente según el entorno activo
const http = createHttpClient({ service: 'accounts' })
```

| Entorno | URL resultante |
|---------|---------------|
| `development` | `http://localhost:8091/api` |
| `certification` | `https://api.cert.sipabanca.com/accounts` |
| `production` | `https://api.sipabanca.com/accounts` |

### Servicios disponibles

```ts
createHttpClient({ service: 'core' })
createHttpClient({ service: 'accounts' })
createHttpClient({ service: 'transfers' })
createHttpClient({ service: 'notifications' })
```

Si se necesita una URL arbitraria (ej: integración externa), se puede seguir usando
`baseURL` directamente:
```ts
createHttpClient({ baseURL: 'https://api-externa.com/v2' })
```

---

## Seguridad

- Los archivos `.env.development`, `.env.certification` y `.env.production` están en
  `.gitignore` y **nunca deben commitearse**.
- El único archivo que va al repositorio es `.env.example`, que contiene las claves
  pero sin valores reales.
- En CI/CD, las variables se inyectan como **secrets del pipeline** (GitHub Actions,
  GitLab CI, etc.) y no como archivos en el repositorio.

### Configuración recomendada en CI/CD

```yaml
# GitHub Actions — ejemplo para certificación
- name: Build certification
  env:
    VITE_APP_ENV: certification
    VITE_KEYCLOAK_URL: ${{ secrets.CERT_KEYCLOAK_URL }}
    VITE_API_CORE_URL: ${{ secrets.CERT_API_CORE_URL }}
    VITE_API_ACCOUNTS_URL: ${{ secrets.CERT_API_ACCOUNTS_URL }}
    # ... resto de variables
  run: nx run-many --target=build --all --configuration=certification
```

---

## Setup inicial para un desarrollador nuevo

```bash
# 1. Clonar el repositorio
git clone https://github.com/sipabanca/mfe.git
cd SipaBanca-MFE

# 2. Copiar la plantilla y completar los valores
cp .env.example .env.development
# Editar .env.development con las URLs del backend local

# 3. Instalar dependencias
npm install

# 4. Levantar el Shell y los MFEs
nx run-many --target=serve --all --parallel
```

---

## Autenticación Mock para desarrollo local

### Contexto

Keycloak requiere un servidor corriendo (Docker o instancia compartida) para que la
aplicación arranque. Esto bloquea a desarrolladores que trabajan offline o que no
tienen acceso inmediato a la instancia de desarrollo.

La solución es un **modo mock de autenticación** que se activa con una variable de entorno
y simula un usuario autenticado sin realizar ninguna petición al servidor de Keycloak.

### Variables de entorno

```
VITE_AUTH_MOCK_ENABLED=true       # Activa el modo mock (solo en development)
VITE_AUTH_MOCK_USER_ID=dev-001    # ID del usuario simulado
VITE_AUTH_MOCK_USERNAME=dev.user  # Username (preferred_username en JWT real)
VITE_AUTH_MOCK_EMAIL=dev@sipabanca.com
VITE_AUTH_MOCK_FULL_NAME=Developer Local
VITE_AUTH_MOCK_ROLES=user,admin   # Lista separada por coma
VITE_AUTH_MOCK_TOKEN=mock-dev-token-local  # Token ficticio para cabeceras
```

En `.env.certification` y `.env.production` la variable está fijada en `false`
de forma explícita para evitar activaciones accidentales.

### Archivos involucrados

| Archivo | Cambio |
|---------|--------|
| `libs/shared/auth/src/auth-result.ts` | Interface `AuthResult` — contrato normalizado que produce tanto el flujo mock como el real |
| `libs/shared/auth/src/mock-auth.ts` | `buildMockAuthResult()` — lee las vars del `.env` y construye el usuario |
| `libs/shared/auth/src/keycloak.ts` | Nueva función `initAuth()` — punto de entrada unificado que elige el flujo automáticamente |
| `apps/shell/src/stores/shell.store.ts` | Nuevo action `initFromAuth(auth: AuthResult)` |
| `apps/shell/src/main.ts` | Usa `initAuth()` + `shellStore.initFromAuth()` |

### Cómo funciona

```
VITE_AUTH_MOCK_ENABLED=true  +  VITE_APP_ENV=development
            ↓
      initAuth() detecta mock + isDev
            ↓
   buildMockAuthResult()  ←── lee VITE_AUTH_MOCK_* del .env
            ↓
  shellStore.initFromAuth(auth)  ←── isAuthenticated=true, roles cargados
            ↓
  Router guard pasa ✅  (sin tocar Keycloak ni red)
```

La función `initAuth()` tiene una **doble guardia de seguridad**:

1. El mock solo se activa cuando `VITE_APP_ENV=development` **y** `VITE_AUTH_MOCK_ENABLED=true`.
   Si solo una de las dos condiciones se cumple, usa Keycloak real.
2. Si por error alguien define `VITE_AUTH_MOCK_ENABLED=true` en certification o
   producción, se emite un `console.error` y se ignora el mock.

### Cómo usarlo en el día a día

**Trabajar sin Keycloak (modo mock):**
```bash
# .env.development ya trae VITE_AUTH_MOCK_ENABLED=true por defecto
nx serve shell
```

**Volver a usar Keycloak real:**
```bash
# En .env.development
VITE_AUTH_MOCK_ENABLED=false
```

**Cambiar el usuario simulado:**
```bash
# En .env.development — ajustar según la necesidad de la tarea
VITE_AUTH_MOCK_USERNAME=otra.persona
VITE_AUTH_MOCK_EMAIL=otra@sipabanca.com
VITE_AUTH_MOCK_ROLES=user,transfers
```

### Cómo consumir el estado en los MFEs

Los MFEs no necesitan ningún cambio. Siguen usando `useAuth()` de `@sipabanca/shared-auth`,
que lee del store compartido (storeId `'shell'`). El store ya fue hidratado por el Shell
con los datos del mock antes de que los MFEs monten.

```ts
import { useAuth } from '@sipabanca/shared-auth'

const { user, token, hasRole } = useAuth()

hasRole('admin')  // → true (según VITE_AUTH_MOCK_ROLES)
user.value?.email // → 'dev@sipabanca.com' (según VITE_AUTH_MOCK_EMAIL)
```
