<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationStore } from '@/stores/notifications'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

// État
const activeTab = ref('general')
const loading = ref(true)
const saving = ref(false)
const generalSettings = ref({
  siteName: '',
  siteUrl: '',
  adminEmail: '',
  defaultLanguage: 'fr',
  timezone: 'Europe/Paris',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  currency: 'EUR',
  maintenanceMode: false,
  maintenanceMessage: ''
})

const notificationSettings = ref({
  emailNotifications: true,
  pushNotifications: true,
  desktopNotifications: true,
  notifyOn: {
    newTicket: true,
    ticketReply: true,
    newInvoice: true,
    paymentReceived: true,
    systemUpdates: true
  }
})

const securitySettings = ref({
  twoFactorAuth: false,
  sessionTimeout: 30,
  passwordPolicy: {
    minLength: 8,
    requireNumbers: true,
    requireSymbols: true,
    requireUppercase: true
  },
  ipWhitelist: [],
  apiKeys: []
})

const billingSettings = ref({
  vatRate: 20,
  defaultPaymentTerms: 30,
  paymentMethods: {
    stripe: {
      enabled: false,
      testMode: true,
      publishableKey: '',
      secretKey: ''
    },
    paypal: {
      enabled: false,
      testMode: true,
      clientId: '',
      clientSecret: ''
    }
  },
  invoicePrefix: 'INV-',
  autoReminders: true,
  reminderDays: [7, 3, 1]
})

const integrationSettings = ref({
  ably: {
    enabled: true,
    apiKey: ''
  },
  smtp: {
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls'
  },
  webhooks: []
})

const licenseSettings = ref({
  licenseKey: '',
  licenseType: ''
})

// Méthodes
const fetchSettings = async () => {
  try {
    loading.value = true
    const [general, notifications, security, billing, integrations, license] = await Promise.all([
      settingsStore.fetchGeneralSettings(),
      notificationStore.fetchPreferences(),
      settingsStore.fetchSecuritySettings(),
      settingsStore.fetchBillingSettings(),
      settingsStore.fetchIntegrationSettings(),
      settingsStore.fetchLicenseSettings()
    ])
    generalSettings.value = general
    notificationSettings.value = notifications
    securitySettings.value = security
    billingSettings.value = billing
    integrationSettings.value = integrations
    licenseSettings.value = license
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
  } finally {
    loading.value = false
  }
}

