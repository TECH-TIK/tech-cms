import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from '@/utils/axios'
import * as ablyService from '@/services/ably'

export const useNotificationStore = defineStore('notifications', () => {
  // État
  console.log('[NOTIFICATIONS STORE] Initialisation du store')
  const notifications = ref([])
  const toasts = ref([])
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
  const activeToasts = computed(() => toasts.value)

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

  // Fonction pour ajouter des notifications temporaires (toasts)
  const addNotification = (notification: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timeout?: number;
  }) => {
    console.log('[NOTIFICATIONS STORE] Ajout d\'une notification temporaire:', notification)
    const id = Date.now()
    const toast = {
      id,
      ...notification,
      timeout: notification.timeout || 5000
    }
    
    toasts.value.push(toast)
    
    // Supprimer automatiquement après le délai
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, toast.timeout)
    
    return id
  }

  // Alias pour showNotification (pour une meilleure lisibilité)
  const showNotification = addNotification

  // Supprimer un toast spécifique
  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  // Temps réel
  const setupRealtime = () => {
    console.log('[NOTIFICATIONS STORE] Configuration du temps réel')
    ablyService.subscribe('notifications', 'new', (message) => {
      console.log('[NOTIFICATIONS STORE] Nouvelle notification reçue:', message)
      notifications.value.unshift(message)
    })

    ablyService.subscribe('notifications', 'update', (message) => {
      console.log('[NOTIFICATIONS STORE] Mise à jour de notification reçue:', message)
      const index = notifications.value.findIndex(n => n.id === message.id)
      if (index !== -1) {
        notifications.value[index] = message
      }
    })

    ablyService.subscribe('notifications', 'delete', (message) => {
      console.log('[NOTIFICATIONS STORE] Suppression de notification reçue:', message)
      notifications.value = notifications.value.filter(n => n.id !== message.id)
    })
  }

  // Configuration initiale
  onMounted(() => {
    console.log('[NOTIFICATIONS STORE] Montage du store')
    setupRealtime()
  })

  onUnmounted(() => {
    console.log('[NOTIFICATIONS STORE] Démontage du store')
    ablyService.disconnect()
  })

  return {
    // État
    notifications,
    toasts,
    preferences,
    loading,
    error,
    // Getters
    allNotifications,
    unreadCount,
    todayNotifications,
    activeToasts,
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    addNotification,
    showNotification,
    removeToast
  }
})
