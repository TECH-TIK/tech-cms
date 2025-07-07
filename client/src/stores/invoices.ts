import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ApiService } from '@/services/api'
import logger from '@/services/logger'
import type { Invoice } from '@/types/api'
import type { DashboardRealtimeEvent } from '@/types/realtime'

export const useInvoicesStore = defineStore('invoices', () => {
  // État
  const invoices = ref<Invoice[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<string | null>(null)
  const isUpdating = ref(false)

  // Getters
  const getInvoiceById = computed(() => (id: number) => {
    return invoices.value.find(invoice => invoice.id === id) || null
  })

  const getInvoicesByStatus = computed(() => (status: string) => {
    return invoices.value.filter(invoice => invoice.status === status)
  })

  const unpaidInvoices = computed(() => 
    invoices.value.filter(invoice => invoice.status === 'unpaid')
  )

  const paidInvoices = computed(() => 
    invoices.value.filter(invoice => invoice.status === 'paid')
  )

  const overdueInvoices = computed(() => 
    invoices.value.filter(invoice => invoice.status === 'overdue')
  )

  const totalDue = computed(() => 
    unpaidInvoices.value.reduce((sum, invoice) => sum + invoice.amount, 0)
  )

  const totalPaid = computed(() => 
    paidInvoices.value.reduce((sum, invoice) => sum + invoice.amount, 0)
  )

  const totalInvoices = computed(() => invoices.value.length)

  // Actions
  const fetchInvoices = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await ApiService.routes.client.invoice.list()
      invoices.value = response.data
      lastUpdate.value = new Date().toISOString()
      
      logger.info('[INVOICES STORE] Factures chargées', { 
        count: invoices.value.length,
        unpaid: unpaidInvoices.value.length,
        paid: paidInvoices.value.length,
        overdue: overdueInvoices.value.length,
        totalDue: totalDue.value
      })
      
      return response.data
    } catch (err: any) {
      logger.error('[INVOICES STORE] Erreur lors du chargement des factures', { error: err })
      error.value = err.response?.data?.message || 'Erreur lors du chargement des factures'
      throw err
    } finally {
      loading.value = false
    }
  }

  const refreshInvoices = async () => {
    logger.info('[INVOICES STORE] Actualisation des factures')
    return await fetchInvoices()
  }

  // Handler pour les mises à jour temps réel
  const handleInvoiceUpdate = async (event: DashboardRealtimeEvent) => {
    logger.info('[INVOICES STORE] Mise à jour facture reçue', { event })

    // 🔍 LOGS DIAGNOSTIC DÉTAILLÉS - HANDLER INVOICES STORE
    logger.info('[INVOICES STORE] 📊 ANALYSE STRUCTURE EVENT REÇU:', {
      'event_keys': Object.keys(event),
      'event.action': event.action,
      'event.entity_type': event.entity_type,
      'event.data_exists': !!event.data,
      'event.data_keys': event.data ? Object.keys(event.data) : null,
      'event.data.invoice_exists': event.data ? !!event.data.invoice : null,
      'event.invoice_exists': !!(event as any).invoice,
      'structure_complete': JSON.stringify(event, null, 2)
    })

    if (!event.data.invoice) {
      logger.error('[INVOICES STORE] ❌ AUCUNE DONNÉE FACTURE TROUVÉE dans event.data.invoice')
      return
    }

    isUpdating.value = true
    const rawInvoice: any = event.data.invoice
    const action = event.action || event.data.action

    // Normaliser les données de la facture
    const invoice = {
      id: rawInvoice.id,
      client_id: rawInvoice.client_id,
      number: rawInvoice.number || `INV-${rawInvoice.id}`,
      amount: parseFloat(rawInvoice.amount || 0),
      status: rawInvoice.status || 'unpaid',
      created_at: rawInvoice.created_at,
      due_date: rawInvoice.due_date,
      notes: rawInvoice.notes || '',
      updated_at: rawInvoice.updated_at
    }

    logger.info('[INVOICES STORE] Traitement événement facture', { 
      action, 
      invoiceId: invoice.id, 
      invoiceNumber: invoice.number,
      invoiceStatus: invoice.status,
      invoiceAmount: invoice.amount
    })

    // Gérer les différentes actions
    switch (action) {
      case 'invoice_create':
      case 'create':
      case 'created':
        // Pour les créations, récupérer la liste complète du backend
        logger.info('[INVOICES STORE] Facture créée - récupération liste complète prévue', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number
        })
        
        try {
          await fetchInvoices()
          logger.info('[INVOICES STORE] Liste des factures mise à jour après création')
        } catch (error) {
          logger.error('[INVOICES STORE] Erreur lors de la récupération après création', { error })
          // En cas d'erreur, ajouter localement
          const existingIndex = invoices.value.findIndex(i => i.id === invoice.id)
          if (existingIndex === -1) {
            invoices.value.unshift(invoice)
          }
        }
        break

      case 'invoice_update':
      case 'update':
      case 'updated':
        // Mettre à jour la facture existante en préservant les données existantes
        const updateIndex = invoices.value.findIndex(i => i.id === invoice.id)
        if (updateIndex !== -1) {
          const oldStatus = invoices.value[updateIndex].status
          // Merger les nouvelles données avec les existantes pour préserver tous les champs
          invoices.value[updateIndex] = { ...invoices.value[updateIndex], ...invoice }
          logger.info('[INVOICES STORE] Facture mise à jour', {
            invoiceId: invoice.id,
            oldStatus,
            newStatus: invoice.status,
            invoiceNumber: invoices.value[updateIndex].number
          })
        }
        break

      default:
        // Action inconnue, mettre à jour la facture si elle existe en préservant les données
        const existingIndex = invoices.value.findIndex(i => i.id === invoice.id)
        if (existingIndex !== -1) {
          // Merger les nouvelles données avec les existantes pour préserver tous les champs
          invoices.value[existingIndex] = { ...invoices.value[existingIndex], ...invoice }
          logger.info('[INVOICES STORE] Facture mise à jour (action inconnue)', {
            invoiceId: invoice.id,
            action,
            invoiceNumber: invoices.value[existingIndex].number
          })
        }
        break
    }

    lastUpdate.value = new Date().toISOString()
    setTimeout(() => { isUpdating.value = false }, 1000)
  }

  // Méthodes utilitaires
  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    invoices.value = []
    loading.value = false
    error.value = null
    lastUpdate.value = null
    isUpdating.value = false
  }

  return {
    // État
    invoices,
    loading,
    error,
    lastUpdate,
    isUpdating,
    
    // Getters
    getInvoiceById,
    getInvoicesByStatus,
    unpaidInvoices,
    paidInvoices,
    overdueInvoices,
    totalDue,
    totalPaid,
    totalInvoices,
    
    // Actions
    fetchInvoices,
    refreshInvoices,
    handleInvoiceUpdate,
    clearError,
    reset
  }
})
