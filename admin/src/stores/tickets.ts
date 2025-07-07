import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/services/api'
import { Ticket, TicketMessage } from '@/types/ticket'
import logger from '@/services/logger'
import * as ablyService from '@/services/ably'
import { useNotificationStore } from './notifications'

export const useTicketStore = defineStore('tickets', () => {
  // État
  const tickets = ref<Ticket[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const realtimeInitialized = ref<boolean>(false)
  const currentTicket = ref<Ticket | null>(null)
  const lastEventTimestamp = ref<string | null>(null)
  // Pour stocker l'intégralité de l'événement temps réel (comme dans le store clients)
  const lastRealtimeEvent = ref<any | null>(null)

  // Getters
  const allTickets = computed<Ticket[]>(() => tickets.value)
  const openTickets = computed<Ticket[]>(() => tickets.value.filter(t => t.status === 'open'))
  const urgentTickets = computed<Ticket[]>(() => tickets.value.filter(t => t.priority === 'urgent'))
  const unassignedTickets = computed<Ticket[]>(() => tickets.value.filter(t => t.status !== 'assigned' && !('assigned_to' in t)))

  // Actions
  const fetchTickets = async (params = {}): Promise<Ticket[]> => {
    try {
      loading.value = true
      logger.debug('[TICKETS STORE] Récupération des tickets avec filtres', { params })
      const response = await ApiService.routes.admin.ticket.list(params)
      
      if (response.data && response.data.tickets) {
        tickets.value = response.data.tickets
      } else if (response.data && response.data.data && response.data.data.tickets) {
        tickets.value = response.data.data.tickets
      } else {
        tickets.value = []
      }
      
      logger.debug('[TICKETS STORE] Récupération terminée', { count: tickets.value.length })
      return tickets.value
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur inconnue lors de la récupération des tickets'
      error.value = errorMessage
      logger.error('[TICKETS STORE] Erreur lors de la récupération des tickets', { error: error.value })
      useNotificationStore().addNotification({
        message: errorMessage,
        type: 'error',
        title: 'Erreur'
      })
      return []
    } finally {
      loading.value = false
    }
  }

  const getTicket = async (id: number | string, page: number = 1, perPage: number = 7): Promise<Ticket | null> => {
    try {
      loading.value = true
      logger.debug(`[TICKETS STORE] Récupération du ticket #${id} (page ${page})`)
      const response = await ApiService.routes.admin.ticket.get(String(id), { page, per_page: perPage })

      if (response.data && response.data.ticket) {
        // Adapter à la nouvelle structure API avec pagination
        const ticket = response.data.ticket

        // Mapper les réponses pour assurer la compatibilité avec le template
        ticket.replies = (response.data.replies || []).map((reply: any) => ({
          ...reply,
          author_name: reply.user_name, // Mapper user_name vers author_name pour cohérence
          is_staff: reply.user_type === 'admin' // Ajouter is_staff pour le template
        }))

        ticket.pagination = response.data.pagination || null

        currentTicket.value = ticket
        return ticket
      }
      return null
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Erreur lors de la récupération du ticket #${id}`
      error.value = errorMessage
      logger.error(`[TICKETS STORE] Erreur lors de la récupération du ticket #${id}`, { error: error.value })
      useNotificationStore().addNotification({
        message: errorMessage,
        type: 'error',
        title: 'Erreur'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const createTicket = async (ticket: Partial<Ticket>): Promise<Ticket | null> => {
    try {
      loading.value = true
      logger.debug('[TICKETS STORE] Création d\'un nouveau ticket', { ticket })
      const response = await ApiService.routes.admin.ticket.create(ticket)
      
      if (response.data && response.data.ticket) {
        tickets.value.push(response.data.ticket)
        useNotificationStore().addNotification({
          message: 'Le ticket a été créé avec succès',
          type: 'success',
          title: 'Succès'
        })
        return response.data.ticket
      }
      return null
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création du ticket'
      error.value = errorMessage
      logger.error('[TICKETS STORE] Erreur lors de la création du ticket', { error: error.value, ticket })
      useNotificationStore().addNotification({
        message: errorMessage,
        type: 'error',
        title: 'Erreur'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const updateTicket = async (id: number | string, ticket: Partial<Ticket>): Promise<Ticket | null> => {
    try {
      loading.value = true
      logger.debug(`[TICKETS STORE] Mise à jour du ticket #${id}`, { ticket })
      const response = await ApiService.routes.admin.ticket.update(String(id), ticket)
      
      if (response.data && response.data.ticket) {
        const index = tickets.value.findIndex(t => t.id === id)
        if (index !== -1) {
          tickets.value[index] = response.data.ticket
        }
        
        // Mise à jour du ticket courant si c'est celui affiché
        if (currentTicket.value && currentTicket.value.id === id) {
          currentTicket.value = response.data.ticket
        }
        
        useNotificationStore().addNotification({
          message: 'Le ticket a été mis à jour avec succès',
          type: 'success',
          title: 'Succès'
        })
        return response.data.ticket
      }
      return null
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Erreur lors de la mise à jour du ticket #${id}`
      error.value = errorMessage
      logger.error(`[TICKETS STORE] Erreur lors de la mise à jour du ticket #${id}`, { error: error.value, ticket })
      useNotificationStore().addNotification({
        message: errorMessage,
        type: 'error',
        title: 'Erreur'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteTicket = async (id: number | string): Promise<boolean> => {
    try {
      loading.value = true
      logger.debug(`[TICKETS STORE] Suppression du ticket #${id}`)
      await ApiService.routes.admin.ticket.delete(String(id))
      
      // Supprimer le ticket de la liste locale
      tickets.value = tickets.value.filter(t => t.id !== id)
      
      // Réinitialiser le ticket courant si c'est celui supprimé
      if (currentTicket.value && currentTicket.value.id === id) {
        currentTicket.value = null
      }
      
      useNotificationStore().addNotification({
        message: 'Le ticket a été supprimé avec succès',
        type: 'success',
        title: 'Succès'
      })
      return true
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Erreur lors de la suppression du ticket #${id}`
      error.value = errorMessage
      logger.error(`[TICKETS STORE] Erreur lors de la suppression du ticket #${id}`, { error: error.value })
      useNotificationStore().addNotification({
        message: errorMessage,
        type: 'error',
        title: 'Erreur'
      })
      return false
    } finally {
      loading.value = false
    }
  }

  const addReply = async (ticketId: number | string, replyData: { message: string; user_id: number; user_type: string }): Promise<TicketMessage | null> => {
    try {
      loading.value = true

      // Logs de diagnostic détaillés
      logger.debug(`[TICKETS STORE] Préparation ajout réponse ticket #${ticketId}`, {
        ticketId,
        replyData,
        replyDataType: typeof replyData,
        replyDataKeys: Object.keys(replyData),
        messageLength: replyData.message?.length || 0
      })

      const response = await ApiService.routes.admin.ticket.addReply(String(ticketId), replyData)

      // Log de la réponse complète
      logger.debug(`[TICKETS STORE] Réponse API reçue`, {
        ticketId,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        hasData: !!response.data,
        hasReply: !!(response.data && response.data.reply),
        dataKeys: response.data ? Object.keys(response.data) : [],
        replyData: response.data?.reply || 'ABSENT'
      })

      if (response.data && response.data.reply) {
        // Ajouter immédiatement la réponse à la liste locale pour affichage instantané
        if (currentTicket.value) {
          // Initialiser replies si n'existe pas
          if (!currentTicket.value.replies) {
            currentTicket.value.replies = []
          }

          // Mapper la réponse pour assurer la compatibilité avec le template
          const mappedReply = {
            ...response.data.reply,
            author_name: response.data.reply.author_name || response.data.reply.user_name,
            is_staff: response.data.reply.user_type === 'admin'
          }
          // Utiliser unshift() car API retourne ORDER BY created_at DESC (plus récent en premier)
          currentTicket.value.replies.unshift(mappedReply)
          logger.info('[TICKETS STORE] Réponse ajoutée à la liste locale pour affichage immédiat (ordre DESC)', {
            ticketId,
            replyId: response.data.reply.id,
            totalReplies: currentTicket.value.replies.length,
            currentTicketStructure: Object.keys(currentTicket.value),
            insertionMethod: 'unshift (début de liste pour ordre DESC)'
          })
        } else {
          logger.warn('[TICKETS STORE] currentTicket.value est null, impossible d\'ajouter la réponse localement', {
            ticketId,
            hasCurrentTicket: !!currentTicket.value
          })
        }

        useNotificationStore().addNotification({
          message: 'Votre réponse a été ajoutée avec succès',
          type: 'success',
          title: 'Succès'
        })
        return response.data.reply
      } else {
        logger.warn('[TICKETS STORE] response.data.reply manquant dans la réponse API', {
          ticketId,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          fullResponse: response.data
        })
      }
      return null
    } catch (error: any) {
      // Logs de diagnostic détaillés pour l'erreur
      logger.error(`[TICKETS STORE] Erreur détaillée ajout réponse ticket #${ticketId}`, {
        ticketId,
        replyData,
        error: {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
            headers: error.config?.headers
          }
        }
      })

      const errorMessage = error.response?.data?.message || `Erreur lors de l'ajout d'une réponse au ticket #${ticketId}`
      error.value = errorMessage
      useNotificationStore().addNotification({
        message: errorMessage,
        type: 'error',
        title: 'Erreur'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const closeTicket = async (id: number | string): Promise<Ticket | null> => {
    try {
      loading.value = true
      logger.debug(`[TICKETS STORE] Fermeture du ticket #${id}`)
      const response = await ApiService.routes.admin.ticket.close(String(id))
      
      if (response.data && response.data.ticket) {
        const index = tickets.value.findIndex(t => t.id === id)
        if (index !== -1) {
          tickets.value[index] = response.data.ticket
        }
        
        // Mise à jour du ticket courant si c'est celui affiché
        if (currentTicket.value && currentTicket.value.id === id) {
          currentTicket.value = response.data.ticket
        }
        
        useNotificationStore().addNotification({
          message: 'Le ticket a été fermé avec succès',
          type: 'success',
          title: 'Succès'
        })
        return response.data.ticket
      }
      return null
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Erreur lors de la fermeture du ticket #${id}`
      error.value = errorMessage
      logger.error(`[TICKETS STORE] Erreur lors de la fermeture du ticket #${id}`, { error: error.value })
      useNotificationStore().addNotification({
        message: errorMessage,
        type: 'error',
        title: 'Erreur'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const reopenTicket = async (id: number | string): Promise<Ticket | null> => {
    try {
      loading.value = true
      logger.debug(`[TICKETS STORE] Réouverture du ticket #${id}`)
      const response = await ApiService.routes.admin.ticket.reopen(String(id))
      
      if (response.data && response.data.ticket) {
        const index = tickets.value.findIndex(t => t.id === id)
        if (index !== -1) {
          tickets.value[index] = response.data.ticket
        }
        
        // Mise à jour du ticket courant si c'est celui affiché
        if (currentTicket.value && currentTicket.value.id === id) {
          currentTicket.value = response.data.ticket
        }
        
        useNotificationStore().addNotification({
          message: 'Le ticket a été rouvert avec succès',
          type: 'success',
          title: 'Succès'
        })
        return response.data.ticket
      }
      return null
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Erreur lors de la réouverture du ticket #${id}`
      error.value = errorMessage
      logger.error(`[TICKETS STORE] Erreur lors de la réouverture du ticket #${id}`, { error: error.value })
      useNotificationStore().addNotification({
        message: errorMessage,
        type: 'error',
        title: 'Erreur'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Initialise l'écoute des événements temps réel pour les tickets
   */
  const initRealtimeListeners = () => {
    // Ne pas réinitialiser si déjà fait
    if (realtimeInitialized.value) {
      logger.debug('[TICKETS STORE] Écouteurs temps réel déjà initialisés')
      return
    }

    logger.info('[TICKETS STORE] Initialisation des écouteurs temps réel')
    
    try {
      // S'abonner uniquement au canal dédié aux tickets pour éviter la duplication
      // Les événements activity-update ont été fusionnés avec dashboard-update
      
      ablyService.subscribeToAdminChannel('ticket-update', (eventData) => {
        logger.debug('[TICKETS STORE] Événement ticket-update reçu', { action: eventData?.action })
        handleRealtimeTicketUpdate(eventData)
      })
      
      realtimeInitialized.value = true
      logger.info('[TICKETS STORE] Écouteurs temps réel initialisés avec succès')
    } catch (err) {
      logger.error('[TICKETS STORE] Erreur lors de l\'initialisation des écouteurs temps réel', { error: err })
    }
  }

  /**
   * Gère les événements temps réel pour les tickets
   */
  const handleRealtimeTicketUpdate = (eventData: any) => {
    try {
      // Vérification pour éviter les doublons d'événements
      if (lastEventTimestamp.value === eventData.timestamp) {
        logger.debug('[TICKETS STORE] Événement déjà traité, ignoré', { timestamp: eventData.timestamp })
        return
      }
      
      lastEventTimestamp.value = eventData.timestamp
      // Stocker l'événement complet pour permettre au watcher de la vue de l'utiliser
      // IMPORTANT: Utiliser une nouvelle référence d'objet avec spread operator pour garantir la réactivité Vue
      lastRealtimeEvent.value = { ...eventData }
      
      const ticketData = eventData.ticket
      
      if (!ticketData || !ticketData.id) {
        logger.error('[TICKETS STORE] Données de ticket invalides dans l\'event temps réel', { eventData })
        return
      }
      
      logger.info('[TICKETS STORE] Événement reçu pour le ticket', { 
        ticketId: ticketData.id, 
        action: eventData.action 
      })
      
      switch (eventData.action) {
        case 'create':
          handleTicketCreate(ticketData)
          break
        case 'update':
          handleTicketUpdate(ticketData)
          break
        case 'delete':
          handleTicketDelete(ticketData)
          break
        default:
          logger.warn('[TICKETS STORE] Action temps réel inconnue', { action: eventData.action })
      }
    } catch (error) {
      logger.error('[TICKETS STORE] Erreur lors du traitement de l\'event temps réel', { error })
    }
  }
  
  /**
   * Gère la création d'un nouveau ticket en temps réel
   */
  const handleTicketCreate = (ticketData: Ticket) => {
    try {
      logger.info('[TICKETS STORE] Ajout d\'un nouveau ticket via temps réel', { ticketId: ticketData.id })
      
      // Vérifier si le ticket existe déjà dans la liste
      const existingIndex = tickets.value.findIndex(t => t.id === ticketData.id)
      if (existingIndex === -1) {
        tickets.value.unshift(ticketData) // Ajouter au début de la liste
        logger.debug('[TICKETS STORE] Ticket ajouté avec succès à la liste')
      } else {
        logger.debug('[TICKETS STORE] Le ticket existe déjà dans la liste, mise à jour appliquée')
        tickets.value[existingIndex] = ticketData
      }
    } catch (error) {
      logger.error('[TICKETS STORE] Erreur lors du traitement de la création de ticket en temps réel', { error })
    }
  }
  
  /**
   * Gère la mise à jour d'un ticket en temps réel
   */
  const handleTicketUpdate = (ticketData: Ticket) => {
    try {
      logger.info('[TICKETS STORE] Mise à jour d\'un ticket via temps réel', { ticketId: ticketData.id })
      
      // Mise à jour dans la liste des tickets
      const index = tickets.value.findIndex(t => t.id === ticketData.id)
      if (index !== -1) {
        tickets.value[index] = ticketData
        logger.debug('[TICKETS STORE] Ticket mis à jour dans la liste')
      }
      
      // Mise à jour du ticket courant si c'est celui affiché
      if (currentTicket.value && currentTicket.value.id === ticketData.id) {
        // Mise à jour directe de la référence reactive
        currentTicket.value = { ...ticketData }
        logger.debug('[TICKETS STORE] Ticket courant mis à jour avec une nouvelle référence')
      }
    } catch (error) {
      logger.error('[TICKETS STORE] Erreur lors du traitement de la mise à jour de ticket en temps réel', { error })
    }
  }
  
  /**
   * Gère la suppression d'un ticket en temps réel
   */
  const handleTicketDelete = (ticketData: Ticket) => {
    try {
      logger.info('[TICKETS STORE] Suppression d\'un ticket via temps réel', { ticketId: ticketData.id })
      
      // Supprimer de la liste des tickets
      tickets.value = tickets.value.filter(t => t.id !== ticketData.id)
      logger.debug('[TICKETS STORE] Ticket supprimé de la liste')
      
      // Réinitialiser le ticket courant s'il s'agit du ticket supprimé
      if (currentTicket.value && currentTicket.value.id === ticketData.id) {
        currentTicket.value = null
        logger.debug('[TICKETS STORE] Ticket courant réinitialisé car supprimé')
      }
    } catch (error) {
      logger.error('[TICKETS STORE] Erreur lors du traitement de la suppression de ticket en temps réel', { error })
    }
  }

  return {
    // État
    tickets,
    loading,
    error,
    realtimeInitialized,
    currentTicket,
    lastEventTimestamp,
    lastRealtimeEvent,
    
    // Getters
    allTickets,
    openTickets,
    urgentTickets,
    unassignedTickets,
    
    // Actions
    fetchTickets,
    getTicket,
    createTicket,
    updateTicket,
    deleteTicket,
    addReply,
    closeTicket,
    reopenTicket,
    
    // Temps réel
    initRealtimeListeners,
    handleRealtimeTicketUpdate,
    handleTicketCreate,
    handleTicketUpdate,
    handleTicketDelete
  }
})
