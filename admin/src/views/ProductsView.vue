<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import { useProductStore } from '@/stores/products'
import { useNotificationStore } from '@/stores/notifications'
import '@/assets/css/components/common-layout.css'

const { t } = useI18n()
const productStore = useProductStore()
const notificationStore = useNotificationStore()

// État
const products = ref([])
const loading = ref(true)
const showProductModal = ref(false)
const selectedProduct = ref(null)
const filterStatus = ref('all')
const searchQuery = ref('')
const sortBy = ref('name')
const sortDesc = ref(false)
const isEditing = ref(false)
const formErrors = ref({})
const priceRangeFilter = ref('')

// Produit vide pour la création
const emptyProduct = {
  id: null,
  name: '',
  description: '',
  price: 0,
  status: 'active',
  features: []
}

// Colonnes pour le tableau
const columns = [
  { 
    key: 'name', 
    label: t('products.columns.name'),
    sortable: true
  },
  { 
    key: 'description', 
    label: t('products.columns.description'),
    sortable: true,
    formatter: (value) => value.length > 50 ? value.substring(0, 50) + '...' : value
  },
  { 
    key: 'price', 
    label: t('products.columns.price'),
    sortable: true,
    formatter: (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  },
  { 
    key: 'status', 
    label: t('products.columns.status'),
    sortable: true,
    formatter: (value) => {
      if (value === 'active') return `<span class="badge badge-success">${t('products.status.active')}</span>`
      if (value === 'inactive') return `<span class="badge badge-danger">${t('products.status.inactive')}</span>`
      return value
    }
  },
  {
    key: 'actions',
    label: t('common.actions'),
    sortable: false
  }
]

// Filtres pour le tableau
const filters = [
  { value: 'all', label: t('products.filters.all') },
  { value: 'active', label: t('products.filters.active') },
  { value: 'inactive', label: t('products.filters.inactive') }
]

// Données filtrées
const filteredProducts = computed(() => {
  let result = [...products.value]
  
  // Filtrer par statut
  if (filterStatus.value !== 'all') {
    result = result.filter(product => product.status === filterStatus.value)
  }
  
  // Filtrer par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.description.toLowerCase().includes(query)
    )
  }
  
  // Filtrer par prix
  if (priceRangeFilter.value === 'low') {
    result = result.filter(product => product.price < 10)
  } else if (priceRangeFilter.value === 'medium') {
    result = result.filter(product => product.price >= 10 && product.price < 50)
  } else if (priceRangeFilter.value === 'high') {
    result = result.filter(product => product.price >= 50)
  }
  
  return result
})

// Méthodes
const fetchProducts = async () => {
  try {
    loading.value = true
    const data = await productStore.fetchProducts()
    products.value = data
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error)
    notificationStore.add({
      type: 'error',
      message: t('products.errors.fetch')
    })
  } finally {
    loading.value = false
  }
}

const handleSort = (key, desc) => {
  sortBy.value = key
  sortDesc.value = desc
}

const handleSelectProduct = (product) => {
  selectedProduct.value = { ...product }
  isEditing.value = true
  showProductModal.value = true
}

const handleAddProduct = () => {
  selectedProduct.value = { ...emptyProduct }
  isEditing.value = false
  showProductModal.value = true
}

const handleFilterChange = (status) => {
  filterStatus.value = status
}

