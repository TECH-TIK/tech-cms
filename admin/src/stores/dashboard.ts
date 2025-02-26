import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/utils/axios'

export const useDashboardStore = defineStore('dashboard', () => {
  // État
  const loading = ref(false)
  const error = ref(null)
  const stats = ref({
    clients: { total: 0, active: 0, new: 0 },
    services: { total: 0, active: 0, pending: 0 },
    tickets: { total: 0, open: 0, urgent: 0 }
  })
  const activity = ref({
    clients: [],
    services: [],
    tickets: []
  })

  // Actions
  const fetchStats = async () => {
    console.log('[DASHBOARD STORE] Chargement des statistiques')
    try {
      loading.value = true
      error.value = null
      const response = await axios.get('/dashboard/stats')
      stats.value = response.data
      console.log('[DASHBOARD STORE] Statistiques chargées')
    } catch (err) {
      console.error('[DASHBOARD STORE] Erreur de chargement des statistiques:', err)
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchActivity = async () => {
    console.log('[DASHBOARD STORE] Chargement de l\'activité')
    try {
      loading.value = true
      error.value = null
      const response = await axios.get('/dashboard/activity')
      activity.value = response.data
      console.log('[DASHBOARD STORE] Activité chargée')
    } catch (err) {
      console.error('[DASHBOARD STORE] Erreur de chargement de l\'activité:', err)
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // État
    loading,
    error,
    stats,
    activity,
    // Actions
    fetchStats,
    fetchActivity
  }
})
