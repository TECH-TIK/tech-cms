<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/products'
import ProductGroupModal from '@/components/products/ProductGroupModal.vue'
import { useNotificationStore } from '@/stores/notifications'
import { useProductGroupsStore, type ProductGroup } from '@/stores/product-groups'

// Traduction
const { t } = useI18n()
const router = useRouter()

// Store
const productStore = useProductStore()
const notificationStore = useNotificationStore()
const productGroupsStore = useProductGroupsStore()

// État
const products = ref([])
const isLoading = ref(true)
const showGroupModal = ref(false)
const selectedGroup = ref(null)
const filterStatus = ref('all')
const filterType = ref('all')
const filterTypeOptions = [
  { value: 'all', label: t('products_services.filters.all_types') },
  { value: 'reseller_hosting', label: t('products_services.types.reseller') },
  { value: 'dedicated_server', label: t('products_services.types.dedicated') },
  { value: 'vps', label: t('products_services.types.vps') },
  { value: 'shared_hosting', label: t('products_services.types.shared') }
]
const filterGroup = ref('all')
const searchQuery = ref('')
const priceRangeFilter = ref('')
const sortBy = ref('name')
const sortDesc = ref(false)
const sortDirection = ref('DESC')
const editingGroup = ref(false)

// Produit vide pour la création
const emptyProduct = {
  id: null,
  name: '',
  description: '',
  price: 0,
  setup_fee: 0,
  recurring: 0,
  billing_cycle: 'monthly',
  status: 'active',
  product_type: 'reseller_hosting',
  group_id: null,
  features: [],
  clients: []
}

// Colonnes pour le tableau
const columns = [
  { 
    key: 'name', 
    label: t('products_services.columns.name'),
    sortable: true,
    formatter: (value, row) => {
      return `<span class="product-name">${value}</span>`
    }
  },
  { 
    key: 'description', 
    label: t('products_services.columns.description'),
    sortable: false,
    formatter: (value) => value && value.length > 50 ? value.substring(0, 50) + '...' : (value || '')
  },
  { 
    key: 'product_type', 
    label: t('products_services.columns.type'),
    sortable: true,
    formatter: (value) => {
      const typeMap = {
        'reseller_hosting': t('products_services.types.reseller'),
        'dedicated_server': t('products_services.types.dedicated'),
        'vps': t('products_services.types.vps'),
        'shared_hosting': t('products_services.types.shared')
      }
      return typeMap[value] || value
    }
  },
  { 
    key: 'price', 
    label: t('products_services.columns.price'),
    sortable: true,
    formatter: (value) => `${value} €`
  },
  { 
    key: 'status', 
    label: t('products_services.columns.status'),
    sortable: true,
    formatter: (value) => {
      const statusClasses = {
        active: 'status-active',
        inactive: 'status-inactive',
        maintenance: 'status-maintenance'
      }
      return `<span class="status-badge ${statusClasses[value] || ''}">${t(`products_services.status.${value}`)}</span>`
    }
  },
  { 
    key: 'group', 
    label: t('products_services.columns.group'),
    sortable: true,
    formatter: (value, row) => {
      // Vérifier que row existe et a une propriété group_id avant d'y accéder
      if (!row) return t('products_services.groups.none');
      return row.group_id ? productGroupsStore.getGroupName(row.group_id) : t('products_services.groups.none')
    }
  },
  { 
    key: 'clients', 
    label: t('products_services.columns.clients'),
    sortable: true,
    formatter: (value, row) => {
      if (!row || !row.clients) return '0';
      return Array.isArray(row.clients) ? row.clients.length.toString() : '0'
    }
  },
  {
    key: 'actions',
    label: t('common.actions'),
    sortable: false,
    formatter: (value, row) => {
      return `
        <div class="actions-menu">
          <button class="btn-icon" @click.stop="openEditModal(row)" :title="t('products_services.actions.edit')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" @click.stop="confirmDelete(row)" :title="t('products_services.actions.delete')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `
    }
  }
]

