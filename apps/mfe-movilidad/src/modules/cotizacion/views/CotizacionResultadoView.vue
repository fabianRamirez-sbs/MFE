<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MovilidadLayout from '../../../components/MovilidadLayout.vue'
import { useCotizacion } from '../composables/useCotizacion'
import { usePoliza } from '../../../shared/composables/usePoliza'

const router     = useRouter()
const { cotizacion, cargando, toggleCobertura, primaTotal } = useCotizacion()
const polizaFlow = usePoliza()

const coberturas = computed(() => cotizacion.value?.coberturas ?? [])

function formatCOP(valor: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor)
}

function continuar() {
  if (cotizacion.value) {
    polizaFlow.setCotizacion(cotizacion.value)
    router.push('/pre-emision')
  }
}
</script>

<template>
  <MovilidadLayout
    title="Resultado de Cotización"
    subtitle="Selecciona las coberturas que deseas incluir"
  >
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="9">

          <!-- Resumen del vehículo -->
          <v-card class="mb-4" v-if="cotizacion">
            <v-card-text class="d-flex align-center">
              <v-icon color="primary" size="32" class="mr-3">mdi-car</v-icon>
              <div>
                <span class="text-subtitle-1 font-weight-bold">
                  {{ cotizacion.vehiculo.marca }} {{ cotizacion.vehiculo.modelo }} {{ cotizacion.vehiculo.anio }}
                </span>
                <span class="text-caption text-medium-emphasis ml-3">
                  Placa: {{ cotizacion.vehiculo.placa ?? 'Sin placa' }}
                </span>
              </div>
            </v-card-text>
          </v-card>

          <!-- Tabla de coberturas -->
          <v-card class="mb-4">
            <v-card-title class="text-subtitle-1 pa-4 pb-2">Coberturas disponibles</v-card-title>
            <v-divider />
            <v-list v-if="coberturas.length">
              <v-list-item
                v-for="cobertura in coberturas"
                :key="cobertura.codigo"
                class="py-3"
              >
                <template #prepend>
                  <v-checkbox
                    :model-value="cobertura.seleccionada"
                    :disabled="cobertura.obligatoria"
                    color="primary"
                    hide-details
                    @update:model-value="toggleCobertura(cobertura.codigo)"
                  />
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ cobertura.nombre }}
                  <v-chip v-if="cobertura.obligatoria" size="x-small" color="primary" class="ml-2">Obligatoria</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>{{ cobertura.descripcion }}</v-list-item-subtitle>

                <template #append>
                  <div class="text-right">
                    <div class="text-body-2 font-weight-bold">{{ formatCOP(cobertura.prima) }}/año</div>
                    <div class="text-caption text-medium-emphasis">Valor asegurado: {{ formatCOP(cobertura.valorAsegurado) }}</div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <v-skeleton-loader v-else-if="cargando" type="list-item-three-line@3" />
          </v-card>

          <!-- Prima total y acción -->
          <v-card>
            <v-card-text class="d-flex align-center justify-space-between pa-5">
              <div>
                <div class="text-caption text-medium-emphasis">Prima total anual</div>
                <div class="text-h5 font-weight-bold text-primary">{{ formatCOP(primaTotal) }}</div>
              </div>
              <v-btn
                color="primary"
                size="large"
                :loading="cargando"
                :disabled="!cotizacion"
                @click="continuar"
              >
                Continuar
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-text>
          </v-card>

        </v-col>
      </v-row>
    </v-container>
  </MovilidadLayout>
</template>
