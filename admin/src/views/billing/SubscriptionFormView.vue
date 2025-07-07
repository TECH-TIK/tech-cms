<template>
  <div class="subscription-form-view view-container">
    <!-- En-tête avec titre et navigation -->
    <div class="header-box">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/subscriptions" class="breadcrumb-link">
            <i class="fas fa-arrow-left"></i>
            {{ t('subscriptions.title') }}
          </router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">
            {{ isEdit ? t('subscriptions.edit_title') : t('subscriptions.create_title') }}
          </span>
        </div>
        <h1 class="page-title">
          {{ isEdit ? t('subscriptions.edit_title') : t('subscriptions.create_title') }}
        </h1>
        <span class="page-description">
          {{ isEdit ? t('subscriptions.edit_description') : t('subscriptions.create_description') }}
        </span>
      </div>
    </div>

    <!-- Formulaire d'abonnement -->
    <div class="form-container box">
      <form @submit.prevent="handleSubmit">
        <!-- Informations client et produit -->
        <div class="form-section">
          <h2 class="section-title">{{ t('subscriptions.form.client_product') }}</h2>

          <div class="form-grid">
<div class="form-row">
              <div class="form-group">
                <label class="form-label required">{{ t('subscriptions.form.client') }}</label>
                <select v-model="form.client_id" class="form-input" required @change="onClientChange">
                  <option value="">{{ t('subscriptions.form.select_client') }}</option>
                  <option v-for="client in clients" :key="client.id" :value="client.id">
                    {{ client.name }} ({{ client.email }})
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label required">{{ t('subscriptions.form.product') }}</label>
                <select v-model="form.product_id" class="form-input" required @change="onProductChange">
                  <option value="">{{ t('subscriptions.form.select_product') }}</option>
                  <option v-for="product in products" :key="product.id" :value="product.id">
                    {{ product.name }} - {{ formatCurrency(product.price || 0) }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Détails de l'abonnement -->
          <div class="form-section">
            <h3 class="section-title">{{ t('subscriptions.form.subscription_details') }}</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">{{ t('subscriptions.form.start_date') }}</label>
                <input 
                  v-model="form.start_date" 
                  type="date" 
                  class="form-input" 
                  required
                >
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('subscriptions.form.end_date') }}</label>
                <input 
                  v-model="form.end_date" 
                  type="date" 
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">{{ t('subscriptions.form.billing_cycle') }}</label>
                <select v-model="form.billing_cycle" class="form-input" required @change="calculateNextBilling">
                  <option value="monthly">{{ t('subscriptions.cycles.monthly') }}</option>
                  <option value="quarterly">{{ t('subscriptions.cycles.quarterly') }}</option>
                  <option value="semi_annual">{{ t('subscriptions.cycles.semi_annual') }}</option>
                  <option value="annual">{{ t('subscriptions.cycles.annual') }}</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('subscriptions.form.next_billing') }}</label>
                <input 
                  v-model="form.next_billing_date" 
                  type="date" 
                  class="form-input"
                  readonly
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">{{ t('subscriptions.form.price') }}</label>
                <div class="input-with-currency">
                  <input 
                    v-model="form.price" 
                    type="number" 
                    class="form-input" 
                    step="0.01" 
                    min="0"
                    required
                  >
                  <span class="currency-symbol">€</span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label required">{{ t('subscriptions.form.status') }}</label>
                <select v-model="form.status" class="form-input" required>
                  <option value="pending">{{ t('subscriptions.status.pending') }}</option>
                  <option value="active">{{ t('subscriptions.status.active') }}</option>
                  <option value="cancelled">{{ t('subscriptions.status.cancelled') }}</option>
                  <option value="expired">{{ t('subscriptions.status.expired') }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Configuration du service -->
          <div class="form-section">
            <h3 class="section-title">{{ t('subscriptions.form.service_config') }}</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('subscriptions.form.server') }}</label>
                <select v-model="form.server_id" class="form-input">
                  <option value="">{{ t('subscriptions.form.select_server') }}</option>
                  <option v-for="server in servers" :key="server.id" :value="server.id">
                    {{ server.name }} ({{ server.type }})
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('subscriptions.form.domain') }}</label>
                <input 
                  v-model="form.domain" 
                  type="text" 
                  class="form-input"
                  :placeholder="t('subscriptions.form.domain_placeholder')"
                >
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('subscriptions.form.username') }}</label>
              <input 
                v-model="form.username" 
                type="text" 
                class="form-input"
                :placeholder="t('subscriptions.form.username_placeholder')"
              >
            </div>
          </div>

          <!-- Options avancées -->
          <div class="form-section">
            <h3 class="section-title">{{ t('subscriptions.form.advanced_options') }}</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('subscriptions.form.auto_renew') }}</label>
                <div class="checkbox-wrapper">
                  <input 
                    id="auto_renew" 
                    v-model="form.auto_renew" 
                    type="checkbox"
                    class="form-checkbox"
                  >
                  <label for="auto_renew" class="checkbox-label">
                    {{ t('subscriptions.form.auto_renew_description') }}
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('subscriptions.form.send_notifications') }}</label>
                <div class="checkbox-wrapper">
                  <input 
                    id="send_notifications" 
                    v-model="form.send_notifications" 
                    type="checkbox"
                    class="form-checkbox"
                  >
                  <label for="send_notifications" class="checkbox-label">
                    {{ t('subscriptions.form.send_notifications_description') }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-section full-width">
            <h3 class="section-title">{{ t('subscriptions.form.notes') }}</h3>
            <div class="form-group">
              <textarea 
                v-model="form.notes" 
                class="form-input" 
                rows="4"
                :placeholder="t('subscriptions.form.notes_placeholder')"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="handleCancel">
            <i class="fas fa-times"></i>
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
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
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { useClientsStore } from '@/stores/clients'
import { useProductStore } from '@/stores/products'
import { useServersStore } from '@/stores/servers'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'

// Import des interfaces
import { Server } from '@/types/server'
import { Product } from '@/types/product'
import type { Subscription, SubscriptionFormData } from '@/types/subscription'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const subscriptionStore = useSubscriptionStore()
const clientsStore = useClientsStore()
const productStore = useProductStore()
const serversStore = useServersStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(false)
const clients = ref<Array<{ id: number; name: string; email: string }>>([])
const products = ref<Product[]>([])
const servers = ref<Server[]>([])

const form = ref<SubscriptionFormData>({
  client_id: '',
  product_id: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  billing_cycle: 'monthly',
  next_billing_date: '',
  price: 0,
  status: 'pending',
  server_id: '',
  domain: '',
  username: '',
  auto_renew: true,
  send_notifications: true,
  notes: ''
})

// Computed
const isEdit = computed(() => !!route.params.id)
const subscriptionId = computed(() => route.params.id ? parseInt(route.params.id as string) : null)

// Watchers
watch(() => form.value.start_date, () => {
  calculateNextBilling()
})

watch(() => form.value.billing_cycle, () => {
  calculateNextBilling()
})

// Méthodes
const fetchData = async () => {
  try {
    await Promise.all([
      clientsStore.fetchClients(),
      productStore.fetchProducts(),
      serversStore.fetchServers()
    ])

    // Conversion explicit des types pour éviter les erreurs never[]
    clients.value = (clientsStore.clients || []) as Array<{ id: number; name: string; email: string }>
    products.value = (productStore.products || []) as Product[]
    servers.value = (serversStore.servers || []) as Server[]
  } catch (error) {
    logger.error('Erreur lors du chargement des données', { error })
  }
}

const onClientChange = () => {
  // Réinitialiser les champs liés au client
  form.value.username = ''
  form.value.domain = ''
}

const onProductChange = () => {
  const selectedProduct = products.value.find(p => p.id == form.value.product_id)
  if (selectedProduct && selectedProduct.price !== undefined) {
    form.value.price = selectedProduct.price
  }
}

const calculateNextBilling = () => {
  if (!form.value.start_date) return
  
  const startDate = new Date(form.value.start_date)
  let nextBilling = new Date(startDate)
  
  switch (form.value.billing_cycle) {
    case 'monthly':
      nextBilling.setMonth(nextBilling.getMonth() + 1)
      break
    case 'quarterly':
      nextBilling.setMonth(nextBilling.getMonth() + 3)
      break
    case 'semi_annual':
      nextBilling.setMonth(nextBilling.getMonth() + 6)
      break
    case 'annual':
      nextBilling.setFullYear(nextBilling.getFullYear() + 1)
      break
  }
  
  form.value.next_billing_date = nextBilling.toISOString().split('T')[0]
}

const fetchSubscription = async () => {
  if (!subscriptionId.value) return
  
  try {
    await subscriptionStore.fetchSubscription(subscriptionId.value)
    const subscription = subscriptionStore.currentSubscription
    if (subscription) {
      // Les données du serveur peuvent ne pas inclure toutes les propriétés du formulaire
      // On les complète avec des valeurs par défaut
      form.value = {
        client_id: subscription.client_id || '',
        product_id: subscription.product_id || '',
        start_date: subscription.start_date || '',
        end_date: subscription.end_date || '',
        billing_cycle: subscription.billing_cycle || 'monthly',
        next_billing_date: subscription.renewal_date || '',
        price: subscription.price || 0,
        status: subscription.status || 'pending',
        server_id: '', // Propriété potentiellement absente de l'API
        domain: '', // Propriété potentiellement absente de l'API
        username: '', // Propriété potentiellement absente de l'API
        auto_renew: subscription.auto_renew || false,
        send_notifications: true, // Propriété potentiellement absente de l'API
        notes: subscription.notes || ''
      }
      
      // Ajout des valeurs supplémentaires si elles existent dans l'objet retourné
      if ('server_id' in subscription) form.value.server_id = String(subscription.server_id || '')
      if ('domain' in subscription) form.value.domain = String(subscription.domain || '')
      if ('username' in subscription) form.value.username = String(subscription.username || '')
      if ('send_notifications' in subscription) form.value.send_notifications = Boolean(subscription.send_notifications)
    }
  } catch (error) {
    logger.error('Erreur lors du chargement de l\'abonnement', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('subscriptions.errors.load_failed')
    })
    router.push('/subscriptions')
  }
}

