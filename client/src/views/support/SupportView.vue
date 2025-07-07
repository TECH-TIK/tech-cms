<template>
  <div id="client-support">
    <!-- Header Section -->
    <div class="support-header">
      <h1>
        <i class="fas fa-headset"></i>
        {{ $t('support.title') }}
      </h1>
      <div class="support-actions">
        <button class="btn btn-outline btn-sm">
          <i class="fas fa-book"></i>
          Base de connaissances
        </button>
        <button class="btn btn-primary btn-sm" @click="showNewTicketModal = true">
          <i class="fas fa-plus"></i>
          {{ $t('support.new_ticket') }}
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <div class="action-card" @click="showNewTicketModal = true">
        <div class="action-icon">
          <i class="fas fa-plus"></i>
        </div>
        <div class="action-title">{{ $t('support.create_ticket') }}</div>
        <div class="action-description">{{ $t('support.create_ticket_desc') }}</div>
      </div>

      <div class="action-card">
        <div class="action-icon">
          <i class="fas fa-book"></i>
        </div>
        <div class="action-title">{{ $t('support.knowledge_base') }}</div>
        <div class="action-description">{{ $t('support.knowledge_base_desc') }}</div>
      </div>

      <div class="action-card">
        <div class="action-icon">
          <i class="fas fa-comments"></i>
        </div>
        <div class="action-title">{{ $t('support.live_chat') }}</div>
        <div class="action-description">{{ $t('support.live_chat_desc') }}</div>
      </div>

      <div class="action-card">
        <div class="action-icon">
          <i class="fas fa-phone"></i>
        </div>
        <div class="action-title">{{ $t('support.phone_support') }}</div>
        <div class="action-description">{{ $t('support.phone_support_desc') }}</div>
      </div>
    </div>

    <!-- Tickets Section -->
    <div class="tickets-section">
      <div class="tickets-container">
        <div class="tickets-header">
          <h3 class="tickets-title">
            <i class="fas fa-ticket-alt"></i>
            Mes Tickets de Support
          </h3>
          <div class="tickets-filters">
            <select v-model="selectedStatus" class="filter-select" @change="filterTickets">
              <option value="">Tous les statuts</option>
              <option value="open">Ouvert</option>
              <option value="in-progress">En cours</option>
              <option value="resolved">Résolu</option>
              <option value="closed">Fermé</option>
            </select>
            <select v-model="selectedPriority" class="filter-select" @change="filterTickets">
              <option value="">Toutes les priorités</option>
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div v-if="ticketsStore.loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Chargement de vos tickets...</p>
        </div>

        <!-- Mise à jour temps réel instantanée - pas d'indicateur nécessaire -->

        <div v-else-if="error" class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Erreur de chargement</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" @click="loadTickets()">
            <i class="fas fa-redo"></i>
            Réessayer
          </button>
        </div>

        <div v-else-if="filteredTickets.length === 0" class="empty-state">
          <i class="fas fa-ticket-alt"></i>
          <h3>Aucun ticket trouvé</h3>
          <p>{{ searchQuery || selectedStatus || selectedPriority ? 'Aucun ticket ne correspond à vos critères.' : 'Vous n\'avez pas encore de tickets de support.' }}</p>
          <button class="btn btn-primary" @click="showNewTicketModal = true">
            <i class="fas fa-plus"></i>
            Créer votre premier ticket
          </button>
        </div>

        <div v-else class="tickets-list">
          <div v-for="ticket in filteredTickets" :key="ticket.id" class="ticket-item">
            <div class="ticket-info">
              <div class="ticket-icon">
                <i :class="getTicketIcon(ticket.department_name)"></i>
              </div>
              <div class="ticket-details">
                <div class="ticket-title">
                  <a href="#" @click.prevent="viewTicket(ticket.id)">
                    {{ ticket.title }}
                  </a>
                </div>
                <div class="ticket-id">
                  #{{ ticket.id }} • {{ ticket.department_name || 'Général' }}
                </div>
              </div>
            </div>
            <div class="ticket-meta">
              <div class="ticket-date">
                {{ formatDate(ticket.created_at) }}
              </div>
              <div class="ticket-status">
                <span :class="getStatusClass(ticket.status)">
                  {{ getStatusLabel(ticket.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Ticket Modal -->
    <div class="modal-overlay" :class="{ show: showNewTicketModal }" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Créer un Nouveau Ticket</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="submitTicket">
          <div class="form-group">
            <label class="form-label">Sujet</label>
            <input 
              v-model="newTicket.subject" 
              type="text" 
              class="form-input" 
              placeholder="Décrivez brièvement votre problème..."
              required
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">Département</label>
            <select v-model="newTicket.department_id" class="form-select" required>
              <option value="">Sélectionnez un département</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id.toString()">
                {{ dept.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Priorité</label>
            <select v-model="newTicket.priority" class="form-select" required>
              <option value="">Sélectionnez une priorité</option>
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="newTicket.message"
              class="form-textarea"
              placeholder="Décrivez votre problème en détail..."
              required
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-paper-plane"></i>
              Créer le Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ApiService } from '@/services/api'
import { useTicketsStore } from '@/stores/tickets'
import { useRealtimeStore } from '@/stores/realtime'
import { useAuthStore } from '@/stores/auth'
import logger from '@/services/logger'
import type { Ticket, TicketCreateForm, TicketDepartment } from '@/types/api'
import { formatDateShort } from '@/utils/dateUtils'

// Interface locale pour le formulaire
interface NewTicket {
  subject: string
  department_id: string
  priority: string
  message: string
}

// Router
const router = useRouter()

// Stores
const ticketsStore = useTicketsStore()
const realtimeStore = useRealtimeStore()
const authStore = useAuthStore()

// État de l'application
const departments = ref<TicketDepartment[]>([])
const selectedStatus = ref('')
const selectedPriority = ref('')
const searchQuery = ref('')
const showNewTicketModal = ref(false)
const submitting = ref(false)
const successMessage = ref('')
const error = ref<string | null>(null)

const newTicket = ref<NewTicket>({
  subject: '',
  department_id: '',
  priority: 'medium',
  message: ''
})

// Fonctions pour charger les données
const loadTickets = async () => {
  try {
    error.value = null
    await ticketsStore.fetchTickets()
    logger.info('[SUPPORT] Tickets chargés depuis le store', { count: ticketsStore.tickets.length })
  } catch (err: any) {
    logger.error('[SUPPORT] Erreur lors du chargement des tickets', { error: err })
    error.value = err.response?.data?.message || 'Erreur lors du chargement des tickets'
  }
}

const loadDepartments = async () => {
  try {
    const response = await ApiService.routes.client.department.list()
    departments.value = response.data

    logger.info('[SUPPORT] Départements chargés', { count: departments.value.length })
  } catch (err: any) {
    logger.error('[SUPPORT] Erreur lors du chargement des départements', { error: err })
    // Fallback avec données par défaut
    departments.value = [
      { id: 1, name: 'Support Technique', description: 'Problèmes techniques', email: 'tech@tech-tik.com', active: true, created_at: '', updated_at: '' },
      { id: 2, name: 'Facturation', description: 'Questions de facturation', email: 'billing@tech-tik.com', active: true, created_at: '', updated_at: '' },
      { id: 3, name: 'Commercial', description: 'Questions commerciales', email: 'sales@tech-tik.com', active: true, created_at: '', updated_at: '' }
    ]
  }
}

// Computed properties
const filteredTickets = computed(() => {
  let filtered = ticketsStore.tickets

  if (selectedStatus.value) {
    filtered = filtered.filter(ticket => ticket.status === selectedStatus.value)
  }

  if (selectedPriority.value) {
    filtered = filtered.filter(ticket => ticket.priority === selectedPriority.value)
  }

  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

// Méthodes
const filterTickets = () => {
  // La réactivité de Vue se charge automatiquement du filtrage
}

// formatDate est défini plus bas avec l'utilitaire

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    open: 'status-badge status-open',
    'in-progress': 'status-badge status-in-progress',
    resolved: 'status-badge status-resolved',
    closed: 'status-badge status-closed'
  }
  return classes[status] || 'status-badge'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    open: 'Ouvert',
    answered: 'Répondu',
    'customer-reply': 'En attente',
    closed: 'Fermé'
  }
  return labels[status] || status
}

// Utilisation de la fonction utilitaire pour le formatage des dates
const formatDate = formatDateShort

const getTicketIcon = (category: string | undefined): string => {
  if (!category) return 'fas fa-ticket-alt'

  const icons: Record<string, string> = {
    'Support Technique': 'fas fa-cog',
    'Technique': 'fas fa-cog',
    'Facturation': 'fas fa-euro-sign',
    'Commercial': 'fas fa-handshake',
    'Général': 'fas fa-question-circle',
    'Demande': 'fas fa-hand-paper'
  }
  return icons[category] || 'fas fa-ticket-alt'
}

const viewTicket = (id: number) => {
  router.push(`/support/ticket/${id}`)
}

const closeModal = () => {
  showNewTicketModal.value = false
  successMessage.value = ''
  error.value = null
  // Réinitialiser le formulaire
  newTicket.value = {
    subject: '',
    department_id: '',
    priority: 'medium',
    message: ''
  }
}

const submitTicket = async () => {
  if (!newTicket.value.subject || !newTicket.value.message) {
    error.value = 'Veuillez remplir tous les champs obligatoires'
    return
  }

  try {
    submitting.value = true
    error.value = null

    logger.info('[SUPPORT] Création du ticket', { subject: newTicket.value.subject, priority: newTicket.value.priority })

    const ticketData: TicketCreateForm = {
      subject: newTicket.value.subject,
      message: newTicket.value.message,
      priority: newTicket.value.priority as any,
      department_id: newTicket.value.department_id ? parseInt(newTicket.value.department_id) : undefined
    }

    await ApiService.routes.client.ticket.create(ticketData)

    successMessage.value = 'Ticket créé avec succès'
    closeModal()

    // Recharger la liste des tickets depuis le store
    await ticketsStore.refreshTickets()

  } catch (err: any) {
    logger.error('[SUPPORT] Erreur lors de la création du ticket', { error: err, ticketData: newTicket.value })
    error.value = err.response?.data?.message || 'Erreur lors de la création du ticket'
  } finally {
    submitting.value = false
  }
}

// Initialiser le temps réel pour cette page
const initRealtime = async () => {
  const clientId = authStore.user?.id

  if (!clientId) {
    logger.error('[SUPPORT VIEW] ID client manquant - abandon initialisation temps réel', {
      user: authStore.user
    })
    return
  }

  if (realtimeStore.initialized) {
    // S'abonner aux canaux dashboard si pas déjà fait
    await realtimeStore.subscribeToDashboardEvents(clientId)

    // Enregistrer le handler pour cette page
    realtimeStore.registerDashboardHandler('ticket-page', ticketsStore.handleTicketUpdate)
    logger.info('[SUPPORT VIEW] Handler temps réel enregistré avec clé ticket-page', { clientId })
  } else {
    // Attendre que le realtime soit prêt
    const unwatch = realtimeStore.$subscribe((_mutation, state) => {
      if (state.initialized) {
        // S'abonner aux canaux dashboard
        realtimeStore.subscribeToDashboardEvents(clientId).then(() => {
          // Enregistrer le handler pour cette page
          realtimeStore.registerDashboardHandler('ticket-page', ticketsStore.handleTicketUpdate)
          logger.info('[SUPPORT VIEW] Handler temps réel enregistré (après initialisation) avec clé ticket-page', { clientId })
        })
        unwatch()
      }
    })
  }
}

// Nettoyer le handler temps réel
const cleanupRealtime = () => {
  realtimeStore.unregisterDashboardHandler('ticket-page')
  logger.info('[SUPPORT VIEW] Handler temps réel supprimé avec clé ticket-page')
}

// Chargement des données
onMounted(async () => {
  await Promise.all([
    loadTickets(),
    loadDepartments()
  ])

  // Initialiser le temps réel après le chargement des données
  await initRealtime()
})

onUnmounted(() => {
  cleanupRealtime()
})
</script>

<style scoped>
@import '@/assets/css/pages/support.css';
</style>
