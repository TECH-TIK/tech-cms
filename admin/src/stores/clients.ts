import { defineStore } from 'pinia'
import { ApiService } from '@/services/api'
import { useAuthStore } from './auth'
import { useNotificationStore } from './notifications'
import logger from '@/services/logger'
import * as ablyService from '@/services/ably'
import { ref, computed } from 'vue'

logger.info('[CLIENTS STORE] Initialisation du store clients')

export const useClientsStore = defineStore('clients', () => {
  // État
  const clients = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const perPage = ref(10)
  const realtimeInitialized = ref(false)
  const lastEventTimestamp = ref<string | null>(null)
  const currentClient = ref<any | null>(null)
  const lastRealtimeEvent = ref<any | null>(null)

  // Getters
  const hasClients = computed(() => clients.value.length > 0)
  const totalClients = computed(() => clients.value.length)

  // Actions
  const fetchClients = async () => {
    logger.info('[CLIENTS STORE] Récupération des clients...')
    loading.value = true
    error.value = null
    
    try {
      // Vérifier l'authentification avant de faire la requête
      const authStore = useAuthStore()
      const isAuthenticated = await authStore.checkAuth()
      
      if (!isAuthenticated) {
        logger.warn('[CLIENTS STORE] Utilisateur non authentifié')
        error.value = 'Vous devez être connecté pour accéder à cette ressource'
        loading.value = false
        return false
      }
      
      logger.debug('[CLIENTS STORE] Envoi de la requête API pour récupérer les clients')
      const response = await ApiService.routes.admin.client.list()
      logger.debug('[CLIENTS STORE] Réponse reçue', { status: response.status })
      
      clients.value = response.data.data.clients || []
      loading.value = false
      return true
    } catch (err: any) {
      logger.error('[CLIENTS STORE] Erreur lors de la récupération des clients', { message: err.message, response: err.response?.data })
      error.value = err.message || 'Erreur lors de la récupération des clients'
      loading.value = false
      return false
    }
  }

  /**
   * Récupérer un client par son ID
   */
  const getClient = async (id: number) => {
    logger.info(`[CLIENTS STORE] Récupération du client #${id}`)
    try {
      const response = await ApiService.routes.admin.client.get(id.toString())
      logger.debug('[CLIENTS STORE] Structure de la réponse', { data: response.data })
      
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
      
      logger.debug('[CLIENTS STORE] Données du client extraites', { clientData })
      return clientData
    } catch (err: any) {
      logger.error(`[CLIENTS STORE] Erreur lors de la récupération du client #${id}`, { error: err.message })
      error.value = err.message
      return null
    }
  }
  
  /**
   * Créer un nouveau client
   */
  const createClient = async (clientData: any) => {
    logger.info('[CLIENTS STORE] Création d\'un nouveau client', { clientData })
    loading.value = true
    error.value = null
    
    // Initialiser le store de notifications
    const notificationStore = useNotificationStore()
    
    try {
      const response = await ApiService.routes.admin.client.create(clientData)
      logger.info('[CLIENTS STORE] Client créé avec succès', { response: response.data })
      
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
      
      // Ajouter le nouveau client à la liste
      if (newClient) {
        clients.value.unshift(newClient)
        logger.debug('[CLIENTS STORE] Nouveau client ajouté à la liste', { client_id: newClient.id })
        
        // Afficher une notification de succès
        notificationStore.showSuccess('Client créé avec succès')
      }
      
      loading.value = false
      return newClient
    } catch (err: any) {
      logger.error('[CLIENTS STORE] Erreur lors de la création du client', { error: err.message })
      error.value = err.message || 'Erreur lors de la création du client'
      loading.value = false
      
      // Afficher une notification d'erreur
      notificationStore.showError(`Erreur lors de la création du client: ${err.message || 'Erreur inconnue'}`)
      return null
    }
  }
  
  /**
   * Mettre à jour un client existant
   */
  const updateClient = async (id: number, clientData: any) => {
    logger.info(`[CLIENTS STORE] Mise à jour du client #${id}`, { clientData })
    loading.value = true
    error.value = null
    
    // Initialiser le store de notifications
    const notificationStore = useNotificationStore()
    
    try {
      const response = await ApiService.routes.admin.client.update(id.toString(), clientData)
      logger.debug('[CLIENTS STORE] Client mis à jour avec succès', { response: response.data })
      
      // Extraire les données du client de différentes structures possibles
      let updatedClient = null
      
      if (response.data && response.data.data && response.data.data.client) {
        // Structure attendue: { data: { client: {...} } }
        updatedClient = response.data.data.client
      } else if (response.data && response.data.data) {
        // Structure possible: { data: {...} }
        updatedClient = response.data.data
      } else if (response.data && response.data.client) {
        // Structure possible: { client: {...} }
        updatedClient = response.data.client
      } else if (response.data) {
        // Structure possible: {...}
        updatedClient = response.data
      }
      
      // Mettre à jour le client dans la liste
      if (updatedClient) {
        handleClientUpdate(updatedClient)
        logger.debug('[CLIENTS STORE] Client mis à jour dans la liste', { client_id: updatedClient.id })
        
        // Afficher une notification de succès
        notificationStore.showSuccess(`Client #${id} mis à jour avec succès`)
      }
      
      loading.value = false
      return updatedClient
    } catch (err: any) {
      logger.error(`[CLIENTS STORE] Erreur lors de la mise à jour du client #${id}`, { error: err.message })
      error.value = err.message || 'Erreur lors de la mise à jour du client'
      loading.value = false
      
      // Afficher une notification d'erreur
      notificationStore.showError(`Erreur lors de la mise à jour du client: ${err.message || 'Erreur inconnue'}`)
      return null
    }
  }
  
  /**
   * Supprimer un client
   */
  const deleteClient = async (id: number) => {
    logger.info(`[CLIENTS STORE] Suppression du client #${id}`)
    loading.value = true
    error.value = null
    
    // Initialiser le store de notifications
    const notificationStore = useNotificationStore()
    
    try {
      await ApiService.routes.admin.client.delete(id.toString())
      logger.debug(`[CLIENTS STORE] Client #${id} supprimé avec succès`)
      
      // Supprimer le client de la liste
      handleClientDelete(id)
      
      loading.value = false
      
      // Afficher une notification de succès
      notificationStore.showSuccess(`Client #${id} supprimé avec succès`)
      return true
    } catch (err: any) {
      logger.error(`[CLIENTS STORE] Erreur lors de la suppression du client #${id}`, { error: err.message })
      error.value = err.message || 'Erreur lors de la suppression du client'
      loading.value = false
      
      // Afficher une notification d'erreur
      notificationStore.showError(`Erreur lors de la suppression du client: ${err.message || 'Erreur inconnue'}`)
      return false
    }
  }

  /**
   * Initialiser les écouteurs d'événements en temps réel pour les clients
   */
  const initRealtimeListeners = () => {
    // Ne pas réinitialiser si déjà fait
    if (realtimeInitialized.value) {
      logger.debug('[CLIENTS STORE] Écouteurs temps réel déjà initialisés')
      return
    }

    logger.info('[CLIENTS STORE] Initialisation des écouteurs temps réel')
    
    try {
      // EXPÉRIMENTAL: S'abonner au canal d'administration pour l'événement dédié client-update
      // au lieu de activity-update pour tester si cela résout le problème de mise à jour en temps réel
      ablyService.subscribeToAdminChannel('client-update', (eventData) => {
        logger.debug('[admin-frontend] EXPÉRIMENTAL - Événement client-update reçu', { eventData })
        // Traiter directement l'événement client-update sans filtre de type
        handleRealtimeClientUpdate(eventData)
      })
      
      realtimeInitialized.value = true
      logger.info('[CLIENTS STORE] Écouteurs temps réel initialisés avec succès')
    } catch (err) {
      logger.error('[CLIENTS STORE] Erreur lors de l\'initialisation des écouteurs temps réel', { error: err })
    }
  }

  /**
   * Gérer les mises à jour en temps réel des clients
   */
  const handleRealtimeClientUpdate = (eventData: any) => {
    // Vérifier que nous avons les données nécessaires
    if (!eventData || !eventData.action || !eventData.client) {
      logger.warn('[CLIENTS STORE] Données d\'événement client incomplètes', { eventData })
      return
    }

    const { action, client, timestamp } = eventData
    
    // Éviter les doublons si l'événement a déjà été traité
    if (lastEventTimestamp.value === timestamp && timestamp) {
      logger.debug('[CLIENTS STORE] Événement déjà traité, ignoré', { timestamp })
      return
    }
    
    lastEventTimestamp.value = timestamp
    lastRealtimeEvent.value = eventData
    
    logger.info(`[CLIENTS STORE] Traitement de l'événement ${action} pour le client #${client.id}`, { 
      timestamp, 
      client_id: client.id 
    })
    
    switch (action) {
      case 'create':
        // Ajouter le nouveau client au début de la liste
        handleClientCreate(client)
        break
        
      case 'update':
        // Mettre à jour le client existant
        handleClientUpdate(client)
        break
        
      case 'delete':
        // Supprimer le client de la liste
        handleClientDelete(client.id)
        break
        
      default:
        logger.warn(`[CLIENTS STORE] Action inconnue: ${action}`)
    }
  }

  /**
   * Gérer la création d'un client en temps réel
   */
  const handleClientCreate = (clientData: any) => {
    logger.debug('[CLIENTS STORE] Ajout d\'un nouveau client en temps réel', { client_id: clientData.id })
    
    // Vérifier que le client n'existe pas déjà
    const existingIndex = clients.value.findIndex(c => c.id === clientData.id)
    if (existingIndex !== -1) {
      logger.debug('[CLIENTS STORE] Client existant, mise à jour', { client_id: clientData.id })
      clients.value[existingIndex] = clientData
      return
    }
    
    // Ajouter le nouveau client au début de la liste
    clients.value.unshift(clientData)
    logger.info('[CLIENTS STORE] Nouveau client ajouté en temps réel', { client_id: clientData.id })
  }
  
  /**
   * Gérer la mise à jour d'un client en temps réel
   */
  const handleClientUpdate = (clientData: any) => {
    logger.debug('[CLIENTS STORE] Mise à jour d\'un client en temps réel', { client_id: clientData.id })
    
    // Trouver le client et le mettre à jour
    const index = clients.value.findIndex(c => c.id === clientData.id)
    
    if (index !== -1) {
      // Mettre à jour le client dans la liste
      clients.value[index] = clientData
      logger.debug('[CLIENTS STORE] Client mis à jour avec succès dans la liste', { client_id: clientData.id })
      
      // Mettre à jour currentClient si c'est le client actuellement consulté
      if (currentClient.value && currentClient.value.id === clientData.id) {
        currentClient.value = clientData
        logger.debug('[CLIENTS STORE] Client courant mis à jour avec succès', { client_id: clientData.id })
      }
    } else {
      // Si le client n'existe pas encore, l'ajouter
      logger.debug('[CLIENTS STORE] Client non trouvé dans la liste, ajout', { client_id: clientData.id })
      clients.value.unshift(clientData)
    }
  }
  
  /**
   * Gérer la suppression d'un client en temps réel
   */
  const handleClientDelete = (clientId: number | string) => {
    logger.debug('[CLIENTS STORE] Suppression d\'un client en temps réel', { client_id: clientId })
    
    // Supprimer le client de la liste
    const initialLength = clients.value.length
    clients.value = clients.value.filter(c => c.id !== clientId)
    
    if (clients.value.length < initialLength) {
      logger.info('[CLIENTS STORE] Client supprimé avec succès en temps réel', { client_id: clientId })
    } else {
      logger.debug('[CLIENTS STORE] Client non trouvé dans la liste pour suppression', { client_id: clientId })
    }
  }
  
  // Retourner l'état et les fonctions du store
  return {
    // État
    clients,
    loading,
    error,
    currentPage,
    totalPages,
    perPage,
    realtimeInitialized,
    lastEventTimestamp,
    currentClient,
    lastRealtimeEvent,
    
    // Getters
    hasClients,
    totalClients,
    
    // Actions
    fetchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    initRealtimeListeners,
    handleRealtimeClientUpdate,
    handleClientCreate,
    handleClientUpdate,
    handleClientDelete
  }
})