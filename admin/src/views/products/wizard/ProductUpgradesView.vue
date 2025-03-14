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
  return tab ? tab.id : 'upgrades'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  // Sauvegarder les données dans localStorage
  localStorage.setItem('upgradesData', JSON.stringify(upgradesData.value))
  
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
const upgradesData = ref({
  upgrades: [],
  downgradeEnabled: false,
  upgradePackageQuantity: false
})

// Fetch des produits disponibles pour les mises à niveau
const fetchProducts = async () => {
  loading.value = true
  try {
    // Simuler une requête d'API
    // Dans une vraie application, cela viendrait de l'API
    setTimeout(() => {
      products.value = [
        { id: 1, name: 'Hébergement Basic', type: 'shared_hosting' },
        { id: 2, name: 'Hébergement Pro', type: 'shared_hosting' },
        { id: 3, name: 'Hébergement Business', type: 'shared_hosting' },
        { id: 4, name: 'VPS Standard', type: 'vps' },
        { id: 5, name: 'VPS Premium', type: 'vps' },
        { id: 6, name: 'Serveur Dédié', type: 'dedicated_server' }
      ]
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    loading.value = false
    notificationStore.addNotification({
      type: 'error',
      title: t('products_services.upgrades.errors.fetch_failed_title'),
      message: t('products_services.upgrades.errors.fetch_failed_message')
    })
  }
}

// Filtrer les produits compatibles pour les mises à niveau
const compatibleProducts = computed(() => {
  return products.value.filter(product => product.type === productType.value)
})

// Ajouter un produit à la liste des mises à niveau
const addUpgrade = (productId) => {
  if (!upgradesData.value.upgrades.includes(productId)) {
    upgradesData.value.upgrades.push(productId)
    notificationStore.addNotification({
      type: 'success',
      title: t('products_services.upgrades.success.upgrade_added_title'),
      message: t('products_services.upgrades.success.upgrade_added_message')
    })
  }
}

// Supprimer un produit de la liste des mises à niveau
const removeUpgrade = (productId) => {
  upgradesData.value.upgrades = upgradesData.value.upgrades.filter(id => id !== productId)
  notificationStore.addNotification({
    type: 'success',
    title: t('products_services.upgrades.success.upgrade_removed_title'),
    message: t('products_services.upgrades.success.upgrade_removed_message')
  })
}

// Vérifier si un produit est déjà ajouté comme mise à niveau
const isUpgrade = (productId) => {
  return upgradesData.value.upgrades.includes(productId)
}

// Obtenir les détails d'un produit par son ID
const getProductById = (productId) => {
  return products.value.find(p => p.id === productId)
}

// Activer/désactiver le downgrade
const toggleDowngrade = () => {
  upgradesData.value.downgradeEnabled = !upgradesData.value.downgradeEnabled
}

// Activer/désactiver la quantité pour la mise à niveau
const toggleUpgradeQuantity = () => {
  upgradesData.value.upgradePackageQuantity = !upgradesData.value.upgradePackageQuantity
}

// Continuer vers l'étape suivante
const continueToNextStep = () => {
  // Sauvegarder les données
  localStorage.setItem('upgradesData', JSON.stringify(upgradesData.value))
  
  // Naviguer vers la prochaine étape
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-freedomain',
    params: { idOrAction }
  })
}

// Retour à l'étape précédente
const goBack = () => {
  // Sauvegarder les données
  localStorage.setItem('upgradesData', JSON.stringify(upgradesData.value))
  
  // Naviguer vers l'étape précédente
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-configurable-options',
    params: { idOrAction }
  })
}

// Fusionner les données précédentes avec les données des mises à niveau
onMounted(() => {
  fetchProducts()
  
  if (previousData.value && previousData.value.upgrades) {
    upgradesData.value = previousData.value.upgrades
  }
})
</script>

