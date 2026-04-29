/**
 * LegacyAppBridge.js
 *
 * Adaptador que monta la app Vue 2 legacy y establece el canal
 * de comunicación con el Shell via postMessage (IframeBridge).
 *
 * Este archivo es el único punto de contacto entre el mundo Vue 2 y el Shell.
 * El código Vue 2 original NO necesita ser modificado.
 */
import Vue from 'vue'
// Importar el App.vue original del proyecto Vue 2 legacy
// import LegacyApp from '../../legacy-source/src/App.vue'

/**
 * Protocolo de mensajes para comunicarse con el Shell
 */
const ShellBridge = {
  token: null,

  init() {
    window.addEventListener('message', (event) => {
      // En producción, validar event.origin contra la URL del Shell
      if (!event.data?.type) return

      switch (event.data.type) {
        case 'AUTH_TOKEN':
          this.token = event.data.payload.token
          this.onTokenReceived(this.token)
          break
        case 'PREFERENCES':
          this.onPreferencesUpdated(event.data.payload)
          break
      }
    })

    // Notificar al Shell que el iframe está listo
    window.parent.postMessage({ type: 'READY', id: crypto.randomUUID(), payload: {} }, '*')
  },

  onTokenReceived(token) {
    // Inyectar el token en el mecanismo de autenticación del legacy
    // (ej: configurar axios del legacy, Vuex store, etc.)
    if (window.__LEGACY_APP__) {
      window.__LEGACY_APP__.$store?.commit('auth/SET_TOKEN', token)
    }
  },

  onPreferencesUpdated(preferences) {
    if (window.__LEGACY_APP__) {
      window.__LEGACY_APP__.$store?.commit('preferences/SET', preferences)
    }
  },

  navigate(path) {
    // Solicitar al Shell que navegue a una ruta
    window.parent.postMessage({
      type: 'NAVIGATE',
      id: crypto.randomUUID(),
      payload: { path },
    }, '*')
  },

  logout() {
    window.parent.postMessage({
      type: 'LOGOUT',
      id: crypto.randomUUID(),
      payload: {},
    }, '*')
  },
}

// Inicializar el bridge antes de montar Vue
ShellBridge.init()

// Montar la app Vue 2
// const vm = new Vue({ render: h => h(LegacyApp) }).$mount('#legacy-app')
// window.__LEGACY_APP__ = vm

export default ShellBridge
