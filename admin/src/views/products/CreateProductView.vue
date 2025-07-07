<template>
  <div class="create-product-page">
    <ProductHeader
      :title="t('products_services.create_title')"
      :tabs="tabs"
      active-tab="type"
      :is-submitting="submitting"
      :product-type="selectedProductType"
      :product-id="productId"
      @save="saveProductType"
      @cancel="cancelCreation"
    />

    <div class="content-container">
      <div v-if="loading" class="text-center" style="padding: var(--spacing-xl)">
        <div class="spinner-loading" style="margin: 0 auto;"></div>
      </div>
      
      <!-- Composant critique: router-view pour afficher le contenu des routes enfants -->
      <router-view @update-product-type="updateProductType" />
    </div>

    <!-- Modal pour la confirmation du brouillon -->
    <DraftConfirmationModal
      ref="draftConfirmationRef"
      :draft-data="productWizardStore.productData"
      :current-data="{}"
      @resume="resumeDraft"
      @discard="discardDraft"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useNotificationStore } from '@/stores/notifications'
import { useProductStore } from '@/stores/products'
import { useProductWizardStore } from '@/stores/product-wizard'
import ProductHeader from '@/components/products/ProductHeader.vue'
import DraftConfirmationModal from '@/components/products/DraftConfirmationModal.vue'
import logger from '@/services/logger'

// Interface pour les types de produit
interface ProductType {
  value: string;
  label: string;
  icon: string;
  description?: string;
}

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()
const productStore = useProductStore()
const productWizardStore = useProductWizardStore()

// État initial
const loading = ref(false)
const submitting = ref(false)
const selectedProductType = ref<string>('shared_hosting')
const draftConfirmationRef = ref<any>(null)

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

