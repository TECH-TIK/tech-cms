<template>
  <div>
    <p class="section-description">
      {{ t('products_services.type_selection_help') }}
    </p>

    <div class="product-type-grid">
      <div 
        v-for="type in productTypes" 
        :key="type.value"
        class="product-type-card"
        :class="{ 'selected': selectedProductType === type.value }"
        @click="selectedProductType = type.value"
      >
        <div class="product-type-icon">
          <i :class="`fas fa-${type.icon}`"></i>
        </div>
        <h3 class="product-type-title">{{ type.label }}</h3>
        <p class="product-type-description">{{ type.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductWizardStore } from '@/stores/product-wizard'

// Interface pour les types de produit
interface ProductType {
  value: string;
  label: string;
  icon: string;
  description?: string;
}

const { t } = useI18n()
const productWizardStore = useProductWizardStore()

// Définir les événements émis
const emit = defineEmits(['update-product-type'])

// État initial
const selectedProductType = ref<string>('shared_hosting')



// Options pour les types de produits
const productTypes: ProductType[] = [
  { 
    value: 'shared_hosting', 
    label: t('products_services.types.shared_hosting'), 
    icon: 'server', 
    description: t('products_services.types_descriptions.shared_hosting')
  },
  { 
    value: 'reseller_hosting', 
    label: t('products_services.types.reseller_hosting'), 
    icon: 'users', 
    description: t('products_services.types_descriptions.reseller_hosting')
  },
  { 
    value: 'server_vps', 
    label: t('products_services.types.server_vps'), 
    icon: 'desktop', 
    description: t('products_services.types_descriptions.server_vps')
  },
  { 
    value: 'domain', 
    label: t('products_services.types.domain'), 
    icon: 'globe', 
    description: t('products_services.types_descriptions.domain')
  },
  { 
    value: 'other', 
    label: t('products_services.types.other'), 
    icon: 'box', 
    description: t('products_services.types_descriptions.other')
  }
]

// Initialiser le type de produit
onMounted(() => {
  // Récupérer le type depuis le store ou utiliser la valeur par défaut
  if (productWizardStore.productData?.product_type) {
    selectedProductType.value = productWizardStore.productData.product_type
  }
})

// Surveiller le type de produit sélectionné
watch(selectedProductType, (newValue) => {
  if (productWizardStore.productData) {
    productWizardStore.productData.product_type = newValue
  }
  // Émettre l'événement vers le parent
  emit('update-product-type', newValue)
})
</script>

<style scoped>
@import '@/assets/css/pages/products/create-product.css';
</style>
