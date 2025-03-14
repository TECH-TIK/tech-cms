<template>
  <div class="invoices-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ $t('invoices.title') }}</h1>
        <span class="page-description">{{ $t('invoices.description') }}</span>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i> {{ $t('invoices.actions.add') }}
      </button>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ $t('invoices.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="filter-input" 
              :placeholder="$t('invoices.search.placeholder')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('invoices.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-file-invoice-dollar"></i>
            <select v-model="currentStatusFilter" class="filter-input">
              <option v-for="status in statusFilters" :key="status.value" :value="status.value">
                {{ status.label }} ({{ getFilteredInvoicesCount(status.value) }})
              </option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('invoices.filters.date_range') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-calendar"></i>
            <select v-model="dateRangeFilter" class="filter-input">
              <option value="all">{{ $t('invoices.filters.all_time') }}</option>
              <option value="this_month">{{ $t('invoices.filters.this_month') }}</option>
              <option value="last_month">{{ $t('invoices.filters.last_month') }}</option>
              <option value="this_year">{{ $t('invoices.filters.this_year') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">&nbsp;</label>
          <div class="filter-input-wrapper">
            <button @click="applyFilters" class="btn btn-gradient filter-button">
              <i class="fas fa-filter"></i>
              {{ $t('invoices.filters.apply') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-box">
      <table v-if="!loading && filteredInvoices.length > 0" class="invoices-table">
        <thead>
          <tr>
            <th>{{ $t('invoices.table.id') }}</th>
            <th>{{ $t('invoices.table.client') }}</th>
            <th>{{ $t('invoices.table.service') }}</th>
            <th>{{ $t('invoices.table.date') }}</th>
            <th>{{ $t('invoices.table.dueDate') }}</th>
            <th>{{ $t('invoices.table.amount') }}</th>
            <th>{{ $t('invoices.table.status') }}</th>
            <th>{{ $t('invoices.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in filteredInvoices" :key="invoice.id">
            <td>{{ invoice.id }}</td>
            <td>{{ invoice.client_name }}</td>
            <td>{{ invoice.service_name }}</td>
            <td>{{ formatDate(invoice.date) }}</td>
            <td>{{ invoice.due_date ? formatDate(invoice.due_date) : '-' }}</td>
            <td>{{ formatPrice(invoice.amount) }}</td>
            <td>
              <span :class="['status-badge', invoice.status]">
                {{ getStatusName(invoice.status) }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="action-btn view-btn" @click="openViewModal(invoice.id)" title="Voir">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn edit-btn" @click="openEditModal(invoice.id)" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
              <button 
                v-if="invoice.status !== 'paid'" 
                class="action-btn pay-btn" 
                @click="handlePay(invoice.id)" 
                title="Payer"
              >
                <i class="fas fa-credit-card"></i>
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
        <i class="fas fa-file-invoice-dollar empty-icon"></i>
        <h3>{{ $t('invoices.empty.title') }}</h3>
        <p>{{ $t('invoices.empty.message') }}</p>
        <button class="btn btn-primary" @click="openCreateModal">
          {{ $t('invoices.actions.add') }}
        </button>
      </div>
    </div>

    <!-- Teleport pour le modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box">
          <InvoiceModal 
            :invoice-id="selectedInvoiceId" 
            :mode="modalMode"
            @close="closeModal"
            @created="handleCreated"
            @updated="handleUpdated"
            @paid="handlePaid"
            @edit="openEditModal"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInvoiceStore } from '@/stores/invoices'
import InvoiceModal from '@/components/invoices/InvoiceModal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Store
const invoiceStore = useInvoiceStore()

// State
const showModal = ref(false)
const modalMode = ref('create') // 'create', 'edit', 'view'
const selectedInvoiceId = ref<number | null>(null)
const currentStatusFilter = ref('all')
const searchQuery = ref('')
const dateRangeFilter = ref('all')

// Computed
const loading = computed(() => invoiceStore.loading)

const statusFilters = computed(() => [
  { value: 'all', label: t('invoices.filters.all') },
  { value: 'paid', label: t('invoices.filters.paid') },
  { value: 'unpaid', label: t('invoices.filters.unpaid') },
  { value: 'overdue', label: t('invoices.filters.overdue') },
  { value: 'cancelled', label: t('invoices.filters.cancelled') }
])

const filteredInvoices = computed(() => {
  let result = invoiceStore.invoices

  // Filtrer par statut
  if (currentStatusFilter.value !== 'all') {
    result = result.filter(inv => inv.status === currentStatusFilter.value)
  }

  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(inv => 
      String(inv.id).includes(query) ||
      (inv.client_name && inv.client_name.toLowerCase().includes(query)) ||
      (inv.service_name && inv.service_name.toLowerCase().includes(query))
    )
  }

  // Filtrer par date
  if (dateRangeFilter.value !== 'all') {
    const today = new Date()
    const thisMonth = today.getMonth()
    const thisYear = today.getFullYear()
    const lastMonth = thisMonth - 1
    const lastYear = thisYear - 1

    switch (dateRangeFilter.value) {
      case 'this_month':
        result = result.filter(inv => new Date(inv.date).getMonth() === thisMonth && new Date(inv.date).getFullYear() === thisYear)
        break
      case 'last_month':
        result = result.filter(inv => new Date(inv.date).getMonth() === lastMonth && new Date(inv.date).getFullYear() === thisYear)
        break
      case 'this_year':
        result = result.filter(inv => new Date(inv.date).getFullYear() === thisYear)
        break
    }
  }

  return result
})

// Methods
const getFilteredInvoicesCount = (status: string) => {
  if (status === 'all') return invoiceStore.invoices.length
  return invoiceStore.invoices.filter(inv => inv.status === status).length
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

const getStatusName = (status: string) => {
  const statuses: Record<string, string> = {
    'paid': t('invoices.statuses.paid'),
    'unpaid': t('invoices.statuses.unpaid'),
    'overdue': t('invoices.statuses.overdue'),
    'cancelled': t('invoices.statuses.cancelled')
  }
  return statuses[status] || status
}

const openCreateModal = () => {
  selectedInvoiceId.value = null
  modalMode.value = 'create'
  showModal.value = true
}

const openEditModal = (id: number) => {
  selectedInvoiceId.value = id
  modalMode.value = 'edit'
  showModal.value = true
}

const openViewModal = (id: number) => {
  selectedInvoiceId.value = id
  modalMode.value = 'view'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleCreated = () => {
  invoiceStore.fetchInvoices()
}

const handleUpdated = () => {
  invoiceStore.fetchInvoices()
}

const handlePaid = () => {
  invoiceStore.fetchInvoices()
}

const handlePay = async (id: number) => {
  selectedInvoiceId.value = id
  modalMode.value = 'pay'
  showModal.value = true
}

const applyFilters = () => {
  // TODO: implémenter la logique de filtrage
}

// Lifecycle
onMounted(async () => {
  console.log('InvoicesView - Chargement des données')
  await invoiceStore.fetchInvoices()
})
</script>

<style>
@import '@/assets/css/pages/invoices.css';
@import '@/assets/css/components/common-layout.css';
</style>
