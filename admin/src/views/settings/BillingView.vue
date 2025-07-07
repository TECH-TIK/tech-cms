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
      
      <form v-else class="table-box" @submit.prevent="saveBillingSettings">
        <div class="settings-group">
          <h3>{{ t('settings.billing.general') }}</h3>
          
          <div class="form-group">
            <label class="form-label">{{ t('settings.billing.invoicePrefix') }}</label>
            <input 
              v-model="billingSettings.invoicePrefix" 
              type="text"
              class="form-control"
              placeholder="INV-"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('settings.billing.nextInvoiceNumber') }}</label>
            <input 
              v-model="billingSettings.nextInvoiceNumber" 
              type="number"
              class="form-control"
              min="1"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('settings.billing.defaultDueDays') }}</label>
            <input 
              v-model="billingSettings.defaultDueDays" 
              type="number"
              class="form-control"
              min="0"
            />
          </div>

          <div class="form-group">
            <div class="form-check">
              <input 
                id="autoSendInvoices"
                v-model="billingSettings.autoSendInvoices"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="autoSendInvoices">
                {{ t('settings.billing.autoSendInvoices') }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <div class="form-check">
              <input 
                id="autoSendReceipts"
                v-model="billingSettings.autoSendReceipts"
                type="checkbox"
                class="form-check-input"
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
                id="enableTaxes"
                v-model="billingSettings.enableTaxes"
                type="checkbox"
                class="form-check-input"
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
                v-model="billingSettings.defaultTaxName" 
                type="text"
                class="form-control"
                placeholder="TVA"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.billing.defaultTaxRate') }}</label>
              <div class="input-group">
                <input 
                  v-model="billingSettings.defaultTaxRate" 
                  type="number"
                  class="form-control"
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
                  id="taxNumberRequired"
                  v-model="billingSettings.taxNumberRequired"
                  type="checkbox"
                  class="form-check-input"
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
                    :id="`payment-${method.id}`"
                    v-model="method.enabled"
                    type="checkbox"
                    class="form-check-input"
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
                      v-model="method.config.publicKey" 
                      type="text"
                      class="form-control"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">{{ t('settings.billing.stripeSecretKey') }}</label>
                    <input 
                      v-model="method.config.secretKey" 
                      type="password"
                      class="form-control"
                    />
                  </div>
                </div>
                
                <div v-if="method.id === 'paypal'" class="payment-method-fields">
                  <div class="form-group">
                    <label class="form-label">{{ t('settings.billing.paypalClientId') }}</label>
                    <input 
                      v-model="method.config.clientId" 
                      type="text"
                      class="form-control"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">{{ t('settings.billing.paypalClientSecret') }}</label>
                    <input 
                      v-model="method.config.clientSecret" 
                      type="password"
                      class="form-control"
                    />
                  </div>
                  <div class="form-group">
                    <div class="form-check">
                      <input 
                        id="paypal-sandbox"
                        v-model="method.config.sandbox"
                        type="checkbox"
                        class="form-check-input"
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
                      v-model="method.config.details"
                      class="form-control"
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
import logger from '@/services/logger'
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
      // Vérifier si paymentMethods est un tableau
      if (Array.isArray(billing.paymentMethods)) {
        billing.paymentMethods.forEach((method: any) => {
          const existingMethod = paymentMethods.find(m => m.id === method.id)
          if (existingMethod) {
            existingMethod.enabled = method.enabled
            if (method.config) {
              existingMethod.config = { ...existingMethod.config, ...method.config }
            }
          }
        })
      } else {
        // Si c'est un objet avec stripe, paypal, etc.
        Object.entries(billing.paymentMethods).forEach(([key, method]: [string, any]) => {
          const existingMethod = paymentMethods.find(m => m.id === key)
          if (existingMethod && method) {
            existingMethod.enabled = method.enabled
            if (method.config) {
              existingMethod.config = { ...existingMethod.config, ...method.config }
            }
          }
        })
      }
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des paramètres de facturation', { error })
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
    logger.error('Erreur lors de la sauvegarde des paramètres de facturation', { error })
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
