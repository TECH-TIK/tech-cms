<template>
  <div class="invoices-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ $t('invoices.title') }}</h1>
        <span class="page-description">{{ $t('invoices.description') }}</span>
      </div>
      <router-link to="/invoices/create" class="btn btn-gradient">
        <i class="fas fa-plus"></i>
        {{ $t('invoices.actions.add') }}
      </router-link>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ $t('invoices.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="filter-input" 
              :placeholder="$t('invoices.search.placeholder')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('invoices.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-file-invoice-dollar"></i>
            <select v-model="statusFilter" class="filter-input">
              <option value="">{{ $t('invoices.status.all') }}</option>
              <option value="paid">{{ $t('invoices.status.paid') }}</option>
              <option value="unpaid">{{ $t('invoices.status.unpaid') }}</option>
              <option value="overdue">{{ $t('invoices.status.overdue') }}</option>
              <option value="cancelled">{{ $t('invoices.status.cancelled') }}</option>
            </select>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ $t('invoices.filters.date_range') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-calendar"></i>
            <select v-model="dateFilter" class="filter-input">
              <option value="">{{ $t('invoices.filters.all_time') }}</option>
              <option value="this_month">{{ $t('invoices.filters.this_month') }}</option>
              <option value="last_month">{{ $t('invoices.filters.last_month') }}</option>
              <option value="this_year">{{ $t('invoices.filters.this_year') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des factures -->
    <div v-if="invoiceStore.loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="filteredInvoices.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-file-invoice-dollar"></i>
      </div>
      <h3 class="empty-title">{{ t('invoices.empty.title') }}</h3>
      <p class="empty-description">{{ t('invoices.empty.description') }}</p>
    </div>

    <div v-else class="table-box">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('invoices.table.client') }}</th>
            <th>{{ t('invoices.table.service') }}</th>
            <th>{{ t('invoices.table.date') }}</th>
            <th>{{ t('invoices.table.due_date') }}</th>
            <th>{{ t('invoices.table.amount') }}</th>
            <th>{{ t('invoices.table.status') }}</th>
            <th>{{ t('invoices.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in paginatedInvoices" :key="invoice.id" @click="viewInvoiceDetails(invoice.id)">
            <td>#{{ invoice.id }}</td>
            <td>{{ invoice.client_name }}</td>
            <td>{{ invoice.service_name || '-' }}</td>
            <td>{{ formatDate(invoice.date) }}</td>
            <td>{{ invoice.due_date ? formatDate(invoice.due_date) : '-' }}</td>
            <td>{{ formatPrice(invoice.amount) }}</td>
            <td>
              <span :class="`status-badge status-${invoice.status}`">
                {{ getStatusName(invoice.status) }}
              </span>
            </td>
            <td class="actions">
              <div class="action-buttons">
                <button class="btn-icon" :title="t('invoices.actions.view')" @click.stop="viewInvoiceDetails(invoice.id)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" :title="t('invoices.actions.edit')" @click.stop="editInvoice(invoice.id)">
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  v-if="invoice.status !== 'paid'"
                  class="btn-icon"
                  :title="t('invoices.actions.mark_paid')"
                  @click.stop="markAsPaid(invoice.id)"
                >
                  <i class="fas fa-credit-card"></i>
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
import { useInvoiceStore } from '@/stores/invoices'
import logger from '@/services/logger'

const { t } = useI18n()
const router = useRouter()
const invoiceStore = useInvoiceStore()

// État
const searchQuery = ref('')
const statusFilter = ref('')
const dateFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)


// Watched for automatic filtering
watch([searchQuery, statusFilter, dateFilter], () => {
  currentPage.value = 1
})

// Computed
const filteredInvoices = computed(() => {
  let result = [...invoiceStore.invoices].map(inv => ({
    ...inv,
    date: inv.created_at,
    invoice_date: inv.created_at
  }))
  
  // Filtrage par statut
  if (statusFilter.value) {
    result = result.filter(inv => inv.status === statusFilter.value)
  }
  
  // Filtrage par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(inv => 
      inv.client_name?.toLowerCase().includes(query) || 
      inv.product_name?.toLowerCase().includes(query) ||
      inv.id.toString().includes(query)
    )
  }
  
  // Filtrage par période
  if (dateFilter.value === 'current_month') {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    result = result.filter(inv => {
      const invDate = new Date(inv.created_at)
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear
    })
  } else if (dateFilter.value === 'previous_month') {
    const now = new Date()
    let prevMonth = now.getMonth() - 1
    let prevYear = now.getFullYear()
    if (prevMonth < 0) {
      prevMonth = 11
      prevYear--
    }
    result = result.filter(inv => {
      const invDate = new Date(inv.created_at)
      return invDate.getMonth() === prevMonth && invDate.getFullYear() === prevYear
    })
  } else if (dateFilter.value === 'current_year') {
    const thisYear = new Date().getFullYear()
    result = result.filter(inv => new Date(inv.created_at).getFullYear() === thisYear)
  }
  
  // Tri par date (plus récent en premier)
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredInvoices.value.length / itemsPerPage.value)
})

const paginatedInvoices = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredInvoices.value.slice(start, end)
})

// Méthodes
const fetchInvoices = async () => {
  try {
    await invoiceStore.fetchInvoices()
  } catch (error) {
    logger.error('[InvoicesView] Erreur lors du chargement des factures', { error })
  }
}

const changePage = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewInvoiceDetails = (invoiceId: number) => {
  router.push({ name: 'invoice-details', params: { id: invoiceId.toString() } })
}

const editInvoice = (invoiceId: number) => {
  router.push({ name: 'edit-invoice', params: { id: invoiceId.toString() } })
}

const markAsPaid = async (invoiceId: number) => {
  if (confirm(t('invoices.confirm_mark_paid'))) {
    try {
      await invoiceStore.markAsPaid(invoiceId)
      await fetchInvoices()
    } catch (error) {
      logger.error('[InvoicesView] Erreur lors du marquage comme payé', { error })
    }
  }
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

const getStatusName = (status: string) => {
  const statuses: Record<string, string> = {
    'paid': t('invoices.status.paid'),
    'unpaid': t('invoices.status.unpaid'),
    'overdue': t('invoices.status.overdue'),
    'cancelled': t('invoices.status.cancelled')
  }
  return statuses[status] || status
}

// Initialisation du temps réel
const initRealtime = () => {
  logger.info('[INVOICES-VIEW] Initialisation des écouteurs temps réel')
  invoiceStore.initRealtimeListeners()
}

// Observer les événements temps réel
watch(() => invoiceStore.lastRealtimeEvent, (newEvent) => {
  if (!newEvent) return
  
  logger.info('[INVOICES-VIEW] Événement temps réel reçu pour les factures', {
    action: newEvent.action,
    invoice_id: newEvent.invoice?.id
  })
  
  // Les modifications sont déjà prises en compte dans le store
  // La vue réactive mettra automatiquement à jour l'affichage
}, { deep: true })

// Cycle de vie
onMounted(async () => {
  await fetchInvoices()
  initRealtime()
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS */
@import '@/assets/css/pages/invoices.css';
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
