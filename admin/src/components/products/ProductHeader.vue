<template>
  <div class="product-header">
    <div class="header-content">
      <h1 class="page-title">{{ title }}</h1>
      <div class="action-buttons">
        <button 
          class="btn btn-outline-secondary" 
          :disabled="isSubmitting"
          @click="$emit('cancel')"
        >
          <i class="fas fa-times"></i> {{ $t('common.cancel') }}
        </button>
        <button 
          class="btn btn-primary" 
          :disabled="isSubmitting"
          @click="$emit('save')"
        >
          <i class="fas fa-save"></i> {{ $t('common.save') }}
          <span v-if="isSubmitting" class="spinner-loading"></span>
        </button>
      </div>
    </div>
    
    <div class="tabs-navigation">
      <router-link 
        v-for="tab in visibleTabs" 
        :key="tab.id"
        :to="getTabRoute(tab)"
        class="tab-item"
        :class="{ 'active': activeTab === tab.id }"
      >
        <i :class="'fas fa-' + tab.icon"></i> {{ tab.label }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Interface pour les onglets
interface ProductTab {
  id: string;
  label: string;
  route: string;
  icon: string;
}
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'


const route = useRoute()

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  productType: {
    type: String,
    default: 'shared_hosting'
  },
  productId: {
    type: [Number, null],
    default: null
  }
})

defineEmits(['save', 'cancel'])

// Déterminer si nous sommes en mode édition ou création
const isEditMode = computed(() => !!props.productId)

// Utiliser la traduction
const { t } = useI18n()

// Fonction pour obtenir la route correcte pour chaque onglet
const getTabRoute = (tab: ProductTab) => {
  // Si nous sommes en mode édition, utiliser l'ID du produit comme paramètre
  if (isEditMode.value) {
    return { name: tab.route, params: { idOrAction: props.productId?.toString() } };
  }
  // Si nous sommes en mode création, utiliser 'create' comme idOrAction et le type comme paramètre
  if (tab.route === 'product-type') {
    return { name: tab.route, params: { type: props.productType } };
  }
  return { name: tab.route, params: { idOrAction: 'create', type: props.productType } };
}

// Définir les onglets disponibles
const tabs = [
  { id: 'type', label: t('products_services.tabs.type'), route: 'product-type', icon: 'fas fa-sitemap' },
  { id: 'details', label: t('products_services.tabs.details'), route: 'product-details', icon: 'fas fa-info-circle' },
  { id: 'pricing', label: t('products_services.tabs.pricing'), route: 'product-pricing', icon: 'fas fa-tag' },
  { id: 'module', label: t('products_services.tabs.module'), route: 'product-module', icon: 'fas fa-cogs' },
  { id: 'custom_fields', label: t('products_services.tabs.custom_fields'), route: 'product-custom-fields', icon: 'fas fa-list-alt' },
  { id: 'configurable_options', label: t('products_services.tabs.configurable_options'), route: 'product-configurable-options', icon: 'fas fa-sliders-h' },
  { id: 'upgrades', label: t('products_services.tabs.upgrades'), route: 'product-upgrades', icon: 'fas fa-level-up-alt' },
  { id: 'free_domain', label: t('products_services.tabs.free_domain'), route: 'product-free-domain', icon: 'fas fa-globe' },
  { id: 'cross_sells', label: t('products_services.tabs.cross_sells'), route: 'product-cross-sells', icon: 'fas fa-handshake' },
  { id: 'other', label: t('products_services.tabs.other'), route: 'product-other', icon: 'fas fa-ellipsis-h' },
  { id: 'links', label: t('products_services.tabs.links'), route: 'product-links', icon: 'fas fa-link' },
]

// Déterminer l'onglet actif en fonction de la route
const activeTab = computed(() => {
  const currentRouteName = route.name?.toString() || ''
  
  // Trouver l'onglet correspondant à la route actuelle
  const matchingTab = tabs.find(tab => tab.route === currentRouteName)
  
  // Retourner l'ID de l'onglet correspondant, ou 'details' par défaut
  return matchingTab ? matchingTab.id : 'details'
})

// Filtrer les onglets en fonction du type de produit
const visibleTabs = computed(() => {
  return tabs.filter(tab => {
    // Logique pour afficher conditionnellement certains onglets
    // selon le type de produit
    if (tab.id === 'type' && isEditMode.value) {
      return false
    }
    if (tab.id === 'module' && props.productType === 'domain') {
      return false
    }
    return true
  })
})
</script>

<style scoped>
.product-header {
  margin-bottom: var(--spacing-lg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.tabs-navigation {
  display: flex;
  justify-content: center; /* Centrer les onglets */
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  padding: var(--spacing-xs);
  overflow-x: auto;
}

.tab-item {
  color: var(--text-muted);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
}

.tab-item:hover {
  color: var(--text-color);
  background: rgb(255 255 255 / 5%);
}

.tab-item.active {
  color: var(--text-color);
  background: rgb(0 102 255 / 15%);
}

.tab-item i {
  margin-right: var(--spacing-xs);
}

.spinner-loading {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-left: var(--spacing-sm);
  border: 2px solid rgb(255 255 255 / 30%);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>