import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ApiService } from '@/services/api'
import logger from '@/services/logger'
import type { Service } from '@/types/api'
import type { DashboardRealtimeEvent } from '@/types/realtime'

export const useServicesStore = defineStore('services', () => {
  // État
  const services = ref<Service[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<string | null>(null)
  const isUpdating = ref(false)

  // Getters
  const getServiceById = computed(() => (id: number) => {
    return services.value.find(service => service.id === id) || null
  })

  const getServicesByStatus = computed(() => (status: string) => {
    return services.value.filter(service => service.status === status)
  })

  const activeServices = computed(() => 
    services.value.filter(service => service.status === 'active')
  )

  const suspendedServices = computed(() => 
    services.value.filter(service => service.status === 'suspended')
  )

  const pendingServices = computed(() => 
    services.value.filter(service => service.status === 'pending')
  )

  // Actions
  const fetchServices = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await ApiService.routes.client.service.list()
      services.value = response.data
      lastUpdate.value = new Date().toISOString()
      
      logger.info('[SERVICES STORE] Services chargés', { 
        count: services.value.length,
        active: activeServices.value.length,
        suspended: suspendedServices.value.length,
        pending: pendingServices.value.length
      })
      
      return response.data
    } catch (err: any) {
      logger.error('[SERVICES STORE] Erreur lors du chargement des services', { error: err })
      error.value = err.response?.data?.message || 'Erreur lors du chargement des services'
      throw err
    } finally {
      loading.value = false
    }
  }

  const refreshServices = async () => {
    logger.info('[SERVICES STORE] Actualisation des services')
    return await fetchServices()
  }

  // Handler pour les mises à jour temps réel
  const handleServiceUpdate = async (event: DashboardRealtimeEvent) => {
    logger.info('[SERVICES STORE] Mise à jour service reçue', { event })

    if (!event.data.service) return

    isUpdating.value = true
    const rawService: any = event.data.service
    const action = event.action || event.data.action

    // Normaliser les données du service pour correspondre à l'interface frontend
    const service: Service = {
      id: rawService.id,
      client_id: rawService.client_id,
      product_id: rawService.product_id || 0,
      name: rawService.name || rawService.product_name || `Service #${rawService.id}`,
      type: rawService.type || rawService.product_name || 'Service',
      status: rawService.status || 'pending',
      recurring_amount: parseFloat(rawService.price || rawService.recurring_amount || 0),
      setup_fee: parseFloat(rawService.setup_fee || 0),
      billing_cycle: rawService.billing_cycle || 'monthly',
      next_due_date: rawService.next_due_date,
      created_at: rawService.created_at,
      updated_at: rawService.updated_at,
      notes: rawService.notes || ''
    }

    logger.info('[SERVICES STORE] Traitement événement service', { 
      action, 
      serviceId: service.id, 
      serviceName: service.name,
      serviceStatus: service.status
    })

    // Gérer les différentes actions
    switch (action) {
      case 'service_delete':
      case 'delete':
      case 'deleted':
        // Pour les suppressions, récupérer la liste complète du backend
        logger.info('[SERVICES STORE] Service supprimé - récupération liste complète prévue', {
          serviceId: service.id,
          serviceName: service.name
        })
        
        try {
          await fetchServices()
          logger.info('[SERVICES STORE] Liste des services mise à jour après suppression')
        } catch (error) {
          logger.error('[SERVICES STORE] Erreur lors de la récupération après suppression', { error })
          // En cas d'erreur, supprimer localement
          const deleteIndex = services.value.findIndex(s => s.id === service.id)
          if (deleteIndex !== -1) {
            services.value.splice(deleteIndex, 1)
          }
        }
        break

      case 'service_status_changed':
      case 'status_changed':
        // Mettre à jour le statut du service existant en préservant les données
        const statusIndex = services.value.findIndex(s => s.id === service.id)
        if (statusIndex !== -1) {
          const oldStatus = services.value[statusIndex].status
          // Merger les nouvelles données avec les existantes pour préserver tous les champs
          services.value[statusIndex] = { ...services.value[statusIndex], ...service }
          logger.info('[SERVICES STORE] Statut service mis à jour', {
            serviceId: service.id,
            oldStatus,
            newStatus: service.status,
            serviceName: services.value[statusIndex].name
          })
        }
        break

      case 'service_create':
      case 'create':
      case 'created':
        // Pour les créations, récupérer la liste complète du backend
        logger.info('[SERVICES STORE] Service créé - récupération liste complète prévue', {
          serviceId: service.id,
          serviceName: service.name
        })
        
        try {
          await fetchServices()
          logger.info('[SERVICES STORE] Liste des services mise à jour après création')
        } catch (error) {
          logger.error('[SERVICES STORE] Erreur lors de la récupération après création', { error })
          // En cas d'erreur, ajouter localement
          const existingIndex = services.value.findIndex(s => s.id === service.id)
          if (existingIndex === -1) {
            services.value.unshift(service)
          }
        }
        break

      default:
        // Action inconnue, mettre à jour le service s'il existe en préservant les données
        const existingIndex = services.value.findIndex(s => s.id === service.id)
        if (existingIndex !== -1) {
          // Merger les nouvelles données avec les existantes pour préserver tous les champs
          services.value[existingIndex] = { ...services.value[existingIndex], ...service }
          logger.info('[SERVICES STORE] Service mis à jour (action inconnue)', {
            serviceId: service.id,
            action,
            serviceName: services.value[existingIndex].name
          })
        }
        break
    }

    lastUpdate.value = new Date().toISOString()
    setTimeout(() => { isUpdating.value = false }, 1000)
  }

  // Méthodes utilitaires
  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    services.value = []
    loading.value = false
    error.value = null
    lastUpdate.value = null
    isUpdating.value = false
  }

  return {
    // État
    services,
    loading,
    error,
    lastUpdate,
    isUpdating,
    
    // Getters
    getServiceById,
    getServicesByStatus,
    activeServices,
    suspendedServices,
    pendingServices,
    
    // Actions
    fetchServices,
    refreshServices,
    handleServiceUpdate,
    clearError,
    reset
  }
})
