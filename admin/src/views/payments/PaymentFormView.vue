<template>
  <div class="payment-form-view view-container">
    <!-- En-tête avec titre et navigation -->
    <div class="header-box">
      <div class="header-content">
        <div class="breadcrumb">
          <router-link to="/payments" class="breadcrumb-link">
            <i class="fas fa-arrow-left"></i>
            {{ t('payments.title') }}
          </router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">
            {{ isEdit ? t('payments.edit_title') : t('payments.create_title') }}
          </span>
        </div>
        <h1 class="page-title">
          {{ isEdit ? t('payments.edit_title') : t('payments.create_title') }}
        </h1>
        <span class="page-description">
          {{ isEdit ? t('payments.edit_description') : t('payments.create_description') }}
        </span>
      </div>
    </div>

    <!-- Formulaire de paiement -->
    <div class="form-container box">
      <form @submit.prevent="handleSubmit">
        <!-- Informations de base -->
        <div class="form-section">
          <h2 class="section-title">{{ t('payments.form.basic_info') }}</h2>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">{{ t('payments.form.invoice') }}</label>
              <select v-model="form.invoice_id" class="form-control" required>
                <option value="">{{ t('payments.form.select_invoice') }}</option>
                <option v-for="invoice in invoices" :key="invoice.id" :value="invoice.id">
                  #{{ invoice.id }} - {{ invoice.client_name }} ({{ formatCurrency(invoice.amount) }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('payments.form.amount') }}</label>
              <input
                v-model="form.amount"
                type="number"
                class="form-control"
                step="0.01"
                min="0"
                required
              >
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('payments.form.method') }}</label>
              <select v-model="form.method" class="form-control" required>
                <option value="">{{ t('payments.form.select_method') }}</option>
                <option v-for="gateway in paymentGateways" :key="gateway.key" :value="gateway.key">
                  {{ gateway.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">{{ t('payments.form.status') }}</label>
              <select v-model="form.status" class="form-control" required>
                <option value="completed">{{ t('payments.status.completed') }}</option>
                <option value="pending">{{ t('payments.status.pending') }}</option>
                <option value="failed">{{ t('payments.status.failed') }}</option>
                <option value="refunded">{{ t('payments.status.refunded') }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Informations additionnelles -->
        <div class="form-section">
          <h2 class="section-title">{{ t('payments.form.additional_info') }}</h2>

          <div class="form-group">
            <label class="form-label">{{ t('payments.form.transaction_id') }}</label>
            <input
              v-model="form.transaction_id"
              type="text"
              class="form-control"
              :placeholder="t('payments.form.transaction_id_placeholder')"
            >
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('payments.form.notes') }}</label>
            <textarea
              v-model="form.notes"
              class="form-control"
              rows="4"
              :placeholder="t('payments.form.notes_placeholder')"
            ></textarea>
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
import { ref, computed, onMounted } from 'vue'
import { ApiService } from '@/services/api'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePaymentStore } from '@/stores/payments'
import { useInvoiceStore } from '@/stores/invoices'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'
import type { Payment, PaymentFormData, Invoice } from '@/types/payment'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const paymentStore = usePaymentStore()
const invoiceStore = useInvoiceStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(false)
const invoices = ref<Invoice[]>([])

// Définition du type pour les passerelles de paiement
interface PaymentGateway {
  key: string;
  name: string;
}

const paymentGateways = ref<PaymentGateway[]>([])

const form = ref<PaymentFormData>({
  invoice_id: '',
  amount: '',
  method: '', // Utilise method comme alias de payment_method pour cohérence
  status: 'completed',
  transaction_id: '',
  notes: ''
})

// Computed
const isEdit = computed(() => !!route.params.id)
const paymentId = computed(() => route.params.id ? parseInt(route.params.id as string) : null)

