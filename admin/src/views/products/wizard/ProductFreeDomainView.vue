<template>
  <div class="product-freedomain-page">
    <p class="section-description">
      {{ t('products_services.freedomain.description') }}
    </p>

    <div v-if="loading" class="text-center" style="padding: var(--spacing-xl)">
      <div class="spinner-loading" style="margin: 0 auto;"></div>
    </div>

    <form v-else @submit.prevent="saveAndContinue">
      <div class="form-group">
        <div class="custom-switch">
          <label class="toggle-switch">
            <input v-model="freeDomainSettings.enabled" type="checkbox">
            <span class="toggle-slider"></span>
          </label>
          <span>{{ t('products_services.freedomain.enable') }}</span>
        </div>
        <p class="form-hint">{{ t('products_services.freedomain.enable_hint') }}</p>
      </div>

      <div v-if="freeDomainSettings.enabled" class="settings-container">
        <div class="form-section">
          <h3 class="section-title">{{ t('products_services.freedomain.settings') }}</h3>
          
          <div class="form-group">
            <label class="form-label">{{ t('products_services.freedomain.type') }}</label>
            <select v-model="freeDomainSettings.type" class="form-control">
              <option value="free">{{ t('products_services.freedomain.type_free') }}</option>
              <option value="discounted">{{ t('products_services.freedomain.type_discounted') }}</option>
            </select>
          </div>
          
          <div v-if="freeDomainSettings.type === 'discounted'" class="form-group">
            <label class="form-label">{{ t('products_services.freedomain.discount_amount') }}</label>
            <div class="price-field">
              <span class="currency-symbol">€</span>
              <input 
                v-model="freeDomainSettings.discount_amount" 
                type="number" 
                class="form-control" 
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">{{ t('products_services.freedomain.payment_type') }}</label>
            <select v-model="freeDomainSettings.payment_type" class="form-control">
              <option value="once">{{ t('products_services.freedomain.payment_once') }}</option>
              <option value="recurring">{{ t('products_services.freedomain.payment_recurring') }}</option>
            </select>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">{{ t('products_services.freedomain.billing_cycles') }}</h3>
          <p class="section-description">{{ t('products_services.freedomain.billing_cycles_desc') }}</p>
          
          <div class="billing-cycles-container">
            <div v-for="cycle in billingCycles" :key="cycle.id" class="cycle-option">
              <div class="custom-checkbox">
                <input 
                  :id="'cycle-' + cycle.id" 
                  v-model="freeDomainSettings.available_cycles"
                  type="checkbox"
                  :value="cycle.id"
                />
                <label :for="'cycle-' + cycle.id">{{ cycle.name }}</label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h3 class="section-title">{{ t('products_services.freedomain.tld_selection') }}</h3>
          <p class="section-description">{{ t('products_services.freedomain.tld_selection_desc') }}</p>
          
          <div class="tld-selection">
            <div class="search-container">
              <i class="fas fa-search search-icon"></i>
              <input 
                v-model="tldSearch" 
                type="text" 
                :placeholder="t('products_services.freedomain.search_tlds')" 
                class="search-input"
              />
            </div>
            
            <div class="tld-grid">
              <div 
                v-for="tld in filteredTlds" 
                :key="tld.id"
                class="tld-item"
                :class="{ 'selected': isTldSelected(tld.id) }"
                @click="toggleTld(tld.id)"
              >
                <span class="tld-name">{{ tld.name }}</span>
                <span class="tld-price">{{ formatPrice(tld.price) }}</span>
                <div v-if="isTldSelected(tld.id)" class="tld-selected-badge">
                  <i class="fas fa-check"></i>
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
          @click="cancelEditing"
        >
          {{ t('common.cancel') }}
        </button>
        
        <button 
          type="submit" 
          class="btn btn-primary" 
          :disabled="submitting"
        >
          {{ submitting ? t('common.saving') : t('common.save_continue') }}
          <span v-if="submitting" class="spinner-container">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useNotificationStore } from '@/stores/notifications'
import { useProductWizardStore } from '@/stores/product-wizard'
import { useProductStore } from '@/stores/products'
import logger from '@/services/logger'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()
const productWizardStore = useProductWizardStore()
const productStore = useProductStore()

// État local
const loading = ref(false)
const submitting = ref(false)
const tldSearch = ref('')
const tlds = ref([
  { id: 1, name: '.com', price: 12.99 },
  { id: 2, name: '.net', price: 14.99 },
  { id: 3, name: '.org', price: 13.99 },
  { id: 4, name: '.info', price: 9.99 },
  { id: 5, name: '.biz', price: 10.99 },
  { id: 6, name: '.io', price: 29.99 },
  { id: 7, name: '.dev', price: 19.99 },
  { id: 8, name: '.app', price: 18.99 },
  { id: 9, name: '.tech', price: 16.99 },
  { id: 10, name: '.shop', price: 15.99 },
  { id: 11, name: '.fr', price: 12.99 },
  { id: 12, name: '.eu', price: 14.99 }
])

// Structure pour les paramètres de domaine gratuit
const freeDomainSettings = ref<{
  enabled: boolean
  type: string
  discount_amount: number
  payment_type: string
  available_cycles: string[]
  available_tlds: number[]
}>({
  enabled: false,
  type: 'free', // 'free' ou 'discounted'
  discount_amount: 10,
  payment_type: 'once', // 'once' ou 'recurring'
  available_cycles: [],
  available_tlds: []
})

