<script setup lang="ts">
import { useAuth } from '@sipabanca/shared-auth'
import MovilidadLayout from '../components/MovilidadLayout.vue'

const auth = useAuth()
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

        <!-- Tarjetas de acceso rápido -->
        <v-col cols="12" sm="6" md="4">
          <v-card>
            <v-card-text class="d-flex align-center">
              <v-icon size="36" color="primary" class="mr-3">mdi-car-multiple</v-icon>
              <div>
                <div class="text-subtitle-2 font-weight-bold">Mis Vehículos</div>
                <div class="text-caption text-medium-emphasis">Gestión de flota</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card>
            <v-card-text class="d-flex align-center">
              <v-icon size="36" color="primary" class="mr-3">mdi-file-document-check-outline</v-icon>
              <div>
                <div class="text-subtitle-2 font-weight-bold">Pólizas</div>
                <div class="text-caption text-medium-emphasis">Ver y renovar</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card>
            <v-card-text class="d-flex align-center">
              <v-icon size="36" color="primary" class="mr-3">mdi-alert-circle-outline</v-icon>
              <div>
                <div class="text-subtitle-2 font-weight-bold">Siniestros</div>
                <div class="text-caption text-medium-emphasis">Reportar o consultar</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </MovilidadLayout>
</template>
