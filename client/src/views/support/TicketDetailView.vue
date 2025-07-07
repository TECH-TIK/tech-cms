<template>
  <div id="ticket-detail">
    <!-- Header Section -->
    <div class="ticket-detail-header">
      <div class="header-content">
        <button class="btn btn-outline btn-sm back-btn" @click="goBack">
          <i class="fas fa-arrow-left"></i>
          Retour au support
        </button>
        <div class="ticket-title-section">
          <div class="ticket-icon-large">
            <i class="fas fa-headset"></i>
          </div>
          <div class="ticket-info">
            <h1>{{ ticket?.title || 'Chargement...' }}</h1>
            <div class="ticket-meta">
              <span class="ticket-id">Ticket #{{ ticket?.id }}</span>
              <span :class="getStatusClass(ticket?.status)">
                {{ getStatusLabel(ticket?.status) }}
              </span>
              <span :class="getPriorityClass(ticket?.priority)">
                {{ getPriorityLabel(ticket?.priority) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="ticket-actions">
        <button 
          v-if="ticket?.status === 'open'" 
          class="btn btn-outline btn-sm" 
          @click="closeTicket"
        >
          <i class="fas fa-times"></i>
          Fermer le ticket
        </button>
        <button 
          v-if="ticket?.status === 'closed'" 
          class="btn btn-outline btn-sm" 
          @click="reopenTicket"
        >
          <i class="fas fa-redo"></i>
          Rouvrir le ticket
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement des détails du ticket...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="() => loadTicket()">
          <i class="fas fa-refresh"></i>
          Réessayer
        </button>
      </div>
    </div>

    <!-- Ticket Details -->
    <div v-else-if="ticket" class="ticket-content">
      <!-- Ticket Information -->
      <div class="ticket-info-section">
        <div class="info-card">
          <h2>
            <i class="fas fa-info-circle"></i>
            Informations du ticket
          </h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Numéro de ticket</label>
              <span class="ticket-number">#{{ ticket.id }}</span>
            </div>
            <div class="info-item">
              <label>Sujet</label>
              <span>{{ ticket.title }}</span>
            </div>
            <div class="info-item">
              <label>Statut</label>
              <span :class="getStatusClass(ticket.status)">
                {{ getStatusLabel(ticket.status) }}
              </span>
            </div>
            <div class="info-item">
              <label>Priorité</label>
              <span :class="getPriorityClass(ticket.priority)">
                {{ getPriorityLabel(ticket.priority) }}
              </span>
            </div>
            <div class="info-item">
              <label>Date de création</label>
              <span>{{ formatDate(ticket.created_at) }}</span>
            </div>
            <div class="info-item" v-if="ticket.updated_at !== ticket.created_at">
              <label>Dernière mise à jour</label>
              <span>{{ formatDate(ticket.updated_at) }}</span>
            </div>
            <!-- Département non disponible dans l'API actuelle -->
            <div class="info-item" style="display: none;">
              <label>Département</label>
              <span>Support général</span>
            </div>
            <div class="info-item" v-if="ticket.assigned_to">
              <label>Assigné à</label>
              <span>{{ ticket.assigned_to }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Conversation -->
      <div class="ticket-conversation">
        <div class="conversation-card">
          <h2>
            <i class="fas fa-comments"></i>
            Conversation
          </h2>
          <div class="conversation-list">
            <!-- Initial Message -->
            <div class="message-item client-message">
              <div class="message-avatar">
                <i class="fas fa-user"></i>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-author">Vous</span>
                  <span class="message-date">{{ formatDate(ticket.created_at) }}</span>
                </div>
                <div class="message-body">{{ ticket.message }}</div>
              </div>
            </div>

            <!-- Replies -->
            <div 
              v-for="reply in ticketReplies" 
              :key="reply.id" 
              :class="['message-item', reply.is_staff ? 'staff-message' : 'client-message']"
            >
              <div class="message-avatar">
                <i :class="reply.is_staff ? 'fas fa-user-tie' : 'fas fa-user'"></i>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-author">
                    {{ reply.is_staff ? (reply.author_name || 'Support') : 'Vous' }}
                  </span>
                  <span class="message-date">{{ formatDate(reply.created_at) }}</span>
                </div>
                <div class="message-body">{{ reply.message }}</div>
                <div v-if="reply.attachments && reply.attachments.length > 0" class="message-attachments">
                  <div v-for="attachment in reply.attachments" :key="attachment.id" class="attachment-item">
                    <i class="fas fa-paperclip"></i>
                    <a :href="attachment.url" target="_blank">{{ attachment.filename }}</a>
                  </div>
                </div>
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
      </div>

      <!-- Reply Form -->
      <div v-if="canReply" class="reply-form-section">
        <div class="reply-card">
          <h2>
            <i class="fas fa-reply"></i>
            Ajouter une réponse
          </h2>
          <form @submit.prevent="submitReply" class="reply-form">
            <div class="form-group">
              <label for="reply-message">Votre message</label>
              <textarea
                id="reply-message"
                v-model="replyForm.message"
                class="form-textarea"
                rows="6"
                placeholder="Tapez votre réponse ici..."
                required
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="reply-attachments">Pièces jointes (optionnel)</label>
              <input
                id="reply-attachments"
                type="file"
                multiple
                @change="handleFileUpload"
                class="form-file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              <div class="file-info">
                Formats acceptés: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (max 10MB par fichier)
              </div>
            </div>

            <div v-if="selectedFiles.length > 0" class="selected-files">
              <h4>Fichiers sélectionnés:</h4>
              <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                <i class="fas fa-file"></i>
                <span>{{ file.name }}</span>
                <button type="button" @click="removeFile(index)" class="remove-file">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="resetReplyForm">
                <i class="fas fa-times"></i>
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submitting || !replyForm.message.trim()">
                <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-paper-plane"></i>
                {{ submitting ? 'Envoi...' : 'Envoyer la réponse' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Closed Ticket Notice -->
      <div v-else class="closed-notice">
        <div class="notice-card">
          <i class="fas fa-info-circle"></i>
          <h3>Ticket fermé</h3>
          <p>Ce ticket a été fermé. Pour ajouter une réponse, vous devez d'abord le rouvrir.</p>
          <button class="btn btn-primary" @click="reopenTicket">
            <i class="fas fa-redo"></i>
            Rouvrir le ticket
          </button>
        </div>
      </div>
    </div>

    <!-- Notification temps réel -->
    <div v-if="showRealtimeNotification" class="realtime-notification">
      <div class="realtime-notification-content">
        <i class="fas fa-bell"></i>
        <span>{{ realtimeNotificationMessage }}</span>
        <button @click="showRealtimeNotification = false" class="close-notification">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiService } from '@/services/api'
import logger from '@/services/logger'
import type { Ticket } from '@/types/api'
import type { TicketReply, ClientReplyForm } from '@/types/ticket-replies'
import type { RealtimeEvent } from '@/types/realtime'
import PaginationComponent from '@/components/common/PaginationComponent.vue'
import { useRealtimeStore } from '@/stores/realtime'

// Router
const route = useRoute()
const router = useRouter()

// Store temps réel
const realtimeStore = useRealtimeStore()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)
const ticket = ref<Ticket | null>(null)
const ticketReplies = ref<TicketReply[]>([])
const selectedFiles = ref<File[]>([])

// Pagination state
const currentPage = ref(1)
const totalPages = ref(1)
const totalMessages = ref(0)
const perPage = ref(7)

const replyForm = ref<ClientReplyForm>({
  message: '',
  attachments: []
})

// Variables temps réel
const realtimeSubscription = ref<(() => void) | null>(null)
const showRealtimeNotification = ref(false)
const realtimeNotificationMessage = ref('')

// Computed
const canReply = computed(() => {
  if (!ticket.value) return false
  // Les statuts qui permettent de répondre
  return ['open', 'answered', 'customer-reply'].includes(ticket.value.status)
})

// Methods
const goBack = () => {
  router.push('/support')
}

const loadTicket = async (page: number = 1) => {
  try {
    loading.value = true
    error.value = null

    const ticketId = parseInt(route.params.id as string)
    if (!ticketId) {
      throw new Error('ID de ticket invalide')
    }

    // Charger les détails du ticket
    const response = await ApiService.routes.client.ticket.getById(ticketId)
    ticket.value = response.data

    // Charger les messages/réponses du ticket avec pagination
    try {
      const messagesResponse = await ApiService.routes.client.ticket.getMessages(ticketId, {
        page,
        per_page: perPage.value
      })

      // Adapter à la nouvelle structure API {data: messages, pagination: {...}}
      ticketReplies.value = messagesResponse.data?.data || []

      // Mettre à jour les informations de pagination
      if (messagesResponse.data?.pagination) {
        currentPage.value = messagesResponse.data.pagination.current_page
        totalPages.value = messagesResponse.data.pagination.total_pages
        totalMessages.value = messagesResponse.data.pagination.total
      }

      logger.info('[TICKET] Messages chargés avec succès', {
        ticketId,
        messagesCount: ticketReplies.value.length,
        pagination: messagesResponse.data?.pagination
      })
    } catch (messagesError: any) {
      logger.warn('[TICKET] Erreur lors du chargement des messages', { ticketId, error: messagesError })
      ticketReplies.value = []
    }

    logger.info('[TICKET] Ticket chargé avec succès', { ticketId: ticket.value?.id, title: ticket.value?.title })

  } catch (err: any) {
    logger.error('[TICKET] Erreur lors du chargement du ticket', { ticketId: route.params.id, error: err })
    error.value = err.response?.data?.message || 'Erreur lors du chargement du ticket'
  } finally {
    loading.value = false
  }
}

const submitReply = async () => {
  try {
    submitting.value = true

    const ticketId = parseInt(route.params.id as string)

    // Préparer les données de la réponse (JSON au lieu de FormData pour l'instant)
    const replyData = {
      message: replyForm.value.message.trim()
    }

    if (!replyData.message) {
      error.value = 'Le message ne peut pas être vide'
      return
    }

    logger.info('[TICKET] Envoi de la réponse', { ticketId, messageLength: replyData.message.length })

    // Envoyer la réponse via l'API
    const response = await ApiService.routes.client.ticket.addReply(ticketId, replyData)

    logger.info('[TICKET] Réponse envoyée avec succès', { ticketId })

    // Réinitialiser le formulaire immédiatement pour une meilleure UX
    resetReplyForm()

    // Afficher un message de succès
    logger.info('[TICKET] Réponse ajoutée avec succès', { ticketId })

    // Ajouter immédiatement le message à la liste locale pour affichage instantané
    if (response.data && response.data.reply && ticket.value && ticketReplies.value) {
      // Insérer au début car l'ordre API est DESC (plus récent en premier)
      ticketReplies.value.unshift(response.data.reply)
      logger.info('[TICKET] Message ajouté à la liste locale pour affichage immédiat (ordre chronologique)', {
        ticketId,
        replyId: response.data.reply.id,
        totalReplies: ticketReplies.value.length,
        insertionMethod: 'unshift (début de liste)'
      })
    } else {
      // Fallback: rechargement seulement si pas de données de réponse
      logger.warn('[TICKET] Pas de données de réponse, rechargement nécessaire')
      await loadTicket(currentPage.value)
    }

  } catch (err: any) {
    logger.error('[TICKET] Erreur lors de l\'envoi de la réponse', { ticketId: ticket.value?.id, error: err })

    // Gestion d'erreurs détaillée
    if (err.response?.status === 401) {
      error.value = 'Vous devez être connecté pour répondre à un ticket'
    } else if (err.response?.status === 404) {
      error.value = 'Ticket non trouvé'
    } else if (err.response?.status === 400) {
      error.value = err.response?.data?.message || 'Données invalides'
    } else {
      error.value = err.response?.data?.message || 'Erreur lors de l\'envoi de la réponse'
    }
  } finally {
    submitting.value = false
  }
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = Array.from(target.files)
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const resetReplyForm = () => {
  replyForm.value.message = ''
  selectedFiles.value = []
  const fileInput = document.getElementById('reply-attachments') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

const closeTicket = async () => {
  try {
    const ticketId = parseInt(route.params.id as string)
    await ApiService.routes.client.ticket.close(ticketId)
    await loadTicket()
  } catch (err: any) {
    logger.error('[TICKET] Erreur lors de la fermeture du ticket', { ticketId: route.params.id, error: err })
  }
}

const reopenTicket = async () => {
  try {
    const ticketId = parseInt(route.params.id as string)
    await ApiService.routes.client.ticket.reopen(ticketId)
    await loadTicket()
  } catch (err: any) {
    logger.error('[TICKET] Erreur lors de la réouverture du ticket', { ticketId: route.params.id, error: err })
  }
}

const getStatusClass = (status?: string): string => {
  const classes: Record<string, string> = {
    'open': 'status-open',
    'answered': 'status-answered',
    'customer-reply': 'status-customer-reply',
    'closed': 'status-closed'
  }
  return classes[status || ''] || 'status-unknown'
}

const getStatusLabel = (status?: string): string => {
  const labels: Record<string, string> = {
    'open': 'Ouvert',
    'answered': 'Répondu',
    'customer-reply': 'En attente de réponse',
    'closed': 'Fermé'
  }
  return labels[status || ''] || 'Inconnu'
}

const getPriorityClass = (priority?: string): string => {
  const classes: Record<string, string> = {
    'low': 'priority-low',
    'medium': 'priority-medium',
    'high': 'priority-high',
    'urgent': 'priority-urgent'
  }
  return classes[priority || ''] || 'priority-unknown'
}

const getPriorityLabel = (priority?: string): string => {
  const labels: Record<string, string> = {
    'low': 'Faible',
    'medium': 'Moyenne',
    'high': 'Élevée',
    'urgent': 'Urgente'
  }
  return labels[priority || ''] || 'Inconnue'
}

const handlePageChange = async (page: number) => {
  await loadTicket(page)
  // Scroll vers le haut de la conversation
  const conversationElement = document.querySelector('.ticket-conversation')
  if (conversationElement) {
    conversationElement.scrollIntoView({ behavior: 'smooth' })
  }
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  })
}

// Initialisation temps réel
const initRealtimeForTicket = () => {
  const ticketId = parseInt(route.params.id as string)
  if (!ticketId || !realtimeStore.isReady) return

  // Désabonner de l'ancien ticket si nécessaire
  if (realtimeSubscription.value) {
    realtimeSubscription.value()
    realtimeSubscription.value = null
  }

  // S'abonner aux événements du ticket courant
  realtimeSubscription.value = realtimeStore.subscribeToTicket(ticketId)
  logger.info('[TICKET DETAIL] Abonnement temps réel activé', { ticketId })
}

// Watcher pour les événements temps réel
watch(() => realtimeStore.lastRealtimeEvent, (event: RealtimeEvent | null) => {
  if (!event || !ticket.value) return

  const currentTicketId = ticket.value.id

  // Accéder aux données ticket avec structure imbriquée Ably
  const eventTicketData = event.ticket?.ticket || event.ticket
  const eventTicketId = eventTicketData?.id

  // Diagnostic comparaison ID pour identifier problème type et structure
  logger.info('[TICKET DETAIL] Diagnostic comparaison ID événement', {
    eventStructure: {
      hasTicket: !!event.ticket,
      hasNestedTicket: !!(event.ticket?.ticket),
      eventTicketId: eventTicketId,
      eventTicketIdType: typeof eventTicketId
    },
    currentTicketId: currentTicketId,
    currentTicketIdType: typeof currentTicketId,
    idsEqual: eventTicketId == currentTicketId, // Comparaison souple
    idsStrictEqual: eventTicketId === currentTicketId, // Comparaison stricte
    willProcess: eventTicketId == currentTicketId,
    fullEventStructure: Object.keys(event)
  })

  // Utiliser comparaison souple pour éviter problème string vs number
  if (eventTicketId != currentTicketId) {
    logger.warn('[TICKET DETAIL] Événement ignoré - ID ticket différent', {
      eventTicketId: eventTicketId,
      currentTicketId: currentTicketId,
      eventStructure: 'Structure imbriquée détectée'
    })
    return
  }

  logger.info('[TICKET DETAIL] Événement temps réel reçu et traité', { event })

  switch (event.action) {
    case 'reply':
      handleRealtimeReply(event)
      break
    case 'status_change':
      handleRealtimeStatusChange(event)
      break
    case 'update':
      handleRealtimeUpdate(event)
      break
  }
})

// Gestionnaires d'événements temps réel
const handleRealtimeReply = async (event: RealtimeEvent) => {
  logger.info('[TICKET DETAIL] handleRealtimeReply appelé', {
    eventAuthor: event.author,
    authorType: event.author?.type,
    authorName: event.author?.name,
    currentPage: currentPage.value,
    totalPages: totalPages.value,
    hasTicketReplies: !!ticketReplies.value,
    repliesCount: ticketReplies.value?.length || 0,
    fullEvent: event // Log complet pour diagnostic
  })

  // Éviter de traiter nos propres événements pour éviter les rechargements inutiles
  if (event.author.type === 'client') {
    logger.debug('[TICKET DETAIL] Événement client ignoré (éviter boucle)', {
      event,
      authorType: event.author?.type,
      shouldIgnore: true
    })
    return
  }

  logger.info('[TICKET DETAIL] Événement admin détecté, traitement en cours', {
    authorType: event.author?.type,
    authorName: event.author?.name,
    willProcess: true
  })

  // Mise à jour dynamique sans rechargement complet
  // Ajouter le message localement sur toutes les pages (suppression condition restrictive)
  if (ticketReplies.value) {
    // Accéder aux données reply avec structure imbriquée Ably
    const eventReplyData = event.ticket?.reply || event.reply

    // Utiliser les vraies données de la réponse si disponibles, sinon message temporaire
    const adminMessage = eventReplyData ? {
      id: typeof eventReplyData.id === 'string' ? parseInt(eventReplyData.id) : eventReplyData.id,
      ticket_id: parseInt(route.params.id as string),
      user_id: typeof eventReplyData.user_id === 'string' ? parseInt(eventReplyData.user_id) : eventReplyData.user_id,
      message: eventReplyData.message,
      user_type: 'admin' as const,
      author_name: eventReplyData.author_name || event.author.name,
      is_staff: true,
      created_at: eventReplyData.created_at
    } : {
      id: Date.now(), // ID temporaire si pas de données réponse
      ticket_id: parseInt(route.params.id as string),
      user_id: event.author.id || 0,
      message: `Nouvelle réponse de ${event.author.name}`,
      user_type: 'admin' as const,
      author_name: event.author.name,
      is_staff: true,
      created_at: new Date().toISOString()
    }

    // Ajouter au début de la liste (ordre DESC)
    ticketReplies.value.unshift(adminMessage)
    totalMessages.value += 1

    // Forcer la réactivité Vue.js
    await nextTick()

    logger.info('[TICKET DETAIL] Message admin ajouté localement sans rechargement (toutes pages)', {
      authorName: event.author.name,
      totalMessages: totalMessages.value,
      newRepliesCount: ticketReplies.value.length,
      adminMessageAdded: adminMessage,
      ticketRepliesAfter: ticketReplies.value.slice(0, 3), // Premiers 3 messages pour debug
      reactivityForced: true,
      currentPage: currentPage.value,
      totalPages: totalPages.value,
      correctionApplied: 'Suppression condition pagination restrictive',
      hasReplyData: !!eventReplyData,
      replyData: eventReplyData || 'Pas de données réponse',
      messageSource: eventReplyData ? 'Vraies données API (structure imbriquée)' : 'Message temporaire générique',
      structureDetected: eventReplyData === event.ticket?.reply ? 'Structure imbriquée event.ticket.reply' : 'Structure directe event.reply'
    })
  } else {
    // Sinon, juste incrémenter le total des messages
    totalMessages.value += 1
    logger.info('[TICKET DETAIL] Nouveau message admin détecté, total mis à jour sans rechargement')
  }

  // Afficher notification
  showNotification(`Nouvelle réponse de ${event.author.name}`)

  logger.info('[TICKET DETAIL] Mise à jour après réponse admin via temps réel')
}

const handleRealtimeStatusChange = (event: RealtimeEvent) => {
  // Éviter de traiter nos propres événements
  if (event.author.type === 'client') {
    logger.debug('[TICKET DETAIL] Événement statut client ignoré', { event })
    return
  }

  // Mettre à jour le statut du ticket directement sans rechargement
  if (ticket.value && event.ticket) {
    ticket.value.status = event.ticket.status
  }

  // Afficher notification
  showNotification(`Statut changé en "${event.ticket?.status || 'nouveau statut'}" par ${event.author.name}`)
}

const handleRealtimeUpdate = (event: RealtimeEvent) => {
  // Éviter de traiter nos propres événements
  if (event.author.type === 'client') {
    logger.debug('[TICKET DETAIL] Événement update client ignoré', { event })
    return
  }

  // Mise à jour sélective pour éviter rechargements complets inutiles
  if (event.ticket && ticket.value) {
    // Mettre à jour seulement les champs modifiés
    Object.assign(ticket.value, event.ticket)
    logger.info('[TICKET DETAIL] Mise à jour dynamique données ticket sans rechargement')
  } else {
    // Fallback: rechargement seulement si données incomplètes
    loadTicket(currentPage.value)
  }

  // Afficher notification
  showNotification(`Ticket mis à jour par ${event.author.name}`)
}

const showNotification = (message: string) => {
  realtimeNotificationMessage.value = message
  showRealtimeNotification.value = true

  // Masquer automatiquement après 5 secondes
  setTimeout(() => {
    showRealtimeNotification.value = false
  }, 5000)
}

// Lifecycle
onMounted(() => {
  loadTicket()

  // Initialiser le temps réel après chargement du ticket
  setTimeout(() => {
    initRealtimeForTicket()
  }, 1000)
})

onUnmounted(() => {
  // Nettoyer l'abonnement temps réel
  if (realtimeSubscription.value) {
    realtimeSubscription.value()
    realtimeSubscription.value = null
  }
})
</script>

<style scoped>
@import '@/assets/css/pages/ticket-detail.css';

/* Notification temps réel */
.realtime-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 400px;
  animation: slideInRight 0.3s ease-out;
}

.realtime-notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.realtime-notification-content i.fa-bell {
  font-size: 1.1rem;
  opacity: 0.9;
}

.close-notification {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  margin-left: auto;
}

.close-notification:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .realtime-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
