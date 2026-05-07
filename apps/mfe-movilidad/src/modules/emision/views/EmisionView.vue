<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import MovilidadLayout from '../../../components/MovilidadLayout.vue'
import { useEmisionStore } from '../stores/emision.store'

const router = useRouter()
const store  = useEmisionStore()
const error  = ref<string | null>(null)

const poliza = computed(() => store.poliza)

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

async function emitir() {
  error.value = null
  try {
    await store.emitir()
  } catch (e: any) {
    error.value = e?.message ?? 'Error al emitir la póliza'
  }
}
</script>

<template>
  <MovilidadLayout
    title="Confirmar Emisión"
    subtitle="Revisa el resumen antes de emitir la póliza"
  >
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8">

          <!-- ── Póliza emitida exitosamente ── -->
          <template v-if="store.estaEmitida && store.polizaEmitida">
            <v-card color="success" variant="tonal" class="mb-4">
              <v-card-text class="d-flex align-center pa-6">
                <v-icon color="success" size="48" class="mr-4">mdi-check-circle</v-icon>
                <div>
                  <div class="text-h6 font-weight-bold">¡Póliza emitida exitosamente!</div>
                  <div class="text-body-2 mt-1">Número de póliza: <strong>{{ store.polizaEmitida.numero }}</strong></div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    Vigencia: {{ store.polizaEmitida.vigencia?.inicio }} → {{ store.polizaEmitida.vigencia?.fin }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
            <div class="d-flex justify-center">
              <v-btn color="primary" @click="router.push('/home')">Ir al inicio</v-btn>
            </div>
          </template>

          <!-- ── Resumen para confirmar ── -->
          <template v-else-if="poliza">
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = null">
              {{ error }}
            </v-alert>

            <!-- Vehículo -->
            <v-card class="mb-3">
              <v-card-title class="pa-4 pb-2 text-subtitle-1">
                <v-icon color="primary" class="mr-2">mdi-car</v-icon>Vehículo
              </v-card-title>
              <v-card-text class="pa-4 pt-0">
                <v-row dense>
                  <v-col cols="6" sm="3"><span class="text-caption text-medium-emphasis">Marca</span><div>{{ poliza.vehiculo?.marca }}</div></v-col>
                  <v-col cols="6" sm="3"><span class="text-caption text-medium-emphasis">Modelo</span><div>{{ poliza.vehiculo?.modelo }}</div></v-col>
                  <v-col cols="6" sm="3"><span class="text-caption text-medium-emphasis">Año</span><div>{{ poliza.vehiculo?.anio }}</div></v-col>
                  <v-col cols="6" sm="3"><span class="text-caption text-medium-emphasis">Placa</span><div>{{ poliza.vehiculo?.placa ?? '—' }}</div></v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Titular -->
            <v-card class="mb-3">
              <v-card-title class="pa-4 pb-2 text-subtitle-1">
                <v-icon color="primary" class="mr-2">mdi-account</v-icon>Titular
              </v-card-title>
              <v-card-text class="pa-4 pt-0">
                <v-row dense>
                  <v-col cols="12" sm="6"><span class="text-caption text-medium-emphasis">Nombre</span><div>{{ poliza.titular?.nombre }} {{ poliza.titular?.apellido }}</div></v-col>
                  <v-col cols="12" sm="6"><span class="text-caption text-medium-emphasis">Documento</span><div>{{ poliza.titular?.tipoDocumento }} {{ poliza.titular?.documento }}</div></v-col>
                  <v-col cols="12" sm="6"><span class="text-caption text-medium-emphasis">Email</span><div>{{ poliza.titular?.email }}</div></v-col>
                  <v-col cols="12" sm="6"><span class="text-caption text-medium-emphasis">Teléfono</span><div>{{ poliza.titular?.telefono }}</div></v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Coberturas y prima -->
            <v-card class="mb-4">
              <v-card-title class="pa-4 pb-2 text-subtitle-1">
                <v-icon color="primary" class="mr-2">mdi-shield-check</v-icon>Coberturas incluidas
              </v-card-title>
              <v-list density="compact">
                <v-list-item
                  v-for="c in poliza.coberturas?.filter(cb => cb.seleccionada)"
                  :key="c.codigo"
                  :title="c.nombre"
                  :subtitle="formatCOP(c.valorAsegurado)"
                >
                  <template #append>
                    <span class="text-body-2 font-weight-bold">{{ formatCOP(c.prima) }}</span>
                  </template>
                </v-list-item>
              </v-list>
              <v-divider />
              <v-card-text class="d-flex justify-space-between align-center pa-4">
                <span class="text-subtitle-2">Prima total anual</span>
                <span class="text-h6 font-weight-bold text-primary">{{ formatCOP(poliza.primaTotal ?? 0) }}</span>
              </v-card-text>
            </v-card>

            <!-- Acciones -->
            <div class="d-flex justify-space-between">
              <v-btn variant="text" @click="router.push('/pre-emision')">
                <v-icon start>mdi-arrow-left</v-icon>Volver
              </v-btn>
              <v-btn color="primary" size="large" :loading="store.cargando" @click="emitir">
                Emitir Póliza
                <v-icon end>mdi-file-sign</v-icon>
              </v-btn>
            </div>
          </template>

          <v-skeleton-loader v-else type="card@3" />
        </v-col>
      </v-row>
    </v-container>
  </MovilidadLayout>
</template>
