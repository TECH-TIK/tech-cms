<template>
  <div class="subscriptions-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ $t('subscriptions.title') }}</h1>
        <span class="page-description">{{ $t('subscriptions.description') }}</span>
      </div>
      <router-link to="/subscriptions/create" class="btn btn-gradient">
        <i class="fas fa-plus"></i>
        {{ $t('subscriptions.actions.add') }}
      </router-link>
    </div>

    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ $t('subscriptions.filters.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="filter-input" 
              :placeholder="$t('subscriptions.search.placeholder')"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ $t('subscriptions.filters.status') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-sync-alt"></i>
            <select v-model="statusFilter" class="filter-input">
              <option value="">{{ $t('subscriptions.status.all') }}</option>
              <option value="active">{{ $t('subscriptions.status.active') }}</option>
              <option value="pending">{{ $t('subscriptions.status.pending') }}</option>
              <option value="cancelled">{{ $t('subscriptions.status.cancelled') }}</option>
              <option value="expired">{{ $t('subscriptions.status.expired') }}</option>
            </select>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">{{ $t('subscriptions.filters.billing_cycle') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-calendar-alt"></i>
            <select v-model="cycleFilter" class="filter-input">
              <option value="">{{ $t('subscriptions.filters.all_cycles') }}</option>
              <option value="monthly">{{ $t('subscriptions.cycles.monthly') }}</option>
              <option value="quarterly">{{ $t('subscriptions.cycles.quarterly') }}</option>
              <option value="semi_annual">{{ $t('subscriptions.cycles.semi_annual') }}</option>
              <option value="annual">{{ $t('subscriptions.cycles.annual') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des abonnements -->
    <div v-if="subscriptionStore.loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="filteredSubscriptions.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-calendar-alt"></i>
      </div>
      <h3 class="empty-title">{{ t('subscriptions.empty.title') }}</h3>
      <p class="empty-description">{{ t('subscriptions.empty.description') }}</p>
    </div>

    <div v-else class="table-box">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('subscriptions.table.client') }}</th>
            <th>{{ t('subscriptions.table.product') }}</th>
            <th>{{ t('subscriptions.table.start_date') }}</th>
            <th>{{ t('subscriptions.table.renewal_date') }}</th>
            <th>{{ t('subscriptions.table.price') }}</th>
            <th>{{ t('subscriptions.table.cycle') }}</th>
            <th>{{ t('subscriptions.table.status') }}</th>
            <th>{{ t('subscriptions.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subscription in paginatedSubscriptions" :key="subscription.id || 'new'" @click="subscription.id && viewSubscriptionDetails(subscription.id)">
            <td>#{{ subscription.id }}</td>
            <td>{{ subscription.client_name }}</td>
            <td>{{ subscription.product_name }}</td>
            <td>{{ formatDate(subscription.start_date) }}</td>
            <td>{{ subscription.renewal_date ? formatDate(subscription.renewal_date) : '-' }}</td>
            <td>{{ formatPrice(subscription.price) }}</td>
            <td>{{ getBillingCycleName(subscription.billing_cycle) }}</td>
            <td>
              <span :class="`status-badge status-${subscription.status}`">
                {{ getStatusName(subscription.status) }}
              </span>
            </td>
            <td class="actions">
              <div class="action-buttons">
                <button class="btn-icon" :title="t('subscriptions.actions.view')" @click.stop="subscription.id && viewSubscriptionDetails(subscription.id)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" :title="t('subscriptions.actions.edit')" @click.stop="subscription.id && editSubscription(subscription.id)">
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  v-if="subscription.status === 'active'"
                  class="btn-icon"
                  :title="t('subscriptions.actions.cancel')"
                  @click.stop="subscription.id && cancelSubscription(subscription.id)"
                >
                  <i class="fas fa-ban"></i>
                </button>
                <button
                  v-if="subscription.status !== 'active'"
                  class="btn-icon"
                  :title="t('subscriptions.actions.renew')"
                  @click.stop="subscription.id && renewSubscription(subscription.id)"
                >
                  <i class="fas fa-sync"></i>
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
import { useSubscriptionStore } from '@/stores/subscriptions'
import logger from '@/services/logger'

const { t } = useI18n()
const router = useRouter()
const subscriptionStore = useSubscriptionStore()

// État
const searchQuery = ref('')
const statusFilter = ref('')
const cycleFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
// Watched for automatic filtering
watch([searchQuery, statusFilter, cycleFilter], () => {
  currentPage.value = 1
})

// Computed
const filteredSubscriptions = computed(() => {
  if (!subscriptionStore.subscriptions.length) return []

  let result = [...subscriptionStore.subscriptions]

  // Filtrage par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(subscription =>
      String(subscription.id).includes(query) ||
      (subscription.client_name && subscription.client_name.toLowerCase().includes(query)) ||
      (subscription.product_name && subscription.product_name.toLowerCase().includes(query))
    )
  }

  // Filtrage par statut
  if (statusFilter.value) {
    result = result.filter(subscription => subscription.status === statusFilter.value)
  }

  // Filtrage par cycle
  if (cycleFilter.value) {
    result = result.filter(subscription => subscription.billing_cycle === cycleFilter.value)
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredSubscriptions.value.length / itemsPerPage.value)
})

const paginatedSubscriptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredSubscriptions.value.slice(start, end)
})

// Méthodes
const fetchSubscriptions = async () => {
  try {
    await subscriptionStore.fetchSubscriptions()
  } catch (error) {
    logger.error('[SubscriptionsView] Erreur lors du chargement des abonnements', { error })
  }
}

const changePage = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewSubscriptionDetails = (subscriptionId: number) => {
  router.push({ name: 'subscription-details', params: { id: subscriptionId.toString() } })
}

const editSubscription = (subscriptionId: number) => {
  router.push({ name: 'edit-subscription', params: { id: subscriptionId.toString() } })
}

const cancelSubscription = async (subscriptionId: number) => {
  if (confirm(t('subscriptions.confirm_cancel'))) {
    try {
      await subscriptionStore.cancelSubscription(subscriptionId)
      await fetchSubscriptions()
    } catch (error) {
      logger.error('[SubscriptionsView] Erreur lors de l\'annulation', { error })
    }
  }
}

const renewSubscription = async (subscriptionId: number) => {
  try {
    await subscriptionStore.renewSubscription(subscriptionId)
    await fetchSubscriptions()
  } catch (error) {
    logger.error('[SubscriptionsView] Erreur lors du renouvellement', { error })
  }
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
    'monthly': t('subscriptions.cycles.monthly'),
    'quarterly': t('subscriptions.cycles.quarterly'),
    'semi_annual': t('subscriptions.cycles.semi_annual'),
    'annual': t('subscriptions.cycles.annual')
  }
  return cycles[cycle] || cycle
}

const getStatusName = (status: string) => {
  const statuses: Record<string, string> = {
    'active': t('subscriptions.status.active'),
    'pending': t('subscriptions.status.pending'),
    'cancelled': t('subscriptions.status.cancelled'),
    'expired': t('subscriptions.status.expired')
  }
  return statuses[status] || status
}

// Cycle de vie
onMounted(async () => {
  await fetchSubscriptions()
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS */
@import '@/assets/css/pages/subscriptions.css';
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
