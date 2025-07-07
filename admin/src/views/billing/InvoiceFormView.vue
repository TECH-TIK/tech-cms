<template>
  <div class="invoice-form-view view-container">
    <!-- En-tête avec titre et navigation -->
    <div class="header-box">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/invoices" class="breadcrumb-link">
            <i class="fas fa-arrow-left"></i>
            {{ t('invoices.title') }}
          </router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">
            {{ isEdit ? t('invoices.edit_title') : t('invoices.create_title') }}
          </span>
        </div>
        <h1 class="page-title">
          {{ isEdit ? t('invoices.edit_title') : t('invoices.create_title') }}
        </h1>
        <span class="page-description">
          {{ isEdit ? t('invoices.edit_description') : t('invoices.create_description') }}
        </span>
      </div>
    </div>

    <!-- Formulaire de facture -->
    <div class="form-container box">
      <form @submit.prevent="submitForm">
        <!-- Informations client -->
        <div class="form-section">
          <h2 class="section-title">{{ t('invoices.form.client_info') }}</h2>

          <div class="form-grid">
<div class="form-group">
              <label class="form-label">{{ t('invoices.form.client') }}</label>
              <select v-model="form.client_id" class="form-control" required @change="onClientChange">
                <option value="">{{ t('invoices.form.select_client') }}</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">
                  {{ client.name }} ({{ client.email }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('invoices.form.service') }}</label>
              <select v-model="form.service_id" class="form-control" @change="onServiceChange">
                <option value="">{{ t('invoices.form.select_service') }}</option>
                <option v-for="service in clientServices" :key="service.id" :value="service.id">
                  {{ service.name }} - {{ formatCurrency(service.price) }}
                </option>
              </select>
            </div>
          </div>
</div>

        <!-- Détails de la facture -->
        <div class="form-section">
          <h2 class="section-title">{{ t('invoices.form.invoice_details') }}</h2>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">{{ t('invoices.form.date') }}</label>
              <input
                v-model="form.date"
                type="date"
                class="form-control"
                required
              >
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('invoices.form.due_date') }}</label>
              <input
                v-model="form.due_date"
                type="date"
                class="form-control"
              >
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('invoices.form.status') }}</label>
              <select v-model="form.status" class="form-control" required>
                <option value="unpaid">{{ t('invoices.status.unpaid') }}</option>
                <option value="paid">{{ t('invoices.status.paid') }}</option>
                <option value="overdue">{{ t('invoices.status.overdue') }}</option>
                <option value="cancelled">{{ t('invoices.status.cancelled') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('invoices.form.amount') }}</label>
              <input
                v-model="form.amount"
                type="number"
                class="form-control"
                step="0.01"
                min="0"
                required
              >
            </div>
          </div>
        </div>

          <!-- Éléments de facturation -->
          <div class="form-section full-width">
            <h3 class="section-title">{{ t('invoices.form.items') }}</h3>
            
            <div class="invoice-items">
              <div v-for="(item, index) in form.items" :key="index" class="invoice-item">
                <div class="item-row">
                  <div class="item-field">
                    <label class="form-label">{{ t('invoices.form.item_description') }}</label>
                    <input 
                      v-model="item.description" 
                      type="text" 
                      class="form-input"
                      :placeholder="t('invoices.form.item_description_placeholder')"
                    >
                  </div>
                  
                  <div class="item-field quantity">
                    <label class="form-label">{{ t('invoices.form.quantity') }}</label>
                    <input 
                      v-model="item.quantity" 
                      type="number" 
                      class="form-input" 
                      min="1"
                      @input="calculateItemTotal(index)"
                    >
                  </div>
                  
                  <div class="item-field price">
                    <label class="form-label">{{ t('invoices.form.unit_price') }}</label>
                    <input 
                      v-model="item.unit_price" 
                      type="number" 
                      class="form-input" 
                      step="0.01"
                      @input="calculateItemTotal(index)"
                    >
                  </div>
                  
                  <div class="item-field total">
                    <label class="form-label">{{ t('invoices.form.total') }}</label>
                    <div class="total-display">{{ formatCurrency(item.total || 0) }}</div>
                  </div>
                  
                  <div class="item-actions">
                    <button 
                      type="button" 
                      class="btn-icon btn-danger" 
                      :disabled="form.items.length === 1"
                      @click="removeItem(index)"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <button type="button" class="btn btn-secondary" @click="addItem">
                <i class="fas fa-plus"></i>
                {{ t('invoices.form.add_item') }}
              </button>
            </div>
          </div>

        <!-- Notes -->
        <div class="form-section">
          <h2 class="section-title">{{ t('invoices.form.notes') }}</h2>
          <div class="form-group">
            <textarea
              v-model="form.notes"
              class="form-control"
              rows="4"
              :placeholder="t('invoices.form.notes_placeholder')"
            ></textarea>
          </div>
        </div>

        <!-- Résumé et total -->
        <div class="invoice-summary">
          <div class="summary-row">
            <span class="summary-label">{{ t('invoices.form.subtotal') }}</span>
            <span class="summary-value">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">{{ t('invoices.form.tax') }} ({{ taxRate }}%)</span>
            <span class="summary-value">{{ formatCurrency(taxAmount) }}</span>
          </div>
          <div class="summary-row total-row">
            <span class="summary-label">{{ t('invoices.form.total') }}</span>
            <span class="summary-value">{{ formatCurrency(totalAmount) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="handleCancel">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">
              <span class="spinner-border spinner-border-sm mr-2"></span>
              {{ t('common.saving') }}
            </span>
            <span v-else>
              {{ isEdit ? t('common.save') : t('common.create') }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Invoice } from '@/types/payment'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useInvoiceStore } from '@/stores/invoices'
import { useClientsStore } from '@/stores/clients'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'
import { ApiService } from '@/services/api';

interface Client {
  id: number;
  name: string;
  email: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  client_id?: number;
  product_id?: number;
  product_name?: string;
  description?: string;
}

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const invoiceStore = useInvoiceStore()
const clientsStore = useClientsStore()
const notificationStore = useNotificationStore()

// Déterminer si c'est un mode édition en fonction de l'URL
const isEdit = ref(false)
const invoiceId = ref<string | null>(null)
if (route.params.id) {
  invoiceId.value = route.params.id as string
  isEdit.value = true
}

// État
const loading = ref(false)
const clients = ref<Client[]>([])
const clientServices = ref<Service[]>([])
const taxRate = ref(20) // 20% TVA par défaut

// Fonction pour calculer la date d'échéance par défaut (J+30)
const getDefaultDueDate = () => {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0] // Format YYYY-MM-DD
}

