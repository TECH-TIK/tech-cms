import { defineStore } from 'pinia'
import { ApiService } from '@/services/api'
import { useNotificationStore } from './notifications'
import logger from '@/services/logger'
import * as ablyService from '@/services/ably'
import { ref, computed } from 'vue'

interface Invoice {
  id: number
  product_id: number
  amount: number
  due_date: string
  paid_at: string | null
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'deleted'
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  service_name?: string
  client_name?: string
  product_name?: string
  product_price?: number
}

export const useInvoiceStore = defineStore('invoices', () => {
  // État
  const invoices = ref<Invoice[]>([])
  const currentInvoice = ref<Invoice | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const realtimeInitialized = ref(false)
  const lastEventTimestamp = ref<string | null>(null)
  const lastRealtimeEvent = ref<any | null>(null)

  // Getters
  const getInvoiceById = computed(() => (id: number) => {
    return invoices.value.find(invoice => invoice.id === id) || null
  })
  
  const getInvoicesByStatus = computed(() => (status: string) => {
    if (status === 'all') return invoices.value
    return invoices.value.filter(invoice => invoice.status === status)
  })

  // Actions
  const fetchInvoices = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await ApiService.routes.admin.invoice.list()
      invoices.value = response.data.invoices
      return response.data.invoices
    } catch (err: any) {
      logger.error('[INVOICES STORE] Erreur lors du chargement des factures', { error: err })
      error.value = err.response?.data?.message || 'Erreur lors du chargement des factures'
      const notificationStore = useNotificationStore()
      notificationStore.addNotification({
        title: 'Erreur',
        message: error.value || 'Erreur lors du chargement des factures',
        type: 'error'
      })
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchInvoice = async (id: number) => {
    if (!id) return null
    
    loading.value = true
    error.value = null
    
    try {
      const response = await ApiService.routes.admin.invoice.get(id.toString())
      const invoiceData = response.data.invoice
      
      if (invoiceData) {
        currentInvoice.value = invoiceData
      }
    } catch (err: any) {
      logger.error(`[INVOICES STORE] Erreur lors du chargement de la facture ${id}`, { error: err })
      error.value = err.response?.data?.message || `Erreur lors du chargement de la facture ${id}`
      const notificationStore = useNotificationStore()
      notificationStore.addNotification({
        title: 'Erreur',
        message: error.value || `Erreur lors du chargement de la facture ${id}`,
        type: 'error'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const createInvoice = async (invoiceData: any) => {
    loading.value = true
    error.value = null
    const notificationStore = useNotificationStore()
    
    try {
      const response = await ApiService.routes.admin.invoice.create(invoiceData)
      const newInvoice = response.data.invoice
      invoices.value.unshift(newInvoice)
      notificationStore.addNotification({
        title: 'Succès',
        message: 'Facture créée avec succès',
        type: 'success'
      })
      return newInvoice
    } catch (err: any) {
      logger.error('[INVOICES STORE] Erreur lors de la création de la facture', { error: err })
      error.value = err.response?.data?.message || 'Erreur lors de la création de la facture'
      notificationStore.addNotification({
        title: 'Erreur',
        message: error.value || 'Erreur lors de la création de la facture',
        type: 'error'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const updateInvoice = async (id: number | Partial<Invoice>, invoiceData?: Partial<Invoice>) => {
    loading.value = true
    error.value = null
    
    // Gérer le cas où un seul paramètre est passé (c'est un objet avec id)
    let invoiceId: number
    let data: Partial<Invoice>
    
    if (invoiceData) {
      // Deux paramètres : id et data séparés
      invoiceId = id as number
      data = invoiceData
    } else {
      // Un seul paramètre : objet qui contient l'id
      const invoiceObject = id as Partial<Invoice>
      invoiceId = invoiceObject.id as number
      data = { ...invoiceObject }
      delete data.id // Supprime l'id des données envoyées
    }
    
    try {
      const response = await ApiService.routes.admin.invoice.update(invoiceId.toString(), data)
      const index = invoices.value.findIndex(invoice => invoice.id === invoiceId)
      if (index !== -1) {
        invoices.value[index] = response.data.invoice
      }
      if (currentInvoice.value && currentInvoice.value.id === invoiceId) {
        currentInvoice.value = response.data.invoice
      }
      const notificationStore = useNotificationStore()
      notificationStore.addNotification({
        title: 'Succès',
        message: 'Facture mise à jour avec succès',
        type: 'success'
      })
      return response.data.invoice
    } catch (err: any) {
      logger.error(`[INVOICES STORE] Erreur lors de la mise à jour de la facture ${id}`, { error: err })
      error.value = err.response?.data?.message || `Erreur lors de la mise à jour de la facture ${invoiceId}`
      const notificationStore = useNotificationStore()
      notificationStore.addNotification({
        title: 'Erreur',
        message: error.value || `Erreur lors de la mise à jour de la facture ${invoiceId}`,
        type: 'error'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteInvoice = async (id: number) => {
    loading.value = true
    error.value = null
    const notificationStore = useNotificationStore()
    
    try {
      await ApiService.routes.admin.invoice.delete(id.toString())
      invoices.value = invoices.value.filter(invoice => invoice.id !== id)
      notificationStore.addNotification({
        title: 'Succès',
        message: 'Facture supprimée avec succès',
        type: 'success'
      })
      return true
    } catch (err: any) {
      logger.error(`[INVOICES STORE] Erreur lors de la suppression de la facture ${id}`, { error: err })
      error.value = err.response?.data?.message || `Erreur lors de la suppression de la facture ${id}`
      notificationStore.addNotification({
        title: 'Erreur',
        message: error.value || `Erreur lors de la suppression de la facture ${id}`,
        type: 'error'
      })
      return false
    } finally {
      loading.value = false
    }
  }

  const markAsPaid = async (id: number, paymentDetails: any = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // Utiliser la route dédiée du service API centralisé
      const response = await ApiService.routes.admin.invoice.markAsPaid(id.toString(), paymentDetails)
      
      const index = invoices.value.findIndex(i => i.id === id)
      if (index !== -1) {
        invoices.value[index] = response.data.invoice
        logger.info('[INVOICES STORE] Facture marquée comme payée', { invoice_id: id })
      }
      
      // Notification de succès
      const notifStore = useNotificationStore()
      notifStore.addNotification({
        title: 'Succès',
        message: 'Facture marquée comme payée',
        type: 'success'
      })
      
      if (currentInvoice.value && currentInvoice.value.id === id) {
        currentInvoice.value = response.data.invoice
      }
      const notificationStore = useNotificationStore()
      notificationStore.addNotification({
        title: 'Succès',
        message: 'Facture marquée comme payée',
        type: 'success'
      })
      return response.data.invoice
    } catch (err: any) {
      logger.error(`[INVOICES STORE] Erreur lors du marquage de la facture ${id} comme payée`, { error: err })
      error.value = err.response?.data?.message || `Erreur lors du marquage de la facture ${id} comme payée`
      const notificationStore = useNotificationStore()
      notificationStore.addNotification({
        title: 'Erreur',
        message: error.value || `Erreur lors du marquage de la facture ${id} comme payée`,
        type: 'error'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  // Fonctions pour la gestion du temps réel
  const initRealtimeListeners = () => {
    if (realtimeInitialized.value) {
      logger.info('[INVOICES STORE] Les écouteurs temps réel sont déjà initialisés')
      return
    }

    logger.info('[INVOICES STORE] Initialisation des écouteurs temps réel pour les factures')
    
    try {
      ablyService.subscribeToAdminChannel('invoice-update', (eventData) => {
        handleRealtimeInvoiceUpdate(eventData)
      })
      
      realtimeInitialized.value = true
      logger.info('[INVOICES STORE] Écouteurs temps réel initialisés avec succès pour les factures')
    } catch (err) {
      logger.error('[INVOICES STORE] Erreur lors de l\'initialisation des écouteurs temps réel', { error: err })
    }
  }

  const handleRealtimeInvoiceUpdate = (eventData: any) => {
    // Vérifier que nous avons les données nécessaires
    if (!eventData || !eventData.action || !eventData.invoice) {
      logger.warn('[INVOICES STORE] Données d\'événement facture incomplètes', { eventData })
      return
    }

    const { action, invoice, timestamp } = eventData
    
    // Éviter les doublons si l'événement a déjà été traité
    if (lastEventTimestamp.value === timestamp && timestamp) {
      logger.debug('[INVOICES STORE] Événement déjà traité, ignoré', { timestamp })
      return
    }
    
    lastEventTimestamp.value = timestamp
    // Créer une nouvelle référence d'objet pour assurer la réactivité Vue
    lastRealtimeEvent.value = { ...eventData }
    
    logger.info(`[INVOICES STORE] Traitement de l'événement ${action} pour la facture #${invoice.id}`, { 
      timestamp, 
      invoice_id: invoice.id 
    })
    
    switch (action) {
      case 'create':
        // Ajouter la nouvelle facture au début de la liste
        handleInvoiceCreate(invoice)
        break
        
      case 'update':
        // Mettre à jour la facture existante
        handleInvoiceUpdate(invoice)
        break
        
      case 'delete':
        // Supprimer la facture de la liste
        handleInvoiceDelete(invoice.id)
        break
        
      default:
        logger.warn(`[INVOICES STORE] Action inconnue: ${action}`)
    }
  }

  const handleInvoiceCreate = (invoiceData: any) => {
    logger.debug('[INVOICES STORE] Ajout d\'une nouvelle facture en temps réel', { invoice_id: invoiceData.id })
    
    // Vérifier que la facture n'existe pas déjà
    const existingIndex = invoices.value.findIndex(i => i.id === invoiceData.id)
    if (existingIndex !== -1) {
      logger.debug('[INVOICES STORE] Facture existante, mise à jour', { invoice_id: invoiceData.id })
      invoices.value[existingIndex] = invoiceData
      return
    }
    
    // Ajouter la nouvelle facture au début de la liste
    invoices.value.unshift(invoiceData)
    logger.info('[INVOICES STORE] Nouvelle facture ajoutée en temps réel', { invoice_id: invoiceData.id })
  }
  
  const handleInvoiceUpdate = (invoiceData: any) => {
    logger.debug('[INVOICES STORE] Mise à jour d\'une facture en temps réel', { invoice_id: invoiceData.id })
    
    // Trouver la facture et la mettre à jour
    const index = invoices.value.findIndex(i => i.id === invoiceData.id)
    
    if (index !== -1) {
      // Mettre à jour la facture dans la liste
      invoices.value[index] = invoiceData
      logger.debug('[INVOICES STORE] Facture mise à jour avec succès dans la liste', { invoice_id: invoiceData.id })
      
      // Mettre à jour currentInvoice si c'est la facture actuellement consultée
      if (currentInvoice.value && currentInvoice.value.id === invoiceData.id) {
        currentInvoice.value = invoiceData
        logger.debug('[INVOICES STORE] Facture courante mise à jour avec succès', { invoice_id: invoiceData.id })
      }
    } else {
      // Si la facture n'existe pas encore, l'ajouter
      logger.debug('[INVOICES STORE] Facture non trouvée dans la liste, ajout', { invoice_id: invoiceData.id })
      invoices.value.unshift(invoiceData)
    }
  }
  
  const handleInvoiceDelete = (invoiceId: number) => {
    logger.debug('[INVOICES STORE] Suppression d\'une facture en temps réel', { invoice_id: invoiceId })
    
    // Supprimer la facture de la liste
    const initialLength = invoices.value.length
    invoices.value = invoices.value.filter(i => i.id !== invoiceId)
    
    if (invoices.value.length < initialLength) {
      logger.info('[INVOICES STORE] Facture supprimée avec succès en temps réel', { invoice_id: invoiceId })
    } else {
      logger.debug('[INVOICES STORE] Facture non trouvée dans la liste pour suppression', { invoice_id: invoiceId })
    }
  }

  return {
    // État
    invoices,
    currentInvoice,
    loading,
    error,
    realtimeInitialized,
    lastEventTimestamp,
    lastRealtimeEvent,
    
    // Getters
    getInvoiceById,
    getInvoicesByStatus,
    
    // Actions
    fetchInvoices,
    fetchInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    
    // Temps réel
    initRealtimeListeners,
    handleRealtimeInvoiceUpdate,
    handleInvoiceCreate,
    handleInvoiceUpdate,
    handleInvoiceDelete
  }
})