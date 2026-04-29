<template>
  <v-theme-provider :theme="theme" :with-background="withBackground">
    <v-defaults-provider :defaults="mergedDefaults">
      <slot />
    </v-defaults-provider>
  </v-theme-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MfeThemeName } from '../vuetify'

interface Props {
  /** Nombre del tema registrado en createVuetify() */
  theme: MfeThemeName
  /**
   * Si true, aplica el color `background` del tema como fondo del contenedor.
   * Útil cuando el MFE ocupa toda su área y quiere el tinte propio.
   * Default: false para que el Shell controle el fondo del layout.
   */
  withBackground?: boolean
  /**
   * Defaults de componentes Vuetify específicos de este MFE.
   * Se fusionan por encima de los defaults globales definidos en createVuetify().
   * Ejemplo: { VBtn: { size: 'small' }, VTextField: { density: 'compact' } }
   */
  defaults?: Record<string, Record<string, unknown>>
}

const props = withDefaults(defineProps<Props>(), {
  withBackground: false,
  defaults: () => ({}),
})

// Los defaults del MFE se aplican por encima de los globales (Vuetify los fusiona en cascada)
const mergedDefaults = computed(() => props.defaults)
</script>
