<template>
  <div id="client-billing">
    <!-- Header Section -->
    <div class="billing-header">
      <h1>
        <i class="fas fa-file-invoice"></i>
        {{ $t('billing.title') }}
      </h1>
      <div class="billing-actions">
        <button class="btn btn-outline btn-sm">
          <i class="fas fa-download"></i>
          {{ $t('common.export') }}
        </button>
        <button class="btn btn-primary btn-sm">
          <i class="fas fa-credit-card"></i>
          {{ $t('billing.pay_unpaid') }}
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="billing-summary">
      <div class="summary-card">
        <div class="summary-icon">
          <i class="fas fa-file-invoice"></i>
        </div>
        <div class="summary-value">{{ totalInvoices }}</div>
        <div class="summary-label">{{ $t('billing.total_invoices') }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="summary-value">{{ unpaidInvoices.length }}</div>
        <div class="summary-label">{{ $t('billing.unpaid_invoices') }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">
          <i class="fas fa-euro-sign"></i>
        </div>
        <div class="summary-value">{{ formatCurrency(totalDue) }}</div>
        <div class="summary-label">{{ $t('billing.amount_due') }}</div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="summary-value">{{ formatCurrency(totalPaid) }}</div>
        <div class="summary-label">{{ $t('billing.total_paid') }}</div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="billing-filters">
      <div class="filter-group">
        <label class="filter-label">{{ $t('common.status') }}</label>
        <select v-model="selectedStatus" class="filter-select" @change="filterInvoices">
          <option value="">{{ $t('billing.all_statuses') }}</option>
          <option value="paid">{{ $t('status.paid') }}</option>
          <option value="unpaid">{{ $t('status.unpaid') }}</option>
          <option value="overdue">{{ $t('status.overdue') }}</option>
          <option value="draft">{{ $t('billing.draft') }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">{{ $t('billing.period') }}</label>
        <select v-model="selectedPeriod" class="filter-select" @change="filterInvoices">
          <option value="">{{ $t('billing.all_periods') }}</option>
          <option value="current-month">{{ $t('billing.current_month') }}</option>
          <option value="last-month">{{ $t('billing.last_month') }}</option>
          <option value="current-year">{{ $t('billing.current_year') }}</option>
          <option value="last-year">{{ $t('billing.last_year') }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">{{ $t('common.search') }}</label>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-select"
          :placeholder="$t('billing.search_placeholder')"
          @input="filterInvoices"
        >
      </div>
    </div>

    <!-- Invoices Table -->
    <div class="invoices-table-container">
      <div class="table-header">
        <h3 class="table-title">
          <i class="fas fa-list"></i>
          Historique des Factures
        </h3>
        <div class="billing-actions">
          <button class="btn btn-outline btn-sm">
            <i class="fas fa-filter"></i>
            Filtres avancés
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement de vos factures...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadInvoices()">
          <i class="fas fa-redo"></i>
          Réessayer
        </button>
      </div>

      <div v-else-if="filteredInvoices.length === 0" class="empty-state">
        <i class="fas fa-file-invoice"></i>
        <h3>Aucune facture trouvée</h3>
        <p>{{ searchQuery || selectedStatus || selectedPeriod ? 'Aucune facture ne correspond à vos critères de recherche.' : 'Vous n\'avez pas encore de factures.' }}</p>
      </div>

      <table v-else class="invoices-table">
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Date</th>
            <th>Description</th>
            <th>Montant</th>
            <th>Statut</th>
            <th>Échéance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in filteredInvoices" :key="invoice.id">
            <td>
              <a href="#" class="invoice-number" @click.prevent="viewInvoice(invoice.id)">
                #{{ invoice.number }}
              </a>
            </td>
            <td>{{ formatDate(invoice.created_at) }}</td>
            <td>{{ invoice.notes || 'Facture #' + invoice.number }}</td>
            <td>
              <span class="invoice-amount" :class="getAmountClass(invoice.status)">
                {{ formatCurrency(invoice.amount) }}
              </span>
            </td>
            <td>
              <span :class="getStatusClass(invoice.status)">
                {{ getStatusLabel(invoice.status) }}
              </span>
            </td>
            <td>{{ formatDate(invoice.due_date) }}</td>
            <td>
              <div class="invoice-actions">
                <button class="btn btn-outline btn-sm" @click="viewInvoice(invoice.id)">
                  <i class="fas fa-eye"></i>
                  Voir
                </button>
                <button class="btn btn-outline btn-sm" @click="downloadInvoice(invoice.id)">
                  <i class="fas fa-download"></i>
                  PDF
                </button>
                <button
                  v-if="invoice.status === 'unpaid'"
                  class="btn btn-success btn-sm"
                  @click="payInvoice(invoice.id)"
                >
                  <i class="fas fa-credit-card"></i>
                  Payer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInvoicesStore } from '@/stores/invoices'
import { useRealtimeStore } from '@/stores/realtime'
import { useAuthStore } from '@/stores/auth'
import logger from '@/services/logger'
import type { Invoice } from '@/types/api'
import { formatDateShort, formatPrice } from '@/utils/dateUtils'

// Router
const router = useRouter()

// Stores
const invoicesStore = useInvoicesStore()
const realtimeStore = useRealtimeStore()
const authStore = useAuthStore()

// État de l'application
const selectedStatus = ref('')
const selectedPeriod = ref('')
const searchQuery = ref('')

// Computed properties depuis le store
const loading = computed(() => invoicesStore.loading)
const error = computed(() => invoicesStore.error)
const invoices = computed(() => invoicesStore.invoices)

// Fonctions pour charger les données
const loadInvoices = async () => {
  try {
    await invoicesStore.fetchInvoices()
    logger.info('[BILLING VIEW] Factures chargées depuis le store', { count: invoices.value.length })
  } catch (err: any) {
    logger.error('[BILLING VIEW] Erreur lors du chargement des factures', { error: err })
  }
}

// Computed properties depuis le store
const totalInvoices = computed(() => invoicesStore.totalInvoices)
const unpaidInvoices = computed(() => invoicesStore.unpaidInvoices)
const totalDue = computed(() => invoicesStore.totalDue)
const totalPaid = computed(() => invoicesStore.totalPaid)

const filteredInvoices = computed(() => {
  let filtered = invoices.value

  if (selectedStatus.value) {
    filtered = filtered.filter(invoice => invoice.status === selectedStatus.value)
  }

  if (selectedPeriod.value) {
    const now = new Date()
    filtered = filtered.filter(invoice => {
      const invoiceDate = new Date(invoice.created_at)
      
      switch (selectedPeriod.value) {
        case 'current-month':
          return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear()
        case 'last-month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
          return invoiceDate.getMonth() === lastMonth.getMonth() && invoiceDate.getFullYear() === lastMonth.getFullYear()
        case 'current-year':
          return invoiceDate.getFullYear() === now.getFullYear()
        case 'last-year':
          return invoiceDate.getFullYear() === now.getFullYear() - 1
        default:
          return true
      }
    })
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(invoice =>
      invoice.number.toLowerCase().includes(query) ||
      (invoice.notes && invoice.notes.toLowerCase().includes(query))
    )
  }

  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

// Méthodes
const filterInvoices = () => {
  // La réactivité de Vue se charge automatiquement du filtrage
}

// Utilisation de la fonction utilitaire pour le formatage des prix
const formatCurrency = (value: number | string | null | undefined): string => {
  return formatPrice(value, false) // false = afficher "0,00 €" au lieu de "Gratuit" pour les factures
}

// Utilisation de la fonction utilitaire pour le formatage des dates
const formatDate = formatDateShort

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    paid: 'status-badge status-paid',
    unpaid: 'status-badge status-unpaid',
    draft: 'status-badge status-draft',
    cancelled: 'status-badge status-cancelled'
  }
  return classes[status] || 'status-badge'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    paid: 'Payée',
    unpaid: 'Impayée',
    draft: 'Brouillon',
    cancelled: 'Annulée'
  }
  return labels[status] || status
}

const getAmountClass = (status: string): string => {
  if (status === 'unpaid') return 'unpaid'
  if (status === 'paid') return 'paid'
  if (status === 'cancelled') return 'cancelled'
  return ''
}

const viewInvoice = (id: number) => {
  router.push(`/billing/invoice/${id}`)
}

const downloadInvoice = (id: number) => {
  logger.info('[BILLING] Téléchargement facture demandé', { invoiceId: id })
  // TODO: Implémenter le téléchargement PDF
}

const payInvoice = (id: number) => {
  logger.info('[BILLING] Paiement facture demandé', { invoiceId: id })
  // TODO: Implémenter le processus de paiement
}

// Chargement des données au montage du composant et gestion temps réel
onMounted(async () => {
  // Charger les factures
  await loadInvoices()

  // Initialiser le temps réel et s'abonner aux événements - SÉCURISÉ
  const clientId = authStore.user?.id

  if (!clientId) {
    logger.error('[BILLING VIEW] ID client manquant - abandon initialisation temps réel', {
      user: authStore.user
    })
    return
  }

  if (realtimeStore.initialized) {
    // S'abonner aux canaux dashboard si pas déjà fait
    await realtimeStore.subscribeToDashboardEvents(clientId)

    // Enregistrer le handler pour cette page
    realtimeStore.registerDashboardHandler('invoice-page', invoicesStore.handleInvoiceUpdate)
    logger.info('[BILLING VIEW] Handler temps réel enregistré avec clé invoice-page', { clientId })
  } else {
    // Attendre que le realtime soit prêt
    const unwatch = realtimeStore.$subscribe((_mutation, state) => {
      if (state.initialized) {
        // S'abonner aux canaux dashboard
        realtimeStore.subscribeToDashboardEvents(clientId).then(() => {
          // Enregistrer le handler pour cette page
          realtimeStore.registerDashboardHandler('invoice-page', invoicesStore.handleInvoiceUpdate)
          logger.info('[BILLING VIEW] Handler temps réel enregistré (après initialisation) avec clé invoice-page', { clientId })
        })
        unwatch()
      }
    })
  }
})

onUnmounted(() => {
  // Nettoyer les handlers temps réel avec clé unique
  realtimeStore.unregisterDashboardHandler('invoice-page')
  logger.info('[BILLING VIEW] Handler temps réel supprimé pour clé invoice-page')
})
</script>

<style scoped>
@import '@/assets/css/pages/billing.css';
</style>
