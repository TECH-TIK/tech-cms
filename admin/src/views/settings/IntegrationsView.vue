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
                :disabled="generatingKey"
                @click="generateNewApiKey"
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
                      title="Copier"
                      @click="copyApiKey(newApiKey.token || '')"
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
                        title="Supprimer"
                        @click="deleteApiKey(key.id)"
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
                @click="showAddWebhookModal"
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
                      <div v-if="webhook.events.length > 0" class="webhook-events">
                        <label>{{ t('settings.integrations.events') }}:</label>
                        <div class="event-badges">
                          <span v-for="eventId in webhook.events" :key="eventId" class="event-badge">
                            {{ availableEvents.find(event => event.id === eventId)?.name || eventId }}
                          </span>
                        </div>
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
                          title="Modifier"
                          @click="editWebhook(webhook)"
                        >
                          <i class="fas fa-edit"></i>
                        </button>
                        <button 
                          class="btn btn-icon" 
                          title="Activer/Désactiver"
                          @click="toggleWebhookStatus(webhook.id, !webhook.active)"
                        >
                          <i :class="webhook.active ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
                        </button>
                        <button 
                          class="btn btn-icon btn-danger" 
                          title="Supprimer"
                          @click="deleteWebhook(webhook.id)"
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
          <h3>{{ editingWebhook.id !== null ? t('settings.integrations.editWebhook') : t('settings.integrations.addWebhook') }}</h3>
          <button class="btn-close" @click="closeWebhookModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveWebhook">
            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.webhookName') }}</label>
              <input 
                v-model="editingWebhook.name" 
                type="text"
                class="form-control"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">{{ t('settings.integrations.webhookUrl') }}</label>
              <input 
                v-model="editingWebhook.url" 
                type="url"
                class="form-control"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="webhook-events">{{ t('settings.integrations.events') }}</label>
              <div class="webhook-events-selection">
                <div
v-for="event in availableEvents" 
                  :key="event.id"
                  class="webhook-event-checkbox"
                >
                  <input 
                    :id="`event-${event.id}`" 
                    v-model="editingWebhook.events" 
                    type="checkbox"
                    :value="event.id"
                  >
                  <label :for="`event-${event.id}`">{{ event.name }}</label>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <div class="form-check">
                <input 
                  id="webhook-active"
                  v-model="editingWebhook.active"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label" for="webhook-active">
                  {{ t('settings.integrations.webhookActive') }}
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <div class="form-check">
                <input 
                  id="webhook-test"
                  v-model="editingWebhook.sendTest"
                  type="checkbox"
                  class="form-check-input"
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
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationStore } from '@/stores/notifications'
import type { ApiKey, Webhook, WebhookEvent } from '@/types/integration'
import logger from '@/services/logger'
import '@/assets/css/components/common-layout.css'
import '@/assets/css/pages/settings.css'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

// État

// État
const loading = ref(true)
const apiKeys = ref<ApiKey[]>([])
const webhooks = ref<Webhook[]>([])
const newApiKey = ref<ApiKey | null>(null)
const generatingKey = ref(false)
const showWebhookModal = ref(false)
const savingWebhook = ref(false)
const deleting = ref<string | number | null>(null)
const deletingWebhook = ref<string | number | null>(null)

// Webhook en cours d'édition
interface EditingWebhook extends Omit<Webhook, 'id'> {
  id: string | number | null;
  sendTest: boolean;
}

const editingWebhook = reactive<EditingWebhook>({ 
  id: null,
  name: '',
  url: '',
  events: [],
  active: true,
  sendTest: false,
  secret: ''
})

// Événements disponibles pour les webhooks
const availableEvents = ref<WebhookEvent[]>([
  { id: 'client.created', name: t('settings.integrations.events.clientCreated'), group: 'clients' },
  { id: 'client.updated', name: t('settings.integrations.events.clientUpdated'), group: 'clients' },
  { id: 'invoice.created', name: t('settings.integrations.events.invoiceCreated'), group: 'billing' },
  { id: 'invoice.paid', name: t('settings.integrations.events.invoicePaid'), group: 'billing' },
  { id: 'payment.received', name: t('settings.integrations.events.paymentReceived'), group: 'billing' },
  { id: 'ticket.created', name: t('settings.integrations.events.ticketCreated'), group: 'support' },
  { id: 'ticket.replied', name: t('settings.integrations.events.ticketReplied'), group: 'support' },
  { id: 'ticket.closed', name: t('settings.integrations.events.ticketClosed'), group: 'support' },
  { id: 'service.created', name: t('settings.integrations.events.serviceCreated'), group: 'services' },
  { id: 'service.updated', name: t('settings.integrations.events.serviceUpdated'), group: 'services' },
  { id: 'service.expired', name: t('settings.integrations.events.serviceExpired'), group: 'services' }
])

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
  } catch (_error) {
    logger.error('Erreur lors du chargement des paramètres d\'intégration', { error: _error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('settings.loadError')
    })
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
    
    notificationStore.showNotification({
      type: 'success',
      title: t('common.success'),
      message: t('settings.integrations.keyGeneratedSuccess')
    })
  } catch (_error) {
    logger.error('Erreur lors de la génération de la clé API', { error: _error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('settings.integrations.keyGenerationError')
    })
  } finally {
    generatingKey.value = false
  }
}

