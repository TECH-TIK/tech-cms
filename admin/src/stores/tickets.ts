import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
// import { useAbly } from '@/services/ably'

export const useTicketStore = defineStore('tickets', () => {
  // État
  const tickets = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const allTickets = computed(() => tickets.value)
  const openTickets = computed(() => tickets.value.filter(t => t.status === 'open'))
  const urgentTickets = computed(() => tickets.value.filter(t => t.priority === 'urgent'))
  const unassignedTickets = computed(() => tickets.value.filter(t => !t.assignedTo))

  // Actions
  const fetchTickets = async () => {
    try {
      loading.value = true
      const response = await axios.get('/api/v1/tickets')
      tickets.value = response.data.tickets
      return response.data.tickets
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const getTicket = async (id) => {
    try {
      loading.value = true
      const response = await axios.get(`/api/v1/tickets/${id}`)
      return response.data.ticket
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTicket = async (ticket) => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/tickets', ticket)
      tickets.value.push(response.data.ticket)
      return response.data.ticket
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTicket = async (ticket) => {
    try {
      loading.value = true
      const response = await axios.put(`/api/v1/tickets/${ticket.id}`, ticket)
      const index = tickets.value.findIndex(t => t.id === ticket.id)
      if (index !== -1) {
        tickets.value[index] = response.data.ticket
      }
      return response.data.ticket
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTicket = async (id) => {
    try {
      loading.value = true
      await axios.delete(`/api/v1/tickets/${id}`)
      tickets.value = tickets.value.filter(t => t.id !== id)
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const addReply = async (ticketId, message) => {
    try {
      loading.value = true
      const response = await axios.post(`/api/v1/tickets/${ticketId}/replies`, message)
      return response.data.ticket
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const closeTicket = async (id) => {
    try {
      loading.value = true
      const response = await axios.post(`/api/v1/tickets/${id}/close`)
      const index = tickets.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tickets.value[index] = response.data.ticket
      }
      return response.data.ticket
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const reopenTicket = async (id) => {
    try {
      loading.value = true
      const response = await axios.post(`/api/v1/tickets/${id}/reopen`)
      const index = tickets.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tickets.value[index] = response.data.ticket
      }
      return response.data.ticket
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  // Temps réel - Désactivé pour le moment
  // const { channel } = useAbly()
  
  // channel.subscribe('ticket.created', (message) => {
  //   tickets.value.push(message.data)
  // })

  // channel.subscribe('ticket.updated', (message) => {
  //   const index = tickets.value.findIndex(t => t.id === message.data.id)
  //   if (index !== -1) {
  //     tickets.value[index] = message.data
  //   }
  // })

  // channel.subscribe('ticket.deleted', (message) => {
  //   tickets.value = tickets.value.filter(t => t.id !== message.data.id)
  // })

  // channel.subscribe('ticket.reply.added', (message) => {
  //   // Mise à jour du ticket avec la nouvelle réponse si le ticket est déjà chargé
  //   const index = tickets.value.findIndex(t => t.id === message.data.ticket_id)
  //   if (index !== -1) {
  //     getTicket(message.data.ticket_id).then(ticket => {
  //       tickets.value[index] = ticket
  //     })
  //   }
  // })

  return {
    // État
    tickets,
    loading,
    error,
    
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
    reopenTicket
  }
})
