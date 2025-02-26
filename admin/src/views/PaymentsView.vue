<template>
  <div class="payments-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ $t('payments.title') }}</h1>
        <span class="page-description">{{ $t('payments.description') }}</span>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i> {{ $t('payments.actions.add') }}
      </button>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ $t('payments.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="filter-input" 
              :placeholder="$t('payments.search.placeholder')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('payments.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-money-bill-wave"></i>
            <select v-model="currentStatusFilter" class="filter-input">
              <option v-for="status in statusFilters" :key="status.value" :value="status.value">
                {{ status.label }} ({{ getFilteredPaymentsCount(status.value) }})
              </option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('payments.filters.payment_method') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-credit-card"></i>
            <select v-model="paymentMethodFilter" class="filter-input">
              <option value="">{{ $t('payments.filters.all_methods') }}</option>
              <option value="card">{{ $t('payments.methods.card') }}</option>
              <option value="bank_transfer">{{ $t('payments.methods.bank_transfer') }}</option>
              <option value="paypal">{{ $t('payments.methods.paypal') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">&nbsp;</label>
          <div class="filter-input-wrapper">
            <button @click="applyFilters" class="btn btn-gradient filter-button">
              <i class="fas fa-filter"></i>
              {{ $t('payments.filters.apply') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-box">
      <table v-if="!loading && filteredPayments.length > 0" class="payments-table">
        <thead>
          <tr>
            <th>{{ $t('payments.table.id') }}</th>
            <th>{{ $t('payments.table.client') }}</th>
            <th>{{ $t('payments.table.invoice') }}</th>
            <th>{{ $t('payments.table.date') }}</th>
            <th>{{ $t('payments.table.amount') }}</th>
            <th>{{ $t('payments.table.method') }}</th>
            <th>{{ $t('payments.table.status') }}</th>
            <th>{{ $t('payments.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in filteredPayments" :key="payment.id">
            <td>{{ payment.id }}</td>
            <td>{{ payment.client_name }}</td>
            <td>{{ payment.invoice_id }}</td>
            <td>{{ formatDate(payment.date) }}</td>
            <td>{{ formatPrice(payment.amount) }}</td>
            <td>{{ getPaymentMethodName(payment.method) }}</td>
            <td>
              <span :class="['status-badge', payment.status]">
                {{ getStatusName(payment.status) }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="action-btn view-btn" @click="openViewModal(payment.id)" title="Voir">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn edit-btn" @click="openEditModal(payment.id)" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
              <button 
                v-if="payment.status === 'completed'" 
                class="action-btn refund-btn" 
                @click="openRefundModal(payment.id)" 
                title="Rembourser"
              >
                <i class="fas fa-undo"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>{{ $t('common.loading') }}</p>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-money-bill-wave empty-icon"></i>
        <h3>{{ $t('payments.empty.title') }}</h3>
        <p>{{ $t('payments.empty.message') }}</p>
        <button class="btn btn-primary" @click="openCreateModal">
          {{ $t('payments.actions.add') }}
        </button>
      </div>
    </div>

    <!-- Teleport pour le modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box">
        <PaymentModal 
          :payment-id="selectedPaymentId" 
          :mode="modalMode"
          @close="closeModal"
          @created="handleCreated"
          @updated="handleUpdated"
          @refunded="handleRefunded"
          @edit="openEditModal"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePaymentStore } from '@/stores/payments'
import PaymentModal from '@/components/payments/PaymentModal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Store
const paymentStore = usePaymentStore()

// State
const showModal = ref(false)
const modalMode = ref('create') // 'create', 'edit', 'view', 'refund'
const selectedPaymentId = ref<number | null>(null)
const currentStatusFilter = ref('all')
const searchQuery = ref('')
const paymentMethodFilter = ref('')

// Computed
const loading = computed(() => paymentStore.loading)

const statusFilters = computed(() => [
  { value: 'all', label: t('payments.filters.all') },
  { value: 'completed', label: t('payments.filters.completed') },
  { value: 'pending', label: t('payments.filters.pending') },
  { value: 'refunded', label: t('payments.filters.refunded') },
  { value: 'failed', label: t('payments.filters.failed') }
])

const filteredPayments = computed(() => {
  let result = paymentStore.payments

  // Filtrer par statut
  if (currentStatusFilter.value !== 'all') {
    result = result.filter(pay => pay.status === currentStatusFilter.value)
  }

  // Filtrer par méthode de paiement
  if (paymentMethodFilter.value) {
    result = result.filter(pay => pay.method === paymentMethodFilter.value)
  }

  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(pay => 
      String(pay.id).includes(query) ||
      (pay.client_name && pay.client_name.toLowerCase().includes(query)) ||
      String(pay.invoice_id).includes(query)
    )
  }

  return result
})

// Methods
const getFilteredPaymentsCount = (status: string) => {
  if (status === 'all') return paymentStore.payments.length
  return paymentStore.payments.filter(pay => pay.status === status).length
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

const getPaymentMethodName = (method: string) => {
  const methods: Record<string, string> = {
    'card': t('payments.methods.card'),
    'bank_transfer': t('payments.methods.bankTransfer'),
    'paypal': t('payments.methods.paypal'),
    'cash': t('payments.methods.cash')
  }
  return methods[method] || method
}

const getStatusName = (status: string) => {
  const statuses: Record<string, string> = {
    'completed': t('payments.statuses.completed'),
    'pending': t('payments.statuses.pending'),
    'refunded': t('payments.statuses.refunded'),
    'failed': t('payments.statuses.failed')
  }
  return statuses[status] || status
}

const openCreateModal = () => {
  selectedPaymentId.value = null
  modalMode.value = 'create'
  showModal.value = true
}

const openEditModal = (id: number) => {
  selectedPaymentId.value = id
  modalMode.value = 'edit'
  showModal.value = true
}

const openViewModal = (id: number) => {
  selectedPaymentId.value = id
  modalMode.value = 'view'
  showModal.value = true
}

const openRefundModal = (id: number) => {
  selectedPaymentId.value = id
  modalMode.value = 'refund'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleCreated = () => {
  paymentStore.fetchPayments()
}

const handleUpdated = () => {
  paymentStore.fetchPayments()
}

const handleRefunded = () => {
  paymentStore.fetchPayments()
}

const applyFilters = () => {
  // TODO: implémenter la logique de filtrage
}

// Lifecycle
onMounted(async () => {
  console.log('PaymentsView - Chargement des données')
  await paymentStore.fetchPayments()
})
</script>

<style>
@import '@/assets/css/pages/payments.css';
@import '@/assets/css/components/common-layout.css';
</style>
