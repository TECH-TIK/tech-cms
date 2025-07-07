<template>
  <div id="invoice-detail">
    <!-- Header Section -->
    <div class="invoice-detail-header">
      <div class="header-content">
        <button class="btn btn-outline btn-sm back-btn" @click="goBack">
          <i class="fas fa-arrow-left"></i>
          Retour à la facturation
        </button>
        <div class="invoice-title-section">
          <div class="invoice-icon-large">
            <i class="fas fa-file-invoice"></i>
          </div>
          <div class="invoice-info">
            <h1>Facture #{{ invoice?.number || 'Chargement...' }}</h1>
            <div class="invoice-meta">
              <span class="invoice-date">{{ formatDate(invoice?.created_at) }}</span>
              <span :class="getStatusClass(invoice?.status)">
                {{ getStatusLabel(invoice?.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="invoice-actions">
        <button class="btn btn-outline btn-sm" @click="downloadInvoice" :disabled="!invoice">
          <i class="fas fa-download"></i>
          Télécharger PDF
        </button>
        <button 
          v-if="invoice?.status === 'unpaid'" 
          class="btn btn-primary" 
          @click="payInvoice"
        >
          <i class="fas fa-credit-card"></i>
          Payer maintenant
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement des détails de la facture...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadInvoice">
          <i class="fas fa-refresh"></i>
          Réessayer
        </button>
      </div>
    </div>

    <!-- Invoice Details -->
    <div v-else-if="invoice" class="invoice-content">
      <!-- Invoice Summary -->
      <div class="invoice-summary">
        <div class="summary-card">
          <h2>
            <i class="fas fa-info-circle"></i>
            Résumé de la facture
          </h2>
          <div class="summary-grid">
            <div class="summary-item">
              <label>Numéro de facture</label>
              <span class="invoice-number">#{{ invoice.number }}</span>
            </div>
            <div class="summary-item">
              <label>Date d'émission</label>
              <span>{{ formatDate(invoice.created_at) }}</span>
            </div>
            <div class="summary-item">
              <label>Date d'échéance</label>
              <span>{{ formatDate(invoice.due_date) }}</span>
            </div>
            <div class="summary-item">
              <label>Statut</label>
              <span :class="getStatusClass(invoice.status)">
                {{ getStatusLabel(invoice.status) }}
              </span>
            </div>
            <div class="summary-item">
              <label>Montant total</label>
              <span class="total-amount">{{ formatPrice(invoice.amount) }}</span>
            </div>
            <div class="summary-item" v-if="invoice.paid_at">
              <label>Date de paiement</label>
              <span>{{ formatDate(invoice.paid_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice Items -->
      <div class="invoice-items">
        <div class="items-card">
          <h2>
            <i class="fas fa-list"></i>
            Détail des services
          </h2>
          <div class="items-table">
            <div class="table-header">
              <div class="col-description">Description</div>
              <div class="col-period">Période</div>
              <div class="col-quantity">Quantité</div>
              <div class="col-price">Prix unitaire</div>
              <div class="col-total">Total</div>
            </div>
            <div class="table-body">
              <div v-for="item in invoiceItems" :key="item.id" class="table-row">
                <div class="col-description">
                  <div class="item-name">{{ item.description }}</div>
                  <div class="item-details" v-if="item.service_name">
                    Service: {{ item.service_name }}
                  </div>
                </div>
                <div class="col-period">
                  {{ formatPeriod(item.period_start, item.period_end) }}
                </div>
                <div class="col-quantity">{{ item.quantity || 1 }}</div>
                <div class="col-price">{{ formatPrice(item.unit_price) }}</div>
                <div class="col-total">{{ formatPrice(item.total_price) }}</div>
              </div>
            </div>
            <div class="table-footer">
              <div class="footer-row">
                <div class="footer-label">Sous-total</div>
                <div class="footer-value">{{ formatPrice(invoice.amount) }}</div>
              </div>
              <!-- TVA non disponible dans l'API actuelle -->
              <div class="footer-row" style="display: none;">
                <div class="footer-label">TVA</div>
                <div class="footer-value">0,00 €</div>
              </div>
              <div class="footer-row total-row">
                <div class="footer-label">Total</div>
                <div class="footer-value">{{ formatPrice(invoice.amount) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment History -->
      <div class="payment-history" v-if="paymentHistory.length > 0">
        <div class="history-card">
          <h2>
            <i class="fas fa-history"></i>
            Historique des paiements
          </h2>
          <div class="history-list">
            <div v-for="payment in paymentHistory" :key="payment.id" class="history-item">
              <div class="payment-icon">
                <i :class="getPaymentIcon(payment.method)"></i>
              </div>
              <div class="payment-details">
                <div class="payment-amount">{{ formatPrice(payment.amount) }}</div>
                <div class="payment-method">{{ getPaymentMethodLabel(payment.method) }}</div>
                <div class="payment-date">{{ formatDate(payment.created_at) }}</div>
              </div>
              <div class="payment-status">
                <span :class="getPaymentStatusClass(payment.status)">
                  {{ getPaymentStatusLabel(payment.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiService } from '@/services/api'
import { useRealtimeStore } from '@/stores/realtime'
import { useAuthStore } from '@/stores/auth'
import logger from '@/services/logger'
import type { Invoice } from '@/types/api'
import type { DashboardRealtimeEvent } from '@/types/realtime'

interface InvoiceItem {
  id: number
  description: string
  service_name?: string
  quantity: number
  unit_price: number
  total_price: number
  period_start?: string
  period_end?: string
}

interface PaymentHistory {
  id: number
  amount: number
  method: string
  status: string
  created_at: string
}

// Router
const route = useRoute()
const router = useRouter()

// Stores
const realtimeStore = useRealtimeStore()
const authStore = useAuthStore()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const invoice = ref<Invoice | null>(null)
const invoiceItems = ref<InvoiceItem[]>([])
const paymentHistory = ref<PaymentHistory[]>([])
const isUpdating = ref(false)

// Methods
const goBack = () => {
  router.push('/billing')
}

const loadInvoice = async () => {
  try {
    loading.value = true
    error.value = null

    const invoiceId = parseInt(route.params.id as string)
    if (!invoiceId) {
      throw new Error('ID de facture invalide')
    }

    // Charger les détails de la facture
    const response = await ApiService.routes.client.invoice.getById(invoiceId)
    invoice.value = response.data

    // Initialiser les tableaux vides pour les éléments et l'historique
    // Ces endpoints n'existent pas encore côté API
    invoiceItems.value = []
    paymentHistory.value = []

    logger.info('[INVOICE] Facture chargée avec succès', { invoiceId: invoice.value?.id })

  } catch (err: any) {
    logger.error('[INVOICE] Erreur lors du chargement de la facture', { error: err, invoiceId: route.params.id })
    error.value = err.response?.data?.message || 'Erreur lors du chargement de la facture'
  } finally {
    loading.value = false
  }
}

const downloadInvoice = async () => {
  try {
    const invoiceId = parseInt(route.params.id as string)
    const response = await ApiService.routes.client.invoice.downloadPdf(invoiceId)
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `facture-${invoice.value?.number}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    logger.error('[INVOICE] Erreur lors du téléchargement', { error: err, invoiceId: invoice.value?.id })
    // TODO: Afficher un message d'erreur à l'utilisateur
  }
}

const payInvoice = () => {
  // TODO: Implémenter le processus de paiement
  logger.info('[INVOICE] Paiement facture demandé', { invoiceId: invoice.value?.id })
}

const getStatusClass = (status?: string): string => {
  const classes: Record<string, string> = {
    'paid': 'status-paid',
    'unpaid': 'status-unpaid',
    'cancelled': 'status-cancelled',
    'overdue': 'status-overdue'
  }
  return classes[status || ''] || 'status-unknown'
}

const getStatusLabel = (status?: string): string => {
  const labels: Record<string, string> = {
    'paid': 'Payée',
    'unpaid': 'Impayée',
    'cancelled': 'Annulée',
    'overdue': 'En retard'
  }
  return labels[status || ''] || 'Inconnu'
}

const getPaymentIcon = (method: string): string => {
  const icons: Record<string, string> = {
    'credit_card': 'fas fa-credit-card',
    'bank_transfer': 'fas fa-university',
    'paypal': 'fab fa-paypal',
    'stripe': 'fab fa-stripe'
  }
  return icons[method] || 'fas fa-money-bill'
}

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    'credit_card': 'Carte de crédit',
    'bank_transfer': 'Virement bancaire',
    'paypal': 'PayPal',
    'stripe': 'Stripe'
  }
  return labels[method] || method
}

const getPaymentStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    'completed': 'payment-completed',
    'pending': 'payment-pending',
    'failed': 'payment-failed'
  }
  return classes[status] || 'payment-unknown'
}

const getPaymentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'completed': 'Terminé',
    'pending': 'En attente',
    'failed': 'Échoué'
  }
  return labels[status] || status
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatPrice = (price?: number): string => {
  if (!price) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

const formatPeriod = (start?: string, end?: string): string => {
  if (!start || !end) return 'N/A'
  const startDate = new Date(start).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  const endDate = new Date(end).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  return `${startDate} - ${endDate}`
}

// Handler temps réel pour les mises à jour de facture
const handleInvoiceUpdate = (event: DashboardRealtimeEvent) => {
  const invoiceId = parseInt(route.params.id as string)

  // Filtrer seulement les événements concernant cette facture
  const eventInvoiceId = parseInt(String(event.data?.invoice?.id || '0'))
  if (event.entity_type === 'invoice' && eventInvoiceId === invoiceId) {
    logger.info('[INVOICE DETAIL] Événement facture reçu', {
      event,
      invoiceId,
      action: event.action
    })

    isUpdating.value = true

    // Mettre à jour les données de la facture
    if (event.data.invoice) {
      invoice.value = { ...invoice.value, ...event.data.invoice }
      logger.info('[INVOICE DETAIL] Facture mise à jour en temps réel', {
        invoiceId,
        updatedInvoice: invoice.value
      })
    }

    // Gestion des actions spéciales
    switch (event.action) {
      case 'invoice_delete':
        logger.warn('[INVOICE DETAIL] Facture supprimée - redirection', { invoiceId })
        router.push('/billing')
        break
      case 'invoice_update':
        // Recharger les éléments et l'historique si nécessaire
        logger.info('[INVOICE DETAIL] Facture mise à jour', { invoiceId })
        break
      case 'invoice_paid':
        logger.info('[INVOICE DETAIL] Facture marquée comme payée', { invoiceId })
        break
    }

    setTimeout(() => {
      isUpdating.value = false
    }, 1000)
  }
}

// Initialiser le temps réel pour cette page
const initRealtime = async () => {
  const clientId = authStore.user?.id
  const invoiceId = parseInt(route.params.id as string)

  if (!clientId) {
    logger.error('[INVOICE DETAIL] ID client manquant - abandon initialisation temps réel', {
      user: authStore.user
    })
    return
  }

  if (!invoiceId) {
    logger.error('[INVOICE DETAIL] ID facture invalide - abandon initialisation temps réel', {
      invoiceId: route.params.id
    })
    return
  }

  const handlerKey = `invoice-detail-${invoiceId}`

  if (realtimeStore.initialized) {
    // S'abonner aux canaux dashboard si pas déjà fait
    await realtimeStore.subscribeToDashboardEvents(clientId)

    // Enregistrer le handler pour cette page de détail
    realtimeStore.registerDashboardHandler(handlerKey, handleInvoiceUpdate)
    logger.info('[INVOICE DETAIL] Handler temps réel enregistré', {
      handlerKey,
      clientId,
      invoiceId
    })
  } else {
    // Attendre que le realtime soit prêt
    const unwatch = realtimeStore.$subscribe((_mutation, state) => {
      if (state.initialized) {
        // S'abonner aux canaux dashboard
        realtimeStore.subscribeToDashboardEvents(clientId).then(() => {
          // Enregistrer le handler pour cette page de détail
          realtimeStore.registerDashboardHandler(handlerKey, handleInvoiceUpdate)
          logger.info('[INVOICE DETAIL] Handler temps réel enregistré (après initialisation)', {
            handlerKey,
            clientId,
            invoiceId
          })
        })
        unwatch()
      }
    })
  }
}

// Nettoyer le handler temps réel
const cleanupRealtime = () => {
  const invoiceId = parseInt(route.params.id as string)
  if (invoiceId) {
    const handlerKey = `invoice-detail-${invoiceId}`
    realtimeStore.unregisterDashboardHandler(handlerKey)
    logger.info('[INVOICE DETAIL] Handler temps réel supprimé', { handlerKey, invoiceId })
  }
}

// Lifecycle
onMounted(async () => {
  await loadInvoice()
  await initRealtime()
})

onUnmounted(() => {
  cleanupRealtime()
})
</script>

<style scoped>
@import '@/assets/css/pages/invoice-detail.css';
</style>
