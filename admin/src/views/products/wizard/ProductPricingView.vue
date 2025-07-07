<template>
  <div>
    <p class="section-description">
      {{ t('products_services.pricing.description') }}
    </p>

    <div v-if="loading" class="text-center" style="padding: var(--spacing-xl)">
      <div class="spinner-loading" style="margin: 0 auto;"></div>
    </div>

    <form v-else @submit.prevent="saveAndContinue">
      <div class="pricing-grid">
        <div class="form-group">
          <label class="form-label">{{ t('products_services.pricing.setup_fee') }}</label>
          <div class="price-field">
            <span class="currency-symbol">€</span>
            <input 
              v-model="pricingData.setup_fee" 
              type="number" 
              class="form-control" 
              min="0"
              step="0.01"
            />
          </div>
          <p class="form-hint">{{ t('products_services.pricing.setup_fee_hint') }}</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products_services.pricing.base_price') }} *</label>
          <div class="price-field">
            <span class="currency-symbol">€</span>
            <input 
              v-model="pricingData.price" 
              type="number" 
              class="form-control" 
              min="0"
              step="0.01"
              required
            />
          </div>
          <p class="form-hint">{{ t('products_services.pricing.base_price_hint') }}</p>
        </div>
      </div>
      
      <div class="recurring-options">
        <h3 class="pricing-section-title">{{ t('products_services.pricing.recurring_options') }}</h3>
        
        <div class="custom-switch">
          <label class="toggle-switch">
            <input v-model="pricingData.recurring" type="checkbox">
            <span class="toggle-slider"></span>
          </label>
          <span>{{ t('products_services.pricing.recurring_pricing') }}</span>
        </div>
        
        <div v-if="pricingData.recurring" class="billing-cycles">
          <div v-for="cycle in availableCycles" :key="cycle.value" class="form-group">
            <label class="form-label">{{ cycle.name }}</label>
            <div class="price-field">
              <span class="currency-symbol">€</span>
              <input 
                v-model="pricingData[cycle.field]" 
                type="number" 
                class="form-control" 
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">{{ t('products_services.pricing.default_cycle') }}</label>
            <select v-model="pricingData.default_billing_cycle" class="form-control">
              <option v-for="cycle in enabledCycles" :key="cycle.value" :value="cycle.value">
                {{ cycle.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group form-checkbox">
            <input 
              id="allow_cycle_change" 
              v-model="pricingData.allow_cycle_change" 
              type="checkbox" 
              class="form-checkbox-input" 
            />
            <label for="allow_cycle_change" class="form-checkbox-label">
              {{ t('products_services.pricing.allow_cycle_change') }}
            </label>
            <p class="form-hint">{{ t('products_services.pricing.allow_cycle_change_hint') }}</p>
          </div>
        </div>
      </div>
      
      <div class="tax-options">
        <h3 class="pricing-section-title">{{ t('products_services.pricing.tax_options') }}</h3>
        
        <div class="form-group form-checkbox">
          <input 
            id="tax_included" 
            v-model="pricingData.tax_included" 
            type="checkbox" 
            class="form-checkbox-input" 
          />
          <label for="tax_included" class="form-checkbox-label">
            {{ t('products_services.pricing.tax_included') }}
          </label>
          <p class="form-hint">{{ t('products_services.pricing.tax_included_hint') }}</p>
        </div>
        
        <div class="form-group form-checkbox">
          <input 
            id="tax_exempt" 
            v-model="pricingData.tax_exempt" 
            type="checkbox" 
            class="form-checkbox-input" 
          />
          <label for="tax_exempt" class="form-checkbox-label">
            {{ t('products_services.pricing.tax_exempt') }}
          </label>
          <p class="form-hint">{{ t('products_services.pricing.tax_exempt_hint') }}</p>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useProductWizardStore } from '@/stores/product-wizard'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()
const productWizardStore = useProductWizardStore()

// État local
const loading = ref(false)
const submitting = ref(false)

// Type pour le système d'indexation des cycles de facturation
interface PricingFormData {
  setup_fee: number;
  price: number;
  recurring: boolean;
  price_monthly: number;
  price_quarterly: number;
  price_semiannually: number;
  price_annually: number;
  price_biennially: number;
  price_triennially: number;
  default_billing_cycle: string;
  allow_cycle_change: boolean;
  tax_included: boolean;
  tax_exempt: boolean;
  [key: string]: number | boolean | string; // Index signature pour permettre l'accès dynamique
}

// Données de tarification
const pricingData = ref<PricingFormData>({
  setup_fee: 0,
  price: 0,
  recurring: false,
  price_monthly: 0,
  price_quarterly: 0,
  price_semiannually: 0,
  price_annually: 0,
  price_biennially: 0,
  price_triennially: 0,
  default_billing_cycle: 'monthly',
  allow_cycle_change: true,
  tax_included: false,
  tax_exempt: false
})

// Paramètres de la route
const productType = computed(() => route.params.type as string)
const productId = computed(() => route.params.idOrAction as string)
const isEditMode = computed(() => !isNaN(parseInt(productId.value)))

// Cycles de facturation disponibles
const availableCycles = [
  { name: t('products_services.pricing.monthly'), value: 'monthly', field: 'price_monthly' },
  { name: t('products_services.pricing.quarterly'), value: 'quarterly', field: 'price_quarterly' },
  { name: t('products_services.pricing.semiannually'), value: 'semiannually', field: 'price_semiannually' },
  { name: t('products_services.pricing.annually'), value: 'annually', field: 'price_annually' },
  { name: t('products_services.pricing.biennially'), value: 'biennially', field: 'price_biennially' },
  { name: t('products_services.pricing.triennially'), value: 'triennially', field: 'price_triennially' }
]

// Cycles de facturation activés (prix > 0)
const enabledCycles = computed(() => {
  return availableCycles.filter(cycle => {
    const price = pricingData.value[cycle.field]
    // Vérifier que c'est un nombre et qu'il est supérieur à 0
    return price !== null && price !== undefined && typeof price === 'number' && price > 0
  })
})

// Chargement des données
const loadData = async () => {
  loading.value = true
  
  try {
    // Si nous sommes en mode édition et que les données de tarification n'ont pas été chargées
    if (isEditMode.value) {
      const productData = productWizardStore.productData
      
      // Initialiser les données de tarification à partir des données du produit
      pricingData.value = {
        setup_fee: productData.setup_fee || 0,
        price: productData.price || 0,
        recurring: productData.recurring || false,
        price_monthly: productData.price_monthly || 0,
        price_quarterly: productData.price_quarterly || 0,
        price_semiannually: productData.price_semiannually || 0,
        price_annually: productData.price_annually || 0,
        price_biennially: productData.price_biennially || 0,
        price_triennially: productData.price_triennially || 0,
        default_billing_cycle: productData.default_billing_cycle || 'monthly',
        allow_cycle_change: productData.allow_cycle_change !== false,
        tax_included: productData.tax_included || false,
        tax_exempt: productData.tax_exempt || false
      }
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des données', { error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.error_loading_data')
    })
  } finally {
    loading.value = false
  }
}

