import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/utils/axios'

export const useProductStore = defineStore('products', () => {
  // État
  const products = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const allProducts = computed(() => products.value || [])
  const activeProducts = computed(() => (products.value || []).filter(p => p.status === 'active'))
  const maintenanceProducts = computed(() => (products.value || []).filter(p => p.status === 'maintenance'))
  const inactiveProducts = computed(() => (products.value || []).filter(p => p.status === 'inactive'))

  // Actions
  const fetchProducts = async () => {
    try {
      loading.value = true
      error.value = null
      console.log('Début de la récupération des produits')
      const response = await axios.get('/api/v1/products')
      console.log('Réponse API produits:', response)
      
      // Vérification de la structure de la réponse
      if (response.data && response.data.products) {
        console.log('Structure de réponse avec data.products:', response.data.products)
        products.value = response.data.products || []
      } else if (Array.isArray(response.data)) {
        console.log('Structure de réponse tableau:', response.data)
        products.value = response.data
      } else {
        console.warn('Format de réponse inattendu:', response.data)
        products.value = []
      }
      
      console.log('Produits après traitement:', products.value)
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err)
      error.value = err.message || 'Erreur lors de la récupération des produits'
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (id) => {
    try {
      loading.value = true
      error.value = null
      console.log(`Début de la récupération du produit ID: ${id}`)
      
      // Essayer d'abord de trouver le produit dans la liste déjà chargée
      let product = products.value.find(p => p.id === id)
      
      // Si le produit n'est pas trouvé localement, le récupérer depuis l'API
      if (!product) {
        const response = await axios.get(`/api/v1/products/${id}`)
        console.log('Réponse API produit:', response)
        
        if (response.data) {
          product = response.data
        }
      }
      
      return product
    } catch (err) {
      console.error(`Erreur lors de la récupération du produit ID ${id}:`, err)
      error.value = err.message || 'Erreur lors de la récupération du produit'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (product) => {
    try {
      loading.value = true
      error.value = null
      const response = await axios.put(`/api/v1/products/${product.id}`, product)
      
      // Mettre à jour le produit dans la liste
      const index = products.value.findIndex(p => p.id === product.id)
      if (index !== -1) {
        products.value[index] = response.data
      }
      
      return response.data
    } catch (err) {
      console.error('Erreur lors de la mise à jour du produit:', err)
      error.value = err.message || 'Erreur lors de la mise à jour du produit'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (product) => {
    try {
      loading.value = true
      error.value = null
      const response = await axios.post('/api/v1/products', product)
      products.value.push(response.data)
      return response.data
    } catch (err) {
      console.error('Erreur lors de la création du produit:', err)
      error.value = err.message || 'Erreur lors de la création du produit'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id) => {
    try {
      loading.value = true
      error.value = null
      await axios.delete(`/api/v1/products/${id}`)
      
      // Supprimer le produit de la liste
      products.value = products.value.filter(p => p.id !== id)
      
      return true
    } catch (err) {
      console.error('Erreur lors de la suppression du produit:', err)
      error.value = err.message || 'Erreur lors de la suppression du produit'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // État
    products,
    loading,
    error,
    
    // Getters
    allProducts,
    activeProducts,
    maintenanceProducts,
    inactiveProducts,
    
    // Actions
    fetchProducts,
    fetchProduct,
    updateProduct,
    createProduct,
    deleteProduct
  }
})
