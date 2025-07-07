<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ getModalTitle }}</h2>
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <!-- Vue détaillée -->
        <div v-if="mode === 'view'" class="ticket-details">
          <div class="ticket-header">
            <div class="ticket-id">#{{ ticket.id }}</div>
            <div class="ticket-subject">{{ ticket.subject }}</div>
            <div class="ticket-meta">
              <span class="ticket-client">
                <i class="fas fa-user"></i> {{ ticket.client_name }}
              </span>
              <span class="ticket-date">
                <i class="fas fa-calendar-alt"></i> {{ formatDate(ticket.created_at) }}
              </span>
              <span :class="['ticket-priority', `priority-${ticket.priority}`]">
                <i class="fas fa-flag"></i> {{ getPriorityName(ticket.priority) }}
              </span>
              <span :class="['ticket-status', `status-${ticket.status}`]">
                <i class="fas fa-circle"></i> {{ getStatusName(ticket.status) }}
              </span>
            </div>
          </div>
          
          <div class="ticket-messages">
            <div v-if="ticket.replies && ticket.replies.length > 0">
              <div 
                v-for="reply in ticket.replies" 
                :key="reply.id"
                :class="['message', reply.user_type]"
              >
                <div class="message-header">
                  <span class="author">{{ reply.author_name }}</span>
                  <span class="date">{{ formatDate(reply.created_at) }}</span>
                </div>
                <div class="message-content">{{ reply.message }}</div>
              </div>
            </div>
            <div v-else class="no-messages">
              {{ $t('tickets.noMessages') }}
            </div>
          </div>
          
          <div class="reply-form">
            <h3>{{ $t('tickets.addReply') }}</h3>
            <textarea 
              v-model="replyMessage" 
              :placeholder="$t('tickets.replyPlaceholder')"
              rows="4"
              class="form-control"
            ></textarea>
            <div class="form-actions">
              <button 
                class="btn btn-primary" 
                :disabled="!replyMessage.trim() || submitting"
                @click="submitReply"
              >
                <i class="fas fa-paper-plane"></i> {{ $t('tickets.sendReply') }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Formulaire de création/édition -->
        <form v-else class="ticket-form" @submit.prevent="submitForm">
          <div class="form-group">
            <label>{{ $t('tickets.fields.client') }} <span class="required">*</span></label>
            <select 
              v-model="formData.client_id" 
              class="form-control"
              required
              :disabled="mode === 'edit'"
            >
              <option value="">{{ $t('tickets.selectClient') }}</option>
              <option 
                v-for="client in clients" 
                :key="client.id" 
                :value="client.id"
              >
                {{ client.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>{{ $t('tickets.fields.subject') }} <span class="required">*</span></label>
            <input 
              v-model="formData.subject" 
              type="text" 
              class="form-control"
              required
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('tickets.fields.priority') }}</label>
              <select v-model="formData.priority" class="form-control">
                <option value="low">{{ $t('tickets.priority.low') }}</option>
                <option value="medium">{{ $t('tickets.priority.medium') }}</option>
                <option value="high">{{ $t('tickets.priority.high') }}</option>
                <option value="urgent">{{ $t('tickets.priority.urgent') }}</option>
              </select>
            </div>
            
            <div v-if="mode === 'edit'" class="form-group">
              <label>{{ $t('tickets.fields.status') }}</label>
              <select v-model="formData.status" class="form-control">
                <option value="open">{{ $t('tickets.status.open') }}</option>
                <option value="pending">{{ $t('tickets.status.pending') }}</option>
                <option value="resolved">{{ $t('tickets.status.resolved') }}</option>
                <option value="closed">{{ $t('tickets.status.closed') }}</option>
              </select>
            </div>
          </div>
          
          <div v-if="mode === 'create'" class="form-group">
            <label>{{ $t('tickets.fields.message') }} <span class="required">*</span></label>
            <textarea 
              v-model="formData.message" 
              class="form-control"
              rows="5"
              required
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="$emit('close')"
            >
              {{ $t('common.cancel') }}
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="submitting"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              {{ submitButtonText }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTicketStore } from '@/stores/tickets'
import { useClientsStore } from '@/stores/clients'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit', 'view'].includes(value)
  }
})

const emit = defineEmits(['close', 'created', 'updated'])

