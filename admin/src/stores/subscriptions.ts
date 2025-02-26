import { defineStore } from 'pinia'
import axios from 'axios'
import { useNotificationStore } from './notifications'

interface Subscription {
  id: number
  client_id: number
  service_id: number
  start_date: string
  end_date: string | null
  renewal_date: string | null
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  price: number
  billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual'
  auto_renew: boolean
  notes: string | null
  created_at: string
  updated_at: string | null
  client_name?: string
  service_name?: string
}

export const useSubscriptionStore = defineStore('subscriptions', {
  state: () => ({
    subscriptions: [] as Subscription[],
    currentSubscription: null as Subscription | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    getSubscriptionById: (state) => (id: number) => {
      return state.subscriptions.find(subscription => subscription.id === id) || null
    },
    
    getSubscriptionsByStatus: (state) => (status: string) => {
      if (status === 'all') return state.subscriptions
      return state.subscriptions.filter(subscription => subscription.status === status)
    },

    getActiveSubscriptions: (state) => {
      return state.subscriptions.filter(subscription => subscription.status === 'active')
    },

    getExpiringSoonSubscriptions: (state) => {
      const today = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(today.getDate() + 30)
      
      return state.subscriptions.filter(subscription => {
        if (subscription.status !== 'active' || !subscription.renewal_date) return false
        
        const renewalDate = new Date(subscription.renewal_date)
        return renewalDate > today && renewalDate <= thirtyDaysFromNow
      })
    }
  },

  actions: {
    async fetchSubscriptions() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/v1/subscriptions')
        this.subscriptions = response.data.subscriptions
      } catch (error: any) {
        console.error('Erreur lors du chargement des abonnements:', error)
        this.error = error.response?.data?.message || 'Erreur lors du chargement des abonnements'
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

    async fetchSubscription(id: number) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/v1/subscriptions/${id}`)
        this.currentSubscription = response.data.subscription
        return response.data.subscription
      } catch (error: any) {
        console.error(`Erreur lors du chargement de l'abonnement ${id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors du chargement de l'abonnement ${id}`
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

    async createSubscription(subscription: Partial<Subscription>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/subscriptions', subscription)
        this.subscriptions.unshift(response.data.subscription)
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Abonnement créé avec succès',
          type: 'success'
        })
        return response.data.subscription
      } catch (error: any) {
        console.error('Erreur lors de la création de l\'abonnement:', error)
        this.error = error.response?.data?.message || 'Erreur lors de la création de l\'abonnement'
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

    async updateSubscription(subscription: Partial<Subscription>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/v1/subscriptions/${subscription.id}`, subscription)
        const index = this.subscriptions.findIndex(s => s.id === subscription.id)
        if (index !== -1) {
          this.subscriptions[index] = response.data.subscription
        }
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Abonnement mis à jour avec succès',
          type: 'success'
        })
        return response.data.subscription
      } catch (error: any) {
        console.error(`Erreur lors de la mise à jour de l'abonnement ${subscription.id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors de la mise à jour de l'abonnement ${subscription.id}`
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

    async cancelSubscription(id: number, reason: string) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/v1/subscriptions/${id}/cancel`, { reason })
        const index = this.subscriptions.findIndex(s => s.id === id)
        if (index !== -1) {
          this.subscriptions[index] = response.data.subscription
        }
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Abonnement annulé avec succès',
          type: 'success'
        })
        return response.data.subscription
      } catch (error: any) {
        console.error(`Erreur lors de l'annulation de l'abonnement ${id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors de l'annulation de l'abonnement ${id}`
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

    async renewSubscription(id: number) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/v1/subscriptions/${id}/renew`)
        const index = this.subscriptions.findIndex(s => s.id === id)
        if (index !== -1) {
          this.subscriptions[index] = response.data.subscription
        }
        const notificationStore = useNotificationStore()
        notificationStore.addNotification({
          title: 'Succès',
          message: 'Abonnement renouvelé avec succès',
          type: 'success'
        })
        return response.data.subscription
      } catch (error: any) {
        console.error(`Erreur lors du renouvellement de l'abonnement ${id}:`, error)
        this.error = error.response?.data?.message || `Erreur lors du renouvellement de l'abonnement ${id}`
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
