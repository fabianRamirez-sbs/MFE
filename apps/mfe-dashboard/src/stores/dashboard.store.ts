import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createHttpClient } from '@sipabanca/shared-http'

/**
 * La URL se resuelve automáticamente desde el .env del entorno activo.
 * No hay strings hardcodeados aquí.
 *
 * Equivalente a:
 *   development  → http://localhost:8091/api
 *   certification → https://api.cert.sipabanca.com/accounts
 *   production   → https://api.sipabanca.com/accounts
 */
const http = createHttpClient({ service: 'accounts' })

interface Account {
  id: string
  name: string
  balance: string
  type: 'savings' | 'checking'
}

/**
 * Store LOCAL del MFE Dashboard.
 * Este store es PRIVADO — no se expone al Shell ni a otros MFEs.
 * Para comunicar resultados a otros MFEs, usar el mfeBus.
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const accounts = ref<Account[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSummary() {
    loading.value = true
    error.value = null
    try {
      const { data } = await http.get<{ accounts: Account[] }>('/dashboard/summary')
      accounts.value = data.accounts
    } catch (err: unknown) {
      error.value = (err as { message: string }).message
    } finally {
      loading.value = false
    }
  }

  return { accounts, loading, error, fetchSummary }
})
