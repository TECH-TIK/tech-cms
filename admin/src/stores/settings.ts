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
    notifications: {
      enableEmailNotifications: false,
      smtpHost: '',
      smtpPort: 587,
      smtpSecurity: 'tls',
      smtpUsername: '',
      smtpPassword: '',
      emailFrom: '',
      emailFromName: '',
      notificationTypes: []
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
  const notificationSettings = computed(() => settings.value.notifications)
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

  const fetchNotificationSettings = async () => {
    try {
      loading.value = true
      const response = await axios.get('/api/v1/settings/notifications')
      settings.value.notifications = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateNotificationSettings = async (newSettings) => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/settings/notifications', newSettings)
      settings.value.notifications = response.data
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

  const testEmailNotification = async () => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/settings/notifications/test-email')
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

  // Méthodes pour les webhooks
  const saveWebhook = async (webhookData) => {
    try {
      loading.value = true
      
      let response
      if (webhookData.id) {
        // Mise à jour d'un webhook existant
        response = await axios.put(`/api/v1/settings/webhooks/${webhookData.id}`, webhookData)
      } else {
        // Création d'un nouveau webhook
        response = await axios.post('/api/v1/settings/webhooks', webhookData)
      }
      
      if (response.data.success) {
        showSuccessMessage('Webhook sauvegardé avec succès')
        return response.data.webhook
      }
      
      return null
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du webhook:', error)
      showErrorMessage('Erreur lors de la sauvegarde du webhook')
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const deleteWebhook = async (webhookId) => {
    try {
      loading.value = true
      
      const response = await axios.delete(`/api/v1/settings/webhooks/${webhookId}`)
      
      if (response.data.success) {
        showSuccessMessage('Webhook supprimé avec succès')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erreur lors de la suppression du webhook:', error)
      showErrorMessage('Erreur lors de la suppression du webhook')
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const toggleWebhookStatus = async (webhookId, active) => {
    try {
      loading.value = true
      
      const response = await axios.patch(`/api/v1/settings/webhooks/${webhookId}/status`, {
        active
      })
      
      if (response.data.success) {
        showSuccessMessage(`Webhook ${active ? 'activé' : 'désactivé'} avec succès`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erreur lors du changement de statut du webhook:', error)
      showErrorMessage('Erreur lors du changement de statut du webhook')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Méthodes pour la licence
  const fetchLicenseInfo = async () => {
    try {
      loading.value = true
      
      const response = await axios.get('/api/v1/settings/license')
      
      if (response.data.success) {
        return response.data.license
      }
      
      return {
        valid: false,
        message: response.data.message || 'Erreur lors de la récupération des informations de licence'
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de licence:', error)
      showErrorMessage('Erreur lors de la récupération des informations de licence')
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const activateLicense = async (licenseKey) => {
    try {
      loading.value = true
      
      const response = await axios.post('/api/v1/settings/license/activate', {
        licenseKey
      })
      
      if (response.data.success) {
        showSuccessMessage('Licence activée avec succès')
        return response.data.license
      }
      
      return {
        valid: false,
        message: response.data.message || 'Erreur lors de l\'activation de la licence'
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation de la licence:', error)
      showErrorMessage('Erreur lors de l\'activation de la licence')
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const checkLicenseStatus = async () => {
    try {
      loading.value = true
      
      const response = await axios.get('/api/v1/settings/license/check')
      
      if (response.data.success) {
        showSuccessMessage('Statut de la licence vérifié avec succès')
        return response.data.license
      }
      
      return {
        valid: false,
        message: response.data.message || 'Erreur lors de la vérification du statut de la licence'
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de la licence:', error)
      showErrorMessage('Erreur lors de la vérification du statut de la licence')
      throw error
    } finally {
      loading.value = false
    }
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
    } else if (data.type === 'notifications') {
      settings.value.notifications = { ...settings.value.notifications, ...data.data }
    } else if (data.type === 'integration') {
      settings.value.integrations = { ...settings.value.integrations, ...data.data }
    }
  }

  return {
    // État
    settings,
    loading,
    
    // Getters
    generalSettings,
    securitySettings,
    billingSettings,
    notificationSettings,
    
    // Actions
    fetchGeneralSettings,
    updateGeneralSettings,
    fetchSecuritySettings,
    updateSecuritySettings,
    fetchBillingSettings,
    updateBillingSettings,
    fetchNotificationSettings,
    updateNotificationSettings,
    fetchIntegrationSettings,
    updateIntegrationSettings,
    testSmtpConnection,
    testEmailNotification,
    generateApiKey,
    deleteApiKey,
    saveWebhook,
    deleteWebhook,
    toggleWebhookStatus,
    fetchLicenseInfo,
    activateLicense,
    checkLicenseStatus,
    
    // Temps réel
    handleSettingsUpdate
  }
})
