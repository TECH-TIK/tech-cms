<template>
  <div>
    <p class="section-description">
      {{ t('products_services.cross_sells.description') }}
    </p>

    <div v-if="loading" class="text-center" style="padding: var(--spacing-xl)">
      <div class="spinner-loading" style="margin: 0 auto;"></div>
    </div>

    <div v-else>
      <div class="tabs-container">
        <div class="tabs-navigation">
          <div 
            class="tab-item" 
            :class="{ 'active': activeTab === 'cross_sells' }"
            @click="activeTab = 'cross_sells'"
          >
            <i class="fas fa-handshake"></i> {{ t('products_services.cross_sells.tab_cross_sells') }}
          </div>
          <div 
            class="tab-item" 
            :class="{ 'active': activeTab === 'related' }"
            @click="activeTab = 'related'"
          >
            <i class="fas fa-link"></i> {{ t('products_services.cross_sells.tab_related') }}
          </div>
        </div>
        
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            :placeholder="t('common.search')" 
            class="search-input"
          />
        </div>
        
        <div v-if="activeTab === 'cross_sells'">
          <div v-if="selectedCrossSells.length > 0" class="selected-products">
            <h4 class="selected-title">
              {{ t('products_services.cross_sells.selected_products') }}
              <span class="selected-count">{{ selectedCrossSells.length }}</span>
            </h4>
            
            <div class="selected-products-list">
              <div 
                v-for="product in selectedCrossSells" 
                :key="product.id" 
                class="selected-product-item"
              >
                <div class="product-info">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-type">{{ product.type }}</div>
                  <div class="product-price">{{ formatPrice(product.price) }}</div>
                </div>
                <button 
                  class="remove-button" 
                  @click="removeFromCrossSells(product)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-handshake"></i>
            </div>
            <h4>{{ t('products_services.cross_sells.no_cross_sells') }}</h4>
            <p>{{ t('products_services.cross_sells.no_cross_sells_description') }}</p>
          </div>
          
          <h4 class="available-title">{{ t('products_services.cross_sells.available_products') }}</h4>
          
          <div class="products-grid">
            <div 
              v-for="product in filteredProducts" 
              :key="product.id" 
              class="product-card"
              :class="{ 'selected': isInCrossSells(product) }"
              @click="toggleCrossSell(product)"
            >
              <div class="product-image">
                <img :src="product.image_url || '/assets/images/product-placeholder.png'" :alt="product.name">
                <div class="product-selection">
                  <i class="fas fa-check"></i>
                </div>
              </div>
              <div class="product-details">
                <h5 class="product-name">{{ product.name }}</h5>
                <div class="product-type">{{ product.type }}</div>
                <div class="product-price">{{ formatPrice(product.price) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'related'">
          <div v-if="selectedRelatedProducts.length > 0" class="selected-products">
            <h4 class="selected-title">
              {{ t('products_services.cross_sells.selected_related') }}
              <span class="selected-count">{{ selectedRelatedProducts.length }}</span>
            </h4>
            
            <div class="selected-products-list">
              <div 
                v-for="product in selectedRelatedProducts" 
                :key="product.id" 
                class="selected-product-item"
              >
                <div class="product-info">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-type">{{ product.type }}</div>
                  <div class="product-price">{{ formatPrice(product.price) }}</div>
                </div>
                <button 
                  class="remove-button" 
                  @click="removeFromRelated(product)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-link"></i>
            </div>
            <h4>{{ t('products_services.cross_sells.no_related') }}</h4>
            <p>{{ t('products_services.cross_sells.no_related_description') }}</p>
          </div>
          
          <h4 class="available-title">{{ t('products_services.cross_sells.available_products') }}</h4>
          
          <div class="products-grid">
            <div 
              v-for="product in filteredProducts" 
              :key="product.id" 
              class="product-card"
              :class="{ 'selected': isInRelated(product) }"
              @click="toggleRelated(product)"
            >
              <div class="product-image">
                <img :src="product.image_url || '/assets/images/product-placeholder.png'" :alt="product.name">
                <div class="product-selection">
                  <i class="fas fa-check"></i>
                </div>
              </div>
              <div class="product-details">
                <h5 class="product-name">{{ product.name }}</h5>
                <div class="product-type">{{ product.type }}</div>
                <div class="product-price">{{ formatPrice(product.price) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useProductWizardStore } from '@/stores/product-wizard'
import { useProductStore } from '@/stores/products'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'
import { Product } from '@/types/product'

const { t } = useI18n()
const route = useRoute()
const notificationStore = useNotificationStore()
const productWizardStore = useProductWizardStore()
const productStore = useProductStore()

// État local
const loading = ref(false)
const activeTab = ref('cross_sells')
const searchQuery = ref('')
const allProducts = ref<Product[]>([])
const selectedCrossSells = ref<Product[]>([])
const selectedRelatedProducts = ref<Product[]>([])


// Paramètres de la route
const productId = computed(() => route.params.idOrAction as string)
const isEditMode = computed(() => !isNaN(parseInt(productId.value)))

// Produits filtrés selon la recherche
const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase()
  
  // Protection contre les erreurs si allProducts est undefined
  if (!allProducts.value || !Array.isArray(allProducts.value)) {
    return [];
  }
  
  // Filtrer les produits qui matchent la recherche et exclure le produit en cours d'édition
  return allProducts.value.filter(product => {
    if (!product || !product.name || !product.type) return false;
    
    const nameMatch = product.name.toLowerCase().includes(query)
    const typeMatch = product.type.toLowerCase().includes(query)
    const currentProductId = isEditMode.value ? parseInt(productId.value) : null
    
    return (nameMatch || typeMatch) && product.id !== currentProductId
  })
})

// Vérifier si un produit est dans les cross-sells
const isInCrossSells = (product: Product): boolean => {
  return selectedCrossSells.value.some(p => p.id === product.id)
}

// Vérifier si un produit est dans les produits liés
const isInRelated = (product: Product): boolean => {
  return selectedRelatedProducts.value.some(p => p.id === product.id)
}

// Ajouter/retirer un produit des cross-sells
const toggleCrossSell = (product: Product): void => {
  if (isInCrossSells(product)) {
    removeFromCrossSells(product)
  } else {
    selectedCrossSells.value.push(product)
  }
}

// Ajouter/retirer un produit des produits liés
const toggleRelated = (product: Product): void => {
  if (isInRelated(product)) {
    removeFromRelated(product)
  } else {
    selectedRelatedProducts.value.push(product)
  }
}

// Retirer un produit des cross-sells
const removeFromCrossSells = (product: Product): void => {
  const index = selectedCrossSells.value.findIndex(p => p.id === product.id)
  if (index !== -1) {
    selectedCrossSells.value.splice(index, 1)
  }
}

// Retirer un produit des produits liés
const removeFromRelated = (product: Product): void => {
  const index = selectedRelatedProducts.value.findIndex(p => p.id === product.id)
  if (index !== -1) {
    selectedRelatedProducts.value.splice(index, 1)
  }
}

// Formater le prix avec le symbole de devise
const formatPrice = (price?: number | string | null): string => {
  if (price === undefined || price === null) return '€0.00'
  return `€${parseFloat(String(price)).toFixed(2)}`
}

// Charger les données initiales
const loadData = async () => {
  loading.value = true
  
  try {
    // Charger tous les produits
    const products = await productStore.fetchProducts()
    allProducts.value = Array.isArray(products) ? products : []
    
    // Si nous sommes en mode édition, initialiser les produits sélectionnés
    if (isEditMode.value && productWizardStore.productData.cross_sells && Array.isArray(productWizardStore.productData.cross_sells) && allProducts.value) {
      const crossSellIds = productWizardStore.productData.cross_sells.map(id => typeof id === 'string' ? parseInt(id) : id)
      selectedCrossSells.value = allProducts.value.filter(p => p.id && crossSellIds.includes(Number(p.id)))
    }
    
    // Pour productData.related_products, vérifier d'abord si la propriété existe
    const wizardData = productWizardStore.productData as any; // On utilise any pour accéder à une propriété potentiellement non définie
    if (wizardData.related_products && Array.isArray(wizardData.related_products) && allProducts.value) {
      const relatedProductIds = wizardData.related_products.map((id: string | number) => typeof id === 'string' ? parseInt(id) : id)
      selectedRelatedProducts.value = allProducts.value.filter(p => p.id && relatedProductIds.includes(Number(p.id)))
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des données de cross-sells', { error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.error_loading_data')
    })
  } finally {
    loading.value = false
  }
}


