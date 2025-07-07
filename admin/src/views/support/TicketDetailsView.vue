<template>
  <div class="ticket-details-view view-container">
    <!-- En-tête avec navigation -->
    <div class="header-box">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/tickets" class="breadcrumb-link">
            <i class="fas fa-arrow-left"></i>
            {{ t('tickets.title') }}
          </router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">
            {{ t('tickets.details_title', { id: ticketId }) }}
          </span>
        </div>
        <h1 class="page-title">
          {{ t('tickets.details_title', { id: ticketId }) }}
        </h1>
        <span class="page-description">
          {{ t('tickets.details_description') }}
        </span>
      </div>
      <div class="header-actions">
        <button 
          v-if="ticket && (ticket.status === 'closed' || ticket.status === 'resolved')" 
          class="btn btn-success" 
          @click="reopenTicket"
        >
          <i class="fas fa-redo"></i>
          {{ t('tickets.actions.reopen') }}
        </button>
        <button 
          v-else-if="ticket && ticket.status !== 'closed'" 
          class="btn btn-warning" 
          @click="closeTicket"
        >
          <i class="fas fa-check"></i>
          {{ t('tickets.actions.close') }}
        </button>
        <router-link 
          :to="`/tickets/${ticketId}/edit`" 
          class="btn btn-primary"
        >
          <i class="fas fa-edit"></i>
          {{ t('tickets.actions.edit') }}
        </router-link>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-if="loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="!ticket" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3 class="empty-title">{{ t('tickets.not_found.title') }}</h3>
      <p class="empty-description">{{ t('tickets.not_found.description') }}</p>
    </div>

    <div v-else class="details-grid">
      <!-- Informations principales -->
      <div class="details-card">
        <h3 class="card-title">{{ t('tickets.details.main_info') }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">{{ t('tickets.details.id') }}</label>
            <span class="info-value">#{{ ticket.id }}</span>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('tickets.details.status') }}</label>
            <div class="status-badge" :class="ticket.status">
              {{ getStatusLabel(ticket.status) }}
            </div>
          </div>

          <div class="detail-row">
            <span class="detail-label">{{ t('tickets.details.priority') }}:</span>
            <div class="priority-badge" :class="ticket.priority">
              {{ getPriorityLabel(ticket.priority) }}
            </div>
          </div>
          <div class="info-item">
            <label class="info-label">{{ t('tickets.details.created_at') }}</label>
            <span class="info-value">{{ formatDateTime(ticket.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Informations client et assignation -->
      <div class="details-card">
        <h3 class="card-title">{{ t('tickets.details.client_assignment') }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">{{ t('tickets.details.client') }}</label>
            <router-link 
              :to="`/clients/${ticket.client_id}`" 
              class="info-link"
            >
              {{ ticket.client_name }}
            </router-link>
          </div>
          <div v-if="ticket.department_name" class="info-item">
            <label class="info-label">{{ t('tickets.details.department') }}</label>
            <span class="info-value">{{ ticket.department_name }}</span>
          </div>
          <div v-if="ticket.assigned_to_name" class="info-item">
            <label class="info-label">{{ t('tickets.details.assigned_to') }}</label>
            <span class="info-value">{{ ticket.assigned_to_name }}</span>
          </div>
          <div v-if="ticket.service_name" class="info-item">
            <label class="info-label">{{ t('tickets.details.related_service') }}</label>
            <span class="info-value">{{ ticket.service_name }}</span>
          </div>
        </div>
      </div>

      <!-- Sujet et message principal -->
      <div class="details-card full-width">
        <h3 class="card-title">{{ t('tickets.details.subject') }}</h3>
        <div class="subject-content">
          <h4 class="ticket-subject">{{ ticket.subject }}</h4>
          <div class="ticket-message">
            <div class="message-header">
              <span class="message-author">{{ ticket.client_name }}</span>
              <span class="message-date">{{ formatDateTime(ticket.created_at) }}</span>
            </div>
            <div class="message-content">
              <p>{{ ticket.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Réponses -->
      <div v-if="ticket.replies && ticket.replies.length" class="details-card full-width">
        <h3 class="card-title">{{ t('tickets.details.replies') }} ({{ ticket.replies.length }})</h3>
        <div class="replies-list">
          <div v-for="reply in ticket.replies" :key="reply.id" class="reply-item">
            <div class="reply-header">
              <div class="reply-author">
                <i :class="reply.is_staff ? 'fas fa-user-tie' : 'fas fa-user'"></i>
                <span class="author-name">{{ reply.author_name }}</span>
                <span v-if="reply.is_staff" class="staff-badge">{{ t('tickets.staff') }}</span>
              </div>
              <span class="reply-date">{{ formatDateTime(reply.created_at) }}</span>
            </div>
            <div class="reply-content">
              <p>{{ reply.message }}</p>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <PaginationComponent
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total="totalMessages"
          :per-page="perPage"
          @page-change="handlePageChange"
        />
      </div>

      <!-- Nouvelle réponse -->
      <div class="details-card full-width">
        <h3 class="card-title">{{ t('tickets.details.add_reply') }}</h3>
        <form class="reply-form" @submit.prevent="addReply">
          <div class="form-group">
            <textarea 
              v-model="newReply" 
              class="form-input" 
              rows="4"
              :placeholder="t('tickets.details.reply_placeholder')"
              required
            ></textarea>
          </div>
          <div class="reply-actions">
            <div class="reply-options">
              <label class="checkbox-wrapper">
                <input v-model="notifyClient" type="checkbox" class="form-checkbox">
                <span class="checkbox-label">{{ t('tickets.details.notify_client') }}</span>
              </label>
              <label class="checkbox-wrapper">
                <input v-model="closeAfterReply" type="checkbox" class="form-checkbox">
                <span class="checkbox-label">{{ t('tickets.details.close_after_reply') }}</span>
              </label>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="!newReply.trim() || submitting">
              <i class="fas fa-reply"></i>
              {{ t('tickets.details.send_reply') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Tags -->
      <div v-if="ticket.tags && ticket.tags.length" class="details-card">
        <h3 class="card-title">{{ t('tickets.details.tags') }}</h3>
        <div class="tags-list">
          <span v-for="tag in ticket.tags" :key="tag" class="tag-item">
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Notes internes -->
      <div v-if="ticket.internal_notes" class="details-card">
        <h3 class="card-title">{{ t('tickets.details.internal_notes') }}</h3>
        <div class="notes-content">
          <p>{{ ticket.internal_notes }}</p>
        </div>
      </div>

      <!-- Historique -->
      <div class="details-card full-width">
        <h3 class="card-title">{{ t('tickets.details.history') }}</h3>
        <div class="history-timeline">
          <div class="timeline-item">
            <div class="timeline-marker created"></div>
            <div class="timeline-content">
              <h4>{{ t('tickets.history.created') }}</h4>
              <p>{{ formatDateTime(ticket.created_at) }}</p>
            </div>
          </div>
          <div v-if="ticket.updated_at !== ticket.created_at" class="timeline-item">
            <div class="timeline-marker updated"></div>
            <div class="timeline-content">
              <h4>{{ t('tickets.history.updated') }}</h4>
              <p>{{ formatDateTime(ticket.updated_at) }}</p>
            </div>
          </div>
          <div v-if="ticket.last_reply" class="timeline-item">
            <div class="timeline-marker replied"></div>
            <div class="timeline-content">
              <h4>{{ t('tickets.history.last_reply') }}</h4>
              <p>{{ formatDateTime(ticket.last_reply) }}</p>
            </div>
          </div>
          <div v-if="ticket.status === 'closed' && ticket.closed_at" class="timeline-item">
            <div class="timeline-marker closed"></div>
            <div class="timeline-content">
              <h4>{{ t('tickets.history.closed') }}</h4>
              <p>{{ formatDateTime(ticket.closed_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTicketStore } from '@/stores/tickets'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import logger from '@/services/logger'
import PaginationComponent from '@/components/common/PaginationComponent.vue'
import * as ablyService from '@/services/ably'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const ticketStore = useTicketStore()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()

// État
const loading = ref(false)
const submitting = ref(false)
const newReply = ref('')
const notifyClient = ref(true)
const closeAfterReply = ref(false)

// Pagination state
const currentPage = ref(1)
const totalPages = ref(1)
const totalMessages = ref(0)
const perPage = ref(7)

// Variables temps réel ticket spécifique
const ticketChannelSubscription = ref<(() => void) | null>(null)

// Computed
const ticketId = computed(() => route.params.id as string)
// Propriété calculée pour accéder au ticket courant (comme dans ClientDetailView)
const ticket = computed(() => ticketStore.currentTicket)

// Méthodes
const getTicketData = async (page: number = 1) => {
  try {
    loading.value = true
    const result = await ticketStore.getTicket(parseInt(ticketId.value), page, perPage.value)

    // Mettre à jour currentTicket dans le store (comme dans ClientDetailView)
    ticketStore.$patch({
      currentTicket: result
    })

    // Mettre à jour les informations de pagination si disponibles
    if (result?.pagination) {
      currentPage.value = result.pagination.current_page
      totalPages.value = result.pagination.total_pages
      totalMessages.value = result.pagination.total
    }

    logger.debug('[admin-frontend] Ticket récupéré', { ticket: result, pagination: result?.pagination })
  } catch (error) {
    logger.error('Erreur lors du chargement du ticket', { ticketId: ticketId.value, error });
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('tickets.errors.load_failed')
    })
    router.push('/tickets')
  } finally {
    loading.value = false
  }
}

const addReply = async () => {
  if (!newReply.value.trim()) return

  submitting.value = true
  try {
    logger.debug('[TicketDetails] Ajout de réponse admin', {
      ticketId: ticketId.value,
      message: newReply.value,
      notifyClient: notifyClient.value,
      closeAfterReply: closeAfterReply.value
    });

    // Utiliser la méthode du store pour ajouter la réponse
    logger.info('[ADMIN TICKET] Avant addReply - État currentTicket', {
      hasCurrentTicket: !!ticketStore.currentTicket,
      currentTicketId: ticketStore.currentTicket?.id,
      repliesCount: ticketStore.currentTicket?.replies?.length || 0
    })

    const replyResult = await ticketStore.addReply(parseInt(ticketId.value), {
      message: newReply.value,
      user_id: authStore.user.id,
      user_type: 'admin'
    })

    logger.info('[ADMIN TICKET] Après addReply - État currentTicket', {
      hasCurrentTicket: !!ticketStore.currentTicket,
      currentTicketId: ticketStore.currentTicket?.id,
      repliesCount: ticketStore.currentTicket?.replies?.length || 0,
      replyResult: !!replyResult,
      ticketComputedReplies: ticket.value?.replies?.length || 0
    })

    // Forcer la réactivité Vue.js si nécessaire
    if (replyResult && ticketStore.currentTicket) {
      // Déclencher la réactivité en forçant une nouvelle référence
      await nextTick()
      logger.info('[ADMIN TICKET] Réactivité forcée avec nextTick', {
        ticketRepliesAfterNextTick: ticket.value?.replies?.length || 0
      })
    }

    // Réinitialiser le formulaire
    newReply.value = ''
    notifyClient.value = false
    closeAfterReply.value = false

    // Mise à jour optimisée sans rechargement complet (géré par événement temps réel)
    // await getTicketData(currentPage.value) // Supprimé pour éviter rechargement inutile
    logger.info('[ADMIN TICKET] Réponse envoyée, mise à jour via événement temps réel')

    // Fermer le ticket si demandé
    if (closeAfterReply.value) {
      await ticketStore.closeTicket(parseInt(ticketId.value))
    }

    logger.debug('[TicketDetails] Réponse ajoutée avec succès')
  } catch (error) {
    logger.error('[TicketDetails] Erreur lors de l\'ajout de la réponse', {
      ticketId: ticketId.value,
      error
    });
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('tickets.errors.reply_failed')
    })
  } finally {
    submitting.value = false
  }
}

const closeTicket = async () => {
  if (confirm(t('tickets.confirm_close'))) {
    try {
      await ticketStore.closeTicket(parseInt(ticketId.value))
      await getTicketData() // Recharger les données
      notificationStore.addNotification({
        type: 'success',
        title: t('common.success'),
        message: t('tickets.success.closed')
      })
    } catch (error) {
      logger.error('Erreur lors de la fermeture du ticket', { ticketId: ticketId.value, error });
      notificationStore.addNotification({
        type: 'error',
        title: t('common.error'),
        message: t('tickets.errors.close_failed')
      })
    }
  }
}

const reopenTicket = async () => {
  try {
    await ticketStore.reopenTicket(parseInt(ticketId.value))
    await getTicketData() // Recharger les données
    notificationStore.addNotification({
      type: 'success',
      title: t('common.success'),
      message: t('tickets.success.reopened')
    })
  } catch (error) {
    logger.error('Erreur lors de la réouverture du ticket', { ticketId: ticketId.value, error });
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('tickets.errors.reopen_failed')
    })
  }
}

const formatDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('fr-FR')
}

const getStatusLabel = (status: string) => {
  const statuses: Record<string, string> = {
    'open': t('tickets.status.open'),
    'pending': t('tickets.status.pending'),
    'resolved': t('tickets.status.resolved'),
    'closed': t('tickets.status.closed')
  }
  
  return (status in statuses) ? statuses[status] : status
}

const getPriorityLabel = (priority: string) => {
  const priorities: Record<string, string> = {
    'low': t('tickets.priority.low'),
    'medium': t('tickets.priority.medium'),
    'high': t('tickets.priority.high'),
    'urgent': t('tickets.priority.urgent')
  }
  
  return (priority in priorities) ? priorities[priority] : priority
}

// Initialiser les écouteurs en temps réel
const initRealtime = () => {
  logger.debug('[admin-frontend] Initialisation des écouteurs temps réel pour les tickets')
  
  // Initialiser les écouteurs temps réel pour les tickets
  if (!ticketStore.realtimeInitialized) {
    ticketStore.initRealtimeListeners()
    logger.info('[admin-frontend] Écouteurs temps réel initialisés pour les tickets')
  }
  
  // IMPORTANT: Le watcher doit être défini à l'intérieur de cette fonction
  // pour s'assurer qu'il est créé au bon moment, après l'initialisation des écouteurs
  watch(() => ticketStore.lastRealtimeEvent, (newEvent: any) => {
    if (!newEvent) return
    
    logger.info('[admin-frontend] DIAGNOSTIC - Watcher déclenché sur lastRealtimeEvent', { 
      hasNewEvent: !!newEvent,
      currentTicketId: ticketId.value,
      newEventTicketId: newEvent?.ticket?.id,
      actionType: newEvent?.action,
      time: new Date().toISOString()
    })
    
    // Vérifier que l'événement concerne le ticket actuellement affiché
    if (newEvent && ticketId.value && newEvent.ticket && newEvent.ticket.id === ticketId.value) {
      logger.info('[admin-frontend] Événement temps réel détecté pour le ticket courant', { 
        action: newEvent.action,
        ticketId: ticketId.value
      })
      
      // Traitement de l'événement selon son type
      if (newEvent.action === 'delete') {
        // Si le ticket a été supprimé, rediriger vers la liste des tickets
        notificationStore.addNotification({
          type: 'warning',
          title: t('common.info'),
          message: t('tickets.realtime.deleted', { fallback: 'Ce ticket a été supprimé' })
        })
        router.push('/tickets')
      } else if (['update', 'reply', 'status_change'].includes(newEvent.action)) {
        // Mise à jour directe du ticket courant sans requête API supplémentaire
        logger.info(`[admin-frontend] Mise à jour directe du ticket #${ticketId.value} depuis l'événement ${newEvent.action}`)
        
        if (newEvent.ticket && Object.keys(newEvent.ticket).length > 0) {
          // Mettre à jour directement le ticket courant avec les données temps réel
          ticketStore.currentTicket = newEvent.ticket;
          logger.info(`[admin-frontend] Ticket #${ticketId.value} mis à jour directement depuis les données temps réel`)
          
          notificationStore.addNotification({
            type: 'info',
            title: t('common.info'),
            message: t('tickets.realtime.updated', { fallback: 'Ce ticket a été mis à jour' })
          })
        } else {
          // Si par hasard les données complètes ne sont pas disponibles, fallback sur l'ancienne méthode
          logger.warn(`[admin-frontend] Données incomplètes dans l'événement, rechargement complet nécessaire`)
          getTicketData()
        }
      }
    }
  }, { deep: true })
}

const handlePageChange = async (page: number) => {
  await getTicketData(page)
  // Scroll vers le haut des réponses
  const repliesElement = document.querySelector('.details-card.full-width')
  if (repliesElement) {
    repliesElement.scrollIntoView({ behavior: 'smooth' })
  }
}

// Initialisation abonnement canal ticket spécifique
const initTicketChannelSubscription = () => {
  const currentTicketId = ticketId.value
  if (!currentTicketId) return

  // Désabonner de l'ancien canal si nécessaire
  if (ticketChannelSubscription.value) {
    ticketChannelSubscription.value()
    ticketChannelSubscription.value = null
  }

  // S'abonner aux événements du canal ticket spécifique
  const unsubscribeReply = ablyService.subscribeToTicketChannel(currentTicketId, 'ticket-reply', (data) => {
    logger.info('[ADMIN TICKET] Nouvelle réponse reçue via canal ticket', { data })
    handleTicketChannelEvent(data, 'reply')
  })

  const unsubscribeStatusChange = ablyService.subscribeToTicketChannel(currentTicketId, 'ticket-status-change', (data) => {
    logger.info('[ADMIN TICKET] Changement statut reçu via canal ticket', { data })
    handleTicketChannelEvent(data, 'status_change')
  })

  const unsubscribeUpdate = ablyService.subscribeToTicketChannel(currentTicketId, 'ticket-update', (data) => {
    logger.info('[ADMIN TICKET] Mise à jour reçue via canal ticket', { data })
    handleTicketChannelEvent(data, 'update')
  })

  // Fonction de désabonnement combinée
  ticketChannelSubscription.value = () => {
    unsubscribeReply()
    unsubscribeStatusChange()
    unsubscribeUpdate()
  }

  logger.info('[ADMIN TICKET] Abonnement canal ticket activé', { ticketId: currentTicketId })
}

// Gestionnaire d'événements canal ticket
const handleTicketChannelEvent = (data: any, eventType: string) => {
  // Éviter de traiter nos propres événements
  if (data.author?.type === 'admin') {
    logger.debug('[ADMIN TICKET] Événement admin ignoré (éviter boucle)', { eventType })
    return
  }

  switch (eventType) {
    case 'reply':
      // Mise à jour dynamique sans rechargement complet
      // Recharger seulement les messages de la page courante
      ticketStore.getTicket(parseInt(ticketId.value), currentPage.value, perPage.value)
      notificationStore.addNotification({
        type: 'info',
        title: 'Nouvelle réponse',
        message: `Nouvelle réponse de ${data.author?.name || 'Client'}`
      })
      logger.info('[ADMIN TICKET] Mise à jour dynamique après nouvelle réponse client')
      break
    case 'status_change':
      // Mise à jour directe du statut sans rechargement complet
      if (data.ticket && ticketStore.currentTicket) {
        ticketStore.currentTicket.status = data.ticket.status
      }
      notificationStore.addNotification({
        type: 'info',
        title: 'Statut modifié',
        message: `Statut changé par ${data.author?.name || 'Client'}`
      })
      logger.info('[ADMIN TICKET] Mise à jour dynamique statut sans rechargement')
      break
    case 'update':
      // Mise à jour sélective pour les changements généraux
      if (data.ticket && ticketStore.currentTicket) {
        // Mettre à jour seulement les champs modifiés
        Object.assign(ticketStore.currentTicket, data.ticket)
      }
      logger.info('[ADMIN TICKET] Mise à jour dynamique données ticket')
      break
  }
}

// Lifecycle
onMounted(() => {
  getTicketData()
  initRealtime()

  // Initialiser l'abonnement au canal ticket après chargement des données
  setTimeout(() => {
    initTicketChannelSubscription()
  }, 1000)

  logger.info('[admin-frontend] Vue détails ticket initialisée')
})

onUnmounted(() => {
  // Nettoyer l'abonnement au canal ticket
  if (ticketChannelSubscription.value) {
    ticketChannelSubscription.value()
    ticketChannelSubscription.value = null
  }
})
</script>

<style scoped>
@import '@/assets/css/components/common-layout.css';

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.details-card {
  background: var(--card-background);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.details-card.full-width {
  grid-column: 1 / -1;
}

.card-title {
  margin: 0 0 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.info-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}

.info-link:hover {
  text-decoration: underline;
}

.status-badge, .priority-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.ticket-subject {
  margin: 0 0 1rem;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.ticket-message {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.message-header {
  background: var(--background-secondary);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-author {
  font-weight: 600;
  color: var(--text-primary);
}

.message-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.message-content {
  padding: 1rem;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reply-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.reply-header {
  background: var(--background-secondary);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reply-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-name {
  font-weight: 600;
}

.staff-badge {
  background: var(--primary-color);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.reply-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.reply-content {
  padding: 1rem;
}

.reply-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reply-options {
  display: flex;
  gap: 1rem;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-checkbox {
  width: 16px;
  height: 16px;
}

.checkbox-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.notes-content {
  background: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid var(--warning-color);
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.timeline-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.timeline-marker.created {
  background-color: var(--success-color);
}

.timeline-marker.updated {
  background-color: var(--warning-color);
}

.timeline-marker.replied {
  background-color: var(--primary-color);
}

.timeline-marker.closed {
  background-color: var(--error-color);
}

.timeline-content h4 {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.timeline-content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.breadcrumb-link {
  color: var(--primary-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: var(--text-secondary);
}

.breadcrumb-current {
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

@media (width <= 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .reply-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .reply-options {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
