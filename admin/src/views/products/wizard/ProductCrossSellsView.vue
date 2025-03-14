<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notifications'
import { useProductStore } from '@/stores/products'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()
const productStore = useProductStore()

// Récupérer le type de produit et les données précédentes
const productType = computed(() => route.params.type as string || 'shared_hosting')
const previousData = computed(() => {
  const savedProductData = localStorage.getItem('currentProductData')
  if (savedProductData) {
    try {
      return JSON.parse(savedProductData)
    } catch (e) {
      console.error('Erreur lors du parsing des données:', e)
      return {}
    }
  }
  return {}
})

// Déterminer si nous sommes en mode édition
const productId = computed(() => {
  const idOrAction = route.params.idOrAction as string
  if (idOrAction && idOrAction !== 'create') {
    return parseInt(idOrAction, 10)
  }
  return null
})

const isEditMode = computed(() => !!productId.value)

// Définition des onglets
const tabs = [
  { id: 'type', label: t('products_services.tabs.type'), icon: 'tag', route: 'create-product' },
  { id: 'details', label: t('products_services.tabs.details'), icon: 'info-circle', route: 'product-details' },
  { id: 'pricing', label: t('products_services.tabs.pricing'), icon: 'money-bill', route: 'product-pricing' },
  { id: 'module', label: t('products_services.tabs.module'), icon: 'puzzle-piece', route: 'product-module' },
  { id: 'custom_fields', label: t('products_services.tabs.custom_fields'), icon: 'list-alt', route: 'product-custom-fields' },
  { id: 'configurable_options', label: t('products_services.tabs.configurable_options'), icon: 'cogs', route: 'product-configurable-options' },
  { id: 'upgrades', label: t('products_services.tabs.upgrades'), icon: 'arrow-up', route: 'product-upgrades' },
  { id: 'freedomain', label: t('products_services.tabs.freedomain'), icon: 'globe', route: 'product-freedomain' },
  { id: 'cross_sells', label: t('products_services.tabs.cross_sells'), icon: 'shopping-cart', route: 'product-cross-sells' },
  { id: 'other', label: t('products_services.tabs.other'), icon: 'ellipsis-h', route: 'product-other' },
  { id: 'links', label: t('products_services.tabs.links'), icon: 'link', route: 'product-links' }
]

// Déterminer l'onglet actif en fonction de la route actuelle
const activeTab = computed(() => {
  const currentRouteName = route.name as string
  const tab = tabs.find(tab => tab.route === currentRouteName)
  return tab ? tab.id : 'cross_sells'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  // Sauvegarder les données dans localStorage
  localStorage.setItem('crossSellsData', JSON.stringify(crossSellsData.value))
  
  if (tab.id === 'type') {
    // Si nous sommes en mode édition, rediriger vers la page d'édition du produit
    if (isEditMode.value) {
      router.push({ path: `/products/${productId.value}` })
    } else {
      // Sinon, rediriger vers la création de produit
      router.push({ name: 'create-product' })
    }
  } else {
    const idOrAction = isEditMode.value ? productId.value : 'create'
    router.push({
      name: tab.route,
      params: { idOrAction }
    })
  }
}

// États locaux
const loading = ref(false)
const products = ref([])
const crossSellsData = ref({
  crossSells: [] as number[],
  showOnCheckout: true,
  discountPercent: 0
})

// Recherche de produits
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)

