# Vuetify 3 en SipaBanca MFE

**Versión de Vuetify:** `^3.8.0`  
**Plugin de build:** `vite-plugin-vuetify ^2.0.0`  
**Iconos:** `@mdi/font ^7.4.47`

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Automatic Treeshaking por MFE](#2-automatic-treeshaking-por-mfe)
3. [Singleton en Module Federation](#3-singleton-en-module-federation)
4. [Temas disponibles](#4-temas-disponibles)
5. [Personalización por MFE con MfeThemeProvider](#5-personalización-por-mfe-con-mfethemeprovider)
6. [Defaults globales de componentes](#6-defaults-globales-de-componentes)
7. [Configuración por app](#7-configuración-por-app)
8. [Agregar un nuevo MFE con Vuetify](#8-agregar-un-nuevo-mfe-con-vuetify)
9. [Agregar un nuevo tema](#9-agregar-un-nuevo-tema)
10. [Iconos MDI](#10-iconos-mdi)

---

## 1. Arquitectura general

```
Shell (instancia única de Vuetify en runtime)
  │
  │   ← vite-plugin-vuetify treeshakea los componentes del Shell
  │
  ├── NavBar / Sidebar / AppSelectView   → tema: sipabancaLight
  ├── mfe-dashboard  (remoteEntry.js)    → tema: dashboardTheme
  ├── mfe-accounts   (remoteEntry.js)    → tema: accountsTheme
  └── mfe-transfers  (remoteEntry.js)    → tema: transfersTheme

Cada MFE:
  - Bundlea SOLO los componentes Vuetify que su template usa (treeshaking)
  - En runtime recibe la instancia de Vuetify del Shell (singleton → 0 KB extra)
  - Aplica su propio tema con <MfeThemeProvider> sin romper el singleton
```

La instancia de Vuetify se crea **una sola vez** en el Shell (`apps/shell/src/main.ts`) y se
comparte con todos los MFEs a través de Module Federation. Los MFEs no repiten la instanciación.

---

## 2. Automatic Treeshaking por MFE

`vite-plugin-vuetify` con `autoImport: true` analiza los templates de cada app en tiempo de
build e importa automáticamente **solo** los componentes Vuetify que esa app usa.

```
Build de mfe-dashboard usa:   <v-card>, <v-btn>, <v-data-table>
  → bundle incluye: VCard, VBtn, VDataTable   (no VDialog, no VSelect, etc.)

Build de mfe-transfers usa:   <v-form>, <v-text-field>, <v-select>, <v-btn>
  → bundle incluye: VForm, VTextField, VSelect, VBtn
```

**No se necesita ningún `import` manual de componentes Vuetify.** El plugin lo resuelve en
build-time. Simplemente usar la etiqueta `<v-nombre-componente>` en el template es suficiente.

### Resultado en bundle size

Sin treeshaking: Vuetify completo ≈ 300 KB gzip por app  
Con treeshaking: solo los componentes usados ≈ 20–80 KB por app dependiendo del módulo

---

## 3. Singleton en Module Federation

Vuetify está declarado como `singleton: true` en la configuración de federation de **cada app**:

```ts
// apps/shell/vite.config.ts  y  apps/mfe-*/vite.config.ts
federation({
  shared: {
    vuetify: { singleton: true, requiredVersion: '^3.0.0' },
  },
})
```

Esto garantiza que en runtime solo existe una instancia de Vuetify (la del Shell). Si un MFE
necesitara una versión diferente de Vuetify, Module Federation lanzaría una advertencia en
consola en lugar de cargar dos instancias incompatibles.

### ¿Por qué es crítico el singleton?

- Vuetify usa un sistema de temas basado en CSS variables inyectadas en el DOM
- Si hubiera dos instancias, los temas se sobreescribirían mutuamente
- Los componentes de una instancia no reconocerían el contexto de la otra (ej: `v-overlay`)

---

## 4. Temas disponibles

Todos los temas se definen centralmente en `libs/shared/ui/src/vuetify.ts` y se registran al
crear la instancia. El tipo `MfeThemeName` garantiza que no haya strings mágicos en los MFEs.

| Nombre | Color primario | Uso | Fondo de app |
|---|---|---|---|
| `sipabancaLight` | Rosa `#9E1C64` | Shell, Login, AppSelect | `#f9fafb` |
| `sipabancaDark` | Rosa `#c9266e` | Modo oscuro global | `#111827` |
| `dashboardTheme` | Azul `#1e40af` | Módulo de resúmenes y reportes | `#f0f4ff` |
| `accountsTheme` | Verde `#166534` | Cuentas, ahorro, inversiones | `#f0fdf4` |
| `transfersTheme` | Índigo `#4338ca` | Pagos y transferencias | `#f5f3ff` |

Todos los temas comparten los colores semánticos (`error`, `warning`, `success`, `info`) para
mantener consistencia en los estados de feedback a través de toda la plataforma.

### Paleta de colores semánticos compartida

| Token | Hex | Uso |
|---|---|---|
| `error` | `#ef4444` | Errores, validaciones fallidas |
| `warning` | `#f59e0b` | Alertas no críticas |
| `success` | `#22c55e` | Confirmaciones, operaciones exitosas |
| `info` | `#3b82f6` | Información contextual |

---

## 5. Personalización por MFE con MfeThemeProvider

`MfeThemeProvider` es un componente de `@sipabanca/shared-ui` que envuelve el contenido del
MFE con `VThemeProvider` + `VDefaultsProvider`. No genera ningún elemento DOM extra.

### Uso básico

```vue
<template>
  <MfeThemeProvider theme="dashboardTheme">
    <v-container>
      <!-- Todo aquí usa el tema azul del dashboard -->
      <v-btn>Guardar</v-btn>
      <v-card>...</v-card>
    </v-container>
  </MfeThemeProvider>
</template>

<script setup lang="ts">
import { MfeThemeProvider } from '@sipabanca/shared-ui'
</script>
```

### Con defaults de componentes específicos del MFE

```vue
<MfeThemeProvider
  theme="transfersTheme"
  :defaults="{
    VBtn:       { size: 'large', rounded: 'pill' },
    VTextField: { density: 'compact', variant: 'filled' },
    VCard:      { elevation: 0, border: true }
  }"
>
  <!-- Dentro: todos los v-btn son grandes y en píldora,
       los v-text-field compactos con variante filled -->
</MfeThemeProvider>
```

### Con fondo del tema aplicado al contenedor

```vue
<!-- withBackground: true aplica el color `background` del tema como fondo -->
<MfeThemeProvider theme="accountsTheme" :with-background="true">
  ...
</MfeThemeProvider>
```

### Props de MfeThemeProvider

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `theme` | `MfeThemeName` | — | **Obligatorio.** Nombre del tema a aplicar |
| `withBackground` | `boolean` | `false` | Aplica el color `background` del tema como fondo |
| `defaults` | `Record<string, Record<string, unknown>>` | `{}` | Sobreescribe defaults de componentes Vuetify en este árbol |

---

## 6. Defaults globales de componentes

Los siguientes defaults aplican en **toda la plataforma** (definidos en `createVuetify()`).
Cada MFE puede sobreescribirlos localmente vía la prop `defaults` de `MfeThemeProvider`.

| Componente | Default global |
|---|---|
| `VBtn` | `variant="elevated"`, `rounded="sm"`, `color="primary"` |
| `VTextField` | `variant="outlined"`, `density="comfortable"`, `color="primary"` |
| `VSelect` | `variant="outlined"`, `density="comfortable"`, `color="primary"` |
| `VCard` | `rounded="lg"`, `elevation="2"` |

---

## 7. Configuración por app

### Shell (`apps/shell`)

El Shell es el **único** que instancia Vuetify y carga los estilos base. Los MFEs NO deben
importar `vuetify/styles` ni `@mdi/font` — esos ya vienen del Shell en runtime.

```ts
// apps/shell/src/main.ts
import { createVuetify } from '@sipabanca/shared-ui'
import 'vuetify/styles'                            // ← Solo en el Shell
import '@mdi/font/css/materialdesignicons.css'     // ← Solo en el Shell

app.use(createVuetify())
```

```ts
// apps/shell/vite.config.ts
plugins: [
  vue(),
  vuetify({ autoImport: true }),   // treeshaking para los componentes del Shell
  federation({
    shared: {
      vuetify: { singleton: true, requiredVersion: '^3.0.0' },
    },
  }),
]
```

### mfe-dashboard (`apps/mfe-dashboard`)

```ts
// apps/mfe-dashboard/vite.config.ts
plugins: [
  vue(),
  vuetify({ autoImport: true }),   // treeshaking para los componentes del dashboard
  federation({
    shared: {
      vuetify: { singleton: true, requiredVersion: '^3.0.0' },
    },
  }),
]
```

En `main.ts` (modo standalone para desarrollo) también se instancia Vuetify para poder
desarrollar el MFE sin el Shell. En producción, Module Federation usa la instancia del Shell.

```ts
// apps/mfe-dashboard/src/main.ts (standalone dev)
import { createVuetify } from '@sipabanca/shared-ui'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

app.use(createVuetify())
```

### Componente raíz de cada MFE

```vue
<!-- apps/mfe-dashboard/src/bootstrap.ts o DashboardView.vue -->
<template>
  <MfeThemeProvider theme="dashboardTheme">
    <!-- contenido del MFE -->
  </MfeThemeProvider>
</template>
```

---

## 8. Agregar un nuevo MFE con Vuetify

1. **`vite.config.ts`** del nuevo MFE:

```ts
import vuetify from 'vite-plugin-vuetify'

plugins: [
  vue(),
  vuetify({ autoImport: true }),
  federation({
    shared: {
      vuetify: { singleton: true, requiredVersion: '^3.0.0' },
    },
  }),
]
```

2. **`main.ts`** del nuevo MFE (modo standalone):

```ts
import { createVuetify } from '@sipabanca/shared-ui'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

app.use(createVuetify())
```

3. **Componente raíz** del nuevo MFE:

```vue
<template>
  <MfeThemeProvider theme="sipabancaLight">
    <!-- Usar sipabancaLight o crear un tema nuevo (ver sección 9) -->
  </MfeThemeProvider>
</template>
```

---

## 9. Agregar un nuevo tema

Editar `libs/shared/ui/src/vuetify.ts`:

```ts
// 1. Definir el objeto de tema
const reportsTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary:            '#b45309',   // Ámbar — reportes y analítica
    'primary-darken-1': '#92400e',
    secondary:          '#d97706',
    background:         '#fffbeb',
    surface:            '#ffffff',
    error:              '#ef4444',   // Mantener semánticos iguales
    warning:            '#f59e0b',
    success:            '#22c55e',
    info:               '#3b82f6',
  },
}

// 2. Registrar en la factory
theme: {
  themes: {
    // ...temas existentes...
    reportsTheme,   // ← agregar aquí
  },
}

// 3. Agregar al tipo
export type MfeThemeName =
  | 'sipabancaLight'
  | 'sipabancaDark'
  | 'dashboardTheme'
  | 'accountsTheme'
  | 'transfersTheme'
  | 'reportsTheme'   // ← agregar aquí
```

---

## 10. Iconos MDI

Se usa `@mdi/font` con la estrategia de fuente CSS (class-based). El CSS se carga **una sola
vez** en el Shell. Para usar un ícono:

```vue
<v-icon>mdi-account</v-icon>
<v-icon>mdi-bank</v-icon>
<v-icon>mdi-transfer</v-icon>
```

O directamente como prop en componentes Vuetify:

```vue
<v-btn prepend-icon="mdi-plus">Nueva transferencia</v-btn>
<v-list-item prepend-icon="mdi-home">Inicio</v-list-item>
```

### Buscador de iconos

Todos los íconos disponibles: [https://pictogrammers.com/library/mdi/](https://pictogrammers.com/library/mdi/)

### Migración futura a SVG (opcional)

Para reducir aún más el bundle, se puede migrar a `@mdi/js` con iconos SVG individuales:

```ts
// En vez de @mdi/font, instalar: npm install @mdi/js
import { mdiAccount, mdiBank } from '@mdi/js'
// Solo se incluyen en el bundle los íconos que se importan
```

---

## Archivos clave

| Archivo | Rol |
|---|---|
| `libs/shared/ui/src/vuetify.ts` | Factory `createVuetify()`, todos los temas, tipo `MfeThemeName` |
| `libs/shared/ui/src/components/MfeThemeProvider.vue` | Componente de personalización por MFE |
| `libs/shared/ui/src/index.ts` | Re-exporta `createVuetify`, `MfeThemeProvider`, `MfeThemeName` |
| `apps/shell/src/main.ts` | Único punto donde se instancia Vuetify y se cargan los CSS globales |
| `apps/shell/vite.config.ts` | `vuetify({ autoImport: true })` + singleton en federation |
| `apps/mfe-dashboard/vite.config.ts` | Igual que shell (treeshaking + singleton) |
