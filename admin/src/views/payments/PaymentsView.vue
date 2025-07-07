<template>
  <div class="payments-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ $t('payments.title') }}</h1>
        <span class="page-description">{{ $t('payments.description') }}</span>
      </div>
      <router-link to="/payments/create" class="btn btn-gradient">
        <i class="fas fa-plus"></i>
        {{ $t('payments.actions.add') }}
      </router-link>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ $t('payments.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="filter-input" 
              :placeholder="$t('payments.search.placeholder')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('payments.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-credit-card"></i>
            <select v-model="statusFilter" class="filter-input">
              <option value="">{{ $t('payments.status.all') }}</option>
              <option value="completed">{{ $t('payments.status.completed') }}</option>
              <option value="pending">{{ $t('payments.status.pending') }}</option>
              <option value="failed">{{ $t('payments.status.failed') }}</option>
              <option value="refunded">{{ $t('payments.status.refunded') }}</option>
            </select>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ $t('payments.filters.method') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-money-bill-wave"></i>
            <select v-model="methodFilter" class="filter-input">
              <option value="">{{ $t('payments.methods.all') }}</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">{{ $t('payments.methods.bank_transfer') }}</option>
              <option value="cash">{{ $t('payments.methods.cash') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des paiements -->
    <div v-if="paymentStore.loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="filteredPayments.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-money-bill-wave"></i>
      </div>
      <h3 class="empty-title">{{ t('payments.empty.title') }}</h3>
      <p class="empty-description">{{ t('payments.empty.description') }}</p>
    </div>

    <div v-else class="table-box">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('payments.table.client') }}</th>
            <th>{{ t('payments.table.invoice') }}</th>
            <th>{{ t('payments.table.date') }}</th>
            <th>{{ t('payments.table.amount') }}</th>
            <th>{{ t('payments.table.method') }}</th>
            <th>{{ t('payments.table.status') }}</th>
            <th>{{ t('payments.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in paginatedPayments" :key="payment.id" @click="viewPaymentDetails(payment.id)">
            <td>#{{ payment.id }}</td>
            <td>{{ payment.client_name }}</td>
            <td>#{{ payment.invoice_id }}</td>
            <td>{{ formatDate(payment.payment_date) }}</td>
            <td>{{ formatPrice(payment.amount) }}</td>
            <td>{{ getPaymentMethodName(payment.payment_method) }}</td>
            <td>
              <span :class="`status-badge status-${payment.status}`">
                {{ getStatusName(payment.status) }}
              </span>
            </td>
            <td class="actions">
              <div class="action-buttons">
                <button class="btn-icon" :title="t('payments.actions.view')" @click.stop="viewPaymentDetails(payment.id)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" :title="t('payments.actions.edit')" @click.stop="editPayment(payment.id)">
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  v-if="payment.status === 'completed'"
                  class="btn-icon"
                  :title="t('payments.actions.refund')"
                  @click.stop="refundPayment(payment.id)"
                >
                  <i class="fas fa-undo"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
</div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <a
        v-for="page in totalPages"
        :key="page"
        :class="['page-link', { active: page === currentPage }]"
        @click="changePage(page)"
      >
        {{ page }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePaymentStore } from '@/stores/payments'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'
import type { Payment } from '@/types/payment'

const { t } = useI18n()
const router = useRouter()
const paymentStore = usePaymentStore()
const notificationStore = useNotificationStore()

// État
const searchQuery = ref<string>('')
const statusFilter = ref<string>('')
const methodFilter = ref<string>('')

const currentPage = ref<number>(1)
const itemsPerPage = ref<number>(10)

// Watched for automatic filtering
watch([searchQuery, statusFilter, methodFilter], () => {
  currentPage.value = 1
})

// Computed
const filteredPayments = computed<Payment[]>(() => {
  if (!paymentStore.payments.length) return []

  let result: Payment[] = [...paymentStore.payments]

  // Filtrage par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(payment =>
      String(payment.id).includes(query) ||
      (payment.client_name && payment.client_name.toLowerCase().includes(query)) ||
      String(payment.invoice_id).includes(query) ||
      (payment.transaction_id && payment.transaction_id.toLowerCase().includes(query))
    )
  }

  // Filtrage par statut
  if (statusFilter.value) {
    result = result.filter(payment => payment.status === statusFilter.value)
  }
  if (methodFilter.value) {
    result = result.filter(payment => payment.payment_method === methodFilter.value)
  }

  return result
})

const totalItems = computed<number>(() => filteredPayments.value.length)
const totalPages = computed<number>(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedPayments = computed<Payment[]>(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return filteredPayments.value.slice(startIndex, endIndex)
})

// Méthodes
const fetchPayments = async () => {
  try {
    await paymentStore.fetchPayments()
  } catch (error) {
    logger.error('[PaymentsView] Erreur lors du chargement des paiements', { error })
  }
}

const changePage = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewPaymentDetails = (paymentId: number) => {
  router.push({ name: 'payment-details', params: { id: paymentId.toString() } })
}

const editPayment = (paymentId: number) => {
  router.push({ name: 'edit-payment', params: { id: paymentId.toString() } })
}

const refundPayment = async (paymentId: number) => {
  if (confirm(t('payments.confirm_refund'))) {
    try {
      await paymentStore.processRefund(paymentId, '')
      notificationStore.addNotification({
        type: 'success',
        message: t('payments.messages.refund_success'),
        title: t('common.success')
      })
      await fetchPayments()
    } catch (error) {
      logger.error('[PaymentsView] Erreur lors du remboursement', { error })
    }
  }
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
  return date.toLocaleDateString('fr-FR', options)
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

const getPaymentMethodName = (method: string): string => {
  const methods: Record<string, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    bank_transfer: t('payments.methods.bank_transfer'),
    cash: t('payments.methods.cash')
  }
  // Utilisation d'un cast de type pour éviter l'erreur d'indexation avec une chaîne
  return (methods as any)[method] || method
}

const getStatusName = (status: string): string => {
  const statuses: Record<string, string> = {
    completed: t('payments.status.completed'),
    pending: t('payments.status.pending'),
    failed: t('payments.status.failed'),
    refunded: t('payments.status.refunded')
  }
  // Utilisation d'un cast de type pour éviter l'erreur d'indexation avec une chaîne
  return (statuses as any)[status] || status
}

// Initialisation du temps réel
const initRealtime = () => {
  logger.info('[PaymentsView] Initialisation des écouteurs temps réel')
  paymentStore.initRealtimeListeners()
}

// Cycle de vie
onMounted(async () => {
  await fetchPayments()
  initRealtime()
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS */
@import '@/assets/css/pages/payments.css';
@import '@/assets/css/components/common-layout.css';

/* Styles additionnels */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

/* Alignement du texte dans les cellules du tableau */
.data-table th, .data-table td {
  text-align: center;
}

/* Garder l'alignement à gauche pour les colonnes de texte */
.data-table th:nth-child(1),
.data-table th:nth-child(2),
.data-table th:nth-child(3),
.data-table td:nth-child(1),
.data-table td:nth-child(2),
.data-table td:nth-child(3) {
  text-align: left;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
