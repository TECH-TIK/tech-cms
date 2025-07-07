<template>
  <div>
    <p class="section-description">
      {{ t('products_services.details.description') }}
    </p>

    <div v-if="loading" class="text-center" style="padding: var(--spacing-xl)">
      <div class="spinner-loading" style="margin: 0 auto;"></div>
    </div>

    <form v-else @submit.prevent="saveAndContinue">
      <div class="form-section">
        <h3 class="form-section-title">{{ t('products_services.details.basic_info') }}</h3>
        
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <label class="form-label">{{ t('products_services.details.name') }} *</label>
              <input 
                v-model="productData.name" 
                type="text" 
                class="form-control" 
                :placeholder="t('products_services.details.name_placeholder')" 
                required
              />
            </div>
          </div>
          
          <div class="form-col">
            <div class="form-group">
              <label class="form-label">{{ t('products_services.details.slug') }}</label>
              <input 
                v-model="productData.slug" 
                type="text" 
                class="form-control" 
                :placeholder="t('products_services.details.slug_placeholder')" 
              />
              <p class="form-hint">{{ t('products_services.details.slug_hint') }}</p>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products_services.details.category') }} *</label>
          <select v-model="productData.group_id" class="form-control" required>
            <option :value="null">{{ t('products_services.details.select_category') }}</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products_services.details.description') }}</label>
          <textarea 
            v-model="productData.description" 
            class="form-control" 
            :placeholder="t('products_services.details.description_placeholder')" 
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products_services.details.short_description') }}</label>
          <textarea 
            v-model="productData.short_description" 
            class="form-control" 
            :placeholder="t('products_services.details.short_description_placeholder')" 
            rows="2"
          ></textarea>
        </div>
      </div>
      
      <div class="form-section">
        <h3 class="form-section-title">{{ t('products_services.details.display_options') }}</h3>
        
        <div class="form-row">
          <div class="form-col">
            <div class="form-group">
              <label class="form-label">{{ t('products_services.details.welcome_email') }}</label>
              <select v-model="productData.welcome_email_id" class="form-control">
                <option value="">{{ t('products_services.details.select_welcome_email') }}</option>
                <option v-for="email in welcomeEmails" :key="email.id" :value="email.id">
                  {{ email.name }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="form-col">
            <div class="form-group">
              <label class="form-label">{{ t('products_services.details.color') }}</label>
              <input 
                v-model="productData.color" 
                type="color" 
                class="form-control color-picker" 
              />
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products_services.details.image') }}</label>
          <input 
            type="file" 
            class="form-control" 
            accept="image/*" 
            @change="handleImageUpload"
          />
          <div v-if="productData.image_url" class="product-image-preview">
            <img :src="productData.image_url" alt="Product Image" />
            <button 
              type="button" 
              class="btn btn-danger btn-sm" 
              @click="removeImage"
            >
              {{ t('products_services.details.remove_image') }}
            </button>
          </div>
        </div>
        
        <div class="form-group form-checkbox">
          <input 
            id="hidden" 
            v-model="hiddenValue" 
            type="checkbox" 
            class="form-checkbox-input" 
          />
          <label for="hidden" class="form-checkbox-label">
            {{ t('products_services.details.hidden') }}
          </label>
          <p class="form-hint">{{ t('products_services.details.hidden_hint') }}</p>
        </div>
        
        <div class="form-group form-checkbox">
          <input 
            id="featured" 
            v-model="featuredValue" 
            type="checkbox" 
            class="form-checkbox-input" 
          />
          <label for="featured" class="form-checkbox-label">
            {{ t('products_services.details.featured') }}
          </label>
          <p class="form-hint">{{ t('products_services.details.featured_hint') }}</p>
        </div>
      </div>
      
      <div class="form-section">
        <h3 class="form-section-title">{{ t('products_services.details.additional_info') }}</h3>
        
        <div class="form-group">
          <label class="form-label">{{ t('products_services.details.tag_line') }}</label>
          <input 
            v-model="productData.tag_line" 
            type="text" 
            class="form-control" 
            :placeholder="t('products_services.details.tag_line_placeholder')" 
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ t('products_services.details.order_link') }}</label>
          <input 
            v-model="productData.order_link" 
            type="text" 
            class="form-control" 
            :placeholder="t('products_services.details.order_link_placeholder')" 
          />
          <p class="form-hint">{{ t('products_services.details.order_link_hint') }}</p>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useNotificationStore } from '@/stores/notifications'
import { useProductWizardStore } from '@/stores/product-wizard'
import { useProductGroupsStore } from '@/stores/product-groups'
import { useProductStore } from '@/stores/products'
import logger from '@/services/logger'
import { ProductCategory } from '@/types/product'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()
const productWizardStore = useProductWizardStore()
const productGroupsStore = useProductGroupsStore()

// État local
const loading = ref(false)
const submitting = ref(false)

// Types explicites pour éviter les erreurs never[]
interface WelcomeEmail {
  id: number;
  name: string;
}

const categories = ref<ProductCategory[]>([])
const welcomeEmails = ref<WelcomeEmail[]>([])

