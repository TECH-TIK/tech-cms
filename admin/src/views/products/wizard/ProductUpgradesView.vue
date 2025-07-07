<template>
  <div>
    <p class="section-description">
      {{ t('products_services.upgrades.description') }}
    </p>

    <div class="product-selector">
      <h3 class="section-title">{{ t('products_services.upgrades.select_products') }}</h3>
      
      <!-- Filtres -->
      <div class="search-container">
        <i class="fas fa-search search-icon"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          :placeholder="t('common.search')" 
          class="search-input"
        />
      </div>
      
      <div class="filter-group" style="margin-bottom: var(--spacing-md);">
        <select v-model="categoryFilter" class="form-control">
          <option value="">{{ t('products_services.all_categories') }}</option>
          <option v-for="category in productCategories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      
      <div class="product-groups">
        <div v-if="loading" class="text-center" style="padding: var(--spacing-xl)">
          <div class="spinner-loading" style="margin: 0 auto;"></div>
        </div>
        
        <div v-else-if="filteredProducts.length === 0" class="empty-state">
          <div class="empty-icon"><i class="fas fa-box-open"></i></div>
          <h4 class="empty-title">{{ t('products_services.no_products_found') }}</h4>
          <p class="empty-description">{{ t('products_services.try_different_filter') }}</p>
        </div>
        
        <template v-else>
          <div v-for="(category, index) in filteredCategories" :key="category.id || index" class="product-group">
            <h4 class="group-title">{{ category.name }}</h4>
            
            <div class="product-cards">
              <div 
                v-for="product in getProductsByCategory(category.id)" 
                :key="product.id"
                class="product-card"
                :class="{ 'selected': isProductSelected(product.id) }"
                @click="toggleProduct(product)"
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
        </template>
      </div>
    </div>
    
    <div v-if="selectedProducts.length > 0" class="selected-products-container">
      <h3 class="section-title">
        {{ t('products_services.upgrades.selected_products') }}
        <span class="badge">{{ selectedProducts.length }}</span>
      </h3>
      
      <div class="selected-products-list">
        <div v-for="product in selectedProducts" :key="product.id" class="selected-product">
          <div class="product-info">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-category">{{ getCategoryName(product.group_id || null) }}</div>
          </div>
          <button class="remove-button" @click="removeProduct(product)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
    
    <div v-else-if="!loading" class="empty-state">
      <div class="empty-icon"><i class="fas fa-arrow-up"></i></div>
      <h4 class="empty-title">{{ t('products_services.upgrades.no_products_selected') }}</h4>
      <p class="empty-description">{{ t('products_services.upgrades.select_products_description') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Product, ProductCategory } from '@/types/product'
import { useRoute } from 'vue-router'
import { useProductWizardStore } from '@/stores/product-wizard'
import { useProductGroupsStore } from '@/stores/product-groups'
import { useProductStore } from '@/stores/products'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'

const { t } = useI18n()
const route = useRoute()
const notificationStore = useNotificationStore()
const productWizardStore = useProductWizardStore()
const productGroupsStore = useProductGroupsStore()
const productStore = useProductStore()

// État local
const loading = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const allProducts = ref<Product[]>([])
const selectedProducts = ref<Product[]>([])
const productCategories = ref<ProductCategory[]>([])

// Initialisation des productCategories et allProducts pour éviter les erreurs
// S'assurer que ces objets sont définis avant leur utilisation
if (!allProducts.value) allProducts.value = []
if (!productCategories.value) productCategories.value = []

// Paramètres de la route
const productId = computed(() => route.params.idOrAction as string)
const isEditMode = computed(() => !isNaN(parseInt(productId.value)))

// Produits filtrés selon la recherche et la catégorie
const filteredProducts = computed<Product[]>(() => {
  const query = searchQuery.value ? searchQuery.value.toLowerCase() : ''
  const categoryId = categoryFilter.value
  const currentProductId = isEditMode.value && productId.value ? parseInt(productId.value) : null
  
  // Protection contre les tableaux undefined
  if (!allProducts.value || !Array.isArray(allProducts.value)) {
    return []
  }
  
  return allProducts.value.filter(product => {
    if (!product || !product.name) return false
    
    // Filtrer par recherche
    const matchesSearch = !query || product.name.toLowerCase().includes(query)
    
    // Filtrer par catégorie
    const matchesCategory = !categoryId || String(product.group_id) === String(categoryId)
    
    // Ne pas inclure le produit actuel dans la liste
    const isNotCurrentProduct = !currentProductId || product.id !== currentProductId
    
    return matchesSearch && matchesCategory && isNotCurrentProduct
  })
})

// Catégories filtrées qui contiennent des produits
const filteredCategories = computed(() => {
  // Protection contre les tableaux undefined
  if (!filteredProducts.value || !Array.isArray(filteredProducts.value) || 
      !productCategories.value || !Array.isArray(productCategories.value)) {
    return []
  }
  
  const categoryIds = new Set(filteredProducts.value
    .filter(p => p && p.group_id)
    .map(p => p.group_id)
  )
  
  // Conversion en string pour gérer tous les types correctement
  return productCategories.value.filter(category => 
    category && category.id && categoryIds.has(Number(category.id))
  )
})

// Vérifier si un produit est sélectionné
const isProductSelected = (productId: number | string): boolean => {
  return selectedProducts.value.some(p => p.id === productId)
}

// Obtenir les produits d'une catégorie
const getProductsByCategory = (categoryId: number | string): Product[] => {
  return filteredProducts.value.filter(p => String(p.group_id) === String(categoryId))
}

// Obtenir le nom d'une catégorie
const getCategoryName = (categoryId: number | string | null): string => {
  const category = productCategories.value.find(c => c.id === categoryId)
  return category ? category.name : ''
}

// Ajouter/retirer un produit
const toggleProduct = (product: Product) => {
  if (isProductSelected(product.id)) {
    removeProduct(product)
  } else {
    selectedProducts.value.push(product)
  }
}

// Retirer un produit
const removeProduct = (product: Product) => {
  const index = selectedProducts.value.findIndex(p => p.id === product.id)
  if (index !== -1) {
    selectedProducts.value.splice(index, 1)
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
    // Initialiser les tableaux pour éviter les erreurs
    if (!allProducts.value) allProducts.value = []
    if (!productCategories.value) productCategories.value = []
    if (!selectedProducts.value) selectedProducts.value = []
    
    // Charger les catégories
    await productGroupsStore.fetchProductGroups()
    productCategories.value = productGroupsStore.productGroups || []
    
    // Charger tous les produits
    try {
      // fetchProducts() met à jour l'état interne du store (type void)
      await productStore.fetchProducts()
      // Utiliser directement les produits du store après l'appel
      allProducts.value = productStore.products || []
    } catch (error) {
      allProducts.value = []
      logger.error('Erreur lors du chargement des produits', { error })
    }
    
    // Exclure le produit actuel si nous sommes en mode édition
    if (isEditMode.value && productId.value) {
      const currentId = parseInt(productId.value)
      allProducts.value = allProducts.value.filter(p => p && p.id !== currentId)
    }
    
    // Si nous sommes en mode édition et que les données du produit ne sont pas chargées
    if (isEditMode.value && productId.value && 
        (!productWizardStore.productData || !('id' in productWizardStore.productData) || !productWizardStore.productData.id)) {
      // Charger les données du produit
      const productDetails = await productStore.fetchProduct(productId.value)
      if (productDetails) {
        productWizardStore.setProductData(productDetails)
      }
    }

    // Charger les produits de mise à niveau existants si en mode édition
    if (isEditMode.value && productWizardStore.productData && 
        productWizardStore.productData.upgrade_products) {
      const upgradeProducts = productWizardStore.productData.upgrade_products || []
      const upgradeProductIds = upgradeProducts.map((id: string | number) => parseInt(String(id)))
      
      selectedProducts.value = allProducts.value.filter(p => 
        p && p.id && upgradeProductIds.includes(Number(p.id))
      )
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des données', { error })
    notificationStore.showNotification({ 
      type: 'error', 
      title: t('common.error'), message: t('products_services.error_loading_data')
    })
  } finally {
    loading.value = false
  }
}



// Hook de cycle de vie - Au montage du composant
onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import '@/assets/css/pages/products/product-upgrades.css';
</style>