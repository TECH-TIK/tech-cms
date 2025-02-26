import { defineStore } from 'pinia'
import axios from 'axios'
import { useNotificationStore } from './notifications'

interface Invoice {
  id: number
  service_id: number
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

export const useInvoiceStore = defineStore('invoices', {
  state: () => ({
    invoices: [] as Invoice[],
    currentInvoice: null as Invoice | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    getInvoiceById: (state) => (id: number) => {
      return state.invoices.find(invoice => invoice.id === id) || null
    },
    
    getInvoicesByStatus: (state) => (status: string) => {
      if (status === 'all') return state.invoices
      return state.invoices.filter(invoice => invoice.status === status)
    }
  },

  actions: {
    async fetchInvoices() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/v1/invoices')
        this.invoices = response.data.invoices
      } catch (error: any) {
        console.error('Erreur lors du chargement des factures:', error)
        this.error = error.response?.data?.message || 'Erreur lors du chargement des factures'
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Erreur',
          message: this.error,
          type: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    async fetchInvoice(id: number) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/v1/invoices/${id}`)
        this.currentInvoice = response.data.invoice
        return response.data.invoice
      } catch (error: any) {
        console.error(`Erreur lors du chargement de la facture ${id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors du chargement de la facture ${id}`
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Erreur',
          message: this.error,
          type: 'error'
        })
        return null
      } finally {
        this.loading = false
      }
    },

    async createInvoice(invoice: Partial<Invoice>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/invoices', invoice)
        this.invoices.unshift(response.data.invoice)
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Facture créée avec succès',
          type: 'success'
        })
        return response.data.invoice
      } catch (error: any) {
        console.error('Erreur lors de la création de la facture:', error)
        this.error = error.response?.data?.message || 'Erreur lors de la création de la facture'
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Erreur',
          message: this.error,
          type: 'error'
        })
        return null
      } finally {
        this.loading = false
      }
    },

    async updateInvoice(invoice: Partial<Invoice>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/v1/invoices/${invoice.id}`, invoice)
        const index = this.invoices.findIndex(i => i.id === invoice.id)
        if (index !== -1) {
          this.invoices[index] = response.data.invoice
        }
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Facture mise à jour avec succès',
          type: 'success'
        })
        return response.data.invoice
      } catch (error: any) {
        console.error(`Erreur lors de la mise à jour de la facture ${invoice.id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors de la mise à jour de la facture ${invoice.id}`
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Erreur',
          message: this.error,
          type: 'error'
        })
        return null
      } finally {
        this.loading = false
      }
    },

    async deleteInvoice(id: number) {
      this.loading = true
      this.error = null
      
      try {
        await axios.delete(`/api/v1/invoices/${id}`)
        this.invoices = this.invoices.filter(invoice => invoice.id !== id)
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Facture supprimée avec succès',
          type: 'success'
        })
        return true
      } catch (error: any) {
        console.error(`Erreur lors de la suppression de la facture ${id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors de la suppression de la facture ${id}`
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Erreur',
          message: this.error,
          type: 'error'
        })
        return false
      } finally {
        this.loading = false
      }
    },

    async markAsPaid(id: number) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/v1/invoices/${id}`, { status: 'paid', paid_at: new Date().toISOString() })
        const index = this.invoices.findIndex(i => i.id === id)
        if (index !== -1) {
          this.invoices[index] = response.data.invoice
        }
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Facture marquée comme payée',
          type: 'success'
        })
        return response.data.invoice
      } catch (error: any) {
        console.error(`Erreur lors du marquage de la facture ${id} comme payée:`, error)
        this.error = error.response?.data?.message || `Erreur lors du marquage de la facture ${id} comme payée`
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Erreur',
          message: this.error,
          type: 'error'
        })
        return null
      } finally {
        this.loading = false
      }
    }
  }
})
