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
              type="text" 
              v-model="searchQuery" 
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

        <div class="filter-group">
          <label class="filter-label">&nbsp;</label>
          <div class="filter-input-wrapper">
            <button @click="applyFilters" class="btn btn-gradient filter-button">
              <i class="fas fa-filter"></i>
              {{ t('clients.filters.filter_button') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des clients -->
    <div v-if="clientsStore.loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>
    
    <div v-else-if="filteredClients.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-users"></i>
      </div>
      <h3 class="empty-title">{{ t('clients.empty.title') }}</h3>
      <p class="empty-description">{{ t('clients.empty.description') }}</p>
    </div>
    
    <div v-else class="table-box">
      <table class="w-full">
        <thead class="table-header">
          <tr>
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
          <tr v-for="client in filteredClients" :key="client.id">
            <td>
              <div class="client-info">
                <img :src="`https://www.gravatar.com/avatar/${md5(client.email.toLowerCase())}?s=40&d=mp`" alt="Avatar" class="client-avatar">
                <div class="client-details">
                  <span class="client-name">{{ client.firstname }} {{ client.lastname }}</span>
                  <span class="client-id">#{{ client.id }}</span>
                </div>
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
                <template v-if="client.services && client.services.length">
                  <span v-for="service in client.services" :key="service.id" class="service-badge">
                    {{ t(`clients.services.${service.type}`) }}
                  </span>
                </template>
                <span v-else class="no-services">{{ t('clients.no_services') }}</span>
              </div>
            </td>
            <td>
              <div class="actions-menu">
                <button @click="openViewClientModal(client)" class="action-link" :title="t('clients.actions.view')">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="openEditClientModal(client)" class="action-link" :title="t('clients.actions.edit')">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  class="action-link text-danger" 
                  @click="deleteClient(client.id)" 
                  :title="t('clients.actions.delete')"
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
        @click="changePage(page)" 
        :class="['page-link', { active: page === currentPage }]"
      >
        {{ page }}
      </a>
    </div>

    <!-- Modal Ajout/Édition Client -->
    <div v-if="showClientModal" class="modal">
      <div class="modal-backdrop" @click="showClientModal = false"></div>
      <div class="modal-content modal-box">
        <div class="modal-header">
          <h3>{{ selectedClient ? t('clients.form.title_edit') : t('clients.form.title_add') }}</h3>
          <button type="button" class="close" @click="showClientModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div class="form-section">
              <!-- Informations de base -->
              <div class="form-row">
                <div class="form-group">
                  <label for="firstname">{{ t('clients.form.firstname') }}</label>
                  <input type="text" id="firstname" v-model="form.firstname" class="form-input" required>
                </div>
                <div class="form-group">
                  <label for="lastname">{{ t('clients.form.lastname') }}</label>
                  <input type="text" id="lastname" v-model="form.lastname" class="form-input" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="email">{{ t('clients.form.email') }}</label>
                  <input type="email" id="email" v-model="form.email" class="form-input" required>
                </div>
                <div class="form-group">
                  <label for="phone">{{ t('clients.form.phone') }}</label>
                  <input type="tel" id="phone" v-model="form.phone" class="form-input">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="company">{{ t('clients.form.company') }}</label>
                  <input type="text" id="company" v-model="form.company" class="form-input">
                </div>
                <div class="form-group">
                  <label for="status">{{ t('clients.form.status') }}</label>
                  <select id="status" v-model="form.status" class="form-input" required>
                    <option value="active">{{ t('clients.status.active') }}</option>
                    <option value="inactive">{{ t('clients.status.inactive') }}</option>
                    <option value="pending">{{ t('clients.status.pending') }}</option>
                  </select>
                </div>
              </div>

              <!-- Adresse -->
              <div class="form-row">
                <div class="form-group">
                  <label for="address">{{ t('clients.form.address') }}</label>
                  <input type="text" id="address" v-model="form.address" class="form-input">
                </div>
              </div>

              <div class="form-row postal-city">
                <div class="form-group">
                  <label for="postal_code">{{ t('clients.form.postal_code') }}</label>
                  <input type="text" id="postal_code" v-model="form.postal_code" class="form-input">
                </div>
                <div class="form-group">
                  <label for="city">{{ t('clients.form.city') }}</label>
                  <input type="text" id="city" v-model="form.city" class="form-input">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="country">{{ t('clients.form.country') }}</label>
                  <input type="text" id="country" v-model="form.country" class="form-input">
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showClientModal = false">{{ t('clients.form.cancel') }}</button>
            <button type="submit" class="btn btn-primary">{{ t('clients.form.submit') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Vue Client -->
    <div v-if="showViewModal" class="modal">
      <div class="modal-backdrop" @click="showViewModal = false"></div>
      <div class="modal-content modal-box">
        <div class="modal-header">
          <h3>{{ t('clients.view.title') }}</h3>
          <button type="button" class="close" @click="showViewModal = false">&times;</button>
        </div>
        <div class="modal-body" v-if="viewClient">
          <div class="client-view-details">
            <div class="client-view-section">
              <h4>{{ t('clients.view.basic_info') }}</h4>
              <div class="client-view-grid">
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.firstname') }}</span>
                  <span class="client-view-value">{{ viewClient.firstname }}</span>
                </div>
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.lastname') }}</span>
                  <span class="client-view-value">{{ viewClient.lastname }}</span>
                </div>
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.email') }}</span>
                  <span class="client-view-value">{{ viewClient.email }}</span>
                </div>
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.phone') }}</span>
                  <span class="client-view-value">{{ viewClient.phone || '-' }}</span>
                </div>
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.company') }}</span>
                  <span class="client-view-value">{{ viewClient.company || '-' }}</span>
                </div>
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.status') }}</span>
                  <span :class="`status-badge status-${viewClient.status}`">
                    {{ t(`clients.status.${viewClient.status}`) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="client-view-section">
              <h4>{{ t('clients.view.address') }}</h4>
              <div class="client-view-grid">
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.address') }}</span>
                  <span class="client-view-value">{{ viewClient.address || '-' }}</span>
                </div>
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.postal_code') }}</span>
                  <span class="client-view-value">{{ viewClient.postal_code || '-' }}</span>
                </div>
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.city') }}</span>
                  <span class="client-view-value">{{ viewClient.city || '-' }}</span>
                </div>
                <div class="client-view-item">
                  <span class="client-view-label">{{ t('clients.form.country') }}</span>
                  <span class="client-view-value">{{ viewClient.country || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showViewModal = false">{{ t('common.close') }}</button>
          <button type="button" class="btn btn-primary" @click="openEditClientModal(viewClient)">{{ t('clients.actions.edit') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClientsStore } from '@/stores/clients'
import md5 from 'md5'

console.log('[CLIENTS VIEW] Initialisation du composant')

const { t } = useI18n()
const clientsStore = useClientsStore()

// État
const showClientModal = ref(false)
const showViewModal = ref(false)
const selectedClient = ref(null)
const viewClient = ref(null)
const sortBy = ref('name')
const sortDesc = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const serviceTypeFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalPages = ref(1)

const form = ref({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  postal_code: '',
  city: '',
  country: '',
  status: 'active'
})

// Computed
const filteredClients = computed(() => {
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
    result = result.filter(client => 
      client.services && 
      client.services.some(service => service.type === serviceTypeFilter.value)
    )
  }
  
  // Tri
  result.sort((a, b) => {
    const aValue = a[sortBy.value]
    const bValue = b[sortBy.value]
    
    if (aValue < bValue) return sortDesc.value ? 1 : -1
    if (aValue > bValue) return sortDesc.value ? -1 : 1
    return 0
  })
  
  // Calcul du nombre total de pages
  totalPages.value = Math.ceil(result.length / itemsPerPage.value)
  
  // Pagination
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  
  return result.slice(start, end)
})

// Méthodes
const fetchClients = async () => {
  console.log('[ClientsView] Composant monté')
  console.log('[ClientsView] État d\'authentification:', clientsStore.isAuthenticated ? 'Authentifié' : 'Non authentifié')
  
  try {
    console.log('[ClientsView] Chargement des clients...')
    await clientsStore.fetchClients()
    console.log('[ClientsView] Clients chargés:', clientsStore.clients.length)
  } catch (error) {
    console.error('[ClientsView] Erreur lors du chargement des clients:', error)
  }
}

const handleSort = (column: string, desc: boolean) => {
  sortBy.value = column
  sortDesc.value = desc
}

const changePage = (page: number) => {
  currentPage.value = page
  // Si besoin, on peut ajouter un scroll vers le haut de la page ici
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const applyFilters = () => {
  // Réinitialiser la pagination lors de l'application des filtres
  currentPage.value = 1
}

const openViewClientModal = (client: any) => {
  viewClient.value = client
  showViewModal.value = true
}

const openEditClientModal = (client: any) => {
  selectedClient.value = client
  form.value = { ...client }
  showViewModal.value = false
  showClientModal.value = true
}

const handleAddClient = () => {
  selectedClient.value = null
  form.value = {
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    postal_code: '',
    city: '',
    country: '',
    status: 'active'
  }
  showClientModal.value = true
}

const handleSubmit = async () => {
  try {
    if (selectedClient.value) {
      await clientsStore.updateClient(selectedClient.value.id, form.value)
    } else {
      await clientsStore.createClient(form.value)
    }
    
    showClientModal.value = false
    await fetchClients()
  } catch (error) {
    console.error('[ClientsView] Erreur lors de la soumission du formulaire:', error)
  }
}

const deleteClient = async (clientId: number) => {
  if (confirm(t('clients.confirm_delete'))) {
    try {
      await clientsStore.deleteClient(clientId)
      await fetchClients()
    } catch (error) {
      console.error('[ClientsView] Erreur lors de la suppression du client:', error)
    }
  }
}

// Cycle de vie
onMounted(async () => {
  await fetchClients()
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS */
@import '@/assets/css/pages/clients.css';
@import '@/assets/css/components/common-layout.css';
</style>