// Méthodes
const fetchInvoices = async () => {
  try {
    await invoiceStore.fetchInvoices()
    // Inclure toutes les factures, peu importe leur statut
    // Cette modification permet d'afficher toutes les factures disponibles dans le menu déroulant
    // incluant celles avec le statut 'paid', 'unpaid', 'draft', etc.
    
    // Simuler l'adaptation vers le type Invoice avec as unknown
    // Cette approche permet de contourner les incompatibilités de type
    // tout en préservant l'accès aux propriétés existantes
    invoices.value = invoiceStore.invoices as unknown as Invoice[]
  } catch (error) {
    logger.error('Erreur lors du chargement des factures', { error })
  }
}

const fetchPayment = async () => {
  if (!paymentId.value) return
  
  try {
    const payment = await paymentStore.fetchPayment(paymentId.value)
    if (payment) {
      // Adapter les propriétés du payment pour le formulaire
      form.value = {
        invoice_id: payment.invoice_id,
        amount: payment.amount.toString(),
        method: payment.payment_method, // Conversion des propriétés
        status: payment.status,
        transaction_id: payment.transaction_id || '',
        notes: payment.notes || ''
      }
    }
  } catch (error) {
    logger.error('Erreur lors du chargement du paiement', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: t('payments.errors.load_failed')
    })
    router.push('/payments')
  }
}

const handleSubmit = async () => {
  loading.value = true
  
  try {
    if (isEdit.value) {
      // Adapter le formulaire pour la mise à jour du paiement
      const paymentData = {
        invoice_id: Number(form.value.invoice_id),
        amount: Number(form.value.amount),
        payment_method: form.value.method,
        status: form.value.status as 'completed' | 'pending' | 'failed' | 'refunded',
        transaction_id: form.value.transaction_id,
        notes: form.value.notes
      }
      // Correction : passer l'ID comme premier paramètre et les données comme second paramètre
      await paymentStore.updatePayment(paymentId.value!, paymentData)
      notificationStore.addNotification({
        type: 'success',
        title: t('common.success'),
        message: t('payments.success.updated')
      })
    } else {
      // Adapter le formulaire pour la création du paiement
      const paymentData: Partial<Payment> = {
        invoice_id: Number(form.value.invoice_id),
        amount: Number(form.value.amount),
        payment_method: form.value.method,
        status: form.value.status as 'completed' | 'pending' | 'failed' | 'refunded',
        transaction_id: form.value.transaction_id,
        notes: form.value.notes
      }
      await paymentStore.createPayment(paymentData)
      notificationStore.addNotification({
        type: 'success',
        title: t('common.success'),
        message: t('payments.success.created')
      })
    }
    
    router.push('/payments')
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du paiement', { error })
    notificationStore.addNotification({
      type: 'error',
      title: t('common.error'),
      message: isEdit.value ? t('payments.errors.update_failed') : t('payments.errors.create_failed')
    })
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/payments')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Fonction pour charger les passerelles de paiement disponibles
const fetchPaymentGateways = async () => {
  try {
    logger.debug('Chargement des modules de paiement')
    const response = await ApiService.routes.admin.system.module.list('gateways')
    const data = response.data
    
    if (data.success && data.data && data.data.gateways) {
      // Transformation des données pour alimenter le select
      const gateways: PaymentGateway[] = []
      
      // Typé pour éviter les erreurs TypeScript
      interface GatewayData {
        active: boolean;
        name: string;
      }
      
      Object.entries(data.data.gateways).forEach(([key, value]) => {
        // Cast en type GatewayData
        const gatewayData = value as GatewayData
        
        // Vérifier si la passerelle est active avant de l'ajouter
        if (gatewayData.active) {
          gateways.push({
            key: key, // Clé pour l'identification
            name: gatewayData.name // Nom affiché
          })
        }
      })
      
      paymentGateways.value = gateways
      logger.info('Modules de paiement chargés', { count: gateways.length })
    } else {
      logger.warn('Format de réponse inattendu pour les modules de paiement', { data })
      // Aucun module disponible en cas d'erreur
      paymentGateways.value = []
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des modules de paiement', { error })
    // Aucun module disponible en cas d'erreur
    paymentGateways.value = []
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchInvoices(),
    fetchPaymentGateways()
  ])
  
  if (isEdit.value) {
    await fetchPayment()
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
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
