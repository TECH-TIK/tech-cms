<template>
  <div class="ticket-departments-view view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ $t('tickets.departments.title') }}</h1>
        <span class="page-description">{{ $t('tickets.departments.description') }}</span>
      </div>
      <button class="btn btn-gradient" @click="showCreateModal">
        <i class="fas fa-plus"></i>
        {{ $t('tickets.departments.actions.add') }}
      </button>
    </div>

    <!-- Liste des départements -->
    <div v-if="loading" class="loading-state box">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else-if="departments.length === 0" class="empty-state box">
      <div class="empty-icon">
        <i class="fas fa-sitemap"></i>
      </div>
      <h3 class="empty-title">{{ t('tickets.departments.empty.title') }}</h3>
      <p class="empty-description">{{ t('tickets.departments.empty.description') }}</p>
    </div>

    <div v-else class="table-box">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('tickets.departments.table.name') }}</th>
            <th>{{ t('tickets.departments.table.email') }}</th>
            <th>{{ t('tickets.departments.table.status') }}</th>
            <th>{{ t('tickets.departments.table.created_at') }}</th>
            <th>{{ t('tickets.departments.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dept in departments" :key="dept.id">
            <td>#{{ dept.id }}</td>
            <td>{{ dept.name }}</td>
            <td>{{ dept.email || '-' }}</td>
            <td>
              <span :class="`status-badge ${dept.active ? 'status-active' : 'status-inactive'}`">
                {{ dept.active ? t('common.active') : t('common.inactive') }}
              </span>
            </td>
            <td>{{ formatDate(dept.created_at) }}</td>
            <td class="actions-cell">
              <button class="btn btn-icon btn-sm btn-primary" @click="editDepartment(dept)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-icon btn-sm btn-danger" @click="confirmDelete(dept)">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de création/édition -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEdit ? t('tickets.departments.modal.edit_title') : t('tickets.departments.modal.create_title') }}
          </h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveDepartment">
            <div class="form-group">
              <label class="form-label required">{{ t('tickets.departments.form.name') }}</label>
              <input 
                v-model="form.name" 
                type="text" 
                class="form-input" 
                required
                :placeholder="t('tickets.departments.form.name_placeholder')"
              >
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('tickets.departments.form.description') }}</label>
              <textarea 
                v-model="form.description" 
                class="form-input" 
                :placeholder="t('tickets.departments.form.description_placeholder')"
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('tickets.departments.form.email') }}</label>
              <input 
                v-model="form.email" 
                type="email" 
                class="form-input" 
                :placeholder="t('tickets.departments.form.email_placeholder')"
              >
            </div>
            <div class="form-group">
              <label class="form-label">
                {{ t('tickets.departments.form.active') }}
              </label>
              <div class="toggle-switch">
                <input 
                  :id="'active-toggle'" 
                  v-model="form.active" 
                  type="checkbox" 
                  class="toggle-input"
                >
                <label :for="'active-toggle'" class="toggle-label"></label>
                <span class="toggle-text">{{ form.active ? t('common.yes') : t('common.no') }}</span>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                {{ t('common.cancel') }}
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                {{ isEdit ? t('common.update') : t('common.create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-container confirmation-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ t('tickets.departments.delete.title') }}</h3>
          <button class="modal-close" @click="showDeleteModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="confirmation-message">
            {{ t('tickets.departments.delete.message', { name: departmentToDelete?.name }) }}
          </p>
          <p class="confirmation-warning">
            {{ t('tickets.departments.delete.warning') }}
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-danger" :disabled="deleting" @click="deleteDepartment">
            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiService } from '@/services/api'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'

const { t } = useI18n()
const notificationStore = useNotificationStore()

// État
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const departments = ref<any[]>([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEdit = ref(false)
const departmentToDelete = ref<any>(null)
const form = ref({
  id: null as number | null,
  name: '',
  description: '',
  email: '',
  active: true
})

// Méthodes
const fetchDepartments = async () => {
  loading.value = true
  try {
    const response = await ApiService.routes.admin.ticket.departments.list()
    logger.debug('Structure de la réponse des départements:', response.data)
    
    // Gestion des deux formats possibles de réponse (avec ou sans wrapper data)
    if (response.data) {
      if (response.data.departments !== undefined) {
        departments.value = response.data.departments || []
      } else if (response.data.data && response.data.data.departments !== undefined) {
        departments.value = response.data.data.departments || []
      } else {
        logger.error('Format de réponse inattendu pour les départements', { data: response.data })
        departments.value = []
        notificationStore.showError(t('tickets.departments.errors.fetch'))
      }
    }
  } catch (error: any) {
    logger.error('Erreur lors du chargement des départements:', { error })
    notificationStore.showError(t('tickets.departments.errors.fetch'))
  } finally {
    loading.value = false
  }
}

const showCreateModal = () => {
  isEdit.value = false
  form.value = {
    id: null,
    name: '',
    description: '',
    email: '',
    active: true
  }
  showModal.value = true
}

const editDepartment = (dept: any) => {
  isEdit.value = true
  form.value = {
    id: dept.id,
    name: dept.name,
    description: dept.description || '',
    email: dept.email || '',
    active: dept.active === 1 || dept.active === true
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveDepartment = async () => {
  saving.value = true
  try {
    if (isEdit.value && form.value.id !== null) {
      await ApiService.routes.admin.ticket.departments.update(form.value.id.toString(), form.value)
      notificationStore.showSuccess(t('tickets.departments.success.updated'))
    } else {
      await ApiService.routes.admin.ticket.departments.create(form.value)
      notificationStore.showSuccess(t('tickets.departments.success.created'))
    }
    closeModal()
    fetchDepartments()
  } catch (error: any) {
    const message = error.response?.data?.message || t('tickets.departments.errors.save')
    notificationStore.showError(message)
    logger.error('[TicketDepartments] Erreur lors de la sauvegarde du département', {
      error: error.message,
      department_id: form.value.id
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (dept: any) => {
  departmentToDelete.value = dept
  showDeleteModal.value = true
}

const deleteDepartment = async () => {
  if (!departmentToDelete.value) return
  
  deleting.value = true
  try {
    await ApiService.routes.admin.ticket.departments.delete(departmentToDelete.value.id.toString())
    notificationStore.showSuccess(t('tickets.departments.success.deleted'))
    showDeleteModal.value = false
    fetchDepartments()
  } catch (error: any) {
    const message = error.response?.data?.message || t('tickets.departments.errors.delete')
    notificationStore.showError(message)
    console.error('Erreur lors de la suppression du département:', error)
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cycle de vie
onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.ticket-departments-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgb(0 0 0 / 15%);
  width: 95%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
}

.confirmation-modal {
  max-width: 450px;
}

.modal-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: #777;
}

.modal-body {
  padding: 1.25rem;
}

.modal-footer {
  padding: 1.25rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.confirmation-message {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.confirmation-warning {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 0.75rem;
  color: #856404;
  margin-top: 0.75rem;
  border-radius: 4px;
}

.toggle-switch {
  display: flex;
  align-items: center;
}

.toggle-input {
  height: 0;
  width: 0;
  visibility: hidden;
}

.toggle-label {
  cursor: pointer;
  width: 50px;
  height: 26px;
  background: #ccc;
  display: block;
  border-radius: 100px;
  position: relative;
}

.toggle-label::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 90px;
  transition: 0.3s;
}

.toggle-input:checked + .toggle-label {
  background: #4caf50;
}

.toggle-input:checked + .toggle-label::after {
  left: calc(100% - 5px);
  transform: translateX(-100%);
}

.toggle-text {
  margin-left: 10px;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.status-active {
  background-color: #dff0d8;
  color: #3c763d;
}

.status-inactive {
  background-color: #f2dede;
  color: #a94442;
}
</style>
