<template>
  <div id="clientDetail" class="view-container">
    <!-- En-tête avec titre et boutons d'action -->
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ t('clients.details.title') }}</h1>
        <span class="page-description">{{ t('clients.details.description') }}</span>
      </div>
      <div class="action-buttons">
        <button class="btn btn-outline" @click="goToClients">
          <i class="fas fa-arrow-left"></i>
          {{ t('common.back') }}
        </button>
        <button class="btn btn-outline" @click="editClient">
          <i class="fas fa-edit"></i>
          {{ t('common.edit') }}
        </button>
      </div>
    </div>

    <!-- Indicateur de chargement -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3>{{ t('common.error_occurred') }}</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchClient">
        {{ t('common.retry') }}
      </button>
    </div>

    <!-- Contenu du client -->
    <div v-else-if="client" class="client-detail-container box">
      <!-- Entête avec informations de base -->
      <div class="client-header">
        <div class="client-basic-info">
          <div class="client-avatar-container">
            <img :src="`https://www.gravatar.com/avatar/${md5(client.email.toLowerCase())}?s=80&d=mp`" alt="Avatar" class="client-avatar">
          </div>
          <div class="client-title">
            <h2>{{ client.firstname }} {{ client.lastname }}</h2>
            <span class="client-id">#{{ client.id }}</span>
            <div class="client-status">
              <span :class="`status-badge status-${client.status}`">
                {{ t(`clients.status.${client.status}`) }}
              </span>
            </div>
          </div>
        </div>
        <div class="client-actions">
          <button class="btn btn-outline-danger" @click="deleteClientPrompt">
            <i class="fas fa-trash"></i>
            {{ t('clients.actions.delete') }}
          </button>
        </div>
      </div>

      <!-- Onglets -->
      <div class="tabs-container">
        <div class="tabs-header">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <i :class="tab.icon"></i>
            {{ tab.name }}
          </button>
        </div>

        <!-- Onglet: Informations -->
        <div v-if="activeTab === 'info'" class="tab-content">
          <div class="detail-section">
            <h3 class="section-title">{{ t('clients.details.personal_info') }}</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.firstname') }}</span>
                <span class="detail-value">{{ client.firstname }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.lastname') }}</span>
                <span class="detail-value">{{ client.lastname }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.email') }}</span>
                <span class="detail-value">{{ client.email }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.phone') }}</span>
                <span class="detail-value">{{ client.phone || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.company') }}</span>
                <span class="detail-value">{{ client.company || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.status') }}</span>
                <span class="detail-value">
                  <span :class="`status-badge status-${client.status}`">
                    {{ t(`clients.status.${client.status}`) }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">{{ t('clients.details.address') }}</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.address') }}</span>
                <span class="detail-value">{{ client.address || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.city') }}</span>
                <span class="detail-value">{{ client.city || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.postal_code') }}</span>
                <span class="detail-value">{{ client.postal_code || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('clients.form.country') }}</span>
                <span class="detail-value">{{ client.country || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Onglet: Services -->
        <div v-else-if="activeTab === 'services'" class="tab-content">
          <div class="services-header">
            <h3 class="section-title">{{ t('clients.details.services') }}</h3>
            <button class="btn btn-sm btn-gradient" @click="createServiceForClient">
              <i class="fas fa-plus"></i>
              {{ t('services.add_new') }}
            </button>
          </div>

          <div v-if="clientServices.length === 0" class="empty-state-small">
            <i class="fas fa-server"></i>
            <p>{{ t('clients.details.no_services') }}</p>
          </div>
          <div v-else class="services-list">
            <div v-for="service in clientServices" :key="service.id" class="service-card" @click="viewService(service.id)">
              <div class="service-card-header">
                <h4>{{ service.product_name || t('services.details.unknown_product') }}</h4>
                <span :class="`status-badge status-${service.status}`">
                  {{ t(`services.status.${service.status}`) }}
                </span>
              </div>
              <div class="service-card-body">
                <div v-if="service.domain" class="service-domain">
                  <i class="fas fa-globe"></i>
                  <span>{{ service.domain }}</span>
                </div>
                <div class="service-details">
                  <div class="service-detail-item">
                    <span class="detail-label">{{ t('services.table.next_due_date') }}</span>
                    <span class="detail-value">{{ service.next_due_date ? formatDate(service.next_due_date) : '-' }}</span>
                  </div>
                  <div class="service-detail-item">
                    <span class="detail-label">{{ t('services.table.recurring_amount') }}</span>
                    <span class="detail-value">{{ formatCurrency(service.recurring_amount) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Onglet: Factures -->
        <div v-else-if="activeTab === 'invoices'" class="tab-content">
          <h3 class="section-title">{{ t('clients.details.invoices') }}</h3>
          
          <div class="empty-state-small">
            <i class="fas fa-file-invoice"></i>
            <p>{{ t('clients.details.no_invoices') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal show" style="display: flex; align-items: center; justify-content: center;">
      <div class="modal-backdrop" @click="showDeleteModal = false"></div>
      <div class="modal-content" style="position: fixed; z-index: 1052; max-height: 80vh; backdrop-filter: none;">
        <div class="modal-header">
          <h3>{{ t('clients.delete_modal.title') }}</h3>
          <button class="close-btn" @click="showDeleteModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>{{ t('clients.delete_modal.confirmation') }}</p>
          <p class="warning">{{ t('clients.delete_modal.warning') }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" :disabled="isDeleting" @click="showDeleteModal = false">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-danger" :disabled="isDeleting" @click="confirmDelete">
            <span v-if="isDeleting">
              <span class="spinner-border spinner-border-sm mr-2"></span>
              {{ t('common.deleting') }}...
            </span>
            <span v-else>{{ t('common.delete') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useClientsStore } from '@/stores/clients'
import { useServicesStore } from '@/stores/services'
import { useNotificationStore } from '@/stores/notifications'
import md5 from 'md5'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import logger from '@/services/logger'

// Route et routeur
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// Stores
const clientsStore = useClientsStore()
const servicesStore = useServicesStore()
const notificationStore = useNotificationStore()

// Interface pour le type service
// L'interface Client n'est plus nécessaire car importée depuis types/

interface Service {
  id: number;
  domain?: string;
  status: string;
  product_name?: string;
  next_due_date?: string;
  recurring_amount?: number;
  [key: string]: any;
}

// État
const clientId = computed(() => parseInt(route.params.id as string))

// Client comme propriété calculée pour rester synchronisé avec le store
const client = computed(() => clientsStore.currentClient)
const clientServices = ref<Service[]>([])
const loading = ref(true)
const error = ref('')
const activeTab = ref('info')
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Tabs
const tabs = [
  { id: 'info', name: t('clients.details.tab_info'), icon: 'fas fa-user' },
  { id: 'services', name: t('clients.details.tab_services'), icon: 'fas fa-server' },
  { id: 'invoices', name: t('clients.details.tab_invoices'), icon: 'fas fa-file-invoice' }
]

// Fonctions
const fetchClient = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // S'assurer que la liste des clients est chargée
    if (clientsStore.clients.length === 0) {
      logger.debug('Chargement de la liste des clients...')
      await clientsStore.fetchClients()
    }
    
    const id = clientId.value
    const fetchedClient = await clientsStore.getClient(id)
    
    // Mettre à jour currentClient dans le store
    clientsStore.$patch({
      currentClient: fetchedClient
    })
    
    logger.debug('[ClientDetailView] Client récupéré', { client: clientsStore.currentClient })
    
    // Si le client n'est pas trouvé via l'API, essayons de le trouver dans le store
    if (!clientsStore.currentClient) {
      logger.debug('[ClientDetailView] Recherche du client dans le store...')
      const storedClient = clientsStore.clients.find(c => c.id === id)
      if (storedClient) {
        logger.debug('[ClientDetailView] Client trouvé dans le store', { client: storedClient })
        clientsStore.$patch({
          currentClient: storedClient
        })
      } else {
        logger.error('[ClientDetailView] Client non trouvé dans le store')
        error.value = t('clients.details.not_found')
      }
    }
    
    // Récupérer les services du client
    try {
      logger.debug('[ClientDetailView] Récupération des services du client...')
      const response = await servicesStore.fetchClientServices(id)
      logger.debug('[ClientDetailView] Services du client récupérés', { response })
      
      if (response && Array.isArray(response.data)) {
        clientServices.value = response.data
      } else if (response && response.data) {
        clientServices.value = Array.isArray(response.data) ? response.data : [response.data]
      } else {
        logger.debug('Aucun service trouvé pour ce client')
        clientServices.value = []
      }
    } catch (servicesErr) {
      logger.error('Erreur lors de la récupération des services du client', { error: servicesErr })
      clientServices.value = []
    }
  } catch (err) {
    logger.error('Erreur lors de la récupération du client', { error: err })
    error.value = t('clients.details.error_loading')
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
  } catch {
    return date
  }
}

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '-'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

const goToClients = () => {
  router.push({ name: 'clients' })
}

const editClient = () => {
  router.push({ name: 'edit-client', params: { id: route.params.id } })
}

const deleteClientPrompt = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!client.value) return
  
  try {
    isDeleting.value = true
    await clientsStore.deleteClient(client.value.id)
    router.push({ name: 'clients' })
  } catch (err) {
    logger.error('Erreur lors de la suppression du client', { error: err })
    error.value = t('clients.details.error_deleting')
  } finally {
    isDeleting.value = false
    showDeleteModal.value = false
  }
}

const viewService = (serviceId: number) => {
  router.push({ name: 'service-details', params: { id: serviceId.toString() } })
}

const createServiceForClient = () => {
  router.push({ 
    name: 'create-service', 
    query: { client_id: client.value ? client.value.id.toString() : '' } 
  })
}

// Initialisation des écouteurs temps réel
const initRealtime = () => {
  logger.debug('[ClientDetailView] Initialisation des écouteurs temps réel')
  
  // Initialiser les écouteurs dans le store
  if (!clientsStore.realtimeInitialized) {
    clientsStore.initRealtimeListeners()
  }
  
  // Ajouter un watcher sur lastRealtimeEvent pour être notifié des changements
  watch(() => clientsStore.lastRealtimeEvent, (newEvent) => {
    logger.info('[ClientDetailView] DIAGNOSTIC - Watcher déclenché sur lastRealtimeEvent', { 
      hasNewEvent: !!newEvent,
      currentClientId: clientId.value,
      newEventClientId: newEvent?.client?.id,
      actionType: newEvent?.action,
      time: new Date().toISOString()
    })
    
    if (newEvent && clientId.value && newEvent.client && newEvent.client.id === clientId.value) {
      logger.info('[ClientDetailView] Événement temps réel détecté pour le client courant', { 
        action: newEvent.action,
        clientId: clientId.value,
        currentStoreClientId: clientsStore.currentClient?.id || 'aucun'
      })
      
      const action = newEvent.action
      
      if (action === 'delete') {
        // Si le client est supprimé, retourner à la liste des clients
        notificationStore.showNotification({
          title: t('clients.deleted'),
          message: t('clients.client_deleted_message'),
          type: 'warning'
        })
        router.push({ name: 'clients' })
      } else {
        // Pour create ou update, recharger explicitement les données du client depuis l'API
        logger.info('[ClientDetailView] Rechargement explicite des données client après événement temps réel', {
          action,
          clientId: clientId.value
        })
        fetchClient()
      }
    }
  }, { deep: true })
}

// Cycle de vie
onMounted(() => {
  fetchClient()
  initRealtime()
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS commun */
@import '@/assets/css/components/common-layout.css';

.client-detail-container {
  margin-top: 1rem;
}

.client-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.client-basic-info {
  display: flex;
  align-items: center;
}

.client-avatar-container {
  margin-right: 1rem;
}

.client-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-color);
}

.client-title {
  display: flex;
  flex-direction: column;
}

.client-title h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.client-id {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.tabs-container {
  margin-top: 1.5rem;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.tab-button:hover {
  color: var(--text-color);
}

.tab-button.active {
  color: var(--primary-color);
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
}

.tab-button i {
  margin-right: 0.5rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.detail-value {
  font-weight: 500;
}

.services-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.services-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.service-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.service-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.service-card-header h4 {
  margin: 0;
  font-size: 1rem;
}

.service-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.service-domain {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.service-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.service-detail-item {
  display: flex;
  flex-direction: column;
}

.empty-state-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  text-align: center;
}

.empty-state-small i {
  font-size: 2rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.status-active {
  background-color: var(--success-color);
  color: white;
}

.status-inactive, .status-pending {
  background-color: var(--warning-color);
  color: white;
}

.status-suspended {
  background-color: var(--warning-dark-color);
  color: white;
}

.status-cancelled, .status-terminated {
  background-color: var(--danger-color);
  color: white;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.warning {
  color: var(--danger-color);
  font-weight: 500;
}
</style> 