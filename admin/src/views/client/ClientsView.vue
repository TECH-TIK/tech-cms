<template>
  <div id="clientsList" class="view-container">
    <!-- En-tête avec titre et bouton d'ajout -->
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ t('clients.title') }}</h1>
        <span class="page-description">{{ t('clients.description') }}</span>
      </div>
      <button class="btn btn-gradient" @click="handleAddClient">
        <i class="fas fa-plus"></i>
        {{ t('clients.add_new') }}
      </button>
    </div>

    <!-- Filtres et recherche -->
    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ t('clients.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="filter-input" 
              :placeholder="t('clients.filters.search_placeholder')"
            >
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('clients.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-user-clock"></i>
            <select v-model="statusFilter" class="filter-input">
              <option value="">{{ t('clients.status.all') }}</option>
              <option value="active">{{ t('clients.status.active') }}</option>
              <option value="inactive">{{ t('clients.status.inactive') }}</option>
              <option value="pending">{{ t('clients.status.pending') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('clients.filters.service_type') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-cog"></i>
            <select v-model="serviceTypeFilter" class="filter-input">
              <option value="">{{ t('clients.services.all') }}</option>
              <option value="hosting">{{ t('clients.services.hosting') }}</option>
              <option value="domain">{{ t('clients.services.domain') }}</option>
              <option value="ssl">{{ t('clients.services.ssl') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des clients -->
    <div v-if="clientsStore.loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>
    
    <div v-else-if="filteredAndSortedClients.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-users"></i>
      </div>
      <h3 class="empty-title">{{ t('clients.empty.title') }}</h3>
      <p class="empty-description">{{ t('clients.empty.description') }}</p>
    </div>
    
    <div v-else class="table-box">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('clients.table.client') }}</th>
            <th>{{ t('clients.table.company') }}</th>
            <th>{{ t('clients.table.email') }}</th>
            <th>{{ t('clients.table.phone') }}</th>
            <th>{{ t('clients.table.status') }}</th>
            <th>{{ t('clients.table.services') }}</th>
            <th>{{ t('clients.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in paginatedClients" :key="client.id" @click="viewClientDetails(client.id)">
            <td>#{{ client.id }}</td>
            <td>
              <div class="client-details">
                <span class="client-name">{{ client.firstname }} {{ client.lastname }}</span>
              </div>
            </td>
            <td>{{ client.company || '-' }}</td>
            <td>{{ client.email }}</td>
            <td>{{ client.phone || '-' }}</td>
            <td>
              <span :class="`status-badge status-${client.status}`">
                {{ t(`clients.status.${client.status}`) }}
              </span>
            </td>
            <td>
              <div class="services-list">
                <template v-if="clientServicesMap[client.id] && clientServicesMap[client.id].length">
                  <span class="service-count">
                    ({{ clientServicesMap[client.id].length }})
                  </span>
                </template>
                <span v-else class="no-services">{{ t('clients.no_services') }}</span>
              </div>
            </td>
            <td class="actions">
              <div class="action-buttons">
                <button class="btn-icon" :title="t('clients.actions.view')" @click.stop="viewClientDetails(client.id)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" :title="t('clients.actions.edit')" @click.stop="editClient(client.id)">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  class="btn-icon" 
                  :title="t('clients.actions.delete')" 
                  @click.stop="deleteClient(client.id)"
                >
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
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { useServicesStore } from '@/stores/services'
import { useRealtimeStore } from '@/stores/realtime'

import logger from '@/services/logger'

logger.debug('[CLIENTS VIEW] Initialisation du composant')

const { t } = useI18n()
const router = useRouter()
const clientsStore = useClientsStore()
const servicesStore = useServicesStore()
const realtimeStore = useRealtimeStore()

// État
const sortBy = ref('name')
const sortDesc = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const serviceTypeFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const clientServicesMap = ref<Record<number, any[]>>({})

// Watched for automatic filtering
watch([searchQuery, statusFilter, serviceTypeFilter], () => {
  currentPage.value = 1
})

// Computed
const filteredAndSortedClients = computed(() => {
  if (!clientsStore.clients.length) return []
  
  let result = [...clientsStore.clients]
  
  // Filtrage par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(client => 
      (client.firstname && client.firstname.toLowerCase().includes(query)) || 
      (client.lastname && client.lastname.toLowerCase().includes(query)) || 
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.company && client.company.toLowerCase().includes(query))
    )
  }
  
  // Filtrage par statut
  if (statusFilter.value) {
    result = result.filter(client => client.status === statusFilter.value)
  }
  
  // Filtrage par type de service
  if (serviceTypeFilter.value) {
    result = result.filter(client => {
      // Récupérer les services du client depuis le cache
      const services = clientServicesMap.value[client.id] || []
      return services.some(service => service.type === serviceTypeFilter.value)
    })
  }
  
  // Tri
  return [...result].sort((a, b) => {
    const aValue = a[sortBy.value]
    const bValue = b[sortBy.value]
    
    if (aValue < bValue) return sortDesc.value ? 1 : -1
    if (aValue > bValue) return sortDesc.value ? -1 : 1
    return 0
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredAndSortedClients.value.length / itemsPerPage.value)
})

const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredAndSortedClients.value.slice(start, end)
})

// Méthodes
const fetchClients = async () => {
  logger.debug('[ClientsView] Composant monté')
  
  try {
    logger.debug('[ClientsView] Chargement des clients...')
    await clientsStore.fetchClients()
    logger.debug(`[ClientsView] Clients chargés: ${clientsStore.clients.length}`)
    
    // Une fois les clients chargés, récupérer les services pour chaque client
    await fetchServicesForClients()
  } catch (error) {
    logger.error('[ClientsView] Erreur lors du chargement des clients', { error })
  }
}

const fetchServicesForClients = async () => {
  try {
    for (const client of clientsStore.clients) {
      try {
        logger.debug(`[ClientsView] Récupération des services pour le client #${client.id}`)
        const response = await servicesStore.fetchClientServices(client.id)
        logger.debug(`[ClientsView] Services récupérés pour le client #${client.id}`, { response })
        
        if (response && response.data) {
          clientServicesMap.value[client.id] = Array.isArray(response.data) ? response.data : [response.data]
        }
      } catch (err) {
        logger.error(`[ClientsView] Erreur lors de la récupération des services pour le client #${client.id}`, { error: err })
        clientServicesMap.value[client.id] = []
      }
    }
  } catch (error) {
    logger.error('[ClientsView] Erreur lors de la récupération des services', { error })
  }
}



const changePage = (page: number) => {
  currentPage.value = page
  // Si besoin, on peut ajouter un scroll vers le haut de la page ici
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewClientDetails = (clientId: number) => {
  router.push({ name: 'client-details', params: { id: clientId.toString() } })
}

const editClient = (clientId: number) => {
  router.push({ name: 'edit-client', params: { id: clientId.toString() } })
}

const handleAddClient = () => {
  router.push({ name: 'create-client' })
}

const deleteClient = async (clientId: number) => {
  if (confirm(t('clients.confirm_delete'))) {
    try {
      await clientsStore.deleteClient(clientId)
      await fetchClients()
    } catch (error) {
      logger.error('[ClientsView] Erreur lors de la suppression du client', { error })
    }
  }
}

/**
 * Initialiser les fonctionnalités temps réel
 */
const initRealtime = () => {
  logger.debug('[ClientsView] Initialisation des fonctionnalités temps réel')
  
  try {
    // S'assurer que le service temps réel est initialisé
    if (!realtimeStore.isInitialized) {
      logger.debug('[ClientsView] Initialisation du store realtime')
      realtimeStore.init()
    }
    
    // Initialiser les écouteurs d'événements pour les clients
    clientsStore.initRealtimeListeners()
    
    logger.info('[ClientsView] Fonctionnalités temps réel initialisées avec succès')
  } catch (error) {
    logger.error('[ClientsView] Erreur lors de l\'initialisation du temps réel', { error })
  }
}

// Cycle de vie
onMounted(async () => {
  await fetchClients()
  // Initialiser le temps réel après le chargement des données
  initRealtime()
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS */
@import '@/assets/css/pages/clients.css';
@import '@/assets/css/components/common-layout.css';

/* Styles additionnels */
.service-count {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: var(--primary-color);
  color: white;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.client-details {
  display: flex;
  flex-direction: column;
}

.client-name {
  font-weight: 600;
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

/* Alignement du texte dans les cellules du tableau */
.data-table th, .data-table td {
  text-align: center;
}

/* Garder l'alignement à gauche pour les colonnes de texte */
.data-table th:nth-child(1),
.data-table th:nth-child(2),
.data-table th:nth-child(3),
.data-table th:nth-child(4),
.data-table th:nth-child(5),
.data-table td:nth-child(1),
.data-table td:nth-child(2),
.data-table td:nth-child(3),
.data-table td:nth-child(4),
.data-table td:nth-child(5) {
  text-align: left;
}
</style>
