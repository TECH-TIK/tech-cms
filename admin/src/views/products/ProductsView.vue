<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ApiService } from '@/services/api'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/products'
import ProductGroupModal from '@/components/products/ProductGroupModal.vue'

import { useNotificationStore } from '@/stores/notifications'
import { useProductGroupsStore, type ProductGroup } from '@/stores/product-groups'
import logger from '@/services/logger'
import type { Product } from '@/types/product'

// Interface étendue de Product pour gérer la propriété clients utilisée dans le template
interface ProductWithClients extends Product {
  clients?: Array<any>;
}

// Traduction
const { t } = useI18n()
const router = useRouter()

// Store
const productStore = useProductStore()
const notificationStore = useNotificationStore()
const productGroupsStore = useProductGroupsStore()

// État

const isLoading = ref(true)
const showGroupModal = ref(false)
const selectedGroup = ref<ProductGroup | undefined>(undefined)
const filterStatus = ref('all')
const filterType = ref('all')
// Options de base pour les types de produits
interface FilterOption {
  value: string;
  label: string;
  isModuleType?: boolean;
}

const filterTypeOptions = ref<FilterOption[]>([
  { value: 'all', label: t('products_services.filters.all_types') },
  { value: 'reseller_hosting', label: t('products_services.types.reseller') },
  { value: 'dedicated_server', label: t('products_services.types.dedicated') },
  { value: 'vps', label: t('products_services.types.vps') },
  { value: 'shared_hosting', label: t('products_services.types.shared') }
])

// Modules disponibles pour les produits
const filterGroup = ref('all')
const searchQuery = ref('')
const priceRangeFilter = ref('')
const sortBy = ref('name')
const sortDesc = ref(false)
const sortDirection = ref('DESC')
const editingGroup = ref(false)



// Computed
const filteredProducts = computed<ProductWithClients[]>(() => {
  logger.debug('Calcul des produits filtrés', { allProducts: productStore.allProducts });
  
  let result = [...productStore.allProducts];
  
  // Filtre par type (utilise product_type au lieu de type)
  if (filterType.value !== 'all') {
    logger.debug('Filtrage par type', { filter: filterType.value });
    result = result.filter(item => item.product_type === filterType.value);
  } else {
    logger.debug('Aucun filtrage par type');
  }
  
  // Filtre par statut
  if (filterStatus.value !== 'all') {
    logger.debug('Filtrage par statut', { filter: filterStatus.value });
    result = result.filter(item => item.status === filterStatus.value);
  }
  
  // Filtre par groupe
  if (filterGroup.value !== 'all') {
    logger.debug('Filtrage par groupe', { filter: filterGroup.value });
    if (filterGroup.value === 'none') {
      // Vérifier que l'item existe avant d'accéder à group_id
      result = result.filter(item => item && !item.group_id);
    } else {
      // Vérifier que l'item existe avant d'accéder à group_id et convertir l'ID en string pour la comparaison
      result = result.filter(item => item && item.group_id?.toString() === filterGroup.value);
    }
  }
  
  // Filtre par recherche
  if (searchQuery.value) {
    logger.debug('Filtrage par recherche', { query: searchQuery.value });
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.name.toLowerCase().includes(query) || 
      (item.description?.toLowerCase().includes(query) ?? false)
    );
  }
  
  // Filtre par prix
  if (priceRangeFilter.value) {
    logger.debug('Filtrage par prix', { range: priceRangeFilter.value });
    const [min, max] = priceRangeFilter.value.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      result = result.filter(item => 
        (typeof item.price === 'number') && 
        item.price >= min && 
        item.price <= max
      );
    }
  }
  
  logger.debug('Résultat final du filtrage', { result });
  return result;
})