// Computed
const filteredProducts = computed(() => {
  console.log('Calcul des produits filtrés');
  console.log('Produits initiaux:', productStore.allProducts);
  
  let result = [...productStore.allProducts];
  console.log('Copie des produits:', result);
  
  // Filtre par type (utilise product_type au lieu de type)
  if (filterType.value !== 'all') {
    console.log('Filtrage par type:', filterType.value);
    result = result.filter(item => item.product_type === filterType.value);
  } else {
    // N'applique pas de filtre par défaut, affiche tous les produits
    console.log('Aucun filtrage par type');
  }
  console.log('Après filtrage par type:', result);
  
  // Filtre par statut
  if (filterStatus.value !== 'all') {
    console.log('Filtrage par statut:', filterStatus.value);
    result = result.filter(item => item.status === filterStatus.value);
  }
  console.log('Après filtrage par statut:', result);
  
  // Filtre par groupe
  if (filterGroup.value !== 'all') {
    console.log('Filtrage par groupe:', filterGroup.value);
    if (filterGroup.value === 'none') {
      // Vérifier que l'item existe avant d'accéder à group_id
      result = result.filter(item => item && !item.group_id);
    } else {
      // Vérifier que l'item existe avant d'accéder à group_id
      result = result.filter(item => item && item.group_id === filterGroup.value);
    }
  }
  console.log('Après filtrage par groupe:', result);
  
  // Filtre par recherche
  if (searchQuery.value) {
    console.log('Filtrage par recherche:', searchQuery.value);
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query)
    );
  }
  console.log('Après filtrage par recherche:', result);
  
  // Filtre par prix
  if (priceRangeFilter.value) {
    console.log('Filtrage par prix:', priceRangeFilter.value);
    const [min, max] = priceRangeFilter.value.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      result = result.filter(item => item.price >= min && item.price <= max);
    }
  }
  console.log('Après filtrage par prix:', result);
  
  console.log('Résultat final du filtrage:', result);
  return result;
})

// Watching filters for auto-apply
watch([filterStatus, filterType, filterGroup, searchQuery, priceRangeFilter], () => {
  console.log('Auto-applying filters')
  // Les filtres sont appliqués automatiquement via les propriétés calculées
})

// Méthodes
const fetchData = async () => {
  try {
    isLoading.value = true
    await productStore.fetchProducts()
    await productGroupsStore.fetchProductGroups()
    products.value = productStore.allProducts
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error)
    notificationStore.showNotification({
      type: 'error',
      message: t('products_services.errors.fetch')
    })
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  router.push('/products/create')
}

const openEditModal = (product) => {
  router.push(`/products/${product.id}`)
}

const confirmDelete = async (product) => {
  if (confirm(t('products_services.confirm_delete'))) {
    try {
      await productStore.deleteProduct(product.id)
      notificationStore.showNotification({
        type: 'success',
        message: t('products_services.success.delete')
      })
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error)
      notificationStore.showNotification({
        type: 'error',
        message: t('products_services.errors.delete')
      })
    }
  }
}

const resetFilters = () => {
  filterStatus.value = 'all'
  filterType.value = 'all'
  filterGroup.value = 'all'
  searchQuery.value = ''
  priceRangeFilter.value = ''
}

const handleSort = (column) => {
  if (sortBy.value === column) {
    // Si on clique sur la même colonne, on inverse la direction
    sortDirection.value = sortDirection.value === 'ASC' ? 'DESC' : 'ASC'
    sortDesc.value = sortDirection.value === 'DESC'
  } else {
    // Sinon, on trie par la nouvelle colonne en ordre descendant par défaut
    sortBy.value = column
    sortDirection.value = 'DESC'
    sortDesc.value = true
  }
}

// Méthodes pour la gestion des groupes
const openCreateGroupModal = () => {
  selectedGroup.value = { name: '', slug: '', description: '' }
  editingGroup.value = false
  showGroupModal.value = true
}

const openEditGroupModal = (group) => {
  selectedGroup.value = { ...group }
  editingGroup.value = true
  showGroupModal.value = true
}

const handleSaveGroup = async () => {
  try {
    if (editingGroup.value) {
      await productGroupsStore.updateProductGroup(selectedGroup.value.id, selectedGroup.value)
      notificationStore.showNotification({
        type: 'success',
        message: t('product_groups.success.update')
      })
    } else {
      await productGroupsStore.createProductGroup(selectedGroup.value)
      notificationStore.showNotification({
        type: 'success',
        message: t('product_groups.success.create')
      })
    }
    showGroupModal.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du groupe:', error)
    notificationStore.showNotification({
      type: 'error',
      message: editingGroup.value 
        ? t('product_groups.errors.update') 
        : t('product_groups.errors.create')
    })
  }
}

const confirmDeleteGroup = async (group) => {
  if (confirm(t('product_groups.confirm_delete'))) {
    try {
      await productGroupsStore.deleteProductGroup(group.id)
      notificationStore.showNotification({
        type: 'success',
        message: t('product_groups.success.delete')
      })
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error)
      notificationStore.showNotification({
        type: 'error',
        message: t('product_groups.errors.delete')
      })
    }
  }
}

