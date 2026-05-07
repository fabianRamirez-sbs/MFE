<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MovilidadLayout from '../../../components/MovilidadLayout.vue'
import { useRenovacionStore } from '../stores/renovacion.store'

const router = useRouter()
const store  = useRenovacionStore()
const error  = ref<string | null>(null)

onMounted(() => {
  // En producción carga desde la API; en dev usa el seed del store
  if (!import.meta.env.DEV || !store.polizas.length) {
    store.cargarPolizas()
  }
})

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function renovar(polizaId: string) {
  error.value = null
  try {
    await store.renovar(polizaId)
  } catch (e: any) {
    error.value = e?.message ?? 'Error al renovar la póliza'
  }
}
</script>

<template>
  <MovilidadLayout
    title="Renovación de Pólizas"
    subtitle="Renueva tus pólizas próximas a vencer"
  >
    <v-container>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = null">
        {{ error }}
      </v-alert>

      <v-alert v-if="store.polizaRenovada" type="success" variant="tonal" class="mb-4" closable>
        Póliza <strong>{{ store.polizaRenovada.numero }}</strong> renovada exitosamente.
      </v-alert>

      <!-- Esqueleto de carga -->
      <v-skeleton-loader v-if="store.cargando && !store.polizas.length" type="card@2" />

      <!-- Sin pólizas -->
      <v-card v-else-if="!store.polizas.length" class="text-center pa-8">
        <v-icon size="64" color="success" class="mb-3">mdi-check-circle</v-icon>
        <div class="text-h6">No tienes pólizas por renovar</div>
        <div class="text-body-2 text-medium-emphasis mt-1">Todas tus pólizas están al día</div>
        <v-btn class="mt-4" color="primary" @click="router.push('/home')">Ir al inicio</v-btn>
      </v-card>

      <!-- Lista de pólizas renovables -->
      <v-row v-else>
        <v-col
          v-for="poliza in store.polizas"
          :key="poliza.polizaId"
          cols="12" md="6"
        >
          <v-card>
            <v-card-text class="pa-5">
              <div class="d-flex align-start justify-space-between mb-3">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ poliza.numero }}</div>
                  <div class="text-caption text-medium-emphasis">{{ poliza.vehiculo.marca }} {{ poliza.vehiculo.modelo }} {{ poliza.vehiculo.anio }}</div>
                </div>
                <v-chip
                  :color="poliza.estado === 'vencida' ? 'error' : 'warning'"
                  size="small"
                  variant="tonal"
                >
                  {{ poliza.estado === 'vencida' ? 'Vencida' : 'Por vencer' }}
                </v-chip>
              </div>

              <v-divider class="mb-3" />

              <v-row dense class="mb-3">
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Placa</div>
                  <div class="text-body-2">{{ poliza.vehiculo.placa ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Vencimiento</div>
                  <div class="text-body-2">{{ formatFecha(poliza.vencimiento) }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Prima anterior</div>
                  <div class="text-body-2 text-decoration-line-through text-medium-emphasis">{{ formatCOP(poliza.primaAnterior) }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Prima renovación</div>
                  <div class="text-body-2 font-weight-bold text-primary">{{ formatCOP(poliza.primaRenovacion) }}</div>
                </v-col>
              </v-row>

              <v-btn
                color="primary"
                block
                :loading="store.cargandoId === poliza.polizaId"
                :disabled="!!store.cargandoId"
                @click="renovar(poliza.polizaId)"
              >
                Renovar póliza
                <v-icon end>mdi-refresh</v-icon>
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </MovilidadLayout>
</template>
