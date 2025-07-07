import { defineStore } from 'pinia'
import { ApiService } from '@/services/api'
import { useNotificationStore } from './notifications'
import type { Subscription } from '@/types/subscription'

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
        const response = await ApiService.routes.admin.subscription.list()
        
        if (response.data && response.data.subscriptions) {
          this.subscriptions = response.data.subscriptions
        } else {
          this.subscriptions = []
        }
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || 'Erreur lors de la récupération des abonnements'
        } else {
          this.error = 'Erreur lors de la récupération des abonnements'
        }
        useNotificationStore().addNotification({
          message: this.error || 'Une erreur est survenue',
          type: 'error',
          title: 'Erreur'
        })
      } finally {
        this.loading = false
      }
    },
    
    async fetchSubscriptionsByClient(clientId: number) {
      this.loading = true
      this.error = null
      
      try {
        const response = await ApiService.routes.admin.subscription.getByClient(clientId.toString())
        
        if (response.data && response.data.subscriptions) {
          return response.data.subscriptions
        }
        return []
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || 'Erreur lors de la récupération des abonnements du client'
        } else {
          this.error = 'Erreur lors de la récupération des abonnements du client'
        }
        useNotificationStore().addNotification({
          message: this.error || 'Une erreur est survenue',
          type: 'error',
          title: 'Erreur'
        })
        return []
      } finally {
        this.loading = false
      }
    },
    
    async fetchSubscriptionsByStatus(status: string) {
      this.loading = true
      this.error = null
      
      try {
        const response = await ApiService.routes.admin.subscription.getByStatus(status)
        
        if (response.data && response.data.subscriptions) {
          return response.data.subscriptions
        }
        return []
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || 'Erreur lors de la récupération des abonnements'
        } else {
          this.error = 'Erreur lors de la récupération des abonnements'
        }
        useNotificationStore().addNotification({
          message: this.error || 'Une erreur est survenue',
          type: 'error',
          title: 'Erreur'
        })
        return []
      } finally {
        this.loading = false
      }
    },
    
    async fetchSubscription(id: number) {
      this.loading = true
      this.error = null
      
      try {
        const response = await ApiService.routes.admin.subscription.get(id.toString())
        
        if (response.data && response.data.subscription) {
          this.currentSubscription = response.data.subscription
          return response.data.subscription
        }
        return null
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || `Erreur lors de la récupération de l'abonnement #${id}`
        } else {
          this.error = `Erreur lors de la récupération de l'abonnement #${id}`
        }
        useNotificationStore().addNotification({
          message: this.error || 'Une erreur est survenue',
          type: 'error',
          title: 'Erreur'
        })
        return null
      } finally {
        this.loading = false
      }
    },
    
    async createSubscription(subscriptionData: Partial<Subscription>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await ApiService.routes.admin.subscription.create(subscriptionData)
        
        if (response.data && response.data.subscription) {
          this.subscriptions.unshift(response.data.subscription)
          useNotificationStore().addNotification({
            message: 'Abonnement créé avec succès',
            type: 'success',
            title: 'Succès'
          })
          return response.data.subscription
        }
        return null
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || 'Erreur lors de la création de l\'abonnement'
        } else {
          this.error = 'Erreur lors de la création de l\'abonnement'
        }
        useNotificationStore().addNotification({
          message: this.error || 'Une erreur est survenue',
          type: 'error',
          title: 'Erreur'
        })
        return null
      } finally {
        this.loading = false
      }
    },
    
    async updateSubscription(id: number, subscriptionData: Partial<Subscription>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await ApiService.routes.admin.subscription.update(id.toString(), subscriptionData)
        
        if (response.data && response.data.subscription) {
          // Mettre à jour l'abonnement dans la liste
          const index = this.subscriptions.findIndex(s => s.id === id)
          if (index !== -1) {
            this.subscriptions[index] = response.data.subscription
          }
          
          // Mettre à jour l'abonnement courant si c'est celui qui est modifié
          if (this.currentSubscription && this.currentSubscription.id === id) {
            this.currentSubscription = response.data.subscription
          }
          useNotificationStore().addNotification({
            message: `Abonnement #${id} mis à jour avec succès`,
            type: 'success',
            title: 'Succès'
          })
          return response.data.subscription
        }
        return null
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || 'Erreur lors de la mise à jour de l\'abonnement'
        } else {
          this.error = 'Erreur lors de la mise à jour de l\'abonnement'
        }
        useNotificationStore().addNotification({
          message: this.error || 'Une erreur est survenue',
          type: 'error',
          title: 'Erreur'
        })
        return null
      } finally {
        this.loading = false
      }
    },
    
    async deleteSubscription(id: number) {
      this.loading = true
      this.error = null
      
      try {
        await ApiService.routes.admin.subscription.delete(id.toString())
        
        // Supprimer l'abonnement de la liste
        this.subscriptions = this.subscriptions.filter(s => s.id !== id)
        
        // Réinitialiser l'abonnement courant si c'est celui qui est supprimé
        if (this.currentSubscription && this.currentSubscription.id === id) {
          this.currentSubscription = null
        }
        useNotificationStore().addNotification({
          message: `Abonnement #${id} supprimé avec succès`,
          type: 'success',
          title: 'Succès'
        })
        return true
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || 'Erreur lors de la suppression de l\'abonnement'
        } else {
          this.error = 'Erreur lors de la suppression de l\'abonnement'
        }
        useNotificationStore().addNotification({
          message: this.error || 'Une erreur est survenue',
          type: 'error',
          title: 'Erreur'
        })
        return false
      } finally {
        this.loading = false
      }
    },
    
    async cancelSubscription(id: number, cancelReason: string = '') {
      this.loading = true
      this.error = null
      
      try {
        // Utilisation de la route centralisée pour l'annulation d'abonnement
        const response = await ApiService.routes.admin.subscription.cancel(id.toString(), cancelReason)      
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
          useNotificationStore().addNotification({
            message: `Abonnement #${id} annulé avec succès`,
            type: 'success',
            title: 'Succès'
          })
          return response.data.subscription
        }
        return null
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || 'Erreur lors de l\'annulation de l\'abonnement'
        } else {
          this.error = 'Erreur lors de l\'annulation de l\'abonnement'
        }
        useNotificationStore().addNotification({
          message: this.error || 'Une erreur est survenue',
          type: 'error',
          title: 'Erreur'
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
        // Utilisation de la route centralisée pour le renouvellement d'abonnement
        const response = await ApiService.routes.admin.subscription.renew(id.toString())
        
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
          useNotificationStore().addNotification({
            message: `Abonnement #${id} renouvelé avec succès.`,
            type: 'success',
            title: 'Succès'
          })
          return response.data.subscription
        }
        return null
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || 'Erreur lors du renouvellement de l\'abonnement'
        } else {
          this.error = 'Erreur lors du renouvellement de l\'abonnement'
        }
        useNotificationStore().addNotification({
          message: this.error || 'Une erreur est survenue',
          type: 'error',
          title: 'Erreur'
        })
        return null
      } finally {
        this.loading = false
      }
    }
  }
})