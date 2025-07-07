/**
 * Store Pinia pour les tickets côté client
 * 
 * Gère l'état et les actions pour les tickets de support client
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/services/api'
import type { DashboardRealtimeEvent } from '@/types/realtime'
import logger from '@/services/logger'

// Type pour un ticket côté client
export interface Ticket {
  id: number
  title: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department_name?: string
  created_at: string
  updated_at: string
  last_reply_at?: string
  client_id: number
}

export const useTicketsStore = defineStore('tickets', () => {
  // État
  const tickets = ref<Ticket[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<string | null>(null)
  const isUpdating = ref(false)

  // Getters
  const getTicketById = computed(() => (id: number) => {
    return tickets.value.find(ticket => ticket.id === id) || null
  })

  const getTicketsByStatus = computed(() => (status: string) => {
    return tickets.value.filter(ticket => ticket.status === status)
  })

  const openTickets = computed(() => 
    tickets.value.filter(ticket => ticket.status === 'open')
  )

  const inProgressTickets = computed(() => 
    tickets.value.filter(ticket => ticket.status === 'in-progress')
  )

  const resolvedTickets = computed(() => 
    tickets.value.filter(ticket => ticket.status === 'resolved')
  )

  const closedTickets = computed(() => 
    tickets.value.filter(ticket => ticket.status === 'closed')
  )

  // Actions
  const fetchTickets = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.routes.client.ticket.list()

      // Convertir les IDs en number pour harmoniser avec les événements temps réel
      tickets.value = response.data.map((ticket: any) => ({
        ...ticket,
        id: parseInt(String(ticket.id)),
        client_id: parseInt(String(ticket.client_id)),
        title: ticket.subject || ticket.title // Harmoniser le nom du champ
      }))

      lastUpdate.value = new Date().toISOString()

      logger.info('[TICKETS STORE] Tickets chargés avec conversion IDs', {
        count: tickets.value.length,
        ticketIds: tickets.value.map(t => ({ id: t.id, title: t.title })),
        open: openTickets.value.length,
        inProgress: inProgressTickets.value.length,
        resolved: resolvedTickets.value.length,
        closed: closedTickets.value.length
      })

      return tickets.value
    } catch (err: any) {
      logger.error('[TICKETS STORE] Erreur lors du chargement des tickets', { error: err })
      error.value = err.response?.data?.message || 'Erreur lors du chargement des tickets'
      throw err
    } finally {
      loading.value = false
    }
  }

  const refreshTickets = async () => {
    logger.info('[TICKETS STORE] Actualisation des tickets')
    return await fetchTickets()
  }

  // Handler pour les mises à jour temps réel
  const handleTicketUpdate = async (event: DashboardRealtimeEvent) => {
    logger.info('[TICKETS STORE] Mise à jour ticket reçue', { event })

    if (!event.data.ticket) {
      logger.error('[TICKETS STORE] ❌ AUCUNE DONNÉE TICKET TROUVÉE dans event.data.ticket')
      return
    }

    // Mise à jour instantanée sans indicateur de chargement
    const rawTicket: any = event.data.ticket
    const action = event.action || event.data.action

    logger.info('[TICKETS STORE] Traitement événement ticket', {
      action,
      ticketId: rawTicket.id,
      ticketTitle: rawTicket.title || rawTicket.subject,
      currentTicketsCount: tickets.value.length
    })

    // Convertir les données brutes en format Ticket
    const ticket: Ticket = {
      id: parseInt(String(rawTicket.id)),
      title: rawTicket.subject || rawTicket.title, // subject est le champ principal
      status: rawTicket.status,
      priority: rawTicket.priority,
      department_name: rawTicket.department_name,
      created_at: rawTicket.created_at,
      updated_at: rawTicket.updated_at,
      last_reply_at: rawTicket.last_reply_at,
      client_id: parseInt(String(rawTicket.client_id))
    }

    logger.info('[TICKETS STORE] Ticket converti', {
      originalId: rawTicket.id,
      convertedId: ticket.id,
      title: ticket.title,
      status: ticket.status
    })

    // Gérer les différentes actions
    switch (action) {
      case 'ticket_create':
      case 'create':
      case 'created':
        // Ajouter le nouveau ticket au début de la liste
        const existingIndex = tickets.value.findIndex(t => t.id === ticket.id)
        if (existingIndex === -1) {
          tickets.value.unshift(ticket)
          logger.info('[TICKETS STORE] Nouveau ticket ajouté', {
            ticketId: ticket.id,
            ticketTitle: ticket.title
          })
        }
        break

      case 'ticket_update':
      case 'update':
      case 'updated':
        // Mettre à jour le ticket existant
        logger.info('[TICKETS STORE] Recherche ticket à mettre à jour', {
          searchId: ticket.id,
          currentTickets: tickets.value.map(t => ({ id: t.id, title: t.title }))
        })

        const updateIndex = tickets.value.findIndex(t => t.id === ticket.id)
        if (updateIndex !== -1) {
          const oldTicket = { ...tickets.value[updateIndex] }
          tickets.value[updateIndex] = { ...tickets.value[updateIndex], ...ticket }
          logger.info('[TICKETS STORE] ✅ Ticket mis à jour avec succès', {
            ticketId: ticket.id,
            oldTitle: oldTicket.title,
            newTitle: tickets.value[updateIndex].title,
            oldStatus: oldTicket.status,
            newStatus: tickets.value[updateIndex].status,
            updateIndex
          })
        } else {
          logger.error('[TICKETS STORE] ❌ Ticket non trouvé pour mise à jour', {
            searchId: ticket.id,
            availableIds: tickets.value.map(t => t.id)
          })
        }
        break

      case 'ticket_delete':
      case 'delete':
      case 'deleted':
        // Supprimer le ticket de la liste
        const deleteIndex = tickets.value.findIndex(t => t.id === ticket.id)
        if (deleteIndex !== -1) {
          tickets.value.splice(deleteIndex, 1)
          logger.info('[TICKETS STORE] Ticket supprimé', {
            ticketId: ticket.id,
            ticketTitle: ticket.title
          })
        }
        break

      default:
        logger.warn('[TICKETS STORE] Action non reconnue', { action })
    }

    lastUpdate.value = new Date().toISOString()

    // Mise à jour instantanée terminée - pas de timeout artificiel
  }

  return {
    // État
    tickets,
    loading,
    error,
    lastUpdate,
    isUpdating,
    
    // Getters
    getTicketById,
    getTicketsByStatus,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    
    // Actions
    fetchTickets,
    refreshTickets,
    handleTicketUpdate
  }
})
