/**
 * Store Pinia pour le dashboard client
 * 
 * Gère l'état et les actions pour les données du dashboard client
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  DashboardService,
  type DashboardStats,
  type DashboardOverview,
  type Service,
  type Invoice,
  type Ticket
} from '@/services/dashboardService'
import { useRealtimeStore } from '@/stores/realtime'
import { useAuthStore } from '@/stores/auth'
import type { DashboardRealtimeEvent } from '@/types/realtime'
import logger from '@/services/logger'

export const useDashboardStore = defineStore('clientDashboard', () => {
  // État réactif
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<DashboardStats | null>(null)
  const overview = ref<DashboardOverview | null>(null)
  
  // Données individuelles
  const recentServices = ref<Service[]>([])
  const recentInvoices = ref<Invoice[]>([])
  const recentTickets = ref<Ticket[]>([])
  const unpaidInvoices = ref<Invoice[]>([])
  const openTickets = ref<Ticket[]>([])

  // État temps réel
  const realtimeInitialized = ref(false)
  const lastUpdate = ref<string | null>(null)
  const isUpdating = ref(false)

  // Computed
  const hasData = computed(() => !!stats.value)
  const totalServices = computed(() => stats.value?.services.total || 0)
  const activeServices = computed(() => stats.value?.services.active || 0)
  const totalUnpaidAmount = computed(() => stats.value?.invoices.total_due || 0)
  const openTicketsCount = computed(() => 
    (stats.value?.tickets.open || 0) + (stats.value?.tickets.in_progress || 0)
  )

  /**
   * Récupère les statistiques du dashboard
   */
  const fetchStats = async () => {
    loading.value = true
    error.value = null

    try {
      console.log('[DashboardStore] Récupération des statistiques...')
      stats.value = await DashboardService.getStats()
      console.log('[DashboardStore] Statistiques récupérées:', stats.value)
    } catch (err: any) {
      console.error('[DashboardStore] Erreur lors de la récupération des statistiques:', err)
      error.value = err.message || 'Erreur lors de la récupération des statistiques'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère la vue d'ensemble complète du dashboard
   */
  const fetchOverview = async () => {
    loading.value = true
    error.value = null

    try {
      console.log('[DashboardStore] Récupération de la vue d\'ensemble...')
      overview.value = await DashboardService.getOverview()
      
      // Mettre à jour les données individuelles
      recentServices.value = overview.value.recent_services
      recentInvoices.value = overview.value.recent_invoices
      recentTickets.value = overview.value.recent_tickets
      unpaidInvoices.value = overview.value.unpaid_invoices
      openTickets.value = overview.value.open_tickets
      
      console.log('[DashboardStore] Vue d\'ensemble récupérée:', overview.value)
    } catch (err: any) {
      console.error('[DashboardStore] Erreur lors de la récupération de la vue d\'ensemble:', err)
      error.value = err.message || 'Erreur lors de la récupération de la vue d\'ensemble'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère toutes les données du dashboard (stats + overview)
   */
  const fetchDashboardData = async () => {
    loading.value = true
    error.value = null

    try {
      console.log('[DashboardStore] Récupération complète des données du dashboard...')
      
      // Récupérer les statistiques et la vue d'ensemble en parallèle
      const [statsData, overviewData] = await Promise.all([
        DashboardService.getStats(),
        DashboardService.getOverview()
      ])

      stats.value = statsData
      overview.value = overviewData
      
      // Mettre à jour les données individuelles
      recentServices.value = overviewData.recent_services
      recentInvoices.value = overviewData.recent_invoices
      recentTickets.value = overviewData.recent_tickets
      unpaidInvoices.value = overviewData.unpaid_invoices
      openTickets.value = overviewData.open_tickets

      console.log('[DashboardStore] Données du dashboard récupérées avec succès')
    } catch (err: any) {
      console.error('[DashboardStore] Erreur lors de la récupération des données du dashboard:', err)
      error.value = err.message || 'Erreur lors de la récupération des données du dashboard'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère uniquement les services récents
   */
  const fetchRecentServices = async () => {
    try {
      console.log('[DashboardStore] Récupération des services récents...')
      recentServices.value = await DashboardService.getRecentServices()
      console.log('[DashboardStore] Services récents récupérés:', recentServices.value.length)
    } catch (err: any) {
      console.error('[DashboardStore] Erreur lors de la récupération des services récents:', err)
      error.value = err.message || 'Erreur lors de la récupération des services récents'
      throw err
    }
  }

  /**
   * Récupère uniquement les factures récentes
   */
  const fetchRecentInvoices = async () => {
    try {
      console.log('[DashboardStore] Récupération des factures récentes...')
      recentInvoices.value = await DashboardService.getRecentInvoices()
      console.log('[DashboardStore] Factures récentes récupérées:', recentInvoices.value.length)
    } catch (err: any) {
      console.error('[DashboardStore] Erreur lors de la récupération des factures récentes:', err)
      error.value = err.message || 'Erreur lors de la récupération des factures récentes'
      throw err
    }
  }

  /**
   * Récupère uniquement les tickets récents
   */
  const fetchRecentTickets = async () => {
    try {
      console.log('[DashboardStore] Récupération des tickets récents...')
      recentTickets.value = await DashboardService.getRecentTickets()
      console.log('[DashboardStore] Tickets récents récupérés:', recentTickets.value.length)
    } catch (err: any) {
      console.error('[DashboardStore] Erreur lors de la récupération des tickets récents:', err)
      error.value = err.message || 'Erreur lors de la récupération des tickets récents'
      throw err
    }
  }

  /**
   * Réinitialise l'état d'erreur
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Réinitialise toutes les données
   */
  const resetData = () => {
    stats.value = null
    overview.value = null
    recentServices.value = []
    recentInvoices.value = []
    recentTickets.value = []
    unpaidInvoices.value = []
    openTickets.value = []
    error.value = null
    loading.value = false
    realtimeInitialized.value = false
    lastUpdate.value = null
    isUpdating.value = false
  }

  // Méthodes temps réel
  const initRealtimeUpdates = async () => {
    try {
      const authStore = useAuthStore()
      const realtimeStore = useRealtimeStore()

      if (!authStore.isAuthenticated || !authStore.user?.id) {
        logger.warn('[DASHBOARD STORE] Utilisateur non authentifié, impossible d\'initialiser le temps réel')
        return
      }

      if (realtimeInitialized.value) {
        logger.warn('[DASHBOARD STORE] Temps réel déjà initialisé')
        return
      }

      const clientId = authStore.user.id
      logger.info('[DASHBOARD STORE] Initialisation des mises à jour temps réel', { clientId })

      // Vérifier que le service temps réel est prêt
      if (!realtimeStore.isReady) {
        logger.warn('[DASHBOARD STORE] Service temps réel non prêt, tentative d\'initialisation différée')
        // Réessayer après 2 secondes
        setTimeout(() => {
          if (!realtimeInitialized.value) {
            initRealtimeUpdates()
          }
        }, 2000)
        return
      }

      // S'abonner aux événements dashboard
      await realtimeStore.subscribeToDashboardEvents(clientId)

      // Enregistrer les handlers pour chaque type d'entité
      realtimeStore.registerDashboardHandler('service', handleServiceUpdate)
      realtimeStore.registerDashboardHandler('invoice', handleInvoiceUpdate)
      realtimeStore.registerDashboardHandler('ticket', handleTicketUpdate)
      realtimeStore.registerDashboardHandler('stats', handleStatsUpdate)

      realtimeInitialized.value = true
      logger.info('[DASHBOARD STORE] Temps réel initialisé avec succès')

    } catch (err: any) {
      logger.error('[DASHBOARD STORE] Erreur lors de l\'initialisation du temps réel', {
        error: err.message
      })
      // Ne pas faire échouer le dashboard en cas d'erreur temps réel
      realtimeInitialized.value = false
    }
  }

  const stopRealtimeUpdates = () => {
    const realtimeStore = useRealtimeStore()

    logger.info('[DASHBOARD STORE] Arrêt des mises à jour temps réel')

    // Désabonnement des événements
    realtimeStore.unsubscribeFromDashboardEvents()

    // Suppression des handlers
    realtimeStore.unregisterDashboardHandler('service')
    realtimeStore.unregisterDashboardHandler('invoice')
    realtimeStore.unregisterDashboardHandler('ticket')
    realtimeStore.unregisterDashboardHandler('stats')

    realtimeInitialized.value = false
  }

  // Handlers pour les mises à jour temps réel
  const handleServiceUpdate = async (event: DashboardRealtimeEvent) => {
    logger.info('[DASHBOARD STORE] Mise à jour service reçue', { event })

    if (!event.data.service) return

    isUpdating.value = true
    const rawService: any = event.data.service
    const action = event.action || event.data.action

    // Normaliser les données du service pour correspondre à l'interface frontend
    const service = {
      id: rawService.id,
      client_id: rawService.client_id,
      name: rawService.name || rawService.product_name || `Service #${rawService.id}`,
      type: rawService.type || rawService.product_type || rawService.product_name || 'Service',
      status: rawService.status || 'pending',
      price: parseFloat(rawService.price || rawService.recurring_amount || rawService.product_price || 0),
      billing_cycle: rawService.billing_cycle || 'monthly',
      next_due_date: rawService.next_due_date,
      created_at: rawService.created_at,
      updated_at: rawService.updated_at
    }

    logger.info('[DASHBOARD STORE] Traitement événement service', {
      action,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceStatus: service.status
    })

    // Gérer les différentes actions
    switch (action) {
      case 'service_delete':
      case 'delete':
      case 'deleted':
        // Pour les suppressions, on récupérera la liste complète du backend
        // Pas de modification locale pour éviter la désynchronisation
        logger.info('[DASHBOARD STORE] Service supprimé - récupération liste complète prévue', {
          serviceId: service.id,
          serviceName: service.name
        })
        break

      case 'service_status_changed':
      case 'status_changed':
      case 'update':
      case 'updated':
        // Mettre à jour le service existant
        const updateIndex = recentServices.value.findIndex(s => s.id === service.id)
        if (updateIndex !== -1) {
          recentServices.value[updateIndex] = service
          logger.info('[DASHBOARD STORE] Service mis à jour', {
            serviceId: service.id,
            newStatus: service.status
          })
        }
        break

      case 'service_create':
      case 'create':
      case 'created':
        // Pour les créations, on récupérera la liste complète du backend
        // Pas de modification locale pour éviter la désynchronisation
        logger.info('[DASHBOARD STORE] Service créé - récupération liste complète prévue', {
          serviceId: service.id,
          serviceName: service.name
        })
        break

      default:
        // Action inconnue, mettre à jour le service s'il existe
        const existingIndex = recentServices.value.findIndex(s => s.id === service.id)
        if (existingIndex !== -1) {
          recentServices.value[existingIndex] = service
          logger.info('[DASHBOARD STORE] Service mis à jour (action inconnue)', {
            serviceId: service.id,
            action
          })
        }
        break
    }

    // Mettre à jour les statistiques et la liste des services si disponibles
    if (stats.value) {
      // Pour les suppressions et créations, récupérer les vraies données du backend
      if (action === 'service_delete' || action === 'delete' || action === 'deleted' ||
          action === 'service_create' || action === 'create' || action === 'created') {
        logger.info('[DASHBOARD STORE] Récupération des données après modification de service', { action })
        try {
          // Optimisation : récupérer toutes les données en une seule fois avec getOverview()
          const freshOverview = await DashboardService.getOverview()

          // Mettre à jour toutes les données depuis l'overview
          recentServices.value = freshOverview.recent_services
          recentInvoices.value = freshOverview.recent_invoices
          recentTickets.value = freshOverview.recent_tickets
          unpaidInvoices.value = freshOverview.unpaid_invoices
          openTickets.value = freshOverview.open_tickets

          // Récupérer aussi les statistiques pour les compteurs
          const freshStats = await DashboardService.getStats()
          stats.value = freshStats

          logger.info('[DASHBOARD STORE] Toutes les données mises à jour depuis le backend', {
            services: freshStats.services,
            recentServicesCount: freshOverview.recent_services.length,
            recentInvoicesCount: freshOverview.recent_invoices.length,
            recentTicketsCount: freshOverview.recent_tickets.length,
            action
          })
        } catch (error) {
          logger.error('[DASHBOARD STORE] Erreur lors de la récupération des données', { error })
          // En cas d'erreur, recalculer approximativement
          const activeCount = recentServices.value.filter(s => s.status === 'active').length
          const suspendedCount = recentServices.value.filter(s => s.status === 'suspended').length

          stats.value.services.active = activeCount
          stats.value.services.suspended = suspendedCount
        }
      } else {
        // Pour les autres actions (changement de statut), recalculer approximativement
        const activeCount = recentServices.value.filter(s => s.status === 'active').length
        const suspendedCount = recentServices.value.filter(s => s.status === 'suspended').length

        stats.value.services.active = activeCount
        stats.value.services.suspended = suspendedCount

        logger.info('[DASHBOARD STORE] Statistiques services recalculées localement', {
          active: activeCount,
          suspended: suspendedCount,
          action
        })
      }
    }

    lastUpdate.value = new Date().toISOString()
    setTimeout(() => { isUpdating.value = false }, 1000)
  }

  const handleInvoiceUpdate = async (event: DashboardRealtimeEvent) => {
    logger.info('[DASHBOARD STORE] Mise à jour facture reçue', { event })

    // 🔍 LOGS DIAGNOSTIC DÉTAILLÉS - HANDLER DASHBOARD STORE
    logger.info('[DASHBOARD STORE] 📊 ANALYSE STRUCTURE EVENT REÇU:', {
      'event_keys': Object.keys(event),
      'event.action': event.action,
      'event.entity_type': event.entity_type,
      'event.data_exists': !!event.data,
      'event.data_keys': event.data ? Object.keys(event.data) : null,
      'event.data.invoice_exists': event.data ? !!event.data.invoice : null,
      'event.invoice_exists': !!(event as any).invoice,
      'structure_complete': JSON.stringify(event, null, 2)
    })

    if (!event.data.invoice) {
      logger.error('[DASHBOARD STORE] ❌ AUCUNE DONNÉE FACTURE TROUVÉE dans event.data.invoice')
      return
    }

    isUpdating.value = true
    const invoice = event.data.invoice
    const action = event.action || event.data.action

    logger.info('[DASHBOARD STORE] Traitement événement facture', {
      action,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number
    })

    // Gérer les différentes actions
    switch (action) {
      case 'invoice_create':
      case 'create':
      case 'created':
        // Pour les créations, récupérer la liste complète du backend
        logger.info('[DASHBOARD STORE] Facture créée - récupération liste complète prévue', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number
        })
        break

      case 'invoice_update':
      case 'update':
      case 'updated':
        // Mettre à jour la facture existante en préservant les données existantes
        const updateIndex = recentInvoices.value.findIndex(i => i.id === invoice.id)
        if (updateIndex !== -1) {
          // Merger les nouvelles données avec les existantes pour préserver tous les champs
          recentInvoices.value[updateIndex] = { ...recentInvoices.value[updateIndex], ...invoice }
          logger.info('[DASHBOARD STORE] Facture mise à jour', {
            invoiceId: invoice.id,
            newStatus: invoice.status,
            number: recentInvoices.value[updateIndex].number
          })
        }
        break

      default:
        // Action inconnue, mettre à jour la facture si elle existe en préservant les données
        const existingIndex = recentInvoices.value.findIndex(i => i.id === invoice.id)
        if (existingIndex !== -1) {
          // Merger les nouvelles données avec les existantes pour préserver tous les champs
          recentInvoices.value[existingIndex] = { ...recentInvoices.value[existingIndex], ...invoice }
          logger.info('[DASHBOARD STORE] Facture mise à jour (action inconnue)', {
            invoiceId: invoice.id,
            action,
            number: recentInvoices.value[existingIndex].number
          })
        }
        break
    }

    // Mettre à jour les données si disponibles
    if (stats.value) {
      // Pour les créations, récupérer les vraies données du backend
      if (action === 'invoice_create' || action === 'create' || action === 'created') {
        logger.info('[DASHBOARD STORE] Récupération des données après modification de facture', { action })
        try {
          // Récupérer toutes les données en une fois avec getOverview()
          const freshOverview = await DashboardService.getOverview()

          // Mettre à jour toutes les données depuis l'overview
          recentServices.value = freshOverview.recent_services
          recentInvoices.value = freshOverview.recent_invoices
          recentTickets.value = freshOverview.recent_tickets
          unpaidInvoices.value = freshOverview.unpaid_invoices
          openTickets.value = freshOverview.open_tickets

          // Récupérer aussi les statistiques pour les compteurs
          const freshStats = await DashboardService.getStats()
          stats.value = freshStats

          logger.info('[DASHBOARD STORE] Toutes les données mises à jour après modification facture', {
            services: freshStats.services,
            recentInvoicesCount: freshOverview.recent_invoices.length,
            action
          })
        } catch (error) {
          logger.error('[DASHBOARD STORE] Erreur lors de la récupération des données', { error })
          // En cas d'erreur, recalculer approximativement
          const unpaidCount = recentInvoices.value.filter(i => i.status === 'unpaid').length
          const totalDue = recentInvoices.value
            .filter(i => i.status === 'unpaid')
            .reduce((sum, i) => sum + i.amount, 0)

          stats.value.invoices.unpaid = unpaidCount
          stats.value.invoices.total_due = totalDue
        }
      } else {
        // Pour les autres actions, recalculer approximativement
        const unpaidCount = recentInvoices.value.filter(i => i.status === 'unpaid').length
        const totalDue = recentInvoices.value
          .filter(i => i.status === 'unpaid')
          .reduce((sum, i) => sum + i.amount, 0)

        stats.value.invoices.unpaid = unpaidCount
        stats.value.invoices.total_due = totalDue

        logger.info('[DASHBOARD STORE] Statistiques factures recalculées localement', {
          unpaid: unpaidCount,
          totalDue: totalDue,
          action
        })
      }
    }

    lastUpdate.value = new Date().toISOString()
    setTimeout(() => { isUpdating.value = false }, 1000)
  }

  const handleTicketUpdate = async (event: DashboardRealtimeEvent) => {
    logger.info('[DASHBOARD STORE] Mise à jour ticket reçue', { event })

    if (!event.data.ticket) return

    isUpdating.value = true
    const ticket = event.data.ticket
    const action = event.action || event.data.action

    logger.info('[DASHBOARD STORE] Traitement événement ticket', {
      action,
      ticketId: ticket.id,
      ticketTitle: ticket.title
    })

    // Gérer les différentes actions
    switch (action) {
      case 'ticket_create':
      case 'create':
      case 'created':
        // Pour les créations, récupérer la liste complète du backend
        logger.info('[DASHBOARD STORE] Ticket créé - récupération liste complète prévue', {
          ticketId: ticket.id,
          ticketTitle: ticket.title
        })
        break

      case 'ticket_update':
      case 'update':
      case 'updated':
        // Mettre à jour le ticket existant en préservant les données existantes
        const updateIndex = recentTickets.value.findIndex(t => t.id === ticket.id)
        if (updateIndex !== -1) {
          // Merger les nouvelles données avec les existantes pour préserver tous les champs
          recentTickets.value[updateIndex] = { ...recentTickets.value[updateIndex], ...ticket }
          logger.info('[DASHBOARD STORE] Ticket mis à jour', {
            ticketId: ticket.id,
            newStatus: ticket.status,
            title: recentTickets.value[updateIndex].title
          })
        }
        break

      default:
        // Action inconnue, mettre à jour le ticket s'il existe en préservant les données
        const existingIndex = recentTickets.value.findIndex(t => t.id === ticket.id)
        if (existingIndex !== -1) {
          // Merger les nouvelles données avec les existantes pour préserver tous les champs
          recentTickets.value[existingIndex] = { ...recentTickets.value[existingIndex], ...ticket }
          logger.info('[DASHBOARD STORE] Ticket mis à jour (action inconnue)', {
            ticketId: ticket.id,
            action,
            title: recentTickets.value[existingIndex].title
          })
        }
        break
    }

    // Mettre à jour les données si disponibles
    if (stats.value) {
      // Pour les créations, récupérer les vraies données du backend
      if (action === 'ticket_create' || action === 'create' || action === 'created') {
        logger.info('[DASHBOARD STORE] Récupération des données après modification de ticket', { action })
        try {
          // Récupérer toutes les données en une fois avec getOverview()
          const freshOverview = await DashboardService.getOverview()

          // Mettre à jour toutes les données depuis l'overview
          recentServices.value = freshOverview.recent_services
          recentInvoices.value = freshOverview.recent_invoices
          recentTickets.value = freshOverview.recent_tickets
          unpaidInvoices.value = freshOverview.unpaid_invoices
          openTickets.value = freshOverview.open_tickets

          // Récupérer aussi les statistiques pour les compteurs
          const freshStats = await DashboardService.getStats()
          stats.value = freshStats

          logger.info('[DASHBOARD STORE] Toutes les données mises à jour après modification ticket', {
            services: freshStats.services,
            recentTicketsCount: freshOverview.recent_tickets.length,
            action
          })
        } catch (error) {
          logger.error('[DASHBOARD STORE] Erreur lors de la récupération des données', { error })
          // En cas d'erreur, recalculer approximativement
          const openCount = recentTickets.value.filter(t => t.status === 'open').length
          const inProgressCount = recentTickets.value.filter(t => t.status === 'answered').length

          stats.value.tickets.open = openCount
          stats.value.tickets.in_progress = inProgressCount
        }
      } else {
        // Pour les autres actions, recalculer approximativement
        const openCount = recentTickets.value.filter(t => t.status === 'open').length
        const inProgressCount = recentTickets.value.filter(t => t.status === 'answered').length

        stats.value.tickets.open = openCount
        stats.value.tickets.in_progress = inProgressCount

        logger.info('[DASHBOARD STORE] Statistiques tickets recalculées localement', {
          open: openCount,
          inProgress: inProgressCount,
          action
        })
      }
    }

    lastUpdate.value = new Date().toISOString()
    setTimeout(() => { isUpdating.value = false }, 1000)
  }

  const handleStatsUpdate = (event: DashboardRealtimeEvent) => {
    logger.info('[DASHBOARD STORE] Mise à jour statistiques reçue', { event })

    if (!event.data.stats) return

    isUpdating.value = true
    stats.value = event.data.stats
    lastUpdate.value = new Date().toISOString()
    setTimeout(() => { isUpdating.value = false }, 1000)
  }

  return {
    // État
    loading,
    error,
    stats,
    overview,
    recentServices,
    recentInvoices,
    recentTickets,
    unpaidInvoices,
    openTickets,

    // État temps réel
    realtimeInitialized,
    lastUpdate,
    isUpdating,

    // Computed
    hasData,
    totalServices,
    activeServices,
    totalUnpaidAmount,
    openTicketsCount,

    // Actions
    fetchStats,
    fetchOverview,
    fetchDashboardData,
    fetchRecentServices,
    fetchRecentInvoices,
    fetchRecentTickets,
    clearError,
    resetData,

    // Actions temps réel
    initRealtimeUpdates,
    stopRealtimeUpdates,
    handleServiceUpdate,
    handleInvoiceUpdate,
    handleTicketUpdate,
    handleStatsUpdate
  }
})