// Validation du formulaire
const validateForm = () => {
  if (pricingData.value.price < 0 || pricingData.value.setup_fee < 0) {
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.pricing.price_not_negative')
    })
    return false
  }
  
  return true
}

// Sauvegarder et continuer vers l'étape suivante
const saveAndContinue = async () => {
  if (!validateForm()) {
    return
  }
  
  submitting.value = true
  
  try {
    // Mettre à jour les données du produit dans le store
    productWizardStore.updateProductData({
      setup_fee: pricingData.value.setup_fee,
      price: pricingData.value.price,
      recurring: pricingData.value.recurring,
      price_monthly: pricingData.value.price_monthly,
      price_quarterly: pricingData.value.price_quarterly,
      price_semiannually: pricingData.value.price_semiannually,
      price_annually: pricingData.value.price_annually,
      price_biennially: pricingData.value.price_biennially,
      price_triennially: pricingData.value.price_triennially,
      default_billing_cycle: pricingData.value.default_billing_cycle,
      allow_cycle_change: pricingData.value.allow_cycle_change,
      tax_included: pricingData.value.tax_included,
      tax_exempt: pricingData.value.tax_exempt
    })
    
    // Si nous sommes en mode édition, sauvegarder directement
    if (isEditMode.value) {
      await productWizardStore.saveProduct()
    }
    
    // Rediriger vers l'étape suivante
    const nextStep = isEditMode.value 
      ? { name: 'product-module', params: { idOrAction: productId.value } }
      : { name: 'product-module', params: { type: productType.value } }
    
    router.push(nextStep)
    
    notificationStore.showNotification({
      type: 'success',
      title: t('common.success'),
      message: t('products_services.pricing.saved_successfully')
    })
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde', { error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.error_saving_data')
    })
  } finally {
    submitting.value = false
  }
}

// Hook de cycle de vie - Au montage du composant
onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import '@/assets/css/pages/products/product-pricing.css';
</style>