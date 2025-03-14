<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notifications'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()

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
  return tab ? tab.id : 'other'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  // Sauvegarder les données dans localStorage
  localStorage.setItem('otherData', JSON.stringify(otherOptions.value))
  
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

// États locaux pour les autres options
const otherOptions = ref({
  requireDomain: false,
  autoSetup: true,
  stockControl: false,
  stockQuantity: 0,
  hidden: false,
  featured: false,
  welcomeEmail: 0,
  notes: ''
})

// Options d'emails de bienvenue
const welcomeEmailOptions = ref([
  { id: 0, name: t('products_services.other.welcome_email_none') },
  { id: 1, name: t('products_services.other.welcome_email_product') },
  { id: 2, name: t('products_services.other.welcome_email_general') },
  { id: 3, name: t('products_services.other.welcome_email_both') }
])

// Mise à jour de la quantité de stock
const updateStockQuantity = (value) => {
  otherOptions.value.stockQuantity = parseInt(value) || 0
}

// Mise à jour de l'email de bienvenue
const updateWelcomeEmail = (value) => {
  otherOptions.value.welcomeEmail = parseInt(value)
}

// Activer/désactiver le contrôle de stock
const toggleStockControl = () => {
  otherOptions.value.stockControl = !otherOptions.value.stockControl
  if (!otherOptions.value.stockControl) {
    otherOptions.value.stockQuantity = 0
  }
}

// Activer/désactiver l'exigence de domaine
const toggleRequireDomain = () => {
  otherOptions.value.requireDomain = !otherOptions.value.requireDomain
}

// Activer/désactiver la configuration automatique
const toggleAutoSetup = () => {
  otherOptions.value.autoSetup = !otherOptions.value.autoSetup
}

// Activer/désactiver la visibilité du produit
const toggleHidden = () => {
  otherOptions.value.hidden = !otherOptions.value.hidden
}

// Activer/désactiver la mise en avant du produit
const toggleFeatured = () => {
  otherOptions.value.featured = !otherOptions.value.featured
}

// Continuer vers l'étape suivante
const continueToNextStep = () => {
  // Sauvegarder les données
  localStorage.setItem('otherData', JSON.stringify(otherOptions.value))
  
  // Naviguer vers la prochaine étape
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-links',
    params: { idOrAction }
  })
}

// Retour à l'étape précédente
const goBack = () => {
  // Sauvegarder les données
  localStorage.setItem('otherData', JSON.stringify(otherOptions.value))
  
  // Naviguer vers l'étape précédente
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-cross-sells',
    params: { idOrAction }
  })
}

// Sauvegarder la progression
const saveProgress = () => {
  // TODO: implémenter la sauvegarde de la progression
}

// Initialiser avec les données précédentes, si disponibles
onMounted(() => {
  if (previousData.value && previousData.value.otherOptions) {
    otherOptions.value = {
      ...otherOptions.value,
      ...previousData.value.otherOptions
    }
  }
})

const loading = ref(false)
</script>

<template>
  <div class="product-other-view">
    <div class="wizard-content">
      <div class="other-options-configuration">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.other.configuration_title') }}</h3>
        </div>
        
        <div class="form-options-container">
          <div class="form-row">
            <div class="form-group form-group-checkbox">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="require-domain" 
                  class="form-check-input" 
                  :checked="otherOptions.requireDomain"
                  @change="toggleRequireDomain"
                />
                <label for="require-domain" class="form-check-label">
                  {{ t('products_services.other.require_domain') }}
                </label>
              </div>
              <small class="form-text text-muted">
                {{ t('products_services.other.require_domain_help') }}
              </small>
            </div>
            
            <div class="form-group form-group-checkbox">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="auto-setup" 
                  class="form-check-input" 
                  :checked="otherOptions.autoSetup"
                  @change="toggleAutoSetup"
                />
                <label for="auto-setup" class="form-check-label">
                  {{ t('products_services.other.auto_setup') }}
                </label>
              </div>
              <small class="form-text text-muted">
                {{ t('products_services.other.auto_setup_help') }}
              </small>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group form-group-checkbox">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="stock-control" 
                  class="form-check-input" 
                  :checked="otherOptions.stockControl"
                  @change="toggleStockControl"
                />
                <label for="stock-control" class="form-check-label">
                  {{ t('products_services.other.stock_control') }}
                </label>
              </div>
              <small class="form-text text-muted">
                {{ t('products_services.other.stock_control_help') }}
              </small>
            </div>
            
            <div class="form-group" v-if="otherOptions.stockControl">
              <label for="stock-quantity">{{ t('products_services.other.stock_quantity') }}</label>
              <input 
                type="number" 
                id="stock-quantity" 
                class="form-control" 
                min="0" 
                :value="otherOptions.stockQuantity"
                @input="e => updateStockQuantity(e.target.value)"
              />
              <small class="form-text text-muted">
                {{ t('products_services.other.stock_quantity_help') }}
              </small>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group form-group-checkbox">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="hidden" 
                  class="form-check-input" 
                  :checked="otherOptions.hidden"
                  @change="toggleHidden"
                />
                <label for="hidden" class="form-check-label">
                  {{ t('products_services.other.hidden') }}
                </label>
              </div>
              <small class="form-text text-muted">
                {{ t('products_services.other.hidden_help') }}
              </small>
            </div>
            
            <div class="form-group form-group-checkbox">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="featured" 
                  class="form-check-input" 
                  :checked="otherOptions.featured"
                  @change="toggleFeatured"
                />
                <label for="featured" class="form-check-label">
                  {{ t('products_services.other.featured') }}
                </label>
              </div>
              <small class="form-text text-muted">
                {{ t('products_services.other.featured_help') }}
              </small>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="welcome-email">{{ t('products_services.other.welcome_email') }}</label>
              <select 
                id="welcome-email" 
                class="form-control" 
                :value="otherOptions.welcomeEmail"
                @change="e => updateWelcomeEmail(e.target.value)"
              >
                <option 
                  v-for="option in welcomeEmailOptions" 
                  :key="option.id" 
                  :value="option.id"
                >
                  {{ option.name }}
                </option>
              </select>
              <small class="form-text text-muted">
                {{ t('products_services.other.welcome_email_help') }}
              </small>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="notes">{{ t('products_services.other.notes') }}</label>
              <textarea 
                id="notes" 
                class="form-control" 
                rows="4"
                v-model="otherOptions.notes"
                :placeholder="t('products_services.other.notes_placeholder')"
              ></textarea>
              <small class="form-text text-muted">
                {{ t('products_services.other.notes_help') }}
              </small>
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

.product-other-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
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

.form-options-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--glass-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.form-group {
  flex: 1;
  min-width: 200px;
  margin-bottom: var(--spacing-md);
}

.form-group-checkbox {
  display: flex;
  flex-direction: column;
}

.form-check {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.form-check-input {
  margin-top: 0.25rem;
}

.form-check-label {
  font-weight: 500;
  color: var(--text-color);
}

.form-text {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: 0.875rem;
  color: var(--text-muted);
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 400;
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

select.form-control {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='4' viewBox='0 0 8 4'%3E%3Cpath fill='%23ffffff' d='M0 0l4 4 4-4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 8px 4px;
  padding-right: 2rem;
}

textarea.form-control {
  resize: vertical;
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

.btn-success {
  color: #fff;
  background: var(--success);
  border: 1px solid var(--success);
}

.btn-success:hover {
  background: var(--success-dark);
  border-color: var(--success-dark);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Style responsive */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .form-group {
    width: 100%;
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
