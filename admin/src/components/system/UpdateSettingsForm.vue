<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-container update-settings-modal">
      <div class="modal-header">
        <h3>{{ $t('updates.settings_title') }}</h3>
        <button class="modal-close" @click="handleClose">
          <i class="icon-x"></i>
        </button>
      </div>

      <form class="modal-content" @submit.prevent="handleSubmit">
        <!-- Vérification automatique -->
        <div class="settings-section">
          <h4>{{ $t('updates.automatic_checking') }}</h4>
          <div class="setting-item">
            <div class="setting-control">
              <label class="toggle-switch">
                <input 
                  v-model="formData.auto_check" 
                  type="checkbox"
                  @change="onAutoCheckChange"
                >
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-info">
              <div class="setting-label">{{ $t('updates.enable_auto_check') }}</div>
              <div class="setting-description">{{ $t('updates.auto_check_description') }}</div>
            </div>
          </div>

          <div v-if="formData.auto_check" class="setting-item">
            <div class="setting-control">
              <select v-model="formData.check_interval" class="form-select">
                <option :value="3600">{{ $t('updates.interval_1h') }}</option>
                <option :value="21600">{{ $t('updates.interval_6h') }}</option>
                <option :value="43200">{{ $t('updates.interval_12h') }}</option>
                <option :value="86400">{{ $t('updates.interval_24h') }}</option>
                <option :value="172800">{{ $t('updates.interval_48h') }}</option>
                <option :value="604800">{{ $t('updates.interval_7d') }}</option>
              </select>
            </div>
            <div class="setting-info">
              <div class="setting-label">{{ $t('updates.check_interval') }}</div>
              <div class="setting-description">{{ $t('updates.check_interval_description') }}</div>
            </div>
          </div>
        </div>

        <!-- Téléchargement automatique -->
        <div class="settings-section">
          <h4>{{ $t('updates.automatic_download') }}</h4>
          <div class="setting-item">
            <div class="setting-control">
              <label class="toggle-switch">
                <input 
                  v-model="formData.auto_download" 
                  type="checkbox"
                  :disabled="!formData.auto_check"
                  @change="onAutoDownloadChange"
                >
                <span class="toggle-slider" :class="{ 'disabled': !formData.auto_check }"></span>
              </label>
            </div>
            <div class="setting-info">
              <div class="setting-label">{{ $t('updates.enable_auto_download') }}</div>
              <div class="setting-description">{{ $t('updates.auto_download_description') }}</div>
              <div v-if="!formData.auto_check" class="setting-warning">
                {{ $t('updates.requires_auto_check') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Installation automatique -->
        <div class="settings-section">
          <h4>{{ $t('updates.automatic_installation') }}</h4>
          <div class="setting-item">
            <div class="setting-control">
              <label class="toggle-switch">
                <input 
                  v-model="formData.auto_install" 
                  type="checkbox"
                  :disabled="!formData.auto_download"
                >
                <span class="toggle-slider" :class="{ 'disabled': !formData.auto_download }"></span>
              </label>
            </div>
            <div class="setting-info">
              <div class="setting-label">{{ $t('updates.enable_auto_install') }}</div>
              <div class="setting-description">{{ $t('updates.auto_install_description') }}</div>
              <div v-if="!formData.auto_download" class="setting-warning">
                {{ $t('updates.requires_auto_download') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sauvegarde -->
        <div class="settings-section">
          <h4>{{ $t('updates.backup_settings') }}</h4>
          <div class="setting-item">
            <div class="setting-control">
              <label class="toggle-switch">
                <input 
                  v-model="formData.backup_before_update" 
                  type="checkbox"
                >
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-info">
              <div class="setting-label">{{ $t('updates.backup_before_update') }}</div>
              <div class="setting-description">{{ $t('updates.backup_description') }}</div>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="settings-section">
          <h4>{{ $t('updates.notification_settings') }}</h4>
          <div class="setting-item">
            <div class="setting-control">
              <input 
                v-model="formData.notification_email" 
                type="email"
                class="form-input"
                :placeholder="$t('updates.notification_email_placeholder')"
              >
            </div>
            <div class="setting-info">
              <div class="setting-label">{{ $t('updates.notification_email') }}</div>
              <div class="setting-description">{{ $t('updates.notification_email_description') }}</div>
            </div>
          </div>
        </div>

        <!-- Erreurs de validation -->
        <div v-if="validationErrors.length > 0" class="validation-errors">
          <h4>{{ $t('common.validation_errors') }}</h4>
          <ul>
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <!-- Aperçu de la configuration -->
        <div class="settings-preview">
          <h4>{{ $t('updates.configuration_preview') }}</h4>
          <div class="preview-grid">
            <div class="preview-item">
              <span class="preview-label">{{ $t('updates.auto_check') }}:</span>
              <span class="preview-value" :class="{ 'enabled': formData.auto_check }">
                {{ formData.auto_check ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </div>
            
            <div v-if="formData.auto_check" class="preview-item">
              <span class="preview-label">{{ $t('updates.check_frequency') }}:</span>
              <span class="preview-value">{{ formatInterval(formData.check_interval) }}</span>
            </div>
            
            <div class="preview-item">
              <span class="preview-label">{{ $t('updates.auto_download') }}:</span>
              <span class="preview-value" :class="{ 'enabled': formData.auto_download }">
                {{ formData.auto_download ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </div>
            
            <div class="preview-item">
              <span class="preview-label">{{ $t('updates.auto_install') }}:</span>
              <span class="preview-value" :class="{ 'enabled': formData.auto_install }">
                {{ formData.auto_install ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </div>
            
            <div class="preview-item">
              <span class="preview-label">{{ $t('updates.backup_enabled') }}:</span>
              <span class="preview-value" :class="{ 'enabled': formData.backup_before_update }">
                {{ formData.backup_before_update ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </div>
          </div>
        </div>
      </form>

      <div class="modal-actions">
        <button 
          type="button"
          class="btn btn-secondary"
          :disabled="loading"
          @click="handleClose"
        >
          {{ $t('common.cancel') }}
        </button>
        
        <button 
          type="button"
          class="btn btn-warning"
          :disabled="loading"
          @click="resetToDefaults"
        >
          {{ $t('updates.reset_defaults') }}
        </button>
        
        <button 
          type="submit"
          class="btn btn-primary"
          :disabled="loading || !hasChanges"
          @click="handleSubmit"
        >
          <i v-if="loading" class="icon-loader spinning"></i>
          <i v-else class="icon-save"></i>
          {{ $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UpdateSettings, UpdateFormData } from '@/types/update'

interface Props {
  settings: UpdateSettings | null
  loading?: boolean
}

interface Emits {
  (e: 'save', settings: UpdateFormData): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// État du formulaire
const formData = reactive<UpdateFormData>({
  auto_check: true,
  auto_download: false,
  auto_install: false,
  check_interval: 86400, // 24h par défaut
  backup_before_update: true,
  notification_email: ''
})

const originalData = ref<UpdateFormData | null>(null)
const validationErrors = ref<string[]>([])

// Données calculées
const hasChanges = computed(() => {
  if (!originalData.value) return false
  
  return Object.keys(formData).some(key => {
    const formKey = key as keyof UpdateFormData
    return formData[formKey] !== originalData.value![formKey]
  })
})

// Méthodes
const loadSettings = () => {
  if (props.settings) {
    formData.auto_check = props.settings.auto_check
    formData.auto_download = props.settings.auto_download
    formData.auto_install = props.settings.auto_install
    formData.check_interval = props.settings.check_interval
    formData.backup_before_update = props.settings.backup_before_update
    formData.notification_email = props.settings.notification_email || ''
    
    // Sauvegarder les données originales
    originalData.value = { ...formData }
  }
}

const validateForm = (): boolean => {
  validationErrors.value = []
  
  // Validation de l'email de notification
  if (formData.notification_email && !isValidEmail(formData.notification_email)) {
    validationErrors.value.push(t('updates.invalid_email'))
  }
  
  // Validation de l'intervalle
  if (formData.check_interval < 3600) {
    validationErrors.value.push(t('updates.interval_too_short'))
  }
  
  // Validation logique : auto_install nécessite auto_download
  if (formData.auto_install && !formData.auto_download) {
    validationErrors.value.push(t('updates.auto_install_requires_download'))
  }
  
  // Validation logique : auto_download nécessite auto_check
  if (formData.auto_download && !formData.auto_check) {
    validationErrors.value.push(t('updates.auto_download_requires_check'))
  }
  
  return validationErrors.value.length === 0
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const formatInterval = (seconds: number): string => {
  if (seconds < 3600) {
    return t('updates.minutes', { count: Math.floor(seconds / 60) })
  } else if (seconds < 86400) {
    return t('updates.hours', { count: Math.floor(seconds / 3600) })
  } else {
    return t('updates.days', { count: Math.floor(seconds / 86400) })
  }
}

const onAutoCheckChange = () => {
  if (!formData.auto_check) {
    formData.auto_download = false
    formData.auto_install = false
  }
}

const onAutoDownloadChange = () => {
  if (!formData.auto_download) {
    formData.auto_install = false
  }
}

const resetToDefaults = () => {
  formData.auto_check = true
  formData.auto_download = false
  formData.auto_install = false
  formData.check_interval = 86400
  formData.backup_before_update = true
  formData.notification_email = ''
  validationErrors.value = []
}

const handleSubmit = () => {
  if (validateForm()) {
    emit('save', { ...formData })
  }
}

const handleClose = () => {
  emit('close')
}

// Watchers
watch(() => props.settings, loadSettings, { immediate: true })

// Initialisation
onMounted(() => {
  loadSettings()
})
</script>
