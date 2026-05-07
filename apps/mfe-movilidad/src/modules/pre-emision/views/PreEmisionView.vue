<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MovilidadLayout from '../../../components/MovilidadLayout.vue'
import { usePreEmisionStore } from '../stores/pre-emision.store'
import { useEmisionStore } from '../../emision/stores/emision.store'
import type { Titular, TipoDocumento } from '../../../shared/types/movilidad.types'

const router    = useRouter()
const store     = usePreEmisionStore()
const emitStore = useEmisionStore()

const formRef = ref()
const error   = ref<string | null>(null)

const titular = reactive<Titular>({
  nombre:        '',
  apellido:      '',
  tipoDocumento: 'CC',
  documento:     '',
  email:         '',
  telefono:      '',
  ciudad:        '',
})

const tiposDoc: { title: string; value: TipoDocumento }[] = [
  { title: 'Cédula de Ciudadanía', value: 'CC'  },
  { title: 'NIT',                  value: 'NIT' },
  { title: 'Cédula de Extranjería',value: 'CE'  },
  { title: 'Pasaporte',            value: 'PA'  },
]

const rules = {
  required: (v: unknown) => (!!v && String(v).trim() !== '') || 'Campo requerido',
  email:    (v: string)  => /.+@.+\..+/.test(v) || 'Email no válido',
  telefono: (v: string)  => /^\d{7,10}$/.test(v) || 'Teléfono debe tener 7-10 dígitos',
}

async function onSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  error.value = null
  try {
    const poliza = await store.registrarTitular({ ...titular })
    if (poliza) {
      emitStore.inicializarDesde(poliza)
      router.push('/emision')
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Error al registrar el titular'
  }
}
</script>

<template>
  <MovilidadLayout
    title="Datos del Tomador"
    subtitle="Ingresa la información del titular de la póliza"
  >
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">

          <!-- Resumen de la cotización -->
          <v-card class="mb-4" v-if="store.poliza?.vehiculo">
            <v-card-text class="d-flex align-center">
              <v-icon color="primary" size="28" class="mr-3">mdi-car</v-icon>
              <div>
                <span class="text-subtitle-2 font-weight-bold">
                  {{ store.poliza.vehiculo.marca }} {{ store.poliza.vehiculo.modelo }} {{ store.poliza.vehiculo.anio }}
                </span>
                <span class="text-caption text-medium-emphasis ml-2">
                  Prima: ${{ store.poliza.primaTotal?.toLocaleString('es-CO') }}/año
                </span>
              </div>
            </v-card-text>
          </v-card>

          <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = null">
            {{ error }}
          </v-alert>

          <v-form ref="formRef" @submit.prevent="onSubmit">
            <v-card>
              <v-card-title class="pa-5 pb-2">
                <v-icon color="primary" class="mr-2">mdi-account</v-icon>
                Información personal
              </v-card-title>
              <v-card-text class="pa-5">
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="titular.nombre"   label="Nombre"   :rules="[rules.required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="titular.apellido" label="Apellido" :rules="[rules.required]" />
                  </v-col>
                  <v-col cols="12" sm="5">
                    <v-select
                      v-model="titular.tipoDocumento"
                      label="Tipo de documento"
                      :items="tiposDoc"
                      :rules="[rules.required]"
                    />
                  </v-col>
                  <v-col cols="12" sm="7">
                    <v-text-field v-model="titular.documento" label="Número de documento" :rules="[rules.required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="titular.email"    label="Correo electrónico" type="email" :rules="[rules.required, rules.email]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="titular.telefono" label="Teléfono"            :rules="[rules.required, rules.telefono]" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="titular.ciudad" label="Ciudad" hint="Opcional" persistent-hint />
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-actions class="pa-5 pt-0 justify-space-between">
                <v-btn variant="text" @click="router.push('/cotizacion/resultado')">
                  <v-icon start>mdi-arrow-left</v-icon>Volver
                </v-btn>
                <v-btn type="submit" color="primary" size="large" :loading="store.cargando">
                  Continuar
                  <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-form>

        </v-col>
      </v-row>
    </v-container>
  </MovilidadLayout>
</template>