const form = ref({
  client_id: '',
  service_id: '',
  product_id: 0,  // Ajout du product_id nécessaire pour le backend
  date: new Date().toISOString().split('T')[0],
  due_date: getDefaultDueDate(), // Date d'échéance à J+30 par défaut
  status: 'unpaid',
  amount: 0,      // Utilisation de 'amount' pour correspondre à la structure de la BDD
  notes: '',
  items: [
    {
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    }
  ]
})

// Computed
// Fonction utilitaire pour s'assurer que items est toujours un tableau valide
function ensureItemsArray() {
  if (!form.value) {
    logger.warn('[INVOICE-FORM] form.value est undefined')
    // Initialiser avec un objet qui correspond à la structure attendue
    form.value = {
      client_id: '',
      service_id: '',
      product_id: 0,
      date: '',
      due_date: '',
      status: 'pending',
      amount: 0,
      notes: '',
      items: []
    }
  }
  
  if (!form.value.items) {
    logger.warn('[INVOICE-FORM] form.value.items est undefined')
    form.value.items = []
  }
  
  if (!Array.isArray(form.value.items)) {
    logger.warn('[INVOICE-FORM] form.value.items n\'est pas un tableau', { type: typeof form.value.items })
    // Convertir en tableau si possible, sinon initialiser avec un tableau vide
    try {
      form.value.items = Array.isArray(form.value.items) ? form.value.items : []
    } catch (error) {
      logger.error('[INVOICE-FORM] Erreur lors de la conversion en tableau', { error })
      form.value.items = []
    }
  }
}

// Appeler la fonction pour s'assurer que le tableau est valide lors de l'initialisation
ensureItemsArray()

const subtotal = computed(() => {
  // On n'effectue plus de modifications dans la fonction computed
  // On utilise simplement les valeurs existantes
  if (!form.value || !form.value.items || !Array.isArray(form.value.items)) {
    return 0
  }
  
  try {
    return form.value.items.reduce((sum, item) => {
      if (!item) return sum
      return sum + (Number(item.total) || 0)
    }, 0)
  } catch (error) {
    logger.error('[INVOICE-FORM] Erreur lors du calcul du sous-total', { error })
    return 0
  }
})

const taxAmount = computed(() => {
  return subtotal.value * (taxRate.value / 100)
})

