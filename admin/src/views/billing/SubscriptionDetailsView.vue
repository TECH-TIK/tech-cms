<template>
  <div class="subscription-details-view view-container">
    <!-- En-tête avec navigation -->
    <div class="header-box">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/subscriptions" class="breadcrumb-link">
            <i class="fas fa-arrow-left"></i>
            {{ t('subscriptions.title') }}
          </router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">
            {{ t('subscriptions.details_title', { id: subscriptionId }) }}
          </span>
        </div>
        <h1 class="page-title">
          {{ t('subscriptions.details_title', { id: subscriptionId }) }}
        </h1>
        <span class="page-description">
          {{ t('subscriptions.details_description') }}
        </span>
      </div>
      <div class="header-actions">
        <button 
          v-if="subscription && subscription.status === 'active'" 
          class="btn btn-warning" 
          @click="cancelSubscription"
        >
          <i class="fas fa-ban"></i>
          {{ t('subscriptions.actions.cancel') }}
        </button>
        <button 
          v-if="subscription && subscription.status !== 'active'" 
          class="btn btn-success" 
          @click="renewSubscription"
        >
          <i class="fas fa-sync"></i>
          {{ t('subscriptions.actions.renew') }}
        </button>
        <router-link 
          :to="`/subscriptions/${subscriptionId}/edit`" 
          class="btn btn-primary"
        >
          <i class="fas fa-edit"></i>
          {{ t('subscriptions.actions.edit') }}
        </router-link>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-if="loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="!subscription" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3 class="empty-title">{{ t('subscriptions.not_found.title') }}</h3>
      <p class="empty-description">{{ t('subscriptions.not_found.description') }}</p>
    </div>

    <div v-else class="details-grid">
      <!-- Informations principales -->
      <div class="details-card">
        <h3 class="card-title">{{ t('subscriptions.details.main_info') }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">{{ t('subscriptions.details.id') }}</label>
            <span class="info-value">#{{ subscription.id }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('subscriptions.details.status') }}</label>
            <span :class="`status-badge status-${subscription.status}`">
              {{ getStatusName(subscription.status) }}
            </span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('subscriptions.details.price') }}</label>
            <span class="info-value amount">{{ formatCurrency(subscription.price) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ t('subscriptions.fields.billing_cycle') }}</span>
            <span class="info-value">{{ getCycleName(subscription.billing_cycle) }}</span>
          </div>
        </div>
      </div>

      <!-- Informations client et produit -->
      <div class="details-card">
        <h3 class="card-title">{{ t('subscriptions.details.client_product') }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">{{ t('subscriptions.details.client') }}</label>
            <router-link 
              :to="`/clients/${subscription.client_id}`" 
              class="info-link"
            >
              {{ subscription.client_name }}
            </router-link>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('subscriptions.details.product') }}</label>
            <span class="info-value">{{ subscription.product_name }}</span>
          </div>
          <div v-if="subscription.domain" class="info-item">
            <label class="info-label">{{ t('subscriptions.details.domain') }}</label>
            <span class="info-value">{{ subscription.domain }}</span>
          </div>
          <div v-if="subscription.username" class="info-item">
            <label class="info-label">{{ t('subscriptions.details.username') }}</label>
            <span class="info-value">{{ subscription.username }}</span>
          </div>
        </div>
      </div>

      <!-- Dates importantes -->
      <div class="details-card">
        <h3 class="card-title">{{ t('subscriptions.details.dates') }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">{{ t('subscriptions.details.start_date') }}</label>
            <span class="info-value">{{ formatDate(subscription.start_date) }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('subscriptions.details.next_billing') }}</label>
            <span class="info-value">{{ subscription.next_billing_date ? formatDate(subscription.next_billing_date) : '-' }}</span>
          </div>
          <div v-if="subscription.end_date" class="info-item">
            <label class="info-label">{{ t('subscriptions.details.end_date') }}</label>
            <span class="info-value">{{ formatDate(subscription.end_date) }}</span>
          </div>
        </div>
      </div>

      <!-- Configuration du service -->
      <div class="details-card">
        <h3 class="card-title">{{ t('subscriptions.details.service_config') }}</h3>
        <div class="info-grid">
          <div v-if="subscription.server_name" class="info-item">
            <label class="info-label">{{ t('subscriptions.details.server') }}</label>
            <span class="info-value">{{ subscription.server_name }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('subscriptions.details.auto_renew') }}</label>
            <span class="info-value">
              <i :class="subscription.auto_renew ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
              {{ subscription.auto_renew ? t('common.yes') : t('common.no') }}
            </span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('subscriptions.details.notifications') }}</label>
            <span class="info-value">
              <i :class="subscription.send_notifications ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
              {{ subscription.send_notifications ? t('common.enabled') : t('common.disabled') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Factures associées -->
      <div v-if="subscription.invoices && subscription.invoices.length" class="details-card full-width">
        <h3 class="card-title">{{ t('subscriptions.details.invoices') }}</h3>
        <div class="invoices-list">
          <div v-for="invoice in subscription.invoices" :key="invoice.id" class="invoice-item">
            <div class="invoice-info">
              <span class="invoice-id">#{{ invoice.id }}</span>
              <span class="invoice-amount">{{ formatCurrency(invoice.amount) }}</span>
              <span :class="`status-badge status-${invoice.status}`">{{ invoice.status }}</span>
              <span class="invoice-date">{{ formatDate(invoice.date) }}</span>
            </div>
            <router-link :to="`/invoices/${invoice.id}`" class="invoice-link">
              <i class="fas fa-external-link-alt"></i>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="subscription.notes" class="details-card full-width">
        <h3 class="card-title">{{ t('subscriptions.details.notes') }}</h3>
        <div class="notes-content">
          <p>{{ subscription.notes }}</p>
        </div>
      </div>

      <!-- Historique -->
      <div class="details-card full-width">
        <h3 class="card-title">{{ t('subscriptions.details.history') }}</h3>
        <div class="history-timeline">
          <div class="timeline-item">
            <div class="timeline-marker created"></div>
            <div class="timeline-content">
              <h4>{{ t('subscriptions.history.created') }}</h4>
              <p>{{ formatDateTime(subscription.created_at) }}</p>
            </div>
          </div>
          <div v-if="subscription.updated_at !== subscription.created_at" class="timeline-item">
            <div class="timeline-marker updated"></div>
            <div class="timeline-content">
              <h4>{{ t('subscriptions.history.updated') }}</h4>
              <p>{{ formatDateTime(subscription.updated_at) }}</p>
            </div>
          </div>
          <div v-if="subscription.status === 'cancelled' && subscription.cancelled_at" class="timeline-item">
            <div class="timeline-marker cancelled"></div>
            <div class="timeline-content">
              <h4>{{ t('subscriptions.history.cancelled') }}</h4>
              <p>{{ formatDateTime(subscription.cancelled_at) }}</p>
            </div>
          </div>
        </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'
import type { Subscription } from '@/types/subscription'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const subscriptionStore = useSubscriptionStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(false)
const subscription = ref<Subscription | null>(null)

// Computed
const subscriptionId = computed(() => Number(route.params.id))

// Récupération des données
const fetchSubscription = async () => {
  loading.value = true
  
  try {
    await subscriptionStore.fetchSubscription(subscriptionId.value)
    const result = subscriptionStore.currentSubscription
    
    if (result) {
      subscription.value = result as Subscription
      
      if (subscription.value && 'invoices' in subscription.value && Array.isArray(subscription.value.invoices)) {
        // Tri des factures par date décroissante
        subscription.value.invoices.sort((a, b) => {
          const dateA = new Date(a.invoice_date || '')
          const dateB = new Date(b.invoice_date || '')
          return dateB.getTime() - dateA.getTime()
        })
      }
    }
  } catch (error) {
    logger.error('Erreur lors du chargement de l\'abonnement', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('subscriptions.errors.load_failed')
    })
    router.push('/subscriptions')
  } finally {
    loading.value = false
  }
}

const cancelSubscription = async () => {
  if (confirm(t('subscriptions.confirm_cancel'))) {
    try {
      await subscriptionStore.cancelSubscription(subscriptionId.value)
      await fetchSubscription() // Recharger les données
      notificationStore.addNotification({
        type: 'success',
        title: t('common.success'),
        message: t('subscriptions.success.cancelled')
      })
    } catch (error) {
      logger.error('Erreur lors de l\'annulation', { error })
      notificationStore.addNotification({
        type: 'error',
        title: t('common.error'),
        message: t('subscriptions.errors.cancel_failed')
      })
    }
  }
}

const renewSubscription = async () => {
  try {
    await subscriptionStore.renewSubscription(subscriptionId.value)
    await fetchSubscription() // Recharger les données
    notificationStore.addNotification({
      type: 'success',
      title: t('common.success'),
      message: t('subscriptions.success.renewed')
    })
  } catch (error) {
    logger.error('Erreur lors du renouvellement', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('subscriptions.errors.renew_failed')
    })
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString))
}

