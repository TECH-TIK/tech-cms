<template>
  <div class="invoice-details-view view-container">
    <!-- En-tête avec navigation -->
    <div class="header-box">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/invoices" class="breadcrumb-link">
            <i class="fas fa-arrow-left"></i>
            {{ t('invoices.title') }}
          </router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">
            {{ t('invoices.details_title', { id: invoiceId }) }}
          </span>
        </div>
        <h1 class="page-title">
          {{ t('invoices.details_title', { id: invoiceId }) }}
        </h1>
        <span class="page-description">
          {{ t('invoices.details_description') }}
        </span>
      </div>
      <div class="header-actions">
        <button 
          v-if="invoice && invoice.status !== 'paid'" 
          class="btn btn-success" 
          @click="markAsPaid"
        >
          <i class="fas fa-credit-card"></i>
          {{ t('invoices.actions.mark_paid') }}
        </button>
        <button 
          class="btn btn-secondary" 
          @click="downloadPDF"
        >
          <i class="fas fa-download"></i>
          {{ t('invoices.actions.download_pdf') }}
        </button>
        <router-link 
          :to="`/invoices/${invoiceId}/edit`" 
          class="btn btn-primary"
        >
          <i class="fas fa-edit"></i>
          {{ t('invoices.actions.edit') }}
        </router-link>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-if="loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="!invoice" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3 class="empty-title">{{ t('invoices.not_found.title') }}</h3>
      <p class="empty-description">{{ t('invoices.not_found.description') }}</p>
    </div>

    <div v-else class="details-grid">
      <!-- Informations principales -->
      <div class="details-card">
        <h3 class="card-title">{{ t('invoices.details.main_info') }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">{{ t('invoices.details.id') }}</label>
            <span class="info-value">#{{ invoice.id }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('invoices.details.status') }}</label>
            <span :class="`status-badge status-${invoice.status}`">
              {{ getStatusName(invoice.status) }}
            </span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('invoices.details.date') }}</label>
            <span class="info-value">{{ formatDate(invoice.date) }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('invoices.details.due_date') }}</label>
            <span class="info-value">{{ invoice.due_date ? formatDate(invoice.due_date) : '-' }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('invoices.details.amount') }}</label>
            <span class="info-value amount">{{ formatCurrency(invoice.amount) }}</span>
          </div>
        </div>
      </div>

      <!-- Informations client -->
      <div class="details-card">
        <h3 class="card-title">{{ t('invoices.details.client_info') }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">{{ t('invoices.details.client') }}</label>
            <router-link 
              :to="`/clients/${invoice.client_id}`" 
              class="info-link"
            >
              {{ invoice.client_name }}
            </router-link>
          </div>
          <div v-if="invoice.client_email" class="info-item">
            <label class="info-label">{{ t('invoices.details.email') }}</label>
            <span class="info-value">{{ invoice.client_email }}</span>
          </div>
          <div v-if="invoice.service_name" class="info-item">
            <label class="info-label">{{ t('invoices.details.service') }}</label>
            <span class="info-value">{{ invoice.service_name }}</span>
          </div>
        </div>
      </div>

      <!-- Éléments de facturation -->
      <div v-if="invoice.items && invoice.items.length" class="details-card full-width">
        <h3 class="card-title">{{ t('invoices.details.items') }}</h3>
        <div class="items-table">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('invoices.details.description') }}</th>
                <th>{{ t('invoices.details.quantity') }}</th>
                <th>{{ t('invoices.details.unit_price') }}</th>
                <th>{{ t('invoices.details.total') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in invoice.items" :key="item.id">
                <td>{{ item.description }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatCurrency(item.unit_price) }}</td>
                <td>{{ formatCurrency(item.total) }}</td>
              </tr>
            </tbody>
          </table>
          
          <!-- Totaux -->
          <div class="invoice-totals">
            <div class="total-row">
              <span class="total-label">{{ t('invoices.details.subtotal') }}</span>
              <span class="total-value">{{ formatCurrency(invoice.subtotal || 0) }}</span>
            </div>
            <div v-if="invoice.tax_amount" class="total-row">
              <span class="total-label">{{ t('invoices.details.tax') }}</span>
              <span class="total-value">{{ formatCurrency(invoice.tax_amount) }}</span>
            </div>
            <div class="total-row final-total">
              <span class="total-label">{{ t('invoices.details.total') }}</span>
              <span class="total-value">{{ formatCurrency(invoice.amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Paiements associés -->
      <div v-if="invoice.payments && invoice.payments.length" class="details-card full-width">
        <h3 class="card-title">{{ t('invoices.details.payments') }}</h3>
        <div class="payments-list">
          <div v-for="payment in invoice.payments" :key="payment.id" class="payment-item">
            <div class="payment-info">
              <span class="payment-amount">{{ formatCurrency(payment.amount) }}</span>
              <span class="payment-method">{{ payment.method }}</span>
              <span class="payment-date">{{ formatDate(payment.date) }}</span>
            </div>
            <router-link :to="`/payments/${payment.id}`" class="payment-link">
              <i class="fas fa-external-link-alt"></i>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="invoice.notes" class="details-card full-width">
        <h3 class="card-title">{{ t('invoices.details.notes') }}</h3>
        <div class="notes-content">
          <p>{{ invoice.notes }}</p>
        </div>
      </div>

      <!-- Historique -->
      <div class="details-card full-width">
        <h3 class="card-title">{{ t('invoices.details.history') }}</h3>
        <div class="history-timeline">
          <div class="timeline-item">
            <div class="timeline-marker created"></div>
            <div class="timeline-content">
              <h4>{{ t('invoices.history.created') }}</h4>
              <p>{{ formatDateTime(invoice.created_at) }}</p>
            </div>
          </div>
          <div v-if="invoice.updated_at !== invoice.created_at" class="timeline-item">
            <div class="timeline-marker updated"></div>
            <div class="timeline-content">
              <h4>{{ t('invoices.history.updated') }}</h4>
              <p>{{ formatDateTime(invoice.updated_at) }}</p>
            </div>
          </div>
          <div v-if="invoice.status === 'paid' && invoice.paid_at" class="timeline-item">
            <div class="timeline-marker paid"></div>
            <div class="timeline-content">
              <h4>{{ t('invoices.history.paid') }}</h4>
              <p>{{ formatDateTime(invoice.paid_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Invoice } from '@/types/payment'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useInvoiceStore } from '@/stores/invoices'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const invoiceStore = useInvoiceStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(false)

// Computed
const invoiceId = computed(() => route.params.id as string)
// Utiliser une propriété calculée pour référencer directement la facture dans le store
// Utilisation d'un type explicite avec vérification pour éviter les erreurs de typage
const invoice = computed(() => {
  // On s'assure que currentInvoice existe avant de le typer
  if (!invoiceStore.currentInvoice) return {} as Invoice
  
  const currentInvoice = invoiceStore.currentInvoice
  
  // Conversion explicite pour que TypeScript reconnaisse les propriétés optionnelles
  // Utilisons un casting de type pour éviter les erreurs de propriétés manquantes
  return {
    ...currentInvoice,
    // Ajout des propriétés qui pourraient manquer dans le type retourné par le store
    client_id: (currentInvoice as any).client_id || 0,
    total: currentInvoice.amount || 0
  } as Invoice
})

// Méthodes
const fetchInvoice = async () => {
  loading.value = true
  try {
    await invoiceStore.fetchInvoice(parseInt(invoiceId.value))
    // Plus besoin d'assigner invoice.value car c'est maintenant une propriété calculée
  } catch (error) {
    logger.error('Erreur lors du chargement de la facture', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('invoices.errors.load_failed')
    })
    router.push('/invoices')
  } finally {
    loading.value = false
  }
}

const markAsPaid = async () => {
  if (confirm(t('invoices.confirm_mark_paid'))) {
    try {
      // La méthode updateInvoice accepte un seul paramètre de type Partial<Invoice>
      const updatedInvoice = await invoiceStore.updateInvoice({
        id: parseInt(invoiceId.value),
        status: 'paid'
      })
      if (updatedInvoice) {
        await fetchInvoice() // Recharger les données
        notificationStore.addNotification({
          type: 'success',
          title: t('common.success'),
          message: t('invoices.success.marked_paid')
        })
      }
    } catch (error) {
      logger.error('Erreur lors du marquage comme payé', { error })
      notificationStore.addNotification({
        type: 'error',
        title: t('common.error'),
        message: t('invoices.errors.mark_paid_failed')
      })
    }
  }
}

const downloadPDF = async () => {
  try {
    // TODO: Implémenter le téléchargement PDF
    notificationStore.addNotification({
      type: 'info',
      title: t('common.info'),
      message: 'Téléchargement PDF à implémenter'
    })
  } catch (error) {
    logger.error('Erreur lors du téléchargement PDF', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('invoices.errors.download_failed')
    })
  }
}

const formatCurrency = (amount: number | string | undefined) => {
  if (amount === undefined) return ''
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(numAmount)
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return ''
  
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Date(dateString).toLocaleString(undefined, options)
}

const getStatusName = (status: string) => {
  // Map des statuts aux noms traduits
  const statuses: Record<string, string> = {
    paid: t('invoices.status.paid'),
    unpaid: t('invoices.status.pending'), 
    pending: t('invoices.status.pending'),
    overdue: t('invoices.status.overdue'),
    cancelled: t('invoices.status.cancelled')
  }
  
  return statuses[status] || status
}

// Initialisation du temps réel
const initRealtime = () => {
  logger.info('[INVOICE-DETAIL] Initialisation des écouteurs temps réel')
  invoiceStore.initRealtimeListeners()
  logger.info('[INVOICE-DETAIL] Écouteurs temps réel initialisés')
}

// Lifecycle
onMounted(async () => {
  logger.info('[INVOICE-DETAIL] Component monté, initialisation...')
  await fetchInvoice()
  logger.info('[INVOICE-DETAIL] Facture chargée, initialisation du temps réel')
  
  // 1. Initialiser les écouteurs
  initRealtime()
  
  // 2. Créer le watcher une fois que tout est chargé
  watch(
    () => invoiceStore.lastRealtimeEvent,
    (newEvent) => {
      // Log de débogage détaillé
      logger.info('[INVOICE-DETAIL] Watcher déclenché pour lastRealtimeEvent', { 
        event_exists: !!newEvent,
        event_type: newEvent?.action,
        event_invoice_id: newEvent?.invoice?.id,
        current_invoice_id: invoice.value?.id
      })
      
      if (!newEvent || !newEvent.invoice || !newEvent.action) {
        logger.info('[INVOICE-DETAIL] Événement incomplet, ignoré')
        return
      }
      
      if (!invoice.value || !invoiceId.value) {
        logger.info('[INVOICE-DETAIL] Facture courante non définie, ignoré')
        return
      }
      
      const currentId = parseInt(invoiceId.value)
      const eventInvoiceId = parseInt(newEvent.invoice.id)
      
      // Vérifier si l'événement concerne la facture actuelle
      if (eventInvoiceId === currentId) {
        logger.info(`[INVOICE-DETAIL] Événement ${newEvent.action} reçu pour la facture #${currentId}`)
        
        if (newEvent.action === 'delete') {
          // Si la facture a été supprimée, rediriger vers la liste des factures
          notificationStore.addNotification({
            type: 'warning',
            title: t('common.info'),
            message: t('invoices.realtime.deleted')
          })
          router.push('/invoices')
        } else if (newEvent.action === 'update') {
          // Mise à jour directe de la facture courante sans requête API supplémentaire
          logger.info(`[INVOICE-DETAIL] Mise à jour directe de la facture #${currentId} depuis l'événement update`)
          
          if (newEvent.invoice && Object.keys(newEvent.invoice).length > 0) {
            // Mettre à jour directement la facture courante avec les données temps réel
            invoiceStore.currentInvoice = newEvent.invoice;
            logger.info(`[INVOICE-DETAIL] Facture #${currentId} mise à jour directement depuis les données temps réel`)
            
            notificationStore.addNotification({
              type: 'info',
              title: t('common.info'),
              message: t('invoices.realtime.updated')
            })
          } else {
            // Si par hasard les données complètes ne sont pas disponibles, fallback sur l'ancienne méthode
            logger.warn(`[INVOICE-DETAIL] Données incomplètes dans l'événement, rechargement complet nécessaire`)
            fetchInvoice()
          }
        }
      }
    },
    { deep: true, immediate: true }
  )
  
  logger.info('[INVOICE-DETAIL] Temps réel initialisé avec succès')
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

.items-table .data-table {
  margin-bottom: 1rem;
}

.invoice-totals {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
  max-width: 300px;
  margin-left: auto;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.total-row.final-total {
  border-top: 1px solid var(--border-color);
  padding-top: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.payment-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.payment-amount {
  font-weight: 600;
  color: var(--success-color);
}

.payment-link {
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

.timeline-marker.paid {
  background-color: var(--primary-color);
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
  
  .payment-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
