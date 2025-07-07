<template>
  <div class="payment-details-view view-container">
    <!-- En-tête avec navigation -->
    <div class="header-box">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/payments" class="breadcrumb-link">
            <i class="fas fa-arrow-left"></i>
            {{ t('payments.title') }}
          </router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">
            {{ t('payments.details_title', { id: paymentId }) }}
          </span>
        </div>
        <h1 class="page-title">
          {{ t('payments.details_title', { id: paymentId }) }}
        </h1>
        <span class="page-description">
          {{ t('payments.details_description') }}
        </span>
      </div>
      <div class="header-actions">
        <button 
          v-if="payment && payment.status === 'completed'" 
          class="btn btn-warning" 
          @click="handleRefund"
        >
          <i class="fas fa-undo"></i>
          {{ t('payments.actions.refund') }}
        </button>
        <router-link 
          :to="`/payments/${paymentId}/edit`" 
          class="btn btn-primary"
        >
          <i class="fas fa-edit"></i>
          {{ t('payments.actions.edit') }}
        </router-link>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-if="loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="!payment" class="empty-state">
      <div class="empty-state-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="empty-state-text">{{ t('payments.not_found.title') }}</div>
      <p class="empty-state-description">{{ t('payments.not_found.description') }}</p>
    </div>

    <div v-else class="details-container box">
      <!-- Informations principales -->
      <div class="details-card">
        <h3 class="card-title">{{ t('payments.details.main_info') }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">{{ t('payments.details.id') }}</label>
            <span class="info-value">#{{ payment.id }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('payments.details.status') }}</label>
            <span :class="`status-badge status-${payment.status}`">
              {{ getStatusName(payment.status) }}
            </span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('payments.details.amount') }}</label>
            <span class="info-value amount">{{ formatCurrency(payment.amount) }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('payments.details.method') }}</label>
            <span class="info-value">{{ getMethodName(payment.method || payment.payment_method) }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('payments.details.date') }}</label>
            <span class="info-value">{{ formatDate(payment.created_at) }}</span>
          </div>
          <div v-if="payment.transaction_id" class="info-item">
            <label class="info-label">{{ t('payments.details.transaction_id') }}</label>
            <span class="info-value">{{ payment.transaction_id }}</span>
          </div>
        </div>
      </div>

      <!-- Informations client et facture -->
      <div class="details-card">
        <h3 class="card-title">{{ t('payments.details.client_invoice') }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">{{ t('payments.details.client') }}</label>
            <router-link 
              :to="`/clients/${payment.client_id}`" 
              class="info-link"
            >
              {{ payment.client_name }}
            </router-link>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('payments.details.invoice') }}</label>
            <router-link 
              :to="`/invoices/${payment.invoice_id}`" 
              class="info-link"
            >
              #{{ payment.invoice_id }}
            </router-link>
          </div>
          <div v-if="payment.invoice_total" class="info-item">
            <label class="info-label">{{ t('payments.details.invoice_total') }}</label>
            <span class="info-value">{{ formatCurrency(payment.invoice_total) }}</span>
          </div>
        </div>
      </div>

      <!-- Notes et détails additionnels -->
      <div v-if="payment.notes" class="details-card full-width">
        <h3 class="card-title">{{ t('payments.details.notes') }}</h3>
        <div class="notes-content">
          <p>{{ payment.notes }}</p>
        </div>
      </div>

      <!-- Historique des actions -->
      <div class="details-card full-width">
        <h3 class="card-title">{{ t('payments.details.history') }}</h3>
        <div class="history-timeline">
          <div class="timeline-item">
            <div class="timeline-marker created"></div>
            <div class="timeline-content">
              <h4>{{ t('payments.history.created') }}</h4>
              <p>{{ formatDateTime(payment.created_at) }}</p>
            </div>
          </div>
          <div v-if="payment.updated_at !== payment.created_at" class="timeline-item">
            <div class="timeline-marker updated"></div>
            <div class="timeline-content">
              <h4>{{ t('payments.history.updated') }}</h4>
              <p>{{ formatDateTime(payment.updated_at) }}</p>
            </div>
          </div>
          <div v-if="payment.status === 'refunded'" class="timeline-item">
            <div class="timeline-marker refunded"></div>
            <div class="timeline-content">
              <h4>{{ t('payments.history.refunded') }}</h4>
              <p>{{ formatDateTime(payment.refunded_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePaymentStore } from '@/stores/payments'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(false)

// Computed
const paymentId = computed(() => route.params.id as string)
// Utiliser une propriété calculée pour référencer directement le paiement dans le store
const payment = computed(() => paymentStore.currentPayment)

// Méthodes
const fetchPayment = async () => {
  loading.value = true
  try {
    await paymentStore.fetchPayment(parseInt(paymentId.value))
    // Plus besoin d'assigner payment.value car c'est maintenant une propriété calculée
  } catch (error) {
    logger.error('Erreur lors du chargement du paiement', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('payments.errors.load_failed')
    })
    router.push('/payments')
  } finally {
    loading.value = false
  }
}

const handleRefund = async () => {
  if (confirm(t('payments.confirm_refund'))) {
    try {
      await paymentStore.processRefund(parseInt(paymentId.value), 'Remboursement administrateur')
      await fetchPayment() // Recharger les données
      notificationStore.addNotification({
        type: 'success',
        title: t('common.success'),
        message: t('payments.success.refunded')
      })
    } catch (error) {
      logger.error('Erreur lors du remboursement', { error })
      notificationStore.addNotification({
        type: 'error',
        title: t('common.error'),
        message: t('payments.errors.refund_failed')
      })
    }
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('fr-FR')
}

const getStatusName = (status: string): string => {
  const statuses: Record<string, string> = {
    'completed': t('payments.status.completed'),
    'pending': t('payments.status.pending'),
    'failed': t('payments.status.failed'),
    'refunded': t('payments.status.refunded')
  }
  return statuses[status] || status
}

const getMethodName = (method: string | undefined): string => {
  if (!method) return ''
  const methods: Record<string, string> = {
    'stripe': 'Stripe',
    'paypal': 'PayPal',
    'bank_transfer': t('payments.methods.bank_transfer'),
    'cash': t('payments.methods.cash')
  }
  return methods[method] || method
}

// Initialisation du temps réel
const initRealtime = () => {
  logger.info('[PAYMENT-DETAIL] Initialisation des écouteurs temps réel')
  paymentStore.initRealtimeListeners()
  logger.info('[PAYMENT-DETAIL] Écouteurs temps réel initialisés')
}

// Lifecycle
onMounted(async () => {
  logger.info('[PAYMENT-DETAIL] Component monté, initialisation...')
  await fetchPayment()
  logger.info('[PAYMENT-DETAIL] Paiement chargé, initialisation du temps réel')
  
  // 1. Initialiser les écouteurs
  initRealtime()
  
  // 2. Créer le watcher une fois que tout est chargé
  watch(
    () => paymentStore.lastRealtimeEvent,
    (newEvent) => {
      // Log de débogage détaillé
      logger.info('[PAYMENT-DETAIL] Watcher déclenché pour lastRealtimeEvent', { 
        event_exists: !!newEvent,
        event_type: newEvent?.action,
        event_payment_id: newEvent?.payment?.id,
        current_payment_id: payment.value?.id
      })
      
      if (!newEvent || !newEvent.payment || !newEvent.action) {
        logger.info('[PAYMENT-DETAIL] Événement incomplet, ignoré')
        return
      }
      
      if (!payment.value || !paymentId.value) {
        logger.info('[PAYMENT-DETAIL] Paiement courant non défini, ignoré')
        return
      }
      
      const currentId = parseInt(paymentId.value)
      const eventPaymentId = parseInt(newEvent.payment.id)
      
      // Vérifier si l'événement concerne le paiement actuel
      if (eventPaymentId === currentId) {
        logger.info(`[PAYMENT-DETAIL] Événement ${newEvent.action} reçu pour le paiement #${currentId}`)
        
        if (newEvent.action === 'delete') {
          // Si le paiement a été supprimé, rediriger vers la liste des paiements
          notificationStore.addNotification({
            type: 'warning',
            title: t('common.info'),
            message: t('payments.realtime.deleted', { fallback: 'Ce paiement a été supprimé' })
          })
          router.push('/payments')
        } else if (['update', 'refund'].includes(newEvent.action)) {
          // Mise à jour directe du paiement courant sans requête API supplémentaire
          logger.info(`[PAYMENT-DETAIL] Mise à jour directe du paiement #${currentId} depuis l'événement ${newEvent.action}`)
          
          if (newEvent.payment) {
            // Mettre à jour directement le paiement courant avec les données temps réel
            paymentStore.currentPayment = newEvent.payment;
            logger.info(`[PAYMENT-DETAIL] Paiement #${currentId} mis à jour directement depuis les données temps réel`)
            
            notificationStore.addNotification({
              type: 'info',
              title: t('common.info'),
              message: t('payments.realtime.updated', { fallback: 'Ce paiement a été mis à jour' })
            })
          } else {
            // Si par hasard les données complètes ne sont pas disponibles, fallback sur l'ancienne méthode
            logger.warn(`[PAYMENT-DETAIL] Données incomplètes dans l'événement, rechargement complet nécessaire`)
            fetchPayment()
          }
        }
      }
    },
    { deep: true, immediate: true }
  )
  
  logger.info('[PAYMENT-DETAIL] Temps réel initialisé avec succès')
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS commun */
@import '@/assets/css/components/common-layout.css';

.details-container {
  padding: 1.5rem;
  margin-top: 1rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
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

.timeline-marker.refunded {
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

@media (width <= 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
  }
}
</style>