const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getStatusName = (status: string): string => {
  const statuses: Record<string, string> = {
    active: t('subscriptions.status.active'),
    pending: t('subscriptions.status.pending'),
    cancelled: t('subscriptions.status.cancelled'),
    expired: t('subscriptions.status.expired')
  }
  return status in statuses ? statuses[status] : status
}

const getCycleName = (cycle: string): string => {
  const cycles: Record<string, string> = {
    monthly: t('subscriptions.billing_cycle.monthly'),
    quarterly: t('subscriptions.billing_cycle.quarterly'),
    semi_annual: t('subscriptions.billing_cycle.semi_annual'),
    annual: t('subscriptions.billing_cycle.annual')
  }
  
  return cycle in cycles ? cycles[cycle] : cycle
}

// Lifecycle
onMounted(async () => {
  await fetchSubscription()
})
</script>

<style scoped>
@import '@/assets/css/components/common-layout.css';

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.details-card {
  background: var(--card-background);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.details-card.full-width {
  grid-column: 1 / -1;
}

.card-title {
  margin: 0 0 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.info-value.amount {
  font-size: 1.25rem;
  color: var(--success-color);
}

.info-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}

.info-link:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.invoices-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.invoice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.invoice-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.invoice-id {
  font-weight: 600;
}

.invoice-amount {
  color: var(--success-color);
  font-weight: 600;
}

.invoice-link {
  color: var(--primary-color);
  text-decoration: none;
}

.notes-content {
  background: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid var(--primary-color);
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.timeline-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.timeline-marker.created {
  background-color: var(--success-color);
}

.timeline-marker.updated {
  background-color: var(--warning-color);
}

.timeline-marker.cancelled {
  background-color: var(--error-color);
}

.timeline-content h4 {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.timeline-content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.breadcrumb-link {
  color: var(--primary-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: var(--text-secondary);
}

.breadcrumb-current {
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.text-success {
  color: var(--success-color);
}

.text-danger {
  color: var(--error-color);
}

@media (width <= 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .invoice-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
