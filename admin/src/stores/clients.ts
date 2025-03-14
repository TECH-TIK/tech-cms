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
        
        this.clients = response.data.data.clients || []
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
        console.log(`[CLIENTS STORE] Structure de la réponse:`, response.data)
        
        // Vérification de différentes structures possibles
        let clientData = null
        
        if (response.data && response.data.data && response.data.data.client) {
          // Structure attendue: { data: { client: {...} } }
          clientData = response.data.data.client
        } else if (response.data && response.data.data) {
          // Structure possible: { data: {...} }
          clientData = response.data.data
        } else if (response.data && response.data.client) {
          // Structure possible: { client: {...} }
          clientData = response.data.client
        } else if (response.data) {
          // Structure possible: {...}
          clientData = response.data
        }
        
        console.log(`[CLIENTS STORE] Données du client extraites:`, clientData)
        return clientData
      } catch (err: any) {
        console.error(`[CLIENTS STORE] Erreur lors de la récupération du client #${id}:`, err.message)
        this.error = err.message
        return null
      }
    },

    async createClient(clientData: any) {
      console.log('[CLIENTS STORE] Création d\'un nouveau client', clientData)
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/clients', clientData)
        console.log('[CLIENTS STORE] Client créé avec succès:', response.data)
        
        // Extraire les données du client de différentes structures possibles
        let newClient = null
        
        if (response.data && response.data.data && response.data.data.client) {
          // Structure attendue: { data: { client: {...} } }
          newClient = response.data.data.client
        } else if (response.data && response.data.data) {
          // Structure possible: { data: {...} }
          newClient = response.data.data
        } else if (response.data && response.data.client) {
          // Structure possible: { client: {...} }
          newClient = response.data.client
        } else if (response.data) {
          // Structure possible: {...}
          newClient = response.data
        }
        
        console.log('[CLIENTS STORE] Données du nouveau client extraites:', newClient)
        
        // Ajouter le nouveau client à la liste
        if (newClient) {
          this.clients.unshift(newClient)
        }
        
        this.loading = false
        return newClient
      } catch (err: any) {
        console.error('[CLIENTS STORE] Erreur lors de la création du client:', err.message)
        this.error = err.response?.data?.message || err.message || 'Erreur lors de la création du client'
        this.loading = false
        return null
      }
    },

    async updateClient(id: number, clientData: any) {
      console.log(`[CLIENTS STORE] Mise à jour du client #${id}`, clientData)
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/v1/clients/${id}`, clientData)
        console.log('[CLIENTS STORE] Client mis à jour avec succès:', response.data)
        
        // Mettre à jour le client dans la liste
        const updatedClient = response.data.data.client
        const index = this.clients.findIndex(client => client.id === id)
        
        if (index !== -1) {
          this.clients[index] = updatedClient
        }
        
        this.loading = false
        return updatedClient
      } catch (err: any) {
        console.error(`[CLIENTS STORE] Erreur lors de la mise à jour du client #${id}:`, err.message)
        this.error = err.response?.data?.message || err.message || 'Erreur lors de la mise à jour du client'
        this.loading = false
        return null
      }
    },

    async deleteClient(id: number) {
      console.log(`[CLIENTS STORE] Suppression du client #${id}`)
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.delete(`/api/v1/clients/${id}`)
        console.log('[CLIENTS STORE] Client supprimé avec succès:', response.data)
        
        // Supprimer le client de la liste
        this.clients = this.clients.filter(client => client.id !== id)
        
        this.loading = false
        return true
      } catch (err: any) {
        console.error(`[CLIENTS STORE] Erreur lors de la suppression du client #${id}:`, err.message)
        this.error = err.response?.data?.message || err.message || 'Erreur lors de la suppression du client'
        this.loading = false
        return false
      }
    }
  }
})
