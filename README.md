# SipaBanca MFE

Plataforma de **Micro-Frontends** bancaria construida con **Nx 19 + Vite 5 + Vue 3 + Module Federation**.

---

## Requisitos previos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Node.js | **20.19.2** | Usar NVM (`.nvmrc` en la raíz) |
| npm | 10+ | Incluido con Node 20 |
| Git | 2.x | — |
| NVM | cualquiera | Recomendado para cambiar de versión automáticamente |

> `mfe-legacy-vue2` requiere **Node 14.21.1** y tiene su propio `.nvmrc` dentro de `apps/mfe-legacy-vue2/`.

---

## Instalación inicial

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd SipaBanca-MFE

# 2. Activar la versión de Node correcta
nvm use          # lee .nvmrc → usa Node 20.19.2

# 3. Instalar dependencias (todas las apps y libs del monorepo)
npm install
```

---

## Configuración de entorno

El proyecto usa variables de entorno cargadas desde archivos `.env.*` en la **raíz** del monorepo.

```bash
# El archivo .env.development ya está incluido en el repositorio con valores locales.
# Si necesitas ajustar algo, edítalo directamente:
nano .env.development
```

### Variables clave para desarrollo local

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_AUTH_MOCK_ENABLED` | `true` | Activa el usuario mock y omite Keycloak |
| `VITE_MFE_DASHBOARD_URL` | `http://localhost:3002/assets/remoteEntry.js` | URL del bundle del Dashboard MFE |
| `VITE_API_ACCOUNTS_URL` | `http://localhost:8091/api` | API de cuentas (opcional en local) |

> **Importante:** `VITE_AUTH_MOCK_ENABLED=true` permite trabajar sin levantar un servidor Keycloak.
> **Nunca** activar esta variable en `certification` ni `production`.

---

## Ejecución en desarrollo local

### Opción A — Todas las apps de una vez (recomendado)

```bash
source ~/.nvm/nvm.sh && nvm use && npm run dev:all
```

El script `scripts/dev-all.sh` descubre **automáticamente** todas las apps dentro de `apps/` que tengan un `vite.config.ts` y las levanta en orden:

1. **Fase 1** — compila todos los MFEs remotos en paralelo (cada uno con su versión de Node desde `.nvmrc`)
2. **Fase 2** — compila el Shell (necesita los `remoteEntry.js` ya generados)
3. **Fase 3** — inicia todos los servidores de preview con `concurrently`

> Al agregar una nueva app en `apps/`, el script la detecta automáticamente siempre que tenga `vite.config.ts` con `preview: { port: XXXX }`.

### Opción B — Solo Shell + Dashboard

```bash
source ~/.nvm/nvm.sh && nvm use && npm run dev
```

Levanta únicamente el Shell (3001) y el Dashboard (3002). Útil cuando no necesitas el resto de las apps.

