<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useProductGroupsStore } from '@/stores/product-groups'
import { useNotificationStore } from '@/stores/notifications'
import { useProductStore } from '@/stores/products'

// Interface pour le produit
interface Product {
  id?: number;
  type?: string;
  name?: string;
  [key: string]: any;
}

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const productGroupsStore = useProductGroupsStore()
const notificationStore = useNotificationStore()
const productStore = useProductStore()

// État initial
const loading = ref(false)
const productType = ref('shared_hosting')

// Déterminer si nous sommes en mode édition
const productId = computed(() => {
  const idOrAction = route.params.idOrAction as string
  if (idOrAction && idOrAction !== 'create') {
    return parseInt(idOrAction, 10)
  }
  return null
})

const isEditMode = computed(() => !!productId.value)

// Options pour les types de produits
const productTypes = [
  { value: 'shared_hosting', label: t('products_services.types.shared_hosting'), icon: 'server-stack' },
  { value: 'reseller_hosting', label: t('products_services.types.reseller_hosting'), icon: 'users' },
  { value: 'server_vps', label: t('products_services.types.server_vps'), icon: 'server' },
  { value: 'other', label: t('products_services.types.other'), icon: 'box' }
]

// Définition des onglets et leurs routes correspondantes
const tabs = [
  { id: 'type', label: t('products_services.tabs.type'), icon: 'tag', route: 'product-type' },
  { id: 'details', label: t('products_services.tabs.details'), icon: 'info-circle', route: 'product-details' },
  { id: 'pricing', label: t('products_services.tabs.pricing'), icon: 'money-bill', route: 'product-pricing' },
  { id: 'module', label: t('products_services.tabs.module'), icon: 'puzzle-piece', route: 'product-module' },
  { id: 'custom_fields', label: t('products_services.tabs.custom_fields'), icon: 'list-alt', route: 'product-custom-fields' },
  { id: 'configurable_options', label: t('products_services.tabs.configurable_options'), icon: 'cogs', route: 'product-configurable-options' },
  { id: 'upgrades', label: t('products_services.tabs.upgrades'), icon: 'arrow-up', route: 'product-upgrades' },
  { id: 'freedomain', label: t('products_services.tabs.freedomain'), icon: 'globe', route: 'product-freedomain' },
  { id: 'cross_sells', label: t('products_services.tabs.cross_sells'), icon: 'shopping-cart', route: 'product-cross-sells' },
  { id: 'other', label: t('products_services.tabs.other'), icon: 'ellipsis-h', route: 'product-other' },
  { id: 'links', label: t('products_services.tabs.links'), icon: 'link', route: 'product-links' }
]

// Déterminer l'onglet actif en fonction de la route actuelle
const activeTab = computed(() => {
  const currentRouteName = route.name as string
  
  // Cas spécial pour la route 'product-type'
  if (currentRouteName === 'product-type') {
    return 'type'
  }
  
  // Pour les autres routes, on cherche l'onglet correspondant
  const tab = tabs.find(tab => tab.route === currentRouteName)
  return tab ? tab.id : 'type'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab: { id: string; route: string }) => {
  // Sauvegarder les données dans localStorage avant de naviguer
  localStorage.setItem('productTypeData', JSON.stringify({ productType: productType.value }))
  
  if (tab.id === 'type') {
    if (isEditMode.value) {
      // En mode édition, naviguer vers la sous-route /type 
      router.push({ 
        name: 'product-type',
        params: { idOrAction: productId.value }
      })
    } else {
      // En mode création, aller à la page de création
      router.push({ 
        name: 'create-product'
      })
    }
  } else {
    // Pour les autres onglets, on passe le paramètre idOrAction
    const idOrAction = isEditMode.value ? productId.value : 'create'
    router.push({
      name: tab.route,
      params: { idOrAction }
    })
  }
}

// Continuer vers l'étape suivante
const continueToDetails = () => {
  // Initialiser le localStorage avec le type de produit
  localStorage.setItem('currentProductData', JSON.stringify({
    productType: productType.value
  }))
  
  // Naviguer vers la page de détails avec le bon paramètre
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-details',
    params: { idOrAction }
  })
}

// Annulation et retour à la liste
const cancelCreation = () => {
  router.push({ name: 'products' })
}

