<template>
  <div class="modal-container">
    <div class="modal-header">
      <h3>{{ isEditMode ? 'Modifier l\'abonnement' : (isViewMode ? 'Détails de l\'abonnement' : 'Nouvel abonnement') }}</h3>
      <button class="close-btn" @click="$emit('close')">&times;</button>
    </div>
    
    <div class="modal-body">
      <form @submit.prevent="handleSubmit" v-if="!isViewMode">
        <div class="form-group">
          <label for="client">Client</label>
          <select 
            id="client" 
            v-model="form.client_id" 
            class="form-control" 
            :disabled="isEditMode"
            required
          >
            <option value="">Sélectionner un client</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.firstname }} {{ client.lastname }} ({{ client.email }})
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="product">Produit</label>
          <select 
            id="product" 
            v-model="form.product_id" 
            class="form-control"
            required
          >
            <option value="">Sélectionner un produit</option>
            <option v-for="product in products" :key="product.id" :value="product.id">
              {{ product.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="start_date">Date de début</label>
          <input 
            type="date" 
            id="start_date" 
            v-model="form.start_date" 
            class="form-control"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="end_date">Date de fin (optionnel)</label>
          <input 
            type="date" 
            id="end_date" 
            v-model="form.end_date" 
            class="form-control"
          />
        </div>
        
        <div class="form-group">
          <label for="price">Prix</label>
          <input 
            type="number" 
            id="price" 
            v-model="form.price" 
            class="form-control"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="billing_cycle">Cycle de facturation</label>
          <select 
            id="billing_cycle" 
            v-model="form.billing_cycle" 
            class="form-control"
            required
          >
            <option value="monthly">Mensuel</option>
            <option value="quarterly">Trimestriel</option>
            <option value="semi_annual">Semestriel</option>
            <option value="annual">Annuel</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="status">Statut</label>
          <select 
            id="status" 
            v-model="form.status" 
            class="form-control"
            required
          >
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="cancelled">Annulé</option>
            <option value="expired">Expiré</option>
          </select>
        </div>
        
        <div class="form-group form-check">
          <input 
            type="checkbox" 
            id="auto_renew" 
            v-model="form.auto_renew" 
            class="form-check-input"
          />
          <label class="form-check-label" for="auto_renew">Renouvellement automatique</label>
        </div>
        
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea 
            id="notes" 
            v-model="form.notes" 
            class="form-control"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Annuler</button>
          <button type="submit" class="btn btn-primary">{{ isEditMode ? 'Mettre à jour' : 'Créer' }}</button>
        </div>
      </form>
      
      <div v-if="isViewMode" class="subscription-details">
        <div class="detail-row">
          <div class="detail-label">Client:</div>
          <div class="detail-value">{{ subscription.client_name }}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Produit:</div>
          <div class="detail-value">{{ subscription.product_name }}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Date de début:</div>
          <div class="detail-value">{{ formatDate(subscription.start_date) }}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Date de fin:</div>
          <div class="detail-value">{{ subscription.end_date ? formatDate(subscription.end_date) : 'N/A' }}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Date de renouvellement:</div>
          <div class="detail-value">{{ subscription.renewal_date ? formatDate(subscription.renewal_date) : 'N/A' }}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Prix:</div>
          <div class="detail-value">{{ formatPrice(subscription.price) }}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Cycle de facturation:</div>
          <div class="detail-value">{{ getBillingCycleName(subscription.billing_cycle) }}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Statut:</div>
          <div class="detail-value">
            <span :class="'status-badge ' + subscription.status">
              {{ getStatusName(subscription.status) }}
            </span>
          </div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Renouvellement automatique:</div>
          <div class="detail-value">{{ subscription.auto_renew ? 'Oui' : 'Non' }}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Notes:</div>
          <div class="detail-value">{{ subscription.notes || 'Aucune note' }}</div>
        </div>
        
        <div class="detail-row">
          <div class="detail-label">Créé le:</div>
          <div class="detail-value">{{ formatDate(subscription.created_at) }}</div>
        </div>
        
        <div class="detail-row" v-if="subscription.updated_at">
          <div class="detail-label">Mis à jour le:</div>
          <div class="detail-value">{{ formatDate(subscription.updated_at) }}</div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Fermer</button>
          <button 
            v-if="subscription.status === 'active'" 
            type="button" 
            class="btn btn-danger" 
            @click="showCancelConfirmation = true"
          >
            Annuler l'abonnement
          </button>
          <button 
            v-if="subscription.status !== 'active'" 
            type="button" 
            class="btn btn-success" 
            @click="handleRenew"
          >
            Renouveler
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="switchToEditMode"
          >
            Modifier
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal de confirmation d'annulation -->
    <div v-if="showCancelConfirmation" class="confirmation-modal">
      <div class="confirmation-content">
        <h4>Confirmer l'annulation</h4>
        <p>Êtes-vous sûr de vouloir annuler cet abonnement ?</p>
        
        <div class="form-group">
          <label for="cancel_reason">Raison de l'annulation</label>
          <textarea 
            id="cancel_reason" 
            v-model="cancelReason" 
            class="form-control"
            rows="3"
            required
          ></textarea>
        </div>
        
        <div class="confirmation-actions">
          <button type="button" class="btn btn-secondary" @click="showCancelConfirmation = false">Non</button>
          <button type="button" class="btn btn-danger" @click="handleCancel">Oui, annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { useClientsStore } from '@/stores/clients'
import { useProductStore } from '@/stores/products'

const props = defineProps({
  subscriptionId: {
    type: Number,
    default: null
  },
  mode: {
    type: String,
    default: 'create', // 'create', 'edit', 'view'
    validator: (value: string) => ['create', 'edit', 'view'].includes(value)
  }
})

const emit = defineEmits(['close', 'created', 'updated', 'cancelled', 'renewed'])

// Stores
const subscriptionStore = useSubscriptionStore()
const clientStore = useClientsStore()
const productStore = useProductStore()

// State
const form = ref({
  id: null as number | null,
  client_id: '',
  product_id: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  price: 0,
  billing_cycle: 'monthly',
  status: 'active',
  auto_renew: true,
  notes: ''
})

const showCancelConfirmation = ref(false)
const cancelReason = ref('')

// Computed
const isEditMode = computed(() => props.mode === 'edit')
const isViewMode = computed(() => props.mode === 'view')
const clients = computed(() => clientStore.clients)
const products = computed(() => productStore.products)
const subscription = computed(() => subscriptionStore.currentSubscription || {})

// Methods
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

const getBillingCycleName = (cycle: string) => {
  const cycles: Record<string, string> = {
    'monthly': 'Mensuel',
    'quarterly': 'Trimestriel',
    'semi_annual': 'Semestriel',
    'annual': 'Annuel'
  }
  return cycles[cycle] || cycle
}

const getStatusName = (status: string) => {
  const statuses: Record<string, string> = {
    'active': 'Actif',
    'pending': 'En attente',
    'cancelled': 'Annulé',
    'expired': 'Expiré'
  }
  return statuses[status] || status
}

const loadSubscription = async () => {
  if (props.subscriptionId) {
    await subscriptionStore.fetchSubscription(props.subscriptionId)
    if (subscriptionStore.currentSubscription) {
      const sub = subscriptionStore.currentSubscription
      form.value = {
        id: sub.id,
        client_id: sub.client_id,
        product_id: sub.product_id,
        start_date: sub.start_date.split('T')[0],
        end_date: sub.end_date ? sub.end_date.split('T')[0] : '',
        price: sub.price,
        billing_cycle: sub.billing_cycle,
        status: sub.status,
        auto_renew: sub.auto_renew,
        notes: sub.notes || ''
      }
    }
  }
}

const handleSubmit = async () => {
  if (isEditMode.value && form.value.id) {
    const updated = await subscriptionStore.updateSubscription(form.value)
    if (updated) {
      emit('updated', updated)
      emit('close')
    }
  } else {
    const created = await subscriptionStore.createSubscription(form.value)
    if (created) {
      emit('created', created)
      emit('close')
    }
  }
}

const handleCancel = async () => {
  if (props.subscriptionId && cancelReason.value.trim()) {
    const cancelled = await subscriptionStore.cancelSubscription(props.subscriptionId, cancelReason.value)
    if (cancelled) {
      emit('cancelled', cancelled)
      showCancelConfirmation.value = false
      emit('close')
    }
  }
}

const handleRenew = async () => {
  if (props.subscriptionId) {
    const renewed = await subscriptionStore.renewSubscription(props.subscriptionId)
    if (renewed) {
      emit('renewed', renewed)
      emit('close')
    }
  }
}

const switchToEditMode = () => {
  emit('close')
  emit('edit', props.subscriptionId)
}

// Lifecycle
onMounted(async () => {
  if (!clientStore.clients.length) {
    await clientStore.fetchClients()
  }
  
  if (!productStore.products.length) {
    await productStore.fetchProducts()
  }
  
  if (props.mode !== 'create') {
    await loadSubscription()
  }
})

watch(() => props.subscriptionId, async (newVal) => {
  if (newVal && (isEditMode.value || isViewMode.value)) {
    await loadSubscription()
  }
})
</script>

<style scoped>
.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-check {
  display: flex;
  align-items: center;
}

.form-check-input {
  margin-right: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background-color: #4a6cf7;
  color: white;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.subscription-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.detail-label {
  width: 40%;
  font-weight: 500;
  color: #555;
}

.detail-value {
  width: 60%;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #d1e7dd;
  color: #0f5132;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.cancelled {
  background-color: #f8d7da;
  color: #842029;
}

.status-badge.expired {
  background-color: #e2e3e5;
  color: #41464b;
}

.confirmation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirmation-content {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
