<template>
  <div class="view-container">
    <div class="header-box">
      <div>
        <h1>{{ t('settings.license.title') }}</h1>
        <div class="page-description">
          {{ t('settings.license.description') }}
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
      
      <div v-else class="license-container">
        <!-- Informations sur la licence -->
        <div class="settings-group">
          <h3>{{ t('settings.license.information') }}</h3>
          
          <div v-if="licenseInfo.valid" class="license-info">
            <div class="license-status valid">
              <i class="fas fa-check-circle"></i>
              {{ t('settings.license.valid') }}
            </div>
            
            <div class="license-details">
              <div class="license-detail">
                <div class="detail-label">{{ t('settings.license.licenseKey') }}</div>
                <div class="detail-value">{{ maskLicenseKey(licenseInfo.key) }}</div>
              </div>
              
              <div class="license-detail">
                <div class="detail-label">{{ t('settings.license.registeredTo') }}</div>
                <div class="detail-value">{{ licenseInfo.registeredTo }}</div>
              </div>
              
              <div class="license-detail">
                <div class="detail-label">{{ t('settings.license.email') }}</div>
                <div class="detail-value">{{ licenseInfo.email }}</div>
              </div>
              
              <div class="license-detail">
                <div class="detail-label">{{ t('settings.license.plan') }}</div>
                <div class="detail-value">
                  <span class="plan-badge">{{ licenseInfo.plan }}</span>
                </div>
              </div>
              
              <div class="license-detail">
                <div class="detail-label">{{ t('settings.license.expiresAt') }}</div>
                <div class="detail-value">
                  {{ licenseInfo.expiresAt ? formatDate(licenseInfo.expiresAt) : t('common.never') }}
                </div>
              </div>
              
              <div class="license-detail">
                <div class="detail-label">{{ t('settings.license.supportUntil') }}</div>
                <div class="detail-value">
                  {{ licenseInfo.supportUntil ? formatDate(licenseInfo.supportUntil) : t('common.never') }}
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="license-info">
            <div class="license-status invalid">
              <i class="fas fa-exclamation-circle"></i>
              {{ t('settings.license.invalid') }}
            </div>
            
            <div class="license-message">
              {{ licenseInfo.message || t('settings.license.noLicense') }}
            </div>
          </div>
          
          <div class="license-actions">
            <button 
              class="btn btn-primary" 
              @click="showLicenseModal = true"
            >
              {{ licenseInfo.valid ? t('settings.license.update') : t('settings.license.activate') }}
            </button>
            
            <button 
              v-if="licenseInfo.valid"
              class="btn btn-secondary" 
              @click="checkLicenseStatus"
              :disabled="checkingStatus"
            >
              <i v-if="checkingStatus" class="fas fa-spinner fa-spin" />
              <i v-else class="fas fa-sync-alt"></i>
              {{ t('settings.license.check') }}
            </button>
          </div>
        </div>
        
        <!-- Fonctionnalités de la licence -->
        <div v-if="licenseInfo.valid" class="settings-group">
          <h3>{{ t('settings.license.features') }}</h3>
          
          <div class="license-features">
            <div 
              v-for="(feature, index) in licenseFeatures" 
              :key="index"
              class="license-feature"
            >
              <div class="feature-icon">
                <i 
                  :class="feature.enabled ? 'fas fa-check enabled' : 'fas fa-times disabled'"
                ></i>
              </div>
              <div class="feature-details">
                <div class="feature-name">{{ feature.name }}</div>
                <div class="feature-description">{{ feature.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal pour activer/mettre à jour la licence -->
    <div v-if="showLicenseModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ licenseInfo.valid ? t('settings.license.updateLicense') : t('settings.license.activateLicense') }}</h3>
          <button class="btn-close" @click="closeLicenseModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveLicense">
            <div class="form-group">
              <label class="form-label">{{ t('settings.license.licenseKey') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="licenseKey"
                required
                placeholder="XXXX-XXXX-XXXX-XXXX"
              />
              <div class="form-text">
                {{ t('settings.license.licenseKeyHelp') }}
              </div>
            </div>
            
            <div class="modal-actions">
              <button 
                type="button"
                class="btn btn-secondary"
                @click="closeLicenseModal"
              >
                {{ t('common.cancel') }}
              </button>
              <button 
                type="submit"
                class="btn btn-primary"
                :disabled="savingLicense"
              >
                <i v-if="savingLicense" class="fas fa-spinner fa-spin" />
                {{ t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationStore } from '@/stores/notifications'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import '@/assets/css/components/common-layout.css'
import '@/assets/css/pages/settings.css'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(true)
const licenseInfo = ref({
  valid: false,
  key: '',
  registeredTo: '',
  email: '',
  plan: '',
  expiresAt: null,
  supportUntil: null,
  message: ''
})
const licenseKey = ref('')
const showLicenseModal = ref(false)
const savingLicense = ref(false)
const checkingStatus = ref(false)

// Fonctionnalités de la licence
const licenseFeatures = computed(() => [
  {
    name: t('settings.license.features.multipleUsers'),
    description: t('settings.license.features.multipleUsersDesc'),
    enabled: true
  },
  {
    name: t('settings.license.features.api'),
    description: t('settings.license.features.apiDesc'),
    enabled: true
  },
  {
    name: t('settings.license.features.whiteLabel'),
    description: t('settings.license.features.whiteLabelDesc'),
    enabled: licenseInfo.value.plan === 'Professional' || licenseInfo.value.plan === 'Enterprise'
  },
  {
    name: t('settings.license.features.multipleServers'),
    description: t('settings.license.features.multipleServersDesc'),
    enabled: licenseInfo.value.plan === 'Professional' || licenseInfo.value.plan === 'Enterprise'
  },
  {
    name: t('settings.license.features.advancedReporting'),
    description: t('settings.license.features.advancedReportingDesc'),
    enabled: licenseInfo.value.plan === 'Enterprise'
  },
  {
    name: t('settings.license.features.prioritySupport'),
    description: t('settings.license.features.prioritySupportDesc'),
    enabled: licenseInfo.value.plan === 'Enterprise'
  }
])

// Méthodes
const fetchLicenseInfo = async () => {
  try {
    loading.value = true
    const response = await settingsStore.fetchLicenseInfo()
    
    if (response) {
      licenseInfo.value = response
    }
  } catch (error) {
    console.error('Erreur lors du chargement des informations de licence:', error)
    notificationStore.notificationError(t('settings.loadError'))
  } finally {
    loading.value = false
  }
}

const saveLicense = async () => {
  try {
    savingLicense.value = true
    
    const response = await settingsStore.activateLicense(licenseKey.value)
    
    if (response) {
      licenseInfo.value = response
      notificationStore.success(t('settings.license.activationSuccess'))
      closeLicenseModal()
    }
  } catch (error) {
    console.error('Erreur lors de l\'activation de la licence:', error)
    notificationStore.notificationError(t('settings.license.activationError'))
  } finally {
    savingLicense.value = false
  }
}

const checkLicenseStatus = async () => {
  try {
    checkingStatus.value = true
    
    const response = await settingsStore.checkLicenseStatus()
    
    if (response) {
      licenseInfo.value = response
      notificationStore.success(t('settings.license.checkSuccess'))
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la licence:', error)
    notificationStore.notificationError(t('settings.license.checkError'))
  } finally {
    checkingStatus.value = false
  }
}

const closeLicenseModal = () => {
  showLicenseModal.value = false
  
  // Réinitialiser la clé de licence
  setTimeout(() => {
    licenseKey.value = ''
  }, 300)
}

const maskLicenseKey = (key) => {
  if (!key) return ''
  
  const parts = key.split('-')
  if (parts.length < 2) return key
  
  return parts[0] + '-XXXX-XXXX-' + parts[parts.length - 1]
}

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    return format(date, 'dd MMM yyyy', { locale: fr })
  } catch (error) {
    return dateString
  }
}

// Cycle de vie
onMounted(async () => {
  await fetchLicenseInfo()
})
</script>

<style scoped>
/* Supprimer les styles existants */
</style>
