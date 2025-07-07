<template>
  <div id="service-detail">
    <!-- Header Section -->
    <div class="service-detail-header">
      <div class="header-content">
        <button class="btn btn-outline btn-sm back-btn" @click="goBack">
          <i class="fas fa-arrow-left"></i>
          Retour aux services
        </button>
        <div class="service-title-section">
          <div class="service-icon-large">
            <i :class="getServiceIcon(service?.type)"></i>
          </div>
          <div class="service-info">
            <h1>{{ service?.name || 'Chargement...' }}</h1>
            <div class="service-meta">
              <span class="service-type">{{ service?.type }}</span>
              <span :class="getStatusClass(service?.status)">
                {{ getStatusLabel(service?.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="service-actions">
        <button class="btn btn-outline btn-sm">
          <i class="fas fa-download"></i>
          Exporter
        </button>
        <button class="btn btn-primary" :disabled="service?.status !== 'active'">
          <i class="fas fa-cog"></i>
          Gérer le service
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement des détails du service...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadService">
          <i class="fas fa-refresh"></i>
          Réessayer
        </button>
      </div>
    </div>

    <!-- Service Details -->
    <div v-else-if="service" class="service-content">
      <!-- Service Overview -->
      <div class="service-overview">
        <div class="overview-card">
          <h2>
            <i class="fas fa-info-circle"></i>
            Informations générales
          </h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Nom du service</label>
              <span>{{ service.name }}</span>
            </div>
            <div class="info-item">
              <label>Type</label>
              <span>{{ service.type }}</span>
            </div>
            <div class="info-item">
              <label>Statut</label>
              <span :class="getStatusClass(service.status)">
                {{ getStatusLabel(service.status) }}
              </span>
            </div>
            <div class="info-item">
              <label>Date de création</label>
              <span>{{ formatDate(service.created_at) }}</span>
            </div>
            <div class="info-item">
              <label>Dernière modification</label>
              <span>{{ formatDate(service.updated_at) }}</span>
            </div>
            <div class="info-item" v-if="service.notes">
              <label>Description</label>
              <span>{{ service.notes }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Service Configuration -->
      <div class="service-configuration">
        <div class="config-card">
          <h2>
            <i class="fas fa-cogs"></i>
            Configuration
          </h2>
          <div class="config-content">
            <div class="config-item" v-if="service.hostname">
              <label>Nom d'hôte</label>
              <span class="config-value">{{ service.hostname }}</span>
            </div>
            <div class="config-item" v-if="service.username">
              <label>Nom d'utilisateur</label>
              <span class="config-value">{{ service.username }}</span>
            </div>
            <div class="config-item" v-if="service.port">
              <label>Port</label>
              <span class="config-value">{{ service.port }}</span>
            </div>
            <div class="config-item" v-if="service.database_name">
              <label>Base de données</label>
              <span class="config-value">{{ service.database_name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing Information -->
      <div class="service-billing">
        <div class="billing-card">
          <h2>
            <i class="fas fa-credit-card"></i>
            Facturation
          </h2>
          <div class="billing-content">
            <div class="billing-item">
              <label>Prix mensuel</label>
              <span class="price">{{ formatPrice(service.monthly_price) }}</span>
            </div>
            <div class="billing-item">
              <label>Prochaine facturation</label>
              <span>{{ formatDate(service.next_billing_date) }}</span>
            </div>
            <div class="billing-item">
              <label>Cycle de facturation</label>
              <span>{{ service.billing_cycle || 'Mensuel' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Service History -->
      <div class="service-history">
        <div class="history-card">
          <h2>
            <i class="fas fa-history"></i>
            Historique récent
          </h2>
          <div class="history-content">
            <div v-if="serviceHistory.length === 0" class="no-history">
              <i class="fas fa-clock"></i>
              <p>Aucun historique disponible</p>
            </div>
            <div v-else class="history-list">
              <div v-for="event in serviceHistory" :key="event.id" class="history-item">
                <div class="history-icon">
                  <i :class="getHistoryIcon(event.type)"></i>
                </div>
                <div class="history-details">
                  <div class="history-title">{{ event.title }}</div>
                  <div class="history-description">{{ event.description }}</div>
                  <div class="history-date">{{ formatDate(event.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiService } from '@/services/api'
import { useRealtimeStore } from '@/stores/realtime'
import { useAuthStore } from '@/stores/auth'
import logger from '@/services/logger'
import type { DashboardRealtimeEvent } from '@/types/realtime'

// Types
interface Service {
  id: number
  name: string
  type: string
  status: string
  hostname?: string
  username?: string
  port?: number
  database_name?: string
  monthly_price?: number
  next_billing_date?: string
  billing_cycle?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface ServiceHistoryEvent {
  id: number
  type: string
  title: string
  description: string
  created_at: string
}

// Router
const route = useRoute()
const router = useRouter()

// Stores
const realtimeStore = useRealtimeStore()
const authStore = useAuthStore()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const service = ref<Service | null>(null)
const serviceHistory = ref<ServiceHistoryEvent[]>([])
const isUpdating = ref(false)

// Methods
const goBack = () => {
  router.push('/services')
}

const loadService = async () => {
  try {
    loading.value = true
    error.value = null
    
    const serviceId = parseInt(route.params.id as string)
    if (!serviceId) {
      throw new Error('ID de service invalide')
    }

    // Charger les détails du service
    const response = await ApiService.routes.client.service.getById(serviceId)
    service.value = response.data

    // Charger l'historique du service
    await loadServiceHistory(serviceId)

  } catch (err: any) {
    logger.error('[SERVICE] Erreur lors du chargement du service', { serviceId: route.params.id, error: err })
    error.value = err.response?.data?.message || 'Erreur lors du chargement du service'
  } finally {
    loading.value = false
  }
}

const getServiceIcon = (type?: string): string => {
  const icons: Record<string, string> = {
    'web_hosting': 'fas fa-globe',
    'vps': 'fas fa-server',
    'dedicated': 'fas fa-hdd',
    'database': 'fas fa-database',
    'email': 'fas fa-envelope',
    'domain': 'fas fa-link'
  }
  return icons[type || ''] || 'fas fa-cog'
}

const getStatusClass = (status?: string): string => {
  const classes: Record<string, string> = {
    'active': 'status-active',
    'suspended': 'status-suspended',
    'terminated': 'status-terminated',
    'pending': 'status-pending'
  }
  return classes[status || ''] || 'status-unknown'
}

const getStatusLabel = (status?: string): string => {
  const labels: Record<string, string> = {
    'active': 'Actif',
    'suspended': 'Suspendu',
    'terminated': 'Terminé',
    'pending': 'En attente'
  }
  return labels[status || ''] || 'Inconnu'
}

const getHistoryIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'created': 'fas fa-plus-circle',
    'activated': 'fas fa-play-circle',
    'suspended': 'fas fa-pause-circle',
    'terminated': 'fas fa-stop-circle',
    'modified': 'fas fa-edit',
    'payment': 'fas fa-credit-card'
  }
  return icons[type] || 'fas fa-info-circle'
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price?: number): string => {
  if (!price) return 'N/A'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

// Handler temps réel pour les mises à jour de service
const handleServiceUpdate = (event: DashboardRealtimeEvent) => {
  const serviceId = parseInt(route.params.id as string)

  // Filtrer seulement les événements concernant ce service
  const eventServiceId = parseInt(String(event.data?.service?.id || '0'))
  if (event.entity_type === 'service' && eventServiceId === serviceId) {
    logger.info('[SERVICE DETAIL] Événement service reçu', {
      event,
      serviceId,
      action: event.action
    })

    isUpdating.value = true

    // Mettre à jour les données du service
    if (event.data.service) {
      service.value = { ...service.value, ...event.data.service }
      logger.info('[SERVICE DETAIL] Service mis à jour en temps réel', {
        serviceId,
        updatedService: service.value
      })
    }

    // Gestion des actions spéciales
    switch (event.action) {
      case 'service_delete':
        logger.warn('[SERVICE DETAIL] Service supprimé - redirection', { serviceId })
        router.push('/services')
        break
      case 'service_update':
        // Recharger l'historique pour avoir les dernières modifications
        loadServiceHistory(serviceId)
        break
    }

    setTimeout(() => {
      isUpdating.value = false
    }, 1000)
  }
}

// Charger l'historique du service séparément
const loadServiceHistory = async (serviceId: number) => {
  try {
    const historyResponse = await ApiService.routes.client.service.getHistory(serviceId)
    serviceHistory.value = historyResponse.data || []
  } catch (historyError) {
    logger.warn('[SERVICE DETAIL] Impossible de charger l\'historique du service', {
      serviceId,
      error: historyError
    })
  }
}

// Initialiser le temps réel pour cette page
const initRealtime = async () => {
  const clientId = authStore.user?.id
  const serviceId = parseInt(route.params.id as string)

  if (!clientId) {
    logger.error('[SERVICE DETAIL] ID client manquant - abandon initialisation temps réel', {
      user: authStore.user
    })
    return
  }

  if (!serviceId) {
    logger.error('[SERVICE DETAIL] ID service invalide - abandon initialisation temps réel', {
      serviceId: route.params.id
    })
    return
  }

  const handlerKey = `service-detail-${serviceId}`

  if (realtimeStore.initialized) {
    // S'abonner aux canaux dashboard si pas déjà fait
    await realtimeStore.subscribeToDashboardEvents(clientId)

    // Enregistrer le handler pour cette page de détail
    realtimeStore.registerDashboardHandler(handlerKey, handleServiceUpdate)
    logger.info('[SERVICE DETAIL] Handler temps réel enregistré', {
      handlerKey,
      clientId,
      serviceId
    })
  } else {
    // Attendre que le realtime soit prêt
    const unwatch = realtimeStore.$subscribe((_mutation, state) => {
      if (state.initialized) {
        // S'abonner aux canaux dashboard
        realtimeStore.subscribeToDashboardEvents(clientId).then(() => {
          // Enregistrer le handler pour cette page de détail
          realtimeStore.registerDashboardHandler(handlerKey, handleServiceUpdate)
          logger.info('[SERVICE DETAIL] Handler temps réel enregistré (après initialisation)', {
            handlerKey,
            clientId,
            serviceId
          })
        })
        unwatch()
      }
    })
  }
}

// Nettoyer le handler temps réel
const cleanupRealtime = () => {
  const serviceId = parseInt(route.params.id as string)
  if (serviceId) {
    const handlerKey = `service-detail-${serviceId}`
    realtimeStore.unregisterDashboardHandler(handlerKey)
    logger.info('[SERVICE DETAIL] Handler temps réel supprimé', { handlerKey, serviceId })
  }
}

// Lifecycle
onMounted(async () => {
  await loadService()
  await initRealtime()
})

onUnmounted(() => {
  cleanupRealtime()
})
</script>

<style scoped>
@import '@/assets/css/pages/service-detail.css';
</style>
