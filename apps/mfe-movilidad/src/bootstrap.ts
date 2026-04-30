/**
 * bootstrap.ts — Punto de entrada expuesto por Module Federation
 *
 * El Shell importa este archivo como 'mfe-movilidad/App'.
 * Exporta el componente raíz del MFE para ser montado en el slot del Shell.
 */
import { defineComponent, h } from 'vue'
import MovilidadView from './views/MovilidadView.vue'

export default defineComponent({
  name: 'MfeMovilidad',
  setup() {
    return () => h(MovilidadView)
  },
})