> **Importante:** `npm run dev` **no levanta** los MFEs de Cuentas (3003), Transferencias (3004) ni Legacy (3005). Usar `dev:all` o iniciarlos por separado — ver la sección [MFEs adicionales](#mfes-adicionales-cuentas-transferencias-legacy).

> **Por qué `build + preview` y no `vite dev`:**
> `@originjs/vite-plugin-federation` solo genera el archivo `remoteEntry.js` durante `vite build`.
> Con `vite dev` ese archivo no existe y el Shell no puede cargar los MFEs remotos.

Abre el navegador en **[http://localhost:3001](http://localhost:3001)** en cualquiera de las dos opciones.

### Opción C — Arrancar cada app por separado

Útil cuando solo necesitas iterar sobre un MFE específico.

```bash
# Terminal 1 — Reconstruir y servir el Dashboard
npx vite build apps/mfe-dashboard --mode development && npx vite preview apps/mfe-dashboard --port 3002

# Terminal 2 — Reconstruir y servir el Shell
npx vite build apps/shell --mode development && npx vite preview apps/shell --port 3001
```

---

## Puertos asignados

| App | Puerto | URL | Iniciado por `npm run dev` |
|---|---|---|---|
| Shell (orquestador) | **3001** | http://localhost:3001 | ✅ |
| mfe-dashboard | **3002** | http://localhost:3002 | ✅ |
| mfe-accounts | **3003** | http://localhost:3003 | ❌ ver abajo |
| mfe-transfers | **3004** | http://localhost:3004 | ❌ ver abajo |
| mfe-legacy-vue2 | **3005** | http://localhost:3005 | ❌ ver abajo |

---

## MFEs adicionales (Cuentas, Transferencias, Legacy)

`npm run dev` **no levanta** estos tres MFEs. Cada uno requiere un paso adicional:

### mfe-accounts — puerto 3003

> ⚠️ App en desarrollo — actualmente muestra "Próximamente" en el Shell.

```bash
source ~/.nvm/nvm.sh && nvm use && npm run start:accounts
```

### mfe-transfers — puerto 3004

> ⚠️ App en desarrollo — actualmente muestra "Próximamente" en el Shell.

```bash
source ~/.nvm/nvm.sh && nvm use && npm run start:transfers
```

### mfe-legacy-vue2 — puerto 3005

> Requiere **Node 14.21.1** (tiene su propio `.nvmrc` en `apps/mfe-legacy-vue2/`).
> Cambiar a Node 14 antes de arrancarlo y volver a Node 20 después.

```bash
# Terminal separada — cambiar a Node 14 para el MFE legacy
cd apps/mfe-legacy-vue2
source ~/.nvm/nvm.sh && nvm use   # carga Node 14.21.1 desde .nvmrc
npx vite build && npx vite preview --port 3005
```

---

## Flujo de navegación

```
localhost:3001/           → redirige a /dashboard
localhost:3001/dashboard  → carga el MFE Dashboard desde localhost:3002
localhost:3001/accounts   → "Próximamente" (mfe-accounts no implementado aún)
localhost:3001/transfers  → "Próximamente" (mfe-transfers no implementado aún)
localhost:3001/login      → pantalla de login (mock en local, Keycloak en staging/prod)
```

---

## Compilación para otros ambientes

```bash
# Certificación (QA)
npx vite build apps/mfe-dashboard --mode certification
npx vite build apps/shell --mode certification

# Producción
npx vite build apps/mfe-dashboard
npx vite build apps/shell
```

---

## Comandos útiles

```bash
# Verificar tipos TypeScript en todo el monorepo
npx tsc -p tsconfig.base.json --noEmit

# Ver el grafo de dependencias del monorepo
npx nx graph

# Compilar todas las apps
npm run build:all

# Ejecutar tests de todas las apps
npm run test:all

# Ejecutar linting
npm run lint:all
```

---

## Estructura del monorepo

```
SipaBanca-MFE/
├── apps/
│   ├── shell/                # Orquestador — layout, auth, routing global
│   ├── mfe-dashboard/        # MFE Dashboard (Vue 3)
│   ├── mfe-accounts/         # MFE Cuentas (Vue 3) — en desarrollo
│   ├── mfe-transfers/        # MFE Transferencias (Vue 3) — en desarrollo
│   └── mfe-legacy-vue2/      # Wrapper del proyecto Vue 2 existente
├── libs/
│   └── shared/
│       ├── shared-auth/      # Keycloak adapter + mock
│       ├── shared-ui/        # Design system (componentes + tokens)
│       └── shared-types/     # Tipos e interfaces globales
├── docs/
│   └── architecture/         # Documentación de arquitectura y decisiones (ADR)
├── .env.development          # Variables para desarrollo local
├── .env.example              # Plantilla — copiar para crear nuevos ambientes
├── .nvmrc                    # Versión de Node del proyecto (20.19.2)
└── vite.config.base.ts       # Configuración Vite compartida entre todas las apps
```

---

## Solución de problemas frecuentes

### El contenido del Dashboard no aparece en el Shell

Asegurarse de que `mfe-dashboard` fue compilado **antes** que el Shell y que está corriendo en el puerto 3002. Ejecutar `npm run dev` desde cero.

### Error "remoteEntry.js 404"

El archivo solo existe después de ejecutar `vite build`. No usar `vite dev` directamente — usar el workflow `build + preview` a través de `npm run dev`.

### Keycloak timeout / iframe error

Verificar que `.env.development` tenga `VITE_AUTH_MOCK_ENABLED=true` y que el build se haya ejecutado con `--mode development`. Sin ese flag, Vite no carga el archivo `.env.development`.

### Conflicto de puertos

Si algún puerto ya está en uso:
```bash
# Ver qué proceso usa el puerto (ej. 3001)
lsof -i :3001

# Matar el proceso
kill -9 <PID>
```

### Errores de TypeScript en consola del navegador

Ignorar errores que mencionen `apps/shell/node_modules/.vite/deps/vue.js` — son artefactos de sesiones anteriores en modo `vite dev` y no corresponden al modo `build + preview` actual.
