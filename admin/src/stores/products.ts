import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import logger from '@/services/logger'
import type { Product } from '@/types/product'
import * as ablyService from '@/services/ably'
import { ApiService } from '@/services/api'

// Interface pour les réponses d'API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const useProductStore = defineStore('products', () => {
  // État
  const products = ref<Product[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const currentProduct = ref<Product | null>(null)
  const lastRealtimeEvent = ref<any | null>(null)
  const realtimeInitialized = ref(false)

  // Getters
  const allProducts = computed(() => products.value || [])
  const activeProducts = computed(() => (products.value || []).filter(p => p.status === 'active'))
  const maintenanceProducts = computed(() => (products.value || []).filter(p => p.status === 'maintenance'))
  const inactiveProducts = computed(() => (products.value || []).filter(p => p.status === 'inactive'))

  // Actions
  const fetchProducts = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      logger.info('Début de la récupération des produits')
      const response = await ApiService.routes.admin.product.list()
      logger.debug('Réponse API produits', { response })
      
      // Vérification de la structure de la réponse
      if (response.data && response.data.products) {
        logger.debug('Structure de réponse avec data.products', { products: response.data.products })
        products.value = response.data.products || []
      } else if (Array.isArray(response.data)) {
        logger.debug('Structure de réponse tableau', { data: response.data })
        products.value = response.data
      } else {
        logger.warn('Format de réponse inattendu', { data: response.data })
        products.value = []
      }
      
      logger.debug('Produits après traitement', { products: products.value })
    } catch (err: unknown) {
      const error_msg = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error('Erreur lors de la récupération des produits', { err })
      error.value = error_msg || 'Erreur lors de la récupération des produits'
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (id: number | string): Promise<Product | null> => {
    try {
      loading.value = true
      error.value = null
      logger.info(`Début de la récupération du produit ID: ${id}`)
      
      // Essayer d'abord de trouver le produit dans la liste déjà chargée
      let product = products.value.find(p => p.id === id)
      
      // Si le produit n'est pas trouvé localement, le récupérer depuis l'API
      if (!product) {
        const response = await ApiService.routes.admin.product.get(String(id))
        logger.info('Réponse API produit:', response);
        
        if (response.data) {
          product = response.data as Product
          
          // Log spécifique pour déboguer les champs booléens
          logger.info('Données brutes du produit reçues de l\'API:', {
            id: product.id,
            hidden_raw: response.data.hidden,
            hidden_type: typeof response.data.hidden,
            featured_raw: response.data.featured,
            featured_type: typeof response.data.featured
          });
        }
      }
      
      return product || null
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error(`Erreur lors de la récupération du produit ID ${id}:`, { error: err });
      error.value = errorMsg || 'Erreur lors de la récupération du produit'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (productId: number | string, productData: any): Promise<ApiResponse<Product>> => {
    try {
      loading.value = true
      error.value = null
      
      // Log pour débogage
      logger.info(`Mise à jour du produit ID: ${productId}`, { data: productData });
      
      const response = await ApiService.routes.admin.product.update(String(productId), productData)
      
      // Mettre à jour le produit dans la liste
      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) {
        products.value[index] = response.data as Product
      }
      
      return {
        success: true,
        data: response.data as Product
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error(`Erreur lors de la mise à jour du produit ID ${productId}`, { err })
      error.value = errorMsg || 'Erreur lors de la mise à jour du produit'
      
      return {
        success: false,
        message: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (product: any): Promise<ApiResponse<Product>> => {
    try {
      loading.value = true
      error.value = null
      const response = await ApiService.routes.admin.product.create(product)
      const newProduct = response.data as Product
      products.value.push(newProduct)
      return {
        success: true,
        data: newProduct
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error('Erreur lors de la création du produit', { err })
      error.value = errorMsg || 'Erreur lors de la création du produit'
      return {
        success: false,
        message: error.value
      }
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: number | string): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await ApiService.routes.admin.product.delete(String(id))
      
      // Supprimer le produit de la liste
      products.value = products.value.filter(p => p.id !== id)
      
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      logger.error('Erreur lors de la suppression du produit', { err })
      error.value = errorMsg || 'Erreur lors de la suppression du produit'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Méthodes pour la gestion du temps réel
  const initRealtimeListeners = () => {
    // Éviter de réinitialiser si déjà fait
    if (realtimeInitialized.value) {
      logger.debug('[PRODUCTS STORE] Écouteurs temps réel déjà initialisés')
      return
    }
    
    try {
      logger.info('[PRODUCTS STORE] Initialisation des écouteurs temps réel')

      // S'abonner au canal privé d'administration et écouter les événements produits
      ablyService.subscribeToAdminChannel('product-update', (eventData) => {
        logger.debug('[PRODUCTS STORE] Événement product-update reçu', { eventData })
        handleRealtimeProductUpdate(eventData)
      })

      realtimeInitialized.value = true
      logger.info('[PRODUCTS STORE] Écouteurs temps réel initialisés avec succès')
      return true
    } catch (err) {
      logger.error('[PRODUCTS STORE] Erreur lors de l\'initialisation des écouteurs temps réel', { err })
      return false
    }
  }

  const handleRealtimeProductUpdate = (data: any) => {
    try {
      // Mettre à jour lastRealtimeEvent pour déclencher les watchers dans les composants
      lastRealtimeEvent.value = data
      logger.info('[PRODUCTS STORE] Événement temps réel reçu', { 
        action: data.action,
        product_id: data.product?.id || 'non spécifié' 
      })

      // Traiter l'événement selon son type
      if (data.action === 'create') {
        // Ajouter le nouveau produit à la liste si les données sont complètes
        if (data.product && data.product.id) {
          // Vérifier si le produit n'existe pas déjà
          const existingIndex = products.value.findIndex(p => p.id === data.product.id)
          if (existingIndex === -1) {
            products.value.push(data.product)
            logger.info('[PRODUCTS STORE] Nouveau produit ajouté à la liste', { product_id: data.product.id })
          }
        }
      } else if (data.action === 'update') {
        // Mettre à jour le produit dans la liste
        if (data.product && data.product.id) {
          const index = products.value.findIndex(p => p.id === data.product.id)
          if (index !== -1) {
            products.value[index] = data.product
            logger.info('[PRODUCTS STORE] Produit mis à jour dans la liste', { product_id: data.product.id })
          }

          // Si le produit courant est celui qui a été mis à jour, mettre à jour currentProduct
          if (currentProduct.value && currentProduct.value.id === data.product.id) {
            currentProduct.value = data.product
            logger.info('[PRODUCTS STORE] Produit courant mis à jour', { product_id: data.product.id })
          }
        }
      } else if (data.action === 'delete') {
        // Supprimer le produit de la liste
        if (data.product && data.product.id) {
          products.value = products.value.filter(p => p.id !== data.product.id)
          logger.info('[PRODUCTS STORE] Produit supprimé de la liste', { product_id: data.product.id })

          // Si le produit courant est celui qui a été supprimé, réinitialiser currentProduct
          if (currentProduct.value && currentProduct.value.id === data.product.id) {
            currentProduct.value = null
            logger.info('[PRODUCTS STORE] Produit courant réinitialisé car supprimé', { product_id: data.product.id })
          }
        }
      }
    } catch (err) {
      logger.error('[PRODUCTS STORE] Erreur lors du traitement de l\'\u00e9vénement temps réel', { 
        err, 
        event_data: data 
      })
    }
  }

  return {
    // État
    products,
    loading,
    error,
    currentProduct,
    lastRealtimeEvent,
    
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
    deleteProduct,
    
    // Méthodes temps réel
    initRealtimeListeners,
    handleRealtimeProductUpdate
  }
})
