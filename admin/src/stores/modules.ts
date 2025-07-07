import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/services/api'
import logger from '@/services/logger'
import { useNotificationStore } from '@/stores/notifications'

export interface ModuleInfo {
  name: string
  type: string
  display_name: string
  description: string
  version: string
  author: string
  status: 'active' | 'inactive'
  capabilities: string[]
  config_fields: any[]
  resource_limits: any[]
  supported_features: string[]
}

export interface ModuleTemplate {
  id: string
  name: string
  description: string
  resources: Record<string, any>
  price?: number
}

export interface ProductConfigField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea'
  required: boolean
  default?: any
  options?: Array<{ value: any, label: string }>
  min?: number
  max?: number
  description?: string
  unit?: string
}

export const useModulesStore = defineStore('modules', () => {
  // État
  const modules = ref<Record<string, ModuleInfo[]>>({})
  const selectedModule = ref<ModuleInfo | null>(null)
  const moduleTemplates = ref<ModuleTemplate[]>([])
  const productConfigFields = ref<ProductConfigField[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const saving = ref(false)
  const testing = ref(false)
  
  // Store de notifications
  const notificationStore = useNotificationStore()

  // Computed
  const serverModules = computed(() => modules.value.servers || [])
  const paymentModules = computed(() => modules.value.payment || [])
  const allModules = computed(() => {
    const all: ModuleInfo[] = []
    Object.values(modules.value).forEach(moduleList => {
      all.push(...moduleList)
    })
    return all
  })

  // Actions
  const fetchModules = async (type: string = 'all') => {
    loading.value = true
    error.value = null

    try {
      logger.debug('[MODULES STORE] Récupération des modules', { type })
      
      const response = await ApiService.routes.admin.system.module.list(type)

      if (response.data.success) {
        if (type === 'all') {
          // Convertir les objets en tableaux pour chaque type
          const processedData: Record<string, ModuleInfo[]> = {}
          Object.entries(response.data.data).forEach(([moduleType, moduleData]) => {
            if (typeof moduleData === 'object' && moduleData !== null) {
              processedData[moduleType] = Object.entries(moduleData as Record<string, any>).map(([name, info]) => ({
                name,
                type: moduleType,
                display_name: (info as any).display_name || (info as any).name || name,
                description: (info as any).description || '',
                version: (info as any).version || '1.0.0',
                author: (info as any).author || '',
                status: (info as any).active ? 'active' : 'inactive',
                capabilities: Object.keys((info as any).features || {}),
                config_fields: [],
                resource_limits: [],
                supported_features: Object.keys((info as any).features || {})
              }))
            }
          })
          modules.value = processedData
          logger.info('[MODULES STORE] Modules récupérés avec succès', { count: Object.keys(processedData).length })
        } else {
          // Pour un type spécifique, convertir l'objet en tableau
          const moduleData = response.data.data[type] || {}
          modules.value[type] = Object.entries(moduleData).map(([name, info]) => ({
            name,
            type,
            display_name: (info as any).name || name,
            description: (info as any).description || '',
            version: (info as any).version || '1.0.0',
            author: (info as any).author || '',
            status: (info as any).active ? 'active' : 'inactive',
            capabilities: Object.keys((info as any).features || {}),
            config_fields: [],
            resource_limits: [],
            supported_features: Object.keys((info as any).features || {})
          }))
          logger.info(`[MODULES STORE] Modules de type ${type} récupérés avec succès`, { count: modules.value[type]?.length || 0 })
        }
      } else {
        const errorMessage = response.data.message || 'Erreur lors du chargement des modules'
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du chargement des modules'
      error.value = errorMessage
      notificationStore.showError(errorMessage)
      logger.error('[MODULES STORE] Erreur lors de la récupération des modules', { error: err, type })
    } finally {
      loading.value = false
    }
  }

  const getModuleDetails = async (type: string, name: string) => {
    loading.value = true
    error.value = null
    
    try {
      logger.debug('[MODULES STORE] Récupération des détails du module', { type, name })
      
      const response = await ApiService.routes.admin.system.module.getDetails(type, name)

      if (response.data.success) {
        selectedModule.value = response.data.data
        logger.info('[MODULES STORE] Détails du module récupérés avec succès', { type, name })
        return response.data.data
      } else {
        const errorMessage = response.data.message || 'Erreur lors du chargement des détails du module'
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du chargement des détails du module'
      error.value = errorMessage
      notificationStore.showError(errorMessage)
      logger.error('[MODULES STORE] Erreur lors de la récupération des détails du module', { error: err, type, name })
      return null
    } finally {
      loading.value = false
    }
  }

  const getProductConfigFields = async (type: string, name: string) => {
    loading.value = true
    error.value = null

    try {
      logger.debug('[MODULES STORE] Récupération des champs de configuration du produit', { type, name })
      
      const response = await ApiService.routes.admin.system.module.getProductConfigFields(type, name)

      if (response.data.success) {
        productConfigFields.value = response.data.data || []
        logger.info('[MODULES STORE] Champs de configuration récupérés avec succès', { 
          type, 
          name, 
          fieldCount: (response.data.data || []).length 
        })
        return response.data.data
      } else {
        const errorMessage = response.data.message || 'Erreur lors du chargement des champs de configuration'
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du chargement des champs de configuration'
      error.value = errorMessage
      notificationStore.showError(errorMessage)
      logger.error('[MODULES STORE] Erreur lors de la récupération des champs de configuration', { error: err, type, name })
      return []
    } finally {
      loading.value = false
    }
  }

  const getModuleTemplates = async (type: string, name: string) => {
    loading.value = true
    error.value = null

    try {
      logger.debug('[MODULES STORE] Récupération des templates du module', { type, name })
      
      const response = await ApiService.routes.admin.system.module.getTemplates(type, name)

      if (response.data.success) {
        moduleTemplates.value = response.data.data || []
        logger.info('[MODULES STORE] Templates récupérés avec succès', { 
          type, 
          name, 
          templateCount: (response.data.data || []).length 
        })
        return response.data.data
      } else {
        const errorMessage = response.data.message || 'Erreur lors du chargement des templates'
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du chargement des templates'
      error.value = errorMessage
      notificationStore.showError(errorMessage)
      logger.error('[MODULES STORE] Erreur lors de la récupération des templates', { error: err, type, name })
      return []
    } finally {
      loading.value = false
    }
  }

  const validateProductConfig = async (type: string, name: string, config: any) => {
    loading.value = true
    error.value = null

    try {
      logger.debug('[MODULES STORE] Validation de la configuration du produit', { type, name })
      
      const response = await ApiService.routes.admin.system.module.validateProductConfig({
        type,
        name,
        config
      })

      if (response.data.success) {
        logger.info('[MODULES STORE] Configuration validée avec succès', { type, name })
        return response.data.data
      } else {
        const errorMessage = response.data.message || 'Erreur lors de la validation'
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la validation'
      error.value = errorMessage
      notificationStore.showError(errorMessage)
      logger.error('[MODULES STORE] Erreur lors de la validation de la configuration', { error: err, type, name })
      return { valid: false, errors: [errorMessage] }
    } finally {
      loading.value = false
    }
  }

  const testModuleConnection = async (type: string, name: string, config: any) => {
    testing.value = true
    error.value = null

    try {
      logger.debug('[MODULES STORE] Test de connexion du module', { type, name })
      
      const response = await ApiService.routes.admin.system.module.test({
        type,
        name,
        config
      })

      if (response.data.success) {
        logger.info('[MODULES STORE] Test de connexion réussi', { type, name })
        notificationStore.showSuccess('Connexion testée avec succès !')
        return response.data.data
      } else {
        const errorMessage = response.data.message || 'Erreur lors du test de connexion'
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du test de connexion'
      error.value = errorMessage
      notificationStore.showError(errorMessage)
      logger.error('[MODULES STORE] Erreur lors du test de connexion du module', { error: err, type, name })
      return { success: false, message: errorMessage }
    } finally {
      testing.value = false
    }
  }

  const activateModule = async (type: string, name: string) => {
    saving.value = true
    error.value = null

    try {
      logger.debug('[MODULES STORE] Activation du module', { type, name })
      
      const response = await ApiService.routes.admin.system.module.activate({ type, name })

      if (response.data.success) {
        // Recharger les modules pour mettre à jour le statut
        await fetchModules()
        const successMessage = 'Module activé avec succès'
        notificationStore.showSuccess(successMessage)
        logger.info('[MODULES STORE] Module activé avec succès', { type, name })
        return true
      } else {
        const errorMessage = response.data.message || 'Erreur lors de l\'activation du module'
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de l\'activation du module'
      error.value = errorMessage
      notificationStore.showError(errorMessage)
      logger.error('[MODULES STORE] Erreur lors de l\'activation du module', { error: err, type, name })
      return false
    } finally {
      saving.value = false
    }
  }

  const deactivateModule = async (type: string, name: string) => {
    saving.value = true
    error.value = null

    try {
      logger.debug('[MODULES STORE] Désactivation du module', { type, name })
      
      const response = await ApiService.routes.admin.system.module.deactivate({ type, name })

      if (response.data.success) {
        // Recharger les modules pour mettre à jour le statut
        await fetchModules()
        const successMessage = 'Module désactivé avec succès'
        notificationStore.showSuccess(successMessage)
        logger.info('[MODULES STORE] Module désactivé avec succès', { type, name })
        return true
      } else {
        const errorMessage = response.data.message || 'Erreur lors de la désactivation du module'
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la désactivation du module'
      error.value = errorMessage
      notificationStore.showError(errorMessage)
      logger.error('[MODULES STORE] Erreur lors de la désactivation du module', { error: err, type, name })
      return false
    } finally {
      saving.value = false
    }
  }

  const updateModuleConfig = async (type: string, name: string, config: any) => {
    saving.value = true
    error.value = null

    try {
      logger.debug('[MODULES STORE] Mise à jour de la configuration du module', { type, name })
      
      const response = await ApiService.routes.admin.system.module.updateConfig({
        type,
        name,
        config
      })
      
      if (response.data.success) {
        const successMessage = 'Configuration mise à jour avec succès'
        notificationStore.showSuccess(successMessage)
        logger.info('[MODULES STORE] Configuration du module mise à jour avec succès', { type, name })
        return true
      } else {
        const errorMessage = response.data.message || 'Erreur lors de la mise à jour de la configuration'
        notificationStore.showError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la mise à jour de la configuration'
      error.value = errorMessage
      notificationStore.showError(errorMessage)
      logger.error('[MODULES STORE] Erreur lors de la mise à jour de la configuration du module', { error: err, type, name })
      return false
    } finally {
      saving.value = false
    }
  }

  // Utilitaires
  const clearError = () => {
    error.value = null
  }

  const resetSelectedModule = () => {
    selectedModule.value = null
    productConfigFields.value = []
    moduleTemplates.value = []
  }

  return {
    // État
    modules,
    selectedModule,
    moduleTemplates,
    productConfigFields,
    loading,
    error,
    saving,
    testing,
    
    // Computed
    serverModules,
    paymentModules,
    allModules,
    
    // Actions
    fetchModules,
    getModuleDetails,
    getProductConfigFields,
    getModuleTemplates,
    validateProductConfig,
    testModuleConnection,
    activateModule,
    deactivateModule,
    updateModuleConfig,
    clearError,
    resetSelectedModule
  }
})
