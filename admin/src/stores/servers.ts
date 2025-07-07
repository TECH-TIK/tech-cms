import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNotificationStore } from './notifications'
import logger from '@/services/logger'
import { ApiService } from '@/services/api'

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
  const testing = ref(false)
  
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
      logger.debug('[SERVERS STORE] Récupération des serveurs')
      
      const response = await ApiService.routes.admin.system.server.list()
      
      servers.value = response.data.servers || []
      logger.info('[SERVERS STORE] Serveurs récupérés avec succès', { count: servers.value.length })
      return servers.value
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des serveurs'
      logger.error('[SERVERS STORE] Erreur lors de la récupération des serveurs', { error: err })
      notificationStore.showError(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createServer = async (serverData: Server): Promise<Server> => {
    try {
      saving.value = true
      logger.debug('[SERVERS STORE] Création d\'un nouveau serveur', { serverName: serverData.name })
      
      const response = await ApiService.routes.admin.system.server.create(serverData)
      
      if (response.data.success) {
        const newServer = response.data.server
        servers.value.push(newServer)
        const successMessage = 'Serveur créé avec succès'
        logger.info('[SERVERS STORE] Serveur créé avec succès', { serverId: newServer.id })
        notificationStore.showSuccess(successMessage)
        return newServer
      } else {
        const errorMessage = response.data.message || 'Erreur lors de la création du serveur'
        logger.warn('[SERVERS STORE] Échec de la création du serveur', { message: errorMessage })
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la création du serveur'
      logger.error('[SERVERS STORE] Erreur lors de la création du serveur', { error: err })
      notificationStore.showError(errorMessage)
      throw err
    } finally {
      saving.value = false
    }
  }

  const updateServer = async (serverData: Server): Promise<Server> => {
    try {
      saving.value = true
      logger.debug('[SERVERS STORE] Mise à jour du serveur', { serverId: serverData.id })
      
      const response = await ApiService.routes.admin.system.server.update(String(serverData.id), serverData)
      
      if (response.data.success) {
        const updatedServer = response.data.server
        const index = servers.value.findIndex(s => s.id === updatedServer.id)
        
        if (index !== -1) {
          servers.value[index] = updatedServer
        }
        
        const successMessage = 'Serveur mis à jour avec succès'
        logger.info('[SERVERS STORE] Serveur mis à jour avec succès', { serverId: updatedServer.id })
        notificationStore.showSuccess(successMessage)
        
        return updatedServer
      } else {
        const errorMessage = response.data.message || 'Erreur lors de la mise à jour du serveur'
        logger.warn('[SERVERS STORE] Échec de la mise à jour du serveur', { message: errorMessage })
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour du serveur'
      logger.error('[SERVERS STORE] Erreur lors de la mise à jour du serveur', { error: err })
      notificationStore.showError(errorMessage)
      throw err
    } finally {
      saving.value = false
    }
  }

  const deleteServer = async (serverId: number): Promise<void> => {
    try {
      saving.value = true
      logger.debug('[SERVERS STORE] Suppression du serveur', { serverId })
      
      const response = await ApiService.routes.admin.system.server.delete(String(serverId))
      
      if (response.data.success) {
        servers.value = servers.value.filter(s => s.id !== serverId)
        const successMessage = 'Serveur supprimé avec succès'
        logger.info('[SERVERS STORE] Serveur supprimé avec succès', { serverId })
        notificationStore.showSuccess(successMessage)
      } else {
        const errorMessage = response.data.message || 'Erreur lors de la suppression du serveur'
        logger.warn('[SERVERS STORE] Échec de la suppression du serveur', { message: errorMessage })
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression du serveur'
      logger.error('[SERVERS STORE] Erreur lors de la suppression du serveur', { error: err })
      notificationStore.showError(errorMessage)
      throw err
    } finally {
      saving.value = false
    }
  }

  const testServerConnection = async (serverId: number | null, serverData?: Server): Promise<any> => {
    try {
      testing.value = true
      if (serverId) {
        // Test d'un serveur existant
        logger.debug('[SERVERS STORE] Test de connexion pour un serveur existant', { serverId })
        const response = await ApiService.routes.admin.system.server.test(String(serverId))
        if (response.data.success) {
          logger.info('[SERVERS STORE] Test de connexion réussi', { serverId })
          notificationStore.showSuccess('Connexion au serveur établie avec succès')
        }
        return response.data
      } else if (serverData) {
        // Test d'un nouveau serveur
        logger.debug('[SERVERS STORE] Test de connexion pour un nouveau serveur', { serverName: serverData.name })
        const response = await ApiService.routes.admin.system.server.testNew(serverData)
        if (response.data.success) {
          logger.info('[SERVERS STORE] Test de connexion réussi pour le nouveau serveur')
          notificationStore.showSuccess('Connexion au nouveau serveur établie avec succès')
        }
        return response.data
      } else {
        const errorMessage = 'Identifiant de serveur ou données de serveur requis'
        logger.warn('[SERVERS STORE] Tentative de test de connexion sans identifiant ni données')
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du test de connexion au serveur'
      logger.error('[SERVERS STORE] Erreur lors du test de connexion au serveur', { error: err })
      notificationStore.showError(errorMessage)
      throw err
    } finally {
      testing.value = false
    }
  }

  const testNewServerConnection = async (serverData: any): Promise<any> => {
    try {
      testing.value = true
      logger.debug('[SERVERS STORE] Test de connexion pour un nouveau serveur', { serverName: serverData.name })
      const response = await ApiService.routes.admin.system.server.testNew(serverData)
      if (response.data.success) {
        logger.info('[SERVERS STORE] Test de connexion réussi pour le nouveau serveur')
        notificationStore.showSuccess('Connexion au nouveau serveur établie avec succès')
      }
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du test de connexion au nouveau serveur'
      logger.error('[SERVERS STORE] Erreur lors du test de connexion au nouveau serveur', { error: err })
      notificationStore.showError(errorMessage)
      throw err
    } finally {
      testing.value = false
    }
  }

  const getServerStats = async (serverId: number): Promise<any> => {
    try {
      loading.value = true
      logger.debug('[SERVERS STORE] Récupération des statistiques du serveur', { serverId })
      
      const response = await ApiService.routes.admin.system.server.getStats(String(serverId))
      
      logger.info('[SERVERS STORE] Statistiques du serveur récupérées avec succès', { serverId })
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des statistiques du serveur'
      logger.error('[SERVERS STORE] Erreur lors de la récupération des statistiques du serveur', { error: err })
      notificationStore.showError(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getServerPlans = async (serverId: number): Promise<any> => {
    try {
      loading.value = true
      logger.debug('[SERVERS STORE] Récupération des plans du serveur', { serverId })
      
      const response = await ApiService.routes.admin.system.server.getPlans(String(serverId))
      
      logger.info('[SERVERS STORE] Plans du serveur récupérés avec succès', { serverId })
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des plans du serveur'
      logger.error('[SERVERS STORE] Erreur lors de la récupération des plans du serveur', { error: err })
      notificationStore.showError(errorMessage)
      throw err
    } finally {
      loading.value = false
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
