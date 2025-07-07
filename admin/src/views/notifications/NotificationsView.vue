<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notifications'
import DataTable from '@/components/common/DataTable.vue'
import logger from '@/services/logger'
import type { AppNotification } from '@/types/notifications'

const { t } = useI18n()
const notificationStore = useNotificationStore()

// État
const notifications = ref<AppNotification[]>([])
const loading = ref(true)
const activeFilter = ref<'all' | 'read' | 'unread'>('all')
const searchQuery = ref('')
const selectedTypes = ref<string[]>([])

// Types de notifications disponibles
const notificationTypes = [
  { value: 'ticket', label: t('notifications.types.ticket') },
  { value: 'invoice', label: t('notifications.types.invoice') },
  { value: 'payment', label: t('notifications.types.payment') },
  { value: 'client', label: t('notifications.types.client') },
  { value: 'system', label: t('notifications.types.system') }
]

// Colonnes
const columns = [
  { 
    key: 'type', 
    label: t('notifications.columns.type'),
    sortable: true,
    formatter: (value: string) => {
      const types: Record<string, string> = {
        ticket: t('notifications.types.ticket'),
        invoice: t('notifications.types.invoice'),
        payment: t('notifications.types.payment'),
        client: t('notifications.types.client'),
        system: t('notifications.types.system')
      }
      return types[value] || value
    }
  },
  { 
    key: 'title', 
    label: t('notifications.columns.title'),
    sortable: true 
  },
  { 
    key: 'message', 
    label: t('notifications.columns.message'),
    sortable: false 
  },
  { 
    key: 'createdAt', 
    label: t('notifications.columns.date'),
    sortable: true,
    formatter: (value: string) => new Date(value).toLocaleString()
  },
  { 
    key: 'status', 
    label: t('notifications.columns.status'),
    sortable: true,
    formatter: (value: string) => {
      const statuses: Record<string, string> = {
        unread: t('notifications.status.unread'),
        read: t('notifications.status.read')
      }
      return statuses[value] || value
    }
  }
]

// Notifications filtrées
const filteredNotifications = computed(() => {
  let result = [...notifications.value]
  
  // Filtre par statut
  if (activeFilter.value !== 'all') {
    result = result.filter(n => n.status === activeFilter.value)
  }
  
  // Filtre par types sélectionnés
  if (selectedTypes.value.length > 0) {
    result = result.filter(n => selectedTypes.value.includes(n.type))
  }
  
  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(n => 
      (n.title?.toLowerCase().includes(query) ?? false) ||
      (n.message?.toLowerCase().includes(query) ?? false)
    )
  }
  
  return result
})

// Statistiques
const statistics = computed(() => ({
  total: notifications.value.length,
  unread: notifications.value.filter(n => n.status === 'unread').length,
  today: notifications.value.filter(n => {
    if (!n.createdAt) return false
    const notifDate = new Date(n.createdAt)
    const today = new Date()
    return notifDate.toDateString() === today.toDateString()
  }).length
}))

// Méthodes
const fetchNotifications = async () => {
  try {
    loading.value = true
    const data = await notificationStore.fetchNotifications()
    notifications.value = data
  } catch (error) {
    logger.error('Erreur lors du chargement des notifications', { error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('notifications.loadError')
    })
  } finally {
    loading.value = false
  }
}

const handleMarkAsRead = async (notification: AppNotification) => {
  try {
    // Convertir l'id en nombre si c'est une chaîne
    const notifId = typeof notification.id === 'string' ? parseInt(notification.id, 10) : notification.id
    await notificationStore.markAsRead(notifId)
    const index = notifications.value.findIndex(n => n.id === notification.id)
    if (index !== -1) {
      notifications.value[index].status = 'read'
    }
  } catch (error) {
    logger.error('Erreur lors du marquage de la notification', { error, notificationId: notification.id })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('notifications.markAsReadError')
    })
  }
}

