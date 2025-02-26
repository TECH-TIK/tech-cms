<template>
  <div class="tickets-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ $t('tickets.title') }}</h1>
        <span class="page-description">{{ $t('tickets.description') }}</span>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i> {{ $t('tickets.actions.add') }}
      </button>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ $t('tickets.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="filter-input" 
              :placeholder="$t('tickets.search.placeholder')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('tickets.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-ticket-alt"></i>
            <select v-model="currentStatusFilter" class="filter-input">
              <option v-for="status in statusFilters" :key="status.value" :value="status.value">
                {{ status.label }} ({{ getFilteredTicketsCount(status.value) }})
              </option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('tickets.filters.priority') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-flag"></i>
            <select v-model="priorityFilter" class="filter-input">
              <option value="">{{ $t('tickets.priority.all') }}</option>
              <option value="low">{{ $t('tickets.priority.low') }}</option>
              <option value="medium">{{ $t('tickets.priority.medium') }}</option>
              <option value="high">{{ $t('tickets.priority.high') }}</option>
              <option value="urgent">{{ $t('tickets.priority.urgent') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">&nbsp;</label>
          <div class="filter-input-wrapper">
            <button @click="applyFilters" class="btn btn-gradient filter-button">
              <i class="fas fa-filter"></i>
              {{ $t('tickets.filters.apply') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-box">
      <table v-if="!loading && filteredTickets.length > 0" class="tickets-table">
        <thead>
          <tr>
            <th>{{ $t('tickets.table.id') }}</th>
            <th>{{ $t('tickets.table.subject') }}</th>
            <th>{{ $t('tickets.table.client') }}</th>
            <th>{{ $t('tickets.table.priority') }}</th>
            <th>{{ $t('tickets.table.status') }}</th>
            <th>{{ $t('tickets.table.lastReply') }}</th>
            <th>{{ $t('tickets.table.createdAt') }}</th>
            <th>{{ $t('tickets.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ticket in filteredTickets" :key="ticket.id">
            <td>#{{ ticket.id }}</td>
            <td class="subject-cell">{{ ticket.subject }}</td>
            <td>{{ ticket.client_name }}</td>
            <td>
              <span :class="['priority-badge', getPriorityClass(ticket.priority)]">
                {{ getPriorityLabel(ticket.priority) }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(ticket.status)]">
                {{ getStatusLabel(ticket.status) }}
              </span>
            </td>
            <td>{{ formatDate(ticket.last_reply) }}</td>
            <td>{{ formatDate(ticket.created_at) }}</td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-info" @click="openViewModal(ticket)">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-primary" @click="openEditModal(ticket)">
                <i class="fas fa-edit"></i>
              </button>
              
              <template v-if="ticket.status === 'closed' || ticket.status === 'resolved'">
                <button class="btn btn-sm btn-success" @click="handleReopen(ticket)">
                  <i class="fas fa-redo"></i>
                </button>
              </template>
              
              <template v-else>
                <button class="btn btn-sm btn-warning" @click="handleClose(ticket)">
                  <i class="fas fa-check"></i>
                </button>
              </template>
              
              <button class="btn btn-sm btn-danger" @click="confirmDelete(ticket)">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="!loading && filteredTickets.length === 0" class="empty-state">
        <i class="fas fa-ticket-alt empty-icon"></i>
        <h3>{{ $t('tickets.empty.message') }}</h3>
        <p>{{ $t('tickets.empty.description') }}</p>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i> {{ $t('tickets.actions.add') }}
        </button>
      </div>

      <div v-else class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ $t('common.loading') }}</p>
      </div>
    </div>

    <!-- Modal pour créer/éditer un ticket -->
    <TicketModal
      v-if="showModal"
      :ticket="selectedTicket"
      :mode="modalMode"
      @close="closeModal"
      @created="handleCreated"
      @updated="handleUpdated"
      class="modal-box"
    />

    <!-- Modal de confirmation de suppression -->
    <Modal
      v-if="showDeleteConfirm"
      :title="$t('tickets.confirm.delete.title')"
      class="modal-box"
    >
      <p>{{ $t('tickets.confirm.delete.message') }}</p>
      <template #footer>
        <button class="btn btn-danger" @click="handleDelete">
          {{ $t('common.confirm') }}
        </button>
        <button class="btn btn-secondary" @click="showDeleteConfirm = false">
          {{ $t('common.cancel') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTicketStore } from '@/stores/tickets'
import { useClientsStore } from '@/stores/clients'
import { useNotificationStore } from '@/stores/notifications'
import TicketModal from '@/components/tickets/TicketModal.vue'
import Modal from '@/components/common/Modal.vue'

const { t } = useI18n()
const ticketStore = useTicketStore()
const clientsStore = useClientsStore()
const notificationStore = useNotificationStore()

// État local
const loading = ref(true)
const tickets = ref([])
const searchQuery = ref('')
const currentStatusFilter = ref('all')
const priorityFilter = ref('')
const showModal = ref(false)
const modalMode = ref('create')
const selectedTicket = ref(null)
const showDeleteConfirm = ref(false)
const ticketToDelete = ref(null)

// Filtres de statut disponibles
const statusFilters = [
  { value: 'all', label: t('tickets.filters.all') },
  { value: 'open', label: t('tickets.filters.open') },
  { value: 'pending', label: t('tickets.filters.pending') },
  { value: 'closed', label: t('tickets.filters.closed') },
  { value: 'resolved', label: t('tickets.filters.resolved') }
]

// Tickets filtrés en fonction de la recherche et du filtre de statut
const filteredTickets = computed(() => {
  let result = [...tickets.value]
  
  // Filtre par statut
  if (currentStatusFilter.value !== 'all') {
    result = result.filter(ticket => ticket.status === currentStatusFilter.value)
  }
  
  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(ticket => 
      ticket.subject.toLowerCase().includes(query) || 
      ticket.client_name.toLowerCase().includes(query) ||
      ticket.id.toString().includes(query)
    )
  }
  
  // Filtre par priorité
  if (priorityFilter.value) {
    result = result.filter(ticket => ticket.priority === priorityFilter.value)
  }
  
  return result
})

// Obtenir le nombre de tickets pour chaque filtre
const getFilteredTicketsCount = (status) => {
  if (status === 'all') {
    return tickets.value.length
  }
  return tickets.value.filter(ticket => ticket.status === status).length
}

// Formater la date pour l'affichage
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Obtenir la classe CSS pour la priorité
const getPriorityClass = (priority) => {
  return `priority-${priority}`
}

// Obtenir la classe CSS pour le statut
const getStatusClass = (status) => {
  return `status-${status}`
}

// Obtenir le libellé traduit pour la priorité
const getPriorityLabel = (priority) => {
  return t(`tickets.priority.${priority}`)
}

// Obtenir le libellé traduit pour le statut
const getStatusLabel = (status) => {
  return t(`tickets.status.${status}`)
}

// Rafraîchir la liste des tickets
const refreshTickets = async () => {
  loading.value = true
  try {
    const response = await ticketStore.fetchTickets()
    tickets.value = response
  } catch (error) {
    console.error('Error fetching tickets:', error)
    notificationStore.addNotification({
      title: t('common.error'),
      message: t('tickets.errors.fetch'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Ouvrir le modal de création
const openCreateModal = () => {
  selectedTicket.value = null
  modalMode.value = 'create'
  showModal.value = true
}

// Ouvrir le modal de visualisation
const openViewModal = (ticket) => {
  selectedTicket.value = ticket
  modalMode.value = 'view'
  showModal.value = true
}

// Ouvrir le modal d'édition
const openEditModal = (ticket) => {
  selectedTicket.value = ticket
  modalMode.value = 'edit'
  showModal.value = true
}

// Fermer le modal
const closeModal = () => {
  showModal.value = false
  selectedTicket.value = null
}

// Gérer la création d'un ticket
const handleCreated = () => {
  refreshTickets()
  closeModal()
  notificationStore.addNotification({
    title: t('common.success'),
    message: t('tickets.success.create'),
    type: 'success'
  })
}

// Gérer la mise à jour d'un ticket
const handleUpdated = () => {
  refreshTickets()
  closeModal()
  notificationStore.addNotification({
    title: t('common.success'),
    message: t('tickets.success.update'),
    type: 'success'
  })
}

// Ouvrir la confirmation de suppression
const confirmDelete = (ticket) => {
  ticketToDelete.value = ticket
  showDeleteConfirm.value = true
}

// Gérer la suppression d'un ticket
const handleDelete = async () => {
  if (!ticketToDelete.value) return
  
  try {
    await ticketStore.deleteTicket(ticketToDelete.value.id)
    notificationStore.addNotification({
      title: t('common.success'),
      message: t('tickets.success.delete'),
      type: 'success'
    })
    refreshTickets()
  } catch (error) {
    console.error('Error deleting ticket:', error)
    notificationStore.addNotification({
      title: t('common.error'),
      message: t('tickets.errors.delete'),
      type: 'error'
    })
  } finally {
    showDeleteConfirm.value = false
    ticketToDelete.value = null
  }
}

// Gérer la fermeture d'un ticket
const handleClose = async (ticket) => {
  try {
    await ticketStore.closeTicket(ticket.id)
    notificationStore.addNotification({
      title: t('common.success'),
      message: t('tickets.success.close'),
      type: 'success'
    })
    refreshTickets()
  } catch (error) {
    console.error('Error closing ticket:', error)
    notificationStore.addNotification({
      title: t('common.error'),
      message: t('tickets.errors.close'),
      type: 'error'
    })
  }
}

// Gérer la réouverture d'un ticket
const handleReopen = async (ticket) => {
  try {
    await ticketStore.reopenTicket(ticket.id)
    notificationStore.addNotification({
      title: t('common.success'),
      message: t('tickets.success.reopen'),
      type: 'success'
    })
    refreshTickets()
  } catch (error) {
    console.error('Error reopening ticket:', error)
    notificationStore.addNotification({
      title: t('common.error'),
      message: t('tickets.errors.reopen'),
      type: 'error'
    })
  }
}

// Appliquer les filtres
const applyFilters = () => {
  // À implémenter
}

// Lifecycle
onMounted(async () => {
  try {
    await clientsStore.fetchClients()
    await refreshTickets()
  } catch (error) {
    console.error('Error initializing tickets view:', error)
  }
})
</script>

<style>
@import '@/assets/css/pages/tickets.css';
@import '@/assets/css/components/common-layout.css';
</style>