// Hook de cycle de vie - Au montage du composant
onMounted(() => {
  loadData()
})

// Fonction de sauvegarde des données exposée au parent
const saveData = async (): Promise<boolean> => {
  try {
    // Extraire uniquement les IDs pour stocker dans productData
    const crossSellIds = selectedCrossSells.value.map(p => Number(p.id || 0)).filter(id => id !== 0)
    const relatedIds = selectedRelatedProducts.value.map(p => Number(p.id || 0)).filter(id => id !== 0)
    
    // Mettre à jour les données dans le store wizard
    // Utiliser une assertion de type pour éviter l'erreur de type
    productWizardStore.productData.cross_sells = crossSellIds as number[]
    
    // Gérer les related_products si la propriété existe
    const wizardData = productWizardStore.productData as any
    wizardData.related_products = relatedIds as number[]
    
    // Si en mode édition, sauvegarder directement via l'API
    if (isEditMode.value) {
      await productStore.updateProduct(parseInt(productId.value), {
        cross_sells: crossSellIds,
        related_products: relatedIds
      })
      
      notificationStore.showNotification({
        type: 'success',
        title: t('common.success'),
        message: t('products_services.cross_sells.saved_successfully')
      })
    }
    
    return true
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde des cross-sells', { error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.cross_sells.save_error')
    })
    return false
  }
}

// Exposer la fonction saveData au parent
defineExpose({
  saveData
})
</script>

<style scoped>
@import '@/assets/css/pages/products/product-cross-sells.css';
</style>