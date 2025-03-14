<template>
  <div class="view-container">
    <div class="header-box">
      <div>
        <h1>{{ t('settings.integrations.title') }}</h1>
        <div class="page-description">
          {{ t('settings.integrations.description') }}
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
      
      <div v-else>
        <!-- API Keys Section -->
        <div class="settings-group table-box">
          <h3>{{ t('settings.integrations.apiKeys') }}</h3>
          <p class="settings-group-description">
            {{ t('settings.integrations.apiKeysDescription') }}
          </p>
          
          <div class="api-keys-section">
            <div class="api-keys-header">
              <button 
                class="btn btn-primary" 
                @click="generateNewApiKey"
                :disabled="generatingKey"
              >
                <i v-if="generatingKey" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-plus"></i>
                {{ t('settings.integrations.generateKey') }}
              </button>
            </div>
            
            <div v-if="newApiKey" class="new-api-key">
              <div class="alert alert-success">
                <div class="alert-header">
                  <i class="fas fa-check-circle"></i>
                  {{ t('settings.integrations.newKeyGenerated') }}
                </div>
                <div class="alert-content">
                  <p>{{ t('settings.integrations.copyKeyWarning') }}</p>
                  <div class="api-key-display">
                    <code>{{ newApiKey.token }}</code>
                    <button 
                      class="btn btn-icon" 
                      @click="copyApiKey(newApiKey.token)"
                      title="Copier"
                    >
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="api-keys-table">
              <table v-if="apiKeys.length > 0">
                <thead>
                  <tr>
                    <th>{{ t('settings.integrations.keyName') }}</th>
                    <th>{{ t('settings.integrations.createdAt') }}</th>
                    <th>{{ t('settings.integrations.lastUsed') }}</th>
                    <th>{{ t('settings.integrations.expiresAt') }}</th>
                    <th>{{ t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="key in apiKeys" :key="key.id">
                    <td>{{ key.name }}</td>
                    <td>{{ formatDate(key.createdAt) }}</td>
                    <td>{{ key.lastUsed ? formatDate(key.lastUsed) : t('common.never') }}</td>
                    <td>{{ key.expiresAt ? formatDate(key.expiresAt) : t('common.never') }}</td>
                    <td>
                      <button 
                        class="btn btn-icon btn-danger" 
                        @click="deleteApiKey(key.id)"
                        title="Supprimer"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="no-keys">
                {{ t('settings.integrations.noKeysFound') }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Webhooks Section -->
        <div class="settings-group table-box">
          <h3>{{ t('settings.integrations.webhooks') }}</h3>
          <p class="settings-group-description">
            {{ t('settings.integrations.webhooksDescription') }}
          </p>
          
          <div class="webhooks-section">
            <div class="webhooks-header">
              <button 
                class="btn btn-primary" 
                @click="showWebhookModal = true"
              >
                <i class="fas fa-plus"></i>
                {{ t('settings.integrations.addWebhook') }}
              </button>
            </div>
            
            <div class="webhooks-table">
              <table v-if="webhooks.length > 0">
                <thead>
                  <tr>
                    <th>{{ t('settings.integrations.webhookName') }}</th>
                    <th>{{ t('settings.integrations.webhookUrl') }}</th>
                    <th>{{ t('settings.integrations.webhookEvents') }}</th>
                    <th>{{ t('settings.integrations.webhookStatus') }}</th>
                    <th>{{ t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="webhook in webhooks" :key="webhook.id">
                    <td>{{ webhook.name }}</td>
                    <td class="webhook-url">{{ webhook.url }}</td>
                    <td>
                      <div class="webhook-events">
                        <span 
                          v-for="event in webhook.events" 
                          :key="event"
                          class="webhook-event-badge"
                        >
                          {{ event }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span 
                        class="status-badge"
                        :class="webhook.active ? 'status-active' : 'status-inactive'"
                      >
                        {{ webhook.active ? t('common.active') : t('common.inactive') }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button 
                          class="btn btn-icon" 
                          @click="editWebhook(webhook)"
                          title="Modifier"
                        >
                          <i class="fas fa-edit"></i>
                        </button>
                        <button 
                          class="btn btn-icon" 
                          @click="toggleWebhookStatus(webhook.id)"
                          title="Activer/Désactiver"
                        >
                          <i :class="webhook.active ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
                        </button>
                        <button 
                          class="btn btn-icon btn-danger" 
                          @click="deleteWebhook(webhook.id)"
                          title="Supprimer"
                        >
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="no-webhooks">
                {{ t('settings.integrations.noWebhooksFound') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal pour ajouter/éditer un webhook -->
    <div v-if="showWebhookModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ editingWebhook.id ? t('settings.integrations.editWebhook') : t('settings.integrations.addWebhook') }}</h3>
          <button class="btn-close" @click="closeWebhookModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveWebhook">
            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.webhookName') }}</label>
              <input 
                type="text" 
                class="form-control"
                v-model="editingWebhook.name"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.webhookUrl') }}</label>
              <input 
                type="url" 
                class="form-control"
                v-model="editingWebhook.url"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.webhookEvents') }}</label>
              <div class="webhook-events-selection">
                <div 
                  v-for="event in availableEvents" 
                  :key="event.id"
                  class="webhook-event-checkbox"
                >
                  <input 
                    type="checkbox"
                    :id="`event-${event.id}`"
                    :value="event.id"
                    v-model="editingWebhook.events"
                  />
                  <label :for="`event-${event.id}`">{{ event.name }}</label>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="editingWebhook.active"
                  id="webhook-active"
                />
                <label class="form-check-label" for="webhook-active">
                  {{ t('settings.integrations.webhookActive') }}
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <div class="form-check">
                <input 
                  type="checkbox"
                  class="form-check-input"
                  v-model="editingWebhook.sendTest"
                  id="webhook-test"
                />
                <label class="form-check-label" for="webhook-test">
                  {{ t('settings.integrations.sendTestEvent') }}
                </label>
              </div>
            </div>
            
            <div class="modal-actions">
              <button 
                type="button"
                class="btn btn-secondary"
                @click="closeWebhookModal"
              >
                {{ t('common.cancel') }}
              </button>
              <button 
                type="submit"
                class="btn btn-primary"
                :disabled="savingWebhook"
              >
                <i v-if="savingWebhook" class="fas fa-spinner fa-spin" />
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
import { ref, onMounted, reactive } from 'vue'
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
const apiKeys = ref([])
const webhooks = ref([])
const newApiKey = ref(null)
const generatingKey = ref(false)
const showWebhookModal = ref(false)
const savingWebhook = ref(false)

// Webhook en cours d'édition
const editingWebhook = reactive({
  id: null,
  name: '',
  url: '',
  events: [],
  active: true,
  sendTest: false
})

// Événements disponibles pour les webhooks
const availableEvents = [
  { id: 'client.created', name: t('settings.integrations.events.clientCreated') },
  { id: 'client.updated', name: t('settings.integrations.events.clientUpdated') },
  { id: 'invoice.created', name: t('settings.integrations.events.invoiceCreated') },
  { id: 'invoice.paid', name: t('settings.integrations.events.invoicePaid') },
  { id: 'payment.received', name: t('settings.integrations.events.paymentReceived') },
  { id: 'ticket.created', name: t('settings.integrations.events.ticketCreated') },
  { id: 'ticket.replied', name: t('settings.integrations.events.ticketReplied') },
  { id: 'ticket.closed', name: t('settings.integrations.events.ticketClosed') },
  { id: 'service.created', name: t('settings.integrations.events.serviceCreated') },
  { id: 'service.updated', name: t('settings.integrations.events.serviceUpdated') },
  { id: 'service.expired', name: t('settings.integrations.events.serviceExpired') }
]

// Méthodes
const fetchIntegrationSettings = async () => {
  try {
    loading.value = true
    const response = await settingsStore.fetchIntegrationSettings()
    
    if (response.apiKeys) {
      apiKeys.value = response.apiKeys
    }
    
    if (response.webhooks) {
      webhooks.value = response.webhooks
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres d\'intégration:', error)
    notificationStore.notificationError(t('settings.loadError'))
  } finally {
    loading.value = false
  }
}

const generateNewApiKey = async () => {
  try {
    generatingKey.value = true
    const response = await settingsStore.generateApiKey()
    newApiKey.value = response
    
    // Ajouter la nouvelle clé à la liste
    if (response && response.id) {
      apiKeys.value.push(response)
    }
    
    notificationStore.success(t('settings.integrations.keyGeneratedSuccess'))
  } catch (error) {
    console.error('Erreur lors de la génération de la clé API:', error)
    notificationStore.notificationError(t('settings.integrations.keyGenerationError'))
  } finally {
    generatingKey.value = false
  }
}

const deleteApiKey = async (keyId) => {
  if (!confirm(t('settings.integrations.confirmDeleteKey'))) {
    return
  }
  
  try {
    await settingsStore.deleteApiKey(keyId)
    
    // Supprimer la clé de la liste
    apiKeys.value = apiKeys.value.filter(key => key.id !== keyId)
    
    notificationStore.success(t('settings.integrations.keyDeletedSuccess'))
  } catch (error) {
    console.error('Erreur lors de la suppression de la clé API:', error)
    notificationStore.notificationError(t('settings.integrations.keyDeletionError'))
  }
}

const copyApiKey = (token) => {
  navigator.clipboard.writeText(token)
    .then(() => {
      notificationStore.success(t('settings.integrations.keyCopiedSuccess'))
    })
    .catch(() => {
      notificationStore.notificationError(t('settings.integrations.keyCopyError'))
    })
}

const editWebhook = (webhook) => {
  editingWebhook.id = webhook.id
  editingWebhook.name = webhook.name
  editingWebhook.url = webhook.url
  editingWebhook.events = [...webhook.events]
  editingWebhook.active = webhook.active
  editingWebhook.sendTest = false
  
  showWebhookModal.value = true
}

const closeWebhookModal = () => {
  showWebhookModal.value = false
  
  // Réinitialiser le webhook en cours d'édition
  setTimeout(() => {
    editingWebhook.id = null
    editingWebhook.name = ''
    editingWebhook.url = ''
    editingWebhook.events = []
    editingWebhook.active = true
    editingWebhook.sendTest = false
  }, 300)
}

const saveWebhook = async () => {
  try {
    savingWebhook.value = true
    
    const webhookData = {
      id: editingWebhook.id,
      name: editingWebhook.name,
      url: editingWebhook.url,
      events: editingWebhook.events,
      active: editingWebhook.active,
      sendTest: editingWebhook.sendTest
    }
    
    const response = await settingsStore.saveWebhook(webhookData)
    
    // Mettre à jour la liste des webhooks
    if (editingWebhook.id) {
      // Mise à jour d'un webhook existant
      const index = webhooks.value.findIndex(w => w.id === editingWebhook.id)
      if (index !== -1) {
        webhooks.value[index] = response
      }
    } else {
      // Ajout d'un nouveau webhook
      webhooks.value.push(response)
    }
    
    notificationStore.success(t('settings.integrations.webhookSavedSuccess'))
    closeWebhookModal()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du webhook:', error)
    notificationStore.notificationError(t('settings.integrations.webhookSaveError'))
  } finally {
    savingWebhook.value = false
  }
}

const deleteWebhook = async (webhookId) => {
  if (!confirm(t('settings.integrations.confirmDeleteWebhook'))) {
    return
  }
  
  try {
    await settingsStore.deleteWebhook(webhookId)
    
    // Supprimer le webhook de la liste
    webhooks.value = webhooks.value.filter(webhook => webhook.id !== webhookId)
    
    notificationStore.success(t('settings.integrations.webhookDeletedSuccess'))
  } catch (error) {
    console.error('Erreur lors de la suppression du webhook:', error)
    notificationStore.notificationError(t('settings.integrations.webhookDeletionError'))
  }
}

const toggleWebhookStatus = async (webhookId) => {
  try {
    const webhook = webhooks.value.find(w => w.id === webhookId)
    if (!webhook) return
    
    const newStatus = !webhook.active
    
    await settingsStore.toggleWebhookStatus(webhookId, newStatus)
    
    // Mettre à jour le statut dans la liste
    webhook.active = newStatus
    
    notificationStore.success(
      newStatus 
        ? t('settings.integrations.webhookActivatedSuccess') 
        : t('settings.integrations.webhookDeactivatedSuccess')
    )
  } catch (error) {
    console.error('Erreur lors du changement de statut du webhook:', error)
    notificationStore.notificationError(t('settings.integrations.webhookStatusError'))
  }
}

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    return format(date, 'dd MMM yyyy HH:mm', { locale: fr })
  } catch (error) {
    return dateString
  }
}

// Cycle de vie
onMounted(async () => {
  await fetchIntegrationSettings()
})
</script>

<style scoped>
/* Supprimer les styles existants */
</style>
