<template>
  <div id="serviceForm" class="view-container">
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ isEditMode ? t('services.edit.title') : t('services.create.title') }}</h1>
        <span class="page-description">{{ isEditMode ? t('services.edit.description') : t('services.create.description') }}</span>
      </div>
      <button class="btn btn-outline" @click="goBack">
        <i class="fas fa-arrow-left"></i>
        {{ t('common.back') }}
      </button>
    </div>

    <div class="content-box">
      <form @submit.prevent="handleSubmit" class="form-container">
        <!-- Section client et produit -->
        <div class="form-section">
          <h3 class="section-title">{{ t('services.form.section.client_product') }}</h3>
          
          <div class="form-group">
            <label for="client_id">{{ t('services.form.client') }} <span class="required">*</span></label>
            <div class="select-wrapper">
              <i class="fas fa-user"></i>
              <select 
                id="client_id" 
                v-model="formData.client_id" 
                class="form-control" 
                :disabled="loading || isEditMode"
                required
              >
                <option value="">{{ t('services.form.select_client') }}</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">
                  {{ client.firstname }} {{ client.lastname }} ({{ client.email }})
                </option>
              </select>
            </div>
            <span class="error-message" v-if="formErrors.client_id">{{ formErrors.client_id }}</span>
          </div>
          
          <div class="form-group">
            <label for="product_id">{{ t('services.form.product') }} <span class="required">*</span></label>
            <div class="select-wrapper">
              <i class="fas fa-box"></i>
              <select 
                id="product_id" 
                v-model="formData.product_id" 
                class="form-control" 
                :disabled="loading || isEditMode"
                required
              >
                <option value="">{{ t('services.form.select_product') }}</option>
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.name }}
                </option>
              </select>
            </div>
            <span class="error-message" v-if="formErrors.product_id">{{ formErrors.product_id }}</span>
          </div>
        </div>

        <!-- Section détails du service -->
        <div class="form-section">
          <h3 class="section-title">{{ t('services.form.section.details') }}</h3>
          
          <div class="form-group">
            <label for="domain">{{ t('services.form.domain') }}</label>
            <div class="input-wrapper">
              <i class="fas fa-globe"></i>
              <input 
                type="text" 
                id="domain" 
                v-model="formData.domain" 
                class="form-control" 
                :placeholder="t('services.form.domain_placeholder')"
                :disabled="loading"
              >
            </div>
            <span class="error-message" v-if="formErrors.domain">{{ formErrors.domain }}</span>
          </div>
          
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="username">{{ t('services.form.username') }}</label>
              <div class="input-wrapper">
                <i class="fas fa-user-tag"></i>
                <input 
                  type="text" 
                  id="username" 
                  v-model="formData.username" 
                  class="form-control" 
                  :placeholder="t('services.form.username_placeholder')"
                  :disabled="loading"
                >
              </div>
              <span class="error-message" v-if="formErrors.username">{{ formErrors.username }}</span>
            </div>
            
            <div class="form-group flex-1">
              <label for="password">{{ t('services.form.password') }}</label>
              <div class="input-wrapper password-input">
                <i class="fas fa-lock"></i>
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  id="password" 
                  v-model="formData.password" 
                  class="form-control" 
                  :placeholder="t('services.form.password_placeholder')"
                  :disabled="loading"
                >
                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <span class="error-message" v-if="formErrors.password">{{ formErrors.password }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="server_id">{{ t('services.form.server') }}</label>
            <div class="select-wrapper">
              <i class="fas fa-server"></i>
              <select 
                id="server_id" 
                v-model="formData.server_id" 
                class="form-control" 
                :disabled="loading"
              >
                <option value="">{{ t('services.form.select_server') }}</option>
                <option v-for="server in servers" :key="server.id" :value="server.id">
                  {{ server.name }} ({{ server.hostname }})
                </option>
              </select>
            </div>
            <span class="error-message" v-if="formErrors.server_id">{{ formErrors.server_id }}</span>
          </div>
          
          <div class="form-group">
            <label for="status">{{ t('services.form.status') }} <span class="required">*</span></label>
            <div class="select-wrapper">
              <i class="fas fa-tag"></i>
              <select 
                id="status" 
                v-model="formData.status" 
                class="form-control" 
                :disabled="loading"
                required
              >
                <option value="pending">{{ t('services.status.pending') }}</option>
                <option value="active">{{ t('services.status.active') }}</option>
                <option value="suspended">{{ t('services.status.suspended') }}</option>
                <option value="cancelled">{{ t('services.status.cancelled') }}</option>
                <option value="terminated">{{ t('services.status.terminated') }}</option>
                <option value="fraud">{{ t('services.status.fraud') }}</option>
              </select>
            </div>
            <span class="error-message" v-if="formErrors.status">{{ formErrors.status }}</span>
          </div>
        </div>

        <!-- Section facturation -->
        <div class="form-section">
          <h3 class="section-title">{{ t('services.form.section.billing') }}</h3>
          
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="billing_cycle">{{ t('services.form.billing_cycle') }}</label>
              <div class="select-wrapper">
                <i class="fas fa-sync"></i>
                <select 
                  id="billing_cycle" 
                  v-model="formData.billing_cycle" 
                  class="form-control" 
                  :disabled="loading"
                  @change="calculateNextDueDate"
                >
                  <option value="monthly">{{ t('services.billing_cycles.monthly') }}</option>
                  <option value="quarterly">{{ t('services.billing_cycles.quarterly') }}</option>
                  <option value="semi_annually">{{ t('services.billing_cycles.semi_annually') }}</option>
                  <option value="annually">{{ t('services.billing_cycles.annually') }}</option>
                  <option value="biennially">{{ t('services.billing_cycles.biennially') }}</option>
                  <option value="triennially">{{ t('services.billing_cycles.triennially') }}</option>
                </select>
              </div>
              <span class="error-message" v-if="formErrors.billing_cycle">{{ formErrors.billing_cycle }}</span>
            </div>
            
            <div class="form-group flex-1">
              <label for="next_due_date">{{ t('services.form.next_due_date') }}</label>
              <div class="input-wrapper with-button">
                <i class="fas fa-calendar"></i>
                <input 
                  type="date" 
                  id="next_due_date" 
                  v-model="formData.next_due_date" 
                  class="form-control" 
                  :disabled="loading"
                >
                <button 
                  type="button" 
                  class="btn btn-icon" 
                  title="Recalculer la date d'échéance" 
                  @click="calculateNextDueDate"
                  :disabled="loading"
                >
                  <i class="fas fa-calculator"></i>
                </button>
              </div>
              <span class="error-message" v-if="formErrors.next_due_date">{{ formErrors.next_due_date }}</span>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="recurring_amount">{{ t('services.form.recurring_amount') }}</label>
              <div class="input-wrapper">
                <i class="fas fa-euro-sign"></i>
                <input 
                  type="number" 
                  id="recurring_amount" 
                  v-model.number="formData.recurring_amount" 
                  step="0.01" 
                  min="0" 
                  class="form-control" 
                  :placeholder="t('services.form.amount_placeholder')"
                  :disabled="loading"
                >
              </div>
              <span class="error-message" v-if="formErrors.recurring_amount">{{ formErrors.recurring_amount }}</span>
            </div>
            
            <div class="form-group flex-1">
              <label for="setup_fee">{{ t('services.form.setup_fee') }}</label>
              <div class="input-wrapper">
                <i class="fas fa-euro-sign"></i>
                <input 
                  type="number" 
                  id="setup_fee" 
                  v-model.number="formData.setup_fee" 
                  step="0.01" 
                  min="0" 
                  class="form-control" 
                  :placeholder="t('services.form.fee_placeholder')"
                  :disabled="loading"
                >
              </div>
              <span class="error-message" v-if="formErrors.setup_fee">{{ formErrors.setup_fee }}</span>
            </div>
          </div>
        </div>

        <!-- Section notes -->
        <div class="form-section">
          <h3 class="section-title">{{ t('services.form.section.notes') }}</h3>
          
          <div class="form-group">
            <label for="notes">{{ t('services.form.notes') }}</label>
            <textarea 
              id="notes" 
              v-model="formData.notes" 
              class="form-control textarea" 
              :placeholder="t('services.form.notes_placeholder')"
              :disabled="loading"
              rows="4"
            ></textarea>
            <span class="error-message" v-if="formErrors.notes">{{ formErrors.notes }}</span>
          </div>
        </div>

        <!-- Configurations personnalisées -->
        <div class="form-section" v-if="Object.keys(formData.configuration || {}).length > 0 || isEditMode">
          <h3 class="section-title">{{ t('services.form.section.configurations') }}</h3>
          
          <div class="config-entries">
            <div v-for="(value, key) in formData.configuration" :key="key" class="config-entry">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>{{ t('services.form.config_name') }}</label>
                  <div class="input-wrapper">
                    <i class="fas fa-key"></i>
                    <input 
                      type="text" 
                      v-model="configKeys[key]" 
                      class="form-control" 
                      :disabled="loading"
                      @input="updateConfigKey(key)"
                    >
                  </div>
                </div>
                
                <div class="form-group flex-2">
                  <label>{{ t('services.form.config_value') }}</label>
                  <div class="input-wrapper">
                    <i class="fas fa-cog"></i>
                    <input 
                      type="text" 
                      v-model="formData.configuration[key]" 
                      class="form-control" 
                      :disabled="loading"
                    >
                  </div>
                </div>
                
                <div class="form-group flex-0">
                  <label class="invisible">{{ t('services.form.action') }}</label>
                  <button 
                    type="button" 
                    class="btn btn-danger" 
                    @click="removeConfigEntry(key)"
                    :disabled="loading"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            type="button" 
            class="btn btn-outline-secondary mt-3" 
            @click="addConfigEntry"
            :disabled="loading"
          >
            <i class="fas fa-plus"></i>
            {{ t('services.form.add_config') }}
          </button>
        </div>

        <!-- Boutons du formulaire -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="goBack" :disabled="loading">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            {{ isEditMode ? t('common.update') : t('common.create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useServicesStore } from '@/stores/services'
import { useClientsStore } from '@/stores/clients'
import { useProductStore } from '@/stores/products'
import { useServersStore } from '@/stores/servers'
import { useNotificationStore } from '@/stores/notifications'
import type { Service } from '@/types'

// Stores et router
const servicesStore = useServicesStore()
const clientsStore = useClientsStore()
const productStore = useProductStore()
const serversStore = useServersStore()
const notificationStore = useNotificationStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// État du formulaire
const loading = ref(false)
const showPassword = ref(false)
const formErrors = reactive<Record<string, string>>({})
const configKeys = reactive<Record<string, string>>({})

// Déterminer si nous sommes en mode édition
const serviceId = computed(() => {
  const id = route.params.id
  return id ? parseInt(id.toString()) : null
})
const isEditMode = computed(() => serviceId.value !== null)

// Formulaire
const defaultFormData = {
  client_id: '',
  product_id: '',
  status: 'pending',
  domain: '',
  server_id: '',
  username: '',
  password: '',
  next_due_date: '',
  billing_cycle: 'monthly',
  recurring_amount: 0,
  setup_fee: 0,
  notes: '',
  configuration: {} as Record<string, string>
}

const formData = reactive<{
  client_id: any;
  product_id: any;
  status: string;
  domain?: string;
  server_id?: any;
  username?: string;
  password?: string;
  next_due_date?: string;
  billing_cycle?: string;
  recurring_amount?: number;
  setup_fee?: number;
  notes?: string;
  configuration: Record<string, string>;
}>({ ...defaultFormData })

// Computed properties
const clients = computed(() => clientsStore.clients)
const products = computed(() => productStore.products)
const servers = computed(() => serversStore.servers)

// Méthodes
const goBack = () => {
  router.push({ name: 'services' })
}

const fetchData = async () => {
  loading.value = true
  
  try {
    // Récupérer les clients, produits et serveurs pour les select
    await Promise.all([
      clientsStore.fetchClients(),
      productStore.fetchProducts(),
      serversStore.fetchServers()
    ])
    
    // Si nous sommes en mode édition, charger les données du service
    if (isEditMode.value && serviceId.value) {
      const service = await servicesStore.fetchServiceById(serviceId.value)
      
      // Préparer les données du formulaire
      Object.keys(formData).forEach(key => {
        if (key in service) {
          // @ts-ignore
          formData[key] = service[key]
        }
      })
      
      // Préparer les clés de configuration
      if (service.configuration) {
        formData.configuration = { ...service.configuration }
        Object.keys(service.configuration).forEach(key => {
          configKeys[key] = key
        })
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    notificationStore.showNotification({
      title: t('common.error'),
      message: t('services.form.error_loading'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  // Réinitialiser les erreurs
  Object.keys(formErrors).forEach(key => delete formErrors[key])
  
  // Valider les champs requis
  if (!formData.client_id) {
    formErrors.client_id = t('services.form.errors.client_required')
  }
  
  if (!formData.product_id) {
    formErrors.product_id = t('services.form.errors.product_required')
  }
  
  if (!formData.status) {
    formErrors.status = t('services.form.errors.status_required')
  }
  
  // Valider le format de la date
  if (formData.next_due_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.next_due_date)) {
    formErrors.next_due_date = t('services.form.errors.invalid_date')
  }
  
  // Valider les montants
  if (formData.recurring_amount && formData.recurring_amount < 0) {
    formErrors.recurring_amount = t('services.form.errors.negative_amount')
  }
  
  if (formData.setup_fee && formData.setup_fee < 0) {
    formErrors.setup_fee = t('services.form.errors.negative_fee')
  }
  
  return Object.keys(formErrors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    // Préparer les données à envoyer
    const serviceData: Partial<Service> = {
      client_id: parseInt(formData.client_id),
      product_id: parseInt(formData.product_id),
      status: formData.status,
      domain: formData.domain,
      server_id: formData.server_id ? parseInt(formData.server_id) : undefined,
      username: formData.username,
      password: formData.password,
      next_due_date: formData.next_due_date,
      billing_cycle: formData.billing_cycle,
      recurring_amount: formData.recurring_amount,
      setup_fee: formData.setup_fee,
      notes: formData.notes,
      configuration: formData.configuration
    }
    
    if (isEditMode.value && serviceId.value) {
      // Mettre à jour le service existant
      await servicesStore.updateService(serviceId.value, serviceData)
      notificationStore.showNotification({
        title: t('services.form.success_update_title'),
        message: t('services.form.success_update_message'),
        type: 'success'
      })
    } else {
      // Créer un nouveau service
      await servicesStore.createService(serviceData as Service)
      notificationStore.showNotification({
        title: t('services.form.success_create_title'),
        message: t('services.form.success_create_message'),
        type: 'success'
      })
    }
    
    // Rediriger vers la liste des services
    router.push({ name: 'services' })
  } catch (error) {
    console.error('Erreur lors de la soumission du formulaire:', error)
    notificationStore.showNotification({
      title: t('common.error'),
      message: t('services.form.error_submit'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const addConfigEntry = () => {
  const newKey = `config_${Date.now()}`
  formData.configuration[newKey] = ''
  configKeys[newKey] = ''
}

const removeConfigEntry = (key: string) => {
  delete formData.configuration[key]
  delete configKeys[key]
}

const updateConfigKey = (oldKey: string) => {
  const newKey = configKeys[oldKey]
  if (newKey && newKey !== oldKey) {
    // Créer une nouvelle entrée avec la nouvelle clé
    formData.configuration[newKey] = formData.configuration[oldKey]
    // Supprimer l'ancienne entrée
    delete formData.configuration[oldKey]
    // Mettre à jour configKeys
    delete configKeys[oldKey]
    configKeys[newKey] = newKey
  }
}

/**
 * Calcule la prochaine date d'échéance en fonction du cycle de facturation
 */
function calculateNextDueDate() {
  const today = new Date();
  let dueDate = new Date(today);
  
  switch (formData.billing_cycle) {
    case 'monthly':
      dueDate.setMonth(today.getMonth() + 1);
      break;
    case 'quarterly':
      dueDate.setMonth(today.getMonth() + 3);
      break;
    case 'semi_annually':
      dueDate.setMonth(today.getMonth() + 6);
      break;
    case 'annually':
      dueDate.setFullYear(today.getFullYear() + 1);
      break;
    case 'biennially':
      dueDate.setFullYear(today.getFullYear() + 2);
      break;
    case 'triennially':
      dueDate.setFullYear(today.getFullYear() + 3);
      break;
    default:
      dueDate.setMonth(today.getMonth() + 1);
  }
  
  // Format date as YYYY-MM-DD
  const year = dueDate.getFullYear();
  const month = String(dueDate.getMonth() + 1).padStart(2, '0');
  const day = String(dueDate.getDate()).padStart(2, '0');
  formData.next_due_date = `${year}-${month}-${day}`;
}

// Calculer la date d'échéance par défaut au chargement du formulaire
onMounted(() => {
  fetchData()
  // Si c'est un nouveau service et que la date d'échéance n'est pas déjà définie
  if (!isEditMode.value && !formData.next_due_date) {
    calculateNextDueDate();
  }
})
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
}

.section-title {
  font-size: 1.25rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--heading-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.flex-1 {
  flex: 1;
}

.flex-2 {
  flex: 2;
}

.flex-0 {
  flex: 0 0 auto;
  align-self: flex-end;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.required {
  color: var(--danger-color);
}

.input-wrapper,
.select-wrapper {
  position: relative;
}

.input-wrapper i,
.select-wrapper i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.25rem rgba(var(--primary-color-rgb), 0.25);
  outline: none;
}

.form-control:disabled {
  background-color: var(--disabled-bg);
  cursor: not-allowed;
}

.textarea {
  padding-left: 1rem;
  min-height: 120px;
  resize: vertical;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
}

.error-message {
  display: block;
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.config-entries {
  margin-bottom: 1rem;
}

.config-entry {
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  margin-bottom: 1rem;
  background-color: var(--bg-color);
}

.mt-3 {
  margin-top: 1rem;
}

.invisible {
  visibility: hidden;
}
</style> 