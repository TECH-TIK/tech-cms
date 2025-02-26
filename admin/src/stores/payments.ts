import { defineStore } from 'pinia'
import axios from 'axios'
import { useNotificationStore } from './notifications'

interface Payment {
  id: number
  invoice_id: number
  amount: number
  payment_date: string
  payment_method: string
  transaction_id: string | null
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  notes: string | null
  created_at: string
  updated_at: string | null
  invoice_number?: string
  client_name?: string
}

export const usePaymentStore = defineStore('payments', {
  state: () => ({
    payments: [] as Payment[],
    currentPayment: null as Payment | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    getPaymentById: (state) => (id: number) => {
      return state.payments.find(payment => payment.id === id) || null
    },
    
    getPaymentsByStatus: (state) => (status: string) => {
      if (status === 'all') return state.payments
      return state.payments.filter(payment => payment.status === status)
    }
  },

  actions: {
    async fetchPayments() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/v1/payments')
        this.payments = response.data.payments
      } catch (error: any) {
        console.error('Erreur lors du chargement des paiements:', error)
        this.error = error.response?.data?.message || 'Erreur lors du chargement des paiements'
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

    async fetchPayment(id: number) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/v1/payments/${id}`)
        this.currentPayment = response.data.payment
        return response.data.payment
      } catch (error: any) {
        console.error(`Erreur lors du chargement du paiement ${id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors du chargement du paiement ${id}`
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

    async createPayment(payment: Partial<Payment>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/payments', payment)
        this.payments.unshift(response.data.payment)
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Paiement créé avec succès',
          type: 'success'
        })
        return response.data.payment
      } catch (error: any) {
        console.error('Erreur lors de la création du paiement:', error)
        this.error = error.response?.data?.message || 'Erreur lors de la création du paiement'
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

    async updatePayment(payment: Partial<Payment>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/v1/payments/${payment.id}`, payment)
        const index = this.payments.findIndex(p => p.id === payment.id)
        if (index !== -1) {
          this.payments[index] = response.data.payment
        }
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Paiement mis à jour avec succès',
          type: 'success'
        })
        return response.data.payment
      } catch (error: any) {
        console.error(`Erreur lors de la mise à jour du paiement ${payment.id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors de la mise à jour du paiement ${payment.id}`
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

    async deletePayment(id: number) {
      this.loading = true
      this.error = null
      
      try {
        await axios.delete(`/api/v1/payments/${id}`)
        this.payments = this.payments.filter(payment => payment.id !== id)
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Paiement supprimé avec succès',
          type: 'success'
        })
        return true
      } catch (error: any) {
        console.error(`Erreur lors de la suppression du paiement ${id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors de la suppression du paiement ${id}`
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

    async processRefund(id: number, reason: string) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`/api/v1/payments/${id}/refund`, { reason })
        const index = this.payments.findIndex(p => p.id === id)
        if (index !== -1) {
          this.payments[index] = response.data.payment
        }
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Remboursement traité avec succès',
          type: 'success'
        })
        return response.data.payment
      } catch (error: any) {
        console.error(`Erreur lors du remboursement du paiement ${id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors du remboursement du paiement ${id}`
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
