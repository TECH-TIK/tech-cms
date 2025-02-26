import { defineStore } from 'pinia'
import axios from '@/utils/axios'
import { useAuthStore } from './auth'

console.log('[CLIENTS STORE] Initialisation du store clients')

export const useClientsStore = defineStore('clients', {
  state: () => ({
    clients: [] as any[],
    loading: false,
    error: null as string | null,
    currentPage: 1,
    totalPages: 1,
    perPage: 10
  }),

  getters: {
    hasClients: (state) => state.clients.length > 0,
    totalClients: (state) => state.clients.length
  },

  actions: {
    async fetchClients() {
      console.log('[CLIENTS STORE] Récupération des clients...')
      this.loading = true
      this.error = null
      
      try {
        // Vérifier l'authentification avant de faire la requête
        const authStore = useAuthStore()
        const isAuthenticated = await authStore.checkAuth()
        
        if (!isAuthenticated) {
          console.error('[CLIENTS STORE] Utilisateur non authentifié')
          this.error = 'Vous devez être connecté pour accéder à cette ressource'
          this.loading = false
          return false
        }
        
        console.log('[CLIENTS STORE] Envoi de la requête API pour récupérer les clients')
        const response = await axios.get('/api/v1/clients')
        console.log('[CLIENTS STORE] Réponse reçue:', response.status)
        
        this.clients = response.data.data || []
        this.loading = false
        return true
      } catch (err: any) {
        console.error('[CLIENTS STORE] Erreur lors de la récupération des clients:', err.message)
        this.error = err.message || 'Erreur lors de la récupération des clients'
        this.loading = false
        return false
      }
    },

    async getClient(id: number) {
      console.log(`[CLIENTS STORE] Récupération du client #${id}`)
      try {
        const response = await axios.get(`/api/v1/clients/${id}`)
        return response.data.data
      } catch (err: any) {
        console.error(`[CLIENTS STORE] Erreur lors de la récupération du client #${id}:`, err.message)
        this.error = err.message
        return null
      }
    }
  }
})
