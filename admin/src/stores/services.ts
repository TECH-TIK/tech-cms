import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useServiceStore = defineStore('services', () => {
  // État
  const services = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const allServices = computed(() => services.value || [])
  const activeServices = computed(() => (services.value || []).filter(s => s.status === 'active'))
  const maintenanceServices = computed(() => (services.value || []).filter(s => s.status === 'maintenance'))

  // Actions
  const fetchServices = async () => {
    try {
      loading.value = true
      const response = await axios.get('/api/v1/services')
      services.value = Array.isArray(response.data) ? response.data : []
      return services.value
    } catch (err) {
      error.value = err
      services.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateService = async (service) => {
    try {
      loading.value = true
      const response = await axios.put(`/api/v1/services/${service.id}`, service)
      const index = services.value.findIndex(s => s.id === service.id)
      if (index !== -1) {
        services.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const createService = async (service) => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/services', service)
      services.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteService = async (id) => {
    try {
      loading.value = true
      await axios.delete(`/api/v1/services/${id}`)
      services.value = services.value.filter(s => s.id !== id)
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // État
    services,
    loading,
    error,
    
    // Getters
    allServices,
    activeServices,
    maintenanceServices,
    
    // Actions
    fetchServices,
    updateService,
    createService,
    deleteService
  }
})
