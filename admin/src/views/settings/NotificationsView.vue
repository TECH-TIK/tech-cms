<template>
  <div class="view-container">
    <div class="header-box">
      <div>
        <h1>{{ t('settings.notifications.title') }}</h1>
        <div class="page-description">
          {{ t('settings.notifications.description') }}
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
      
      <form v-else @submit.prevent="saveNotificationSettings" class="table-box">
        <div class="settings-group">
          <h3>{{ t('settings.notifications.email') }}</h3>
          
          <div class="form-group">
            <div class="form-check">
              <input 
                type="checkbox"
                class="form-check-input"
                v-model="notificationSettings.enableEmailNotifications"
                id="enableEmailNotifications"
              />
              <label class="form-check-label" for="enableEmailNotifications">
                {{ t('settings.notifications.enableEmailNotifications') }}
              </label>
            </div>
          </div>

          <div v-if="notificationSettings.enableEmailNotifications">
            <div class="form-group">
              <label class="form-label">{{ t('settings.notifications.smtpHost') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="notificationSettings.smtpHost"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('settings.notifications.smtpPort') }}</label>
                <input 
                  type="number" 
                  class="form-control"
                  v-model="notificationSettings.smtpPort"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('settings.notifications.smtpSecurity') }}</label>
                <select 
                  class="form-control"
                  v-model="notificationSettings.smtpSecurity"
                >
                  <option value="none">{{ t('settings.notifications.none') }}</option>
                  <option value="ssl">SSL</option>
                  <option value="tls">TLS</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.notifications.smtpUsername') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="notificationSettings.smtpUsername"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.notifications.smtpPassword') }}</label>
              <input 
                type="password" 
                class="form-control"
                v-model="notificationSettings.smtpPassword"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.notifications.emailFrom') }}</label>
              <input 
                type="email" 
                class="form-control"
                v-model="notificationSettings.emailFrom"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('settings.notifications.emailFromName') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="notificationSettings.emailFromName"
                required
              />
            </div>

            <div class="form-actions-inline">
              <button 
                type="button"
                class="btn btn-secondary"
                @click="testEmailConnection"
                :disabled="testingEmail"
              >
                <i v-if="testingEmail" class="fas fa-spinner fa-spin" />
                {{ t('settings.notifications.testConnection') }}
              </button>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h3>{{ t('settings.notifications.notificationTypes') }}</h3>
          
          <div class="notification-types">
            <div 
              v-for="type in notificationTypes" 
              :key="type.id"
              class="notification-type"
            >
              <div class="notification-type-header">
                <div class="form-check">
                  <input 
                    type="checkbox"
                    class="form-check-input"
                    v-model="type.enabled"
                    :id="`notification-${type.id}`"
                  />
                  <label class="form-check-label" :for="`notification-${type.id}`">
                    {{ type.name }}
                  </label>
                </div>
              </div>
              
              <div v-if="type.enabled" class="notification-type-channels">
                <div class="form-check">
                  <input 
                    type="checkbox"
                    class="form-check-input"
                    v-model="type.email"
                    :id="`notification-${type.id}-email`"
                    :disabled="!notificationSettings.enableEmailNotifications"
                  />
                  <label class="form-check-label" :for="`notification-${type.id}-email`">
                    {{ t('settings.notifications.email') }}
                  </label>
                </div>
                
                <div class="form-check">
                  <input 
                    type="checkbox"
                    class="form-check-input"
                    v-model="type.inApp"
                    :id="`notification-${type.id}-inApp`"
                  />
                  <label class="form-check-label" :for="`notification-${type.id}-inApp`">
                    {{ t('settings.notifications.inApp') }}
                  </label>
                </div>
              </div>
            </div>
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
import '@/assets/css/components/common-layout.css'
import '@/assets/css/pages/settings.css'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(true)
const saving = ref(false)
const testingEmail = ref(false)

const notificationSettings = ref({
  enableEmailNotifications: false,
  smtpHost: '',
  smtpPort: 587,
  smtpSecurity: 'tls',
  smtpUsername: '',
  smtpPassword: '',
  emailFrom: '',
  emailFromName: ''
})

const notificationTypes = reactive([
  { 
    id: 'new_client', 
    name: t('settings.notifications.types.newClient'), 
    enabled: true, 
    email: true, 
    inApp: true 
  },
  { 
    id: 'new_invoice', 
    name: t('settings.notifications.types.newInvoice'), 
    enabled: true, 
    email: true, 
    inApp: true 
  },
  { 
    id: 'payment_received', 
    name: t('settings.notifications.types.paymentReceived'), 
    enabled: true, 
    email: true, 
    inApp: true 
  },
  { 
    id: 'invoice_reminder', 
    name: t('settings.notifications.types.invoiceReminder'), 
    enabled: true, 
    email: true, 
    inApp: false 
  },
  { 
    id: 'new_ticket', 
    name: t('settings.notifications.types.newTicket'), 
    enabled: true, 
    email: true, 
    inApp: true 
  },
  { 
    id: 'ticket_reply', 
    name: t('settings.notifications.types.ticketReply'), 
    enabled: true, 
    email: true, 
    inApp: true 
  },
  { 
    id: 'service_expiry', 
    name: t('settings.notifications.types.serviceExpiry'), 
    enabled: true, 
    email: true, 
    inApp: true 
  },
  { 
    id: 'system_alert', 
    name: t('settings.notifications.types.systemAlert'), 
    enabled: true, 
    email: true, 
    inApp: true 
  }
])

// Méthodes
const fetchSettings = async () => {
  try {
    loading.value = true
    const notifications = await settingsStore.fetchNotificationSettings()
    
    if (notifications.settings) {
      notificationSettings.value = notifications.settings
    }
    
    if (notifications.types) {
      notifications.types.forEach((type: any) => {
        const existingType = notificationTypes.find(t => t.id === type.id)
        if (existingType) {
          existingType.enabled = type.enabled
          existingType.email = type.email
          existingType.inApp = type.inApp
        }
      })
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres de notifications:', error)
    notificationStore.notificationError(t('settings.loadError'))
  } finally {
    loading.value = false
  }
}

const saveNotificationSettings = async () => {
  try {
    saving.value = true
    
    const settings = {
      settings: notificationSettings.value,
      types: notificationTypes
    }
    
    await settingsStore.updateNotificationSettings(settings)
    notificationStore.success(t('settings.saveSuccess'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres de notifications:', error)
    notificationStore.notificationError(t('settings.saveError'))
  } finally {
    saving.value = false
  }
}

const testEmailConnection = async () => {
  try {
    testingEmail.value = true
    await settingsStore.testEmailNotification()
    notificationStore.success(t('settings.notifications.testSuccess'))
  } catch (error) {
    console.error('Erreur lors du test de connexion email:', error)
    notificationStore.notificationError(t('settings.notifications.testError'))
  } finally {
    testingEmail.value = false
  }
}

// Cycle de vie
onMounted(async () => {
  await fetchSettings()
})
</script>

<style scoped>
.settings-section {
  margin-top: 20px;
}

.settings-group {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.settings-group:last-child {
  border-bottom: none;
}

.settings-group h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #374151;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  max-width: 400px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  max-width: 400px;
}

.form-check {
  display: flex;
  align-items: center;
}

.form-check-input {
  margin-right: 0.5rem;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.form-actions-inline {
  margin-top: 1rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
}

.loading-state-icon {
  margin-right: 10px;
  color: #3b82f6;
}

.notification-types {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.notification-type {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.notification-type-header {
  margin-bottom: 1rem;
}

.notification-type-channels {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 1.5rem;
}
</style>
