<template>
  <div class="updates-view">
    <!-- En-tête de la page -->
    <div class="page-header">
      <div class="page-title">
        <h1>{{ $t('updates.title') }}</h1>
        <p class="page-description">{{ $t('updates.description') }}</p>
      </div>
      <div class="page-actions">
        <button 
          class="btn btn-secondary"
          :disabled="isChecking"
          @click="checkForUpdates"
        >
          <i class="icon-refresh" :class="{ 'spinning': isChecking }"></i>
          {{ $t('updates.check_now') }}
        </button>
        <button 
          class="btn btn-primary"
          @click="showSettings = true"
        >
          <i class="icon-settings"></i>
          {{ $t('updates.settings') }}
        </button>
      </div>
    </div>

    <!-- Carte de statut système -->
    <UpdateStatusCard
      :data="statusData"
      :loading="isLoading"
      @check-updates="checkForUpdates"
      @download-update="handleDownloadUpdate"
    />

    <!-- Versions disponibles -->
    <div v-if="availableVersions.length > 0" class="available-updates-section">
      <div class="section-header">
        <h2>{{ $t('updates.available_versions') }}</h2>
        <span class="badge badge-info">{{ availableVersions.length }}</span>
      </div>
      
      <div class="available-updates-grid">
        <div 
          v-for="version in availableVersions" 
          :key="version.version"
          class="version-card"
        >
          <div class="version-header">
            <h3>{{ $t('updates.version') }} {{ version.version }}</h3>
            <span class="version-status" :class="`status-${version.status}`">
              {{ $t(`updates.status.${version.status}`) }}
            </span>
          </div>
          
          <div class="version-info">
            <p class="release-date">
              <i class="icon-calendar"></i>
              {{ formatDate(version.release_date) }}
            </p>
            <p v-if="version.file_size" class="file-size">
              <i class="icon-download"></i>
              {{ formatFileSize(version.file_size) }}
            </p>
          </div>
          
          <div v-if="version.changelog" class="version-changelog">
            <h4>{{ $t('updates.changelog') }}</h4>
            <div class="changelog-content">{{ version.changelog }}</div>
          </div>
          
          <div class="version-actions">
            <button
              v-if="version.download_token"
              class="btn btn-primary btn-sm"
              :disabled="isDownloading || isInstalling"
              @click="handleUpdateToVersion(version)"
            >
              <i class="icon-refresh"></i>
              {{ $t('updates.update_to_version') }}
            </button>
            <button 
              v-if="!version.download_token"
              class="btn btn-secondary btn-sm"
              disabled
            >
              <i class="icon-lock"></i>
              {{ $t('updates.not_available') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Historique des mises à jour -->
    <div class="history-section">
      <div class="section-header">
        <h2>{{ $t('updates.history') }}</h2>
        <div class="section-actions">
          <button 
            class="btn btn-secondary btn-sm"
            :disabled="isLoadingHistory"
            @click="refreshHistory"
          >
            <i class="icon-refresh" :class="{ 'spinning': isLoadingHistory }"></i>
            {{ $t('common.refresh') }}
          </button>
          <button 
            class="btn btn-secondary btn-sm"
            @click="cleanupOldUpdates"
          >
            <i class="icon-trash"></i>
            {{ $t('updates.cleanup') }}
          </button>
        </div>
      </div>
      
      <UpdateHistoryTable
        :data="historyData"
        :loading="isLoadingHistory"
        :pagination="historyPagination"
        @page-change="handlePageChange"
        @sort-change="handleSortChange"
        @retry-update="handleRetryUpdate"
        @rollback-update="handleRollbackUpdate"
      />
    </div>

    <!-- Modal de paramètres -->
    <UpdateSettingsForm
      v-if="showSettings"
      :settings="currentSettings"
      :loading="isSavingSettings"
      @save="handleSaveSettings"
      @close="showSettings = false"
    />

    <!-- Modal de progression -->
    <UpdateProgressModal
      v-if="progressModal.show"
      :data="progressModal"
      @close="progressModal.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notifications'
import { ApiService } from '@/services/api'
import UpdateStatusCard from '@/components/system/UpdateStatusCard.vue'
import UpdateHistoryTable from '@/components/system/UpdateHistoryTable.vue'
import UpdateSettingsForm from '@/components/system/UpdateSettingsForm.vue'
import UpdateProgressModal from '@/components/system/UpdateProgressModal.vue'
import type {
  UpdateCheckResponse,
  AvailableVersion,
  UpdateSettings,
  UpdateFormData,
  SystemUpdate,
  UpdateModalState,
  UpdateTablePagination,
  UpdateCardData
} from '@/types/update'

const { t } = useI18n()
const notificationStore = useNotificationStore()

// État réactif
const isLoading = ref(false)
const isChecking = ref(false)
const isDownloading = ref(false)
const isInstalling = ref(false)
const isLoadingHistory = ref(false)
const isSavingSettings = ref(false)
const showSettings = ref(false)

const availableVersions = ref<AvailableVersion[]>([])
const currentSettings = ref<UpdateSettings | null>(null)
const historyData = ref<SystemUpdate[]>([])
const lastCheckResult = ref<UpdateCheckResponse | null>(null)

const historyPagination = reactive<UpdateTablePagination>({
  current_page: 1,
  per_page: 10,
  total: 0,
  total_pages: 0
})

const progressModal = reactive<UpdateModalState>({
  show: false,
  type: 'progress',
  title: ''
})

// Données calculées
const statusData = computed<UpdateCardData>(() => ({
  current_version: lastCheckResult.value?.current_version || '1.0.0',
  updates_available: availableVersions.value.length,
  last_check: lastCheckResult.value?.last_check,
  last_update: historyData.value.find(h => h.status === 'completed')?.completed_at,
  auto_check_enabled: currentSettings.value?.auto_check || false,
  auto_download_enabled: currentSettings.value?.auto_download || false,
  auto_install_enabled: currentSettings.value?.auto_install || false
}))

// Méthodes
const checkForUpdates = async () => {
  isChecking.value = true
  try {
    const response = await ApiService.routes.admin.system.updates.check()
    lastCheckResult.value = response.data
    
    if (response.data.updates_available) {
      availableVersions.value = response.data.versions
      notificationStore.addNotification({
        type: 'info',
        title: t('updates.check_success'),
        message: t('updates.updates_found', { count: response.data.versions.length })
      })
    } else {
      availableVersions.value = []
      notificationStore.addNotification({
        type: 'success',
        title: t('updates.check_success'),
        message: t('updates.no_updates')
      })
    }
  } catch (error: any) {
    console.error('Erreur lors de la vérification des mises à jour:', error)
    notificationStore.addNotification({
      type: 'error',
      title: t('updates.check_error'),
      message: error.response?.data?.message || t('common.error_occurred')
    })
  } finally {
    isChecking.value = false
  }
}

const handleUpdateToVersion = async (version: AvailableVersion) => {
  if (!version.download_token) return

  // Vérifier si la version est déjà téléchargée
  const existingUpdate = historyData.value.find(update =>
    update.version_to === version.version &&
    update.status === 'completed' &&
    update.file_path
  )

  if (existingUpdate) {
    // Si déjà téléchargée, installer directement
    await handleInstallUpdate(version)
    return
  }

  // Sinon, télécharger puis installer
  await handleDownloadUpdate(version)
}

const handleDownloadUpdate = async (version: AvailableVersion) => {
  if (!version.download_token) return

  isDownloading.value = true
  progressModal.show = true
  progressModal.type = 'download'
  progressModal.title = t('updates.downloading_version', { version: version.version })
  progressModal.version = version.version

  try {
    const response = await ApiService.routes.admin.system.updates.download({
      token: version.download_token,
      version: version.version
    })

    if (response.data.success) {
      notificationStore.addNotification({
        type: 'success',
        title: t('updates.download_success'),
        message: t('updates.download_completed', { version: version.version })
      })

      // Rafraîchir l'historique
      await loadHistory()

      // Lancer automatiquement l'installation après le téléchargement
      progressModal.type = 'install'
      progressModal.title = t('updates.installing_version', { version: version.version })

      // Attendre un peu pour que l'utilisateur voie le changement de statut
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Lancer l'installation
      await handleInstallUpdate(version)
    } else {
      throw new Error(response.data.error || 'Erreur de téléchargement')
    }
  } catch (error: any) {
    console.error('Erreur lors du téléchargement:', error)
    notificationStore.addNotification({
      type: 'error',
      title: t('updates.download_error'),
      message: error.response?.data?.message || error.message || t('common.error_occurred')
    })
  } finally {
    isDownloading.value = false
    progressModal.show = false
  }
}

const handleInstallUpdate = async (version: AvailableVersion) => {
  // Trouver la mise à jour téléchargée correspondante
  const downloadedUpdate = historyData.value.find(update =>
    update.version_to === version.version &&
    (update.status === 'completed' || update.status === 'pending')
  )

  if (!downloadedUpdate) {
    notificationStore.addNotification({
      type: 'error',
      title: t('updates.install_error'),
      message: t('updates.no_downloaded_version')
    })
    return
  }

  // Vérifier les prérequis d'installation
  try {
    const requirementsResponse = await ApiService.routes.admin.system.updates.checkRequirements()

    if (!requirementsResponse.data.all_passed) {
      notificationStore.addNotification({
        type: 'error',
        title: t('updates.requirements_not_met'),
        message: t('updates.check_requirements_first')
      })
      return
    }
  } catch (error: any) {
    console.error('Erreur lors de la vérification des prérequis:', error)
    notificationStore.addNotification({
      type: 'error',
      title: t('updates.requirements_check_error'),
      message: error.response?.data?.message || t('common.error_occurred')
    })
    return
  }

  isInstalling.value = true
  progressModal.show = true
  progressModal.type = 'install'
  progressModal.title = t('updates.installing_version', { version: version.version })
  progressModal.version = version.version
  progressModal.update_id = downloadedUpdate.id

  try {
    const response = await ApiService.routes.admin.system.updates.install({
      update_id: downloadedUpdate.id
    })

    if (response.data.success) {
      notificationStore.addNotification({
        type: 'success',
        title: t('updates.install_success'),
        message: t('updates.install_completed', { version: version.version })
      })

      // Rafraîchir l'historique et les versions disponibles
      await Promise.all([
        loadHistory(),
        checkForUpdates()
      ])
    } else {
      throw new Error(response.data.error || 'Erreur d\'installation')
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'installation:', error)
    notificationStore.addNotification({
      type: 'error',
      title: t('updates.install_error'),
      message: error.response?.data?.message || error.message || t('common.error_occurred')
    })
  } finally {
    isInstalling.value = false
    progressModal.show = false
  }
}

const handleRetryUpdate = async (update: SystemUpdate) => {
  if (update.status === 'failed' && update.version_to) {
    // Rechercher la version correspondante dans les versions disponibles
    const version = availableVersions.value.find(v => v.version === update.version_to)
    if (version) {
      if (update.file_path) {
        // Si le fichier est déjà téléchargé, installer directement
        await handleInstallUpdate(version)
      } else {
        // Sinon, télécharger d'abord
        await handleDownloadUpdate(version)
      }
    }
  }
}

const handleRollbackUpdate = async (update: SystemUpdate) => {
  if (!update.backup_id) {
    notificationStore.addNotification({
      type: 'error',
      title: t('updates.rollback_error'),
      message: t('updates.no_backup_available')
    })
    return
  }

  // Demander confirmation
  if (!confirm(t('updates.confirm_rollback', { version: update.version_to }))) {
    return
  }

  try {
    const response = await ApiService.routes.admin.system.updates.rollback({
      update_id: update.id,
      backup_id: update.backup_id
    })

    if (response.data.success) {
      notificationStore.addNotification({
        type: 'success',
        title: t('updates.rollback_success'),
        message: t('updates.rollback_completed', { version: update.version_to })
      })

      // Rafraîchir l'historique
      await loadHistory()
    } else {
      throw new Error(response.data.error || 'Erreur de rollback')
    }
  } catch (error: any) {
    console.error('Erreur lors du rollback:', error)
    notificationStore.addNotification({
      type: 'error',
      title: t('updates.rollback_error'),
      message: error.response?.data?.message || error.message || t('common.error_occurred')
    })
  }
}



const loadSettings = async () => {
  try {
    const response = await ApiService.routes.admin.system.updates.getSettings()
    currentSettings.value = response.data.data
  } catch (error: any) {
    console.error('Erreur lors du chargement des paramètres:', error)
  }
}

const handleSaveSettings = async (settings: UpdateFormData) => {
  isSavingSettings.value = true
  try {
    const response = await ApiService.routes.admin.system.updates.updateSettings(settings)
    
    if (response.data.success) {
      currentSettings.value = response.data.data
      showSettings.value = false
      
      notificationStore.addNotification({
        type: 'success',
        title: t('updates.settings_saved'),
        message: t('updates.settings_updated')
      })
    } else {
      throw new Error(response.data.message || 'Erreur de sauvegarde')
    }
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error)
    notificationStore.addNotification({
      type: 'error',
      title: t('updates.settings_error'),
      message: error.response?.data?.message || error.message || t('common.error_occurred')
    })
  } finally {
    isSavingSettings.value = false
  }
}

const loadHistory = async () => {
  isLoadingHistory.value = true
  try {
    const response = await ApiService.routes.admin.system.updates.history({
      page: historyPagination.current_page,
      limit: historyPagination.per_page
    })
    
    historyData.value = response.data.data
    historyPagination.total = response.data.total
    historyPagination.total_pages = Math.ceil(response.data.total / historyPagination.per_page)
  } catch (error: any) {
    console.error('Erreur lors du chargement de l\'historique:', error)
  } finally {
    isLoadingHistory.value = false
  }
}

const refreshHistory = () => {
  loadHistory()
}

const handlePageChange = (page: number) => {
  historyPagination.current_page = page
  loadHistory()
}

const handleSortChange = (sort: { field: string; direction: 'asc' | 'desc' }) => {
  // Implémentation du tri si nécessaire
  console.log('Sort change:', sort)
}

const cleanupOldUpdates = async () => {
  try {
    const response = await ApiService.routes.admin.system.updates.cleanup()
    
    notificationStore.addNotification({
      type: 'success',
      title: t('updates.cleanup_success'),
      message: t('updates.cleanup_completed', { 
        files: response.data.deleted_files,
        records: response.data.deleted_records
      })
    })
    
    // Rafraîchir l'historique
    await loadHistory()
  } catch (error: any) {
    console.error('Erreur lors du nettoyage:', error)
    notificationStore.addNotification({
      type: 'error',
      title: t('updates.cleanup_error'),
      message: error.response?.data?.message || t('common.error_occurred')
    })
  }
}

// Utilitaires
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Initialisation
onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      loadSettings(),
      loadHistory(),
      checkForUpdates()
    ])
  } finally {
    isLoading.value = false
  }
})
</script>
