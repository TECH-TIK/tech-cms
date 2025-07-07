import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/services/api'
import * as ablyService from '@/services/ably'
import logger from '@/services/logger'
import { useAuthStore } from '@/stores/auth'
import type {
  RealtimeEvent,
  DashboardRealtimeEvent,
  DashboardNotification
} from '@/types/realtime'

export interface RealtimeAuthor {
  id: number
  name: string
  type: 'admin' | 'client'
}

export const useRealtimeStore = defineStore('realtime', () => {
  // État
  const initialized = ref(false)
  const connected = ref(false)
  const error = ref<Error | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = ref(5)
  const lastRealtimeEvent = ref<RealtimeEvent | null>(null)
  const lastEventTimestamp = ref<string | null>(null)

  // État dashboard temps réel
  const lastDashboardEvent = ref<DashboardRealtimeEvent | null>(null)
  const dashboardEventHandlers = ref<Map<string, Function>>(new Map())
  const dashboardChannel = ref<any>(null)
  const notifications = ref<DashboardNotification[]>([])
  const unreadNotificationsCount = ref(0)

  // Computed
  const hasError = computed(() => error.value !== null)
  const canReconnect = computed(() => reconnectAttempts.value < maxReconnectAttempts.value)
  const isReady = computed(() => initialized.value && connected.value && !hasError.value)
  const hasUnreadNotifications = computed(() => unreadNotificationsCount.value > 0)
  const isDashboardConnected = computed(() => !!dashboardChannel.value)

  // Méthodes
  const init = async () => {
    try {
      logger.info('[REALTIME STORE CLIENT] Initialisation du service temps réel')
      
      // Vérifier l'authentification
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        throw new Error('Utilisateur non authentifié')
      }

      // Obtenir le token Ably
      logger.debug('[REALTIME STORE CLIENT] Récupération du token Ably')
      const response = await ApiService.routes.realtime.getToken()
      const token = response.data?.token
      
      if (!token) {
        throw new Error('Token Ably non trouvé dans la réponse')
      }

      // Initialiser Ably avec le token
      logger.debug('[REALTIME STORE CLIENT] Initialisation d\'Ably avec le token')
      await ablyService.initAbly(token)
      
      // Configurer les écouteurs d'état de la connexion
      setupConnectionListeners()
      
      initialized.value = true
      connected.value = true
      reconnectAttempts.value = 0
      error.value = null
      logger.info('[REALTIME STORE CLIENT] Service de temps réel initialisé avec succès')
      
    } catch (err) {
      logger.error('[REALTIME STORE CLIENT] Erreur lors de l\'initialisation', { error: err })
      error.value = err as Error
      initialized.value = false
      connected.value = false
    }
  }

  const setupConnectionListeners = () => {
    const client = ablyService.getClient()
    if (!client) return

    client.connection.on('connected', () => {
      logger.info('[REALTIME STORE CLIENT] Connexion établie')
      connected.value = true
      error.value = null
      reconnectAttempts.value = 0
    })

    client.connection.on('disconnected', () => {
      logger.warn('[REALTIME STORE CLIENT] Connexion perdue')
      connected.value = false
    })

    client.connection.on('failed', (stateChange: any) => {
      logger.error('[REALTIME STORE CLIENT] Échec de connexion', { reason: stateChange.reason })
      connected.value = false
      error.value = new Error(stateChange.reason?.message || 'Connexion échouée')
    })

    client.connection.on('suspended', () => {
      logger.warn('[REALTIME STORE CLIENT] Connexion suspendue')
      connected.value = false
    })
  }

  const subscribeToTicket = (ticketId: number | string) => {
    if (!isReady.value) {
      logger.warn('[REALTIME STORE CLIENT] Service non prêt pour abonnement ticket', { ticketId })
      return () => {}
    }

    logger.info('[REALTIME STORE CLIENT] Abonnement aux événements du ticket', { ticketId })

    // S'abonner aux événements du ticket
    const unsubscribeReply = ablyService.subscribeToTicketChannel(ticketId, 'ticket-reply', (data) => {
      handleTicketReply(data)
    })

    const unsubscribeStatusChange = ablyService.subscribeToTicketChannel(ticketId, 'ticket-status-change', (data) => {
      handleTicketStatusChange(data)
    })

    const unsubscribeUpdate = ablyService.subscribeToTicketChannel(ticketId, 'ticket-update', (data) => {
      handleTicketUpdate(data)
    })

    // Retourner fonction de désabonnement
    return () => {
      logger.info('[REALTIME STORE CLIENT] Désabonnement des événements du ticket', { ticketId })
      unsubscribeReply()
      unsubscribeStatusChange()
      unsubscribeUpdate()
    }
  }

  const handleTicketReply = (data: any) => {
    logger.info('[REALTIME STORE CLIENT] Nouvelle réponse reçue', { data })
    
    // Vérifier les doublons
    if (isEventDuplicate(data.timestamp)) {
      logger.debug('[REALTIME STORE CLIENT] Événement dupliqué ignoré', { timestamp: data.timestamp })
      return
    }

    const event: RealtimeEvent = {
      action: 'reply',
      ticket: data.ticket,
      timestamp: data.timestamp,
      author: data.author,
      data: data.reply
    }

    lastRealtimeEvent.value = event
    lastEventTimestamp.value = data.timestamp
  }

  const handleTicketStatusChange = (data: any) => {
    logger.info('[REALTIME STORE CLIENT] Changement de statut reçu', { data })
    
    if (isEventDuplicate(data.timestamp)) {
      logger.debug('[REALTIME STORE CLIENT] Événement dupliqué ignoré', { timestamp: data.timestamp })
      return
    }

    const event: RealtimeEvent = {
      action: 'status_change',
      ticket: data.ticket,
      timestamp: data.timestamp,
      author: data.author,
      data: { oldStatus: data.oldStatus, newStatus: data.newStatus }
    }

    lastRealtimeEvent.value = event
    lastEventTimestamp.value = data.timestamp
  }

  const handleTicketUpdate = (data: any) => {
    logger.info('[REALTIME STORE CLIENT] Mise à jour ticket reçue', { data })
    
    if (isEventDuplicate(data.timestamp)) {
      logger.debug('[REALTIME STORE CLIENT] Événement dupliqué ignoré', { timestamp: data.timestamp })
      return
    }

    const event: RealtimeEvent = {
      action: 'update',
      ticket: data.ticket,
      timestamp: data.timestamp,
      author: data.author,
      data: data.changes
    }

    lastRealtimeEvent.value = event
    lastEventTimestamp.value = data.timestamp
  }

  const isEventDuplicate = (timestamp: string): boolean => {
    return lastEventTimestamp.value === timestamp
  }

  const disconnect = () => {
    logger.info('[REALTIME STORE CLIENT] Déconnexion du service temps réel')
    ablyService.disconnect()
    initialized.value = false
    connected.value = false
    error.value = null
    lastRealtimeEvent.value = null
    lastEventTimestamp.value = null
  }

  const retry = async () => {
    if (!canReconnect.value) {
      logger.warn('[REALTIME STORE CLIENT] Nombre maximum de tentatives de reconnexion atteint')
      return
    }

    reconnectAttempts.value++
    logger.info('[REALTIME STORE CLIENT] Tentative de reconnexion', { attempt: reconnectAttempts.value })
    
    try {
      await init()
    } catch (err) {
      logger.error('[REALTIME STORE CLIENT] Échec de la reconnexion', { error: err })
    }
  }

  // Méthodes dashboard temps réel - Architecture optimisée
  const subscribeToDashboardEvents = async (clientId: number) => {
    try {
      if (!isReady.value) {
        throw new Error('Service temps réel non initialisé')
      }

      // Éviter les abonnements multiples
      if (dashboardChannel.value) {
        logger.warn('[REALTIME STORE] Abonnement dashboard déjà actif', { clientId })
        return
      }

      // Utiliser le canal privé client standard avec préfixe domaine
      logger.info('[REALTIME STORE] Abonnement aux événements dashboard sur canal privé client', {
        clientId
      })

      // S'abonner au canal privé client avec les événements dashboard
      const unsubscribeDashboard = ablyService.subscribeToClientPrivateChannel(clientId, 'dashboard-update', (data) => {
        logger.info('[REALTIME STORE] Événement dashboard-update reçu', {
          event: data,
          clientId
        })

        const event: DashboardRealtimeEvent = data
        lastDashboardEvent.value = event

        // Appeler les handlers enregistrés
        const handler = dashboardEventHandlers.value.get(event.entity_type)
        if (handler) {
          handler(event)
        }

        // Gérer les notifications
        if (event.action === 'notification' && event.data.notification) {
          addNotification(event.data.notification)
        }
      })

      // S'abonner aux événements spécifiques par type d'entité
      logger.info('[REALTIME STORE] Abonnement à service-update sur canal private-client-' + clientId)
      const unsubscribeService = ablyService.subscribeToClientPrivateChannel(clientId, 'service-update', (data) => {
        logger.info('[REALTIME STORE] 🎯 ÉVÉNEMENT SERVICE-UPDATE REÇU !', { data, clientId, timestamp: new Date().toISOString() })

        // Normaliser la structure de l'événement pour le dashboard
        const normalizedEvent = {
          entity_type: 'service',
          action: data.action || data.type,
          data: {
            service: data.data?.service || data.service || data
          },
          timestamp: data.timestamp || new Date().toISOString()
        }

        logger.info('[REALTIME STORE] Événement service normalisé', { normalizedEvent })

        // Envoyer l'événement au handler dashboard
        const dashboardHandler = dashboardEventHandlers.value.get('service')
        if (dashboardHandler) {
          dashboardHandler(normalizedEvent)
        }

        // Envoyer l'événement au handler de la page Services
        const pageHandler = dashboardEventHandlers.value.get('service-page')
        if (pageHandler) {
          pageHandler(normalizedEvent)
        }

        // 🎯 NOUVEAU : Envoyer l'événement au handler de la page détail service
        const serviceDetailId = data.data?.service?.id || data.service?.id
        if (serviceDetailId) {
          const detailHandlerKey = `service-detail-${serviceDetailId}`
          const detailHandler = dashboardEventHandlers.value.get(detailHandlerKey)
          if (detailHandler) {
            logger.info('[REALTIME STORE] 📤 ENVOI VERS SERVICE DETAIL HANDLER:', {
              handler_key: detailHandlerKey,
              handler_exists: true,
              data_sent: normalizedEvent,
              service_id: serviceDetailId
            })
            detailHandler(normalizedEvent)
          } else {
            logger.info('[REALTIME STORE] ℹ️ SERVICE DETAIL HANDLER NON TROUVÉ (normal si pas sur page détail):', {
              handler_key: detailHandlerKey,
              service_id: serviceDetailId
            })
          }
        }
      })

      logger.info('[REALTIME STORE] Abonnement à invoice-update sur canal private-client-' + clientId)
      const unsubscribeInvoice = ablyService.subscribeToClientPrivateChannel(clientId, 'invoice-update', (data) => {
        logger.info('[REALTIME STORE] 🎯 ÉVÉNEMENT INVOICE-UPDATE REÇU !', { data, clientId, timestamp: new Date().toISOString() })

        // 🔍 LOGS DIAGNOSTIC DÉTAILLÉS - STRUCTURE DONNÉES
        logger.info('[REALTIME STORE] 📊 ANALYSE STRUCTURE DONNÉES INVOICE:', {
          'data_keys': Object.keys(data),
          'data.action': data.action,
          'data.entity_type': data.entity_type,
          'data.data_exists': !!data.data,
          'data.data_keys': data.data ? Object.keys(data.data) : null,
          'data.invoice_exists': !!data.invoice,
          'data.data.invoice_exists': data.data ? !!data.data.invoice : null,
          'structure_complete': JSON.stringify(data, null, 2)
        })

        // Envoyer l'événement au handler dashboard
        const dashboardHandler = dashboardEventHandlers.value.get('invoice')
        if (dashboardHandler) {
          logger.info('[REALTIME STORE] 📤 ENVOI VERS DASHBOARD HANDLER:', {
            handler_exists: true,
            data_sent: data
          })
          dashboardHandler(data)
        } else {
          logger.warn('[REALTIME STORE] ❌ DASHBOARD HANDLER INTROUVABLE pour invoice')
        }

        // Envoyer l'événement au handler de la page Facturation
        const pageHandler = dashboardEventHandlers.value.get('invoice-page')
        if (pageHandler) {
          logger.info('[REALTIME STORE] 📤 ENVOI VERS PAGE HANDLER:', {
            handler_exists: true,
            data_sent: data
          })
          pageHandler(data)
        } else {
          logger.warn('[REALTIME STORE] ❌ PAGE HANDLER INTROUVABLE pour invoice-page')
        }

        // 🎯 NOUVEAU : Envoyer l'événement au handler de la page détail facture
        const invoiceDetailId = data.data?.invoice?.id || data.invoice?.id
        if (invoiceDetailId) {
          const detailHandlerKey = `invoice-detail-${invoiceDetailId}`
          const detailHandler = dashboardEventHandlers.value.get(detailHandlerKey)
          if (detailHandler) {
            // Normaliser les données pour le handler détail (même structure que services)
            const normalizedEventForDetail = {
              entity_type: 'invoice',
              action: data.action || data.type,
              data: {
                invoice: data.data?.invoice || data.invoice || data
              },
              timestamp: data.timestamp || new Date().toISOString()
            }

            logger.info('[REALTIME STORE] 📤 ENVOI VERS DETAIL HANDLER:', {
              handler_key: detailHandlerKey,
              handler_exists: true,
              data_sent: normalizedEventForDetail,
              invoice_id: invoiceDetailId
            })
            detailHandler(normalizedEventForDetail)
          } else {
            logger.info('[REALTIME STORE] ℹ️ DETAIL HANDLER NON TROUVÉ (normal si pas sur page détail):', {
              handler_key: detailHandlerKey,
              invoice_id: invoiceDetailId
            })
          }
        }

        // 🎯 NOUVEAU : Envoyer l'événement au handler de la page détail facture
        const invoiceId = data.data?.invoice?.id || data.invoice?.id
        if (invoiceId) {
          const detailHandlerKey = `invoice-detail-${invoiceId}`
          const detailHandler = dashboardEventHandlers.value.get(detailHandlerKey)
          if (detailHandler) {
            logger.info('[REALTIME STORE] 📤 ENVOI VERS DETAIL HANDLER:', {
              handler_key: detailHandlerKey,
              handler_exists: true,
              data_sent: data,
              invoice_id: invoiceId
            })
            detailHandler(data)
          } else {
            logger.info('[REALTIME STORE] ℹ️ DETAIL HANDLER NON TROUVÉ (normal si pas sur page détail):', {
              handler_key: detailHandlerKey,
              invoice_id: invoiceId
            })
          }
        }
      })

      const unsubscribeTicket = ablyService.subscribeToClientPrivateChannel(clientId, 'ticket-update', (data) => {
        logger.info('[REALTIME STORE] Événement ticket-update reçu', { data, clientId })

        // Envoyer l'événement au handler dashboard
        const dashboardHandler = dashboardEventHandlers.value.get('ticket')
        if (dashboardHandler) {
          dashboardHandler(data)
        }

        // Envoyer l'événement au handler de la page Support
        const pageHandler = dashboardEventHandlers.value.get('ticket-page')
        if (pageHandler) {
          logger.info('[REALTIME STORE] 📤 ENVOI VERS TICKET PAGE HANDLER:', {
            handler_exists: true,
            data_sent: data
          })
          pageHandler(data)
        } else {
          logger.info('[REALTIME STORE] ℹ️ TICKET PAGE HANDLER NON TROUVÉ (normal si pas sur page support)')
        }
      })

      const unsubscribeStats = ablyService.subscribeToClientPrivateChannel(clientId, 'stats-update', (data) => {
        logger.info('[REALTIME STORE] Événement stats-update reçu', { data, clientId })
        const handler = dashboardEventHandlers.value.get('stats')
        if (handler) {
          handler(data)
        }
      })

      // Stocker les fonctions de désabonnement
      dashboardChannel.value = {
        unsubscribe: () => {
          unsubscribeDashboard()
          unsubscribeService()
          unsubscribeInvoice()
          unsubscribeTicket()
          unsubscribeStats()
        }
      }

      logger.info('[REALTIME STORE] Abonnement dashboard établi avec succès sur canal privé client', { clientId })

    } catch (err: any) {
      logger.error('[REALTIME STORE] Erreur lors de l\'abonnement dashboard', {
        error: err.message,
        clientId
      })
      throw err
    }
  }

  const unsubscribeFromDashboardEvents = () => {
    if (dashboardChannel.value) {
      logger.info('[REALTIME STORE] Désabonnement des événements dashboard')
      dashboardChannel.value.unsubscribe()
      dashboardChannel.value = null
      dashboardEventHandlers.value.clear()
    }
  }

  const registerDashboardHandler = (entityType: string, handler: Function) => {
    logger.debug('[REALTIME STORE] Enregistrement handler dashboard', { entityType })
    dashboardEventHandlers.value.set(entityType, handler)
  }

  const unregisterDashboardHandler = (entityType: string) => {
    logger.debug('[REALTIME STORE] Suppression handler dashboard', { entityType })
    dashboardEventHandlers.value.delete(entityType)
  }

  // Gestion des notifications
  const addNotification = (notification: DashboardNotification) => {
    logger.info('[REALTIME STORE] Nouvelle notification', { notification })
    notifications.value.unshift(notification)

    if (!notification.read) {
      unreadNotificationsCount.value++
    }

    // Limiter à 50 notifications max
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }
  }

  const markNotificationAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      unreadNotificationsCount.value = Math.max(0, unreadNotificationsCount.value - 1)
      logger.debug('[REALTIME STORE] Notification marquée comme lue', { notificationId })
    }
  }

  const markAllNotificationsAsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true
    })
    unreadNotificationsCount.value = 0
    logger.info('[REALTIME STORE] Toutes les notifications marquées comme lues')
  }

  const clearNotifications = () => {
    notifications.value = []
    unreadNotificationsCount.value = 0
    logger.info('[REALTIME STORE] Notifications effacées')
  }

  return {
    // État
    initialized,
    connected,
    error,
    reconnectAttempts,
    maxReconnectAttempts,
    lastRealtimeEvent,
    lastEventTimestamp,

    // État dashboard
    lastDashboardEvent,
    dashboardEventHandlers,
    dashboardChannel,
    notifications,
    unreadNotificationsCount,

    // Computed
    hasError,
    canReconnect,
    isReady,
    hasUnreadNotifications,
    isDashboardConnected,

    // Méthodes
    init,
    disconnect,
    retry,
    subscribeToTicket,

    // Méthodes dashboard
    subscribeToDashboardEvents,
    unsubscribeFromDashboardEvents,
    registerDashboardHandler,
    unregisterDashboardHandler,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications
  }
})
