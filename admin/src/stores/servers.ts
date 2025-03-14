import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useNotificationStore } from './notifications'

interface Server {
  id?: number;
  name: string;
  hostname: string;
  type: string;
  ip: string;
  username: string;
  password?: string;
  port: number;
  secure: boolean;
  apiToken?: string;
  active: boolean;
  maxAccounts?: number;
  nameservers?: string;
  status?: string;
  server_load?: number;
}

export const useServersStore = defineStore('servers', () => {
  // État
  const servers = ref<Server[]>([])
  const loading = ref(false)
  const saving = ref(false)
  
  // Store de notifications
  const notificationStore = useNotificationStore()

  // Getters
  const getServerById = (id: number): Server | undefined => {
    return servers.value.find(server => server.id === id)
  }

  // Actions
  const fetchServers = async (): Promise<Server[]> => {
    try {
      loading.value = true
      const response = await axios.get('/api/v1/settings/servers')
      servers.value = response.data.servers || []
      return servers.value
    } catch (error) {
      console.error('Erreur lors de la récupération des serveurs:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createServer = async (serverData: Server): Promise<Server> => {
    try {
      saving.value = true
      const response = await axios.post('/api/v1/settings/servers', serverData)
      
      if (response.data.success) {
        const newServer = response.data.server
        servers.value.push(newServer)
        return newServer
      } else {
        throw new Error(response.data.message || 'Erreur lors de la création du serveur')
      }
    } catch (error) {
      console.error('Erreur lors de la création du serveur:', error)
      throw error
    } finally {
      saving.value = false
    }
  }

  const updateServer = async (serverData: Server): Promise<Server> => {
    try {
      saving.value = true
      const response = await axios.put(`/api/v1/settings/servers/${serverData.id}`, serverData)
      
      if (response.data.success) {
        const updatedServer = response.data.server
        const index = servers.value.findIndex(s => s.id === updatedServer.id)
        
        if (index !== -1) {
          servers.value[index] = updatedServer
        }
        
        return updatedServer
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour du serveur')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du serveur:', error)
      throw error
    } finally {
      saving.value = false
    }
  }

  const deleteServer = async (serverId: number): Promise<void> => {
    try {
      saving.value = true
      const response = await axios.delete(`/api/v1/settings/servers/${serverId}`)
      
      if (response.data.success) {
        servers.value = servers.value.filter(s => s.id !== serverId)
      } else {
        throw new Error(response.data.message || 'Erreur lors de la suppression du serveur')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du serveur:', error)
      throw error
    } finally {
      saving.value = false
    }
  }

  const testServerConnection = async (serverId: number | null, serverData?: Server): Promise<any> => {
    try {
      if (serverId) {
        // Test d'un serveur existant
        const response = await axios.post(`/api/v1/settings/servers/${serverId}/test`)
        return response.data
      } else if (serverData) {
        // Test d'un nouveau serveur
        const response = await axios.post(`/api/v1/settings/servers/test`, serverData)
        return response.data
      } else {
        throw new Error('Identifiant de serveur ou données de serveur requis')
      }
    } catch (error) {
      console.error('Erreur lors du test de connexion au serveur:', error)
      throw error
    }
  }

  const testNewServerConnection = async (serverData: any): Promise<any> => {
    try {
      const response = await axios.post('/api/v1/settings/servers/test', serverData)
      return response.data
    } catch (error) {
      console.error('Error testing new server connection:', error)
      throw error
    }
  }

  const getServerStats = async (serverId: number): Promise<any> => {
    try {
      const response = await axios.get(`/api/v1/settings/servers/${serverId}/stats`)
      return response.data
    } catch (error) {
      console.error('Error getting server stats:', error)
      throw error
    }
  }

  const getServerPlans = async (serverId: number): Promise<any> => {
    try {
      const response = await axios.get(`/api/v1/settings/servers/${serverId}/plans`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des plans du serveur:', error)
      throw error
    }
  }

  const showSuccessMessage = async (message: string): Promise<void> => {
    await notificationStore.showSuccess(message)
  }

  const showErrorMessage = async (message: string): Promise<void> => {
    await notificationStore.showError(message)
  }

  return {
    // État
    servers,
    loading,
    saving,
    
    // Getters
    getServerById,
    
    // Actions
    fetchServers,
    createServer,
    updateServer,
    deleteServer,
    testServerConnection,
    testNewServerConnection,
    getServerStats,
    getServerPlans,
    showSuccessMessage,
    showErrorMessage
  }
})