// Fonction pour récupérer les modules disponibles
const fetchAvailableModules = async () => {
  try {
    const response = await ApiService.routes.admin.system.module.list('servers')
    const data = response.data
    
    if (data.success && data.data && data.data.servers) {
      // Ajouter les modules aux options de type de produit
      Object.entries(data.data.servers).forEach(([moduleName, moduleData]) => {
        // Cast moduleData à un type avec les propriétés attendues
        const module = moduleData as { active: boolean; name: string };
        // Vérifier si le module est actif avant de l'ajouter
        if (module.active) {
          filterTypeOptions.value.push({
            value: `module_${moduleName}`, // Préfixe 'module_' pour distinguer des types standards
            label: module.name,
            isModuleType: true // Marquer comme un module pour traitement spécial
          })
        }
      })
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des modules', { error })
    notificationStore.showNotification({
      title: t('common.error'),
      type: 'error',
      message: t('products_services.errors.modules_load')
    })
  }
}

// Méthodes
const fetchData = async () => {
  try {
    isLoading.value = true
    
    // Récupérer les modules disponibles en premier
    await fetchAvailableModules()
    
    // Puis récupérer les produits et groupes
    await productStore.fetchProducts()
    await productGroupsStore.fetchProductGroups()
    
    // Vérifier si un type de module est spécifié dans l'URL
    const urlParams = new URLSearchParams(window.location.search)
    const moduleType = urlParams.get('moduleType')
    
    if (moduleType) {
      // Présélectionner ce type de module
      filterType.value = `module_${moduleType}`
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération des données', { error })
    notificationStore.showNotification({
      title: t('common.error'),
      type: 'error',
      message: t('products_services.errors.fetch')
    })
  } finally {
    isLoading.value = false
  }
}


const openEditModal = (product: ProductWithClients) => {
  router.push(`/products/${product.id}`)
}

const confirmDelete = async (product: ProductWithClients) => {
  if (confirm(t('products_services.confirm_delete'))) {
    try {
      // Supprime le produit sans générer de notification côté client
      // La notification sera générée par le serveur avec le nom du produit
      await productStore.deleteProduct(product.id)
    } catch (error) {
      logger.error('Erreur lors de la suppression du produit', { error })
      notificationStore.showNotification({
        title: t('common.error'),
        type: 'error',
        message: t('products_services.errors.delete')
      })
    }
  }
}


const handleSort = (column: string) => {
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
  selectedGroup.value = { name: '', slug: '', description: '' } as ProductGroup
  editingGroup.value = false
  showGroupModal.value = true
}


// Écouteur pour les mises à jour en temps réel
watch(() => productStore.lastRealtimeEvent, (newEvent) => {
  if (!newEvent) return
  
  logger.info('[PRODUCTS VIEW] Événement temps réel détecté', { 
    action: newEvent.action, 
    product_id: newEvent.product?.id || 'non spécifié' 
  })

  // Afficher une notification selon le type d'événement
  if (newEvent.action === 'create') {
    notificationStore.showNotification({
      type: 'success',
      title: t('products_services.realtime.new_title'),
      message: t('products_services.realtime.new_message', { name: newEvent.product?.name || 'Nouveau produit' })
    })
  } else if (newEvent.action === 'update') {
    notificationStore.showNotification({
      type: 'info',
      title: t('products_services.realtime.updated_title'),
      message: t('products_services.realtime.updated_message', { name: newEvent.product?.name || 'Produit' })
    })
  } else if (newEvent.action === 'delete') {
    notificationStore.showNotification({
      type: 'warning',
      title: t('products_services.realtime.deleted_title'),
      message: t('products_services.realtime.deleted_message', { name: newEvent.product?.name || 'Produit' })
    })
  }
})

// Cycle de vie
onMounted(async () => {
  isLoading.value = true
  try {
    logger.debug('Début du chargement des produits dans ProductsView')
    await productStore.fetchProducts()
    logger.debug('Produits récupérés dans ProductsView', { products: productStore.allProducts })
    await productGroupsStore.fetchProductGroups()
    logger.debug('Groupes de produits récupérés', { groups: productGroupsStore.productGroups })
    logger.debug('Produits filtrés initialement', { filtered: filteredProducts.value })
    
    // Initialiser les écouteurs d'événements en temps réel
    productStore.initRealtimeListeners()
    logger.info('[PRODUCTS VIEW] Écouteurs temps réel initialisés')
  } catch (error) {
    logger.error('Erreur lors du chargement des produits', { error })
    notificationStore.showError(t('products_services.errors.load_failed'))
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
              v-model="searchQuery" 
              type="text" 
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
            <th :class="{ active: sortBy === 'name' }" @click="handleSort('name')">
              {{ t('products_services.columns.name') }}
              <i v-if="sortBy === 'name'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th>{{ t('products_services.columns.description') }}</th>
            <th :class="{ active: sortBy === 'product_type' }" @click="handleSort('product_type')">
              {{ t('products_services.columns.type') }}
              <i v-if="sortBy === 'product_type'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th :class="{ active: sortBy === 'price' }" @click="handleSort('price')">
              {{ t('products_services.columns.price') }}
              <i v-if="sortBy === 'price'" :class="sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
            </th>
            <th :class="{ active: sortBy === 'status' }" @click="handleSort('status')">
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
              {{ Array.isArray(product.clients) ? product.clients.length : '0' }}
            </td>
            <td class="actions">
              <div class="actions-menu">
                <button class="btn-icon" :title="t('products_services.actions.edit')" @click.stop="openEditModal(product)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" :title="t('products_services.actions.delete')" @click.stop="confirmDelete(product)">
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
