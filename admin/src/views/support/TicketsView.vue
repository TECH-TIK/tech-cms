<template>
  <div class="tickets-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ $t('tickets.title') }}</h1>
        <span class="page-description">{{ $t('tickets.description') }}</span>
      </div>
      <router-link to="/tickets/create" class="btn btn-gradient">
        <i class="fas fa-plus"></i>
        {{ $t('tickets.actions.add') }}
      </router-link>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ $t('tickets.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="filter-input" 
              :placeholder="$t('tickets.search.placeholder')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('tickets.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-ticket-alt"></i>
            <select v-model="statusFilter" class="filter-input">
              <option value="">{{ $t('tickets.status.all') }}</option>
              <option value="open">{{ $t('tickets.status.open') }}</option>
              <option value="pending">{{ $t('tickets.status.pending') }}</option>
              <option value="resolved">{{ $t('tickets.status.resolved') }}</option>
              <option value="closed">{{ $t('tickets.status.closed') }}</option>
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
        
        <!-- Nouveau filtre pour départements -->
        <div class="filter-group">
          <label class="filter-label">{{ $t('tickets.filters.department') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-sitemap"></i>
            <select v-model="departmentFilter" class="filter-input">
              <option value="">{{ $t('tickets.departments.all') }}</option>
              <option value="unassigned">{{ $t('tickets.departments.unassigned') }}</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Nouveau filtre pour assignation -->
        <div class="filter-group">
          <label class="filter-label">{{ $t('tickets.filters.assigned_to') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-user-check"></i>
            <select v-model="assignedToFilter" class="filter-input">
              <option value="">{{ $t('tickets.assigned_to.all') }}</option>
              <option value="unassigned">{{ $t('tickets.assigned_to.unassigned') }}</option>
              <option v-for="admin in admins" :key="admin.id" :value="admin.id">
                {{ admin.username }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Actions supplémentaires -->
      <div class="filter-actions">
        <button class="btn btn-secondary" @click="resetFilters">
          <i class="fas fa-undo"></i>
          {{ $t('common.reset_filters') }}
        </button>
        <router-link to="/ticket-departments" class="btn btn-primary">
          <i class="fas fa-cog"></i>
          {{ $t('tickets.departments.manage') }}
        </router-link>
      </div>
    </div>

    <!-- Liste des tickets -->
    <div v-if="loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="filteredTickets.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-ticket-alt"></i>
      </div>
      <h3 class="empty-title">{{ t('tickets.empty.title') }}</h3>
      <p class="empty-description">{{ t('tickets.empty.description') }}</p>
    </div>

    <div v-else class="table-box">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('tickets.table.subject') }}</th>
            <th>{{ t('tickets.table.client') }}</th>
            <th>{{ t('tickets.table.department') }}</th>
            <th>{{ t('tickets.table.assigned_to') }}</th>
            <th>{{ t('tickets.table.priority') }}</th>
            <th>{{ t('tickets.table.status') }}</th>
            <th>{{ t('tickets.table.last_reply') }}</th>
            <th>{{ t('tickets.table.created_at') }}</th>
            <th>{{ t('tickets.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ticket in paginatedTickets" :key="ticket.id" @click="viewTicketDetails(ticket.id as number)">
            <td>#{{ ticket.id }}</td>
            <td class="subject-cell">{{ ticket.subject }}</td>
            <td>{{ ticket.client_name }}</td>
            <td>
              <span v-if="ticket.department_name" class="department-badge">
                {{ ticket.department_name }}
              </span>
              <span v-else class="unassigned-badge">{{ t('tickets.departments.none') }}</span>
            </td>
            <td>
              <span v-if="ticket.assigned_to_name" class="assigned-badge">
                {{ ticket.assigned_to_name }}
              </span>
              <span v-else class="unassigned-badge">{{ t('tickets.assigned_to.none') }}</span>
            </td>
            <td>
              <span :class="`priority-badge priority-${ticket.priority}`">
                {{ getPriorityLabel(ticket.priority) }}
              </span>
            </td>
            <td>
              <span :class="`status-badge status-${ticket.status}`">
                {{ getStatusLabel(ticket.status) }}
              </span>
            </td>
            <td>{{ formatDate(ticket.last_reply) }}</td>
            <td>{{ formatDate(ticket.created_at) }}</td>
            <td class="actions">
              <div class="action-buttons">
                <button class="btn-icon" :title="t('tickets.actions.view')" @click.stop="viewTicketDetails(ticket.id as number)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" :title="t('tickets.actions.edit')" @click.stop="editTicket(ticket.id as number)">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  v-if="ticket.status === 'closed' || ticket.status === 'resolved'"
                  class="btn-icon success-icon"
                  :title="t('tickets.actions.reopen')"
                  @click.stop="reopenTicket(ticket.id as number)"
>
                  <i class="fas fa-unlock"></i>
                </button>
                <button 
                  v-else
                  class="btn-icon warning-icon"
                  :title="t('tickets.actions.close')"
                  @click.stop="closeTicket(ticket.id as number)"
>
                  <i class="fas fa-lock"></i>
                </button>
                <button class="btn-icon danger-icon" :title="t('tickets.actions.delete')" @click.stop="deleteTicket(ticket.id as number)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
</div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <a
        v-for="page in totalPages"
        :key="page"
        :class="['page-link', { active: page === currentPage }]"
        @click="changePage(page)"
      >
        {{ page }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ApiService } from '@/services/api'
import { useNotificationStore } from '@/stores/notifications'
import { useTicketStore } from '@/stores/tickets'
import { Ticket } from '@/types/ticket'
import logger from '@/services/logger'

interface Department {
  id: number;
  name: string;
  email: string | null;
  active: boolean;
}

interface Admin {
  id: number;
  username: string;
}

const { t } = useI18n()
const router = useRouter()
const ticketStore = useTicketStore()
const notificationStore = useNotificationStore()

// État local
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const departmentFilter = ref('')
const assignedToFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
// Utiliser directement les tickets du store
const tickets = computed(() => ticketStore.tickets)
const departments = ref<Department[]>([])
const admins = ref<Admin[]>([])

// Watched for automatic filtering
watch([searchQuery, statusFilter, priorityFilter, departmentFilter, assignedToFilter], () => {
  currentPage.value = 1
})

// Computed
const filteredTickets = computed<Ticket[]>(() => {
  const query = searchQuery.value.toLowerCase()
  let result = tickets.value
  
  // Filtrer par termes de recherche
  if (query) {
    result = result.filter(ticket => 
      ticket.subject.toLowerCase().includes(query) ||
      ticket.client_name.toLowerCase().includes(query) ||
      ticket.id.toString().includes(query)
    )
  }
  
  // Filtrer par statut
  if (statusFilter.value) {
    result = result.filter(ticket => ticket.status === statusFilter.value)
  }
  
  // Filtrer par priorité
  if (priorityFilter.value) {
    result = result.filter(ticket => ticket.priority === priorityFilter.value)
  }
  
  // Filtrer par département
  if (departmentFilter.value) {
    if (departmentFilter.value === 'unassigned') {
      result = result.filter(ticket => !ticket.department_id);
    } else {
      result = result.filter(ticket => 
        ticket.department_id === parseInt(departmentFilter.value)
      );
    }
  }
  
  // Filtrer par assignation
  if (assignedToFilter.value) {
    if (assignedToFilter.value === 'unassigned') {
      result = result.filter(ticket => !ticket.assigned_to);
    } else {
      result = result.filter(ticket => 
        ticket.assigned_to === parseInt(assignedToFilter.value)
      );
    }
  }
  
  // Filtrer par priorité
  if (priorityFilter.value) {
    result = result.filter(ticket => ticket.priority === priorityFilter.value)
  }
  
  return result
})

// Calcul du nombre total de pages à partir des tickets filtrés
const totalPages = computed<number>(() => {
  return Math.ceil(filteredTickets.value.length / itemsPerPage.value)
})

const paginatedTickets = computed<Ticket[]>(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTickets.value.slice(start, end)
})

// Méthodes
async function refreshTickets() {
  loading.value = true
  
  try {
    // Charger les tickets depuis l'API avec les nouveaux filtres
    const params: Record<string, string> = {}
    
    if (statusFilter.value) params.status = statusFilter.value
    if (priorityFilter.value) params.priority = priorityFilter.value
    if (departmentFilter.value) params.department_id = departmentFilter.value
    if (assignedToFilter.value) params.assigned_to = assignedToFilter.value
    
    // Utiliser la méthode fetchTickets du store avec les filtres
    await ticketStore.fetchTickets(params)
    
    // Récupérer les départements via le service API centralisé
    const response = await ApiService.routes.admin.ticket.list(params)
    
    // Extraction des départements de la réponse
    if (response.data) {
      // Structure standard (sans wrapper data)
      if (response.data.departments !== undefined) {
        departments.value = response.data.departments || []
      } 
      // Structure avec wrapper data (ancienne version)
      else if (response.data.data && response.data.data.departments !== undefined) {
        departments.value = response.data.data.departments || []
      }
      else {
        departments.value = []
      }
      
      // Journaliser l'information sur l'état des données
      if (ticketStore.tickets.length === 0) {
        logger.info('Aucun ticket trouvé, affichage d\'une liste vide', { filtres: params })
      } else {
        logger.info(`${ticketStore.tickets.length} tickets chargés avec succès`)
      }
    } else {
      // Pas de données du tout
      logger.error('Aucune donnée reçue de l\'API', { response })
      departments.value = []
      notificationStore.showError(t('tickets.errors.unexpected_format'))
    }
    
    // Récupérer la liste des administrateurs pour les assignations via le service API centralisé
    try {
      const adminsResponse = await ApiService.routes.admin.admins.list()
      admins.value = adminsResponse.data.data?.admins || adminsResponse.data?.admins || []
    } catch (error) {
      logger.error('[TICKETS] Erreur lors du chargement des administrateurs', { error })
      notificationStore.showError(t('tickets.errors.admins_load_failed'))
    }
  } catch (error: any) {
    notificationStore.showError(t('tickets.errors.fetch_failed'))
    // Journalisation détaillée de l'erreur avec plus d'informations pour le débogage
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'erreur
      logger.error('Erreur API (réponse du serveur)', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      })
    } else if (error.request) {
      // La requête a été faite mais pas de réponse reçue
      logger.error('Erreur API (pas de réponse)', {
        request: error.request
      })
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      logger.error('Erreur lors de la configuration de la requête', {
        message: error.message,
        stack: error.stack
      })
    }
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = ''
  priorityFilter.value = ''
  departmentFilter.value = ''
  assignedToFilter.value = ''
  refreshTickets()
}

const changePage = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewTicketDetails = (ticketId: number) => {
  router.push({ name: 'ticket-details', params: { id: ticketId.toString() } })
}

const editTicket = (ticketId: number) => {
  router.push({ name: 'edit-ticket', params: { id: ticketId.toString() } })
}

const closeTicket = async (ticketId: number) => {
  try {
    await ticketStore.closeTicket(ticketId)
    await refreshTickets()
  } catch (error) {
    logger.error('[TicketsView] Erreur lors de la fermeture', { ticketId, error });
  }
}

const reopenTicket = async (ticketId: number) => {
  try {
    await ticketStore.reopenTicket(ticketId)
    await refreshTickets()
  } catch (error) {
    logger.error('[TicketsView] Erreur lors de la réouverture', { ticketId, error });
  }
}

const deleteTicket = async (ticketId: number) => {
  if (confirm(t('tickets.confirm_delete'))) {
    try {
      await ticketStore.deleteTicket(ticketId)
      await refreshTickets()
    } catch (error) {
      logger.error('[TicketsView] Erreur lors de la suppression', { ticketId, error });
    }
  }
}

const formatDate = (dateString: string) => {
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

const getPriorityLabel = (priority: string) => {
  return t(`tickets.priority.${priority}`)
}

const getStatusLabel = (status: string) => {
  return t(`tickets.status.${status}`)
}

// Cycle de vie
onMounted(async () => {
  await refreshTickets()
  
  // Initialiser les écouteurs temps réel pour les tickets
  ticketStore.initRealtimeListeners()
  logger.info('[TicketsView] Écouteurs temps réel initialisés')
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS */
@import '@/assets/css/pages/tickets.css';
@import '@/assets/css/components/common-layout.css';

/* Styles de base pour la vue */
.tickets-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Styles pour les filtres */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

/* Badges pour départements et assignations */
.department-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  background-color: #e3f2fd;
  color: #0d47a1;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

.assigned-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.unassigned-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  background-color: #f5f5f5;
  color: #757575;
  border-radius: 4px;
  font-size: 0.85rem;
  font-style: italic;
  white-space: nowrap;
}

/* Styles additionnels spécifiques */

/* Styles additionnels */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

/* Alignement du texte dans les cellules du tableau */
.data-table th, .data-table td {
  text-align: center;
}

/* Garder l'alignement à gauche pour les colonnes de texte */
.data-table th:nth-child(1),
.data-table th:nth-child(2),
.data-table th:nth-child(3),
.data-table td:nth-child(1),
.data-table td:nth-child(2),
.data-table td:nth-child(3) {
  text-align: left;
}

.subject-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge, .priority-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
