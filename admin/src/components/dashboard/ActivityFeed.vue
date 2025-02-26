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
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()
const loading = ref(false)
const error = ref('')
const activities = ref([])

// Types d'activités et leurs classes
const getActivityIconClass = (type: string) => {
  const classes = {
    client: 'bg-blue-100 text-blue-600',
    ticket: 'bg-yellow-100 text-yellow-600',
    billing: 'bg-green-100 text-green-600',
    service: 'bg-purple-100 text-purple-600'
  }
  return `activity-icon ${classes[type] || 'bg-gray-100 text-gray-600'}`
}

// Icônes pour chaque type d'activité
const getActivityIcon = (type: string) => {
  const icons = {
    client: 'fas fa-user',
    ticket: 'fas fa-ticket-alt',
    billing: 'fas fa-file-invoice-dollar',
    service: 'fas fa-server'
  }
  return icons[type] || 'fas fa-bell'
}

// Formatage de la date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Chargement des activités
const loadActivities = async () => {
  try {
    loading.value = true
    activities.value = await dashboardStore.fetchActivities()
  } catch (e) {
    error.value = "Erreur lors du chargement des activités"
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
  @apply rounded-full p-2;
}
</style>