const saveGeneralSettings = async () => {
  try {
    saving.value = true
    await settingsStore.updateGeneralSettings(generalSettings.value)
    await settingsStore.showSuccessMessage(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres généraux:', error)
    await settingsStore.showErrorMessage(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

const saveNotificationSettings = async () => {
  try {
    saving.value = true
    await notificationStore.updatePreferences(notificationSettings.value)
    await settingsStore.showSuccessMessage(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres de notification:', error)
    await settingsStore.showErrorMessage(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

const saveSecuritySettings = async () => {
  try {
    saving.value = true
    await settingsStore.updateSecuritySettings(securitySettings.value)
    await settingsStore.showSuccessMessage(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres de sécurité:', error)
    await settingsStore.showErrorMessage(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

const saveBillingSettings = async () => {
  try {
    saving.value = true
    await settingsStore.updateBillingSettings(billingSettings.value)
    await settingsStore.showSuccessMessage(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres de facturation:', error)
    await settingsStore.showErrorMessage(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

const saveIntegrationSettings = async () => {
  try {
    saving.value = true
    await settingsStore.updateIntegrationSettings(integrationSettings.value)
    await settingsStore.showSuccessMessage(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres d\'intégration:', error)
    await settingsStore.showErrorMessage(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

const saveLicenseSettings = async () => {
  try {
    saving.value = true
    await settingsStore.updateLicenseSettings(licenseSettings.value)
    await settingsStore.showSuccessMessage(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres de licence:', error)
    await settingsStore.showErrorMessage(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

const handleDeleteApiKey = async (id) => {
  try {
    await settingsStore.deleteApiKey(id)
    await settingsStore.showSuccessMessage(t('settings.apiKeyDeleted'))
  } catch (error) {
    console.error('Erreur lors de la suppression de la clé API:', error)
    await settingsStore.showErrorMessage(t('settings.apiKeyDeleteError'))
  }
}

const handleGenerateApiKey = async () => {
  try {
    const newKey = await settingsStore.generateApiKey()
    securitySettings.value.apiKeys.push(newKey)
    await settingsStore.showSuccessMessage(t('settings.security.keyGenerated'))
  } catch (error) {
    console.error('Erreur lors de la génération de la clé API:', error)
    await settingsStore.showErrorMessage(t('settings.security.keyGenerationError'))
  }
}

const handleTestSmtp = async () => {
  try {
    saving.value = true
    await settingsStore.testSmtpConnection()
    await settingsStore.showSuccessMessage(t('settings.integrations.smtpTestSuccess'))
  } catch (error) {
    console.error('Erreur lors du test SMTP:', error)
    await settingsStore.showErrorMessage(t('settings.integrations.smtpTestError'))
  } finally {
    saving.value = false
  }
}

// Cycle de vie
onMounted(async () => {
  try {
    const [general, security, billing, integrations, license] = await Promise.all([
      settingsStore.fetchGeneralSettings(),
      settingsStore.fetchSecuritySettings(),
      settingsStore.fetchBillingSettings(),
      settingsStore.fetchIntegrationSettings(),
      settingsStore.fetchLicenseSettings()
    ])
    
    generalSettings.value = general
    securitySettings.value = security
    billingSettings.value = billing
    integrationSettings.value = integrations
    licenseSettings.value = license
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
    await settingsStore.showErrorMessage(t('settings.loadError'))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="settings-view">
    <div class="header-box">
      <h1>{{ t('settings.title') }}</h1>
    </div>

    <div class="settings-container">
      <div class="filter-box">
        <div class="settings-tabs">
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'general' }"
            @click="activeTab = 'general'"
          >
            <i class="fas fa-cog" />
            {{ t('settings.tabs.general') }}
          </button>
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'notifications' }"
            @click="activeTab = 'notifications'"
          >
            <i class="fas fa-bell" />
            {{ t('settings.tabs.notifications') }}
          </button>
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'security' }"
            @click="activeTab = 'security'"
          >
            <i class="fas fa-shield-alt" />
            {{ t('settings.tabs.security') }}
          </button>
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'billing' }"
            @click="activeTab = 'billing'"
          >
            <i class="fas fa-credit-card" />
            {{ t('settings.tabs.billing') }}
          </button>
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'integrations' }"
            @click="activeTab = 'integrations'"
          >
            <i class="fas fa-plug" />
            {{ t('settings.tabs.integrations') }}
          </button>
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'license' }"
            @click="activeTab = 'license'"
          >
            <i class="fas fa-key" />
            {{ t('settings.tabs.license') }}
          </button>
        </div>
      </div>

      <div class="table-box">
        <div v-if="loading" class="settings-loading">
          <i class="fas fa-spinner fa-spin" />
          {{ t('common.loading') }}
        </div>

        <div v-else-if="activeTab === 'general'" class="settings-section">
          <h2>{{ t('settings.general.title') }}</h2>
          
          <form @submit.prevent="saveGeneralSettings">
            <div class="form-group">
              <label class="form-label">{{ t('settings.general.siteName') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="generalSettings.siteName"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.general.siteUrl') }}</label>
              <input 
                type="url" 
                class="form-control"
                v-model="generalSettings.siteUrl"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.general.adminEmail') }}</label>
              <input 
                type="email" 
                class="form-control"
                v-model="generalSettings.adminEmail"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('settings.general.language') }}</label>
                <select 
                  class="form-control"
                  v-model="generalSettings.defaultLanguage"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('settings.general.timezone') }}</label>
                <select 
                  class="form-control"
                  v-model="generalSettings.timezone"
                >
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('settings.general.dateFormat') }}</label>
                <select 
                  class="form-control"
                  v-model="generalSettings.dateFormat"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('settings.general.timeFormat') }}</label>
                <select 
                  class="form-control"
                  v-model="generalSettings.timeFormat"
                >
                  <option value="24h">24h</option>
                  <option value="12h">12h</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('settings.general.currency') }}</label>
                <select 
                  class="form-control"
                  v-model="generalSettings.currency"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="generalSettings.maintenanceMode"
                  id="maintenanceMode"
                />
                <label class="form-check-label" for="maintenanceMode">
                  {{ t('settings.general.maintenanceMode') }}
                </label>
              </div>
            </div>

            <div 
              v-if="generalSettings.maintenanceMode"
              class="form-group"
            >
              <label class="form-label">{{ t('settings.general.maintenanceMessage') }}</label>
              <textarea 
                class="form-control"
                v-model="generalSettings.maintenanceMessage"
                rows="3"
              ></textarea>
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

        <div v-else-if="activeTab === 'notifications'" class="settings-section">
          <h2>{{ t('settings.notifications.title') }}</h2>
          
          <form @submit.prevent="saveNotificationSettings">
            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="notificationSettings.emailNotifications"
                  id="emailNotifications"
                />
                <label class="form-check-label" for="emailNotifications">
                  {{ t('settings.notifications.email') }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="notificationSettings.pushNotifications"
                  id="pushNotifications"
                />
                <label class="form-check-label" for="pushNotifications">
                  {{ t('settings.notifications.push') }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="notificationSettings.desktopNotifications"
                  id="desktopNotifications"
                />
                <label class="form-check-label" for="desktopNotifications">
                  {{ t('settings.notifications.desktop') }}
                </label>
              </div>
            </div>

            <h3>{{ t('settings.notifications.events') }}</h3>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="notificationSettings.notifyOn.newTicket"
                  id="notifyNewTicket"
                />
                <label class="form-check-label" for="notifyNewTicket">
                  {{ t('settings.notifications.newTicket') }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="notificationSettings.notifyOn.ticketReply"
                  id="notifyTicketReply"
                />
                <label class="form-check-label" for="notifyTicketReply">
                  {{ t('settings.notifications.ticketReply') }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="notificationSettings.notifyOn.newInvoice"
                  id="notifyNewInvoice"
                />
                <label class="form-check-label" for="notifyNewInvoice">
                  {{ t('settings.notifications.newInvoice') }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="notificationSettings.notifyOn.paymentReceived"
                  id="notifyPaymentReceived"
                />
                <label class="form-check-label" for="notifyPaymentReceived">
                  {{ t('settings.notifications.paymentReceived') }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="notificationSettings.notifyOn.systemUpdates"
                  id="notifySystemUpdates"
                />
                <label class="form-check-label" for="notifySystemUpdates">
                  {{ t('settings.notifications.systemUpdates') }}
                </label>
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

        <div v-else-if="activeTab === 'security'" class="settings-section">
          <h2>{{ t('settings.security.title') }}</h2>
          
          <form @submit.prevent="saveSecuritySettings">
            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="securitySettings.twoFactorAuth"
                  id="twoFactorAuth"
                />
                <label class="form-check-label" for="twoFactorAuth">
                  {{ t('settings.security.twoFactorAuth') }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.security.sessionTimeout') }}</label>
              <select 
                class="form-control"
                v-model="securitySettings.sessionTimeout"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 heure</option>
                <option value="120">2 heures</option>
              </select>
            </div>

            <h3>{{ t('settings.security.passwordPolicy') }}</h3>
            
            <div class="form-group">
              <label class="form-label">{{ t('settings.security.minLength') }}</label>
              <input 
                type="number" 
                class="form-control"
                v-model="securitySettings.passwordPolicy.minLength"
                min="8"
                max="32"
              />
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="securitySettings.passwordPolicy.requireNumbers"
                  id="requireNumbers"
                />
                <label class="form-check-label" for="requireNumbers">
                  {{ t('settings.security.requireNumbers') }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="securitySettings.passwordPolicy.requireSymbols"
                  id="requireSymbols"
                />
                <label class="form-check-label" for="requireSymbols">
                  {{ t('settings.security.requireSymbols') }}
                </label>
              </div>
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="securitySettings.passwordPolicy.requireUppercase"
                  id="requireUppercase"
                />
                <label class="form-check-label" for="requireUppercase">
                  {{ t('settings.security.requireUppercase') }}
                </label>
              </div>
            </div>

            <h3>{{ t('settings.security.apiKeys') }}</h3>

            <div class="api-keys">
              <div 
                v-for="key in securitySettings.apiKeys" 
                :key="key.id"
                class="api-key"
              >
                <div class="key-info">
                  <span class="key-name">{{ key.name }}</span>
                  <span class="key-created">{{ new Date(key.createdAt).toLocaleDateString() }}</span>
                </div>
                <button 
                  class="btn btn-danger btn-sm"
                  @click="handleDeleteApiKey(key.id)"
                >
                  <i class="fas fa-trash" />
                </button>
              </div>

              <button 
                type="button"
                class="btn btn-outline"
                @click="handleGenerateApiKey"
              >
                <i class="fas fa-plus" />
                {{ t('settings.security.generateKey') }}
              </button>
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

        <div v-else-if="activeTab === 'billing'" class="settings-section">
          <h2>{{ t('settings.billing.title') }}</h2>
          
          <form @submit.prevent="saveBillingSettings">
            <div class="form-group">
              <label class="form-label">{{ t('settings.billing.vatRate') }}</label>
              <div class="input-group">
                <input 
                  type="number" 
                  class="form-control"
                  v-model="billingSettings.vatRate"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span class="input-group-text">%</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.billing.paymentTerms') }}</label>
              <div class="input-group">
                <input 
                  type="number" 
                  class="form-control"
                  v-model="billingSettings.defaultPaymentTerms"
                  min="0"
                />
                <span class="input-group-text">jours</span>
              </div>
            </div>

            <h3>{{ t('settings.billing.stripe') }}</h3>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="billingSettings.paymentMethods.stripe.enabled"
                  id="stripeEnabled"
                />
                <label class="form-check-label" for="stripeEnabled">
                  {{ t('settings.billing.enableStripe') }}
                </label>
              </div>
            </div>

            <div v-if="billingSettings.paymentMethods.stripe.enabled">
              <div class="form-group">
                <div class="form-check">
                  <input 
                    type="checkbox"
                    class="form-check-input"
                    v-model="billingSettings.paymentMethods.stripe.testMode"
                    id="stripeTestMode"
                  />
                  <label class="form-check-label" for="stripeTestMode">
                    {{ t('settings.billing.testMode') }}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('settings.billing.stripePublishable') }}</label>
                <input 
                  type="text" 
                  class="form-control"
                  v-model="billingSettings.paymentMethods.stripe.publishableKey"
                />
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('settings.billing.stripeSecret') }}</label>
                <input 
                  type="password" 
                  class="form-control"
                  v-model="billingSettings.paymentMethods.stripe.secretKey"
                />
              </div>
            </div>

            <h3>{{ t('settings.billing.paypal') }}</h3>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="billingSettings.paymentMethods.paypal.enabled"
                  id="paypalEnabled"
                />
                <label class="form-check-label" for="paypalEnabled">
                  {{ t('settings.billing.enablePaypal') }}
                </label>
              </div>
            </div>

            <div v-if="billingSettings.paymentMethods.paypal.enabled">
              <div class="form-group">
                <div class="form-check">
                  <input 
                    type="checkbox"
                    class="form-check-input"
                    v-model="billingSettings.paymentMethods.paypal.testMode"
                    id="paypalTestMode"
                  />
                  <label class="form-check-label" for="paypalTestMode">
                    {{ t('settings.billing.testMode') }}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('settings.billing.paypalClientId') }}</label>
                <input 
                  type="text" 
                  class="form-control"
                  v-model="billingSettings.paymentMethods.paypal.clientId"
                />
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('settings.billing.paypalSecret') }}</label>
                <input 
                  type="password" 
                  class="form-control"
                  v-model="billingSettings.paymentMethods.paypal.clientSecret"
                />
              </div>
            </div>

            <h3>{{ t('settings.billing.invoices') }}</h3>

            <div class="form-group">
              <label class="form-label">{{ t('settings.billing.invoicePrefix') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="billingSettings.invoicePrefix"
              />
            </div>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="billingSettings.autoReminders"
                  id="autoReminders"
                />
                <label class="form-check-label" for="autoReminders">
                  {{ t('settings.billing.autoReminders') }}
                </label>
              </div>
            </div>

            <div v-if="billingSettings.autoReminders" class="form-group">
              <label class="form-label">{{ t('settings.billing.reminderDays') }}</label>
              <div class="reminder-days">
                <div 
                  v-for="(days, index) in billingSettings.reminderDays"
                  :key="index"
                  class="reminder-day"
                >
                  <input 
                    type="number" 
                    class="form-control"
                    v-model="billingSettings.reminderDays[index]"
                    min="1"
                  />
                  <button 
                    type="button"
                    class="btn btn-danger btn-sm"
                    @click="billingSettings.reminderDays.splice(index, 1)"
                  >
                    <i class="fas fa-trash" />
                  </button>
                </div>
                <button 
                  type="button"
                  class="btn btn-outline btn-sm"
                  @click="billingSettings.reminderDays.push(1)"
                >
                  <i class="fas fa-plus" />
                </button>
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

        <div v-else-if="activeTab === 'integrations'" class="settings-section">
          <h2>{{ t('settings.integrations.title') }}</h2>
          
          <form @submit.prevent="saveIntegrationSettings">
            <h3>{{ t('settings.integrations.ably') }}</h3>

            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="integrationSettings.ably.enabled"
                  id="ablyEnabled"
                />
                <label class="form-check-label" for="ablyEnabled">
                  {{ t('settings.integrations.enableAbly') }}
                </label>
              </div>
            </div>

            <div v-if="integrationSettings.ably.enabled" class="form-group">
              <label class="form-label">{{ t('settings.integrations.ablyKey') }}</label>
              <input 
                type="password" 
                class="form-control"
                v-model="integrationSettings.ably.apiKey"
              />
            </div>

            <h3>{{ t('settings.integrations.smtp') }}</h3>

            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.smtpHost') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="integrationSettings.smtp.host"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.smtpPort') }}</label>
              <input 
                type="number" 
                class="form-control"
                v-model="integrationSettings.smtp.port"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.smtpUsername') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="integrationSettings.smtp.username"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.smtpPassword') }}</label>
              <input 
                type="password" 
                class="form-control"
                v-model="integrationSettings.smtp.password"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.smtpEncryption') }}</label>
              <select 
                class="form-control"
                v-model="integrationSettings.smtp.encryption"
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">{{ t('settings.integrations.none') }}</option>
              </select>
            </div>

            <button 
              type="button"
              class="btn btn-outline"
              @click="handleTestSmtp"
              :disabled="saving"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin" />
              {{ t('settings.integrations.testSmtp') }}
            </button>

            <h3>{{ t('settings.integrations.webhooks') }}</h3>

            <div class="webhooks">
              <div 
                v-for="(webhook, index) in integrationSettings.webhooks"
                :key="index"
                class="webhook"
              >
                <div class="webhook-header">
                  <input 
                    type="text" 
                    class="form-control"
                    v-model="webhook.name"
                    :placeholder="t('settings.integrations.webhookName')"
                  />
                  <button 
                    type="button"
                    class="btn btn-danger btn-sm"
                    @click="integrationSettings.webhooks.splice(index, 1)"
                  >
                    <i class="fas fa-trash" />
                  </button>
                </div>

                <div class="webhook-url">
                  <input 
                    type="url" 
                    class="form-control"
                    v-model="webhook.url"
                    :placeholder="t('settings.integrations.webhookUrl')"
                  />
                </div>

                <div class="webhook-events">
                  <div 
                    v-for="event in ['ticket.created', 'ticket.updated', 'invoice.paid', 'client.created']"
                    :key="event"
                    class="webhook-event"
                  >
                    <div class="form-check">
                      <input 
                        type="checkbox"
                        class="form-check-input"
                        v-model="webhook.events"
                        :value="event"
                        :id="`webhook-${index}-${event}`"
                      />
                      <label class="form-check-label" :for="`webhook-${index}-${event}`">
                        {{ event }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                class="btn btn-outline"
                @click="integrationSettings.webhooks.push({ name: '', url: '', events: [] })"
              >
                <i class="fas fa-plus" />
                {{ t('settings.integrations.addWebhook') }}
              </button>
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

        <div v-else-if="activeTab === 'license'" class="settings-section">
          <h2>{{ t('settings.license.title') }}</h2>
          
          <iframe 
            src="settings/license" 
            style="width: 100%; height: 500px; border: none; overflow: hidden;"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import '@/assets/css/pages/settings.css';
</style>
