&lt;script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import { useBillingStore } from '@/stores/billing'
import { useClientStore } from '@/stores/clients'

const { t } = useI18n()
const billingStore = useBillingStore()
const clientStore = useClientStore()

// État
const invoices = ref([])
const payments = ref([])
const loading = ref(true)
const showInvoiceModal = ref(false)
const selectedInvoice = ref(null)
const activeTab = ref('invoices')
const dateRange = ref({ start: null, end: null })

// Colonnes des factures
const invoiceColumns = [
  { 
    key: 'number', 
    label: t('billing.columns.number'),
    sortable: true 
  },
  { 
    key: 'client', 
    label: t('billing.columns.client'),
    sortable: true,
    formatter: (value) => value.name
  },
  { 
    key: 'amount', 
    label: t('billing.columns.amount'),
    sortable: true,
    formatter: (value) => `${value.toFixed(2)} €`
  },
  { 
    key: 'date', 
    label: t('billing.columns.date'),
    sortable: true,
    formatter: (value) => new Date(value).toLocaleDateString()
  },
  { 
    key: 'dueDate', 
    label: t('billing.columns.dueDate'),
    sortable: true,
    formatter: (value) => new Date(value).toLocaleDateString()
  },
  { 
    key: 'status', 
    label: t('billing.columns.status'),
    sortable: true,
    formatter: (value) => {
      const statuses = {
        paid: t('billing.status.paid'),
        pending: t('billing.status.pending'),
        overdue: t('billing.status.overdue'),
        cancelled: t('billing.status.cancelled')
      }
      return statuses[value] || value
    }
  }
]

// Colonnes des paiements
const paymentColumns = [
  { 
    key: 'reference', 
    label: t('billing.columns.reference'),
    sortable: true 
  },
  { 
    key: 'invoice', 
    label: t('billing.columns.invoice'),
    sortable: true,
    formatter: (value) => value.number
  },
  { 
    key: 'amount', 
    label: t('billing.columns.amount'),
    sortable: true,
    formatter: (value) => `${value.toFixed(2)} €`
  },
  { 
    key: 'method', 
    label: t('billing.columns.method'),
    sortable: true,
    formatter: (value) => {
      const methods = {
        card: t('billing.method.card'),
        transfer: t('billing.method.transfer'),
        paypal: t('billing.method.paypal')
      }
      return methods[value] || value
    }
  },
  { 
    key: 'date', 
    label: t('billing.columns.date'),
    sortable: true,
    formatter: (value) => new Date(value).toLocaleDateString()
  },
  { 
    key: 'status', 
    label: t('billing.columns.status'),
    sortable: true,
    formatter: (value) => {
      const statuses = {
        completed: t('billing.status.completed'),
        pending: t('billing.status.pending'),
        failed: t('billing.status.failed'),
        refunded: t('billing.status.refunded')
      }
      return statuses[value] || value
    }
  }
]

// Statistiques calculées
const statistics = computed(() => ({
  totalInvoices: invoices.value.length,
  totalAmount: invoices.value.reduce((sum, inv) => sum + inv.amount, 0),
  paidInvoices: invoices.value.filter(inv => inv.status === 'paid').length,
  overdueInvoices: invoices.value.filter(inv => inv.status === 'overdue').length,
  pendingAmount: invoices.value
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0)
}))

// Méthodes
const fetchData = async () => {
  try {
    loading.value = true
    const [invoicesData, paymentsData] = await Promise.all([
      billingStore.fetchInvoices(dateRange.value),
      billingStore.fetchPayments(dateRange.value)
    ])
    invoices.value = invoicesData
    payments.value = paymentsData
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  } finally {
    loading.value = false
  }
}

const handleCreateInvoice = () => {
  selectedInvoice.value = {
    items: [],
    status: 'draft',
    date: new Date().toISOString().split('T')[0]
  }
  showInvoiceModal.value = true
}

const handleSaveInvoice = async (invoice) => {
  try {
    loading.value = true
    if (invoice.id) {
      await billingStore.updateInvoice(invoice)
    } else {
      await billingStore.createInvoice(invoice)
    }
    showInvoiceModal.value = false
    await fetchData()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la facture:', error)
  } finally {
    loading.value = false
  }
}

const handleDateRangeChange = () => {
  fetchData()
}

// Cycle de vie
onMounted(() => {
  fetchData()
  clientStore.fetchClients() // Pour le sélecteur de clients
})
&lt;/script>