const validateForm = () => {
  const errors = {}
  
  if (!selectedProduct.value.name) {
    errors.name = t('products.validation.name_required')
  }
  
  if (!selectedProduct.value.description) {
    errors.description = t('products.validation.description_required')
  }
  
  if (selectedProduct.value.price < 0) {
    errors.price = t('products.validation.price_positive')
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSaveProduct = async () => {
  if (!validateForm()) {
    return
  }
  
  try {
    if (isEditing.value) {
      await productStore.updateProduct(selectedProduct.value)
      notificationStore.add({
        type: 'success',
        message: t('products.success.update')
      })
    } else {
      await productStore.createProduct(selectedProduct.value)
      notificationStore.add({
        type: 'success',
        message: t('products.success.create')
      })
    }
    
    showProductModal.value = false
    fetchProducts()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du produit:', error)
    notificationStore.add({
      type: 'error',
      message: isEditing.value ? t('products.errors.update') : t('products.errors.create')
    })
  }
}

const handleDeleteProduct = async (product) => {
  if (!confirm(t('products.confirm.delete'))) {
    return
  }
  
  try {
    await productStore.deleteProduct(product.id)
    notificationStore.add({
      type: 'success',
      message: t('products.success.delete')
    })
    fetchProducts()
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error)
    notificationStore.add({
      type: 'error',
      message: t('products.errors.delete')
    })
  }
}

const addFeature = () => {
  if (!selectedProduct.value.features) {
    selectedProduct.value.features = []
  }
  selectedProduct.value.features.push({ name: '', included: true })
}

const removeFeature = (index) => {
  selectedProduct.value.features.splice(index, 1)
}

const applyFilters = () => {
  // Réinitialiser les filtres
  filterStatus.value = 'all'
  searchQuery.value = ''
  priceRangeFilter.value = ''
}

// Cycle de vie
onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="products-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ t('products.title') }}</h1>
        <span class="page-description">{{ t('products.description') }}</span>
      </div>
      <button class="btn btn-primary" @click="handleAddProduct">
        <i class="fas fa-plus" />
        {{ t('products.actions.add') }}
      </button>
    </div>
    
    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ t('products.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="filter-input" 
              :placeholder="t('products.search.placeholder')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('products.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-box"></i>
            <select v-model="filterStatus" class="filter-input">
              <option value="all">{{ t('products.filters.all') }}</option>
              <option value="active">{{ t('products.filters.active') }}</option>
              <option value="inactive">{{ t('products.filters.inactive') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('products.filters.price_range') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-tag"></i>
            <select v-model="priceRangeFilter" class="filter-input">
              <option value="">{{ t('products.filters.all_prices') }}</option>
              <option value="low">{{ t('products.filters.price_low') }}</option>
              <option value="medium">{{ t('products.filters.price_medium') }}</option>
              <option value="high">{{ t('products.filters.price_high') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">&nbsp;</label>
          <div class="filter-input-wrapper">
            <button @click="applyFilters" class="btn btn-gradient filter-button">
              <i class="fas fa-filter"></i>
              {{ t('products.filters.apply') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>
    <div v-else-if="filteredProducts && filteredProducts.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-box"></i>
      </div>
      <h3>{{ t('products.empty.title') }}</h3>
      <p>{{ t('products.empty.description') }}</p>
    </div>
    <div v-else class="table-box">
      <DataTable
        :columns="columns"
        :data="filteredProducts"
        :loading="loading"
        :sort-by="sortBy"
        :sort-desc="sortDesc"
        @sort="handleSort"
      >
        <template #cell-actions="{ item }">
          <div class="actions">
            <button class="btn btn-sm btn-primary" @click="handleSelectProduct(item)">
              <i class="fas fa-edit" />
              {{ t('common.edit') }}
            </button>
            <button class="btn btn-sm btn-danger" @click="handleDeleteProduct(item)">
              <i class="fas fa-trash" />
              {{ t('common.delete') }}
            </button>
          </div>
        </template>
        
        <template #empty>
          <div class="empty-state">
            <i class="fas fa-box fa-3x" />
            <p>{{ t('products.empty.message') }}</p>
            <button class="btn btn-primary" @click="handleAddProduct">
              {{ t('products.empty.action') }}
            </button>
          </div>
        </template>
      </DataTable>
    </div>
    
    <Modal
      v-if="showProductModal"
      :title="isEditing ? t('products.modal.edit_title') : t('products.modal.add_title')"
      @close="showProductModal = false"
      class="modal-box"
    >
      <form @submit.prevent="handleSaveProduct">
        <div class="form-group">
          <label class="form-label">{{ t('products.fields.name') }}</label>
          <input 
            type="text" 
            v-model="selectedProduct.name" 
            class="form-control" 
            :class="{ 'is-invalid': formErrors.name }"
          />
          <div v-if="formErrors.name" class="invalid-feedback">{{ formErrors.name }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products.fields.description') }}</label>
          <textarea 
            v-model="selectedProduct.description" 
            class="form-control" 
            rows="3"
            :class="{ 'is-invalid': formErrors.description }"
          ></textarea>
          <div v-if="formErrors.description" class="invalid-feedback">{{ formErrors.description }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products.fields.price') }}</label>
          <div class="input-group">
            <span class="input-group-text">€</span>
            <input 
              type="number" 
              v-model.number="selectedProduct.price" 
              class="form-control" 
              step="0.01"
              :class="{ 'is-invalid': formErrors.price }"
            />
            <div v-if="formErrors.price" class="invalid-feedback">{{ formErrors.price }}</div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products.fields.status') }}</label>
          <select v-model="selectedProduct.status" class="form-select">
            <option value="active">{{ t('products.status.active') }}</option>
            <option value="inactive">{{ t('products.status.inactive') }}</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products.fields.features') }}</label>
          <div class="features-list">
            <div v-for="(feature, index) in selectedProduct.features" :key="index" class="feature-item">
              <div class="input-group">
                <input 
                  type="text" 
                  v-model="feature.name" 
                  class="form-control" 
                  :placeholder="t('products.fields.feature_name')"
                />
                <div class="input-group-append">
                  <button type="button" class="btn btn-danger" @click="removeFeature(index)">
                    <i class="fas fa-times" />
                  </button>
                </div>
              </div>
              <div class="form-check mt-1">
                <input 
                  type="checkbox" 
                  v-model="feature.included" 
                  class="form-check-input" 
                  :id="`feature-included-${index}`"
                />
                <label class="form-check-label" :for="`feature-included-${index}`">
                  {{ t('products.fields.feature_included') }}
                </label>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-primary mt-2" @click="addFeature">
              <i class="fas fa-plus" />
              {{ t('products.actions.add_feature') }}
            </button>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showProductModal = false">
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
@import '@/assets/css/pages/products.css';
</style>
