import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as ablyService from '@/services/ably'
import { useNotificationStore } from './notifications'
import logger from '@/services/logger'
import { ApiService } from '@/services/api'
import type { Service, ServiceStats } from '@/types'

export const useServicesStore = defineStore('services', () => {
  // État
  const services = ref<Service[]>([])
  const currentService = ref<Service | null>(null)
  const loading = ref(false)
  const error = ref('')
  const stats = ref<ServiceStats | null>(null)
  const total = ref(0)
  const currentPage = ref(1)
  const perPage = ref(15)
  const realtimeInitialized = ref(false)
  const lastRealtimeEvent = ref<any>(null)

  // Stores
  const notificationStore = useNotificationStore()

  // Getters
  const getServiceById = computed(() => {
    return (id: number) => services.value.find(service => service.id === id)
  })

  const getServicesByStatus = computed(() => {
    return (status: string) => services.value.filter(service => service.status === status)
  })

  const getServicesByClient = computed(() => {
    return (clientId: number) => services.value.filter(service => service.client_id === clientId)
  })

  // Actions
  const fetchServices = async (page = 1, filters = {}) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await ApiService.routes.admin.service.list({
        page,
        per_page: perPage.value,
        ...filters
      })
      
      services.value = response.data.data
      total.value = response.data.meta.total
      currentPage.value = response.data.meta.current_page
      perPage.value = response.data.meta.per_page
      
      // S'abonner aux mises à jour en temps réel des services
      ablyService.subscribe('services', 'update', (message: any) => {
        handleRealtimeUpdate(message.data)
      })
      
      return response.data
    } catch (err) {
            logger.error('Erreur lors de la récupération des services', { error: err })
      error.value = 'Erreur lors de la récupération des services'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fonction désactivée - La route API correspondante a été supprimée
   * @deprecated La route /api/v1/admin/services/stats n'est pas implémentée dans le contrôleur
   */
  const fetchServiceStats = async () => {
    loading.value = true
    error.value = ''
    
    logger.warn('[ServicesStore] Tentative d\'appel à fetchServiceStats qui est désactivée')
    error.value = 'La fonction de statistiques de services est temporairement indisponible'
    notificationStore.showWarning(
      'Les statistiques de services ne sont pas disponibles pour le moment',
      'Fonctionnalité non disponible'
    )
    
    loading.value = false
    return null
  }

  const fetchServiceById = async (id: number) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await ApiService.routes.admin.service.get(id.toString())
      
      // Vérifier la structure de la réponse et adapter en conséquence
      if (response.data && typeof response.data === 'object') {
        // Si la réponse contient directement les données du service (pas de propriété 'data')
        if (response.data.id && !response.data.data) {
          currentService.value = response.data
          logger.debug(`Service #${id} récupéré avec succès (format direct)`, { service: response.data })
        } 
        // Si les données sont dans une propriété 'data'
        else if (response.data.data) {
          currentService.value = response.data.data
          logger.debug(`Service #${id} récupéré avec succès (format imbriqué)`, { service: response.data.data })
        } 
        // Aucune donnée valide trouvée
        else {
          logger.error(`La réponse pour le service #${id} ne contient pas de données valides`, { response })
          error.value = `Format de réponse incorrect pour le service #${id}`
          currentService.value = null
        }
      } else {
        logger.error(`La réponse pour le service #${id} n'est pas au format attendu`, { response })
        error.value = `Format de réponse incorrect pour le service #${id}`
        currentService.value = null
      }
      
      return currentService.value
    } catch (err) {
      logger.error(`Erreur lors de la récupération du service #${id}`, { error: err })
      error.value = `Impossible de charger les détails du service #${id}`
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchClientServices = async (clientId: number) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await ApiService.routes.admin.service.getClientServices(clientId.toString())
      return response.data
    } catch (err) {
      logger.error(`Erreur lors de la récupération des services du client ${clientId}`, { error: err })
      error.value = `Impossible de charger les services du client ${clientId}`
      return null
    } finally {
      loading.value = false
    }
  }

  const createService = async (serviceData: any) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await ApiService.routes.admin.service.create(serviceData)
      
      // Ajouter le nouveau service à la liste
      services.value.unshift(response.data.data)
      
      notificationStore.showNotification({
        title: 'Service créé',
        message: `Le service a été créé avec succès`,
        type: 'success',
        timeout: 5000
      })
      
      return response.data.data
    } catch (err) {
      logger.error('Erreur lors de la création du service', { error: err })
      error.value = 'Impossible de créer le service'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateService = async (id: number, serviceData: any) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await ApiService.routes.admin.service.update(id.toString(), serviceData)
      
      // Mettre à jour le service dans la liste
      const index = services.value.findIndex(s => s.id === id)
      if (index !== -1) {
        services.value[index] = response.data.data
      }
      
      // Si c'est le service courant, le mettre à jour aussi
      if (currentService.value && currentService.value.id === id) {
        currentService.value = response.data.data
      }
      
      notificationStore.showNotification({
        title: 'Service mis à jour',
        message: `Le service a été mis à jour avec succès`,
        type: 'success',
        timeout: 5000
      })
      
      return response.data.data
    } catch (err) {
      logger.error(`Erreur lors de la mise à jour du service ${id}`, { error: err })
      error.value = `Impossible de mettre à jour le service ${id}`
      return null
    } finally {
      loading.value = false
    }
  }

  const changeServiceStatus = async (id: number, status: string, notes?: string) => {
    logger.info(`[ServicesStore] changeServiceStatus appelé pour le service ${id} avec le statut ${status}`);
    loading.value = true
    error.value = ''
    
    try {
      // L'API changeStatus accepte id, status et les notes (optionnelles)
      const payload = notes ? { status, notes } : { status };
      logger.debug(`[ServicesStore] Envoi de la requête PUT à /api/v1/services/${id}/status`, { data: payload });
      const response = await ApiService.routes.admin.service.changeStatus(id.toString(), payload)
      
      logger.debug(`[ServicesStore] Requête PUT réussie pour le service ${id}`, { response: response.data });
      
      // Mettre à jour le service dans la liste si présent
      const index = services.value.findIndex(s => s.id === id)
      if (index !== -1) {
        services.value[index] = { ...services.value[index], ...response.data }
      }
      
      // Mettre à jour le service courant si c'est celui qui est modifié
      if (currentService.value && currentService.value.id === id) {
        currentService.value = response.data
      }
      
      notificationStore.showNotification({
        title: 'Statut modifié',
        message: `Le statut du service a été changé en "${status}"`,
        type: 'success',
        timeout: 5000
      })
      
      return response.data
    } catch (err) {
      logger.error(`[ServicesStore] Erreur lors du changement de statut du service ${id}`, { error: err });
      error.value = `Impossible de modifier le statut du service ${id}`
      notificationStore.showNotification({
        title: 'Erreur',
        message: 'Impossible de changer le statut du service',
        type: 'error'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteService = async (id: number) => {
        logger.info(`[ServicesStore] deleteService appelé pour le service ${id}`);
    loading.value = true
    error.value = ''
    
    try {
            logger.debug(`[ServicesStore] Envoi de la requête DELETE à /api/v1/services/${id}`);
      await ApiService.routes.admin.service.delete(id.toString())
      
            logger.debug(`[ServicesStore] Requête DELETE réussie pour le service ${id}`);
      
      // Supprimer le service de la liste
      services.value = services.value.filter(s => s.id !== id)
      
      // Réinitialiser le service courant s'il correspond à celui supprimé
      if (currentService.value && currentService.value.id === id) {
        currentService.value = null
      }
      
      notificationStore.showNotification({
        title: 'Service supprimé',
        message: `Le service a été supprimé avec succès`,
        type: 'success',
        timeout: 5000
      })
      
      return true
    } catch (err) {
            logger.error(`[ServicesStore] Erreur lors de la suppression du service ${id}`, { error: err });
      error.value = `Erreur lors de la suppression du service ${id}`
      notificationStore.showNotification({
        title: 'Erreur',
        message: 'Impossible de supprimer le service',
        type: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Initialiser les écouteurs d'événements en temps réel pour les services
   */
  const initRealtimeListeners = () => {
    if (realtimeInitialized.value) {
      logger.info('[ServicesStore] Les écouteurs temps réel sont déjà initialisés')
      return
    }
    
    try {
      // S'abonner au canal de services
      ablyService.subscribe('services', 'created', (message) => {
        handleRealtimeUpdate({ event: 'created', service: message.data })
      })
      
      ablyService.subscribe('services', 'updated', (message) => {
        handleRealtimeUpdate({ event: 'updated', service: message.data })
      })
      
      ablyService.subscribe('services', 'deleted', (message) => {
        handleRealtimeUpdate({ event: 'deleted', service: message.data })
      })
      
      ablyService.subscribe('services', 'status_changed', (message) => {
        handleRealtimeUpdate({ event: 'status_changed', service: message.data })
      })
      
      realtimeInitialized.value = true
      logger.info('[ServicesStore] Écouteurs temps réel initialisés avec succès')
    } catch (err) {
      logger.error('[ServicesStore] Erreur lors de l\'initialisation des écouteurs temps réel', { error: err })
    }
  }

  const handleRealtimeUpdate = (data: any) => {
    const { event, service } = data
    lastRealtimeEvent.value = data
    
    logger.debug(`[ServicesStore] Événement temps réel reçu: ${event}`, { service })
    
    if (!service) return
    
    switch (event) {
      case 'create':
      case 'created':
        services.value = [service, ...services.value]
        notificationStore.showNotification({
          title: 'Nouveau service',
          message: `Service ${service.name || '#' + service.id} créé`,
          type: 'info',
          timeout: 5000
        })
        break
      case 'update':
      case 'updated':
        const indexToUpdate = services.value.findIndex((s: any) => s.id === service.id)
        if (indexToUpdate !== -1) {
          services.value[indexToUpdate] = service
        }
        if (currentService.value && currentService.value.id === service.id) {
          currentService.value = service
        }
        break
      case 'delete':
      case 'deleted':
        services.value = services.value.filter((s: any) => s.id !== service.id)
        if (currentService.value && currentService.value.id === service.id) {
          currentService.value = null
        }
        notificationStore.showNotification({
          title: 'Service supprimé',
          message: `Service ${service.name || '#' + service.id} supprimé`,
          type: 'warning',
          timeout: 5000
        })
        break
      case 'status_changed':
        const indexToUpdateStatus = services.value.findIndex((s: any) => s.id === service.id)
        if (indexToUpdateStatus !== -1) {
          services.value[indexToUpdateStatus] = service
        }
        if (currentService.value && currentService.value.id === service.id) {
          currentService.value = service
        }
        notificationStore.showNotification({
          title: 'Changement de statut',
          message: `Statut du service ${service.name || '#' + service.id} mis à jour: ${service.status}`,
          type: 'info',
          timeout: 5000
        })
        break
    }
  }

  return {
    // État
    services,
    currentService,
    loading,
    error,
    stats,
    total,
    currentPage,
    perPage,
    realtimeInitialized,
    lastRealtimeEvent,
    
    // Getters
    getServiceById,
    getServicesByStatus,
    getServicesByClient,
    
    // Actions
    fetchServices,
    fetchServiceStats,
    fetchServiceById,
    fetchClientServices,
    createService,
    updateService,
    changeServiceStatus,
    deleteService,
    
    // Temps réel
    initRealtimeListeners,
    handleRealtimeUpdate
  }
})