const handleSubmit = async () => {
  loading.value = true
  
  try {
    // Création d'un objet Subscription partiel compatible avec l'API
    const subscriptionData: Partial<Subscription> = {
      client_id: Number(form.value.client_id),
      product_id: Number(form.value.product_id),
      start_date: form.value.start_date,
      end_date: form.value.end_date || null,
      billing_cycle: form.value.billing_cycle,
      next_billing_date: form.value.next_billing_date,
      price: form.value.price,
      status: form.value.status,
      server_id: form.value.server_id ? Number(form.value.server_id) : null,
      domain: form.value.domain,
      username: form.value.username,
      auto_renew: form.value.auto_renew,
      send_notifications: form.value.send_notifications,
      notes: form.value.notes
    }
    
    if (isEdit.value && subscriptionId.value) {
      // On conserve l'ID dans l'objet pour le formulaire mais on le passe aussi séparément comme premier paramètre
      subscriptionData.id = subscriptionId.value
      await subscriptionStore.updateSubscription(subscriptionId.value, subscriptionData)
      notificationStore.addNotification({
        type: 'success',
        title: t('common.success'),
        message: t('subscriptions.success.updated')
      })
    } else {
      await subscriptionStore.createSubscription(subscriptionData)
      notificationStore.addNotification({
        type: 'success',
        title: t('common.success'),
        message: t('subscriptions.success.created')
      })
    }
    
    router.push('/subscriptions')
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: isEdit.value ? t('subscriptions.errors.update_failed') : t('subscriptions.errors.create_failed')
    })
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/subscriptions')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Lifecycle
onMounted(async () => {
  await fetchData()
  if (isEdit.value) {
    await fetchSubscription()
  } else {
    calculateNextBilling()
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

.input-with-currency {
  position: relative;
}

.currency-symbol {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-weight: 600;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

@media (width <= 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
