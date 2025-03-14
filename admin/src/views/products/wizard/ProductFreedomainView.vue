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
  return tab ? tab.id : 'freedomain'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  // Sauvegarder les données dans localStorage
  localStorage.setItem('freedomainData', JSON.stringify(freedomainData.value))
  
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
const submitting = ref(false)
const success = ref(false)
const errors = ref({} as Record<string, string>)

// Configuration du domaine gratuit
const freedomainData = ref({
  enabled: false,
  tlds: [] as string[],
  requiredPeriod: 12, // Période minimale requise en mois
  onlyInitialOrder: true
})

// Liste des TLDs disponibles
const availableTlds = ref([
  '.com', '.net', '.org', '.info', '.biz', '.fr', '.eu', '.de', '.co.uk', '.us'
])

// Ajouter un TLD à la liste des domaines gratuits
const addTld = (tld) => {
  if (!freedomainData.value.tlds.includes(tld)) {
    freedomainData.value.tlds.push(tld)
    notificationStore.addNotification({
      type: 'success',
      title: t('products_services.freedomain.success.tld_added_title'),
      message: t('products_services.freedomain.success.tld_added_message')
    })
  }
}

// Supprimer un TLD de la liste des domaines gratuits
const removeTld = (tld) => {
  freedomainData.value.tlds = freedomainData.value.tlds.filter(t => t !== tld)
  notificationStore.addNotification({
    type: 'success',
    title: t('products_services.freedomain.success.tld_removed_title'),
    message: t('products_services.freedomain.success.tld_removed_message')
  })
}

// Vérifier si un TLD est déjà ajouté
const isTldAdded = (tld) => {
  return freedomainData.value.tlds.includes(tld)
}

// Activer/désactiver le domaine gratuit
const toggleFreedomain = () => {
  freedomainData.value.enabled = !freedomainData.value.enabled
}

// Activer/désactiver l'option commande initiale uniquement
const toggleInitialOrderOnly = () => {
  freedomainData.value.onlyInitialOrder = !freedomainData.value.onlyInitialOrder
}

// Mettre à jour la période requise
const updateRequiredPeriod = (period) => {
  freedomainData.value.requiredPeriod = parseInt(period)
}

// Finaliser et créer le produit
const saveProduct = async () => {
  submitting.value = true
  errors.value = {}
  
  try {
    // Validation des données
    if (freedomainData.value.enabled && freedomainData.value.tlds.length === 0) {
      errors.value.tlds = t('products_services.freedomain.errors.no_tlds_selected')
      submitting.value = false
      return
    }
    
    // Fusionner toutes les données du produit
    const productData = {
      ...previousData.value,
      freedomain: freedomainData.value
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('currentProductData', JSON.stringify(productData))
    
    // Appel à l'API pour créer/mettre à jour le produit
    await productStore.createProduct(productData)
    
    success.value = true
    
    notificationStore.addNotification({
      type: 'success',
      title: t('products_services.success.product_created_title'),
      message: t('products_services.success.product_created_message')
    })
    
    // Nettoyer le localStorage
    localStorage.removeItem('currentProductData')
    
    // Rediriger vers la liste des produits après un court délai
    setTimeout(() => {
      router.push({ name: 'products' })
    }, 1500)
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error)
    
    notificationStore.addNotification({
      type: 'error',
      title: t('products_services.errors.product_creation_failed_title'),
      message: t('products_services.errors.product_creation_failed_message')
    })
  } finally {
    submitting.value = false
  }
}

// Continuer vers l'étape suivante
const continueToNextStep = () => {
  // Sauvegarder les données
  localStorage.setItem('freedomainData', JSON.stringify(freedomainData.value))
  
  // Naviguer vers la prochaine étape
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-cross-sells',
    params: { idOrAction }
  })
}

// Retour à l'étape précédente
const goBack = () => {
  // Sauvegarder les données
  localStorage.setItem('freedomainData', JSON.stringify(freedomainData.value))
  
  // Naviguer vers l'étape précédente
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-upgrades',
    params: { idOrAction }
  })
}

// Fusionner les données précédentes avec les données du domaine gratuit
onMounted(() => {
  if (previousData.value && previousData.value.freedomain) {
    freedomainData.value = previousData.value.freedomain
  }
})
</script>

