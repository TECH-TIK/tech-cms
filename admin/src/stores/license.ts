import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/utils/axios'
import { useNotificationStore } from './notifications'

export interface LicenseInfo {
  key: string | null
  status: string
  is_valid: boolean
}

export const useLicenseStore = defineStore('license', () => {
  const licenseInfo = ref<LicenseInfo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const notificationStore = useNotificationStore()

  /**
   * Récupère les informations de licence
   */
  const fetchLicenseInfo = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get('/api/v1/license')
      licenseInfo.value = response.data.data
      return response.data.data
    } catch (err: any) {
      console.error('Erreur lors de la récupération des infos de licence:', err)
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
      const response = await axios.put('/api/v1/license', { license_key: licenseKey })
      licenseInfo.value = response.data.data
      
      notificationStore.showNotification({
        title: 'Licence mise à jour',
        message: response.data.message || 'La licence a été mise à jour avec succès',
        type: response.data.success ? 'success' : 'error'
      })
      
      return response.data
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de la licence:', err)
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de la licence'
      
      notificationStore.showNotification({
        title: 'Erreur',
        message: error.value,
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
