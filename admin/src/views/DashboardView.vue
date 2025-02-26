<template>
  <div id="dashboard">
    <div class="header-box">
      <h1>{{ $t('dashboard.title') }}</h1>
    </div>

    <div class="stats-grid box-grid">
      <div class="stat-card card-box">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-number" data-type="clients" data-count="totalClients">{{ totalClients }}</div>
        <div class="stat-label">{{ $t('dashboard.stats.active_clients') }}</div>
      </div>
      
      <div class="stat-card card-box">
        <div class="stat-icon">
          <i class="fas fa-server"></i>
        </div>
        <div class="stat-number" data-type="services" data-count="totalServices">{{ totalServices }}</div>
        <div class="stat-label">{{ $t('dashboard.stats.active_services') }}</div>
      </div>
      
      <div class="stat-card card-box">
        <div class="stat-icon">
          <i class="fas fa-cube"></i>
        </div>
        <div class="stat-number" data-type="products" data-count="totalProducts">{{ totalProducts }}</div>
        <div class="stat-label">{{ $t('dashboard.stats.total_products') }}</div>
      </div>
      
      <div class="stat-card card-box">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-number" data-type="revenue" data-amount="revenue">{{ formatCurrency(revenue) }}</div>
        <div class="stat-label">{{ $t('dashboard.stats.monthly_revenue') }}</div>
      </div>
    </div>

    <div class="dashboard-grid box-grid">
      <!-- Derniers clients -->
      <div class="card card-box">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-users"></i>
            {{ $t('dashboard.recent_clients.title') }}
          </h3>
          <router-link to="/clients" class="btn btn-sm btn-outline">
            {{ $t('common.view_all') }}
          </router-link>
        </div>
        <div class="card-body">
          <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else-if="error" class="error-state">
            {{ error }}
          </div>
          <div v-else class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ $t('common.client') }}</th>
                  <th>{{ $t('common.email') }}</th>
                  <th>{{ $t('common.status') }}</th>
                  <th>{{ $t('common.date') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="client in recentClients" :key="client.id">
                  <td>
                    <router-link :to="`/clients/${client.id}`" class="client-link">
                      {{ client.name }}
                    </router-link>
                  </td>
                  <td>{{ client.email }}</td>
                  <td>
                    <span :class="getStatusClass(client.status)">
                      {{ client.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(client.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Derniers tickets -->
      <div class="card card-box">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-headset"></i>
            {{ $t('dashboard.recent_tickets.title') }}
          </h3>
          <router-link to="/tickets" class="btn btn-sm btn-outline">
            {{ $t('common.view_all') }}
          </router-link>
        </div>
        <div class="card-body">
          <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else-if="error" class="error-state">
            {{ error }}
          </div>
          <div v-else class="tickets-list">
            <div v-for="ticket in recentTickets" :key="ticket.id" class="ticket-item">
              <div class="ticket-status" :class="getTicketStatusClass(ticket.status)"></div>
              <div class="ticket-content">
                <router-link :to="`/tickets/${ticket.id}`" class="ticket-title">
                  {{ ticket.title }}
                </router-link>
                <div class="ticket-meta">
                  <span class="ticket-client">{{ ticket.client_name }}</span>
                  <span class="ticket-time">{{ formatDate(ticket.created_at) }}</span>
                </div>
              </div>
              <div class="ticket-priority" :class="getTicketPriorityClass(ticket.priority)">
                {{ ticket.priority }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDashboardStore } from '@/stores/dashboard'

const { t } = useI18n()
const dashboardStore = useDashboardStore()

// État
const loading = ref(true)
const error = ref<string | null>(null)
const totalClients = ref(0)
const totalServices = ref(0)
const totalProducts = ref(0)
const revenue = ref(0)
const recentClients = ref([])
const recentTickets = ref([])

// Charger les données
onMounted(async () => {
  try {
    const data = await dashboardStore.fetchDashboardData()
    totalClients.value = data.stats.clients
    totalServices.value = data.stats.services
    totalProducts.value = data.stats.products
    revenue.value = data.stats.revenue
    recentClients.value = data.recentClients
    recentTickets.value = data.recentTickets
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

// Utilitaires
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    active: 'status-badge status-success',
    pending: 'status-badge status-warning',
    suspended: 'status-badge status-danger'
  }
  return classes[status] || 'status-badge status-default'
}

function getTicketStatusClass(status: string): string {
  const classes: Record<string, string> = {
    open: 'status-open',
    in_progress: 'status-progress',
    resolved: 'status-resolved',
    closed: 'status-closed'
  }
  return classes[status] || 'status-default'
}

function getTicketPriorityClass(priority: string): string {
  const classes: Record<string, string> = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    urgent: 'priority-urgent'
  }
  return classes[priority] || 'priority-default'
}
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS */
@import '@/assets/css/pages/dashboard.css';
</style>