const handleMarkAllAsRead = async () => {
  try {
    await notificationStore.markAllAsRead()
    
    // Mettre à jour le statut local
    notifications.value = notifications.value.map(n => ({ ...n as object, status: 'read' } as AppNotification))
  } catch (error) {
    logger.error('Erreur lors du marquage des notifications', { error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('notifications.markAllAsReadError')
    })
  } finally {
    loading.value = false
  }
}

const handleDeleteNotification = async (notification: AppNotification) => {
  try {
    // Convertir l'id en nombre si c'est une chaîne
    const notifId = typeof notification.id === 'string' ? parseInt(notification.id, 10) : notification.id
    await notificationStore.deleteNotification(notifId)
    notifications.value = notifications.value.filter(n => n.id !== notification.id)
  } catch (error) {
    logger.error('Erreur lors de la suppression de la notification', { error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('notifications.deleteError')
    })
  }
}

const handleClearAll = async () => {
  try {
    loading.value = true
    await notificationStore.clearAll()
    notifications.value = []
  } catch (error) {
    logger.error('Erreur lors de la suppression des notifications', { error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('notifications.clearAllError')
    })
  } finally {
    loading.value = false
  }
}

// Cycle de vie
onMounted(() => {
  fetchNotifications()
})
</script>

<template>
  <div class="notifications-view">
    <div class="page-header">
      <h1>{{ t('notifications.title') }}</h1>
      <div class="header-actions">
        <button 
          class="btn btn-outline"
          :disabled="!statistics.unread"
          @click="handleMarkAllAsRead"
        >
          <i class="fas fa-check-double" />
          {{ t('notifications.markAllAsRead') }}
        </button>
        <button 
          class="btn btn-danger"
          :disabled="!notifications.length"
          @click="handleClearAll"
        >
          <i class="fas fa-trash" />
          {{ t('notifications.clearAll') }}
        </button>
      </div>
    </div>

    <div class="statistics-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-bell" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.total }}</div>
          <div class="stat-label">{{ t('notifications.stats.total') }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-envelope" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.unread }}</div>
          <div class="stat-label">{{ t('notifications.stats.unread') }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-calendar-day" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.today }}</div>
          <div class="stat-label">{{ t('notifications.stats.today') }}</div>
        </div>
      </div>
    </div>

    <div class="filters">
      <div class="status-filters">
        <button
          v-for="status in ['all', 'unread', 'read'] as const"
          :key="status"
          :class="[  
            activeFilter === status ? 'btn-primary' : 'btn-outline',
            `status-${status}`
          ]"
          class="btn"
          @click="activeFilter = status"
        >
          {{ t(`notifications.status.${status}`) }}
        </button>
      </div>

      <div class="type-filters">
        <div class="type-selector">
          <label>{{ t('notifications.filterByType') }}:</label>
          <div class="type-chips">
            <div
              v-for="type in notificationTypes"
              :key="type.value"
              class="type-chip"
              :class="{ active: selectedTypes.includes(type.value) }"
              @click="
                selectedTypes.includes(type.value)
                  ? selectedTypes = selectedTypes.filter(t => t !== type.value)
                  : selectedTypes.push(type.value)
              "
            >
              {{ type.label }}
            </div>
          </div>
        </div>
      </div>

      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          type="text"
          :placeholder="t('notifications.search')"
        />
        <i class="fas fa-search" />
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="filteredNotifications"
      :loading="loading"
      :actions="[
        {
          icon: 'fas fa-check',
          label: t('notifications.markAsRead'),
          show: (item: AppNotification) => item.status === 'unread',
          action: handleMarkAsRead
        },
        {
          icon: 'fas fa-trash',
          label: t('notifications.delete'),
          action: handleDeleteNotification
        }
      ]"
    />
  </div>
</template>

<style scoped>
.notifications-view {
  padding: 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  color: var(--primary);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.status-filters {
  display: flex;
  gap: 0.5rem;
}

.type-filters {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type-chip {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s;
}

.type-chip.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.search-bar {
  position: relative;
  width: 300px;
}

.search-bar input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.search-bar i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

@media (width <= 768px) {
  .notifications-view {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions .btn {
    flex: 1;
  }

  .search-bar {
    width: 100%;
  }
}
</style>