// Fetch des produits disponibles
const fetchProducts = async () => {
  loading.value = true
  try {
    // Simuler une requête d'API
    // Dans une vraie application, cela viendrait de l'API
    setTimeout(() => {
      products.value = [
        { id: 1, name: 'Hébergement Basic', type: 'shared_hosting', price: 49.99 },
        { id: 2, name: 'Hébergement Pro', type: 'shared_hosting', price: 99.99 },
        { id: 3, name: 'Hébergement Business', type: 'shared_hosting', price: 149.99 },
        { id: 4, name: 'VPS Standard', type: 'vps', price: 199.99 },
        { id: 5, name: 'VPS Premium', type: 'vps', price: 299.99 },
        { id: 6, name: 'Serveur Dédié', type: 'dedicated_server', price: 499.99 },
        { id: 7, name: 'SSL Standard', type: 'ssl', price: 29.99 },
        { id: 8, name: 'SSL Wildcard', type: 'ssl', price: 79.99 },
        { id: 9, name: 'Protection DDoS', type: 'security', price: 59.99 },
        { id: 10, name: 'Sauvegarde Journalière', type: 'backup', price: 19.99 }
      ]
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    loading.value = false
    notificationStore.addNotification({
      type: 'error',
      title: t('products_services.cross_sells.errors.fetch_failed_title'),
      message: t('products_services.cross_sells.errors.fetch_failed_message')
    })
  }
}

// Rechercher des produits
const searchProducts = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  searching.value = true
  
  // Filtrer les produits en fonction de la requête de recherche
  const query = searchQuery.value.toLowerCase()
  searchResults.value = products.value.filter(product => 
    product.name.toLowerCase().includes(query) && 
    !crossSellsData.value.crossSells.includes(product.id) &&
    product.id !== (previousData.value.id || 0)
  )
  
  searching.value = false
}

// Ajouter un produit à la liste des cross-sells
const addCrossSell = (productId) => {
  if (!crossSellsData.value.crossSells.includes(productId)) {
    crossSellsData.value.crossSells.push(productId)
    notificationStore.addNotification({
      type: 'success',
      title: t('products_services.cross_sells.success.product_added_title'),
      message: t('products_services.cross_sells.success.product_added_message')
    })
    // Réinitialiser la recherche
    searchQuery.value = ''
    searchResults.value = []
  }
}

// Supprimer un produit de la liste des cross-sells
const removeCrossSell = (productId) => {
  crossSellsData.value.crossSells = crossSellsData.value.crossSells.filter(id => id !== productId)
  notificationStore.addNotification({
    type: 'success',
    title: t('products_services.cross_sells.success.product_removed_title'),
    message: t('products_services.cross_sells.success.product_removed_message')
  })
}

// Obtenir les détails d'un produit par son ID
const getProductById = (productId) => {
  return products.value.find(p => p.id === productId)
}

// Mettre à jour le pourcentage de remise
const updateDiscountPercent = (percent) => {
  crossSellsData.value.discountPercent = parseInt(percent) || 0
}

// Activer/désactiver l'option d'affichage en caisse
const toggleShowOnCheckout = () => {
  crossSellsData.value.showOnCheckout = !crossSellsData.value.showOnCheckout
}

// Continuer vers l'étape suivante
const continueToNextStep = () => {
  // Sauvegarder les données
  localStorage.setItem('crossSellsData', JSON.stringify(crossSellsData.value))
  
  // Naviguer vers la prochaine étape
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-other',
    params: { idOrAction }
  })
}

// Retour à l'étape précédente
const goBack = () => {
  // Sauvegarder les données
  localStorage.setItem('crossSellsData', JSON.stringify(crossSellsData.value))
  
  // Naviguer vers l'étape précédente
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-freedomain',
    params: { idOrAction }
  })
}

// Sauvegarder les données
const saveProgress = () => {
  // Sauvegarder les données ici
  notificationStore.addNotification({
    type: 'success',
    title: t('common.success_title'),
    message: t('common.success_message')
  })
}

// Fusionner les données précédentes avec les données des cross-sells
onMounted(() => {
  fetchProducts()
  
  if (previousData.value && previousData.value.crossSells) {
    crossSellsData.value = previousData.value.crossSells
  }
})
</script>

