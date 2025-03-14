<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
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
  return tab ? tab.id : 'pricing'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  // Sauvegarder les données dans localStorage
  localStorage.setItem('pricingData', JSON.stringify(pricingData.value))
  
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

// État
const loading = ref(false)
const errors = ref({})

// Données de tarification
const pricingData = ref({
  // Type de paiement
  paymentType: 'free', // free, one_time, recurring
  
  // Options pour les quantités multiples
  allowMultipleQuantities: false,
  
  // Options pour les cycles récurrents
  recurringCyclesLimit: 0,
  
  // Termes de résiliation automatique
  autoTerminationDays: 0,
  
  // Modèle de promotion
  promotionCode: '',
  
  // Facturation au prorata
  prorataBilling: false,
  
  // Date de facturation privée
  privateBillingDate: 0,
  
  // Mois de facturation
  chargeNextMonth: 0,
  
  // Configuration des prix
  pricingConfiguration: 'system_default', // system_default, product_specific
  
  // Options de paiement anticipé
  paymentOptions: {
    monthly: { enabled: true, price: 0, setupFee: 0 },
    quarterly: { enabled: false, price: 0, setupFee: 0 },
    semiannually: { enabled: false, price: 0, setupFee: 0 },
    annually: { enabled: false, price: 0, setupFee: 0 },
    biennially: { enabled: false, price: 0, setupFee: 0 },
    triennially: { enabled: false, price: 0, setupFee: 0 }
  }
})

// Fusionner les données précédentes avec les données de tarification
onMounted(() => {
  if (previousData.value) {
    // Fusionner uniquement les propriétés qui existent dans pricingData
    Object.keys(pricingData.value).forEach(key => {
      if (previousData.value[key] !== undefined) {
        pricingData.value[key] = previousData.value[key]
      }
    })
  }
})

// Validation du formulaire
const validateForm = () => {
  const formErrors = {} as Record<string, string>
  
  // Validation spécifique pour le type de paiement récurrent
  if (pricingData.value.paymentType === 'recurring') {
    // Vérifier que au moins une option de paiement est activée
    const hasEnabledOption = Object.values(pricingData.value.paymentOptions).some(
      option => (option as any).enabled
    )
    
    if (!hasEnabledOption) {
      formErrors.paymentOptions = t('products_services.pricing.errors.no_payment_option')
    }
  }
  
  errors.value = formErrors
  return Object.keys(formErrors).length === 0
}

// Continuer vers l'étape suivante
const continueToNextStep = () => {
  // Sauvegarder les données
  localStorage.setItem('pricingData', JSON.stringify(pricingData.value))
  
  // Naviguer vers la prochaine étape
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-module',
    params: { idOrAction }
  })
}

