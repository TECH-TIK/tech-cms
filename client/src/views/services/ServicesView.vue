<template>
  <div id="client-services">
    <!-- Header Section -->
    <div class="services-header">
      <h1>
        <i class="fas fa-server"></i>
        {{ $t('services.title') }}
      </h1>
      <div class="services-actions">
        <button class="btn btn-outline btn-sm">
          <i class="fas fa-download"></i>
          {{ $t('common.export') }}
        </button>
        <button class="btn btn-primary btn-sm">
          <i class="fas fa-plus"></i>
          {{ $t('services.new_service') }}
        </button>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="services-filters">
      <div class="filter-group">
        <label class="filter-label">{{ $t('common.status') }}</label>
        <select v-model="selectedStatus" class="filter-select" @change="filterServices">
          <option value="">{{ $t('services.all_statuses') }}</option>
          <option value="active">{{ $t('status.active') }}</option>
          <option value="suspended">{{ $t('status.suspended') }}</option>
          <option value="pending">{{ $t('status.pending') }}</option>
          <option value="expired">{{ $t('status.expired') }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">{{ $t('services.type') }}</label>
        <select v-model="selectedType" class="filter-select" @change="filterServices">
          <option value="">{{ $t('services.all_types') }}</option>
          <option value="Hébergement Web">{{ $t('services.web_hosting') }}</option>
          <option value="Serveur Virtuel">{{ $t('services.vps') }}</option>
          <option value="Nom de Domaine">{{ $t('services.domain') }}</option>
          <option value="Email">{{ $t('services.email') }}</option>
          <option value="SSL">{{ $t('services.ssl') }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">{{ $t('common.search') }}</label>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-select"
          :placeholder="$t('services.search_placeholder')"
          @input="filterServices"
        >
      </div>
    </div>

    <!-- Services Grid -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>{{ $t('services.loading_services') }}</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>{{ $t('common.error') }}</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadServices()">
        <i class="fas fa-redo"></i>
        {{ $t('common.retry') }}
      </button>
    </div>

    <div v-else-if="filteredServices.length === 0" class="empty-state">
      <i class="fas fa-server"></i>
      <h3>{{ $t('services.no_services') }}</h3>
      <p>{{ searchQuery || selectedStatus || selectedType ? $t('services.no_results') : $t('services.no_active_services') }}</p>
      <button class="btn btn-primary">
        <i class="fas fa-plus"></i>
        {{ $t('services.order_service') }}
      </button>
    </div>

    <div v-else class="services-grid">
      <div v-for="service in filteredServices" :key="service.id" class="service-card">
        <!-- Service Header -->
        <div class="service-header">
          <div class="service-info">
            <div class="service-icon">
              <i :class="getServiceIcon(service.type)"></i>
            </div>
            <div class="service-details">
              <div class="service-name">{{ service.name }}</div>
              <div class="service-type">{{ service.type }}</div>
              <div class="service-description">{{ service.notes || 'Service ' + service.name }}</div>
            </div>
          </div>
          <div class="service-status">
            <span :class="getStatusClass(service.status)">
              {{ getStatusLabel(service.status) }}
            </span>
          </div>
        </div>

        <!-- Service Meta -->
        <div class="service-meta">
          <div class="service-pricing">
            <div class="service-price">{{ formatCurrency(service.recurring_amount) }}</div>
            <div class="service-period">{{ service.billing_cycle }}</div>
          </div>
          <div class="service-dates">
            <div class="service-date-label">{{ $t('services.expires_on') }}</div>
            <div class="service-date-value">{{ formatDate(service.next_due_date) }}</div>
          </div>
        </div>

        <!-- Service Actions -->
        <div class="service-actions">
          <button class="btn btn-primary btn-sm" @click="navigateToServiceDetail(service.id)">
            <i class="fas fa-cog"></i>
            {{ $t('services.manage') }}
          </button>
          <button class="btn btn-outline btn-sm">
            <i class="fas fa-chart-line"></i>
            {{ $t('services.statistics') }}
          </button>
          <button v-if="service.status === 'active'" class="btn btn-outline btn-sm">
            <i class="fas fa-sync"></i>
            {{ $t('services.renew') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServicesStore } from '@/stores/services'
import { useRealtimeStore } from '@/stores/realtime'
import { useAuthStore } from '@/stores/auth'
import logger from '@/services/logger'
import { formatDateLong, formatPrice } from '@/utils/dateUtils'

// Router
const router = useRouter()

// Stores
const servicesStore = useServicesStore()
const realtimeStore = useRealtimeStore()
const authStore = useAuthStore()

// État de l'application
const selectedStatus = ref('')
const selectedType = ref('')
const searchQuery = ref('')

// Computed properties depuis le store
const loading = computed(() => servicesStore.loading)
const error = computed(() => servicesStore.error)
const services = computed(() => servicesStore.services)

// Fonctions pour charger les données
const loadServices = async () => {
  try {
    await servicesStore.fetchServices()
    logger.info('[SERVICES VIEW] Services chargés depuis le store', { count: services.value.length })
  } catch (err: any) {
    logger.error('[SERVICES VIEW] Erreur lors du chargement des services', { error: err })
  }
}

// Services filtrés
const filteredServices = computed(() => {
  let filtered = services.value

  if (selectedStatus.value) {
    filtered = filtered.filter(service => service.status === selectedStatus.value)
  }

  if (selectedType.value) {
    filtered = filtered.filter(service => service.type === selectedType.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(service =>
      (service.name && service.name.toLowerCase().includes(query)) ||
      (service.type && service.type.toLowerCase().includes(query)) ||
      (service.notes && service.notes.toLowerCase().includes(query))
    )
  }

  return filtered
})

// Méthodes
const filterServices = () => {
  // La réactivité de Vue se charge automatiquement du filtrage
}

// Utilisation de la fonction utilitaire pour le formatage des prix
const formatCurrency = formatPrice

// Utilisation de la fonction utilitaire pour le formatage des dates
const formatDate = formatDateLong

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    active: 'status-badge status-active',
    suspended: 'status-badge status-suspended',
    pending: 'status-badge status-pending',
    cancelled: 'status-badge status-cancelled',
    terminated: 'status-badge status-terminated',
    fraud: 'status-badge status-fraud'
  }
  return classes[status] || 'status-badge'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Actif',
    suspended: 'Suspendu',
    pending: 'En attente',
    cancelled: 'Annulé',
    terminated: 'Résilié',
    fraud: 'Fraude'
  }
  return labels[status] || status
}

const getServiceIcon = (type: string | undefined): string => {
  if (!type) return 'fas fa-cog'

  const icons: Record<string, string> = {
    'Hébergement Web': 'fas fa-globe',
    'Serveur Virtuel': 'fas fa-server',
    'Nom de Domaine': 'fas fa-link',
    'Email': 'fas fa-envelope',
    'SSL': 'fas fa-shield-alt'
  }
  return icons[type] || 'fas fa-cog'
}

// Navigation
const navigateToServiceDetail = (serviceId: number) => {
  router.push(`/services/${serviceId}`)
}

// Chargement des données au montage du composant et gestion temps réel
onMounted(async () => {
  // Charger les services
  await loadServices()

  // Initialiser le temps réel et s'abonner aux événements - SÉCURISÉ
  const clientId = authStore.user?.id

  if (!clientId) {
    logger.error('[SERVICES VIEW] ID client manquant - abandon initialisation temps réel', {
      user: authStore.user
    })
    return
  }

  if (realtimeStore.initialized) {
    // S'abonner aux canaux dashboard si pas déjà fait
    await realtimeStore.subscribeToDashboardEvents(clientId)

    // Enregistrer le handler pour cette page
    realtimeStore.registerDashboardHandler('service-page', servicesStore.handleServiceUpdate)
    logger.info('[SERVICES VIEW] Handler temps réel enregistré avec clé service-page', { clientId })
  } else {
    // Attendre que le realtime soit prêt
    const unwatch = realtimeStore.$subscribe((_mutation, state) => {
      if (state.initialized) {
        // S'abonner aux canaux dashboard
        realtimeStore.subscribeToDashboardEvents(clientId).then(() => {
          // Enregistrer le handler pour cette page
          realtimeStore.registerDashboardHandler('service-page', servicesStore.handleServiceUpdate)
          logger.info('[SERVICES VIEW] Handler temps réel enregistré (après initialisation) avec clé service-page', { clientId })
        })
        unwatch()
      }
    })
  }
})

onUnmounted(() => {
  // Nettoyer les handlers temps réel avec clé unique
  realtimeStore.unregisterDashboardHandler('service-page')
  logger.info('[SERVICES VIEW] Handler temps réel supprimé pour clé service-page')
})
</script>

<style scoped>
@import '@/assets/css/pages/services.css';
</style>
