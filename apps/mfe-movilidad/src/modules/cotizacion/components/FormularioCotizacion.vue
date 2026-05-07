<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { Vehiculo } from '../../../shared/types/movilidad.types'

const props = withDefaults(defineProps<{
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  submit: [vehiculo: Vehiculo]
}>()

const form = reactive<Vehiculo>({
  marca:          '',
  modelo:         '',
  anio:           new Date().getFullYear(),
  placa:          '',
  tipoUso:        'particular',
  valorComercial: 0,
})

const formRef = ref()

const anioMin = 1990
const anioMax = new Date().getFullYear() + 1

const tiposUso = [
  { title: 'Particular',  value: 'particular' },
  { title: 'Comercial',   value: 'comercial'  },
  { title: 'Mixto',       value: 'mixto'      },
]

const rules = {
  required: (v: unknown) => !!v || 'Campo requerido',
  anio: (v: number) => (v >= anioMin && v <= anioMax) || `Año entre ${anioMin} y ${anioMax}`,
  valorPositivo: (v: number) => v > 0 || 'Debe ser mayor a 0',
}

async function onSubmit() {
  const { valid } = await formRef.value.validate()
  if (valid) emit('submit', { ...form })
}
</script>

<template>
  <v-form ref="formRef" @submit.prevent="onSubmit">
    <v-card>
      <v-card-title class="pa-5 pb-2">
        <v-icon color="primary" class="mr-2">mdi-car-info</v-icon>
        Datos del vehículo
      </v-card-title>
      <v-card-text class="pa-5">
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.marca"
              label="Marca"
              :rules="[rules.required]"
              placeholder="Ej: Toyota"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.modelo"
              label="Modelo"
              :rules="[rules.required]"
              placeholder="Ej: Corolla"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model.number="form.anio"
              label="Año"
              type="number"
              :min="anioMin"
              :max="anioMax"
              :rules="[rules.required, rules.anio]"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.placa"
              label="Placa"
              placeholder="Ej: ABC-123"
              hint="Opcional"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.tipoUso"
              label="Tipo de uso"
              :items="tiposUso"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model.number="form.valorComercial"
              label="Valor comercial (COP)"
              type="number"
              prefix="$"
              :rules="[rules.required, rules.valorPositivo]"
              hint="Valor de mercado actual del vehículo"
              persistent-hint
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="pa-5 pt-0">
        <v-spacer />
        <v-btn
          type="submit"
          color="primary"
          size="large"
          :loading="loading"
        >
          Cotizar
          <v-icon end>mdi-calculator</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>
