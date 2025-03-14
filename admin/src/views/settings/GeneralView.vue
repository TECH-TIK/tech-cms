<template>
  <div class="view-container">
    <div class="header-box">
      <div>
        <h1>{{ t('settings.general.title') }}</h1>
        <div class="page-description">
          {{ t('settings.general.description') }}
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
      
      <form v-else @submit.prevent="saveGeneralSettings" class="table-box">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationStore } from '@/stores/notifications'
import '@/assets/css/components/common-layout.css'
import '@/assets/css/pages/settings.css'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(true)
const saving = ref(false)
const generalSettings = reactive({
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

// Méthodes
const fetchSettings = async () => {
  try {
    loading.value = true
    const general = await settingsStore.fetchGeneralSettings()
    Object.assign(generalSettings, general)
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
    notificationStore.notificationError(t('settings.loadError'))
  } finally {
    loading.value = false
  }
}

const saveGeneralSettings = async () => {
  try {
    saving.value = true
    await settingsStore.updateGeneralSettings(generalSettings)
    notificationStore.success(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres généraux:', error)
    notificationStore.notificationError(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

// Cycle de vie
onMounted(async () => {
  await fetchSettings()
})
</script>
