<template>
  <div class="notifications-wrapper">
    <div class="fixed-notifications">
      <div 
        v-for="toast in notificationStore.activeToasts" 
        :key="toast.id"
        class="notification-toast"
        :class="[getToastClass(toast.type), { 'closing': toast.closing }]"
      >
        <div class="notification-content">
          <div class="notification-icon">
            <i :class="getIconClass(toast.type)"></i>
          </div>
          <div class="notification-text">
            <div class="notification-title">{{ toast.title }}</div>
            <div class="notification-message">{{ toast.message }}</div>
          </div>
          <button class="notification-close" @click="closeToast(toast.id)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notifications'

const notificationStore = useNotificationStore()

// Fonction pour fermer une notification avec animation
const closeToast = (id) => {
  notificationStore.removeToast(id)
}

onMounted(() => {
  console.log('[NotificationsContainer] Composant monté')
})

// Fonctions utilitaires pour les classes CSS
const getToastClass = (type) => {
  switch (type) {
    case 'success': return 'success-toast'
    case 'error': return 'error-toast'
    case 'warning': return 'warning-toast'
    case 'info': return 'info-toast'
    default: return 'info-toast'
  }
}

const getIconClass = (type) => {
  switch (type) {
    case 'success': return 'fas fa-check-circle'
    case 'error': return 'fas fa-exclamation-circle'
    case 'warning': return 'fas fa-exclamation-triangle'
    case 'info': return 'fas fa-info-circle'
    default: return 'fas fa-info-circle'
  }
}
</script>

<style scoped>
.notifications-wrapper {
  position: relative;
  z-index: 9999;
}

.fixed-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  width: 350px;
}

.notification-toast {
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  margin-bottom: 10px;
  animation: slide-in 0.5s ease-out forwards;
  position: relative;
  z-index: 1; /* Assurer que chaque toast a son propre contexte d'empilement */
  background-color: white; /* Assurer que le fond est opaque */
}

.notification-toast.closing {
  animation: slide-out 0.5s ease-in forwards !important;
  z-index: 0; /* Réduire le z-index pendant la fermeture */
}

.notification-content {
  display: flex;
  padding: 12px 16px;
  align-items: flex-start;
}

.notification-icon {
  margin-right: 12px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-text {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 14px;
  color: #666;
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  padding: 0;
  margin-left: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #333;
}

/* Types de notifications */
.success-toast {
  border-left: 4px solid #10b981;
}

.success-toast .notification-icon {
  color: #10b981;
}

.error-toast {
  border-left: 4px solid #ef4444;
}

.error-toast .notification-icon {
  color: #ef4444;
}

.warning-toast {
  border-left: 4px solid #f59e0b;
}

.warning-toast .notification-icon {
  color: #f59e0b;
}

.info-toast {
  border-left: 4px solid #3b82f6;
}

.info-toast .notification-icon {
  color: #3b82f6;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
