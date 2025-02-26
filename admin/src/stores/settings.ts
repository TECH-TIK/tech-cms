import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/utils/axios'
import { useLicenseStore } from './license'

export const useSettingsStore = defineStore('settings', () => {
  // État
  const settings = ref({
    general: {
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
    },
    security: {
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
    },
    billing: {
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
    },
    integrations: {
      smtp: {
        host: '',
        port: 587,
        username: '',
        password: '',
        encryption: 'tls'
      },
      webhooks: []
    }
  })
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const allSettings = computed(() => settings.value)
  const generalSettings = computed(() => settings.value.general)
  const securitySettings = computed(() => settings.value.security)
  const billingSettings = computed(() => settings.value.billing)
  const integrationSettings = computed(() => settings.value.integrations)

  // Actions
  const fetchGeneralSettings = async () => {
    try {
      loading.value = true
      const response = await axios.get('/api/v1/settings/general')
      settings.value.general = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateGeneralSettings = async (newSettings) => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/settings/general', newSettings)
      settings.value.general = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchSecuritySettings = async () => {
    try {
      loading.value = true
      const response = await axios.get('/api/v1/settings/security')
      settings.value.security = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSecuritySettings = async (newSettings) => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/settings/security', newSettings)
      settings.value.security = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchBillingSettings = async () => {
    try {
      loading.value = true
      const response = await axios.get('/api/v1/settings/billing')
      settings.value.billing = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateBillingSettings = async (newSettings) => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/settings/billing', newSettings)
      settings.value.billing = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchIntegrationSettings = async () => {
    try {
      loading.value = true
      const response = await axios.get('/api/v1/settings/integration')
      settings.value.integrations = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateIntegrationSettings = async (newSettings) => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/settings/integration', newSettings)
      settings.value.integrations = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const testSmtpConnection = async () => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/settings/integrations/smtp/test')
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateApiKey = async () => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/settings/security/api-keys')
      settings.value.security.apiKeys.push(response.data)
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteApiKey = async (keyId) => {
    try {
      loading.value = true
      await axios.delete(`/api/v1/settings/security/api-keys/${keyId}`)
      settings.value.security.apiKeys = settings.value.security.apiKeys.filter(
        key => key.id !== keyId
      )
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const showSuccessMessage = async (message) => {
    // Implémenter la logique de notification de succès
  }

  const showErrorMessage = async (message) => {
    // Implémenter la logique de notification d'erreur
  }

  // Méthodes pour les paramètres d'intégration
  const fetchLicenseSettings = async () => {
    const licenseStore = useLicenseStore()
    await licenseStore.fetchLicenseInfo()
    return licenseStore.licenseInfo || { key: null, status: 'inactive', is_valid: false }
  }

  const updateLicenseSettings = async (newSettings) => {
    const licenseStore = useLicenseStore()
    if (newSettings.licenseKey) {
      await licenseStore.updateLicense(newSettings.licenseKey)
    }
    return licenseStore.licenseInfo
  }

  // Temps réel
  const handleSettingsUpdate = (data) => {
    if (data.type === 'general') {
      settings.value.general = { ...settings.value.general, ...data.data }
    } else if (data.type === 'security') {
      settings.value.security = { ...settings.value.security, ...data.data }
    } else if (data.type === 'billing') {
      settings.value.billing = { ...settings.value.billing, ...data.data }
    } else if (data.type === 'integration') {
      settings.value.integrations = { ...settings.value.integrations, ...data.data }
    }
  }

  return {
    // État
    settings,
    loading,
    error,
    
    // Getters
    allSettings,
    generalSettings,
    securitySettings,
    billingSettings,
    integrationSettings,
    
    // Actions
    fetchGeneralSettings,
    updateGeneralSettings,
    fetchSecuritySettings,
    updateSecuritySettings,
    fetchBillingSettings,
    updateBillingSettings,
    fetchIntegrationSettings,
    updateIntegrationSettings,
    testSmtpConnection,
    generateApiKey,
    deleteApiKey,
    fetchLicenseSettings,
    updateLicenseSettings,
    showSuccessMessage,
    showErrorMessage
  }
})
