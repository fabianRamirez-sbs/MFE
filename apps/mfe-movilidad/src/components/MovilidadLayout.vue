<script setup lang="ts">
/**
 * MovilidadLayout.vue — Layout exclusivo del MFE Movilidad.
 *
 * Envuelve todas las vistas del módulo con:
 *   - MfeThemeProvider: aplica el tema naranja "movilidadTheme"
 *   - Barra de sección con título e icono propios
 *   - Área de contenido con margen y scroll independiente del Shell
 *
 * Los componentes Vuetify aquí heredan los defaults del tema movilidadTheme
 * sin afectar al resto de la aplicación (gracias al singleton compartido).
 *
 * Para sobreescribir defaults de Vuetify solo en este módulo se usa la prop
 * :defaults de MfeThemeProvider.
 */
import { MfeThemeProvider } from '@sipabanca/shared-ui'

interface Props {
  /** Título mostrado en la barra de sección. Default: "Movilidad" */
  title?: string
  /** Subtítulo descriptivo debajo del título */
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Movilidad',
  subtitle: 'Gestión de seguros para vehículos y transporte',
})

/**
 * Defaults de componentes Vuetify específicos del módulo Movilidad.
 * Se fusionan sobre los defaults globales solo dentro de este layout.
 */
const movilidadDefaults = {
  VBtn: {
    variant: 'elevated' as const,
    rounded: 'lg',
    color: 'primary',
  },
  VCard: {
    rounded: 'xl',
    elevation: 1,
  },
  VTextField: {
    variant: 'outlined' as const,
    density: 'compact' as const,
    color: 'primary',
  },
  VChip: {
    rounded: 'lg',
    size: 'small',
  },
}
</script>

<template>
  <MfeThemeProvider theme="movilidadTheme" :defaults="movilidadDefaults">
    <div class="movilidad-layout">

      <!-- Barra de sección -->
      <div class="movilidad-layout__topbar">
        <div class="movilidad-layout__topbar-inner">
          <v-icon size="22" color="primary" class="mr-2">mdi-car-connected</v-icon>
          <div>
            <span class="movilidad-layout__title">{{ title }}</span>
            <span v-if="subtitle" class="movilidad-layout__subtitle">{{ subtitle }}</span>
          </div>
        </div>
      </div>

      <!-- Contenido del módulo -->
      <div class="movilidad-layout__content">
        <slot />
      </div>

    </div>
  </MfeThemeProvider>
</template>

<style scoped lang="scss">
.movilidad-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgb(var(--v-theme-background));

  &__topbar {
    flex-shrink: 0;
    border-bottom: 2px solid rgba(var(--v-theme-primary), 0.18);
    background: rgb(var(--v-theme-surface));
    padding: 0.6rem 1.25rem;
  }

  &__topbar-inner {
    display: flex;
    align-items: center;
  }

  &__title {
    display: block;
    font-size: 0.95rem;
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
    line-height: 1.2;
  }

  &__subtitle {
    display: block;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.55);
    line-height: 1.2;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
  }
}
</style>
