<template>
  <div class="ticket-form-view view-container">
    <!-- En-tête avec titre et navigation -->
    <div class="header-box">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/tickets" class="breadcrumb-link">
            <i class="fas fa-arrow-left"></i>
            {{ t('tickets.title') }}
          </router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">
            {{ isEdit ? t('tickets.edit_title') : t('tickets.create_title') }}
          </span>
        </div>
        <h1 class="page-title">
          {{ isEdit ? t('tickets.edit_title') : t('tickets.create_title') }}
        </h1>
        <span class="page-description">
          {{ isEdit ? t('tickets.edit_description') : t('tickets.create_description') }}
        </span>
      </div>
    </div>

    <!-- Formulaire de ticket -->
    <div class="form-container box">
      <form @submit.prevent="handleSubmit">
          <!-- Informations de base -->
          <div class="form-section">
            <h3 class="section-title">{{ t('tickets.form.basic_info') }}</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">{{ t('tickets.form.client') }}</label>
                <select v-model="form.client_id" class="form-input">
                  <option value="">{{ t('tickets.form.select_client') }}</option>
                  <option v-for="client in clients" :key="client.id" :value="client.id">
                    {{ client.name }} ({{ client.email }})
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('tickets.form.department') }}</label>
                <select v-model="form.department_id" class="form-input">
                  <option value="">{{ t('tickets.form.select_department') }}</option>
                  <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                    {{ dept.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('tickets.form.subject') }}</label>
              <input 
                v-model="form.subject" 
                type="text" 
                class="form-input" 
                :placeholder="t('tickets.form.subject_placeholder')"
              >
            </div>
          </div>

          <!-- Priorité et statut -->
          <div class="form-section">
            <h3 class="section-title">{{ t('tickets.form.priority_status') }}</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">{{ t('tickets.form.priority') }}</label>
                <select v-model="form.priority" class="form-input">
                  <option value="low">{{ t('tickets.priority.low') }}</option>
                  <option value="medium">{{ t('tickets.priority.medium') }}</option>
                  <option value="high">{{ t('tickets.priority.high') }}</option>
                  <option value="urgent">{{ t('tickets.priority.urgent') }}</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label required">{{ t('tickets.form.status') }}</label>
                <select v-model="form.status" class="form-input">
                  <option value="open">{{ t('tickets.status.open') }}</option>
                  <option value="answered">{{ t('tickets.status.answered') || 'Répondu' }}</option>
                  <option value="customer-reply">{{ t('tickets.status.customer_reply') || 'Réponse client' }}</option>
                  <option value="closed">{{ t('tickets.status.closed') }}</option>
                </select>
                <!-- Note: Les valeurs sont limitées à celles acceptées par la base de données: open, answered, customer-reply, closed -->
              </div>
            </div>
          </div>

          <!-- Message principal -->
          <div class="form-section full-width">
            <h3 class="section-title">{{ t('tickets.form.message') }}</h3>
            <div class="form-group">
              <label class="form-label">{{ t('tickets.form.description') }}</label>
              <textarea 
                v-model="form.message" 
                class="form-input message-textarea" 
                rows="8"
                :placeholder="t('tickets.form.message_placeholder')"
              ></textarea>
            </div>
          </div>

          <!-- Assignation -->
          <div class="form-section">
            <h3 class="section-title">{{ t('tickets.form.assignment') }}</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('tickets.form.assigned_to') }}</label>
                <select v-model="form.assigned_to" class="form-input">
                  <option value="">{{ t('tickets.form.unassigned') }}</option>
                  <option v-for="admin in admins" :key="admin.id" :value="admin.id">
                    {{ admin.firstname }} {{ admin.lastname }} ({{ admin.username }})
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('tickets.form.service_related') }}</label>
                <select v-model="form.service_id" class="form-input">
                  <option value="">{{ t('tickets.form.no_service') }}</option>
                  <option v-for="service in clientServices" :key="service.id" :value="service.id">
                    {{ service.name }} - {{ service.domain }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Options avancées -->
          <div class="form-section">
            <h3 class="section-title">{{ t('tickets.form.advanced_options') }}</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('tickets.form.notify_client') }}</label>
                <div class="checkbox-wrapper">
                  <input 
                    id="notify_client" 
                    v-model="form.notify_client" 
                    type="checkbox"
                    class="form-checkbox"
                  >
                  <label for="notify_client" class="checkbox-label">
                    {{ t('tickets.form.notify_client_description') }}
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('tickets.form.auto_close') }}</label>
                <div class="checkbox-wrapper">
                  <input 
                    id="auto_close" 
                    v-model="form.auto_close" 
                    type="checkbox"
                    class="form-checkbox"
                  >
                  <label for="auto_close" class="checkbox-label">
                    {{ t('tickets.form.auto_close_description') }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div class="form-section full-width">
            <h3 class="section-title">{{ t('tickets.form.tags') }}</h3>
            <div class="form-group">
              <label class="form-label">{{ t('tickets.form.tags_label') }}</label>
              <div class="tags-input">
                <div class="selected-tags">
                  <span 
                    v-for="tag in form.tags" 
                    :key="tag" 
                    class="tag-item"
                  >
                    {{ tag }}
                    <button type="button" class="tag-remove" @click="removeTag(tag)">
                      <i class="fas fa-times"></i>
                    </button>
                  </span>
                </div>
                <input 
                  v-model="newTag" 
                  type="text" 
                  class="form-input"
                  :placeholder="t('tickets.form.tags_placeholder')"
                  @keydown.enter.prevent="addTag"
>
              </div>
            </div>
          </div>

        <!-- Notes internes -->
        <div class="form-section">
          <h2 class="section-title">{{ t('tickets.form.internal_notes') }}</h2>
          <div class="form-group">
            <label class="form-label">{{ t('tickets.form.notes') }}</label>
            <textarea
              v-model="form.internal_notes"
              class="form-control"
              rows="4"
              :placeholder="t('tickets.form.notes_placeholder')"
            ></textarea>
            <small class="form-help">{{ t('tickets.form.notes_help') }}</small>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="handleCancel">
            <i class="fas fa-times"></i>
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i>
            {{ isEdit ? t('common.update') : t('common.create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useTicketStore } from '@/stores/tickets'
import { useClientsStore } from '@/stores/clients'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'
import { ApiService } from '@/services/api'

// Définition des interfaces pour le formulaire
interface Client {
  id: number;
  name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
}

// Interface StaffMember supprimée car nous utilisons directement les admins

interface ClientService {
  id: number;
  name: string;
  domain: string;
}

interface TicketForm {
  client_id: string;
  department_id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  assigned_to: string;
  service_id: string;
  notify_client: boolean;
  auto_close: boolean;
  tags: string[];
  internal_notes: string;
}

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const ticketStore = useTicketStore()
const clientsStore = useClientsStore()
const notificationStore = useNotificationStore()

// Variables réactives pour la gestion des données du ticket
const ticketId = ref<number | null>(null)
const isEdit = computed(() => ticketId.value !== null)

// Initialisation
onMounted(async () => {
  await fetchData()
  if (route.params.id) {
    ticketId.value = parseInt(route.params.id as string, 10)
    await fetchTicket()
  }
})

// État du formulaire
const loading = ref(false)
const clients = ref<Client[]>([])
const departments = ref<Department[]>([])
const admins = ref<any[]>([])
const clientServices = ref<ClientService[]>([])
const newTag = ref('')

const form = ref<TicketForm>({
  client_id: '',
  department_id: '',
  subject: '',
  message: '',
  priority: 'medium',
  status: 'open',
  assigned_to: '',
  service_id: '',
  notify_client: true,
  auto_close: false,
  tags: [],
  internal_notes: ''
})

// Watchers
watch(() => form.value.client_id, async (newClientId) => {
  if (newClientId) {
    await fetchClientServices(parseInt(newClientId))
  } else {
    clientServices.value = []
  }
})

// Méthodes
const fetchData = async () => {
  try {
    loading.value = true
    
    // Récupération des clients
    await clientsStore.fetchClients()
    clients.value = clientsStore.clients
    
    try {
      // Récupération des départements de tickets via le service API centralisé
      const deptResponse = await ApiService.routes.admin.ticket.departments.list()
      logger.debug('Structure de la réponse des départements:', deptResponse.data)
      
      // Gestion des deux formats possibles de réponse (avec ou sans wrapper data)
      if (deptResponse.data) {
        if (deptResponse.data.departments !== undefined) {
          departments.value = deptResponse.data.departments || []
        } else if (deptResponse.data.data && deptResponse.data.data.departments !== undefined) {
          departments.value = deptResponse.data.data.departments || []
        } else {
          logger.error('Format de réponse inattendu pour les départements', { data: deptResponse.data })
          departments.value = []
          notificationStore.showError(t('tickets.departments.errors.fetch'))
        }
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des départements:', { error })
      notificationStore.showError(t('tickets.departments.errors.fetch'))
    }
    
    try {
      // Récupération des administrateurs pour l'assignation via le service API centralisé
      const adminsResponse = await ApiService.routes.admin.admins.list()
      logger.debug('Structure de la réponse des administrateurs:', adminsResponse.data)
      
      // Gestion des deux formats possibles de réponse (avec ou sans wrapper data)
      if (adminsResponse.data) {
        if (adminsResponse.data.admins !== undefined) {
          admins.value = adminsResponse.data.admins || []
        } else if (adminsResponse.data.data && adminsResponse.data.data.admins !== undefined) {
          admins.value = adminsResponse.data.data.admins || []
        } else {
          logger.error('Format de réponse inattendu pour les administrateurs', { data: adminsResponse.data })
          admins.value = []
        }
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des administrateurs:', { error })
    }
  } catch (error: any) {
    logger.error('Erreur lors du chargement des données initiales du formulaire', { error });
  }
}

// Récupération des services clients avec l'API réelle
const fetchClientServices = async (clientId: number) => {
  try {
    // Utiliser le service API centralisé pour récupérer les services du client
    const response = await ApiService.routes.admin.service.getClientServices(clientId.toString())
    logger.debug('Réponse des services clients:', response.data)
    
    // Gestion du format spécifique de la réponse des services clients
    if (response.data) {
      // Format 1 : tableau dans data
      if (Array.isArray(response.data.data)) {
        clientServices.value = response.data.data || []
        logger.debug('Services clients chargés (format tableau):', clientServices.value)
      } 
      // Format 2 : propriété services dans l'objet
      else if (response.data.services) {
        clientServices.value = response.data.services || []
        logger.debug('Services clients chargés (format services):', clientServices.value)
      } 
      // Format 3 : propriété services dans data.data
      else if (response.data.data && response.data.data.services) {
        clientServices.value = response.data.data.services || []
        logger.debug('Services clients chargés (format data.services):', clientServices.value)
      } 
      else {
        logger.error('Format de réponse inattendu pour les services clients', { data: response.data })
        clientServices.value = []
      }
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des services pour le client', { clientId, error });
    clientServices.value = []
  }
}

const addTag = () => {
  const tag = newTag.value.trim().replace(',', '')
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (tagToRemove: string) => {
  form.value.tags = form.value.tags.filter(tag => tag !== tagToRemove)
}

const fetchTicket = async () => {
  if (!ticketId.value) return

  try {
    loading.value = true
    // Utilisation de getTicket (remplacer fetchTicket qui n'existe pas)
    const response = await ticketStore.getTicket(ticketId.value)
    const ticket = response
    
    // Vérifier que le ticket existe avant d'accéder à ses propriétés
    if (ticket) {
      form.value = {
        client_id: ticket.client_id ? ticket.client_id.toString() : '',
        department_id: ticket.department_id ? ticket.department_id.toString() : '',
        subject: ticket.subject || '',
        message: ticket.message || '',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        assigned_to: ticket.assigned_to ? ticket.assigned_to.toString() : '',
        service_id: ticket.service_id ? ticket.service_id.toString() : '',
        notify_client: ticket.notify_client !== undefined ? ticket.notify_client : true,
        auto_close: ticket.auto_close !== undefined ? ticket.auto_close : false,
        tags: ticket.tags || [],
        internal_notes: ticket.internal_notes || ''
      }

      if (ticket.client_id) {
        await fetchClientServices(ticket.client_id)
      }
    } else {
      // Notification si le ticket n'est pas trouvé
      logger.warn(`Ticket avec ID ${ticketId.value} non trouvé`)
      notificationStore.showNotification({
        title: 'Erreur',
        message: `Impossible de trouver le ticket #${ticketId.value}`,
        type: 'error'
      })
      // Rediriger vers la liste des tickets
      router.push({ name: 'tickets' })
    }
  } catch (error) {
    logger.error('Erreur lors du chargement du ticket pour édition', { ticketId: ticketId.value, error });
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('tickets.errors.load_failed')
    })
    router.push('/tickets')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    loading.value = true

    // Conversion des types de string à number pour correspondre à l'interface Ticket
    const ticketData = {
      ...form.value,
      client_id: form.value.client_id ? parseInt(form.value.client_id, 10) : undefined,
      department_id: form.value.department_id ? parseInt(form.value.department_id, 10) : undefined,
      service_id: form.value.service_id ? parseInt(form.value.service_id, 10) : undefined,
      assigned_to: form.value.assigned_to ? parseInt(form.value.assigned_to, 10) : undefined
    }

    if (isEdit.value && ticketId.value) {
      await ticketStore.updateTicket(ticketId.value, ticketData)
      notificationStore.showNotification({
        type: 'success',
        title: t('common.success'),
        message: t('tickets.success.updated')
      })
    } else {
      await ticketStore.createTicket(ticketData)
      notificationStore.showNotification({
        type: 'success',
        title: t('common.success'),
        message: t('tickets.success.created')
      })
    }

    
    router.push('/tickets')
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du ticket', { ticketId: ticketId.value, isEdit: isEdit.value, error });
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: isEdit.value ? t('tickets.errors.update_failed') : t('tickets.errors.create_failed')
    })
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/tickets')
}

// Lifecycle
onMounted(async () => {
  await fetchData()
  if (isEdit.value) {
    await fetchTicket()
  }
})
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS commun */
@import '@/assets/css/components/common-layout.css';

.form-container {
  padding: 1.5rem;
  margin-top: 1rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgb(var(--primary-color-rgb), 0.25);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.message-textarea {
  min-height: 150px;
  resize: vertical;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-checkbox {
  width: 18px;
  height: 18px;
}

.checkbox-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.tags-input {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem;
  background: var(--input-background);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.tag-remove:hover {
  background: rgb(255 255 255 / 20%);
}

.form-help {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-style: italic;
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

@media (width <= 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
