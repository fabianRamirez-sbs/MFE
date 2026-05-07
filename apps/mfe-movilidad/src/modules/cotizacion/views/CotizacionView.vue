<script setup lang="ts">
import { ref } from 'vue'
import MovilidadLayout from '../../../components/MovilidadLayout.vue'
import FormularioCotizacion from '../components/FormularioCotizacion.vue'
import { useCotizacion } from '../composables/useCotizacion'
import type { Vehiculo } from '../../../shared/types/movilidad.types'

const { cotizar, cargando } = useCotizacion()

const error = ref<string | null>(null)

async function onSubmit(vehiculo: Vehiculo) {
  error.value = null
  try {
    await cotizar(vehiculo)
  } catch (e: any) {
    error.value = e?.message ?? 'No se pudo obtener la cotización. Intenta de nuevo.'
  }
}
</script>

<template>
  <MovilidadLayout
    title="Nueva Cotización"
    subtitle="Ingresa los datos del vehículo para obtener un precio"
  >
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="error = null"
          >
            {{ error }}
          </v-alert>

          <FormularioCotizacion
            :loading="cargando"
            @submit="onSubmit"
          />
        </v-col>
      </v-row>
    </v-container>
  </MovilidadLayout>
</template>