const totalAmount = computed(() => {
  return subtotal.value + taxAmount.value
})

// Watchers
watch(totalAmount, (newTotal) => {
  form.value.amount = newTotal
  logger.info('Montant total mis à jour:', { amount: newTotal })
})

// Méthodes
const loadClients = async () => {
  try {
    await clientsStore.fetchClients()
    clients.value = clientsStore.clients as Client[]
  } catch (error) {
    logger.error('Erreur lors du chargement des clients', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('invoices.error.load_clients')
    })
  }
}

const loadClientServices = async (clientId: string | number) => {
  try {
    logger.info(`Chargement des services pour le client ${clientId}`)
    
    // Utilisation du service API centralisé pour récupérer les services du client
    // La gestion des headers et tokens d'authentification est déjà configurée dans le service API
    const response = await ApiService.routes.admin.service.getClientServices(clientId.toString())
    
    logger.info(`Statut de la réponse API: ${response.status}`)
    logger.info('Données reçues de l\'API:', { data: response.data })
    
    // Avec axios, les données sont directement accessibles via response.data
    const data = response.data
    
    // Vérifier si les services sont dans la réponse avec plusieurs structures possibles
    // Puis normaliser les données pour avoir un format uniforme
    let rawServices = [];
    if (data?.services) {
      rawServices = data.services;
    } else if (Array.isArray(data)) {
      rawServices = data;
    } else if (data?.data) {
      rawServices = data.data;
    }
    
    // Transformation des données pour assurer la présence des propriétés requises
    clientServices.value = rawServices.map((service: any) => {
      // Log détaillé pour chaque service
      logger.debug('Structure du service brut:', service);

      // Récupérer le nom du produit s'il est disponible
      const productName = service.product_name || 
                        (service.product ? service.product.name : null) || 
                        service.title || 
                        service.name || 
                        `Service ${service.id || 'inconnu'}`;
      
      // Normaliser les données
      return {
        id: service.id || 0,
        name: productName,
        description: service.description || '',
        price: parseFloat(service.price || service.amount || service.cost || 0),
        client_id: Number(clientId),
        product_id: service.product_id || service.id || 0
      };
    }) as Service[]
    
    // Log très détaillé des données brutes et des services normalisés pour débogage
    logger.info('Données brutes des services:', { data: rawServices })
    logger.info('Services normalisés:', { services: clientServices.value })
    
    logger.info(`${clientServices.value.length} services chargés pour le client ${clientId}`)
  } catch (error) {
    logger.error('Erreur lors du chargement des services du client', { error })
    
    // Aucune donnée simulée - initialiser avec une liste vide
    clientServices.value = []
    
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: 'Impossible de charger les services. Veuillez vérifier votre connexion ou contacter l\'administrateur.'
    })
  }
}

const onClientChange = () => {
  if (form.value.client_id) {
    loadClientServices(form.value.client_id)
  } else {
    clientServices.value = []
  }
  // Réinitialiser le service sélectionné quand on change de client
  form.value.service_id = ''
  form.value.product_id = 0  // Utiliser 0 au lieu de null pour éviter les erreurs TypeScript
}

const onServiceChange = () => {
  logger.info('Service sélectionné:', { serviceId: form.value.service_id })
  
  // Si un service est sélectionné, récupérer son product_id
  if (form.value.service_id) {
    // Nous comparons des IDs qui peuvent être des chaînes ou des nombres
    const selectedService = clientServices.value.find(s => String(s.id) === String(form.value.service_id))
    
    if (selectedService) {
      logger.info('Service trouvé:', selectedService)
      
      // Associer EXPLICITEMENT le product_id du service sélectionné
      // Les IDs de la réponse API sont des chaînes, nous utilisons celles-ci directement
      // Et nous convertissons en nombre pour le formulaire
      const productId = selectedService.product_id || selectedService.id
      form.value.product_id = parseInt(String(productId))
      
      // Associer également le montant si vide
      if (form.value.amount === 0) {
        const price = selectedService.price || 0
        form.value.amount = price
        logger.info('Prix associé au service:', { price })
      }
      
      logger.info('Product ID associé:', { productId: form.value.product_id })
      logger.info('Montant associé:', { amount: form.value.amount })
    } else {
      logger.error('Service sélectionné non trouvé dans la liste des services disponibles', { 
        selectedId: form.value.service_id, 
        availableServices: clientServices.value.map(s => ({ id: s.id, name: s.name }))
      })
    }
  } else {
    // Réinitialiser le product_id si aucun service n'est sélectionné
    form.value.product_id = 0
  }
}