<template>
  <div class="product-freedomain-view">
    <div class="wizard-content">
      <div class="freedomain-configuration">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.freedomain.configuration_title') }}</h3>
        </div>
        
        <div class="form-options-container">
          <div class="form-group">
            <div class="form-check">
              <input 
                type="checkbox" 
                id="freedomain-enabled" 
                class="form-check-input" 
                :checked="freedomainData.enabled"
                @change="toggleFreedomain"
              />
              <label for="freedomain-enabled" class="form-check-label">
                {{ t('products_services.freedomain.enable_freedomain') }}
              </label>
              <small class="form-text text-muted">
                {{ t('products_services.freedomain.enable_freedomain_help') }}
              </small>
            </div>
          </div>
        </div>
        
        <div v-if="freedomainData.enabled" class="freedomain-settings">
          <div class="form-group">
            <label for="required-period">{{ t('products_services.freedomain.required_period') }}</label>
            <select 
              id="required-period" 
              class="form-control" 
              :value="freedomainData.requiredPeriod"
              @change="e => updateRequiredPeriod(e.target.value)"
            >
              <option value="1">1 {{ t('common.month') }}</option>
              <option value="3">3 {{ t('common.months') }}</option>
              <option value="6">6 {{ t('common.months') }}</option>
              <option value="12">12 {{ t('common.months') }}</option>
              <option value="24">24 {{ t('common.months') }}</option>
              <option value="36">36 {{ t('common.months') }}</option>
            </select>
            <small class="form-text text-muted">
              {{ t('products_services.freedomain.required_period_help') }}
            </small>
          </div>
          
          <div class="form-group">
            <div class="form-check">
              <input 
                type="checkbox" 
                id="initial-order-only" 
                class="form-check-input" 
                :checked="freedomainData.onlyInitialOrder"
                @change="toggleInitialOrderOnly"
              />
              <label for="initial-order-only" class="form-check-label">
                {{ t('products_services.freedomain.initial_order_only') }}
              </label>
              <small class="form-text text-muted">
                {{ t('products_services.freedomain.initial_order_only_help') }}
              </small>
            </div>
          </div>
          
          <div class="form-group">
            <label>{{ t('products_services.freedomain.available_tlds') }}</label>
            
            <div v-if="errors.tlds" class="invalid-feedback d-block mb-3">{{ errors.tlds }}</div>
            
            <div class="tlds-container">
              <div 
                v-for="tld in availableTlds" 
                :key="tld" 
                class="tld-item"
              >
                <button 
                  type="button" 
                  class="tld-button" 
                  :class="{ 'selected': isTldAdded(tld) }"
                  @click="isTldAdded(tld) ? removeTld(tld) : addTld(tld)"
                >
                  {{ tld }}
                </button>
              </div>
            </div>
            
            <small class="form-text text-muted">
              {{ t('products_services.freedomain.tlds_help') }}
            </small>
          </div>
          
          <div v-if="freedomainData.tlds.length > 0" class="selected-tlds">
            <h4>{{ t('products_services.freedomain.selected_tlds') }}</h4>
            <div class="tlds-badges">
              <div 
                v-for="tld in freedomainData.tlds" 
                :key="tld" 
                class="tld-badge"
              >
                {{ tld }}
                <button 
                  type="button" 
                  class="badge-remove" 
                  @click="removeTld(tld)"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="wizard-actions">
      <button 
        type="button" 
        class="btn btn-outline-secondary"
        @click="goBack"
        :disabled="submitting || success"
      >
        {{ t('common.back') }}
      </button>
      
      <div class="action-buttons">
        <button 
          type="button" 
          class="btn btn-success"
          @click="saveProduct"
          :disabled="submitting || success"
        >
          <span v-if="success">{{ t('common.saved') }}</span>
          <span v-else-if="submitting">{{ t('common.saving') }}...</span>
          <span v-else>{{ t('common.save') }}</span>
        </button>
        
        <button 
          type="button" 
          class="btn btn-primary"
          @click="continueToNextStep"
          :disabled="submitting || success"
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

.product-freedomain-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.header-box {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.page-description {
  color: var(--color-text-secondary);
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

.freedomain-settings {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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

.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text-primary);
  background-color: var(--color-bg-input);
  background-clip: padding-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--color-primary);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(var(--color-primary-rgb), 0.25);
}

.invalid-feedback {
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-danger);
}

.d-block {
  display: block;
}

.mb-3 {
  margin-bottom: var(--spacing-md);
}

.tlds-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.tld-item {
  flex: 0 0 auto;
}

.tld-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-input);
  color: var(--color-text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tld-button:hover {
  background-color: var(--color-bg-hover);
}

.tld-button.selected {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-color: var(--color-primary);
}

.selected-tlds {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: rgba(var(--color-primary-rgb), 0.05);
  border-radius: var(--radius-md);
  border: 1px solid rgba(var(--color-primary-rgb), 0.1);
}

.selected-tlds h4 {
  font-size: 1rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.tlds-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tld-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  padding: 0.35rem var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
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
  transition: color 0.2s ease;
}

.badge-remove:hover {
  color: var(--color-danger);
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-lg);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
}

.btn {
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-success {
  background-color: var(--color-success);
  color: white;
  border: 1px solid var(--color-success);
}

.btn-success:hover {
  background-color: var(--color-success-dark);
  border-color: var(--color-success-dark);
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