// Chargement des données nécessaires
const fetchData = async () => {
  loading.value = true
  try {
    await productGroupsStore.fetchProductGroups()
    
    // Si on est en mode édition, charger les données du produit
    if (isEditMode.value) {
      try {
        // Charger les données du produit
        const response = await productStore.fetchProduct(productId.value);
        const product = response as Product | null;
        
        if (product) {
          productType.value = product.type || 'shared_hosting';
          
          // Stocker les données dans localStorage pour les étapes suivantes
          localStorage.setItem('currentProductData', JSON.stringify(product));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du produit:', error);
        notificationStore.showNotification({
          title: t('products_services.errors.product_load_failed_title'),
          message: t('products_services.errors.product_load_failed'),
          type: 'error'
        });
      }
    } else {
      // En mode création, vérifier s'il y a des données sauvegardées
      const savedData = localStorage.getItem('productTypeData')
      if (savedData) {
        try {
          const data = JSON.parse(savedData)
          if (data.productType) {
            productType.value = data.productType
          }
        } catch (e) {
          console.error('Erreur lors du parsing des données sauvegardées:', e)
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    notificationStore.showNotification({
      title: t('products_services.errors.load_data_failed_title'),
      message: t('products_services.errors.load_data_failed'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Initialisation
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="create-product-view view-container">
    <div class="header-box">
      <div class="header-content">
        <h1 class="page-title">
          {{ isEditMode ? t('products_services.edit_product.title') : t('products_services.create_product.title') }}
        </h1>
        <span class="page-description">
          {{ isEditMode ? t('products_services.edit_product.description') : t('products_services.create_product.description') }}
        </span>
      </div>
    </div>
    
    <!-- Barre de navigation par onglets -->
    <div class="tabs-navigation">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-item"
        :class="{ 'active': activeTab === tab.id }"
        @click="navigateToTab(tab)"
      >
        <i :class="`fas fa-${tab.icon}`"></i>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </div>
    
    <!-- Contenu spécifique à la page d'accueil du wizard -->
    <div v-if="activeTab === 'type'" class="wizard-content">
      <div class="product-type-selection">
        <h2 class="section-title">
          {{ isEditMode ? t('products_services.edit_product.select_type') : t('products_services.create_product.select_type') }}
        </h2>
        <p class="section-description">{{ t('products_services.create_product.type_description') }}</p>
        
        <div class="product-type-grid">
          <div 
            v-for="type in productTypes" 
            :key="type.value"
            class="product-type-card"
            :class="{ 'selected': productType === type.value }"
            @click="productType = type.value"
          >
            <div class="product-type-icon">
              <i :class="`fas fa-${type.icon}`"></i>
            </div>
            <div class="product-type-label">{{ type.label }}</div>
          </div>
        </div>
        
        <div class="product-type-help">
          <p>{{ t('products_services.create_product.type_help') }}</p>
          <p>{{ t('products_services.create_product.type_other_help') }}</p>
        </div>
      </div>
      
      <!-- Boutons de navigation -->
      <div class="wizard-actions">
        <button 
          type="button" 
          class="btn btn-outline-secondary"
          @click="cancelCreation"
        >
          {{ t('common.cancel') }}
        </button>
        
        <button 
          type="button" 
          class="btn btn-primary"
          @click="continueToDetails"
        >
          {{ t('common.continue') }}
        </button>
      </div>
    </div>
    
    <!-- Pour les autres onglets, le contenu sera affiché par les composants correspondants -->
    <router-view v-else></router-view>
  </div>
</template>

<style scoped>
@import '@/assets/css/components/common-layout.css';
@import '@/assets/styles/wizard-tabs.css';

.wizard-content {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.tabs-navigation {
  display: flex;
  flex-wrap: wrap;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  overflow-x: auto;
  justify-content: center;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-muted);
  white-space: nowrap;
}

.tab-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-color);
}

.tab-item.active {
  background: rgba(0, 102, 255, 0.1);
  color: var(--primary-blue);
  font-weight: 500;
}

.tab-item i {
  font-size: 1.2rem;
  margin-right: var(--spacing-xs);
}

.tab-label {
  font-size: 0.9rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-color);
}

.section-description {
  color: var(--text-muted);
  margin-bottom: var(--spacing-lg);
}

.product-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.product-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.product-type-card:hover {
  background: rgba(255, 255, 255, 0.1);
}

.product-type-card.selected {
  background: rgba(0, 102, 255, 0.1);
  border-color: var(--primary-blue);
}

.product-type-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--primary-blue);
}

.product-type-label {
  font-weight: 500;
  color: var(--text-color);
}

.product-type-help {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: var(--spacing-lg);
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-lg);
}

.btn {
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: linear-gradient(to right, var(--primary-blue), var(--secondary-blue));
  border: none;
  color: white;
}

.btn-outline-secondary {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--text-muted);
}

.btn-outline-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-color);
}

@media (max-width: 768px) {
  .tabs-navigation {
    flex-direction: column;
    padding: 0;
  }
  
  .tab-item {
    border-radius: 0;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--glass-border);
  }
  
  .tab-item:last-child {
    border-bottom: none;
  }
}
</style>
