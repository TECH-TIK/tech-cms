<template>
  <div class="product-details-view">
    <div class="wizard-content">
      <div class="form-section">
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('products_services.details.product_type') }}</label>
            <select class="form-control" disabled>
              <option>{{ t(`products_services.types.${productType}`) }}</option>
            </select>
            <small class="form-text text-muted">{{ t('products_services.details.product_type_help') }}</small>
          </div>
          
          <div class="form-group">
            <label>{{ t('products_services.details.product_group') }}</label>
            <select 
              v-model="productData.group_id"
              class="form-control"
              :class="{ 'is-invalid': errors.group_id }"
            >
              <option value="">{{ t('products_services.details.select_group') }}</option>
              <option 
                v-for="group in productGroupsStore.productGroups" 
                :key="group.id" 
                :value="group.id"
              >
                {{ group.name }}
              </option>
            </select>
            <div v-if="errors.group_id" class="invalid-feedback">{{ errors.group_id }}</div>
            <small class="form-text text-muted">{{ t('products_services.details.product_group_help') }}</small>
          </div>
        </div>
        
        <div class="form-group">
          <label>{{ t('products_services.details.product_name') }}</label>
          <input 
            type="text" 
            v-model="productData.name"
            class="form-control"
            :class="{ 'is-invalid': errors.name }"
            @input="updateSlug"
          />
          <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
          <small class="form-text text-muted">{{ t('products_services.details.product_name_help') }}</small>
        </div>
        
        <div class="form-group">
          <label>{{ t('products_services.details.product_tagline') }}</label>
          <input 
            type="text" 
            v-model="productData.tagline"
            class="form-control"
          />
          <small class="form-text text-muted">{{ t('products_services.details.product_tagline_help') }}</small>
        </div>
        
        <div class="form-group">
          <label>{{ t('products_services.details.url') }}</label>
          <div class="input-group">
            <input 
              type="text" 
              v-model="productData.url"
              class="form-control"
              @input="updateUrl"
            />
            <div class="input-group-append">
              <button class="btn btn-outline-secondary" type="button">
                <i class="fas fa-refresh"></i>
              </button>
            </div>
          </div>
          <small class="form-text text-muted">{{ t('products_services.details.url_help') }}</small>
        </div>
        
        <div class="form-group">
          <label>{{ t('products_services.details.module') }}</label>
          <select 
            v-model="productData.module"
            class="form-control"
          >
            <option v-for="option in moduleOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <small class="form-text text-muted">{{ t('products_services.details.module_help') }}</small>
        </div>
        
        <div class="form-group">
          <label>{{ t('products_services.details.product_short_description') }}</label>
          <textarea 
            v-model="productData.shortDescription"
            class="form-control"
            rows="2"
          ></textarea>
          <small class="form-text text-muted">{{ t('products_services.details.product_short_description_help') }}</small>
        </div>
        
        <div class="form-group">
          <label>{{ t('products_services.details.product_description') }}</label>
          <textarea 
            v-model="productData.description"
            class="form-control"
            rows="4"
          ></textarea>
          <small class="form-text text-muted">{{ t('products_services.details.product_description_help') }}</small>
        </div>
        
        <div class="form-group">
          <label>{{ t('products_services.details.product_color') }}</label>
          <input 
            type="color" 
            v-model="productData.color"
            class="form-control color-picker"
          />
          <small class="form-text text-muted">{{ t('products_services.details.product_color_help') }}</small>
        </div>
        
        <div class="form-group">
          <label>{{ t('products_services.details.welcome_email') }}</label>
          <select 
            v-model="productData.welcomeEmail"
            class="form-control"
          >
            <option v-for="option in welcomeEmailOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <small class="form-text text-muted">{{ t('products_services.details.welcome_email_help') }}</small>
        </div>
        
        <div class="form-section advanced-options">
          <h3 class="section-title">{{ t('products_services.details.advanced_options') }}</h3>
          
          <div class="form-check">
            <input 
              type="checkbox" 
              class="form-check-input" 
              id="hidden-product"
              v-model="productData.hidden"
            />
            <label class="form-check-label" for="hidden-product">
              {{ t('products_services.details.create_as_hidden') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.details.create_as_hidden_help') }}</small>
          </div>
          
          <div class="form-check">
            <input 
              type="checkbox" 
              class="form-check-input" 
              id="require-domain"
              v-model="productData.requireDomain"
            />
            <label class="form-check-label" for="require-domain">
              {{ t('products_services.details.require_domain') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.details.require_domain_help') }}</small>
          </div>
          
          <div class="form-check">
            <input 
              type="checkbox" 
              class="form-check-input" 
              id="stock-control"
              v-model="productData.stockControl"
            />
            <label class="form-check-label" for="stock-control">
              {{ t('products_services.details.stock_control') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.details.stock_control_help') }}</small>
          </div>
          
          <div class="form-group" v-if="productData.stockControl">
            <label>{{ t('products_services.details.stock_quantity') }}</label>
            <input 
              type="number" 
              v-model.number="productData.stockQuantity"
              class="form-control"
              min="0"
            />
          </div>
          
          <div class="form-check">
            <input 
              type="checkbox" 
              class="form-check-input" 
              id="apply-tax"
              v-model="productData.applyTax"
            />
            <label class="form-check-label" for="apply-tax">
              {{ t('products_services.details.apply_tax') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.details.apply_tax_help') }}</small>
          </div>
          
          <div class="form-check">
            <input 
              type="checkbox" 
              class="form-check-input" 
              id="featured"
              v-model="productData.featured"
            />
            <label class="form-check-label" for="featured">
              {{ t('products_services.details.featured') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.details.featured_help') }}</small>
          </div>
          
          <div class="form-check">
            <input 
              type="checkbox" 
              class="form-check-input" 
              id="hide-other-products"
              v-model="productData.hideOtherProducts"
            />
            <label class="form-check-label" for="hide-other-products">
              {{ t('products_services.details.hide_other_products') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.details.hide_other_products_help') }}</small>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Boutons de navigation -->
    <div class="wizard-actions">
      <button 
        type="button" 
        class="btn btn-outline-secondary"
        @click="goBack"
      >
        {{ t('common.back') }}
      </button>
      
      <template v-if="isEditMode || !isDetailMode">
        <button 
          type="button" 
          class="btn btn-primary"
          @click="continueToNextStep"
          :disabled="loading"
        >
          {{ t('common.continue') }}
        </button>
      </template>
      
      <template v-else>
        <button 
          type="button" 
          class="btn btn-primary"
          @click="editProduct"
          :disabled="loading"
        >
          {{ t('common.edit') }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useProductStore } from '@/stores/products'
import { useProductGroupsStore } from '@/stores/product-groups'
import { useNotificationStore } from '@/stores/notifications'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const productStore = useProductStore()
const productGroupsStore = useProductGroupsStore()
const notificationStore = useNotificationStore()

// Récupérer le type de produit depuis les paramètres de route
const productType = computed(() => route.params.type as string || 'shared_hosting')

// Vérifier si nous sommes en mode édition ou détail d'un produit existant
const productId = computed(() => {
  const idOrAction = route.params.idOrAction as string
  if (idOrAction && idOrAction !== 'create') {
    return parseInt(idOrAction, 10)
  }
  return null
})

const isEditMode = computed(() => {
  return !!productId.value
})

const isDetailMode = computed(() => {
  return !!productId.value
})

// Récupérer les données précédentes de localStorage, si disponibles
const previousData = computed(() => {
  const savedProductData = localStorage.getItem('currentProductData')
  if (savedProductData) {
    try {
      return JSON.parse(savedProductData)
    } catch (e) {
      console.error('Erreur lors du parsing des données:', e)
      return {}
    }
  }
  return {}
})

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

// Déterminer l'onglet actif en fonction de la route actuelle
const activeTab = computed(() => {
  const currentRouteName = route.name as string
  const tab = tabs.find(tab => tab.route === currentRouteName)
  return tab ? tab.id : 'details'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  if (tab.id === 'type') {
    // Si nous sommes en mode édition, rediriger vers la page d'édition du produit
    if (isEditMode.value) {
      router.push({ path: `/products/${productId.value}` })
    } else {
      // Sinon, rediriger vers la création de produit
      router.push({ name: 'create-product' })
    }
  } else {
    // Sauvegarder les données dans localStorage
    localStorage.setItem('currentProductData', JSON.stringify(productData.value))
    
    const idOrAction = isEditMode.value ? productId.value : 'create'
    router.push({
      name: tab.route,
      params: { idOrAction }
    })
  }
}

// État
const loading = ref(false)
const errors = ref({})

// Données du produit
const productData = ref({
  // Informations générales
  type: 'product',
  productType: productType.value,
  name: '',
  slug: '',
  group_id: null as number | null,
  url: '',
  module: '',
  hidden: false,
  
  // Détails supplémentaires
  tagline: '',
  shortDescription: '',
  description: '',
  color: '#00C3FF',
  
  // Options avancées
  welcomeEmail: '',
  requireDomain: false,
  stockControl: false,
  stockQuantity: 0,
  applyTax: false,
  featured: false,
  hideOtherProducts: false
})

// Charger les données d'un produit existant
const loadExistingProduct = async () => {
  if (productId.value) {
    loading.value = true
    try {
      const product = await productStore.fetchProduct(productId.value)
      if (product) {
        productData.value = {
          ...productData.value,
          ...product,
          productType: product.product_type || productType.value,
          shortDescription: product.short_description || '',
          hideOtherProducts: product.hide_other_products || false
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error)
      notificationStore.showNotification({
        title: t('products_services.errors.fetch'),
        message: t('products_services.errors.fetchMessage'),
        type: 'error'
      })
    } finally {
      loading.value = false
    }
  }
}

// Générer automatiquement le slug à partir du nom
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Mettre à jour le slug lorsque le nom change
const updateSlug = () => {
  if (!productData.value.slug || productData.value.slug === generateSlug(productData.value.name.substring(0, productData.value.name.length - 1))) {
    productData.value.slug = generateSlug(productData.value.name)
  }
}

// Mettre à jour l'URL lorsque le slug change
const updateUrl = () => {
  if (productData.value.slug) {
    productData.value.url = `/store/${productData.value.slug}/`
  }
}

// Options pour les modules
const moduleOptions = [
  { value: '', label: t('products_services.modules.none') },
  { value: 'cpanel', label: 'cPanel/WHM' },
  { value: 'plesk', label: 'Plesk' },
  { value: 'directadmin', label: 'DirectAdmin' },
  { value: 'virtualizor', label: 'Virtualizor' },
  { value: 'custom', label: t('products_services.modules.custom') }
]

// Options pour les emails de bienvenue
const welcomeEmailOptions = [
  { value: '', label: t('products_services.welcome_emails.none') },
  { value: 'hosting', label: t('products_services.welcome_emails.hosting') },
  { value: 'general', label: t('products_services.welcome_emails.general') }
]

// Validation du formulaire
const validateForm = () => {
  const formErrors = {} as Record<string, string>
  
  if (!productData.value.name.trim()) {
    formErrors.name = t('products_services.errors.name_required')
  }
  
  if (!productData.value.group_id) {
    formErrors.group_id = t('products_services.errors.group_required')
  }
  
  errors.value = formErrors
  return Object.keys(formErrors).length === 0
}

// Continuer vers l'étape suivante
const continueToNextStep = () => {
  if (validateForm()) {
    // Sauvegarder les données dans localStorage
    localStorage.setItem('currentProductData', JSON.stringify(productData.value))
    
    // Naviguer vers la prochaine étape
    const idOrAction = isEditMode.value ? productId.value : 'create'
    router.push({
      name: 'product-pricing',
      params: { idOrAction }
    })
  }
}

// Rediriger vers le mode édition
const editProduct = () => {
  if (productId.value) {
    router.push(`/products/${productId.value}`)
  }
}

// Retour à la liste des produits
const goBack = () => {
  router.push('/products')
}

// Initialisation
onMounted(async () => {
  // Charger les groupes de produits
  if (productGroupsStore.productGroups.length === 0) {
    await productGroupsStore.fetchProductGroups()
  }
  
  // Si nous sommes en mode édition ou détail d'un produit existant
  if (isEditMode.value || isDetailMode.value) {
    await loadExistingProduct()
  } else {
    // Sinon, si nous avons des données sauvegardées, les récupérer
    if (Object.keys(previousData.value).length > 0) {
      productData.value = { ...productData.value, ...previousData.value }
    }
  }
})
</script>

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

.form-section {
  margin-bottom: var(--spacing-lg);
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10px;
}

.form-row .form-group {
  flex: 1;
  min-width: 250px;
  padding: 0 10px;
  margin-bottom: var(--spacing-md);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--text-color);
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text-color);
  transition: all var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.2);
}

.form-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.form-check {
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.form-check-input {
  margin-top: 0.3rem;
  margin-right: 0.5rem;
}

.form-check-label {
  font-weight: normal;
}

.input-group {
  display: flex;
}

.input-group .form-control {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-group-append {
  display: flex;
}

.input-group-append .btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.color-picker {
  height: 40px;
  padding: 5px;
  width: 100px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--text-color);
}

.advanced-options {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

@media (max-width: 768px) {
  .form-group {
    margin-bottom: var(--spacing-lg);
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .form-col {
    width: 100%;
    padding: 0;
  }
}
</style>