// Retour à l'étape précédente
const goBack = () => {
  // Sauvegarder les données
  localStorage.setItem('pricingData', JSON.stringify(pricingData.value))
  
  // Naviguer vers l'étape précédente
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-details',
    params: { idOrAction }
  })
}
</script>
<template>
  <div class="product-pricing-view">
    <div class="wizard-content">
      <div class="form-section">
        <!-- Type de paiement -->
        <div class="form-group">
          <label>{{ t('products_services.pricing.payment_type') }}</label>
          <div class="payment-type-options">
            <div class="form-check form-check-inline">
              <input 
                type="radio" 
                id="payment-type-free" 
                v-model="pricingData.paymentType"
                value="free"
                class="form-check-input"
              />
              <label class="form-check-label" for="payment-type-free">
                {{ t('products_services.pricing.free') }}
              </label>
            </div>
            
            <div class="form-check form-check-inline">
              <input 
                type="radio" 
                id="payment-type-one-time" 
                v-model="pricingData.paymentType"
                value="one_time"
                class="form-check-input"
              />
              <label class="form-check-label" for="payment-type-one-time">
                {{ t('products_services.pricing.one_time') }}
              </label>
            </div>
            
            <div class="form-check form-check-inline">
              <input 
                type="radio" 
                id="payment-type-recurring" 
                v-model="pricingData.paymentType"
                value="recurring"
                class="form-check-input"
              />
              <label class="form-check-label" for="payment-type-recurring">
                {{ t('products_services.pricing.recurring') }}
              </label>
            </div>
          </div>
        </div>
        
        <!-- Options pour les quantités multiples -->
        <div class="form-group">
          <label>{{ t('products_services.pricing.allow_multiple_quantities') }}</label>
          <div class="form-check">
            <input 
              type="radio" 
              id="multiple-quantities-no" 
              v-model="pricingData.allowMultipleQuantities"
              :value="false"
              class="form-check-input"
            />
            <label class="form-check-label" for="multiple-quantities-no">
              {{ t('products_services.pricing.no') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.pricing.multiple_quantities_no_help') }}</small>
          </div>
          
          <div class="form-check">
            <input 
              type="radio" 
              id="multiple-quantities-yes" 
              v-model="pricingData.allowMultipleQuantities"
              :value="true"
              class="form-check-input"
            />
            <label class="form-check-label" for="multiple-quantities-yes">
              {{ t('products_services.pricing.yes') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.pricing.multiple_quantities_yes_help') }}</small>
          </div>
        </div>
        
        <!-- Options pour les cycles récurrents (si paiement récurrent) -->
        <div class="form-group" v-if="pricingData.paymentType === 'recurring'">
          <label>{{ t('products_services.pricing.recurring_cycles_limit') }}</label>
          <input 
            type="number" 
            v-model.number="pricingData.recurringCyclesLimit"
            class="form-control"
            min="0"
          />
          <small class="form-text text-muted">{{ t('products_services.pricing.recurring_cycles_limit_help') }}</small>
        </div>
        
        <!-- Termes de résiliation automatique -->
        <div class="form-group">
          <label>{{ t('products_services.pricing.auto_termination_days') }}</label>
          <input 
            type="number" 
            v-model.number="pricingData.autoTerminationDays"
            class="form-control"
            min="0"
          />
          <small class="form-text text-muted">{{ t('products_services.pricing.auto_termination_days_help') }}</small>
        </div>
        
        <!-- Modèle de promotion -->
        <div class="form-group">
          <label>{{ t('products_services.pricing.promotion_code') }}</label>
          <input 
            type="text" 
            v-model="pricingData.promotionCode"
            class="form-control"
          />
          <small class="form-text text-muted">{{ t('products_services.pricing.promotion_code_help') }}</small>
        </div>
        
        <!-- Facturation au prorata -->
        <div class="form-group">
          <div class="form-check">
            <input 
              type="checkbox" 
              id="prorata-billing" 
              v-model="pricingData.prorataBilling"
              class="form-check-input"
            />
            <label class="form-check-label" for="prorata-billing">
              {{ t('products_services.pricing.prorata_billing') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.pricing.prorata_billing_help') }}</small>
          </div>
        </div>
        
        <!-- Date de facturation privée -->
        <div class="form-group">
          <label>{{ t('products_services.pricing.private_billing_date') }}</label>
          <input 
            type="number" 
            v-model.number="pricingData.privateBillingDate"
            class="form-control"
            min="0"
            max="31"
          />
          <small class="form-text text-muted">{{ t('products_services.pricing.private_billing_date_help') }}</small>
        </div>
        
        <!-- Mois de facturation -->
        <div class="form-group">
          <label>{{ t('products_services.pricing.charge_next_month') }}</label>
          <input 
            type="number" 
            v-model.number="pricingData.chargeNextMonth"
            class="form-control"
            min="0"
            max="31"
          />
          <small class="form-text text-muted">{{ t('products_services.pricing.charge_next_month_help') }}</small>
        </div>
        
        <!-- Configuration des prix -->
        <div class="form-group" v-if="pricingData.paymentType !== 'free'">
          <label>{{ t('products_services.pricing.pricing_configuration') }}</label>
          
          <div class="form-check">
            <input 
              type="radio" 
              id="pricing-system-default" 
              v-model="pricingData.pricingConfiguration"
              value="system_default"
              class="form-check-input"
            />
            <label class="form-check-label" for="pricing-system-default">
              {{ t('products_services.pricing.system_default') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.pricing.system_default_help') }}</small>
          </div>
          
          <div class="form-check">
            <input 
              type="radio" 
              id="pricing-product-specific" 
              v-model="pricingData.pricingConfiguration"
              value="product_specific"
              class="form-check-input"
            />
            <label class="form-check-label" for="pricing-product-specific">
              {{ t('products_services.pricing.product_specific') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.pricing.product_specific_help') }}</small>
          </div>
        </div>
        
        <!-- Options de paiement anticipé (si configuration spécifique au produit) -->
        <div class="payment-options" v-if="pricingData.paymentType !== 'free' && pricingData.pricingConfiguration === 'product_specific'">
          <h3 class="section-title">{{ t('products_services.pricing.payment_options') }}</h3>
          
          <div class="payment-options-header">
            <div class="option-label">{{ t('products_services.pricing.option') }}</div>
            <div class="option-enabled">{{ t('products_services.pricing.enabled') }}</div>
            <div class="option-price">{{ t('products_services.pricing.price') }}</div>
            <div class="option-setup-fee">{{ t('products_services.pricing.setup_fee') }}</div>
          </div>
          
          <!-- Option mensuelle -->
          <div class="payment-option-row">
            <div class="option-label">{{ t('products_services.pricing.monthly') }}</div>
            <div class="option-enabled">
              <input 
                type="checkbox" 
                v-model="pricingData.paymentOptions.monthly.enabled"
                class="form-check-input"
              />
            </div>
            <div class="option-price">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.monthly.price"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.monthly.enabled"
                />
              </div>
            </div>
            <div class="option-setup-fee">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.monthly.setupFee"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.monthly.enabled"
                />
              </div>
            </div>
          </div>
          
          <!-- Option trimestrielle -->
          <div class="payment-option-row">
            <div class="option-label">{{ t('products_services.pricing.quarterly') }}</div>
            <div class="option-enabled">
              <input 
                type="checkbox" 
                v-model="pricingData.paymentOptions.quarterly.enabled"
                class="form-check-input"
              />
            </div>
            <div class="option-price">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.quarterly.price"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.quarterly.enabled"
                />
              </div>
            </div>
            <div class="option-setup-fee">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.quarterly.setupFee"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.quarterly.enabled"
                />
              </div>
            </div>
          </div>
          
          <!-- Option semestrielle -->
          <div class="payment-option-row">
            <div class="option-label">{{ t('products_services.pricing.semiannually') }}</div>
            <div class="option-enabled">
              <input 
                type="checkbox" 
                v-model="pricingData.paymentOptions.semiannually.enabled"
                class="form-check-input"
              />
            </div>
            <div class="option-price">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.semiannually.price"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.semiannually.enabled"
                />
              </div>
            </div>
            <div class="option-setup-fee">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.semiannually.setupFee"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.semiannually.enabled"
                />
              </div>
            </div>
          </div>
          
          <!-- Option annuelle -->
          <div class="payment-option-row">
            <div class="option-label">{{ t('products_services.pricing.annually') }}</div>
            <div class="option-enabled">
              <input 
                type="checkbox" 
                v-model="pricingData.paymentOptions.annually.enabled"
                class="form-check-input"
              />
            </div>
            <div class="option-price">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.annually.price"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.annually.enabled"
                />
              </div>
            </div>
            <div class="option-setup-fee">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.annually.setupFee"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.annually.enabled"
                />
              </div>
            </div>
          </div>
          
          <!-- Option biennale -->
          <div class="payment-option-row">
            <div class="option-label">{{ t('products_services.pricing.biennially') }}</div>
            <div class="option-enabled">
              <input 
                type="checkbox" 
                v-model="pricingData.paymentOptions.biennially.enabled"
                class="form-check-input"
              />
            </div>
            <div class="option-price">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.biennially.price"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.biennially.enabled"
                />
              </div>
            </div>
            <div class="option-setup-fee">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.biennially.setupFee"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.biennially.enabled"
                />
              </div>
            </div>
          </div>
          
          <!-- Option triennale -->
          <div class="payment-option-row">
            <div class="option-label">{{ t('products_services.pricing.triennially') }}</div>
            <div class="option-enabled">
              <input 
                type="checkbox" 
                v-model="pricingData.paymentOptions.triennially.enabled"
                class="form-check-input"
              />
            </div>
            <div class="option-price">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.triennially.price"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.triennially.enabled"
                />
              </div>
            </div>
            <div class="option-setup-fee">
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input 
                  type="number" 
                  v-model.number="pricingData.paymentOptions.triennially.setupFee"
                  class="form-control"
                  min="0"
                  step="0.01"
                  :disabled="!pricingData.paymentOptions.triennially.enabled"
                />
              </div>
            </div>
          </div>
          
          <div v-if="errors.paymentOptions" class="error-message">
            {{ errors.paymentOptions }}
          </div>
          
          <p class="payment-options-help">
            {{ t('products_services.pricing.payment_options_help') }}
          </p>
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

.product-pricing-view {
  /* Styles pour la navigation par onglets */
  .wizard-content {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }

  .form-section {
    margin-bottom: var(--spacing-xl);
  }

  .form-group {
    margin-bottom: var(--spacing-lg);
  }

  .form-control {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--text-color);
    padding: 0.75rem 1rem;
    width: 100%;
    transition: all var(--transition-fast);
  }

  .form-control:focus {
    border-color: var(--primary-blue);
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 195, 255, 0.25);
  }

  .form-control.is-invalid {
    border-color: var(--error);
  }

  .form-check {
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: flex-start;
  }

  .form-check-input {
    margin-top: 0.3rem;
    margin-right: 0.75rem;
  }

  .form-check-inline {
    display: inline-flex;
    margin-right: var(--spacing-lg);
  }

  .form-check-label {
    font-weight: 500;
  }

  .form-text {
    color: var(--text-muted);
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .payment-type-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: var(--spacing-md);
    color: var(--text-color);
  }

  .payment-options {
    background: rgba(255, 255, 255, 0.02);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    margin-top: var(--spacing-xl);
  }

  .payment-options-header {
    display: grid;
    grid-template-columns: 1.5fr 0.5fr 1fr 1fr;
    gap: var(--spacing-md);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--glass-border);
    font-weight: 600;
    color: var(--text-color);
  }

  .payment-option-row {
    display: grid;
    grid-template-columns: 1.5fr 0.5fr 1fr 1fr;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    align-items: center;
  }

  .option-label {
    font-weight: 500;
  }

  .option-enabled {
    display: flex;
    justify-content: center;
  }

  .input-group {
    display: flex;
    align-items: stretch;
  }

  .input-group-prepend {
    display: flex;
  }

  .input-group-text {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--glass-border);
    border-right: none;
    border-top-left-radius: var(--radius-md);
    border-bottom-left-radius: var(--radius-md);
    color: var(--text-muted);
    padding: 0.5rem 0.75rem;
  }

  .input-group .form-control {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .error-message {
    color: var(--error);
    font-size: 0.875rem;
    margin-top: var(--spacing-md);
  }

  .payment-options-help {
    color: var(--text-muted);
    font-size: 0.875rem;
    margin-top: var(--spacing-md);
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
    transition: all var(--transition-fast);
  }

  .btn-primary {
    background: linear-gradient(to right, var(--primary-blue), var(--secondary-blue));
    border: none;
    color: white;
  }

  .btn-outline-secondary {
    background: transparent;
    border: 1px solid var(--text-muted);
    color: var(--text-muted);
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-outline-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .payment-options-header,
    .payment-option-row {
      grid-template-columns: 1fr 0.5fr;
      row-gap: var(--spacing-sm);
    }
    
    .payment-options-header .option-price,
    .payment-options-header .option-setup-fee {
      display: none;
    }
    
    .option-price,
    .option-setup-fee {
      grid-column: span 2;
    }
    
    .option-price::before {
      content: attr(data-label);
      font-weight: 600;
      margin-bottom: var(--spacing-xs);
      display: block;
    }
    
    .option-setup-fee::before {
      content: attr(data-label);
      font-weight: 600;
      margin-bottom: var(--spacing-xs);
      display: block;
    }
  }
}
</style>
