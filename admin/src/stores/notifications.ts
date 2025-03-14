import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from '@/utils/axios'
import * as ablyService from '@/services/ably'
import { useRealtimeStore } from './realtime'
import { useAuthStore } from './auth'

export const useNotificationStore = defineStore('notifications', () => {
  // État
  console.log('[NOTIFICATIONS STORE] Initialisation du store')
  const notifications = ref([])
  const toasts = ref([])
  const closingToasts = ref([])
  const preferences = ref({
    email: true,
    push: true,
    desktop: true,
    types: {
      ticket: true,
      invoice: true,
      payment: true,
      client: true,
      system: true
    }
  })
  const loading = ref(false)
  const error = ref(null)
  
  // Store de temps réel
  const realtimeStore = useRealtimeStore()

  // Getters
  const allNotifications = computed(() => notifications.value)
  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  )
  const todayNotifications = computed(() => {
    const today = new Date()
    return notifications.value.filter(n => {
      const notifDate = new Date(n.created_at)
      return notifDate.toDateString() === today.toDateString()
    })
  })
  const activeToasts = computed(() => {
    return [...toasts.value, ...closingToasts.value]
  })

  // Actions
  const fetchNotifications = async () => {
    console.log('[NOTIFICATIONS STORE] Chargement des notifications')
    try {
      loading.value = true
      const response = await axios.get('/notifications')
      notifications.value = response.data
      console.log('[NOTIFICATIONS STORE] Notifications chargées:', response.data.length)
      return response.data
    } catch (err) {
      console.error('[NOTIFICATIONS STORE] Erreur de chargement:', err)
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const markAsRead = async (id: number) => {
    console.log(`[NOTIFICATIONS STORE] Marquer comme lu: ${id}`)
    try {
      await axios.put(`/notifications/${id}/read`)
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notifications.value[index].read = true
      }
    } catch (err) {
      console.error('[NOTIFICATIONS STORE] Erreur lors du marquage comme lu:', err)
      throw err
    }
  }

  const markAllAsRead = async () => {
    console.log('[NOTIFICATIONS STORE] Marquer tout comme lu')
    try {
      await axios.put('/notifications/read-all')
      notifications.value = notifications.value.map(n => ({ ...n, read: true }))
    } catch (err) {
      console.error('[NOTIFICATIONS STORE] Erreur lors du marquage de tout comme lu:', err)
      throw err
    }
  }

  const deleteNotification = async (id: number) => {
    console.log(`[NOTIFICATIONS STORE] Supprimer la notification: ${id}`)
    try {
      await axios.delete(`/notifications/${id}`)
      notifications.value = notifications.value.filter(n => n.id !== id)
    } catch (err) {
      console.error('[NOTIFICATIONS STORE] Erreur lors de la suppression:', err)
      throw err
    }
  }

  const clearAll = async () => {
    console.log('[NOTIFICATIONS STORE] Supprimer toutes les notifications')
    try {
      await axios.delete('/notifications/all')
      notifications.value = []
    } catch (err) {
      console.error('[NOTIFICATIONS STORE] Erreur lors de la suppression de toutes les notifications:', err)
      throw err
    }
  }

  const updatePreferences = async (newPreferences: any) => {
    console.log('[NOTIFICATIONS STORE] Mise à jour des préférences')
    try {
      await axios.put('/notifications/preferences', newPreferences)
      preferences.value = newPreferences
    } catch (err) {
      console.error('[NOTIFICATIONS STORE] Erreur lors de la mise à jour des préférences:', err)
      throw err
    }
  }

  // Fonction pour ajouter des notifications temporaires (toasts) - version locale
  const addNotificationLocal = (notification: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timeout?: number;
  }) => {
    console.log('[NOTIFICATIONS STORE] Ajout d\'une notification temporaire (locale):', notification)
    const id = Date.now()
    const toast = {
      id,
      ...notification,
      timeout: notification.timeout || 5000,
      closing: false
    }
    
    toasts.value.push(toast)
    
    // Supprimer automatiquement après le délai
    setTimeout(() => {
      // Marquer comme en cours de fermeture
      const toastIndex = toasts.value.findIndex(t => t.id === id)
      if (toastIndex !== -1) {
        const closingToast = { ...toasts.value[toastIndex], closing: true }
        // Retirer du tableau principal
        toasts.value = toasts.value.filter(t => t.id !== id)
        // Ajouter au tableau des toasts en fermeture
        closingToasts.value.push(closingToast)
        
        // Supprimer complètement après l'animation
        setTimeout(() => {
          closingToasts.value = closingToasts.value.filter(t => t.id !== id)
        }, 500) // Durée de l'animation
      }
    }, toast.timeout)
    
    return id
  }
  
  // Fonction pour ajouter des notifications temporaires (toasts) - via Ably
  const addNotification = (notification: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timeout?: number;
  }) => {
    console.log('[NOTIFICATIONS STORE] Ajout d\'une notification temporaire (via Ably):', notification)
    
    // Si le service temps réel n'est pas initialisé, utiliser la version locale
    if (!realtimeStore.isInitialized || !realtimeStore.isConnected) {
      console.warn('[NOTIFICATIONS STORE] Service temps réel non disponible, utilisation du mode local')
      return addNotificationLocal(notification)
    }
    
    // Générer un ID unique pour cette notification
    const id = Date.now()
    
    // Ajouter l'ID à la notification
    const toastData = {
      id,
      ...notification,
      timeout: notification.timeout || 5000,
      timestamp: new Date().toISOString(),
      // Récupérer éventuellement l'ID de l'utilisateur connecté
      userId: getAdminId()
    }
    
    // Publier la notification sur le canal approprié
    ablyService.publishToAdminChannel('toast:notification', toastData)
    
    // Retourner l'ID pour référence
    return id
  }

  // Alias pour showNotification (pour une meilleure lisibilité)
  const showNotification = addNotification
  
  // Méthodes pour afficher des messages de succès et d'erreur
  const success = (message: string, title: string = 'Succès') => {
    console.log('[NOTIFICATIONS STORE] Affichage d\'un message de succès:', message)
    return addNotification({
      title,
      message,
      type: 'success'
    })
  }
  
  const notificationError = (message: string, title: string = 'Erreur') => {
    console.log('[NOTIFICATIONS STORE] Affichage d\'un message d\'erreur:', message)
    return addNotification({
      title,
      message,
      type: 'error'
    })
  }

  // Méthodes d'alias pour une meilleure lisibilité
  const showSuccess = success
  const showError = notificationError
  const showWarning = (message: string, title: string = 'Attention') => {
    return addNotification({
      title,
      message,
      type: 'warning'
    })
  }
  const showInfo = (message: string, title: string = 'Information') => {
    return addNotification({
      title,
      message,
      type: 'info'
    })
  }

  // Supprimer un toast spécifique
  const removeToast = (id: number) => {
    console.log('[NOTIFICATIONS STORE] Suppression du toast:', id)
    
    // Chercher le toast dans la liste principale
    const toastIndex = toasts.value.findIndex(t => t.id === id)
    if (toastIndex !== -1) {
      const closingToast = { ...toasts.value[toastIndex], closing: true }
      // Retirer du tableau principal
      toasts.value = toasts.value.filter(t => t.id !== id)
      // Ajouter au tableau des toasts en fermeture
      closingToasts.value.push(closingToast)
      
      // Supprimer complètement après l'animation
      setTimeout(() => {
        closingToasts.value = closingToasts.value.filter(t => t.id !== id)
      }, 500) // Durée de l'animation
    } else {
      // Si déjà dans le tableau de fermeture, ne rien faire
      // Il sera supprimé automatiquement après l'animation
    }
  }

  // Temps réel
  const setupRealtime = async () => {
    console.log('[NOTIFICATIONS STORE] Configuration du temps réel')
    
    // S'assurer que le service temps réel est initialisé
    if (!realtimeStore.isInitialized) {
      console.log('[NOTIFICATIONS STORE] Initialisation du service temps réel')
      await realtimeStore.init()
    }
    
    // S'abonner aux canaux si l'initialisation a réussi
    if (realtimeStore.isConnected) {
      // Utiliser les nouvelles méthodes pour s'abonner au canal global d'administration
      console.log('[NOTIFICATIONS STORE] Abonnement au canal global d\'administration')
      
      // Abonnement pour les nouvelles notifications persistantes
      ablyService.subscribeToAdminChannel('notification:new', (message) => {
        console.log('[NOTIFICATIONS STORE] Nouvelle notification reçue:', message)
        notifications.value.unshift(message)
      })

      // Abonnement pour les mises à jour de notifications persistantes
      ablyService.subscribeToAdminChannel('notification:update', (message) => {
        console.log('[NOTIFICATIONS STORE] Mise à jour de notification reçue:', message)
        const index = notifications.value.findIndex(n => n.id === message.id)
        if (index !== -1) {
          notifications.value[index] = message
        }
      })

      // Abonnement pour les suppressions de notifications persistantes
      ablyService.subscribeToAdminChannel('notification:delete', (message) => {
        console.log('[NOTIFICATIONS STORE] Suppression de notification reçue:', message)
        notifications.value = notifications.value.filter(n => n.id !== message.id)
      })
      
      // Abonnement pour les notifications toast temporaires
      ablyService.subscribeToAdminChannel('toast:notification', (message) => {
        console.log('[NOTIFICATIONS STORE] Toast notification reçue:', message)
        
        // Filtrer: n'afficher que les toasts généraux ou spécifiques à cet utilisateur
        const userId = getAdminId()
        if (!message.userId || message.userId === userId) {
          // Ajouter le toast à l'interface
          const toast = {
            id: message.id,
            title: message.title,
            message: message.message,
            type: message.type,
            timeout: message.timeout || 5000,
            closing: false
          }
          
          toasts.value.push(toast)
          
          // Supprimer automatiquement après le délai
          setTimeout(() => {
            // Marquer comme en cours de fermeture
            const toastIndex = toasts.value.findIndex(t => t.id === toast.id)
            if (toastIndex !== -1) {
              const closingToast = { ...toasts.value[toastIndex], closing: true }
              // Retirer du tableau principal
              toasts.value = toasts.value.filter(t => t.id !== toast.id)
              // Ajouter au tableau des toasts en fermeture
              closingToasts.value.push(closingToast)
              
              // Supprimer complètement après l'animation
              setTimeout(() => {
                closingToasts.value = closingToasts.value.filter(t => t.id !== toast.id)
              }, 500) // Durée de l'animation
            }
          }, toast.timeout)
        } else {
          console.log('[NOTIFICATIONS STORE] Toast ignoré (destiné à un autre utilisateur)')
        }
      })
      
      // Si l'ID de l'utilisateur est disponible, s'abonner également aux notifications personnelles
      const userId = getAdminId() // Fonction à implémenter pour récupérer l'ID de l'admin connecté
      if (userId) {
        console.log(`[NOTIFICATIONS STORE] Abonnement au canal privé de l'administrateur ${userId}`)
        
        // Abonnement aux notifications personnelles
        ablyService.subscribeToAdminPrivateChannel(userId, 'notification:personal', (message) => {
          console.log('[NOTIFICATIONS STORE] Notification personnelle reçue:', message)
          notifications.value.unshift({
            ...message,
            isPersonal: true // Marquer comme notification personnelle
          })
        })
      }
    } else {
      console.error('[NOTIFICATIONS STORE] Impossible de s\'abonner aux notifications, temps réel non connecté')
    }
  }
  
  // Fonction pour récupérer l'ID de l'administrateur connecté
  const getAdminId = (): number | null => {
    try {
      // Essayer de récupérer l'ID depuis le store d'authentification ou le localStorage
      const authStore = useAuthStore()
      if (authStore.user && authStore.user.id) {
        return authStore.user.id
      }
      
      // Fallback : essayer de récupérer depuis le localStorage
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        return user.id || null
      }
      
      return null
    } catch (err) {
      console.error('[NOTIFICATIONS STORE] Erreur lors de la récupération de l\'ID admin:', err)
      return null
    }
  }

  // Configuration initiale
  onMounted(() => {
    console.log('[NOTIFICATIONS STORE] Montage du store')
    setupRealtime()
  })

  onUnmounted(() => {
    console.log('[NOTIFICATIONS STORE] Démontage du store')
    // Pas besoin de déconnecter ici, d'autres stores peuvent utiliser la connexion
  })

  // Retourner les fonctions et propriétés publiques
  return {
    notifications,
    toasts,
    closingToasts,
    preferences,
    loading,
    error,
    allNotifications,
    unreadCount,
    todayNotifications,
    activeToasts,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    addNotification,
    addNotificationLocal, // Exposer la version locale pour les cas de fallback
    showNotification,
    success,
    notificationError,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
})
