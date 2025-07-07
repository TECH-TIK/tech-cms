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
        <div class="stat-number" data-type="tickets" data-count="totalTickets">{{ totalTickets }}</div>
        <div class="stat-label">{{ $t('dashboard.stats.active_tickets') }}</div>
      </div>
      
      <div class="stat-card card-box">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-number" data-type="revenue" data-count="revenue">{{ formatCurrency(revenue) }}</div>
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
          <div v-else class="client-list">
            <div v-for="client in recentClients" :key="client.id" class="client-item">
              <div class="client-info">
                <div class="client-avatar">
                  <i class="fas fa-user-circle"></i>
                </div>
                <div class="client-details">
                  <div class="client-name">
                    <router-link :to="`/clients/${client.id}`" class="client-link">
                      {{ client.name }}
                    </router-link>
                  </div>
                  <div class="client-email">
                    {{ client.email }}
                  </div>
                </div>
              </div>
              <div class="client-meta">
                <div class="client-date">
                  {{ formatDate(client.created_at) }}
                </div>
                <div class="client-status">
                  <span :class="getStatusClass(client.status)">
                    {{ client.status }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="recentClients.length === 0" class="no-clients">
              {{ $t('common.no_data') }}
            </div>
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
          <div v-else class="client-list">
            <div v-for="ticket in recentTickets" :key="ticket.id" class="client-item">
              <div class="client-info">
                <div class="client-avatar">
                  <i class="fas fa-headset"></i>
                </div>
                <div class="client-details">
                  <div class="client-name">
                    <router-link :to="`/tickets/${ticket.id}`" class="client-link">
                      {{ ticket.title ? (ticket.title + (ticket.client_name ? ' (' + ticket.client_name + ')' : '')) : 'Sans titre' }}
                    </router-link>
                  </div>
                  <div class="client-email">
                    #{{ ticket.id }}
                  </div>
                </div>
              </div>
              <div class="client-meta">
                <div class="client-date">
                  {{ formatDate(ticket.created_at) }}
                </div>
                <div class="client-status">
                  <span :class="getStatusClass(ticket.status)">
                    {{ ticket.status }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="recentTickets.length === 0" class="no-clients">
              {{ $t('common.no_data') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useRealtimeStore } from '@/stores/realtime'
import ablyService from '@/services/ably'
import logger from '@/services/logger'
import type { RecentClient, RecentTicket, DashboardStore } from '@/types/dashboard'

const dashboardStore = useDashboardStore() as unknown as DashboardStore
const realtimeStore = useRealtimeStore()

// État
const loading = ref(true)
const error = ref<string | null>(null)
const totalClients = ref(0)
const totalServices = ref(0)
const totalTickets = ref(0)
const revenue = ref(0)
const recentClients = ref<RecentClient[]>([])
const recentTickets = ref<RecentTicket[]>([])

// Référence aux abonnements pour pouvoir les nettoyer plus tard
const subscriptions = ref<Array<{unsubscribe: () => void}>>([]);

// Fonction pour s'abonner aux mises à jour en temps réel des statistiques
const subscribeToStatsUpdates = () => {
  logger.info('[DASHBOARD] Abonnement aux mises à jour temps réel des statistiques')
  
  // S'assurer que le client Ably est connecté
  if (!realtimeStore.isConnected) {
    logger.warn('[DASHBOARD] Client temps réel non connecté, impossible de s\'abonner aux mises à jour')
    return
  }
  
  // Utiliser le service Ably pour s'abonner au canal admin
  try {
    // Créer un abonnement pour l'événement unifié dashboard-update (statistiques et activités)
    const dashboardSubscription = ablyService.subscribeToAdminChannel('dashboard-update', (data) => {
      logger.info('[DASHBOARD] Mise à jour tableau de bord reçue:', { category: data?.category, type: data?.type })
      
      // Vérifier si data est un objet valide
      if (!data || typeof data !== 'object') {
        logger.warn('[DASHBOARD] Données reçues invalides:', data)
        return
      }
      
      // Traiter les mises à jour de statistiques
      if (data.category === 'stats') {
        // Mettre à jour la statistique correspondante avec une petite animation
        if (data.type === 'clients' && data.count !== undefined) {
          logger.info('[DASHBOARD] Mise à jour du compteur clients:', data.count)
          animateCounterUpdate(totalClients, data.count)
        } 
        else if (data.type === 'services' && data.count !== undefined) {
          logger.info('[DASHBOARD] Mise à jour du compteur services:', data.count)
          animateCounterUpdate(totalServices, data.count)
        }
        else if (data.type === 'tickets' && data.count !== undefined) {
          logger.info('[DASHBOARD] Mise à jour du compteur tickets:', data.count)
          animateCounterUpdate(totalTickets, data.count)
        }
        else if (data.type === 'revenue' && data.amount !== undefined) {
          logger.info('[DASHBOARD] Mise à jour du compteur revenus:', data.amount)
          animateCounterUpdate(revenue, data.amount)
        }
      }
      // Traiter les mises à jour d'activité
      else if (data.category === 'activity') {
        // Traiter les mises à jour des clients
        if (data.type === 'client_update' && data.client && data.action) {
          handleClientUpdate(data.client, data.action)
        }
        
        // Traiter les mises à jour des tickets
        else if (data.type === 'ticket_update' && data.ticket && data.action) {
          handleTicketUpdate(data.ticket, data.action)
        }
      }
    })
    
    // Stocker l'abonnement pour le nettoyage ultérieur
    if (dashboardSubscription && typeof dashboardSubscription === 'object' && 'unsubscribe' in dashboardSubscription) {
      subscriptions.value.push(dashboardSubscription as {unsubscribe: () => void})
    }
  } catch (err) {
    // Conversion du type unknown en objet pour la journalisation
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('[DASHBOARD] Erreur lors de l\'abonnement aux mises à jour temps réel:', error)
  }
}

// Fonction pour gérer les mises à jour des clients en temps réel
const handleClientUpdate = (clientData: any, action: string) => {
  logger.info(`[DASHBOARD] Traitement de l'action ${action} pour le client`, { client_id: clientData.id })
  
  // Formater les données du client pour correspondre à l'interface RecentClient
  const client: RecentClient = {
    ...clientData,
    // Générer le champ name en combinant firstname et lastname s'ils existent
    name: clientData.name || ((clientData.firstname || '') + ' ' + (clientData.lastname || '')).trim()
  }
  
  logger.info(`[DASHBOARD] Client formaté avec le nom: ${client.name}`, { client_id: client.id })
  
  // Action selon le type de mise à jour
  switch (action) {
    case 'create':
      // Ajouter le nouveau client au début de la liste
      if (!recentClients.value.some(c => c.id === client.id)) {
        recentClients.value.unshift(client)
        // Limiter la liste à 5 clients maximum
        if (recentClients.value.length > 5) {
          recentClients.value.pop()
        }
        logger.info('[DASHBOARD] Nouveau client ajouté à la liste')
      }
      break
    
    case 'update':
      // Mettre à jour le client existant s'il est dans la liste
      const clientIndex = recentClients.value.findIndex(c => c.id === client.id)
      if (clientIndex !== -1) {
        recentClients.value[clientIndex] = { ...recentClients.value[clientIndex], ...client }
        logger.info('[DASHBOARD] Client existant mis à jour dans la liste')
      }
      break
    
    case 'delete':
      // Supprimer le client de la liste
      const initialClientLength = recentClients.value.length
      recentClients.value = recentClients.value.filter(c => c.id !== client.id)
      if (recentClients.value.length < initialClientLength) {
        logger.info('[DASHBOARD] Client supprimé de la liste')
        // Charger un nouveau client pour remplacer celui supprimé
        dashboardStore.fetchRecentClients(1).then((newClients: RecentClient[]) => {
          if (newClients.length > 0 && !recentClients.value.some(c => c.id === newClients[0].id)) {
            recentClients.value.push(newClients[0])
          }
        })
      }
      break
  }
}

// Fonction pour gérer les mises à jour des tickets en temps réel
const handleTicketUpdate = (ticketData: any, action: string) => {
  logger.info(`[DASHBOARD] Traitement de l'action ${action} pour le ticket`, { ticket_id: ticketData.id })

    // Les données de ticket peuvent venir de deux sources différentes :
  // 1. API normale lors du chargement de page (avec champ "name" au format "titre (client)")
  // 2. Événements temps réel (avec champs "title" et potentiellement "client_id" ou "client_name" séparés)
  
  // Vérifier si nous avons un champ client pour le temps réel
  let clientData = '';
  if (ticketData.client) {
    // Si nous avons l'objet client complet (depuis les événements temps réel)
    if (typeof ticketData.client === 'object') {
      if (ticketData.client.firstname && ticketData.client.lastname) {
        clientData = `${ticketData.client.firstname} ${ticketData.client.lastname}`;
      } else if (ticketData.client.name) {
        clientData = ticketData.client.name;
      }
    }
  }
  
  // Construire le champ name au format "titre (client)" si nécessaire
  let displayName = ticketData.name || '';
  
  // Si nous n'avons pas de "name" combiné mais que nous avons titre et client séparément
  if (!displayName && ticketData.title) {
    displayName = ticketData.title;
    
    // Ajouter le nom du client entre parenthèses s'il existe
    if (clientData) {
      displayName += ` (${clientData})`;
    } else if (ticketData.client_name) {
      displayName += ` (${ticketData.client_name})`;
    }
  }
  
  logger.info(`[DASHBOARD] Ticket reçu: id=${ticketData.id}, name=${ticketData.name || 'non défini'}, title=${ticketData.title || 'non défini'}, client=${clientData || ticketData.client_name || 'non défini'}`);
  
  const ticket: RecentTicket = {
    ...ticketData,
    name: displayName || 'Sans titre'
  }
  
  logger.info(`[DASHBOARD] Ticket formaté`, { ticket_id: ticket.id })

  // Action selon le type de mise à jour
  switch (action) {
    case 'create':
      // Ajouter le nouveau ticket au début de la liste
      if (!recentTickets.value.some(t => t.id === ticket.id)) {
        recentTickets.value.unshift(ticket)
        // Limiter la liste à 5 tickets maximum
        if (recentTickets.value.length > 5) {
          recentTickets.value.pop()
        }
        logger.info('[DASHBOARD] Nouveau ticket ajouté à la liste')
      }
      break

    case 'update':
      // Mettre à jour le ticket existant s'il est dans la liste
      const ticketIndex = recentTickets.value.findIndex(t => t.id === ticket.id)
      if (ticketIndex !== -1) {
        recentTickets.value[ticketIndex] = { ...recentTickets.value[ticketIndex], ...ticket }
        logger.info('[DASHBOARD] Ticket existant mis à jour dans la liste')
      }
      break

    case 'delete':
      // Supprimer le ticket de la liste
      const initialTicketLength = recentTickets.value.length
      recentTickets.value = recentTickets.value.filter(t => t.id !== ticket.id)
      if (recentTickets.value.length < initialTicketLength) {
        logger.info('[DASHBOARD] Ticket supprimé de la liste')
        // Charger un nouveau ticket pour remplacer celui supprimé
        dashboardStore.fetchRecentTickets(1).then((newTickets: RecentTicket[]) => {
          if (newTickets.length > 0 && !recentTickets.value.some(t => t.id === newTickets[0].id)) {
            recentTickets.value.push(newTickets[0])
          }
        })
      }
      break
  }
}

// Fonction pour animer la mise à jour d'un compteur
const animateCounterUpdate = (ref: any, newValue: number) => {
  // Vérifier si la valeur a réellement changé
  if (ref.value === newValue) return;
  
  // Trouver les éléments correspondants par attributs data
  let selector;
  
  if (ref === totalClients.value) {
    selector = '[data-type="clients"]';
  } else if (ref === totalServices.value) {
    selector = '[data-type="services"]';
  } else if (ref === totalTickets.value) {
    selector = '[data-type="tickets"]';
  } else if (ref === revenue.value) {
    selector = '[data-type="revenue"]';
  }
  
  if (selector) {
    const element = document.querySelector(selector);
    
    if (element) {
      // Ajouter une classe pour l'animation
      element.classList.add('stat-update-animation');
      
      // Retirer la classe après l'animation
      setTimeout(() => {
        element.classList.remove('stat-update-animation');
      }, 1000);
    }
  }
  
  // Mettre à jour la valeur
  ref.value = newValue;
}

// Charger les données
onMounted(async () => {
  try {
    await Promise.all([
      dashboardStore.fetchStats(),
      dashboardStore.fetchActivity()
    ])
    // Utiliser les statistiques des clients et services actifs
    totalClients.value = dashboardStore.stats.clients.active
    totalServices.value = dashboardStore.stats.services.active
    totalTickets.value = dashboardStore.stats.tickets.total
    // Récupérer les revenus mensuels depuis l'API si disponibles
    revenue.value = dashboardStore.stats.revenue?.monthly || 0
    recentClients.value = dashboardStore.activity.clients
    recentTickets.value = dashboardStore.activity.tickets
    
    // S'abonner aux mises à jour en temps réel une fois les données initiales chargées
    subscribeToStatsUpdates()
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

// Nettoyer les abonnements lors de la destruction du composant
onUnmounted(() => {
  logger.info('[DASHBOARD] Nettoyage des abonnements temps réel')
  subscriptions.value.forEach(subscription => {
    if (typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe()
    }
  })
  subscriptions.value = []
})

// Utilitaires
function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value ?? 0)
}

function formatDate(date: string | null | undefined): string {
  if (!date) return ''
  // S'assurer que la date est correctement parsée (format YYYY-MM-DD HH:MM:SS)
  const dateParts = date.split(/[- :]/); // Diviser par tiret, espace ou deux-points
  // Année, mois (0-indexed), jour, heure, minute, seconde
  const dateObj = new Date(Date.UTC(+dateParts[0], +dateParts[1]-1, +dateParts[2], 
    +dateParts[3], +dateParts[4], +dateParts[5]));
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

function getStatusClass(status: string | null | undefined): string {
  if (!status) return 'status-badge status-default'
  const classes: Record<string, string> = {
    active: 'status-badge status-success',
    pending: 'status-badge status-warning',
    suspended: 'status-badge status-danger',
    open: 'status-badge status-info',
    in_progress: 'status-badge status-warning',
    resolved: 'status-badge status-success',
    closed: 'status-badge status-secondary'
  }
  return classes[status] || 'status-badge status-default'
}

// Note: Nous utilisons maintenant la fonction getStatusClass
// pour tous les statuts (clients et tickets)
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS */
@import '@/assets/css/pages/dashboard.css';

/* Styles pour la liste de clients */
.client-list {
  padding: 0;
}

.client-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  margin-bottom: 0.75rem;
  border-radius: 16px;
  background: rgb(16 20 35 / 15%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 8%);
  box-shadow: 0 8px 20px 0 rgb(0 102 255 / 10%);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.client-item::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgb(0 102 255 / 5%), transparent);
  transform: rotate(45deg);
  transition: transform 0.6s ease;
}

.client-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px 0 rgb(0 102 255 / 15%);
}

.client-item:hover::after {
  transform: rotate(45deg) translate(50%, 50%);
}

.client-info {
  display: flex;
  align-items: center;
}

.client-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #06F, #00C6FF);
  margin-right: 1.25rem;
  color: #fff;
  font-size: 1.5rem;
  box-shadow: 0 4px 15px rgb(0 102 255 / 30%);
  border: 2px solid rgb(255 255 255 / 10%);
}

.client-details {
  display: flex;
  flex-direction: column;
}

.client-name {
  font-weight: 700;
  margin-bottom: 0.25rem;
  font-size: 1.05rem;
}

.client-name a {
  color: var(--text-color);
  text-decoration: none;
  background: linear-gradient(135deg, #06F, #5F9FFF);
  background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.2s;
}

.client-name a:hover {
  opacity: 0.9;
}

.client-email {
  font-size: 0.875rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.client-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.client-date {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.client-status {
  font-size: 0.875rem;
}

.status-badge {
  padding: 0.35rem 1rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 3px 10px rgb(0 0 0 / 10%);
  backdrop-filter: blur(5px);
  border: 1px solid rgb(255 255 255 / 10%);
}

.status-success {
  background: linear-gradient(135deg, rgb(0 184 125 / 20%), rgb(0 184 125 / 10%));
  color: #00b87d;
  border-color: rgb(0 184 125 / 30%);
}

.status-warning {
  background: linear-gradient(135deg, rgb(255 153 0 / 20%), rgb(255 153 0 / 10%));
  color: #f90;
  border-color: rgb(255 153 0 / 30%);
}

.status-danger {
  background: linear-gradient(135deg, rgb(255 75 75 / 20%), rgb(255 75 75 / 10%));
  color: #ff4b4b;
  border-color: rgb(255 75 75 / 30%);
}

.no-clients {
  text-align: center;
  padding: 2rem 0;
  color: var(--text-muted);
}

/* Animation pour les mises à jour en temps réel */
@keyframes pulse-update {
  0% {
    box-shadow: 0 0 0 0 rgb(59 130 246 / 70%);
  }

  70% {
    box-shadow: 0 0 0 10px rgb(59 130 246 / 0%);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(59 130 246 / 0%);
  }
}

.stat-update-animation {
  animation: pulse-update 1s ease-out;
}
</style>
