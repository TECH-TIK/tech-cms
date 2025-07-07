<template>
  <div class="view-container">
    <div class="header-box">
      <div>
        <h1>{{ t('settings.security.title') }}</h1>
        <div class="page-description">
          {{ t('settings.security.description') }}
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
      
      <form v-else class="table-box" @submit.prevent="saveSecuritySettings">
        <div class="settings-group">
          <h3>{{ t('settings.security.authentication') }}</h3>
          
          <div class="form-group">
            <div class="form-check">
              <input 
                id="enableTwoFactor"
                v-model="securitySettings.enableTwoFactor"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="enableTwoFactor">
                {{ t('settings.security.enableTwoFactor') }}
              </label>
            </div>
            <div class="form-help">
              {{ t('settings.security.twoFactorHelp') }}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('settings.security.sessionTimeout') }}</label>
            <select 
              v-model="securitySettings.sessionTimeout"
              class="form-control"
            >
              <option value="15">15 {{ t('common.minutes') }}</option>
              <option value="30">30 {{ t('common.minutes') }}</option>
              <option value="60">1 {{ t('common.hour') }}</option>
              <option value="120">2 {{ t('common.hours') }}</option>
              <option value="240">4 {{ t('common.hours') }}</option>
              <option value="480">8 {{ t('common.hours') }}</option>
              <option value="720">12 {{ t('common.hours') }}</option>
              <option value="1440">24 {{ t('common.hours') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('settings.security.maxLoginAttempts') }}</label>
            <input 
              v-model="securitySettings.maxLoginAttempts" 
              type="number"
              class="form-control"
              min="1"
              max="10"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('settings.security.lockoutTime') }}</label>
            <select 
              v-model="securitySettings.lockoutTime"
              class="form-control"
            >
              <option value="5">5 {{ t('common.minutes') }}</option>
              <option value="15">15 {{ t('common.minutes') }}</option>
              <option value="30">30 {{ t('common.minutes') }}</option>
              <option value="60">1 {{ t('common.hour') }}</option>
              <option value="120">2 {{ t('common.hours') }}</option>
            </select>
          </div>
        </div>

        <div class="settings-group">
          <h3>{{ t('settings.security.passwords') }}</h3>
          
          <div class="form-group">
            <label class="form-label">{{ t('settings.security.minPasswordLength') }}</label>
            <input 
              v-model="securitySettings.minPasswordLength" 
              type="number"
              class="form-control"
              min="8"
              max="32"
            />
          </div>

          <div class="form-group">
            <div class="form-check">
              <input 
                id="requireUppercase"
                v-model="securitySettings.requireUppercase"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="requireUppercase">
                {{ t('settings.security.requireUppercase') }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <div class="form-check">
              <input 
                id="requireNumber"
                v-model="securitySettings.requireNumber"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="requireNumber">
                {{ t('settings.security.requireNumber') }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <div class="form-check">
              <input 
                id="requireSpecialChar"
                v-model="securitySettings.requireSpecialChar"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="requireSpecialChar">
                {{ t('settings.security.requireSpecialChar') }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('settings.security.passwordExpiryDays') }}</label>
            <select 
              v-model="securitySettings.passwordExpiryDays"
              class="form-control"
            >
              <option value="0">{{ t('settings.security.never') }}</option>
              <option value="30">30 {{ t('common.days') }}</option>
              <option value="60">60 {{ t('common.days') }}</option>
              <option value="90">90 {{ t('common.days') }}</option>
              <option value="180">180 {{ t('common.days') }}</option>
              <option value="365">365 {{ t('common.days') }}</option>
            </select>
          </div>
        </div>

        <div class="settings-group">
          <h3>{{ t('settings.security.api') }}</h3>
          
          <div class="form-group">
            <div class="form-check">
              <input 
                id="enableApiAccess"
                v-model="securitySettings.enableApiAccess"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="enableApiAccess">
                {{ t('settings.security.enableApiAccess') }}
              </label>
            </div>
          </div>

          <div v-if="securitySettings.enableApiAccess" class="form-group">
            <label class="form-label">{{ t('settings.security.apiTokenExpiry') }}</label>
            <select 
              v-model="securitySettings.apiTokenExpiry"
              class="form-control"
            >
              <option value="1">1 {{ t('common.day') }}</option>
              <option value="7">7 {{ t('common.days') }}</option>
              <option value="30">30 {{ t('common.days') }}</option>
              <option value="90">90 {{ t('common.days') }}</option>
              <option value="365">365 {{ t('common.days') }}</option>
              <option value="0">{{ t('settings.security.never') }}</option>
            </select>
          </div>
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
import logger from '@/services/logger'
import '@/assets/css/components/common-layout.css'
import '@/assets/css/pages/settings.css'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(true)
const saving = ref(false)
const securitySettings = reactive({
  enableTwoFactor: false,
  sessionTimeout: 60, // Converti en nombre
  maxLoginAttempts: 5,
  lockoutTime: 15, // Converti en nombre
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecialChar: false,
  passwordExpiryDays: 90, // Converti en nombre
  enableApiAccess: true,
  apiTokenExpiry: 30 // Converti en nombre
})

// Méthodes
const fetchSettings = async () => {
  try {
    loading.value = true
    const security = await settingsStore.fetchSecuritySettings()
    Object.assign(securitySettings, security)
  } catch (error) {
    logger.error('Erreur lors du chargement des paramètres de sécurité', { error })
    notificationStore.notificationError(t('settings.loadError'))
  } finally {
    loading.value = false
  }
}

const saveSecuritySettings = async () => {
  try {
    saving.value = true
    await settingsStore.updateSecuritySettings(securitySettings)
    notificationStore.success(t('settings.saveSuccess'))
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde des paramètres de sécurité', { error })
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

<style scoped>
/* Supprimer les styles existants */
</style>