<template>
  <div class="product-cross-sells-view">
    <div class="wizard-content">
      <div class="cross-sells-configuration">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.cross_sells.configuration_title') }}</h3>
        </div>
        
        <div class="form-options-container">
          <div class="form-group">
            <div class="form-check">
              <input 
                type="checkbox" 
                id="show-on-checkout" 
                class="form-check-input" 
                :checked="crossSellsData.showOnCheckout"
                @change="toggleShowOnCheckout"
              />
              <label for="show-on-checkout" class="form-check-label">
                {{ t('products_services.cross_sells.show_on_checkout') }}
              </label>
              <small class="form-text text-muted">
                {{ t('products_services.cross_sells.show_on_checkout_help') }}
              </small>
            </div>
          </div>
          
          <div class="form-group">
            <label for="discount-percent">{{ t('products_services.cross_sells.discount_percent') }}</label>
            <div class="input-group">
              <input 
                type="number" 
                id="discount-percent" 
                class="form-control" 
                min="0" 
                max="100" 
                :value="crossSellsData.discountPercent"
                @input="e => updateDiscountPercent(e.target.value)"
              />
              <div class="input-group-append">
                <span class="input-group-text">%</span>
              </div>
            </div>
            <small class="form-text text-muted">
              {{ t('products_services.cross_sells.discount_percent_help') }}
            </small>
          </div>
        </div>
      </div>
      
      <div class="cross-sells-search">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.cross_sells.search_title') }}</h3>
        </div>
        
        <div class="search-container">
          <div class="search-form">
            <div class="form-group">
              <label for="search-query">{{ t('products_services.cross_sells.search_products') }}</label>
              <div class="search-input-group">
                <input 
                  type="text" 
                  id="search-query" 
                  class="form-control" 
                  v-model="searchQuery"
                  @input="searchProducts"
                  :placeholder="t('products_services.cross_sells.search_placeholder')"
                />
                <button 
                  type="button" 
                  class="btn btn-primary"
                  @click="searchProducts"
                >
                  {{ t('common.search') }}
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="searching" class="search-loading">
            <div class="spinner"></div>
            <p>{{ t('common.searching') }}...</p>
          </div>
          
          <div v-else-if="searchQuery && searchResults.length === 0" class="search-no-results">
            <p>{{ t('products_services.cross_sells.no_search_results') }}</p>
          </div>
          
          <div v-else-if="searchResults.length > 0" class="search-results">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t('products_services.cross_sells.product_name') }}</th>
                  <th>{{ t('products_services.cross_sells.product_type') }}</th>
                  <th>{{ t('products_services.cross_sells.product_price') }}</th>
                  <th class="text-center">{{ t('products_services.cross_sells.action') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in searchResults" :key="product.id">
                  <td>{{ product.name }}</td>
                  <td>{{ product.type }}</td>
                  <td>{{ product.price }} €</td>
                  <td class="text-center">
                    <button 
                      type="button" 
                      class="btn btn-sm btn-outline-primary"
                      @click="addCrossSell(product.id)"
                    >
                      {{ t('products_services.cross_sells.add') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="cross-sells-selected">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.cross_sells.selected_products') }}</h3>
        </div>
        
        <div v-if="loading" class="loading-indicator">
          <div class="spinner"></div>
          <p>{{ t('common.loading') }}...</p>
        </div>
        
        <div v-else-if="crossSellsData.crossSells.length === 0" class="empty-state">
          <p>{{ t('products_services.cross_sells.no_products_selected') }}</p>
        </div>
        
        <div v-else class="selected-products">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('products_services.cross_sells.product_name') }}</th>
                <th>{{ t('products_services.cross_sells.product_type') }}</th>
                <th>{{ t('products_services.cross_sells.product_price') }}</th>
                <th class="text-center">{{ t('products_services.cross_sells.action') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="productId in crossSellsData.crossSells" :key="productId">
                <td>{{ getProductById(productId)?.name || `ID: ${productId}` }}</td>
                <td>{{ getProductById(productId)?.type || '-' }}</td>
                <td>{{ getProductById(productId)?.price || 0 }} €</td>
                <td class="text-center">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-danger"
                    @click="removeCrossSell(productId)"
                  >
                    {{ t('products_services.cross_sells.remove') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="wizard-actions">
      <button 
        type="button" 
        class="btn btn-outline-secondary"
        @click="goBack"
        :disabled="loading"
      >
        {{ t('common.back') }}
      </button>
      
      <div class="action-buttons">
        <button 
          type="button" 
          class="btn btn-success"
          @click="saveProgress"
          :disabled="loading"
        >
          <span v-if="loading">{{ t('common.saving') }}...</span>
          <span v-else>{{ t('common.save') }}</span>
        </button>
        
        <button 
          type="button" 
          class="btn btn-primary"
          @click="continueToNextStep"
          :disabled="loading"
        >
          {{ t('common.continue') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/css/components/common-layout.css';
@import '@/assets/styles/wizard-tabs.css';

.product-cross-sells-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.header-box {
  background: var(--glass-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  color: var(--text-color);
}

.page-description {
  color: var(--text-muted);
}

.wizard-content {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: var(--spacing-md);
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.section-description {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.search-input-group {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.form-group {
  flex: 1;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-color);
  background: var(--input-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.form-control:focus {
  border-color: var(--primary-blue);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(var(--primary-blue-rgb), 0.25);
}

.form-check {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.form-check-input {
  margin-top: 0.25rem;
}

.form-check-label {
  font-weight: 500;
}

.form-text {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.data-table th,
.data-table td {
  padding: var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--glass-border);
}

.data-table thead th {
  background: var(--glass-bg);
  font-weight: 600;
  color: var(--text-color);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: var(--hover-bg);
}

.text-center {
  text-align: center;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: var(--radius-sm);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-muted);
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(var(--primary-blue-rgb), 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-blue);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cross-sells-config {
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.selected-products {
  margin-top: var(--spacing-lg);
}

.selected-products-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.product-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: rgba(var(--primary-blue-rgb), 0.1);
  color: var(--primary-blue);
  padding: 0.35rem var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.badge-remove {
  background: none;
  border: none;
  color: var(--primary-blue);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: var(--spacing-xs);
}

.badge-remove:hover {
  color: var(--danger);
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.btn-primary {
  color: #fff;
  background: var(--primary-blue);
  border: 1px solid var(--primary-blue);
}

.btn-primary:hover {
  background: var(--primary-blue-dark);
  border-color: var(--primary-blue-dark);
}

.btn-outline-secondary {
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  background: transparent;
}

.btn-outline-secondary:hover {
  background: var(--hover-bg);
  color: var(--text-color);
}

.btn-outline-primary {
  color: var(--primary-blue);
  border: 1px solid var(--primary-blue);
  background: transparent;
}

.btn-outline-primary:hover {
  background: rgba(var(--primary-blue-rgb), 0.1);
}

.btn-outline-danger {
  color: var(--danger);
  border: 1px solid var(--danger);
  background: transparent;
}

.btn-outline-danger:hover {
  background: rgba(var(--danger-rgb), 0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Style responsive */
@media (max-width: 768px) {
  .search-input-group {
    flex-direction: column;
  }
  
  .data-table {
    font-size: 0.75rem;
  }
  
  .wizard-actions {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .wizard-actions button {
    width: 100%;
  }
}
</style>
