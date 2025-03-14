import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import * as ablyService from '@/services/ably'
import { useNotificationStore } from './notifications'
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
      const response = await axios.get('/api/v1/services', {
        params: { 
          page,
          per_page: perPage.value,
          ...filters
        }
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
      console.error('Erreur lors de la récupération des services:', err)
      error.value = 'Erreur lors de la récupération des services'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fonction désactivée temporairement
  const fetchServiceStats = async () => {
    // Version simulée pour éviter les erreurs
    stats.value = {
      count_by_status: {
        active: 0,
        pending: 0,
        suspended: 0,
        cancelled: 0,
        terminated: 0,
        fraud: 0
      },
      recent_services: [],
      renewal_services: []
    }
    return stats.value
    
    /* Version originale
    loading.value = true
    error.value = ''
    
    try {
      const response = await axios.get('/api/v1/services/stats')
      stats.value = response.data
      return response.data
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques de services:', err)
      error.value = 'Erreur lors de la récupération des statistiques'
      throw err
    } finally {
      loading.value = false
    }
    */
  }

  const fetchServiceById = async (id: number) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await axios.get(`/api/v1/services/${id}`)
      currentService.value = response.data
      return response.data
    } catch (err) {
      console.error(`Erreur lors de la récupération du service ${id}:`, err)
      error.value = `Erreur lors de la récupération du service ${id}`
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchClientServices = async (clientId: number, status?: string) => {
    loading.value = true
    error.value = ''
    
    try {
      const params = status ? { status } : {}
      const response = await axios.get(`/api/v1/clients/${clientId}/services`, { params })
      return response.data
    } catch (err) {
      console.error(`Erreur lors de la récupération des services du client ${clientId}:`, err)
      error.value = `Erreur lors de la récupération des services du client`
      throw err
    } finally {
      loading.value = false
    }
  }

  const createService = async (serviceData: Service) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await axios.post('/api/v1/services', serviceData)
      notificationStore.showNotification({
        title: 'Service créé',
        message: 'Le service a été créé avec succès',
        type: 'success'
      })
      return response.data
    } catch (err) {
      console.error('Erreur lors de la création du service:', err)
      error.value = 'Erreur lors de la création du service'
      notificationStore.showNotification({
        title: 'Erreur',
        message: 'Impossible de créer le service',
        type: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateService = async (id: number, serviceData: Partial<Service>) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await axios.put(`/api/v1/services/${id}`, serviceData)
      
      // Mettre à jour le service dans la liste si présent
      const index = services.value.findIndex(s => s.id === id)
      if (index !== -1) {
        services.value[index] = { ...services.value[index], ...response.data }
      }
      
      // Mettre à jour le service courant si c'est celui qui est édité
      if (currentService.value && currentService.value.id === id) {
        currentService.value = response.data
      }
      
      notificationStore.showNotification({
        title: 'Service mis à jour',
        message: 'Le service a été mis à jour avec succès',
        type: 'success'
      })
      
      return response.data
    } catch (err) {
      console.error(`Erreur lors de la mise à jour du service ${id}:`, err)
      error.value = `Erreur lors de la mise à jour du service ${id}`
      notificationStore.showNotification({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le service',
        type: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteService = async (id: number) => {
    console.log(`[ServicesStore] deleteService appelé pour le service ${id}`);
    loading.value = true
    error.value = ''
    
    try {
      console.log(`[ServicesStore] Envoi de la requête DELETE à /api/v1/services/${id}`);
      await axios.delete(`/api/v1/services/${id}`)
      
      console.log(`[ServicesStore] Requête DELETE réussie pour le service ${id}`);
      
      // Supprimer le service de la liste
      services.value = services.value.filter(s => s.id !== id)
      
      // Réinitialiser le service courant s'il correspond à celui supprimé
      if (currentService.value && currentService.value.id === id) {
        currentService.value = null
      }
      
      notificationStore.showNotification({
        title: 'Service supprimé',
        message: 'Le service a été supprimé avec succès',
        type: 'success'
      })
      
      return true
    } catch (err) {
      console.error(`[ServicesStore] Erreur lors de la suppression du service ${id}:`, err)
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

  const changeServiceStatus = async (id: number, status: string, notes?: string) => {
    console.log(`[ServicesStore] changeServiceStatus appelé pour le service ${id} avec le statut ${status}`);
    loading.value = true
    error.value = ''
    
    try {
      console.log(`[ServicesStore] Envoi de la requête PUT à /api/v1/services/${id}/status avec les données:`, { status, notes });
      const response = await axios.put(`/api/v1/services/${id}/status`, { status, notes })
      
      console.log(`[ServicesStore] Requête PUT réussie pour le service ${id}`, response.data);
      
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
        type: 'success'
      })
      
      return response.data
    } catch (err) {
      console.error(`[ServicesStore] Erreur lors du changement de statut du service ${id}:`, err)
      error.value = `Erreur lors du changement de statut du service ${id}`
      notificationStore.showNotification({
        title: 'Erreur',
        message: 'Impossible de changer le statut du service',
        type: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Gestionnaire des mises à jour en temps réel
  const handleRealtimeUpdate = (data: any) => {
    if (!data || !data.action) return
    
    const { action, service } = data
    
    switch (action) {
      case 'created':
        services.value.unshift(service)
        break
      case 'updated':
        const indexToUpdate = services.value.findIndex(s => s.id === service.id)
        if (indexToUpdate !== -1) {
          services.value[indexToUpdate] = service
        }
        if (currentService.value && currentService.value.id === service.id) {
          currentService.value = service
        }
        break
      case 'deleted':
        services.value = services.value.filter(s => s.id !== service.id)
        if (currentService.value && currentService.value.id === service.id) {
          currentService.value = null
        }
        break
      case 'status_changed':
        const indexToUpdateStatus = services.value.findIndex(s => s.id === service.id)
        if (indexToUpdateStatus !== -1) {
          services.value[indexToUpdateStatus] = service
        }
        if (currentService.value && currentService.value.id === service.id) {
          currentService.value = service
        }
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
    deleteService
  }
}) 