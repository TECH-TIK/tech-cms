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
            <label for="invoice_id">{{ $t('payments.columns.invoice') }}</label>
            <select 
              id="invoice_id" 
              v-model="form.invoice_id" 
              class="form-select" 
              :disabled="isView || isSubmitting"
              required
            >
              <option value="">{{ $t('common.select') }}</option>
              <option v-for="invoice in invoices" :key="invoice.id" :value="invoice.id">
                {{ invoice.id }} - {{ invoice.client_name }} ({{ formatCurrency(invoice.amount) }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="amount">{{ $t('payments.columns.amount') }}</label>
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
            <label for="payment_date">{{ $t('payments.columns.date') }}</label>
            <input 
              type="date" 
              id="payment_date" 
              v-model="form.payment_date" 
              class="form-control" 
              :disabled="isView || isSubmitting"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="payment_method">{{ $t('payments.columns.method') }}</label>
            <select 
              id="payment_method" 
              v-model="form.payment_method" 
              class="form-select" 
              :disabled="isView || isSubmitting"
              required
            >
              <option value="card">{{ $t('payments.methods.card') }}</option>
              <option value="bank_transfer">{{ $t('payments.methods.bank_transfer') }}</option>
              <option value="paypal">{{ $t('payments.methods.paypal') }}</option>
              <option value="cash">{{ $t('payments.methods.cash') }}</option>
              <option value="check">{{ $t('payments.methods.check') }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="transaction_id">{{ $t('payments.columns.transaction_id') }}</label>
            <input 
              type="text" 
              id="transaction_id" 
              v-model="form.transaction_id" 
              class="form-control" 
              :disabled="isView || isSubmitting"
            >
            <small class="form-text text-muted">{{ $t('payments.fields.transaction_id_help') }}</small>
          </div>
          
          <div class="form-group" v-if="!isAdd">
            <label for="status">{{ $t('payments.columns.status') }}</label>
            <select 
              id="status" 
              v-model="form.status" 
              class="form-select" 
              :disabled="isView || isSubmitting"
            >
              <option value="completed">{{ $t('payments.status.completed') }}</option>
              <option value="pending">{{ $t('payments.status.pending') }}</option>
              <option value="failed">{{ $t('payments.status.failed') }}</option>
              <option value="refunded">{{ $t('payments.status.refunded') }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="notes">{{ $t('payments.columns.notes') }}</label>
            <textarea 
              id="notes" 
              v-model="form.notes" 
              class="form-control" 
              :disabled="isView || isSubmitting"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group" v-if="isView">
            <label>{{ $t('payments.columns.created_at') }}</label>
            <p>{{ formatDate(payment.created_at) }}</p>
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
  payment: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'submit'])

const { t } = useI18n()
const invoices = ref<any[]>([])
const isSubmitting = ref(false)

// Formulaire
const form = ref({
  invoice_id: '',
  amount: 0,
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'card',
  transaction_id: '',
  status: 'completed',
  notes: ''
})

// Computed properties
const isAdd = computed(() => props.mode === 'add')
const isEdit = computed(() => props.mode === 'edit')
const isView = computed(() => props.mode === 'view')

const title = computed(() => {
  if (isAdd.value) return t('payments.modal.add_title')
  if (isEdit.value) return t('payments.modal.edit_title')
  return t('payments.modal.view_title')
})

// Charger les factures
const fetchInvoices = async () => {
  try {
    const response = await axios.get('/api/v1/invoices')
    // Filtrer pour n'inclure que les factures en attente de paiement
    invoices.value = response.data.invoices.filter((invoice: any) => invoice.status === 'pending')
  } catch (error) {
    console.error('Erreur lors du chargement des factures:', error)
  }
}

// Initialiser le formulaire
const initForm = () => {
  if (isAdd.value) {
    form.value = {
      invoice_id: '',
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'card',
      transaction_id: '',
      status: 'completed',
      notes: ''
    }
  } else {
    form.value = {
      invoice_id: props.payment.invoice_id || '',
      amount: props.payment.amount || 0,
      payment_date: props.payment.payment_date ? new Date(props.payment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      payment_method: props.payment.payment_method || 'card',
      transaction_id: props.payment.transaction_id || '',
      status: props.payment.status || 'completed',
      notes: props.payment.notes || ''
    }
  }
}

// Formatage de la date
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR').format(date)
}

// Formatage du montant
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
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

// Watcher pour mettre à jour le formulaire si le paiement change
watch(() => props.payment, () => {
  if (props.show) {
    initForm()
  }
}, { deep: true })

// Charger les factures au montage du composant
onMounted(() => {
  fetchInvoices()
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
