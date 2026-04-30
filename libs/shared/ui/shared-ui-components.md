# Guía de Componentes — `libs/shared/ui`

Convenciones y estándares para crear componentes en la librería compartida de UI.  
Todo componente creado aquí estará listo para ser documentado en Storybook sin cambios.

---

## Índice

1. [Estructura de carpetas](#1-estructura-de-carpetas)
2. [Plantilla base de un componente](#2-plantilla-base-de-un-componente)
3. [Reglas obligatorias](#3-reglas-obligatorias)
4. [Design Tokens disponibles](#4-design-tokens-disponibles)
5. [Exportar el componente](#5-exportar-el-componente)
6. [Checklist antes de hacer commit](#6-checklist-antes-de-hacer-commit)
7. [Compatibilidad futura con Storybook](#7-compatibilidad-futura-con-storybook)

---

## 1. Estructura de carpetas

Cada componente vive en su propia carpeta dentro de `src/components/`:

```
libs/shared/ui/src/components/
├── SbButton/
│   ├── SbButton.vue       ← componente
│   ├── SbButton.types.ts  ← tipos exportados (props, emits, etc.)
│   └── index.ts           ← re-exporta el .vue y los tipos
├── SbInput/
│   ├── SbInput.vue
│   ├── SbInput.types.ts
│   └── index.ts
└── ...
```

> **Nota:** `SbButton.vue` y `MfeThemeProvider.vue` son archivos sueltos porque fueron creados antes de esta convención. Los nuevos componentes deben seguir la estructura de carpeta.

### `index.ts` de cada componente

```ts
// libs/shared/ui/src/components/SbInput/index.ts
export { default } from './SbInput.vue'
export type { InputVariant, InputSize } from './SbInput.types.ts'
```

---

## 2. Plantilla base de un componente

### `SbInput.types.ts`

```ts
// Definir los tipos aquí, separados del .vue
export type InputVariant = 'default' | 'filled' | 'outlined'
export type InputSize    = 'sm' | 'md' | 'lg'
```

### `SbInput.vue`

```vue
<script setup lang="ts">
/**
 * SbInput — Campo de texto del Design System
 *
 * @description Breve descripción del componente y sus casos de uso.
 *
 * @example
 * <SbInput v-model="nombre" label="Nombre" variant="outlined" />
 */
import type { InputVariant, InputSize } from './SbInput.types'

// 1. withDefaults es obligatorio — Storybook lee estos valores como defaults del panel Controls
const props = withDefaults(defineProps<{
  /** Valor del campo (v-model) */
  modelValue?: string
  /** Texto descriptivo encima del campo */
  label?: string
  /** Texto de ayuda debajo del campo */
  hint?: string
  /** Mensaje de error (si hay validación fallida) */
  error?: string
  /** Variante visual del campo */
  variant?: InputVariant
  /** Tamaño del campo */
  size?: InputSize
  /** Deshabilitar el campo */
  disabled?: boolean
  /** Campo requerido */
  required?: boolean
}>(), {
  modelValue: '',
  variant: 'default',
  size: 'md',
  disabled: false,
  required: false,
})

// 2. Emits tipados — Storybook los captura en el panel "Actions"
const emit = defineEmits<{
  'update:modelValue': [value: string]
  change:  [value: string]
  focus:   [event: FocusEvent]
  blur:    [event: FocusEvent]
}>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div :class="['sb-input', `sb-input--${variant}`, `sb-input--${size}`, { 'sb-input--error': error }]">
    <label v-if="label" class="sb-input__label">
      {{ label }}
      <span v-if="required" class="sb-input__required" aria-hidden="true">*</span>
    </label>

    <input
      class="sb-input__field"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :aria-describedby="hint || error ? `${$attrs.id}-hint` : undefined"
      :aria-invalid="!!error"
      v-bind="$attrs"
      @input="onInput"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />

    <!-- Slots nombrados para iconos o acciones inline -->
    <span v-if="$slots.prefix" class="sb-input__prefix">
      <slot name="prefix" />
    </span>
    <span v-if="$slots.suffix" class="sb-input__suffix">
      <slot name="suffix" />
    </span>

    <p
      v-if="error || hint"
      :id="`${$attrs.id}-hint`"
      :class="['sb-input__hint', { 'sb-input__hint--error': error }]"
    >
      {{ error ?? hint }}
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/tokens' as *;

.sb-input {
  display: flex;
  flex-direction: column;
  gap: $spacing-1;

  &__label {
    font-family: $font-family-base;
    font-size: $font-size-sm;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  &__required { color: var(--color-danger); margin-left: $spacing-1; }

  &__field {
    border: 1px solid var(--color-border);
    border-radius: $border-radius;
    font-family: $font-family-base;
    font-size: $font-size-base;
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    transition: border-color 150ms ease, box-shadow 150ms ease;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgb(59 130 246 / 0.15);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: var(--color-surface-muted);
    }
  }

  // Tamaños
  &--sm .sb-input__field { padding: $spacing-1 $spacing-2; font-size: $font-size-sm; }
  &--md .sb-input__field { padding: $spacing-2 $spacing-3; font-size: $font-size-base; }
  &--lg .sb-input__field { padding: $spacing-3 $spacing-4; font-size: $font-size-lg; }

  // Estado error
  &--error .sb-input__field {
    border-color: var(--color-danger);
    &:focus { box-shadow: 0 0 0 3px rgb(239 68 68 / 0.15); }
  }

  &__hint {
    font-size: $font-size-xs;
    color: var(--color-text-muted);
    &--error { color: var(--color-danger); }
  }
}
</style>
```

---

## 3. Reglas obligatorias

### ✅ Hacer siempre

| Regla | Por qué |
|---|---|
| Usar `withDefaults(defineProps<{}>(), {...})` | Storybook lee los defaults para pre-poblar el panel Controls |
| Tipar todos los emits con `defineEmits<{}>()` | Storybook los muestra en el panel Actions; TypeScript los valida |
| Exportar los tipos desde `SbX.types.ts` | Las apps que usan el componente importan los tipos sin importar el `.vue` |
| Usar `v-bind="$attrs"` en el elemento nativo raíz | Permite que atributos HTML nativos (`id`, `data-*`, ARIA) pasen al DOM |
| CSS con tokens SCSS (`@use '../../styles/tokens' as *`) | Garantiza consistencia visual y tema centralizado |
| Prefijo `Sb` en el nombre del componente | Evita colisiones con componentes Vuetify (`v-*`) o HTML nativos |
| Añadir `aria-*` relevantes | Accesibilidad mínima requerida |

### ❌ Nunca hacer dentro de `libs/shared/ui`

```ts
// ❌ Importar stores
import { useAuthStore } from '@sipabanca/shared-auth'
import { useNavigationStore } from '@sipabanca/shared-state'

// ❌ Importar Vue Router
import { useRouter, useRoute } from 'vue-router'

// ❌ Hacer llamadas HTTP
import { integrationHttp } from '@sipabanca/shared-http'

// ❌ Acceder a window/document directamente sin SSR guard
// ❌ Emitir eventos de negocio (solo eventos de UI: click, change, focus, blur)
```

Los componentes de UI son **puros** — reciben datos por props y notifican eventos hacia arriba. La lógica de negocio vive en las vistas y stores de cada MFE.

---

## 4. Design Tokens disponibles

Importar con `@use '../../styles/tokens' as *` desde cualquier componente de la librería.

### Colores
| Variable SCSS | Variable CSS | Valor |
|---|---|---|
| `$color-primary-500` | `--color-primary` | `#3b82f6` |
| `$color-primary-600` | `--color-primary-hover` | `#2563eb` |
| `$color-danger-500` | `--color-danger` | `#ef4444` |
| `$color-success-500` | `--color-success` | `#22c55e` |
| `$color-warning-500` | `--color-warning` | `#f59e0b` |

### Tipografía
| Variable | Valor |
|---|---|
| `$font-family-base` | `'Inter', system-ui, sans-serif` |
| `$font-family-mono` | `'JetBrains Mono', monospace` |
| `$font-size-xs` | `0.75rem` (12px) |
| `$font-size-sm` | `0.875rem` (14px) |
| `$font-size-base` | `1rem` (16px) |
| `$font-size-lg` | `1.125rem` (18px) |

### Espaciado (escala 4px)
| Variable | Valor |
|---|---|
| `$spacing-1` | `0.25rem` (4px) |
| `$spacing-2` | `0.5rem` (8px) |
| `$spacing-3` | `0.75rem` (12px) |
| `$spacing-4` | `1rem` (16px) |
| `$spacing-6` | `1.5rem` (24px) |
| `$spacing-8` | `2rem` (32px) |

### Bordes
| Variable | Valor |
|---|---|
| `$border-radius-sm` | `0.25rem` |
| `$border-radius` | `0.5rem` |
| `$border-radius-lg` | `0.75rem` |
| `$border-radius-full` | `9999px` |

### Sombras
| Variable | Uso |
|---|---|
| `$shadow-sm` | Tarjetas pequeñas, inputs |
| `$shadow` | Tarjetas estándar |
| `$shadow-lg` | Modales, dropdowns |

---

## 5. Exportar el componente

### Paso 1 — `index.ts` del componente
```ts
// libs/shared/ui/src/components/SbInput/index.ts
export { default } from './SbInput.vue'
export type { InputVariant, InputSize } from './SbInput.types'
```

### Paso 2 — `index.ts` raíz de la librería
```ts
// libs/shared/ui/src/index.ts
export { default as SbButton } from './components/SbButton.vue'
export { default as MfeThemeProvider } from './components/MfeThemeProvider.vue'
export { default as SbInput } from './components/SbInput'    // ← nueva carpeta
export { default as SbCard } from './components/SbCard'
export type { InputVariant, InputSize } from './components/SbInput'
export { createVuetify } from './vuetify'
export type { MfeThemeName } from './vuetify'
```

### Paso 3 — Consumir desde cualquier MFE
```ts
import { SbInput } from '@sipabanca/shared-ui'
import type { InputVariant } from '@sipabanca/shared-ui'
```

---

## 6. Checklist antes de hacer commit

```
[ ] El componente tiene su propia carpeta (SbX/SbX.vue + SbX.types.ts + index.ts)
[ ] Props declaradas con withDefaults() y todos los valores default explícitos
[ ] Emits tipados con defineEmits<{}>()
[ ] v-bind="$attrs" en el elemento raíz del template
[ ] Sin imports de stores, router ni llamadas HTTP
[ ] CSS usando tokens SCSS (@use '../../styles/tokens' as *)
[ ] Atributos ARIA básicos presentes (aria-label, aria-invalid, etc.)
[ ] Exportado en libs/shared/ui/src/index.ts
[ ] Nombre con prefijo Sb
```

---

## 7. Compatibilidad futura con Storybook

Si en el futuro se decide agregar Storybook, cada componente ya estará listo. Solo hay que agregar el archivo `.stories.ts` dentro de la carpeta del componente, sin modificar nada:

```ts
// libs/shared/ui/src/components/SbInput/SbInput.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import SbInput from './SbInput.vue'

const meta: Meta<typeof SbInput> = {
  component: SbInput,
  args: {
    label: 'Correo electrónico',
    modelValue: '',
    variant: 'default',
    size: 'md',
    disabled: false,
  },
}
export default meta
type Story = StoryObj<typeof SbInput>

export const Default: Story = {}
export const WithError: Story = { args: { error: 'El correo no es válido' } }
export const WithHint: Story  = { args: { hint: 'Ingresa tu correo institucional' } }
export const Disabled: Story  = { args: { disabled: true } }
export const Sizes: Story = {
  render: (args) => ({
    components: { SbInput },
    setup: () => ({ args }),
    template: `
      <div style="display:flex;flex-direction:column;gap:16px">
        <SbInput v-bind="args" size="sm" label="Small" />
        <SbInput v-bind="args" size="md" label="Medium" />
        <SbInput v-bind="args" size="lg" label="Large" />
      </div>
    `,
  }),
}
```

El comando para instalar Storybook cuando llegue el momento:
```bash
nx g @nx/storybook:configuration shared-ui --uiFramework=@storybook/vue3-vite
```