// Définition des onglets et leurs routes correspondantes
const tabs = [
  { id: 'type', label: t('products_services.tabs.type'), icon: 'tag', route: 'create-product' },
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

// Vérifier s'il y a un brouillon à reprendre
onMounted(async () => {
  loading.value = true
  
  try {
    // Vérifier si nous avons un brouillon sauvegardé
    const hasDraft = await productWizardStore.hasDraft();
    
    if (hasDraft && !isEditMode.value) {
      // Afficher le modal de confirmation du brouillon
      draftConfirmationRef.value?.open();
    } else if (isEditMode.value) {
      // En mode édition, charger les détails du produit
      await loadProductForEditing();
    } else {
      // Pas de brouillon, initialiser avec les valeurs par défaut
      productWizardStore.resetProductData();
      productWizardStore.productData.product_type = selectedProductType.value;
    }
  } catch (error) {
    logger.error('Erreur lors du chargement initial de la vue de création de produit', { error });
    notificationStore.addNotification({
      title: t('common.error'),
      message: t('products_services.errors.load_failed'),
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
});

// Surveiller le type de produit sélectionné
watch(selectedProductType, (newValue) => {
  productWizardStore.productData.product_type = newValue;
});

// Méthode pour mettre à jour le type de produit depuis le composant enfant
const updateProductType = (newType: string) => {
  selectedProductType.value = newType;
};

// Charger les données du produit en mode édition
const loadProductForEditing = async () => {
  if (!productId.value) return;
  
  try {
    const product = await productStore.fetchProduct(productId.value);
    productWizardStore.setProductData(product);
    // Vérifier que product est défini avant d'y accéder
    selectedProductType.value = product?.product_type || 'shared_hosting';
  } catch (error) {
    logger.error('Erreur lors du chargement du produit pour édition', { productId: productId.value, error });
    notificationStore.addNotification({
      title: t('common.error'),
      message: t('products_services.errors.load_failed'),
      type: 'error'
    });
  }
};

// Enregistrer le produit complet
const saveProductType = async () => {
  submitting.value = true;

  try {
    // Validation : vérifier qu'un type de produit est sélectionné
    if (!selectedProductType.value) {
      notificationStore.addNotification({
        title: t('common.error'),
        type: 'error',
        message: t('products_services.errors.type_required')
      });
      return;
    }

    // Mettre à jour les données du store avec le type sélectionné
    productWizardStore.productData.product_type = selectedProductType.value;

    // Générer un nom par défaut si aucun nom n'est défini
    if (!productWizardStore.productData.name) {
      const typeLabel = productTypes.find(type => type.value === selectedProductType.value)?.label || selectedProductType.value;
      productWizardStore.productData.name = `Nouveau ${typeLabel}`;
      productWizardStore.productData.slug = selectedProductType.value.replace(/_/g, '-');
    }

    // Sauvegarder le produit complet en base de données
    const result = await productWizardStore.saveProduct();

    if (result.success) {
      // Le backend envoie déjà une notification de succès via sendSuccessToast()
      // Pas besoin d'ajouter une notification supplémentaire ici

      // Rediriger vers la liste des produits
      router.push({ name: 'products' });
    } else {
      // Afficher les erreurs spécifiques
      if (productWizardStore.errors && Object.keys(productWizardStore.errors).length > 0) {
        // Afficher chaque erreur séparément
        Object.entries(productWizardStore.errors).forEach(([field, message]) => {
          notificationStore.addNotification({
            title: t('common.error'),
            type: 'error',
            message: `${field}: ${message}`
          });
        });
      } else {
        // Erreur générique
        notificationStore.addNotification({
          title: t('common.error'),
          type: 'error',
          message: result.message || t('products_services.errors.save_failed')
        });
      }
    }
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde du produit', { productData: productWizardStore.productData, error });
    notificationStore.addNotification({
      title: t('common.error'),
      type: 'error',
      message: t('products_services.errors.save_failed')
    });
  } finally {
    submitting.value = false;
  }
};

// Annuler la création du produit
const cancelCreation = () => {
  router.push({ name: 'products' });
};

// Reprendre le brouillon
const resumeDraft = (draftData: any) => {
  // Adaptation pour s'assurer que la méthode setProductData existe
  if (typeof productWizardStore.setProductData === 'function') {
    productWizardStore.setProductData(draftData);
  } else {
    // Fallback si setProductData n'existe pas
    productWizardStore.productData = { ...draftData };
  }
  
  selectedProductType.value = draftData.product_type || 'shared_hosting';
  
  // Utiliser addNotification
  try {
    notificationStore.addNotification({
      title: t('common.success'),
      type: 'success',
      message: t('products_services.draft_resumed')
    });
  } catch (error) {
    logger.error('Erreur lors de l\affichage de la notification de reprise de brouillon', { error });
    // Fallback si showNotification n'existe pas
    if (typeof notificationStore.addNotification === 'function') {
      notificationStore.addNotification({
        title: t('common.success'),
        message: t('products_services.draft_resumed'),
        type: 'success'
      });
    }
  }
};

// Supprimer le brouillon
const discardDraft = async () => {
  // Adaptation pour s'assurer que la méthode deleteDraft existe
  try {
    // Utiliser resetProductData pour réinitialiser toutes les données avec la structure complète requise
    productWizardStore.resetProductData();
    
    // Mettre à jour le type de produit après la réinitialisation
    if (productWizardStore.productData) {
      productWizardStore.productData.product_type = selectedProductType.value;
    }
  } catch (error) {
    logger.error('Erreur lors de la suppression du brouillon', { error });
    // Réinitialiser les données du produit avec la structure complète
    productWizardStore.resetProductData();
    
    // Mettre à jour le type de produit
    if (productWizardStore.productData) {
      productWizardStore.productData.product_type = selectedProductType.value;
    }
  }
  
  // Utiliser addNotification
  try {
    notificationStore.addNotification({
      title: t('common.success'),
      type: 'success',
      message: t('products_services.draft_discarded')
    });
  } catch (error) {
    logger.error('Erreur notification', { error });
    // Fallback si showNotification n'existe pas
    if (typeof notificationStore.addNotification === 'function') {
      notificationStore.addNotification({
        title: t('common.success'),
        message: t('products_services.draft_discarded'),
        type: 'success'
      });
    }
  }
};
</script>

<style>
@import '@/assets/css/pages/products/create-product.css';
</style>