// Cycle de vie
onMounted(async () => {
  isLoading.value = true
  try {
    console.log('Début du chargement des produits dans ProductsView')
    await productStore.fetchProducts()
    console.log('Produits récupérés dans ProductsView:', productStore.allProducts)
    await productGroupsStore.fetchProductGroups()
    console.log('Groupes de produits récupérés:', productGroupsStore.productGroups)
    console.log('Produits filtrés:', filteredProducts.value)
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error)
    notificationStore.showError(t('products.errors.load_failed'))
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="products-view view-container">
    <div class="header-box">
      <div class="header-content">
        <h1 class="page-title">{{ t('products_services.title') }}</h1>
        <span class="page-description">{{ t('products_services.description') }}</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="openCreateGroupModal">
          <i class="fas fa-folder-plus"></i>
          {{ t('product_groups.add') }}
        </button>
        <router-link to="/products/create" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          {{ t('products_services.add') }}
        </router-link>
      </div>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ t('products_services.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="filter-input" 
              :placeholder="t('products_services.search')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('products_services.filters.type') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-tags"></i>
            <select v-model="filterType" class="filter-input">
              <option v-for="option in filterTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('products_services.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-server"></i>
            <select v-model="filterStatus" class="filter-input">
              <option value="all">{{ t('products_services.status.all') }}</option>
              <option value="active">{{ t('products_services.status.active') }}</option>
              <option value="inactive">{{ t('products_services.status.inactive') }}</option>
              <option value="maintenance">{{ t('products_services.status.maintenance') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('products_services.filters.group') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-users"></i>
            <select v-model="filterGroup" class="filter-input">
              <option value="all">{{ t('products_services.groups.all') }}</option>
              <option value="none">{{ t('products_services.groups.none') }}</option>
              <option v-for="group in productGroupsStore.productGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('products_services.filters.price_range') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-tag"></i>
            <select v-model="priceRangeFilter" class="filter-input">
              <option value="">{{ t('products_services.filters.all_prices') }}</option>
              <option value="0-50">{{ t('products_services.filters.price_low') }}</option>
              <option value="50-200">{{ t('products_services.filters.price_medium') }}</option>
              <option value="200-1000">{{ t('products_services.filters.price_high') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>
    <div v-else-if="filteredProducts && filteredProducts.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-box"></i>
      </div>
      <h3>{{ t('products_services.empty.title') }}</h3>
      <p>{{ t('products_services.empty.description') }}</p>
    </div>
    <div v-else class="table-box">
      <table class="data-table">
        <thead>
          <tr>
            <th @click="handleSort('name')" :class="{ active: sortBy === 'name' }">
              {{ t('products_services.columns.name') }}
              <i v-if="sortBy === 'name'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th>{{ t('products_services.columns.description') }}</th>
            <th @click="handleSort('product_type')" :class="{ active: sortBy === 'product_type' }">
              {{ t('products_services.columns.type') }}
              <i v-if="sortBy === 'product_type'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th @click="handleSort('price')" :class="{ active: sortBy === 'price' }">
              {{ t('products_services.columns.price') }}
              <i v-if="sortBy === 'price'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th @click="handleSort('status')" :class="{ active: sortBy === 'status' }">
              {{ t('products_services.columns.status') }}
              <i v-if="sortBy === 'status'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th>{{ t('products_services.columns.group') }}</th>
            <th>{{ t('products_services.columns.clients') }}</th>
            <th>{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id" @click="openEditModal(product)">
            <td><span class="product-name">{{ product.name }}</span></td>
            <td>{{ product.description && product.description.length > 50 ? product.description.substring(0, 50) + '...' : (product.description || '') }}</td>
            <td>
              {{ filterTypeOptions.find(option => option.value === product.product_type)?.label || product.product_type }}
            </td>
            <td>{{ product.price }} €</td>
            <td>
              <span :class="'status-badge status-' + product.status">
                {{ t(`products_services.status.${product.status}`) }}
              </span>
            </td>
            <td>
              {{ product.group_id ? productGroupsStore.getGroupName(product.group_id) : t('products_services.groups.none') }}
            </td>
            <td>
              {{ product.clients && Array.isArray(product.clients) ? product.clients.length : '0' }}
            </td>
            <td class="actions">
              <div class="actions-menu">
                <button class="btn-icon" @click.stop="openEditModal(product)" :title="t('products_services.actions.edit')">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" @click.stop="confirmDelete(product)" :title="t('products_services.actions.delete')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ProductGroupModal
      :show="showGroupModal"
      :edit-mode="editingGroup"
      :group-to-edit="selectedGroup"
      @close="showGroupModal = false"
      @created="fetchData"
      @updated="fetchData"
    />
  </div>
</template>

<style scoped>
@import '@/assets/css/pages/products.css';
@import '@/assets/css/components/common-layout.css';

.products-view {
  width: 100%;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.feature-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.75rem;
  background-color: #f9f9f9;
}

.feature-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.feature-included {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-product {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-service {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-active {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-inactive {
  background-color: #f5f5f5;
  color: #757575;
}

.status-maintenance {
  background-color: #fff8e1;
  color: #ffa000;
}

.group-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.group-none {
  background-color: #f5f5f5;
  color: #757575;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.actions-menu {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-danger {
  background-color: #f44336;
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: #d32f2f;
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
</style>
