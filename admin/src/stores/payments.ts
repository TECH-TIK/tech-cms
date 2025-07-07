import { defineStore } from 'pinia'
import { ApiService } from '@/services/api'
import { useNotificationStore } from './notifications'
import logger from '@/services/logger'
import * as ablyService from '@/services/ably'

// Import des types
import type { Payment } from '@/types/payment'

export const usePaymentStore = defineStore('payments', {
  state: () => ({
    payments: [] as Payment[],
    currentPayment: null as Payment | null,
    loading: false,
    error: null as string | null,
    realtimeInitialized: false as boolean,
    lastUpdateTimestamp: null as string | null, // Pour éviter les doublons d'événements
    lastRealtimeEvent: null as any // Pour permettre aux composants de surveiller les mises à jour temps réel
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
        const response = await ApiService.routes.admin.payment.list()
        
        if (response.data && response.data.payments) {
          this.payments = response.data.payments
        } else {
          this.payments = []
        }
      } catch (error: any) {
        logger.error('Erreur lors du chargement des paiements', { error })
        this.error = error.response?.data?.message || 'Erreur lors du chargement des paiements'
        const notificationStore = useNotificationStore()
        notificationStore.showNotification({
          title: 'Erreur',
          message: this.error || 'Une erreur est survenue',
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
        const response = await ApiService.routes.admin.payment.get(id.toString())
        
        if (response.data && response.data.payment) {
          this.currentPayment = response.data.payment
          return response.data.payment
        }
        return null
      } catch (error: any) {
        logger.error(`Erreur lors du chargement du paiement ${id}`, { error })
        this.error = error.response?.data?.message || `Erreur lors du chargement du paiement ${id}`
        const notificationStore = useNotificationStore()
        notificationStore.showNotification({
          title: 'Erreur',
          message: this.error || 'Une erreur est survenue',
          type: 'error'
        })
        return null
      } finally {
        this.loading = false
      }
    },

    async createPayment(paymentData: Partial<Payment>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await ApiService.routes.admin.payment.create(paymentData)
        
        if (response.data && response.data.payment) {
          this.payments.unshift(response.data.payment)
          const notificationStore = useNotificationStore()
          notificationStore.showNotification({
            title: 'Succès',
            message: 'Paiement créé avec succès',
            type: 'success'
          })
          return response.data.payment
        }
        return null
      } catch (error: any) {
        logger.error('Erreur lors de la création du paiement', { error })
        this.error = error.response?.data?.message || 'Erreur lors de la création du paiement'
        const notificationStore = useNotificationStore()
        notificationStore.showNotification({
          title: 'Erreur',
          message: this.error || 'Une erreur est survenue',
          type: 'error'
        })
        return null
      } finally {
        this.loading = false
      }
    },

    async updatePayment(id: number, paymentData: Partial<Payment>) {
      this.loading = true
      this.error = null
      
      try {
        const response = await ApiService.routes.admin.payment.update(id.toString(), paymentData)
        
        if (response.data && response.data.payment) {
          const index = this.payments.findIndex(p => p.id === id)
          if (index !== -1) {
            this.payments[index] = response.data.payment
          }
          
          if (this.currentPayment && this.currentPayment.id === id) {
            this.currentPayment = response.data.payment
          }
          
          const notificationStore = useNotificationStore()
          notificationStore.showNotification({
            title: 'Succès',
            message: 'Paiement mis à jour avec succès',
            type: 'success'
          })
          return response.data.payment
        }
        return null
      } catch (error: any) {
        logger.error(`Erreur lors de la mise à jour du paiement ${id}`, { error })
        this.error = error.response?.data?.message || `Erreur lors de la mise à jour du paiement ${id}`
        const notificationStore = useNotificationStore()
        notificationStore.showNotification({
          title: 'Erreur',
          message: this.error || 'Une erreur est survenue',
          type: 'error'
        })
        return null
      } finally {
        this.loading = false
      }
    },

    /**
     * Traite le remboursement d'un paiement
     * @param id Identifiant du paiement à rembourser
     * @param reason Raison du remboursement (optionnelle)
     */
    async processRefund(id: number, reason: string = '') {
      this.loading = true
      this.error = null
      
      try {
        // Utilisation de la route centralisée pour le remboursement
        const response = await ApiService.routes.admin.payment.refund(id.toString(), reason)
        
        if (response.data && response.data.payment) {
          // Mettre à jour le paiement dans la liste
          const index = this.payments.findIndex(p => p.id === id)
          if (index !== -1) {
            this.payments[index] = response.data.payment
          }
          
          // Mettre à jour le paiement courant si c'est celui qui est remboursé
          if (this.currentPayment && this.currentPayment.id === id) {
            this.currentPayment = response.data.payment
          }
          
          useNotificationStore().showNotification({
            message: `Paiement #${id} remboursé avec succès`,
            type: 'success',
            title: 'Succès'
          })
          
          return response.data.payment
        }
        
        return null
      } catch (error) {
        if (error instanceof Error) {
          this.error = (error as any).response?.data?.message || 'Erreur lors du remboursement du paiement'
          useNotificationStore().showNotification({
            message: this.error || 'Une erreur est survenue',
            type: 'error',
            title: 'Erreur'
          })
        }
        return null
      } finally {
        this.loading = false
      }
    },
    
    async deletePayment(id: number) {
      this.loading = true
      this.error = null
      
      try {
        await ApiService.routes.admin.payment.delete(id.toString())
        
        this.payments = this.payments.filter(payment => payment.id !== id)
        
        if (this.currentPayment && this.currentPayment.id === id) {
          this.currentPayment = null
        }
        
        const notificationStore = useNotificationStore()
        notificationStore.showNotification({
          title: 'Succès',
          message: 'Paiement supprimé avec succès',
          type: 'success'
        })
        return true
      } catch (error: any) {
        logger.error(`Erreur lors de la suppression du paiement ${id}`, { error })
        this.error = error.response?.data?.message || `Erreur lors de la suppression du paiement ${id}`
        const notificationStore = useNotificationStore()
        notificationStore.showNotification({
          title: 'Erreur',
          message: this.error || 'Une erreur est survenue',
          type: 'error'
        })
        return false
      } finally {
        this.loading = false
      }
    },

    async refundPayment(id: number, refundData: any = {}) {
      this.loading = true
      this.error = null
      
      try {
        // Utilisation de la route centralisée pour le remboursement
        const response = await ApiService.routes.admin.payment.refund(id.toString(), refundData.reason)
        
        if (response.data && response.data.payment) {
          const index = this.payments.findIndex(p => p.id === id)
          if (index !== -1) {
            this.payments[index] = response.data.payment
          }
          
          if (this.currentPayment && this.currentPayment.id === id) {
            this.currentPayment = response.data.payment
          }
          
          const notificationStore = useNotificationStore()
          notificationStore.showNotification({
            title: 'Succès',
            message: 'Remboursement traité avec succès',
            type: 'success'
          })
          return response.data.payment
        }
        return null
      } catch (error: any) {
        logger.error(`Erreur lors du remboursement du paiement ${id}`, { error })
        this.error = error.response?.data?.message || `Erreur lors du remboursement du paiement ${id}`
        const notificationStore = useNotificationStore()
        notificationStore.showNotification({
          title: 'Erreur',
          message: this.error || 'Une erreur est survenue',
          type: 'error'
        })
        return null
      } finally {
        this.loading = false
      }
    },

    // Méthodes pour la gestion temps réel
    initRealtimeListeners() {
      if (this.realtimeInitialized) return

      try {
        // Correction: ajout de l'argument manquant 'event' qui est requis par la méthode subscribe
        // Le deuxième argument doit être l'événement, par exemple 'update', 'create', etc.
        ablyService.subscribe('payments', 'update', (message: any) => {
          this.handleRealtimePaymentUpdate(message.data)
        })
        this.realtimeInitialized = true
        logger.info('[PAYMENTS STORE] Écouteurs temps réel initialisés')
      } catch (error) {
        logger.error('[PAYMENTS STORE] Erreur lors de l\'initialisation des écouteurs temps réel', { error })
      }
    },

    handleRealtimePaymentUpdate(eventData: any) {
      try {
        this.lastRealtimeEvent = eventData
        
        // Vérifier si cet événement a déjà été traité
        if (eventData.timestamp && this.lastUpdateTimestamp === eventData.timestamp) {
          logger.info('[PAYMENTS STORE] Événement temps réel ignoré (doublon)', { eventData })
          return
        }
        
        this.lastUpdateTimestamp = eventData.timestamp
        
        logger.info('[PAYMENTS STORE] Événement temps réel reçu', { 
          action: eventData.action,
          payment_id: eventData.payment?.id || 'unknown'
        })
        
        // Traiter l'événement en fonction de l'action
        switch (eventData.action) {
          case 'create':
            if (eventData.payment) {
              this.handlePaymentCreate(eventData.payment)
            }
            break
          case 'update':
            if (eventData.payment) {
              this.handlePaymentUpdate(eventData.payment)
            }
            break
          case 'delete':
            if (eventData.payment) {
              this.handlePaymentDelete(eventData.payment)
            }
            break
          default:
            logger.warn('[PAYMENTS STORE] Type d\'action inconnu', { action: eventData.action })
        }
      } catch (error) {
        logger.error('[PAYMENTS STORE] Erreur lors du traitement de l\'événement temps réel', { error })
      }
    },
    
    handlePaymentCreate(payment: Payment) {
      // Vérifier si le paiement existe déjà
      const existingIndex = this.payments.findIndex(p => p.id === payment.id)
      if (existingIndex === -1) {
        // Ajouter le nouveau paiement au début de la liste
        this.payments.unshift(payment)
        logger.info('[PAYMENTS STORE] Nouveau paiement ajouté via temps réel', { payment_id: payment.id })
      }
    },
    
    handlePaymentUpdate(payment: Payment) {
      // Mettre à jour dans la liste des paiements
      const existingIndex = this.payments.findIndex(p => p.id === payment.id)
      if (existingIndex !== -1) {
        this.payments[existingIndex] = payment
        logger.info('[PAYMENTS STORE] Paiement mis à jour via temps réel', { payment_id: payment.id })
      }
      
      // Mettre à jour le paiement courant s'il s'agit du même
      if (this.currentPayment && this.currentPayment.id === payment.id) {
        this.currentPayment = payment
        logger.info('[PAYMENTS STORE] Paiement courant mis à jour via temps réel', { payment_id: payment.id })
      }
    },
    
    handlePaymentDelete(payment: Payment) {
      // Supprimer de la liste des paiements
      this.payments = this.payments.filter(p => p.id !== payment.id)
      
      // Réinitialiser le paiement courant s'il s'agit de celui supprimé
      if (this.currentPayment && this.currentPayment.id === payment.id) {
        this.currentPayment = null
      }
      
      logger.info('[PAYMENTS STORE] Paiement supprimé via temps réel', { payment_id: payment.id })
    }
  }
})