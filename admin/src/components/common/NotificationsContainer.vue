<template>
  <div class="fixed top-4 right-4 z-50 space-y-4">
    <transition-group name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification p-4 rounded-lg shadow-lg max-w-sm"
        :class="notificationClass(notification.type)"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i :class="notificationIcon(notification.type)" class="text-xl"></i>
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="font-medium">{{ notification.title }}</p>
            <p class="mt-1 text-sm">{{ notification.message }}</p>
          </div>
          <div class="ml-4 flex-shrink-0">
            <button
              @click="removeNotification(notification.id)"
              class="inline-flex text-gray-400 hover:text-gray-500"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

const notifications = ref<Notification[]>([])

const notificationClass = (type: string) => ({
  'bg-green-50 text-green-800': type === 'success',
  'bg-red-50 text-red-800': type === 'error',
  'bg-yellow-50 text-yellow-800': type === 'warning',
  'bg-blue-50 text-blue-800': type === 'info'
})

const notificationIcon = (type: string) => ({
  'fas fa-check-circle text-green-400': type === 'success',
  'fas fa-times-circle text-red-400': type === 'error',
  'fas fa-exclamation-circle text-yellow-400': type === 'warning',
  'fas fa-info-circle text-blue-400': type === 'info'
})

const addNotification = (notification: Omit<Notification, 'id'>) => {
  const id = Date.now()
  notifications.value.push({ ...notification, id })
  setTimeout(() => removeNotification(id), 5000)
}

const removeNotification = (id: number) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

// Exposer les méthodes
defineExpose({
  addNotification
})
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
