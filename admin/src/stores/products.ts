import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useProductStore = defineStore('products', () => {
  // État
  const products = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const allProducts = computed(() => products.value)
  const activeProducts = computed(() => products.value.filter(p => p.status === 'active'))
  const inactiveProducts = computed(() => products.value.filter(p => p.status === 'inactive'))

  // Actions
  const fetchProducts = async () => {
    try {
      loading.value = true
      const response = await axios.get('/api/v1/services/products')
      products.value = response.data.products
      return response.data.products
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (product) => {
    try {
      loading.value = true
      const response = await axios.put(`/api/v1/products/${product.id}`, product)
      
      // Mettre à jour le produit dans le tableau local
      const index = products.value.findIndex(p => p.id === product.id)
      if (index !== -1) {
        products.value[index] = response.data.product
      }
      
      return response.data.product
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (product) => {
    try {
      loading.value = true
      const response = await axios.post('/api/v1/products', product)
      
      // Ajouter le nouveau produit au tableau local
      products.value.push(response.data.product)
      
      return response.data.product
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id) => {
    try {
      loading.value = true
      await axios.delete(`/api/v1/products/${id}`)
      
      // Supprimer le produit du tableau local
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value.splice(index, 1)
      }
      
      return true
    } catch (err) {
      error.value = err
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
    inactiveProducts,
    
    // Actions
    fetchProducts,
    updateProduct,
    createProduct,
    deleteProduct
  }
})
