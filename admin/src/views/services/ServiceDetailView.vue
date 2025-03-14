<template>
  <div id="serviceDetail" class="view-container">
    <!-- En-tête avec titre et boutons d'action -->
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ t('services.details.title') }}</h1>
        <span class="page-description">{{ t('services.details.description') }}</span>
      </div>
      <div class="action-buttons">
        <button class="btn btn-outline" @click="goToServices">
          <i class="fas fa-arrow-left"></i>
          {{ t('common.back') }}
        </button>
        <button class="btn btn-outline" @click="editService">
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
      <button class="btn btn-primary" @click="fetchService">
        {{ t('common.retry') }}
      </button>
    </div>

    <!-- Contenu du service -->
    <div v-else-if="service" class="service-detail-container box">
      <!-- Statut et informations principales -->
      <div class="service-header">
        <div class="service-basic-info">
          <h2>
            {{ service.product_name || t('services.details.unknown_product') }}
            <span class="service-id">#{{ service.id }}</span>
          </h2>
          <p class="service-domain" v-if="service.domain">{{ service.domain }}</p>
        </div>
        
        <div class="service-status">
          <span class="status-badge" :class="'status-' + service.status">
            {{ t(`services.status.${service.status}`) }}
          </span>
          <div class="status-actions" v-if="service.status !== 'terminated'">
            <button 
              class="btn btn-sm" 
              :class="getStatusActionClass(action)" 
              v-for="action in availableStatusActions" 
              :key="action"
              @click="showStatusChangeModal(action)"
            >
              <i :class="getStatusActionIcon(action)"></i>
              {{ t(`services.actions.${action}`) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sections d'informations -->
      <div class="detail-grid">
        <!-- Client -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-user"></i> {{ t('services.details.client') }}</h3>
          </div>
          <div class="card-content">
            <div class="info-item">
              <div class="info-label">{{ t('services.details.client_name') }}</div>
              <div class="info-value">{{ service.client_name || t('services.details.unknown') }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ t('services.details.client_email') }}</div>
              <div class="info-value">{{ service.client_email || t('services.details.unknown') }}</div>
            </div>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="goToClient(service.client_id)">
                {{ t('services.details.view_client') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Détails du produit -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-box"></i> {{ t('services.details.product') }}</h3>
          </div>
          <div class="card-content">
            <div class="info-item">
              <div class="info-label">{{ t('services.details.product_name') }}</div>
              <div class="info-value">{{ service.product_name || t('services.details.unknown') }}</div>
            </div>
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="goToProduct(service.product_id)">
                {{ t('services.details.view_product') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Détails du serveur -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-server"></i> {{ t('services.details.server') }}</h3>
          </div>
          <div class="card-content">
            <div v-if="service.server_id">
              <div class="info-item">
                <div class="info-label">{{ t('services.details.server_name') }}</div>
                <div class="info-value">{{ service.server_name || t('services.details.unknown') }}</div>
              </div>
              <div class="card-actions">
                <button class="btn btn-sm btn-outline" @click="goToServer(service.server_id)">
                  {{ t('services.details.view_server') }}
                </button>
              </div>
            </div>
            <div v-else class="empty-info">
              {{ t('services.details.no_server') }}
            </div>
          </div>
        </div>

        <!-- Détails de facturation -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-file-invoice-dollar"></i> {{ t('services.details.billing') }}</h3>
          </div>
          <div class="card-content">
            <div class="info-item">
              <div class="info-label">{{ t('services.details.billing_cycle') }}</div>
              <div class="info-value">{{ formatBillingCycle(service.billing_cycle) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ t('services.details.next_due_date') }}</div>
              <div class="info-value">{{ service.next_due_date ? formatDate(service.next_due_date) : t('services.details.not_set') }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ t('services.details.recurring_amount') }}</div>
              <div class="info-value">{{ formatCurrency(service.recurring_amount) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ t('services.details.setup_fee') }}</div>
              <div class="info-value">{{ formatCurrency(service.setup_fee) }}</div>
            </div>
          </div>
        </div>

        <!-- Dates importantes -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-calendar-alt"></i> {{ t('services.details.important_dates') }}</h3>
          </div>
          <div class="card-content">
            <div class="info-item">
              <div class="info-label">{{ t('services.details.created_at') }}</div>
              <div class="info-value">{{ service.created_at ? formatDateTime(service.created_at) : t('services.details.unknown') }}</div>
            </div>
            <div class="info-item" v-if="service.status === 'suspended' && service.suspension_date">
              <div class="info-label">{{ t('services.details.suspension_date') }}</div>
              <div class="info-value">{{ formatDateTime(service.suspension_date) }}</div>
            </div>
            <div class="info-item" v-if="service.status === 'cancelled' && service.cancellation_date">
              <div class="info-label">{{ t('services.details.cancellation_date') }}</div>
              <div class="info-value">{{ formatDateTime(service.cancellation_date) }}</div>
            </div>
            <div class="info-item" v-if="service.status === 'terminated' && service.termination_date">
              <div class="info-label">{{ t('services.details.termination_date') }}</div>
              <div class="info-value">{{ formatDateTime(service.termination_date) }}</div>
            </div>
          </div>
        </div>

        <!-- Identifiants de connexion -->
        <div class="detail-card">
          <div class="card-header">
            <h3><i class="fas fa-key"></i> {{ t('services.details.login_details') }}</h3>
          </div>
          <div class="card-content">
            <div v-if="service.username || service.password">
              <div class="info-item" v-if="service.username">
                <div class="info-label">{{ t('services.details.username') }}</div>
                <div class="info-value">{{ service.username }}</div>
              </div>
              <div class="info-item" v-if="service.password">
                <div class="info-label">{{ t('services.details.password') }}</div>
                <div class="info-value password-field">
                  <span v-if="showPassword">{{ service.password }}</span>
                  <span v-else>••••••••</span>
                  <button class="btn-icon" @click="showPassword = !showPassword">
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="empty-info">
              {{ t('services.details.no_login_details') }}
            </div>
          </div>
        </div>

        <!-- Configuration personnalisée -->
        <div class="detail-card" v-if="service.configuration && Object.keys(service.configuration).length > 0">
          <div class="card-header">
            <h3><i class="fas fa-cogs"></i> {{ t('services.details.configuration') }}</h3>
          </div>
          <div class="card-content">
            <div class="info-item" v-for="(value, key) in service.configuration" :key="key">
              <div class="info-label">{{ key }}</div>
              <div class="info-value">{{ value }}</div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="detail-card" v-if="service.notes">
          <div class="card-header">
            <h3><i class="fas fa-sticky-note"></i> {{ t('services.details.notes') }}</h3>
          </div>
          <div class="card-content">
            <div class="notes-content">
              {{ service.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de changement de statut -->
    <div class="modal show" v-if="showStatusModal" style="display: flex; align-items: center; justify-content: center;">
      <div class="modal-backdrop" @click="closeStatusModal"></div>
      <div class="modal-content" style="position: fixed; z-index: 1052; max-height: 80vh; backdrop-filter: none; -webkit-backdrop-filter: none;">
        <div class="modal-header">
          <h3>{{ t(`services.status_change.${statusAction}_title`) }}</h3>
          <button class="close-btn" @click="closeStatusModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>{{ t(`services.status_change.${statusAction}_confirmation`) }}</p>
          
          <div class="form-group">
            <label for="status-notes">{{ t('services.status_change.notes') }}</label>
            <textarea 
              id="status-notes" 
              v-model="statusNotes" 
              class="form-control" 
              :placeholder="t('services.status_change.notes_placeholder')"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeStatusModal">
            {{ t('common.cancel') }}
          </button>
          <button 
            class="btn" 
            :class="getStatusActionButtonClass(statusAction)"
            @click="confirmStatusChange"
            :disabled="statusChangeLoading"
          >
            <i v-if="statusChangeLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else :class="getStatusActionIcon(statusAction)"></i>
            {{ t(`services.actions.${statusAction}`) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useServicesStore } from '@/stores/services'
import { useNotificationStore } from '@/stores/notifications'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Service } from '@/types'

// Stores et router
const servicesStore = useServicesStore()
const notificationStore = useNotificationStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// État
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const showStatusModal = ref(false)
const statusAction = ref('')
const statusNotes = ref('')
const statusChangeLoading = ref(false)

// Service actuel
const serviceId = computed(() => {
  const id = route.params.id
  return id ? parseInt(id.toString()) : null
})

const service = computed(() => servicesStore.currentService)

// Calculer les actions disponibles en fonction du statut actuel
const availableStatusActions = computed(() => {
  if (!service.value) return []
  
  switch (service.value.status) {
    case 'pending':
      return ['activate', 'cancel', 'terminate']
    case 'active':
      return ['suspend', 'cancel', 'terminate']
    case 'suspended':
      return ['activate', 'cancel', 'terminate']
    case 'cancelled':
      return ['activate', 'terminate']
    default:
      return []
  }
})

// Méthodes utilitaires
const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
  } catch (e) {
    return date
  }
}

const formatDateTime = (date: string) => {
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
  } catch (e) {
    return date
  }
}

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '-'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

const formatBillingCycle = (cycle: string | undefined) => {
  if (!cycle) return t('services.details.not_set')
  return t(`services.billing_cycles.${cycle}`)
}

const getStatusActionIcon = (action: string) => {
  switch (action) {
    case 'activate': return 'fas fa-check-circle'
    case 'suspend': return 'fas fa-pause-circle'
    case 'cancel': return 'fas fa-times-circle'
    case 'terminate': return 'fas fa-trash-alt'
    default: return 'fas fa-cog'
  }
}

const getStatusActionClass = (action: string) => {
  switch (action) {
    case 'activate': return 'btn-success'
    case 'suspend': return 'btn-warning'
    case 'cancel': return 'btn-danger-light'
    case 'terminate': return 'btn-danger'
    default: return 'btn-secondary'
  }
}

const getStatusActionButtonClass = (action: string) => {
  switch (action) {
    case 'activate': return 'btn-success'
    case 'suspend': return 'btn-warning'
    case 'cancel': return 'btn-danger'
    case 'terminate': return 'btn-danger'
    default: return 'btn-secondary'
  }
}

// Actions
const fetchService = async () => {
  if (!serviceId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await servicesStore.fetchServiceById(serviceId.value)
  } catch (err) {
    console.error('Erreur lors de la récupération du service:', err)
    error.value = t('services.details.error_loading')
  } finally {
    loading.value = false
  }
}

const goToServices = () => {
  router.push({ name: 'services' })
}

const editService = () => {
  if (!serviceId.value) return
  router.push({ name: 'edit-service', params: { id: serviceId.value.toString() } })
}

const goToClient = (clientId: number) => {
  router.push({ name: 'client-details', params: { id: clientId.toString() } })
}

const goToProduct = (productId: number) => {
  router.push({ name: 'product-details', params: { id: productId.toString() } })
}

const goToServer = (serverId: number) => {
  router.push({ name: 'server-details', params: { id: serverId.toString() } })
}

const showStatusChangeModal = (action: string) => {
  console.log(`[ServiceDetailView] showStatusChangeModal appelé avec action: ${action}`);
  statusAction.value = action
  statusNotes.value = ''
  showStatusModal.value = true
  console.log(`[ServiceDetailView] Modal de changement de statut affichée pour l'action ${action}`);
}

const closeStatusModal = () => {
  console.log(`[ServiceDetailView] closeStatusModal appelé`);
  showStatusModal.value = false
  statusAction.value = ''
  statusNotes.value = ''
}

const confirmStatusChange = async () => {
  console.log(`[ServiceDetailView] confirmStatusChange appelé pour l'action ${statusAction.value}`);
  if (!serviceId.value) return
  
  statusChangeLoading.value = true
  
  try {
    // Déterminer le nouveau statut en fonction de l'action
    let newStatus = ''
    switch (statusAction.value) {
      case 'activate':
        newStatus = 'active'
        break
      case 'suspend':
        newStatus = 'suspended'
        break
      case 'cancel':
        newStatus = 'cancelled'
        break
      case 'terminate':
        newStatus = 'terminated'
        break
      default:
        throw new Error(t('services.status_change.invalid_action'))
    }
    
    console.log(`[ServiceDetailView] Appel de servicesStore.changeServiceStatus pour le service ${serviceId.value} avec le nouveau statut ${newStatus}`);
    
    // Appeler l'API pour changer le statut
    await servicesStore.changeServiceStatus(serviceId.value, newStatus, statusNotes.value)
    
    console.log(`[ServiceDetailView] Statut du service ${serviceId.value} changé avec succès en ${newStatus}`);
    
    // Afficher une notification de succès
    notificationStore.showNotification({
      title: t('services.status_change.success_title'),
      message: t(`services.status_change.${statusAction.value}_success`),
      type: 'success'
    })
    
    // Fermer la modal
    closeStatusModal()
  } catch (err) {
    console.error('Erreur lors du changement de statut:', err)
    notificationStore.showNotification({
      title: t('common.error'),
      message: t('services.status_change.error'),
      type: 'error'
    })
  } finally {
    statusChangeLoading.value = false
  }
}

// Cycle de vie
onMounted(() => {
  fetchService()
})
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.service-detail-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
}

.service-basic-info h2 {
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.service-id {
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: normal;
}

.service-domain {
  margin: 0.5rem 0 0;
  color: var(--text-muted);
  font-weight: 500;
}

.service-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

.status-pending {
  background-color: var(--warning-color);
}

.status-active {
  background-color: var(--success-color);
}

.status-suspended {
  background-color: var(--warning-dark-color);
}

.status-cancelled {
  background-color: var(--danger-light-color);
}

.status-terminated {
  background-color: var(--danger-color);
}

.status-fraud {
  background-color: var(--danger-dark-color);
}

.status-actions {
  display: flex;
  gap: 0.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.detail-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-header-bg);
}

.card-header h3 {
  margin: 0;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header i {
  color: var(--primary-color);
}

.card-content {
  padding: 1.5rem;
}

.info-item {
  margin-bottom: 1rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.info-value {
  font-weight: 500;
}

.password-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0.25rem;
}

.btn-icon:hover {
  color: var(--primary-color);
}

.empty-info {
  color: var(--text-muted);
  font-style: italic;
}

.notes-content {
  white-space: pre-line;
}

.card-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 0.25rem solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spinner 1s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 3rem;
  color: var(--danger-color);
  margin-bottom: 1rem;
}

.error-container h3 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.25rem rgba(var(--primary-color-rgb), 0.25);
  outline: none;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-danger-light {
  background-color: var(--danger-light-color);
  color: white;
}

.btn-danger-light:hover {
  background-color: var(--danger-color);
}

/* Les styles de correction des modaux ont été déplacés dans le fichier modals.css global */
</style> 