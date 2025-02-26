<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import { useServiceStore } from '@/stores/services'
import { useNotificationStore } from '@/stores/notifications'

const { t } = useI18n()
const serviceStore = useServiceStore()
const notificationStore = useNotificationStore()

// État
const services = ref([])
const loading = ref(true)
const showServiceModal = ref(false)
const selectedService = ref(null)
const filterStatus = ref('all')
const searchQuery = ref('')
const priceRangeFilter = ref('')
const sortBy = ref('name')
const sortDesc = ref(false)
const isEditing = ref(false)
const formErrors = ref({})

// Service vide pour la création
const emptyService = {
  id: null,
  name: '',
  description: '',
  price: 0,
  status: 'active',
  features: [],
  clients: []
}

// Colonnes de la table
const columns = [
  { 
    key: 'name', 
    label: t('services.columns.name'),
    sortable: true 
  },
  { 
    key: 'description', 
    label: t('services.columns.description'),
    sortable: false 
  },
  { 
    key: 'price', 
    label: t('services.columns.price'),
    sortable: true,
    formatter: (value) => `${value} €`
  },
  { 
    key: 'status', 
    label: t('services.columns.status'),
    sortable: true,
    formatter: (value) => {
      const statuses = {
        active: t('services.status.active'),
        inactive: t('services.status.inactive'),
        maintenance: t('services.status.maintenance')
      }
      return statuses[value] || value
    }
  },
  { 
    key: 'clients', 
    label: t('services.columns.clients'),
    sortable: true,
    formatter: (value) => value.length
  },
  {
    key: 'actions',
    label: t('common.actions'),
    sortable: false
  }
]

// Computed
const filteredServices = computed(() => {
  let result = [...serviceStore.allServices]
  
  // Filtre par statut
  if (filterStatus.value !== 'all') {
    result = result.filter(s => s.status === filterStatus.value)
  }
  
  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.description.toLowerCase().includes(query)
    )
  }
  
  // Filtre par plage de prix
  if (priceRangeFilter.value) {
    const priceRanges = {
      low: (s) => s.price < 10,
      medium: (s) => s.price >= 10 && s.price < 50,
      high: (s) => s.price >= 50
    }
    result = result.filter(priceRanges[priceRangeFilter.value])
  }
  
  return result
})

// Méthodes
const fetchServices = async () => {
  try {
    loading.value = true
    await serviceStore.fetchServices()
    services.value = serviceStore.allServices
  } catch (error) {
    console.error('Erreur lors du chargement des services:', error)
    notificationStore.addNotification({
      type: 'error',
      title: t('services.errors.fetch'),
      message: t('services.errors.fetchMessage')
    })
  } finally {
    loading.value = false
  }
}

const handleSort = (key, desc) => {
  sortBy.value = key
  sortDesc.value = desc
}

const handleSelectService = (service) => {
  selectedService.value = { ...service }
  isEditing.value = true
  showServiceModal.value = true
}

const handleAddService = () => {
  selectedService.value = { ...emptyService }
  isEditing.value = false
  showServiceModal.value = true
}

const handleFilterChange = (status) => {
  filterStatus.value = status
  services.value = filteredServices.value
}

