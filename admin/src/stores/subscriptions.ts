import { defineStore } from 'pinia'
import axios from 'axios'
import { useNotificationStore } from './notifications'

interface Subscription {
  id: number
  client_id: number
  product_id: number
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
  product_name?: string
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
        return renewalDate >= today && renewalDate <= thirtyDaysFromNow
      })
    }
  },

  actions: {
    async fetchSubscriptions() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/v1/subscriptions')
        
        if (response.data && response.data.subscriptions) {
          this.subscriptions = response.data.subscriptions
        } else {
          this.subscriptions = []
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Erreur lors de la récupération des abonnements'
        useNotificationStore().addNotification(this.error, 'error')
      } finally {
        this.loading = false
      }
    },
    
    async fetchSubscription(id: number) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/v1/subscriptions/${id}`)
        
        if (response.data && response.data.subscription) {
          this.currentSubscription = response.data.subscription
          
          // Mettre à jour l'abonnement dans la liste si présent
          const index = this.subscriptions.findIndex(s => s.id === id)
          if (index !== -1) {
            this.subscriptions[index] = response.data.subscription
          }
        }
      } catch (error) {
        this.error = error.response?.data?.message || `Erreur lors de la récupération de l'abonnement #${id}`
        useNotificationStore().addNotification(this.error, 'error')
      } finally {
        this.loading = false
      }
    },
    
    async createSubscription(subscription: Partial<Subscription>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/v1/subscriptions', subscription)
        
        if (response.data && response.data.subscription) {
          this.subscriptions.push(response.data.subscription)
          useNotificationStore().addNotification('Abonnement créé avec succès', 'success')
          return response.data.subscription
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Erreur lors de la création de l\'abonnement'
        useNotificationStore().addNotification(this.error, 'error')
        return null
      } finally {
        this.loading = false
      }
    },
    
    async updateSubscription(subscription: Partial<Subscription>) {
      if (!subscription.id) {
        this.error = 'ID d\'abonnement manquant'
        useNotificationStore().addNotification(this.error, 'error')
        return null
      }
      
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/v1/subscriptions/${subscription.id}`, subscription)
        
        if (response.data && response.data.subscription) {
          // Mettre à jour l'abonnement dans la liste
          const index = this.subscriptions.findIndex(s => s.id === subscription.id)
          if (index !== -1) {
            this.subscriptions[index] = response.data.subscription
          }
          
          // Mettre à jour l'abonnement courant si c'est celui qui est modifié
          if (this.currentSubscription && this.currentSubscription.id === subscription.id) {
            this.currentSubscription = response.data.subscription
          }
          
          useNotificationStore().addNotification('Abonnement mis à jour avec succès', 'success')
          return response.data.subscription
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Erreur lors de la mise à jour de l\'abonnement'
        useNotificationStore().addNotification(this.error, 'error')
        return null
      } finally {
        this.loading = false
      }
    },
    
    async cancelSubscription(id: number, reason: string = '') {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`/api/v1/subscriptions/${id}/cancel`, { reason })
        
        if (response.data && response.data.subscription) {
          // Mettre à jour l'abonnement dans la liste
          const index = this.subscriptions.findIndex(s => s.id === id)
          if (index !== -1) {
            this.subscriptions[index] = response.data.subscription
          }
          
          // Mettre à jour l'abonnement courant si c'est celui qui est annulé
          if (this.currentSubscription && this.currentSubscription.id === id) {
            this.currentSubscription = response.data.subscription
          }
          
          useNotificationStore().addNotification('Abonnement annulé avec succès', 'success')
          return response.data.subscription
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Erreur lors de l\'annulation de l\'abonnement'
        useNotificationStore().addNotification(this.error, 'error')
        return null
      } finally {
        this.loading = false
      }
    },
    
    async renewSubscription(id: number) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`/api/v1/subscriptions/${id}/renew`)
        
        if (response.data && response.data.subscription) {
          // Mettre à jour l'abonnement dans la liste
          const index = this.subscriptions.findIndex(s => s.id === id)
          if (index !== -1) {
            this.subscriptions[index] = response.data.subscription
          }
          
          // Mettre à jour l'abonnement courant si c'est celui qui est renouvelé
          if (this.currentSubscription && this.currentSubscription.id === id) {
            this.currentSubscription = response.data.subscription
          }
          
          useNotificationStore().addNotification('Abonnement renouvelé avec succès', 'success')
          return response.data.subscription
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Erreur lors du renouvellement de l\'abonnement'
        useNotificationStore().addNotification(this.error, 'error')
        return null
      } finally {
        this.loading = false
      }
    }
  }
})