const addItem = () => {
  form.value.items.push({
    description: '',
    quantity: 1,
    unit_price: 0,
    total: 0
  })
}

const removeItem = (index: number) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

const calculateItemTotal = (index: number) => {
  const item = form.value.items[index]
  item.total = (item.quantity || 0) * (item.unit_price || 0)
}

const fetchInvoice = async () => {
  if (isEdit.value && invoiceId.value) {
    try {
      // Récupérer la facture depuis le store
      const invoiceData = await invoiceStore.fetchInvoice(parseInt(invoiceId.value))
      
      // Vérification de sécurité avant de continuer
      if (!invoiceData) {
        logger.warn('[INVOICE-FORM] Aucune donnée de facture reçue')
        return
      }
      
      // Convertir explicitement en type Invoice pour éviter les erreurs TypeScript
      const invoice = invoiceData as unknown as Invoice
      
      // Sauvegarder le tableau d'items actuel pour le restaurer si nécessaire
      const currentItems = [...form.value.items]
      
      // Préparer les données en convertissant les types si nécessaire
      // Normaliser les items pour s'assurer que unit_price est bien un nombre
      let normalizedItems = [];
      if (Array.isArray(invoice.items)) {
        normalizedItems = invoice.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : Number(item.unit_price),
          total: Number(item.total)
        }));
      } else {
        normalizedItems = currentItems;
      }
      
      const updatedForm = { 
        ...form.value,
        // Ajouter explicitement toutes les propriétés de invoice avec conversion de types si nécessaire
        id: invoice.id,
        client_id: invoice.client_id ? String(invoice.client_id) : '',
        product_id: invoice.product_id,
        amount: invoice.amount,
        due_date: invoice.due_date,
        status: invoice.status,
        notes: invoice.notes || '',
        service_id: (invoice as any).service_id ? String((invoice as any).service_id) : '',
        // Utiliser les items normalisés
        items: normalizedItems
      }
      
      // Assigner le formulaire mis à jour
      form.value = updatedForm
      
      // Log pour débogage
      logger.info('[INVOICE-FORM] Formulaire initialisé avec les données de la facture', { 
        form: form.value, 
        invoice 
      })
    } catch (error) {
      logger.error('Erreur lors du chargement de la facture', { error })
      notificationStore.addNotification({
        type: 'error',
        title: t('common.error'),
        message: t('invoices.errors.load_failed')
      })
      router.push('/invoices')
    }
  }
}

const submitForm = async () => {
  loading.value = true
  
  try {
    if (isEdit.value && invoiceId.value) {
      // Vérifier si updateInvoice accepte un ou deux arguments
      await invoiceStore.updateInvoice({
        ...form.value, 
        id: parseInt(invoiceId.value),
        status: form.value.status as 'pending' | 'paid' | 'overdue' | 'cancelled' | 'deleted'
      })
      notificationStore.addNotification({
        type: 'success',
        title: t('common.success'),
        message: t('invoices.success.updated')
      })
    } else {
      await invoiceStore.createInvoice({
        ...form.value,
        status: form.value.status as 'pending' | 'paid' | 'overdue' | 'cancelled' | 'deleted'
      })
      notificationStore.addNotification({
        type: 'success',
        title: t('common.success'),
        message: t('invoices.success.created')
      })
    }
    
    // Redirection vers la liste des factures
    router.push('/invoices')
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement de la facture', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('invoices.error.save_failed')
    })
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/invoices')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Lifecycle hooks
onMounted(async () => {
  // Chargement des clients
  await loadClients()
  if (isEdit.value) {
    await fetchInvoice()
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

.invoice-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.invoice-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  background: var(--background-secondary);
}

.item-row {
  display: grid;
  grid-template-columns: 2fr 80px 120px 120px 40px;
  gap: 1rem;
  align-items: end;
}

.item-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.total-display {
  height: 40px;
  display: flex;
  align-items: center;
  font-weight: 600;
  color: var(--success-color);
}

.item-actions {
  display: flex;
  align-items: end;
}

.invoice-summary {
  background: var(--card-background);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-top: 2rem;
  max-width: 400px;
  margin-left: auto;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-row.total-row {
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.summary-label {
  color: var(--text-secondary);
}

.summary-value {
  color: var(--text-primary);
  font-weight: 600;
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
  
  .item-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .invoice-summary {
    margin-left: 0;
  }
}
</style>