const validateForm = () => {
  const errors = {}
  
  if (!selectedService.value.name) {
    errors.name = t('services.validation.nameRequired')
  }
  
  if (selectedService.value.price < 0) {
    errors.price = t('services.validation.pricePositive')
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSaveService = async () => {
  if (!validateForm()) return
  
  try {
    loading.value = true
    
    if (isEditing.value) {
      await serviceStore.updateService(selectedService.value)
      notificationStore.addNotification({
        type: 'success',
        title: t('services.success.update'),
        message: t('services.success.updateMessage', { name: selectedService.value.name })
      })
    } else {
      await serviceStore.createService(selectedService.value)
      notificationStore.addNotification({
        type: 'success',
        title: t('services.success.create'),
        message: t('services.success.createMessage', { name: selectedService.value.name })
      })
    }
    
    showServiceModal.value = false
    services.value = filteredServices.value
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du service:', error)
    notificationStore.addNotification({
      type: 'error',
      title: isEditing.value ? t('services.errors.update') : t('services.errors.create'),
      message: t('services.errors.saveMessage')
    })
  } finally {
    loading.value = false
  }
}

const handleDeleteService = async (service) => {
  if (!confirm(t('services.confirm.delete', { name: service.name }))) return
  
  try {
    loading.value = true
    await serviceStore.deleteService(service.id)
    services.value = filteredServices.value
    
    notificationStore.addNotification({
      type: 'success',
      title: t('services.success.delete'),
      message: t('services.success.deleteMessage', { name: service.name })
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error)
    notificationStore.addNotification({
      type: 'error',
      title: t('services.errors.delete'),
      message: t('services.errors.deleteMessage')
    })
  } finally {
    loading.value = false
  }
}

const addFeature = () => {
  if (!selectedService.value.features) {
    selectedService.value.features = []
  }
  selectedService.value.features.push({ name: '', included: true })
}

const removeFeature = (index) => {
  selectedService.value.features.splice(index, 1)
}

const applyFilters = () => {
  services.value = filteredServices.value
}

// Cycle de vie
onMounted(() => {
  fetchServices()
})
</script>

<template>
  <div class="services-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ t('services.title') }}</h1>
        <span class="page-description">{{ t('services.description') }}</span>
      </div>
      <button class="btn btn-primary" @click="handleAddService">
        <i class="fas fa-plus" />
        {{ t('services.add') }}
      </button>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ t('services.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="filter-input" 
              :placeholder="t('services.search')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('services.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-server"></i>
            <select v-model="filterStatus" class="filter-input">
              <option value="all">{{ t('services.status.all') }}</option>
              <option value="active">{{ t('services.status.active') }}</option>
              <option value="inactive">{{ t('services.status.inactive') }}</option>
              <option value="maintenance">{{ t('services.status.maintenance') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('services.filters.price_range') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-tag"></i>
            <select v-model="priceRangeFilter" class="filter-input">
              <option value="">{{ t('services.filters.all_prices') }}</option>
              <option value="low">{{ t('services.filters.price_low') }}</option>
              <option value="medium">{{ t('services.filters.price_medium') }}</option>
              <option value="high">{{ t('services.filters.price_high') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">&nbsp;</label>
          <div class="filter-input-wrapper">
            <button @click="applyFilters" class="btn btn-gradient filter-button">
              <i class="fas fa-filter"></i>
              {{ t('services.filters.apply') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>
    <div v-else-if="filteredServices && filteredServices.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-box"></i>
      </div>
      <h3>{{ t('services.empty.title') }}</h3>
      <p>{{ t('services.empty.description') }}</p>
    </div>
    <div v-else class="table-box">
      <DataTable
        :columns="columns"
        :data="filteredServices"
        :loading="loading"
        :sort-by="sortBy"
        :sort-desc="sortDesc"
        @sort="handleSort"
        @row-click="handleSelectService"
      >
        <template #cell(actions)="{ row }">
          <div class="action-buttons">
            <button class="btn btn-icon" @click.stop="handleSelectService(row)">
              <i class="fas fa-edit" />
            </button>
            <button class="btn btn-icon btn-danger" @click.stop="handleDeleteService(row)">
              <i class="fas fa-trash" />
            </button>
          </div>
        </template>
        
        <template #cell(status)="{ row }">
          <span :class="`status-badge status-${row.status}`">
            {{ t(`services.status.${row.status}`) }}
          </span>
        </template>
      </DataTable>
    </div>

    <Modal
      v-if="showServiceModal"
      :title="isEditing ? t('services.edit_title') : t('services.add_title')"
      @close="showServiceModal = false"
      class="modal-box"
    >
      <form @submit.prevent="handleSaveService">
        <div class="form-group">
          <label class="form-label">{{ t('services.fields.name') }}</label>
          <input 
            type="text" 
            class="form-control"
            v-model="selectedService.name"
            :class="{ 'is-invalid': formErrors.name }"
            required
          />
          <div v-if="formErrors.name" class="invalid-feedback">
            {{ formErrors.name }}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('services.fields.description') }}</label>
          <textarea 
            class="form-control"
            v-model="selectedService.description"
            rows="4"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('services.fields.price') }}</label>
            <input 
              type="number" 
              class="form-control"
              v-model="selectedService.price"
              :class="{ 'is-invalid': formErrors.price }"
              step="0.01"
              required
            />
            <div v-if="formErrors.price" class="invalid-feedback">
              {{ formErrors.price }}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('services.fields.status') }}</label>
            <select 
              class="form-control"
              v-model="selectedService.status"
            >
              <option value="active">{{ t('services.status.active') }}</option>
              <option value="inactive">{{ t('services.status.inactive') }}</option>
              <option value="maintenance">{{ t('services.status.maintenance') }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('services.fields.features') }}</label>
          <div class="features-list">
            <div 
              v-for="(feature, index) in selectedService.features" 
              :key="index"
              class="feature-item"
            >
              <div class="feature-controls">
                <input 
                  type="text" 
                  class="form-control"
                  v-model="feature.name"
                  :placeholder="t('services.fields.featureName')"
                />
                <div class="feature-included">
                  <input 
                    type="checkbox" 
                    v-model="feature.included"
                    :id="`feature-${index}`"
                  />
                  <label :for="`feature-${index}`">{{ t('services.fields.included') }}</label>
                </div>
                <button 
                  type="button"
                  class="btn btn-icon btn-danger"
                  @click="removeFeature(index)"
                >
                  <i class="fas fa-times" />
                </button>
              </div>
            </div>
            
            <button 
              type="button"
              class="btn btn-outline btn-sm"
              @click="addFeature"
            >
              <i class="fas fa-plus" />
              {{ t('services.fields.addFeature') }}
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="showServiceModal = false">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary">
            {{ t('common.save') }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
@import '@/assets/css/pages/services.css';
@import '@/assets/css/components/common-layout.css';
</style>