// Données du produit avec sécurité pour éviter les erreurs
const productData = computed(() => {
  // S'assurer que productWizardStore.productData existe, sinon retourner un objet vide
  return productWizardStore.productData || {
    name: '',
    slug: '',
    description: '',
    short_description: '',
    group_id: null,
    welcome_email_id: '',
    color: '#0066ff',
    image_url: null,
    hidden: false,
    featured: false,
    tag_line: '',
    order_link: ''
  }
})
const productType = computed(() => route.params.type as string)
const productId = computed(() => route.params.idOrAction as string)
const isEditMode = computed(() => !isNaN(parseInt(productId.value)))

// Chargement des données
const loadData = async () => {
  loading.value = true
  
  try {
    // Charger les catégories
    await productGroupsStore.fetchProductGroups()
    categories.value = productGroupsStore.productGroups
    
    // Initialiser les emails de bienvenue avec un tableau vide pour le moment
    // Note: La fonction fetchWelcomeEmails n'existe pas, donc nous initialisons avec des données factices temporaires
    welcomeEmails.value = [
      { id: 1, name: 'Email de bienvenue par défaut' },
      { id: 2, name: 'Email de bienvenue produits hosting' },
      { id: 3, name: 'Email de bienvenue services' }
    ]
    
    // Si nous sommes en mode édition, charger les données du produit
    if (isEditMode.value) {
      // Importer le ProductStore si nécessaire
      const productStore = useProductStore();
      // Récupérer les détails du produit depuis le productStore
      const productDetails = await productStore.fetchProduct(productId.value)
      // Mettre à jour les données dans le wizard
      productWizardStore.setProductData(productDetails)
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des données des détails du produit', { error });
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.error_loading_data')
    })
  } finally {
    loading.value = false
  }
}

// État local des cases à cocher pour éviter les problèmes de mise à jour
const localCheckboxState = ref({
  hidden: false,
  featured: false
})

// Initialisation des états locaux depuis productData
watchEffect(() => {
  // Convertit les valeurs (0/1/string/boolean) en booléens stricts
  const hiddenValue = productData.value.hidden === true || 
                     String(productData.value.hidden) === '1' || 
                     Number(productData.value.hidden) === 1
  
  const featuredValue = productData.value.featured === true || 
                       String(productData.value.featured) === '1' || 
                       Number(productData.value.featured) === 1
  
  // Met à jour l'état local uniquement si different (pour éviter boucles infinies)
  if (localCheckboxState.value.hidden !== hiddenValue) {
    localCheckboxState.value.hidden = hiddenValue
  }
  
  if (localCheckboxState.value.featured !== featuredValue) {
    localCheckboxState.value.featured = featuredValue
  }
})

// Fonction pour mettre à jour les deux états en même temps si nécessaire
const updateCheckboxStates = (key: 'hidden' | 'featured', newValue: boolean) => {
  // Met à jour l'état local immédiatement
  localCheckboxState.value[key] = newValue
  
  // Pour éviter les problèmes de mise à jour, nous créons un nouvel objet
  // qui combine les deux états actuels
  const updatedData = {
    hidden: localCheckboxState.value.hidden,
    featured: localCheckboxState.value.featured
  }
  
  // Envoi des deux états au store en une seule fois
  productWizardStore.updateProductData(updatedData)
}

// Propriétés calculées pour les cases à cocher avec état local
const hiddenValue = computed({
  get: () => localCheckboxState.value.hidden,
  set: (newValue: boolean) => updateCheckboxStates('hidden', newValue)
})

const featuredValue = computed({
  get: () => localCheckboxState.value.featured,
  set: (newValue: boolean) => updateCheckboxStates('featured', newValue)
})

// Gestion des images
const handleImageUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  // Stocker à la fois le fichier physique et l'aperçu en base64
  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>): void => {
    if (e.target && e.target.result) {
      // On stocke l'aperçu en base64 pour l'affichage et le fichier pour l'upload
      productWizardStore.updateProductData({
        image_url: e.target.result as string, // Pour la prévisualisation
        image_file: file // Pour l'envoi au serveur
      })
    }
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  productWizardStore.updateProductData({
    image_url: null
  })
}

// Validation du formulaire
const validateForm = () => {
  if (!productData.value.name) {
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.details.name_required')
    })
    return false
  }
  
  if (!productData.value.group_id) {
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.details.category_required')
    })
    return false
  }
  
  return true
}

// Sauvegarder et continuer vers l'étape suivante
const saveAndContinue = async () => {
  if (!validateForm()) {
    return
  }
  
  submitting.value = true
  
  try {
    // Si le slug est vide, le générer à partir du nom
    if (!productData.value.slug) {
      productWizardStore.updateProductData({
        slug: productData.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      })
    }
    
    // Si nous sommes en mode édition, sauvegarder directement
    if (isEditMode.value) {
      await productWizardStore.saveProduct()
    }
    
    // Rediriger vers l'étape suivante
    const nextStep = isEditMode.value 
      ? { name: 'product-pricing', params: { idOrAction: productId.value } }
      : { name: 'product-pricing', params: { type: productType.value } }
    
    router.push(nextStep)
    
    notificationStore.showNotification({
      type: 'success',
      title: t('common.success'),
      message: t('products_services.details.saved_successfully')
    })
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde des détails du produit', { error });
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.error_saving_data')
    })
  } finally {
    submitting.value = false
  }
}


// Hook de cycle de vie - Au montage du composant
onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import '@/assets/css/pages/products/product-details.css';
</style>