<template>
  <div class="notification-center">
    <!-- Trigger Button -->
    <div 
      class="notification-trigger" 
      @click="toggleNotifications"
      :class="{ active: showNotifications }"
    >
      <i class="fas fa-bell"></i>
      <span 
        v-if="unreadCount > 0" 
        class="notification-badge"
        :class="{ pulse: hasNewNotification }"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </div>
    
    <!-- Dropdown -->
    <transition name="notification-dropdown">
      <div v-if="showNotifications" class="notification-dropdown">
        <!-- Header -->
        <div class="notification-header">
          <h4>{{ $t('notifications.title') }}</h4>
          <div class="notification-actions">
            <button 
              v-if="unreadCount > 0"
              @click="markAllAsRead" 
              class="btn-mark-all-read"
              :title="$t('notifications.mark_all_read')"
            >
              <i class="fas fa-check-double"></i>
            </button>
            <button 
              @click="clearAllNotifications" 
              class="btn-clear-all"
              :title="$t('notifications.clear_all')"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <!-- Notifications List -->
        <div class="notification-list">
          <div v-if="notifications.length === 0" class="no-notifications">
            <i class="fas fa-bell-slash"></i>
            <p>{{ $t('notifications.no_notifications') }}</p>
          </div>
          
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            :class="['notification-item', { 
              unread: !notification.read,
              clickable: !!notification.action_url 
            }]"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <i :class="getNotificationIcon(notification.type)"></i>
            </div>
            
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">
                {{ formatNotificationTime(notification.created_at) }}
              </div>
            </div>
            
            <div class="notification-actions-item">
              <button 
                v-if="!notification.read"
                @click.stop="markAsRead(notification.id)"
                class="btn-mark-read"
                :title="$t('notifications.mark_read')"
              >
                <i class="fas fa-check"></i>
              </button>
              <button 
                @click.stop="removeNotification(notification.id)"
                class="btn-remove"
                :title="$t('notifications.remove')"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div v-if="notifications.length > 0" class="notification-footer">
          <button @click="viewAllNotifications" class="btn-view-all">
            {{ $t('notifications.view_all') }}
          </button>
        </div>
      </div>
    </transition>
    
    <!-- Overlay -->
    <div 
      v-if="showNotifications" 
      class="notification-overlay"
      @click="closeNotifications"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRealtimeStore } from '@/stores/realtime'
import type { DashboardNotification } from '@/types/realtime'
import logger from '@/services/logger'

// Props
interface Props {
  notifications?: DashboardNotification[]
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  notifications: () => [],
  maxVisible: 10
})

// Emits
const emit = defineEmits<{
  notificationClick: [notification: DashboardNotification]
  markAsRead: [notificationId: string]
  markAllAsRead: []
  clearAll: []
  remove: [notificationId: string]
}>()

// Router
const router = useRouter()
const realtimeStore = useRealtimeStore()

// État local
const showNotifications = ref(false)
const hasNewNotification = ref(false)

// Computed
const notifications = computed(() => 
  props.notifications.slice(0, props.maxVisible)
)

const unreadCount = computed(() => 
  props.notifications.filter(n => !n.read).length
)

// Méthodes
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    hasNewNotification.value = false
  }
}

const closeNotifications = () => {
  showNotifications.value = false
}

const handleNotificationClick = (notification: DashboardNotification) => {
  logger.info('[NOTIFICATION CENTER] Clic sur notification', { notification })
  
  // Marquer comme lu si pas déjà lu
  if (!notification.read) {
    markAsRead(notification.id)
  }
  
  // Naviguer si URL d'action
  if (notification.action_url) {
    router.push(notification.action_url)
    closeNotifications()
  }
  
  emit('notificationClick', notification)
}

const markAsRead = (notificationId: string) => {
  logger.debug('[NOTIFICATION CENTER] Marquer comme lu', { notificationId })
  realtimeStore.markNotificationAsRead(notificationId)
  emit('markAsRead', notificationId)
}

const markAllAsRead = () => {
  logger.info('[NOTIFICATION CENTER] Marquer toutes comme lues')
  realtimeStore.markAllNotificationsAsRead()
  emit('markAllAsRead')
}

const removeNotification = (notificationId: string) => {
  logger.debug('[NOTIFICATION CENTER] Supprimer notification', { notificationId })
  // TODO: Implémenter suppression individuelle dans le store
  emit('remove', notificationId)
}

const clearAllNotifications = () => {
  logger.info('[NOTIFICATION CENTER] Effacer toutes les notifications')
  realtimeStore.clearNotifications()
  emit('clearAll')
}

const viewAllNotifications = () => {
  logger.info('[NOTIFICATION CENTER] Voir toutes les notifications')
  router.push('/notifications')
  closeNotifications()
}

// Utilitaires
const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    service: 'fas fa-server text-blue',
    invoice: 'fas fa-file-invoice text-orange',
    ticket: 'fas fa-headset text-green',
    system: 'fas fa-cog text-gray'
  }
  return icons[type] || 'fas fa-info-circle text-blue'
}

const formatNotificationTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Watchers
watch(() => props.notifications.length, (newLength, oldLength) => {
  if (newLength > oldLength && !showNotifications.value) {
    hasNewNotification.value = true
    // Arrêter l'animation après 3 secondes
    setTimeout(() => {
      hasNewNotification.value = false
    }, 3000)
  }
})

// Gestion des clics extérieurs
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.notification-center')) {
    closeNotifications()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@import '@/assets/css/components/notification-center.css';
</style>