const deleteApiKey = async (id: string | number) => {
  if (!confirm(t('settings.integrations.confirmDeleteKey'))) {
    return
  }
  
  try {
    deleting.value = id
    await settingsStore.deleteApiKey(id.toString())
    
    // Supprimer la clé de la liste
    apiKeys.value = apiKeys.value.filter(key => key.id !== id)
    
    notificationStore.showNotification({
      type: 'success',
      title: t('common.success'),
      message: t('settings.integrations.keyDeletedSuccess')
    })
  } catch (_error) {
    logger.error('Erreur lors de la suppression de la clé API', { id, error: _error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('settings.integrations.keyDeletionError')
    })
  } finally {
    deleting.value = null
  }
}

const copyApiKey = (token: string) => {
  navigator.clipboard.writeText(token)
    .then(() => {
      notificationStore.showNotification({
        type: 'success',
        title: t('common.success'),
        message: t('settings.integrations.keyCopiedSuccess')
      })
    })
    .catch(() => {
      notificationStore.showNotification({
        type: 'error',
        title: t('common.error'),
        message: t('settings.integrations.keyCopyError')
      })
    })
}

const editWebhook = (webhook: Webhook) => {
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

const showAddWebhookModal = () => {
  // Réinitialiser le webhook en édition
  editingWebhook.id = null
  editingWebhook.name = ''
  editingWebhook.url = ''
  editingWebhook.events = []
  editingWebhook.active = true
  editingWebhook.secret = ''
  editingWebhook.sendTest = false
  
  showWebhookModal.value = true
}

const saveWebhook = async () => {
  try {
    savingWebhook.value = true
    
    // Convertir l'ID null en undefined pour le typage Partial<Webhook>
    const webhookData: Partial<Webhook> & { sendTest: boolean } = {
      name: editingWebhook.name,
      url: editingWebhook.url,
      events: editingWebhook.events,
      active: editingWebhook.active,
      secret: editingWebhook.secret,
      sendTest: editingWebhook.sendTest
    }
    
    // Ajouter l'ID seulement s'il n'est pas null
    if (editingWebhook.id !== null) {
      webhookData.id = editingWebhook.id
    }
    
    const result = await settingsStore.saveWebhook(webhookData)
    
    // Mettre à jour la liste des webhooks
    if (editingWebhook.id !== null) {
      // Mise à jour d'un webhook existant
      const index = webhooks.value.findIndex(w => w.id === editingWebhook.id)
      if (index !== -1 && result) {
        webhooks.value[index] = result
      }
    } else {
      // Ajout d'un nouveau webhook
      if (result) {
        webhooks.value.push(result)
      }
    }
    
    notificationStore.showNotification({
      type: 'success',
      title: t('common.success'),
      message: t('settings.integrations.webhookSavedSuccess')
    })
    closeWebhookModal()
  } catch (_error) {
    logger.error('Erreur lors de la sauvegarde du webhook', { webhook: editingWebhook, error: _error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('settings.integrations.webhookSaveError')
    })
  } finally {
    savingWebhook.value = false
  }
}

const deleteWebhook = async (id: string | number) => {
  if (!confirm(t('settings.integrations.confirmDeleteWebhook'))) {
    return
  }
  
  try {
    deletingWebhook.value = id
    await settingsStore.deleteWebhook(id.toString())
    
    // Supprimer le webhook de la liste
    webhooks.value = webhooks.value.filter(webhook => webhook.id !== id)
    
    notificationStore.showNotification({
      type: 'success',
      title: t('common.success'),
      message: t('settings.integrations.webhookDeletedSuccess')
    })
  } catch (_error) {
    logger.error('Erreur lors de la suppression du webhook', { id, error: _error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('settings.integrations.webhookDeletionError')
    })
  } finally {
    deletingWebhook.value = null
  }
}

const toggleWebhookStatus = async (id: string | number, active: boolean) => {
  try {
    await settingsStore.toggleWebhookStatus(id.toString(), active)
    
    // Mettre à jour le statut dans la liste
    const webhook = webhooks.value.find(w => w.id === id)
    if (webhook) {
      webhook.active = active
    }
    
    notificationStore.showNotification({
      type: 'success',
      title: t('common.success'),
      message: active 
        ? t('settings.integrations.webhookEnabled') 
        : t('settings.integrations.webhookDisabled')
    })
  } catch (error) {
    logger.error('Erreur lors de la modification du statut du webhook', { id, active, error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('settings.integrations.webhookToggleError')
    })
  }
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString)
    return format(date, 'dd MMM yyyy HH:mm', { locale: fr })
  } catch {
    return dateString || '-'
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