&lt;template>
  &lt;div class="billing-view">
    &lt;div class="page-header">
      &lt;h1>{{ t('billing.title') }}&lt;/h1>
      &lt;button class="btn btn-primary" @click="handleCreateInvoice">
        &lt;i class="fas fa-plus" />
        {{ t('billing.createInvoice') }}
      &lt;/button>
    &lt;/div>

    &lt;div class="statistics-cards">
      &lt;div class="stat-card">
        &lt;div class="stat-icon">
          &lt;i class="fas fa-file-invoice" />
        &lt;/div>
        &lt;div class="stat-content">
          &lt;div class="stat-value">{{ statistics.totalInvoices }}&lt;/div>
          &lt;div class="stat-label">{{ t('billing.stats.totalInvoices') }}&lt;/div>
        &lt;/div>
      &lt;/div>

      &lt;div class="stat-card">
        &lt;div class="stat-icon">
          &lt;i class="fas fa-euro-sign" />
        &lt;/div>
        &lt;div class="stat-content">
          &lt;div class="stat-value">{{ statistics.totalAmount.toFixed(2) }} €&lt;/div>
          &lt;div class="stat-label">{{ t('billing.stats.totalAmount') }}&lt;/div>
        &lt;/div>
      &lt;/div>

      &lt;div class="stat-card">
        &lt;div class="stat-icon">
          &lt;i class="fas fa-check-circle" />
        &lt;/div>
        &lt;div class="stat-content">
          &lt;div class="stat-value">{{ statistics.paidInvoices }}&lt;/div>
          &lt;div class="stat-label">{{ t('billing.stats.paidInvoices') }}&lt;/div>
        &lt;/div>
      &lt;/div>

      &lt;div class="stat-card warning">
        &lt;div class="stat-icon">
          &lt;i class="fas fa-exclamation-circle" />
        &lt;/div>
        &lt;div class="stat-content">
          &lt;div class="stat-value">{{ statistics.overdueInvoices }}&lt;/div>
          &lt;div class="stat-label">{{ t('billing.stats.overdueInvoices') }}&lt;/div>
        &lt;/div>
      &lt;/div>
    &lt;/div>

    &lt;div class="filters">
      &lt;div class="date-range">
        &lt;input 
          type="date" 
          v-model="dateRange.start"
          class="form-control"
          @change="handleDateRangeChange"
        />
        &lt;span>-&lt;/span>
        &lt;input 
          type="date" 
          v-model="dateRange.end"
          class="form-control"
          @change="handleDateRangeChange"
        />
      &lt;/div>

      &lt;div class="tabs">
        &lt;button 
          class="tab-btn"
          :class="{ active: activeTab === 'invoices' }"
          @click="activeTab = 'invoices'"
        >
          {{ t('billing.tabs.invoices') }}
        &lt;/button>
        &lt;button 
          class="tab-btn"
          :class="{ active: activeTab === 'payments' }"
          @click="activeTab = 'payments'"
        >
          {{ t('billing.tabs.payments') }}
        &lt;/button>
      &lt;/div>

      &lt;div class="search-bar">
        &lt;input 
          type="text" 
          :placeholder="t('billing.search')"
          v-model="searchQuery"
        />
        &lt;i class="fas fa-search" />
      &lt;/div>
    &lt;/div>

    &lt;DataTable
      v-if="activeTab === 'invoices'"
      :columns="invoiceColumns"
      :data="invoices"
      :loading="loading"
      @select-row="invoice => { selectedInvoice = invoice; showInvoiceModal = true }"
    />

    &lt;DataTable
      v-else
      :columns="paymentColumns"
      :data="payments"
      :loading="loading"
    />

    &lt;Modal
      v-if="selectedInvoice"
      :show="showInvoiceModal"
      :title="selectedInvoice.id ? t('billing.editInvoice') : t('billing.newInvoice')"
      size="xl"
      @close="showInvoiceModal = false"
    >
      &lt;form @submit.prevent="handleSaveInvoice(selectedInvoice)">
        &lt;div class="form-row">
          &lt;div class="form-group">
            &lt;label class="form-label">{{ t('billing.fields.client') }}&lt;/label>
            &lt;select 
              class="form-control"
              v-model="selectedInvoice.clientId"
              required
            >
              &lt;option 
                v-for="client in clientStore.clients" 
                :key="client.id"
                :value="client.id"
              >
                {{ client.name }}
              &lt;/option>
            &lt;/select>
          &lt;/div>

          &lt;div class="form-group">
            &lt;label class="form-label">{{ t('billing.fields.date') }}&lt;/label>
            &lt;input 
              type="date" 
              class="form-control"
              v-model="selectedInvoice.date"
              required
            />
          &lt;/div>

          &lt;div class="form-group">
            &lt;label class="form-label">{{ t('billing.fields.dueDate') }}&lt;/label>
            &lt;input 
              type="date" 
              class="form-control"
              v-model="selectedInvoice.dueDate"
              required
            />
          &lt;/div>
        &lt;/div>

        &lt;div class="invoice-items">
          &lt;h4>{{ t('billing.items.title') }}&lt;/h4>
          
          &lt;div class="invoice-item-header">
            &lt;div class="item-description">{{ t('billing.items.description') }}&lt;/div>
            &lt;div class="item-quantity">{{ t('billing.items.quantity') }}&lt;/div>
            &lt;div class="item-price">{{ t('billing.items.price') }}&lt;/div>
            &lt;div class="item-total">{{ t('billing.items.total') }}&lt;/div>
            &lt;div class="item-actions">&lt;/div>
          &lt;/div>

          &lt;div 
            v-for="(item, index) in selectedInvoice.items" 
            :key="index"
            class="invoice-item"
          >
            &lt;input 
              type="text" 
              class="form-control item-description"
              v-model="item.description"
              required
            />
            &lt;input 
              type="number" 
              class="form-control item-quantity"
              v-model="item.quantity"
              min="1"
              required
            />
            &lt;input 
              type="number" 
              class="form-control item-price"
              v-model="item.price"
              step="0.01"
              required
            />
            &lt;div class="item-total">
              {{ (item.quantity * item.price).toFixed(2) }} €
            &lt;/div>
            &lt;button 
              type="button"
              class="btn btn-danger btn-sm"
              @click="selectedInvoice.items.splice(index, 1)"
            >
              &lt;i class="fas fa-trash" />
            &lt;/button>
          &lt;/div>

          &lt;button 
            type="button"
            class="btn btn-outline btn-sm mt-2"
            @click="selectedInvoice.items.push({ description: '', quantity: 1, price: 0 })"
          >
            &lt;i class="fas fa-plus" />
            {{ t('billing.items.add') }}
          &lt;/button>
        &lt;/div>

        &lt;div class="invoice-summary">
          &lt;div class="summary-row">
            &lt;span>{{ t('billing.summary.subtotal') }}&lt;/span>
            &lt;span>{{ selectedInvoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2) }} €&lt;/span>
          &lt;/div>
          &lt;div class="summary-row">
            &lt;span>{{ t('billing.summary.tax') }} (20%)&lt;/span>
            &lt;span>{{ (selectedInvoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0) * 0.2).toFixed(2) }} €&lt;/span>
          &lt;/div>
          &lt;div class="summary-row total">
            &lt;span>{{ t('billing.summary.total') }}&lt;/span>
            &lt;span>{{ (selectedInvoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0) * 1.2).toFixed(2) }} €&lt;/span>
          &lt;/div>
        &lt;/div>
      &lt;/form>

      &lt;template #footer>
        &lt;button 
          class="btn btn-secondary" 
          @click="showInvoiceModal = false"
        >
          {{ t('common.cancel') }}
        &lt;/button>
        &lt;button 
          class="btn btn-primary"
          @click="handleSaveInvoice(selectedInvoice)"
          :disabled="loading"
        >
          {{ t('common.save') }}
        &lt;/button>
      &lt;/template>
    &lt;/Modal>
  &lt;/div>
&lt;/template>

&lt;style scoped>
.billing-view {
  padding: 2rem;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.stat-card.warning {
  border-color: var(--warning);
  background: var(--warning-light);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  color: var(--primary-blue);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
}

.tab-btn.active {
  background: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}

.invoice-items {
  margin: 2rem 0;
}

.invoice-item-header {
  display: grid;
  grid-template-columns: 2fr 100px 150px 150px 50px;
  gap: 1rem;
  padding: 0.5rem 0;
  font-weight: 500;
  color: var(--text-secondary);
}

.invoice-item {
  display: grid;
  grid-template-columns: 2fr 100px 150px 150px 50px;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0;
}

.invoice-summary {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: var(--text-secondary);
}

.summary-row.total {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .billing-view {
    padding: 1rem;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .invoice-item-header,
  .invoice-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .item-actions {
    justify-self: start;
  }
}
&lt;/style>
