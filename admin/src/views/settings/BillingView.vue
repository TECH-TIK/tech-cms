<template>
  <div class="view-container">
    <div class="header-box">
      <div>
        <h1>{{ t('settings.billing.title') }}</h1>
        <div class="page-description">
          {{ t('settings.billing.description') }}
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div v-if="loading" class="loading-state">
        <div class="loading-state-icon">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div class="loading-state-text">{{ t('common.loading') }}</div>
      </div>
      
      <form v-else @submit.prevent="saveBillingSettings" class="table-box">
        <div class="settings-group">
          <h3>{{ t('settings.billing.general') }}</h3>
          
          <div class="form-group">
            <label class="form-label">{{ t('settings.billing.invoicePrefix') }}</label>
            <input 
              type="text" 
              class="form-control"
              v-model="billingSettings.invoicePrefix"
              placeholder="INV-"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('settings.billing.nextInvoiceNumber') }}</label>
            <input 
              type="number" 
              class="form-control"
              v-model="billingSettings.nextInvoiceNumber"
              min="1"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('settings.billing.defaultDueDays') }}</label>
            <input 
              type="number" 
              class="form-control"
              v-model="billingSettings.defaultDueDays"
              min="0"
            />
          </div>

          <div class="form-group">
            <div class="form-check">
              <input 
                type="checkbox"
                class="form-check-input"
                v-model="billingSettings.autoSendInvoices"
                id="autoSendInvoices"
              />
              <label class="form-check-label" for="autoSendInvoices">
                {{ t('settings.billing.autoSendInvoices') }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <div class="form-check">
              <input 
                type="checkbox"
                class="form-check-input"
                v-model="billingSettings.autoSendReceipts"
                id="autoSendReceipts"
              />
              <label class="form-check-label" for="autoSendReceipts">
                {{ t('settings.billing.autoSendReceipts') }}
              </label>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h3>{{ t('settings.billing.taxes') }}</h3>
          
          <div class="form-group">
            <div class="form-check">
              <input 
                type="checkbox"
                class="form-check-input"
                v-model="billingSettings.enableTaxes"
                id="enableTaxes"
              />
              <label class="form-check-label" for="enableTaxes">
                {{ t('settings.billing.enableTaxes') }}
              </label>
            </div>
          </div>

          <div v-if="billingSettings.enableTaxes">
            <div class="form-group">
              <label class="form-label">{{ t('settings.billing.defaultTaxName') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="billingSettings.defaultTaxName"
                placeholder="TVA"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.billing.defaultTaxRate') }}</label>
              <div class="input-group">
                <input 
                  type="number" 
                  class="form-control"
                  v-model="billingSettings.defaultTaxRate"
                  min="0"
                  step="0.01"
                />
                <div class="input-group-append">
                  <span class="input-group-text">%</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="billingSettings.taxNumberRequired"
                  id="taxNumberRequired"
                />
                <label class="form-check-label" for="taxNumberRequired">
                  {{ t('settings.billing.taxNumberRequired') }}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h3>{{ t('settings.billing.paymentMethods') }}</h3>
          
          <div class="payment-methods">
            <div 
              v-for="method in paymentMethods" 
              :key="method.id"
              class="payment-method"
            >
              <div class="payment-method-header">
                <div class="form-check">
                  <input 
                    type="checkbox"
                    class="form-check-input"
                    v-model="method.enabled"
                    :id="`payment-${method.id}`"
                  />
                  <label class="form-check-label" :for="`payment-${method.id}`">
                    {{ method.name }}
                  </label>
                </div>
              </div>
              
              <div v-if="method.enabled" class="payment-method-settings">
                <div v-if="method.id === 'stripe'" class="payment-method-fields">
                  <div class="form-group">
                    <label class="form-label">{{ t('settings.billing.stripePublicKey') }}</label>
                    <input 
                      type="text" 
                      class="form-control"
                      v-model="method.config.publicKey"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">{{ t('settings.billing.stripeSecretKey') }}</label>
                    <input 
                      type="password" 
                      class="form-control"
                      v-model="method.config.secretKey"
                    />
                  </div>
                </div>
                
                <div v-if="method.id === 'paypal'" class="payment-method-fields">
                  <div class="form-group">
                    <label class="form-label">{{ t('settings.billing.paypalClientId') }}</label>
                    <input 
                      type="text" 
                      class="form-control"
                      v-model="method.config.clientId"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">{{ t('settings.billing.paypalClientSecret') }}</label>
                    <input 
                      type="password" 
                      class="form-control"
                      v-model="method.config.clientSecret"
                    />
                  </div>
                  <div class="form-group">
                    <div class="form-check">
                      <input 
                        type="checkbox"
                        class="form-check-input"
                        v-model="method.config.sandbox"
                        id="paypal-sandbox"
                      />
                      <label class="form-check-label" for="paypal-sandbox">
                        {{ t('settings.billing.paypalSandbox') }}
                      </label>
                    </div>
                  </div>
                </div>
                
                <div v-if="method.id === 'bank'" class="payment-method-fields">
                  <div class="form-group">
                    <label class="form-label">{{ t('settings.billing.bankDetails') }}</label>
                    <textarea 
                      class="form-control"
                      v-model="method.config.details"
                      rows="4"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="submit"
            class="btn btn-primary"
            :disabled="saving"
          >
            <i v-if="saving" class="fas fa-spinner fa-spin" />
            {{ t('common.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationStore } from '@/stores/notifications'
import '@/assets/css/components/common-layout.css'
import '@/assets/css/pages/settings.css'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(true)
const saving = ref(false)

const billingSettings = ref({
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 1,
  defaultDueDays: 15,
  autoSendInvoices: true,
  autoSendReceipts: true,
  enableTaxes: true,
  defaultTaxName: 'TVA',
  defaultTaxRate: 20,
  taxNumberRequired: false
})

const paymentMethods = reactive([
  {
    id: 'stripe',
    name: 'Stripe',
    enabled: false,
    config: {
      publicKey: '',
      secretKey: ''
    }
  },
  {
    id: 'paypal',
    name: 'PayPal',
    enabled: false,
    config: {
      clientId: '',
      clientSecret: '',
      sandbox: true
    }
  },
  {
    id: 'bank',
    name: t('settings.billing.bankTransfer'),
    enabled: true,
    config: {
      details: ''
    }
  },
  {
    id: 'cash',
    name: t('settings.billing.cash'),
    enabled: true,
    config: {}
  }
])

// Méthodes
const fetchSettings = async () => {
  try {
    loading.value = true
    const billing = await settingsStore.fetchBillingSettings()
    
    if (billing.general) {
      billingSettings.value = billing.general
    }
    
    if (billing.paymentMethods) {
      billing.paymentMethods.forEach((method: any) => {
        const existingMethod = paymentMethods.find(m => m.id === method.id)
        if (existingMethod) {
          existingMethod.enabled = method.enabled
          if (method.config) {
            existingMethod.config = { ...existingMethod.config, ...method.config }
          }
        }
      })
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres de facturation:', error)
    notificationStore.notificationError(t('settings.loadError'))
  } finally {
    loading.value = false
  }
}

const saveBillingSettings = async () => {
  try {
    saving.value = true
    
    const settings = {
      general: billingSettings.value,
      paymentMethods: paymentMethods
    }
    
    await settingsStore.updateBillingSettings(settings)
    notificationStore.success(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres de facturation:', error)
    notificationStore.notificationError(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

// Cycle de vie
onMounted(async () => {
  await fetchSettings()
})
</script>

<style scoped>
.settings-section {
  margin-top: 20px;
}

.settings-group {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.settings-group:last-child {
  border-bottom: none;
}

.settings-group h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #374151;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  max-width: 400px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.input-group {
  display: flex;
  max-width: 400px;
}

.input-group-text {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-left: none;
  border-radius: 0 0.375rem 0.375rem 0;
}

.form-check {
  display: flex;
  align-items: center;
}

.form-check-input {
  margin-right: 0.5rem;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
}

.loading-state-icon {
  margin-right: 10px;
  color: #3b82f6;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.payment-method {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.payment-method-header {
  margin-bottom: 1rem;
}

.payment-method-settings {
  padding-left: 1.5rem;
}

.payment-method-fields {
  margin-top: 1rem;
}
</style>