<template>
  <div class="product-upgrades-view">
    <div class="wizard-content">
      <div class="upgrades-configuration">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.upgrades.configuration_title') }}</h3>
        </div>
        
        <div class="form-options-container">
          <div class="form-group">
            <div class="form-check">
              <input 
                type="checkbox" 
                id="downgrade-enabled" 
                class="form-check-input" 
                :checked="upgradesData.downgradeEnabled"
                @change="toggleDowngrade"
              />
              <label for="downgrade-enabled" class="form-check-label">
                {{ t('products_services.upgrades.allow_downgrade') }}
              </label>
              <small class="form-text text-muted">
                {{ t('products_services.upgrades.allow_downgrade_help') }}
              </small>
            </div>
          </div>
          
          <div class="form-group">
            <div class="form-check">
              <input 
                type="checkbox" 
                id="upgrade-package-quantity" 
                class="form-check-input" 
                :checked="upgradesData.upgradePackageQuantity"
                @change="toggleUpgradeQuantity"
              />
              <label for="upgrade-package-quantity" class="form-check-label">
                {{ t('products_services.upgrades.upgrade_package_quantity') }}
              </label>
              <small class="form-text text-muted">
                {{ t('products_services.upgrades.upgrade_package_quantity_help') }}
              </small>
            </div>
          </div>
        </div>
      </div>
      
      <div class="upgrades-selection">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.upgrades.products_title') }}</h3>
        </div>
        
        <div class="upgrades-list">
          <div v-if="loading" class="loading-indicator">
            <div class="spinner"></div>
            <p>{{ t('common.loading') }}</p>
          </div>
          
          <div v-else-if="compatibleProducts.length === 0" class="empty-state">
            <p>{{ t('products_services.upgrades.no_compatible_products') }}</p>
          </div>
          
          <div v-else>
            <div class="compatible-products">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ t('products_services.upgrades.product_name') }}</th>
                    <th class="text-center">{{ t('products_services.upgrades.action') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in compatibleProducts" :key="product.id">
                    <td>{{ product.name }}</td>
                    <td class="text-center">
                      <button 
                        v-if="!isUpgrade(product.id)" 
                        type="button" 
                        class="btn btn-sm btn-outline-primary"
                        @click="addUpgrade(product.id)"
                      >
                        {{ t('products_services.upgrades.add') }}
                      </button>
                      <button 
                        v-else 
                        type="button" 
                        class="btn btn-sm btn-outline-danger"
                        @click="removeUpgrade(product.id)"
                      >
                        {{ t('products_services.upgrades.remove') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div v-if="upgradesData.upgrades.length > 0" class="selected-upgrades">
          <h4>{{ t('products_services.upgrades.selected_upgrades') }}</h4>
          <div class="upgrades-badges">
            <div 
              v-for="productId in upgradesData.upgrades" 
              :key="productId" 
              class="upgrade-badge"
            >
              {{ getProductById(productId)?.name || `ID: ${productId}` }}
              <button 
                type="button" 
                class="badge-remove" 
                @click="removeUpgrade(productId)"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Boutons de navigation -->
    <div class="wizard-actions">
      <button 
        type="button" 
        class="btn btn-outline-secondary"
        @click="goBack"
      >
        {{ t('common.back') }}
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
</template>

<style scoped>
@import '@/assets/css/components/common-layout.css';
@import '@/assets/styles/wizard-tabs.css';

.product-upgrades-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.page-description {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.wizard-content {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.form-options-container {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-check {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.form-check-input {
  margin-top: 0.25rem;
}

.form-check-label {
  font-weight: 500;
}

.form-text {
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
  display: block;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.data-table th,
.data-table td {
  padding: var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table thead th {
  background-color: var(--color-bg-secondary);
  font-weight: 600;
  color: var(--color-text-primary);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.text-center {
  text-align: center;
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
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.selected-upgrades {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.selected-upgrades h4 {
  font-size: 1rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.upgrades-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.upgrade-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  padding: 0.35rem var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.badge-remove {
  background: none;
  border: none;
  color: var(--color-primary-dark);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: var(--spacing-xs);
}

.badge-remove:hover {
  color: var(--color-danger);
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-lg);
}

.btn {
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border: 1px solid var(--color-primary);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-outline-secondary {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-outline-secondary:hover {
  background-color: var(--color-bg-secondary);
}

.btn-outline-primary {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline-primary:hover {
  background-color: var(--color-primary-light);
}

.btn-outline-danger {
  background-color: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.btn-outline-danger:hover {
  background-color: var(--color-danger-light);
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
