import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiService } from '@/services/api'
import { useNotificationStore } from './notifications'
import logger from '@/services/logger'

export interface LicenseInfo {
  key: string | null
  status: string
  is_valid: boolean
}

export const useLicenseStore = defineStore('license', () => {
  const licenseInfo = ref<LicenseInfo | null>(null)
  const loading = ref(false)
  // Permettre des types plus larges pour les messages d'erreur (string, null ou directement une erreur extraite)
  const error = ref<string | unknown | null>(null)
  const notificationStore = useNotificationStore()

  /**
   * Récupère les informations de licence
   */
  const fetchLicenseInfo = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.routes.admin.system.license.getLicenseInfo()
      licenseInfo.value = response.data.data
      return response.data.data
    } catch (err: any) {
      logger.error('Erreur lors de la récupération des infos de licence', { err })
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des informations de licence'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Met à jour la clé de licence
   */
  const updateLicense = async (licenseKey: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.routes.admin.system.license.activateLicense(licenseKey)
      licenseInfo.value = response.data.data
      
      notificationStore.showNotification({
        title: 'Licence mise à jour',
        message: response.data.message || 'La licence a été mise à jour avec succès',
        type: response.data.success ? 'success' : 'error'
      })
      
      return response.data
    } catch (err: any) {
      logger.error('Erreur lors de la mise à jour de la licence', { err })
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de la licence'
      
      notificationStore.showNotification({
        title: 'Erreur',
        message: typeof error.value === 'string' ? error.value : 'Erreur lors de la mise à jour de la licence',
        type: 'error'
      })
      
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    licenseInfo,
    loading,
    error,
    fetchLicenseInfo,
    updateLicense
  }
})