const { t } = useI18n()
const ticketStore = useTicketStore()
const clientsStore = useClientsStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// État
const formData = ref({ ...props.ticket })
const submitting = ref(false)
const replyMessage = ref('')

// Données calculées
const clients = computed(() => clientsStore.clients)

const getModalTitle = computed(() => {
  if (props.mode === 'create') {
    return t('tickets.modal.add_title')
  } else if (props.mode === 'edit') {
    return t('tickets.modal.edit_title')
  } else {
    return t('tickets.modal.view_title')
  }
})

const submitButtonText = computed(() => {
  if (props.mode === 'create') {
    return t('tickets.actions.create')
  } else {
    return t('tickets.actions.update')
  }
})

// Méthodes
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function getPriorityName(priority) {
  const priorities = {
    low: t('tickets.priority.low'),
    medium: t('tickets.priority.medium'),
    high: t('tickets.priority.high'),
    urgent: t('tickets.priority.urgent')
  }
  return priorities[priority] || priority
}

function getStatusName(status) {
  const statuses = {
    open: t('tickets.status.open'),
    pending: t('tickets.status.pending'),
    closed: t('tickets.status.closed'),
    resolved: t('tickets.status.resolved')
  }
  return statuses[status] || status
}

async function submitForm() {
  try {
    submitting.value = true
    
    if (props.mode === 'create') {
      await ticketStore.createTicket(formData.value)
      notificationStore.showNotification('success', t('tickets.success.create'))
      emit('created')
    } else {
      await ticketStore.updateTicket(formData.value)
      notificationStore.showNotification('success', t('tickets.success.update'))
      emit('updated')
    }
  } catch (error) {
    logger.error('Error submitting ticket', { error })
    notificationStore.showNotification('error', props.mode === 'create' 
      ? t('tickets.errors.create') 
      : t('tickets.errors.update')
    )
  } finally {
    submitting.value = false
  }
}

async function submitReply() {
  if (!replyMessage.value.trim()) return
  
  try {
    submitting.value = true
    
    await ticketStore.addReply(props.ticket.id, {
      message: replyMessage.value,
      user_id: authStore.currentUser.id,
      user_type: 'admin'
    })
    
    replyMessage.value = ''
    
    // Rafraîchir les données du ticket
    const updatedTicket = await ticketStore.getTicket(props.ticket.id)
    Object.assign(props.ticket, updatedTicket)
    
    notificationStore.showNotification('success', t('tickets.success.reply'))
  } catch (error) {
    logger.error('Error submitting reply', { error })
    notificationStore.showNotification('error', t('tickets.errors.reply'))
  } finally {
    submitting.value = false
  }
}

// Initialisation
onMounted(() => {
  if (props.mode === 'create' || props.mode === 'edit') {
    formData.value = { ...props.ticket }
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgb(0 0 0 / 50%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgb(0 0 0 / 15%);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.required {
  color: #e53935;
  margin-left: 0.25rem;
}

/* Styles pour la vue détaillée */
.ticket-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ticket-header {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.ticket-id {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.ticket-subject {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.ticket-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
}

.ticket-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ticket-priority,
.ticket-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.priority-low {
  background-color: #e9f5e9;
  color: #2e7d32;
}

.priority-medium {
  background-color: #fff8e1;
  color: #ff8f00;
}

.priority-high {
  background-color: #ffebee;
  color: #c62828;
}

.priority-urgent {
  background-color: #7f0000;
  color: white;
}

.status-open {
  background-color: #e3f2fd;
  color: #1565c0;
}

.status-pending {
  background-color: #fff8e1;
  color: #ff8f00;
}

.status-closed {
  background-color: #e0e0e0;
  color: #616161;
}

.status-resolved {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.ticket-messages {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  padding: 1rem;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.message.admin {
  background-color: #e3f2fd;
  margin-left: 2rem;
}

.message.client {
  background-color: #f5f5f5;
  margin-right: 2rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.message-header .author {
  font-weight: 600;
}

.message-header .date {
  color: #666;
}

.message-content {
  white-space: pre-line;
}

.no-messages {
  padding: 2rem;
  text-align: center;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.reply-form {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.reply-form h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

@media (width <= 768px) {
  .form-row {
    flex-direction: column;
    gap: 1.25rem;
  }
  
  .ticket-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