// Cycles de facturation disponibles
const billingCycles = [
  { id: 'monthly', name: t('products_services.pricing.monthly') },
  { id: 'quarterly', name: t('products_services.pricing.quarterly') },
  { id: 'semiannually', name: t('products_services.pricing.semiannually') },
  { id: 'annually', name: t('products_services.pricing.annually') },
  { id: 'biennially', name: t('products_services.pricing.biennially') },
  { id: 'triennially', name: t('products_services.pricing.triennially') }
]

// Paramètres de la route
const productType = computed(() => route.params.type as string)
const productId = computed(() => route.params.idOrAction as string)
const isEditMode = computed(() => !isNaN(parseInt(productId.value)))

// TLDs filtrés par recherche
const filteredTlds = computed(() => {
  const search = tldSearch.value.toLowerCase()
  if (!search) {
    return tlds.value
  }
  return tlds.value.filter(tld => tld.name.toLowerCase().includes(search))
})

// Vérifier si un TLD est sélectionné
const isTldSelected = (id: number) => {
  return freeDomainSettings.value.available_tlds.includes(id)
}

// Ajouter ou supprimer un TLD de la sélection
const toggleTld = (id: number) => {
  const index = freeDomainSettings.value.available_tlds.indexOf(id)
  if (index === -1) {
    freeDomainSettings.value.available_tlds.push(id)
  } else {
    freeDomainSettings.value.available_tlds.splice(index, 1)
  }
}

// Formater le prix
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

// Chargement des données
const loadData = async () => {
  loading.value = true
  
  try {
    // Si nous sommes en mode édition, charger les données du produit
    if (isEditMode.value) {
      if (!productWizardStore.productData.id) {
        const productDetails = await productStore.fetchProduct(productId.value)
        if (productDetails) {
          productWizardStore.setProductData(productDetails)
        }
      }
      
      // Restaurer les paramètres du domaine gratuit
      if (productWizardStore.productData.freedomain_settings) {
        freeDomainSettings.value = { ...productWizardStore.productData.freedomain_settings }
      }
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des données pour le domaine gratuit', { error });
    notificationStore.showNotification({ 
      type: 'error',
      title: t('common.error'),
      message: t('products_services.error_loading_data')
    })
  } finally {
    loading.value = false
  }
}

// Sauvegarder et continuer vers l'étape suivante
const saveAndContinue = async () => {
  submitting.value = true
  
  try {
    // Mettre à jour les données du produit dans le store
    productWizardStore.updateProductData({
      freedomain_settings: freeDomainSettings.value
    })
    
    // Si nous sommes en mode édition, sauvegarder directement
    if (isEditMode.value) {
      await productWizardStore.saveProduct()
    }
    
    // Rediriger vers l'étape suivante
    const nextStep = isEditMode.value 
      ? { name: 'product-cross-sells', params: { idOrAction: productId.value } }
      : { name: 'product-cross-sells', params: { type: productType.value } }
    
    router.push(nextStep)
    
    notificationStore.showNotification({
      type: 'success',
      title: t('common.success'),
      message: t('products_services.freedomain.saved_successfully')
    })
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde des paramètres de domaine gratuit', { error });
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.error_saving_data')
    })
  } finally {
    submitting.value = false
  }
}

// Navigation vers la liste des produits
const cancelEditing = () => {
  router.push({ name: 'products-list' })
}

// Hook de cycle de vie - Au montage du composant
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.product-freedomain-page {
  padding: var(--spacing-lg);
}

.freedomain-section {
  margin-top: var(--spacing-lg);
}

.section-description {
  color: var(--text-muted);
  margin-bottom: var(--spacing-lg);
}

.form-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 1.1rem;
  margin-bottom: var(--spacing-md);
  color: var(--text-color);
  font-weight: 500;
}

.custom-switch {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin-right: var(--spacing-md);
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #333;
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider::before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--primary-blue);
}

input:checked + .toggle-slider::before {
  transform: translateX(26px);
}

.settings-container {
  margin-top: var(--spacing-md);
}

.price-field {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
}

.price-field input {
  padding-left: 30px;
}

.billing-cycles-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.cycle-option {
  margin-bottom: var(--spacing-xs);
}

.custom-checkbox {
  display: flex;
  align-items: center;
}

.custom-checkbox input {
  margin-right: var(--spacing-sm);
}

.tld-selection {
  margin-top: var(--spacing-sm);
}

.search-container {
  position: relative;
  margin-bottom: var(--spacing-md);
}

.search-input {
  width: 100%;
  background: rgb(0 0 0 / 20%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 36px;
  color: var(--text-color);
  transition: all var(--transition-fast);
}

.search-input:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 2px rgb(0 102 255 / 25%);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.tld-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.tld-item {
  background: rgb(0 0 0 / 10%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  cursor: pointer;
  position: relative;
  transition: all var(--transition-fast);
}

.tld-item:hover {
  border-color: rgb(0 102 255 / 50%);
  transform: translateY(-2px);
}

.tld-item.selected {
  border-color: var(--primary-blue);
  background: rgb(0 102 255 / 10%);
}

.tld-name {
  display: block;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: var(--spacing-xs);
}

.tld-price {
  display: block;
  font-size: 0.875rem;
  color: var(--primary-blue);
}

.tld-selected-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  background: var(--primary-blue);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-lg);
}

@media (width <= 768px) {
  .billing-cycles-container,
  .tld-grid {
    grid-template-columns: 1fr;
  }
}
</style>