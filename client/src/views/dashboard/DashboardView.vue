<template>
  <div id="client-dashboard">
    <div class="header-box">
      <h1>{{ $t('dashboard.title') }}</h1>
    </div>

    <div class="stats-grid box-grid">
      <div class="stat-card card-box">
        <div class="stat-icon">
          <i class="fas fa-server"></i>
        </div>
        <div class="stat-number">{{ dashboardStore.totalServices }}</div>
        <div class="stat-label">{{ $t('dashboard.my_services') }}</div>
      </div>

      <div class="stat-card card-box">
        <div class="stat-icon">
          <i class="fas fa-file-invoice"></i>
        </div>
        <div class="stat-number">{{ dashboardStore.stats?.invoices.unpaid || 0 }}</div>
        <div class="stat-label">{{ $t('dashboard.unpaid_invoices') }}</div>
      </div>

      <div class="stat-card card-box">
        <div class="stat-icon">
          <i class="fas fa-headset"></i>
        </div>
        <div class="stat-number">{{ dashboardStore.openTicketsCount }}</div>
        <div class="stat-label">{{ $t('dashboard.open_tickets') }}</div>
      </div>

      <div class="stat-card card-box">
        <div class="stat-icon">
          <i class="fas fa-credit-card"></i>
        </div>
        <div class="stat-number">{{ formatCurrency(dashboardStore.totalUnpaidAmount) }}</div>
        <div class="stat-label">{{ $t('dashboard.total_due') }}</div>
      </div>
    </div>

    <div class="dashboard-grid box-grid">
      <!-- Mes Services -->
      <div class="card card-box">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-server"></i>
            {{ $t('dashboard.my_services') }}
          </h3>
          <button @click="navigateToServices" class="btn btn-sm btn-outline">
            {{ $t('dashboard.view_all') }}
          </button>
        </div>
        <div class="card-body">
          <div v-if="dashboardStore.loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else class="service-list">
            <div v-for="service in dashboardStore.recentServices" :key="service.id" class="service-item">
              <div class="service-info">
                <div class="service-icon">
                  <i :class="getServiceIcon(service.type)"></i>
                </div>
                <div class="service-details">
                  <div class="service-name">
                    <a @click.prevent="navigateToServiceDetail(service.id)" href="#" class="service-link">
                      {{ service.name }}
                    </a>
                  </div>
                  <div class="service-type">
                    {{ service.type }}
                  </div>
                </div>
              </div>
              <div class="service-meta">
                <div class="service-price">
                  {{ formatCurrency(service.price) }}/{{ $t('common.month') }}
                </div>
                <div class="service-status">
                  <span :class="getStatusClass(service.status)">
                    {{ $t('status.' + service.status) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="dashboardStore.recentServices.length === 0" class="no-data">
              {{ $t('services.no_services') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Factures Récentes -->
      <div class="card card-box">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-file-invoice"></i>
            {{ $t('dashboard.recent_invoices') }}
          </h3>
          <button @click="navigateToBilling" class="btn btn-sm btn-outline">
            {{ $t('dashboard.view_all') }}
          </button>
        </div>
        <div class="card-body">
          <div v-if="dashboardStore.loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else class="invoice-list">
            <div v-for="invoice in dashboardStore.recentInvoices" :key="invoice.id" class="invoice-item">
              <div class="invoice-info">
                <div class="invoice-icon">
                  <i class="fas fa-file-invoice"></i>
                </div>
                <div class="invoice-details">
                  <div class="invoice-number">
                    <a @click.prevent="navigateToInvoiceDetail(invoice.id)" href="#" class="invoice-link">
                      {{ $t('billing.invoice_number') }} #{{ invoice.number }}
                    </a>
                  </div>
                  <div class="invoice-date">
                    {{ formatDate(invoice.created_at) }}
                  </div>
                </div>
              </div>
              <div class="invoice-meta">
                <div class="invoice-amount">
                  {{ formatCurrency(invoice.amount) }}
                </div>
                <div class="invoice-status">
                  <span :class="getStatusClass(invoice.status)">
                    {{ $t('status.' + invoice.status) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="dashboardStore.recentInvoices.length === 0" class="no-data">
              {{ $t('billing.no_invoices') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tickets Récents - Section complète -->
    <div class="card card-box">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fas fa-headset"></i>
          {{ $t('dashboard.recent_tickets') }}
        </h3>
        <button @click="navigateToSupport" class="btn btn-sm btn-outline">
          {{ $t('dashboard.view_all') }}
        </button>
      </div>
      <div class="card-body">
        <div v-if="dashboardStore.loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div v-else class="ticket-list">
          <div v-for="ticket in dashboardStore.recentTickets" :key="ticket.id" class="ticket-item">
            <div class="ticket-info">
              <div class="ticket-icon">
                <i class="fas fa-headset"></i>
              </div>
              <div class="ticket-details">
                <div class="ticket-title">
                  <a @click.prevent="navigateToTicketDetail(ticket.id)" href="#" class="ticket-link">
                    {{ ticket.title }}
                  </a>
                </div>
                <div class="ticket-id">
                  #{{ ticket.id }}
                </div>
              </div>
            </div>
            <div class="ticket-meta">
              <div class="ticket-date">
                {{ formatDate(ticket.created_at) }}
              </div>
              <div class="ticket-status">
                <span :class="getStatusClass(ticket.status)">
                  {{ $t('status.' + ticket.status) }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="dashboardStore.recentTickets.length === 0" class="no-data">
            {{ $t('support.no_tickets') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import { useRealtimeStore } from '@/stores/realtime'
import { useAuthStore } from '@/stores/auth'
import logger from '@/services/logger'

// Router et Stores
const router = useRouter()
const dashboardStore = useDashboardStore()
const realtimeStore = useRealtimeStore()
const authStore = useAuthStore()

// Charger les données et initialiser le temps réel
onMounted(async () => {
  try {
    logger.info('[DASHBOARD] Chargement des données du dashboard')

    // Charger les données initiales
    await dashboardStore.fetchDashboardData()
    logger.info('[DASHBOARD] Données du dashboard chargées avec succès')

    // Initialiser le temps réel si l'utilisateur est authentifié et le service n'est pas déjà initialisé
    if (authStore.isAuthenticated && !realtimeStore.initialized) {
      await realtimeStore.init()
      logger.info('[DASHBOARD] Service temps réel initialisé')
    }

    // Initialiser les mises à jour temps réel du dashboard
    if (authStore.isAuthenticated && !dashboardStore.realtimeInitialized) {
      await dashboardStore.initRealtimeUpdates()
      logger.info('[DASHBOARD] Temps réel dashboard initialisé avec succès')
    }
  } catch (err: any) {
    logger.error('[DASHBOARD] Erreur lors du chargement des données', { error: err })
    // En cas d'erreur, on peut afficher un message d'erreur ou garder les données vides
  }
})

// Nettoyage lors de la destruction du composant
onUnmounted(() => {
  if (dashboardStore.realtimeInitialized) {
    dashboardStore.stopRealtimeUpdates()
    logger.info('[DASHBOARD] Nettoyage du composant dashboard')
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
  const dateObj = new Date(date)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    active: 'status-badge status-success',
    suspended: 'status-badge status-danger',
    paid: 'status-badge status-success',
    unpaid: 'status-badge status-warning',
    open: 'status-badge status-info',
    in_progress: 'status-badge status-warning',
    resolved: 'status-badge status-success',
    closed: 'status-badge status-secondary'
  }
  return classes[status] || 'status-badge status-default'
}

function getServiceIcon(type: string): string {
  const icons: Record<string, string> = {
    'Hébergement Web': 'fas fa-globe',
    'Serveur Virtuel': 'fas fa-server',
    'Nom de Domaine': 'fas fa-link',
    'Email': 'fas fa-envelope'
  }
  return icons[type] || 'fas fa-cog'
}

// Fonctions de navigation
function navigateToServices() {
  router.push('/services')
}

function navigateToBilling() {
  router.push('/billing')
}

function navigateToSupport() {
  router.push('/support')
}

function navigateToServiceDetail(serviceId: number) {
  router.push(`/services/${serviceId}`)
}

function navigateToInvoiceDetail(invoiceId: number) {
  router.push(`/billing/invoice/${invoiceId}`)
}

function navigateToTicketDetail(ticketId: number) {
  router.push(`/support/ticket/${ticketId}`)
}
</script>

<style scoped>
@import '@/assets/css/pages/dashboard.css';
</style>