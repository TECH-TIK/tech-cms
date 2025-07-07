<template>
  <div id="servicesList" class="view-container">
    <!-- En-tête avec titre et bouton d'ajout -->
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ t('services.title') }}</h1>
        <span class="page-description">{{ t('services.description') }}</span>
      </div>
      <button class="btn btn-gradient" @click="handleAddService">
        <i class="fas fa-plus"></i>
        {{ t('services.add_new') }}
      </button>
    </div>

    <!-- Statistiques des services - Temporairement masquées -->
    <!-- <div v-if="stats" class="stats-grid">
      <div class="stat-card" v-for="(count, status) in stats.count_by_status" :key="status">
        <div class="stat-icon" :class="getStatusIconClass(status)">
          <i :class="getStatusIcon(status)"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-count">{{ count }}</h3>
          <p class="stat-label">{{ t(`services.status.${status}`) }}</p>
        </div>
      </div>
    </div> -->

    <!-- Section des filtres -->
    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ t('services.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="filter-input" 
              :placeholder="t('services.filters.search_placeholder')"
            >
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('services.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-tag"></i>
            <select v-model="statusFilter" class="filter-input">
              <option value="">{{ t('services.status.all') }}</option>
              <option value="pending">{{ t('services.status.pending') }}</option>
              <option value="active">{{ t('services.status.active') }}</option>
              <option value="suspended">{{ t('services.status.suspended') }}</option>
              <option value="cancelled">{{ t('services.status.cancelled') }}</option>
              <option value="terminated">{{ t('services.status.terminated') }}</option>
              <option value="fraud">{{ t('services.status.fraud') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('services.filters.client') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-user"></i>
            <select v-model="clientFilter" class="filter-input">
              <option value="">{{ t('services.filters.all_clients') }}</option>
              <option v-for="client in clients" :key="client?.id || ''" :value="client?.id || ''">
                {{ client?.firstname || '' }} {{ client?.lastname || '' }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('services.filters.product') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-box"></i>
            <select v-model="productFilter" class="filter-input">
              <option value="">{{ t('services.filters.all_products') }}</option>
              <option v-for="product in products" :key="product?.id || ''" :value="product?.id || ''">
                {{ product?.name || '' }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>
    
    <!-- État vide -->
    <div v-else-if="services.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-server"></i>
      </div>
      <h3 class="empty-title">{{ t('services.empty.title') }}</h3>
      <p class="empty-description">{{ t('services.empty.message') }}</p>
      <button class="btn btn-primary" @click="handleAddService">
        {{ t('services.add_new') }}
      </button>
    </div>
    
    <!-- Tableau des services -->
    <div v-else class="table-box">
      <table v-if="!loading && services.length > 0" class="data-table">
        <thead>
          <tr>
            <th class="sortable" :class="{ active: sortColumn === 'id' }" @click="sortBy('id')">
              ID
              <i v-if="sortColumn === 'id'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th>{{ t('services.table.client') }}</th>
            <th>{{ t('services.table.product') }}</th>
            <th>{{ t('services.table.domain') }}</th>
            <th class="sortable" :class="{ active: sortColumn === 'status' }" @click="sortBy('status')">
              {{ t('services.table.status') }}
              <i v-if="sortColumn === 'status'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th class="sortable" :class="{ active: sortColumn === 'next_due_date' }" @click="sortBy('next_due_date')">
              {{ t('services.table.next_due_date') }}
              <i v-if="sortColumn === 'next_due_date'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th>{{ t('services.table.recurring_amount') }}</th>
            <th>{{ t('services.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in services" :key="service.id" @click="viewServiceDetails(service.id)">
            <td>#{{ service.id }}</td>
            <td>{{ service.client_name }}</td>
            <td>{{ service.product_name }}</td>
            <td>{{ service.domain || '-' }}</td>
            <td>
              <span class="status-badge" :class="'status-' + service.status">
                {{ t(`services.status.${service.status}`) }}
              </span>
            </td>
            <td>{{ service.next_due_date ? formatDate(service.next_due_date) : '-' }}</td>
            <td>{{ formatCurrency(service.recurring_amount) }}</td>
            <td class="actions">
              <div class="action-buttons">
                <button class="btn-icon" :title="t('services.actions.view')" @click.stop="viewServiceDetails(service.id)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" :title="t('services.actions.edit')" @click.stop="editService(service.id)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" :title="t('services.actions.delete')" @click.stop="deleteServicePrompt(service.id)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        class="pagination-btn" 
        :disabled="currentPage === 1" 
        @click="goToPage(currentPage - 1)"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <button 
        v-for="page in paginationButtons" 
        :key="page" 
        class="pagination-btn" 
        :class="{ active: page === currentPage }"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
      
      <button 
        class="pagination-btn" 
        :disabled="currentPage === totalPages" 
        @click="goToPage(currentPage + 1)"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal show" style="display: flex; align-items: center; justify-content: center;">
      <div class="modal-backdrop" @click="showDeleteModal = false"></div>
      <div class="modal-content" style="position: fixed; z-index: 1052; max-height: 80vh; backdrop-filter: none;">
        <div class="modal-header">
          <h3>{{ t('services.delete_modal.title') }}</h3>
          <button class="close-btn" @click="showDeleteModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>{{ t('services.delete_modal.confirmation') }}</p>
          <p class="warning">{{ t('services.delete_modal.warning') }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" :disabled="isDeleting" @click="showDeleteModal = false">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-danger" :disabled="isDeleting" @click="confirmDelete">
            <span v-if="isDeleting">
              <span class="spinner-border spinner-border-sm mr-2"></span>
              {{ t('common.deleting') }}...
            </span>
            <span v-else>{{ t('common.delete') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useServicesStore } from '@/stores/services'
import { useClientsStore } from '@/stores/clients'
import { useProductStore } from '@/stores/products'
import { useRealtimeStore } from '@/stores/realtime'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import logger from '@/services/logger'

// Stores et router
const servicesStore = useServicesStore()
const clientsStore = useClientsStore()
const productsStore = useProductStore()
const realtimeStore = useRealtimeStore()
const router = useRouter()
const { t } = useI18n()

// État local
const searchQuery = ref('')
const statusFilter = ref('')
const clientFilter = ref('')
const productFilter = ref('')
const sortColumn = ref('id')
const sortDirection = ref('DESC')
const showDeleteModal = ref(false)
const serviceToDelete = ref<number | null>(null)
const isDeleting = ref(false)

// Calculer les données à partir du store
const services = computed(() => servicesStore.services)
const loading = computed(() => servicesStore.loading)

const currentPage = computed(() => servicesStore.currentPage)
const totalItems = computed(() => servicesStore.total)
const perPage = computed(() => servicesStore.perPage)
const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value))
const clients = computed(() => clientsStore.clients)
const products = computed(() => productsStore.products)

// Pagination
const paginationButtons = computed(() => {
  const buttons = []
  const maxButtons = 5
  
  if (totalPages.value <= maxButtons) {
    // Afficher tous les boutons si le nombre total de pages est inférieur ou égal à maxButtons
    for (let i = 1; i <= totalPages.value; i++) {
      buttons.push(i)
    }
  } else {
    // Afficher un sous-ensemble de boutons
    if (currentPage.value <= 3) {
      // Proche du début
      for (let i = 1; i <= 4; i++) {
        buttons.push(i)
      }
      buttons.push('...')
      buttons.push(totalPages.value)
    } else if (currentPage.value >= totalPages.value - 2) {
      // Proche de la fin
      buttons.push(1)
      buttons.push('...')
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) {
        buttons.push(i)
      }
    } else {
      // Au milieu
      buttons.push(1)
      buttons.push('...')
      for (let i = currentPage.value - 1; i <= currentPage.value + 1; i++) {
        buttons.push(i)
      }
      buttons.push('...')
      buttons.push(totalPages.value)
    }
  }
  
  return buttons
})

// Fonctions d'assistance
const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
  } catch (e) {
    logger.warn('Failed to format date', { date, error: e })
    return date
  }
}

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '-'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}





// Actions
const fetchData = async () => {
  try {
    // Récupérer les statistiques
    await servicesStore.fetchServiceStats()
    
    // Préparer les filtres
    const filters: any = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (statusFilter.value) filters.status = statusFilter.value
    if (clientFilter.value) filters.client_id = clientFilter.value
    if (productFilter.value) filters.product_id = productFilter.value
    
    // Ajouter le tri
    filters.sort_by = sortColumn.value
    filters.sort_dir = sortDirection.value
    
    // Récupérer les services filtrés
    await servicesStore.fetchServices(currentPage.value, filters)
    
    // Récupérer les clients et produits pour les filtres
    await clientsStore.fetchClients()
    await productsStore.fetchProducts()
  } catch (error) {
    logger.error('Erreur lors du chargement des données:', { error })
  }
}

const goToPage = (page: number | string) => {
  if (typeof page === 'string') return;
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  fetchData()
}

/**
 * Initialiser les fonctionnalités temps réel
 */
const initRealtime = () => {
  logger.debug('[ServicesView] Initialisation des fonctionnalités temps réel')
  
  try {
    // S'assurer que le service temps réel est initialisé
    if (!realtimeStore.isInitialized) {
      logger.debug('[ServicesView] Initialisation du store realtime')
      realtimeStore.init()
    }
    
    // Initialiser les écouteurs d'événements pour les services
    servicesStore.initRealtimeListeners()
    
    logger.info('[ServicesView] Fonctionnalités temps réel initialisées avec succès')
  } catch (error) {
    logger.error('[ServicesView] Erreur lors de l\'initialisation du temps réel', { error })
  }
}

const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    // Inverser la direction si on clique sur la même colonne
    sortDirection.value = sortDirection.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    // Nouvelle colonne, trier par défaut en ordre décroissant
    sortColumn.value = column
    sortDirection.value = 'DESC'
  }
  fetchData()
}

const handleAddService = () => {
  router.push({ name: 'create-service' })
}

const viewServiceDetails = (id: number | undefined) => {
  if (id === undefined) return;
  router.push({ name: 'service-details', params: { id: id.toString() } })
}

const editService = (id: number | undefined) => {
  if (id === undefined) return;
  router.push({ name: 'edit-service', params: { id: id.toString() } })
}

const deleteServicePrompt = (id: number | undefined) => {
  logger.debug(`[ServicesView] deleteServicePrompt appelé avec id: ${id}`);
  if (id === undefined) return;
  serviceToDelete.value = id
  showDeleteModal.value = true
  logger.debug(`[ServicesView] Modal de suppression affichée pour le service ${id}`);
}

const confirmDelete = async () => {
  logger.info(`[ServicesView] confirmDelete appelé pour le service ${serviceToDelete.value}`);
  if (!serviceToDelete.value) return
  
  try {
    logger.debug(`[ServicesView] Appel de servicesStore.deleteService pour le service ${serviceToDelete.value}`);
    isDeleting.value = true
    await servicesStore.deleteService(serviceToDelete.value)
    logger.info(`[ServicesView] Service ${serviceToDelete.value} supprimé avec succès`);
    showDeleteModal.value = false
    serviceToDelete.value = null
    fetchData() // Actualiser les données après la suppression
  } catch (error) {
    logger.error('Erreur lors de la suppression du service', { serviceId: serviceToDelete.value, error })
  } finally {
    isDeleting.value = false
  }
}

// Observateurs
watch([searchQuery, statusFilter, clientFilter, productFilter], () => {
  fetchData()
})

// Cycle de vie
onMounted(async () => {
  await fetchData()
  
  // Initialiser le temps réel après le chargement des données
  initRealtime()
  
  logger.info('[ServicesView] Composant monté et temps réel initialisé')
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS commun */
@import '@/assets/css/components/common-layout.css';

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  background: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  margin-right: 1rem;
  font-size: 1.25rem;
  color: white;
}

.status-active {
  background-color: var(--success-color);
}

.status-pending {
  background-color: var(--warning-color);
}

.status-suspended {
  background-color: var(--warning-dark-color);
}

.status-cancelled {
  background-color: var(--danger-light-color);
}

.status-terminated {
  background-color: var(--danger-color);
}

.status-fraud {
  background-color: var(--danger-dark-color);
}

.stat-count {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.warning {
  color: var(--danger-color);
  font-weight: 500;
}

/* Empêcher le clic sur les boutons de pagination non numériques */
.pagination-btn:not([disabled])[data-value="..."] {
  pointer-events: none;
  opacity: 0.5;
}

/* Alignement du texte dans les cellules du tableau */
.data-table th, .data-table td {
  text-align: center;
}

/* Garder l'alignement à gauche pour les colonnes de texte */
.data-table th:nth-child(1),
.data-table th:nth-child(2),
.data-table th:nth-child(3),
.data-table th:nth-child(4),
.data-table td:nth-child(1),
.data-table td:nth-child(2),
.data-table td:nth-child(3),
.data-table td:nth-child(4) {
  text-align: left;
}

/* Les styles de correction des modaux ont été déplacés dans le fichier modals.css global */
</style> 