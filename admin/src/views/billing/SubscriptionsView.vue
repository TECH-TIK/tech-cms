<template>
  <div class="subscriptions-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ $t('subscriptions.title') }}</h1>
        <span class="page-description">{{ $t('subscriptions.description') }}</span>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i> {{ $t('subscriptions.actions.add') }}
      </button>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ $t('subscriptions.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="filter-input" 
              :placeholder="$t('subscriptions.search.placeholder')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('subscriptions.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-sync-alt"></i>
            <select v-model="currentStatusFilter" class="filter-input">
              <option v-for="status in statusFilters" :key="status.value" :value="status.value">
                {{ status.label }} ({{ getFilteredSubscriptionsCount(status.value) }})
              </option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('subscriptions.filters.billing_cycle') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-calendar-alt"></i>
            <select v-model="billingCycleFilter" class="filter-input">
              <option value="">{{ $t('subscriptions.filters.all_cycles') }}</option>
              <option value="monthly">{{ $t('subscriptions.billingCycles.monthly') }}</option>
              <option value="quarterly">{{ $t('subscriptions.billingCycles.quarterly') }}</option>
              <option value="semi_annual">{{ $t('subscriptions.billingCycles.semiAnnual') }}</option>
              <option value="annual">{{ $t('subscriptions.billingCycles.annual') }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">&nbsp;</label>
          <div class="filter-input-wrapper">
            <button @click="applyFilters" class="btn btn-gradient filter-button">
              <i class="fas fa-filter"></i>
              {{ $t('subscriptions.filters.apply') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-box">
      <table v-if="!loading && filteredSubscriptions.length > 0" class="subscriptions-table">
        <thead>
          <tr>
            <th>{{ $t('subscriptions.table.id') }}</th>
            <th>{{ $t('subscriptions.table.client') }}</th>
            <th>{{ $t('subscriptions.table.product') }}</th>
            <th>{{ $t('subscriptions.table.startDate') }}</th>
            <th>{{ $t('subscriptions.table.renewalDate') }}</th>
            <th>{{ $t('subscriptions.table.price') }}</th>
            <th>{{ $t('subscriptions.table.billingCycle') }}</th>
            <th>{{ $t('subscriptions.table.status') }}</th>
            <th>{{ $t('subscriptions.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subscription in filteredSubscriptions" :key="subscription.id">
            <td>{{ subscription.id }}</td>
            <td>{{ subscription.client_name }}</td>
            <td>{{ subscription.product_name }}</td>
            <td>{{ formatDate(subscription.start_date) }}</td>
            <td>{{ subscription.renewal_date ? formatDate(subscription.renewal_date) : '-' }}</td>
            <td>{{ formatPrice(subscription.price) }}</td>
            <td>{{ getBillingCycleName(subscription.billing_cycle) }}</td>
            <td>
              <span :class="['status-badge', subscription.status]">
                {{ getStatusName(subscription.status) }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="action-btn view-btn" @click="openViewModal(subscription.id)" title="Voir">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn edit-btn" @click="openEditModal(subscription.id)" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
              <button 
                v-if="subscription.status === 'active'" 
                class="action-btn cancel-btn" 
                @click="openCancelModal(subscription.id)" 
                title="Annuler"
              >
                <i class="fas fa-ban"></i>
              </button>
              <button 
                v-if="subscription.status !== 'active'" 
                class="action-btn renew-btn" 
                @click="handleRenew(subscription.id)" 
                title="Renouveler"
              >
                <i class="fas fa-sync"></i>
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
        <i class="fas fa-calendar-alt empty-icon"></i>
        <h3>{{ $t('subscriptions.empty.title') }}</h3>
        <p>{{ $t('subscriptions.empty.message') }}</p>
        <button class="btn btn-primary" @click="openCreateModal">
          {{ $t('subscriptions.actions.add') }}
        </button>
      </div>
    </div>

    <!-- Teleport pour le modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box">
        <SubscriptionModal 
          :subscription-id="selectedSubscriptionId" 
          :mode="modalMode"
          @close="closeModal"
          @created="handleCreated"
          @updated="handleUpdated"
          @cancelled="handleCancelled"
          @renewed="handleRenewed"
          @edit="openEditModal"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSubscriptionStore } from '@/stores/subscriptions'
import SubscriptionModal from '@/components/subscriptions/SubscriptionModal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Store
const subscriptionStore = useSubscriptionStore()

// State
const showModal = ref(false)
const modalMode = ref('create') // 'create', 'edit', 'view'
const selectedSubscriptionId = ref<number | null>(null)
const currentStatusFilter = ref('all')
const searchQuery = ref('')
const billingCycleFilter = ref('')

// Computed
const loading = computed(() => subscriptionStore.loading)

const statusFilters = computed(() => [
  { value: 'all', label: t('subscriptions.filters.all') },
  { value: 'active', label: t('subscriptions.filters.active') },
  { value: 'pending', label: t('subscriptions.filters.pending') },
  { value: 'cancelled', label: t('subscriptions.filters.cancelled') },
  { value: 'expired', label: t('subscriptions.filters.expired') }
])

const filteredSubscriptions = computed(() => {
  let result = subscriptionStore.subscriptions

  // Filtrer par statut
  if (currentStatusFilter.value !== 'all') {
    result = result.filter(sub => sub.status === currentStatusFilter.value)
  }

  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(sub => 
      String(sub.id).includes(query) ||
      (sub.client_name && sub.client_name.toLowerCase().includes(query)) ||
      (sub.product_name && sub.product_name.toLowerCase().includes(query))
    )
  }

  // Filtrer par cycle de facturation
  if (billingCycleFilter.value) {
    result = result.filter(sub => sub.billing_cycle === billingCycleFilter.value)
  }

  return result
})

// Methods
const getFilteredSubscriptionsCount = (status: string) => {
  if (status === 'all') return subscriptionStore.subscriptions.length
  return subscriptionStore.subscriptions.filter(sub => sub.status === status).length
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

const getBillingCycleName = (cycle: string) => {
  const cycles: Record<string, string> = {
    'monthly': t('subscriptions.billingCycles.monthly'),
    'quarterly': t('subscriptions.billingCycles.quarterly'),
    'semi_annual': t('subscriptions.billingCycles.semiAnnual'),
    'annual': t('subscriptions.billingCycles.annual')
  }
  return cycles[cycle] || cycle
}

const getStatusName = (status: string) => {
  const statuses: Record<string, string> = {
    'active': t('subscriptions.statuses.active'),
    'pending': t('subscriptions.statuses.pending'),
    'cancelled': t('subscriptions.statuses.cancelled'),
    'expired': t('subscriptions.statuses.expired')
  }
  return statuses[status] || status
}

const openCreateModal = () => {
  selectedSubscriptionId.value = null
  modalMode.value = 'create'
  showModal.value = true
}

const openEditModal = (id: number) => {
  selectedSubscriptionId.value = id
  modalMode.value = 'edit'
  showModal.value = true
}

const openViewModal = (id: number) => {
  selectedSubscriptionId.value = id
  modalMode.value = 'view'
  showModal.value = true
}

const openCancelModal = (id: number) => {
  selectedSubscriptionId.value = id
  modalMode.value = 'view'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleCreated = () => {
  subscriptionStore.fetchSubscriptions()
}

const handleUpdated = () => {
  subscriptionStore.fetchSubscriptions()
}

const handleCancelled = () => {
  subscriptionStore.fetchSubscriptions()
}

const handleRenew = async (id: number) => {
  await subscriptionStore.renewSubscription(id)
  subscriptionStore.fetchSubscriptions()
}

const handleRenewed = () => {
  subscriptionStore.fetchSubscriptions()
}

const applyFilters = () => {
  // TODO: implémenter la logique de filtrage
}

// Lifecycle
onMounted(async () => {
  await subscriptionStore.fetchSubscriptions()
})
</script>

<style>
@import '@/assets/css/pages/subscriptions.css';
@import '@/assets/css/components/common-layout.css';
</style>
