<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@sipabanca/shared-auth'
import MovilidadLayout from '../../../components/MovilidadLayout.vue'

const router = useRouter()
const auth   = useAuth()

const acciones = [
  {
    icon:     'mdi-plus-circle-outline',
    titulo:   'Nueva Cotización',
    subtitulo:'Cotiza un seguro para tu vehículo',
    ruta:     '/cotizacion',
    color:    'primary',
  },
  {
    icon:     'mdi-file-document-check-outline',
    titulo:   'Mis Pólizas',
    subtitulo:'Ver y renovar pólizas activas',
    ruta:     '/renovacion',
    color:    'success',
  },
  {
    icon:     'mdi-car-multiple',
    titulo:   'Mis Vehículos',
    subtitulo:'Gestión de flota asegurada',
    ruta:     '/home',          // placeholder hasta implementar módulo vehículos
    color:    'info',
  },
  {
    icon:     'mdi-alert-circle-outline',
    titulo:   'Siniestros',
    subtitulo:'Reportar o consultar siniestros',
    ruta:     '/home',          // placeholder hasta implementar módulo siniestros
    color:    'warning',
  },
]
</script>

<template>
  <MovilidadLayout
    title="Movilidad"
    subtitle="Gestión de seguros para vehículos y transporte"
  >
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Bienvenido, <strong>{{ auth.user.value?.fullName ?? 'Usuario' }}</strong>
          </p>
        </v-col>

        <v-col
          v-for="accion in acciones"
          :key="accion.ruta + accion.titulo"
          cols="12" sm="6" md="3"
        >
          <v-card
            class="accion-card"
            hover
            @click="router.push(accion.ruta)"
          >
            <v-card-text class="d-flex align-center pa-5">
              <v-icon :color="accion.color" size="40" class="mr-4">{{ accion.icon }}</v-icon>
              <div>
                <div class="text-subtitle-1 font-weight-bold">{{ accion.titulo }}</div>
                <div class="text-caption text-medium-emphasis">{{ accion.subtitulo }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </MovilidadLayout>
</template>

<style scoped>
.accion-card { cursor: pointer; transition: transform 150ms ease; }
.accion-card:hover { transform: translateY(-2px); }
</style>
