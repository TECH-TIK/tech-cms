<template>
  <div class="activity-feed">
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
    </div>

    <div v-else-if="error" class="text-red-600 p-4">
      {{ error }}
    </div>

    <div v-else class="space-y-4">
      <div v-for="activity in activities" :key="activity.id" class="flex items-start space-x-3">
        <div :class="getActivityIconClass(activity.type)" class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
          <i :class="getActivityIcon(activity.type)"></i>
        </div>
        
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">
            {{ activity.title }}
          </p>
          <p class="text-sm text-gray-500">
            {{ activity.description }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ formatDate(activity.date) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDashboardStore } from '@/stores/dashboard'
import type { Activity } from '@/types/dashboard'

const { t } = useI18n()

const dashboardStore = useDashboardStore()
const loading = ref(false)
const error = ref<string | null>(null)
const activities = ref<Activity[]>([])

// Types d'activités et leurs classes
const getActivityIconClass = (type: string | null | undefined): string => {
  if (!type) return 'activity-icon bg-gray-100 text-gray-600'
  
  const classes: Record<string, string> = {
    client: 'bg-blue-100 text-blue-600',
    ticket: 'bg-yellow-100 text-yellow-600',
    billing: 'bg-green-100 text-green-600',
    service: 'bg-purple-100 text-purple-600'
  }
  return `activity-icon ${classes[type] || 'bg-gray-100 text-gray-600'}`
}

// Icônes pour chaque type d'activité
const getActivityIcon = (type: string | null | undefined): string => {
  if (!type) return 'fas fa-bell'
  
  const icons: Record<string, string> = {
    client: 'fas fa-user',
    ticket: 'fas fa-ticket-alt',
    billing: 'fas fa-file-invoice-dollar',
    service: 'fas fa-server'
  }
  return icons[type] || 'fas fa-bell'
}

// Formatage de la date
const formatDate = (date: string | null | undefined): string => {
  if (!date) return ''
  
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

// Chargement des activités
const loadActivities = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Utiliser fetchActivity au lieu de fetchActivities qui n'existe pas
    await dashboardStore.fetchActivity()
    
    // Transformer les données du store en tableau d'objets Activity
    const { clients, tickets, services } = dashboardStore.activity
    
    // Combiner les différentes activités et les transformer en objets Activity standards
    const allActivities: Activity[] = [
      ...clients.map((item: any) => ({
        id: `client-${item.id}`,
        type: 'client',
        title: item.name || t('dashboard.activity.newClient'),
        description: item.action || '',
        date: item.created_at
      })),
      ...tickets.map((item: any) => ({
        id: `ticket-${item.id}`,
        type: 'ticket',
        title: item.title || t('dashboard.activity.newTicket'),
        description: item.status || '',
        date: item.created_at
      })),
      ...services.map((item: any) => ({
        id: `service-${item.id}`,
        type: 'service',
        title: item.name || t('dashboard.activity.newService'),
        description: item.status || '',
        date: item.created_at
      }))
    ]
    
    // Trier par date (plus récent d'abord)
    activities.value = allActivities.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  } catch (err: any) {
    error.value = err?.message || t('common.errorLoading')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadActivities()
})
</script>

<style scoped>
.activity-icon {
  border-radius: 9999px; /* équivalent à rounded-full */
  padding: 0.5rem; /* équivalent à p-2 */
}
</style>
