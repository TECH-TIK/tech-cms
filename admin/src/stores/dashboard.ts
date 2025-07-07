import { defineStore } from 'pinia'
import logger from '@/services/logger'
import { ref } from 'vue'
import { ApiService } from '@/services/api'
import { useNotificationStore } from './notifications'

export const useDashboardStore = defineStore('dashboard', () => {
  // État
  const loading = ref(false)
  // Le type error permet null ou unknown pour la compatibilité avec les erreurs capturées
  const error = ref<unknown | null>(null)
  const stats = ref({
    clients: { total: 0, active: 0, new: 0 },
    services: { total: 0, active: 0, pending: 0 },
    tickets: { total: 0, open: 0, urgent: 0 },
    revenue: { monthly: 0 }
  })
  const activity = ref({
    clients: [],
    services: [],
    tickets: []
  })

  // Actions
  const fetchStats = async () => {
    const notificationStore = useNotificationStore()
    logger.debug('[DASHBOARD STORE] Chargement des statistiques')
    try {
      loading.value = true
      error.value = null
      const response = await ApiService.routes.admin.system.dashboard.getStats()
      stats.value = response.data
      logger.debug('[DASHBOARD STORE] Statistiques chargées')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des statistiques'
      logger.error('[DASHBOARD STORE] Erreur de chargement des statistiques', { error: err })
      notificationStore.showError(errorMessage)
      // Assignation de l'erreur au state
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchActivity = async () => {
    const notificationStore = useNotificationStore()
    logger.debug('[DASHBOARD STORE] Chargement de l\'activité')
    try {
      loading.value = true
      error.value = null
      const response = await ApiService.routes.admin.system.dashboard.getActivity()
      activity.value = response.data
      logger.debug('[DASHBOARD STORE] Activité chargée')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des activités récentes'
      logger.error('[DASHBOARD STORE] Erreur de chargement de l\'activité', { error: err })
      notificationStore.showError(errorMessage)
      // Assignation de l'erreur au state
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Récupère un nombre limité de clients récents
  const fetchRecentClients = async (limit = 5): Promise<any[]> => {
    logger.debug('[DASHBOARD STORE] Chargement des clients récents', { limit })
    try {
      const response = await ApiService.routes.admin.system.dashboard.getRevenue()
      // On extrait et retourne les clients récents depuis les données de revenus
      // Note: Dans une implémentation réelle, il faudrait créer une route dédiée
      return (response.data?.recentClients || []).slice(0, limit)
    } catch (err: any) {
      logger.error('[DASHBOARD STORE] Erreur de chargement des clients récents', { error: err })
      return []
    }
  }
  
  // Récupère un nombre limité de tickets récents
  const fetchRecentTickets = async (limit = 5): Promise<any[]> => {
    logger.debug('[DASHBOARD STORE] Chargement des tickets récents', { limit })
    try {
      // On utilise la route d'activité qui contient les tickets récents
      const response = await ApiService.routes.admin.system.dashboard.getActivity()
      // On extrait et retourne les tickets récents
      return (response.data?.tickets || []).slice(0, limit)
    } catch (err: any) {
      logger.error('[DASHBOARD STORE] Erreur de chargement des tickets récents', { error: err })
      return []
    }
  }
  return {
    // État
    loading,
    error,
    stats,
    activity,
    // Actions
    fetchStats,
    fetchActivity,
    fetchRecentClients,
    fetchRecentTickets
  }
})
