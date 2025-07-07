import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/services/api'
import logger from '@/services/logger'
import { useNotificationStore } from './notifications'
import {
  AppSettings,
  GeneralSettings,
  SecuritySettings,
  BillingSettings,
  NotificationSettings,
  IntegrationSettings,
  AutomationSettings,
  // Import supprimé car non utilisé
  ApiKey,
  Webhook,
  LicenseInfo
} from '@/types/settings'

// Type pour le résultat de l'activation de licence
interface LicenseActivationResult {
  success: boolean
  message: string
  license?: LicenseInfo
}


export const useSettingsStore = defineStore('settings', () => {
  // État
  const settings = ref<AppSettings>({

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
      settings: {
        enableEmailNotifications: false,
        smtpHost: '',
        smtpPort: 587,
        smtpSecurity: 'tls',
        smtpUsername: '',
        smtpPassword: '',
        emailFrom: '',
        emailFromName: ''
      },
      types: []
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
    },
    automation: {
      misc: {
        db_cleanup_enabled: true,
        db_cleanup_frequency: 'weekly',
        cleanup_sessions: true,
        cleanup_activity_logs: true,
        cleanup_temp_data: true,
        auto_backup_enabled: false,
        backup_frequency: 'weekly',
        backup_files: true,
        backup_database: true,
        compress_backup: true,
        backups_to_keep: 5,
        auto_reports_enabled: false,
        daily_reports: false,
        weekly_reports: true,
        monthly_reports: true,
        email_reports: true
      }
    }
  })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)

  // Getters

  const generalSettings = computed(() => settings.value.general)
  const securitySettings = computed(() => settings.value.security)
  const billingSettings = computed(() => settings.value.billing)
  const notificationSettings = computed(() => settings.value.notifications)


  // Actions
  const fetchGeneralSettings = async (): Promise<GeneralSettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Chargement des paramètres généraux')
      const response = await ApiService.routes.admin.system.settings.getGeneralSettings()
      settings.value.general = response.data
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des paramètres généraux'
      logger.error('[SETTINGS STORE] Erreur lors du chargement des paramètres généraux', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateGeneralSettings = async (newSettings: Partial<GeneralSettings>): Promise<GeneralSettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Mise à jour des paramètres généraux', { settings: newSettings })
      const response = await ApiService.routes.admin.system.settings.updateGeneralSettings(newSettings)
      settings.value.general = { ...settings.value.general, ...response.data }
      notificationStore.showSuccess('Paramètres généraux mis à jour avec succès')
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour des paramètres généraux'
      logger.error('[SETTINGS STORE] Erreur lors de la mise à jour des paramètres généraux', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchSecuritySettings = async (): Promise<SecuritySettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Chargement des paramètres de sécurité')
      const response = await ApiService.routes.admin.system.settings.getSecuritySettings()
      settings.value.security = response.data
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des paramètres de sécurité'
      logger.error('[SETTINGS STORE] Erreur lors du chargement des paramètres de sécurité', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>): Promise<SecuritySettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Mise à jour des paramètres de sécurité', { settings: newSettings })
      const response = await ApiService.routes.admin.system.settings.updateSecuritySettings(newSettings)
      settings.value.security = { ...settings.value.security, ...response.data }
      notificationStore.showSuccess('Paramètres de sécurité mis à jour avec succès')
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour des paramètres de sécurité'
      logger.error('[SETTINGS STORE] Erreur lors de la mise à jour des paramètres de sécurité', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchBillingSettings = async (): Promise<BillingSettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Chargement des paramètres de facturation')
      const response = await ApiService.routes.admin.system.settings.getBillingSettings()
      settings.value.billing = response.data
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des paramètres de facturation'
      logger.error('[SETTINGS STORE] Erreur lors du chargement des paramètres de facturation', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateBillingSettings = async (newSettings: Partial<BillingSettings>): Promise<BillingSettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Mise à jour des paramètres de facturation', { settings: newSettings })
      const response = await ApiService.routes.admin.system.settings.updateBillingSettings(newSettings)
      settings.value.billing = { ...settings.value.billing, ...response.data }
      notificationStore.showSuccess('Paramètres de facturation mis à jour avec succès')
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour des paramètres de facturation'
      logger.error('[SETTINGS STORE] Erreur lors de la mise à jour des paramètres de facturation', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchNotificationSettings = async (): Promise<NotificationSettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Récupération des paramètres de notification')
      
      const response = await ApiService.routes.admin.system.settings.getNotificationSettings()
      
      // Adapter la réponse à la nouvelle structure si nécessaire
      const notificationSettings: NotificationSettings = {
        settings: response.data.settings || response.data,
        types: response.data.types || response.data.notificationTypes || []
      }
      
      logger.debug('[SETTINGS STORE] Paramètres de notification récupérés', { notificationSettings })
      settings.value.notifications = notificationSettings
      return notificationSettings
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des paramètres de notification'
      logger.error('[SETTINGS STORE] Erreur lors de la récupération des paramètres de notification', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Mise à jour des paramètres de notification', { newSettings })
      
      // Préparer les données au format attendu par l'API
      const apiData = {
        ...newSettings.settings,
        types: newSettings.types
      }
      
      const response = await ApiService.routes.admin.system.settings.updateNotificationSettings(apiData)
      
      // Adapter la réponse à la nouvelle structure
      const updatedSettings: NotificationSettings = {
        settings: response.data.settings || response.data,
        types: response.data.types || response.data.notificationTypes || []
      }
      
      settings.value.notifications = updatedSettings
      
      const successMessage = 'Paramètres de notification mis à jour avec succès'
      logger.info('[SETTINGS STORE] Paramètres de notification mis à jour avec succès')
      notificationStore.showSuccess(successMessage)
      
      return updatedSettings
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour des paramètres de notification'
      logger.error('[SETTINGS STORE] Erreur lors de la mise à jour des paramètres de notification', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchIntegrationSettings = async (): Promise<IntegrationSettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Chargement des paramètres d\'intégration')
      const response = await ApiService.routes.admin.system.settings.getIntegrationSettings()
      settings.value.integrations = response.data
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des paramètres d\'intégration'
      logger.error('[SETTINGS STORE] Erreur lors du chargement des paramètres d\'intégration', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateIntegrationSettings = async (newSettings: Partial<IntegrationSettings>): Promise<IntegrationSettings> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Mise à jour des paramètres d\'intégration', { settings: newSettings })
      const response = await ApiService.routes.admin.system.settings.updateIntegrationSettings(newSettings)
      settings.value.integrations = { ...settings.value.integrations, ...response.data }
      notificationStore.showSuccess('Paramètres d\'intégration mis à jour avec succès')
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour des paramètres d\'intégration'
      logger.error('[SETTINGS STORE] Erreur lors de la mise à jour des paramètres d\'intégration', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const testSmtpConnection = async (): Promise<{ success: boolean; message: string }> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Test de la connexion SMTP')
      const response = await ApiService.routes.admin.system.settings.testSmtpConnection()
      const result = response.data
      if (result.success) {
        notificationStore.showSuccess('Test de connexion SMTP réussi')
      } else {
        notificationStore.showError(`Échec du test SMTP: ${result.message}`)
      }
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du test de connexion SMTP'
      logger.error('[SETTINGS STORE] Erreur lors du test de connexion SMTP', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const testEmailNotification = async (): Promise<{ success: boolean; message: string }> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Test d\'envoi d\'email de notification')
      const response = await ApiService.routes.admin.system.settings.testEmailNotification()
      const result = response.data
      if (result.success) {
        notificationStore.showSuccess('Email de test envoyé avec succès')
      } else {
        notificationStore.showError(`Échec de l'envoi: ${result.message}`)
      }
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du test d\'email de notification'
      logger.error('[SETTINGS STORE] Erreur lors du test d\'email de notification', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateApiKey = async (): Promise<ApiKey> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Génération d\'une nouvelle clé API')
      const response = await ApiService.routes.admin.system.settings.generateApiKey()
      settings.value.security.apiKeys.push(response.data)
      notificationStore.showSuccess('Nouvelle clé API générée avec succès')
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la génération d\'une clé API'
      logger.error('[SETTINGS STORE] Erreur lors de la génération d\'une clé API', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteApiKey = async (keyId: string): Promise<boolean> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Suppression d\'une clé API', { keyId })
      await ApiService.routes.admin.system.settings.deleteApiKey(keyId)
      settings.value.security.apiKeys = settings.value.security.apiKeys.filter(key => key.id !== keyId)
      notificationStore.showSuccess('Clé API supprimée avec succès')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression de la clé API'
      logger.error('[SETTINGS STORE] Erreur lors de la suppression de la clé API', { error: err, keyId })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  // Utilisons directement le store de notifications plutôt que ces méthodes intermédiaires
  // qui ne font rien de spécial

  // Méthodes pour les webhooks
  const saveWebhook = async (webhookData: Partial<Webhook>): Promise<Webhook | null> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Sauvegarde d\'un webhook', { webhookId: webhookData.id || 'nouveau' })
      
      let response
      if (webhookData.id) {
        // Mise à jour d'un webhook existant
        const webhookId = String(webhookData.id) // Conversion explicite en string
        response = await ApiService.routes.admin.system.settings.updateWebhook(webhookId, webhookData)
      } else {
        // Création d'un nouveau webhook
        response = await ApiService.routes.admin.system.settings.createWebhook(webhookData)
      }
      
      if (response.data.success) {
        notificationStore.showSuccess('Webhook sauvegardé avec succès')
        return response.data.webhook
      }
      
      return null
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la sauvegarde du webhook'
      logger.error('[SETTINGS STORE] Erreur lors de la sauvegarde du webhook', { error: err, webhookData })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const deleteWebhook = async (webhookId: string): Promise<boolean> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Suppression d\'un webhook', { webhookId })
      
      const response = await ApiService.routes.admin.system.settings.deleteWebhook(webhookId)
      
      if (response.data.success) {
        notificationStore.showSuccess('Webhook supprimé avec succès')
        return true
      }
      
      return false
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression du webhook'
      logger.error('[SETTINGS STORE] Erreur lors de la suppression du webhook', { error: err, webhookId })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const toggleWebhookStatus = async (webhookId: string, active: boolean): Promise<boolean> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Changement de statut d\'un webhook', { webhookId, active })
      
      const response = await ApiService.routes.admin.system.settings.toggleWebhookStatus(webhookId, active)
      
      if (response.data.success) {
        notificationStore.showSuccess(`Webhook ${active ? 'activé' : 'désactivé'} avec succès`)
        return true
      }
      
      return false
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Erreur lors ${active ? 'de l\'activation' : 'de la désactivation'} du webhook`
      logger.error('[SETTINGS STORE] Erreur lors du changement de statut du webhook', { error: err, webhookId, active })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  // Méthodes pour la licence
  const fetchLicenseInfo = async (): Promise<LicenseInfo> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Récupération des informations de licence')
      
      const response = await ApiService.routes.admin.system.license.getLicenseInfo()
      
      if (response.data.success) {
        return response.data.license
      }
      
      return {
        status: 'invalid',
        message: response.data.message || 'Erreur lors de la récupération des informations de licence'
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la récupération des informations de licence'
      logger.error('[SETTINGS STORE] Erreur lors de la récupération des informations de licence', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const activateLicense = async (licenseKey: string): Promise<LicenseActivationResult> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Activation de la licence', { licenseKey })
      
      const response = await ApiService.routes.admin.system.license.activateLicense(licenseKey)
      
      if (response.data.success) {
        const successMessage = response.data.message || 'Licence activée avec succès'
        logger.info('[SETTINGS STORE] Activation de licence réussie', { licenseKey })
        notificationStore.showSuccess(successMessage)
        return response.data
      }
      
      const errorMessage = response.data.message || 'Erreur lors de l\'activation de la licence'
      logger.warn('[SETTINGS STORE] Échec de l\'activation de licence', { message: errorMessage })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'activation de la licence'
      logger.error('[SETTINGS STORE] Erreur lors de l\'activation de la licence', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const checkLicenseStatus = async (): Promise<LicenseInfo> => {
    const notificationStore = useNotificationStore()
    try {
      loading.value = true
      logger.debug('[SETTINGS STORE] Vérification du statut de la licence')
      
      const response = await ApiService.routes.admin.system.license.checkLicense()
      
      if (response.data.success) {
        const successMessage = 'Statut de la licence vérifié avec succès'
        logger.info('[SETTINGS STORE] Vérification du statut de la licence réussie')
        notificationStore.showSuccess(successMessage)
        return response.data.license
      }
      
      const errorMessage = response.data.message || 'Erreur lors de la vérification de la licence'
      logger.warn('[SETTINGS STORE] Problème lors de la vérification de la licence', { message: errorMessage })
      notificationStore.showWarning(errorMessage)
      
      return {
        status: 'invalid',
        message: errorMessage
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la vérification de la licence'
      logger.error('[SETTINGS STORE] Erreur lors de la vérification de la licence', { error: err })
      notificationStore.showError(errorMessage)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }



  // Temps réel
  interface SettingsUpdateData {
    type: 'general' | 'security' | 'billing' | 'notifications' | 'integration';
    data: Partial<GeneralSettings | SecuritySettings | BillingSettings | NotificationSettings | IntegrationSettings>;
  }

  const handleSettingsUpdate = (data: SettingsUpdateData): void => {
    if (data.type === 'general') {
      settings.value.general = { ...settings.value.general, ...(data.data as Partial<GeneralSettings>) }
    } else if (data.type === 'security') {
      settings.value.security = { ...settings.value.security, ...(data.data as Partial<SecuritySettings>) }
    } else if (data.type === 'billing') {
      settings.value.billing = { ...settings.value.billing, ...(data.data as Partial<BillingSettings>) }
    } else if (data.type === 'notifications') {
      settings.value.notifications = { ...settings.value.notifications, ...(data.data as Partial<NotificationSettings>) }
    } else if (data.type === 'integration') {
      settings.value.integrations = { ...settings.value.integrations, ...(data.data as Partial<IntegrationSettings>) }
    }
  }

  // Getter pour les paramètres d'automatisation
  const automationSettings = computed(() => settings.value.automation)

  /**
   * Récupère les paramètres d'automatisation d'un groupe spécifique
   * @param group Groupe de paramètres (ex: 'misc', 'reports', etc.)
   */
  const fetchAutomationSettings = async (group?: string): Promise<AutomationSettings | any> => {
    loading.value = true
    error.value = ''
    success.value = false

    try {
      logger.debug('[SETTINGS STORE] Récupération des paramètres d\'automatisation', { group })
      const response = await ApiService.routes.admin.system.settings.getAutomationSettings(group)
      
      if (group) {
        // Si un groupe spécifique est demandé, on met à jour uniquement ce groupe
        settings.value.automation = { 
          ...settings.value.automation,
          [group]: response.data.settings || response.data 
        }
      } else {
        // Sinon on remplace tous les paramètres d'automatisation
        settings.value.automation = response.data.settings || response.data
      }

      success.value = true
      return settings.value.automation
    } catch (err: any) {
      error.value = err.message || 'Erreur inconnue'
      logger.error('[SETTINGS STORE] Erreur lors de la récupération des paramètres d\'automatisation', { error: err })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Met à jour les paramètres d'automatisation d'un groupe spécifique
   * @param newSettings Nouveaux paramètres
   * @param group Groupe de paramètres (ex: 'misc', 'reports', etc.)
   */
  const updateAutomationSettings = async (newSettings: any, group?: string): Promise<any> => {
    loading.value = true
    error.value = ''
    success.value = false

    try {
      logger.debug('[SETTINGS STORE] Mise à jour des paramètres d\'automatisation', { settings: newSettings, group })
      const response = await ApiService.routes.admin.system.settings.updateAutomationSettings(newSettings, group)
      
      if (group) {
        // Si un groupe spécifique est mis à jour, on met à jour uniquement ce groupe
        settings.value.automation = { 
          ...settings.value.automation,
          [group]: { ...settings.value.automation[group as keyof AutomationSettings], ...response.data }
        }
      } else {
        // Sinon on remplace tous les paramètres d'automatisation
        settings.value.automation = { ...settings.value.automation, ...response.data }
      }

      success.value = true
      return settings.value.automation
    } catch (err: any) {
      error.value = err.message || 'Erreur inconnue'
      logger.error('[SETTINGS STORE] Erreur lors de la mise à jour des paramètres d\'automatisation', { error: err })
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // État
    settings,
    loading,
    error,
    success,
    
    // Getters
    generalSettings,
    securitySettings,
    billingSettings,
    notificationSettings,
    automationSettings,
    
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
    fetchAutomationSettings,
    updateAutomationSettings,
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
