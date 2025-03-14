<template>
  <div class="modal-wrapper" v-if="show">
    <div class="modal-backdrop" @click="close"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="product_id">{{ $t('invoices.columns.service') }}</label>
            <select 
              id="product_id" 
              v-model="form.product_id" 
              class="form-select" 
              :disabled="isView || isSubmitting"
              required
            >
              <option value="">{{ $t('common.select') }}</option>
              <option v-for="service in services" :key="service.id" :value="service.id">
                {{ service.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="amount">{{ $t('invoices.columns.amount') }}</label>
            <input 
              type="number" 
              id="amount" 
              v-model="form.amount" 
              class="form-control" 
              :disabled="isView || isSubmitting"
              step="0.01" 
              min="0" 
              required
            >
          </div>
          
          <div class="form-group">
            <label for="due_date">{{ $t('invoices.columns.due_date') }}</label>
            <input 
              type="date" 
              id="due_date" 
              v-model="form.due_date" 
              class="form-control" 
              :disabled="isView || isSubmitting"
              required
            >
          </div>
          
          <div class="form-group" v-if="!isAdd">
            <label for="status">{{ $t('invoices.columns.status') }}</label>
            <select 
              id="status" 
              v-model="form.status" 
              class="form-select" 
              :disabled="isView || isSubmitting"
            >
              <option value="pending">{{ $t('invoices.status.pending') }}</option>
              <option value="paid">{{ $t('invoices.status.paid') }}</option>
              <option value="overdue">{{ $t('invoices.status.overdue') }}</option>
              <option value="cancelled">{{ $t('invoices.status.cancelled') }}</option>
            </select>
          </div>
          
          <div class="form-group" v-if="isView && invoice.paid_at">
            <label>{{ $t('invoices.columns.paid_date') }}</label>
            <p>{{ formatDate(invoice.paid_at) }}</p>
          </div>
          
          <div class="form-group" v-if="isView">
            <label>{{ $t('invoices.columns.created_at') }}</label>
            <p>{{ formatDate(invoice.created_at) }}</p>
          </div>
          
          <div class="form-actions">
            <button 
              v-if="!isView" 
              type="submit" 
              class="btn btn-primary" 
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin"></i>
                {{ $t('common.loading') }}
              </span>
              <span v-else>{{ $t('common.save') }}</span>
            </button>
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="close"
              :disabled="isSubmitting"
            >
              {{ isView ? $t('common.close') : $t('common.cancel') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'add', // 'add', 'edit', 'view'
    validator: (value: string) => ['add', 'edit', 'view'].includes(value)
  },
  invoice: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'submit'])

const { t } = useI18n()
const services = ref<any[]>([])
const isSubmitting = ref(false)

// Formulaire
const form = ref({
  product_id: '',
  amount: 0,
  due_date: new Date().toISOString().split('T')[0],
  status: 'pending'
})

// Computed properties
const isAdd = computed(() => props.mode === 'add')
const isEdit = computed(() => props.mode === 'edit')
const isView = computed(() => props.mode === 'view')

const title = computed(() => {
  if (isAdd.value) return t('invoices.modal.add_title')
  if (isEdit.value) return t('invoices.modal.edit_title')
  return t('invoices.modal.view_title')
})

// Charger les services
const fetchServices = async () => {
  try {
    const response = await axios.get('/api/v1/services')
    services.value = response.data.services
  } catch (error) {
    console.error('Erreur lors du chargement des services:', error)
  }
}

// Initialiser le formulaire
const initForm = () => {
  if (isAdd.value) {
    form.value = {
      product_id: '',
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    }
  } else {
    form.value = {
      product_id: props.invoice.product_id || '',
      amount: props.invoice.amount || 0,
      due_date: props.invoice.due_date ? new Date(props.invoice.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: props.invoice.status || 'pending'
    }
  }
}

// Formatage de la date
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR').format(date)
}

// Soumettre le formulaire
const submitForm = () => {
  emit('submit', { ...form.value })
}

// Fermer le modal
const close = () => {
  emit('close')
}

// Watcher pour réinitialiser le formulaire quand le modal s'ouvre
watch(() => props.show, (newVal) => {
  if (newVal) {
    initForm()
  }
})

// Watcher pour mettre à jour le formulaire si l'invoice change
watch(() => props.invoice, () => {
  if (props.show) {
    initForm()
  }
}, { deep: true })

// Charger les services au montage du composant
onMounted(() => {
  fetchServices()
})
</script>

<style scoped>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1001;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
