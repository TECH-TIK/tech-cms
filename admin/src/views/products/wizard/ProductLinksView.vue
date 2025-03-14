<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notifications'
import { useProductStore } from '@/stores/products'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()
const productStore = useProductStore()

// Récupérer le type de produit et les données précédentes
const productType = computed(() => route.params.type as string || 'shared_hosting')
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

// Déterminer si nous sommes en mode édition
const productId = computed(() => {
  const idOrAction = route.params.idOrAction as string
  if (idOrAction && idOrAction !== 'create') {
    return parseInt(idOrAction, 10)
  }
  return null
})

const isEditMode = computed(() => !!productId.value)

// Définition des onglets
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
  return tab ? tab.id : 'links'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  // Sauvegarder les données dans localStorage
  localStorage.setItem('linksData', JSON.stringify(linksData.value))
  
  if (tab.id === 'type') {
    // Si nous sommes en mode édition, rediriger vers la page d'édition du produit
    if (isEditMode.value) {
      router.push({ path: `/products/${productId.value}` })
    } else {
      // Sinon, rediriger vers la création de produit
      router.push({ name: 'create-product' })
    }
  } else {
    const idOrAction = isEditMode.value ? productId.value : 'create'
    router.push({
      name: tab.route,
      params: { idOrAction }
    })
  }
}

// États locaux pour les liens
const linksData = ref({
  directLinks: {
    cartLink: '',
    cartLinkWithTemplate: '',
    cartLinkWithDomain: '',
    groupLink: ''
  },
  productLinks: [] as Array<{ url: string, visits: number }>
})

const loading = ref(false)
const submitting = ref(false)

// Gestion des formulaires
const updateDirectLink = (type, value) => {
  linksData.value.directLinks[type] = value
}

// Ajouter un lien de produit
const addProductLink = () => {
  linksData.value.productLinks.push({ url: '', visits: 0 })
}

// Mettre à jour un lien de produit
const updateProductLink = (index, url) => {
  linksData.value.productLinks[index].url = url
}

// Supprimer un lien de produit
const removeProductLink = (index) => {
  linksData.value.productLinks.splice(index, 1)
  notificationStore.addNotification({
    type: 'success',
    title: t('products_services.links.success.link_removed_title'),
    message: t('products_services.links.success.link_removed_message')
  })
}

// Enregistrer le produit et terminer
const saveProduct = async () => {
  try {
    submitting.value = true
    
    // Sauvegarder les données
    localStorage.setItem('linksData', JSON.stringify(linksData.value))
    
    // Message de succès
    notificationStore.showNotification({
      title: t('products_services.success.save'),
      message: isEditMode.value
        ? t('products_services.success.update_message')
        : t('products_services.success.create_message'),
      type: 'success'
    })
    
    // Rediriger vers la liste des produits
    router.push({ name: 'products' })
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du produit:', error)
    notificationStore.showNotification({
      title: t('products_services.errors.save'),
      message: t('products_services.errors.save_message'),
      type: 'error'
    })
  } finally {
    submitting.value = false
  }
}

// Retour à l'étape précédente
const goBack = () => {
  // Sauvegarder les données
  localStorage.setItem('linksData', JSON.stringify(linksData.value))
  
  // Naviguer vers l'étape précédente
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-other',
    params: { idOrAction }
  })
}

// Initialiser avec les données précédentes, si disponibles
onMounted(() => {
  if (previousData.value && previousData.value.links) {
    linksData.value = previousData.value.links
  }
  
  // Si aucun lien de produit n'est défini, en ajouter un vide par défaut
  if (linksData.value.productLinks.length === 0) {
    addProductLink()
  }
})
</script>

<template>
  <div class="product-links-view">
    <div class="wizard-content">
      <div class="direct-links-section">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.links.direct_links_title') }}</h3>
        </div>
        
        <div class="form-options-container">
          <div class="form-group">
            <label for="cart-link">{{ t('products_services.links.direct_cart_link') }}</label>
            <div class="input-group">
              <input 
                type="text" 
                id="cart-link" 
                class="form-control" 
                :value="linksData.directLinks.cartLink"
                @input="e => updateDirectLink('cartLink', e.target.value)"
                :placeholder="t('products_services.links.direct_cart_link_placeholder')"
              />
              <div class="input-group-append">
                <button type="button" class="btn btn-outline-secondary">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="cart-link-template">{{ t('products_services.links.direct_cart_link_template') }}</label>
            <div class="input-group">
              <input 
                type="text" 
                id="cart-link-template" 
                class="form-control" 
                :value="linksData.directLinks.cartLinkWithTemplate"
                @input="e => updateDirectLink('cartLinkWithTemplate', e.target.value)"
                :placeholder="t('products_services.links.direct_cart_link_template_placeholder')"
              />
              <div class="input-group-append">
                <button type="button" class="btn btn-outline-secondary">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="cart-link-domain">{{ t('products_services.links.direct_cart_link_domain') }}</label>
            <div class="input-group">
              <input 
                type="text" 
                id="cart-link-domain" 
                class="form-control" 
                :value="linksData.directLinks.cartLinkWithDomain"
                @input="e => updateDirectLink('cartLinkWithDomain', e.target.value)"
                :placeholder="t('products_services.links.direct_cart_link_domain_placeholder')"
              />
              <div class="input-group-append">
                <button type="button" class="btn btn-outline-secondary">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="group-link">{{ t('products_services.links.group_cart_link') }}</label>
            <div class="input-group">
              <input 
                type="text" 
                id="group-link" 
                class="form-control" 
                :value="linksData.directLinks.groupLink"
                @input="e => updateDirectLink('groupLink', e.target.value)"
                :placeholder="t('products_services.links.group_cart_link_placeholder')"
              />
              <div class="input-group-append">
                <button type="button" class="btn btn-outline-secondary">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="product-links-section">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.links.product_links_title') }}</h3>
          <button 
            type="button" 
            class="btn btn-sm btn-outline-primary add-link-btn"
            @click="addProductLink"
          >
            <i class="fas fa-plus"></i>
            {{ t('products_services.links.add_link') }}
          </button>
        </div>
        
        <div class="product-links-table">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('products_services.links.url') }}</th>
                <th class="text-center visits-column">{{ t('products_services.links.visits') }}</th>
                <th class="text-center actions-column">{{ t('products_services.links.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(link, index) in linksData.productLinks" :key="index">
                <td>
                  <input 
                    type="text" 
                    class="form-control" 
                    :value="link.url"
                    @input="e => updateProductLink(index, e.target.value)"
                    :placeholder="t('products_services.links.url_placeholder')"
                  />
                </td>
                <td class="text-center visits-column">{{ link.visits }}</td>
                <td class="text-center actions-column">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-danger"
                    @click="removeProductLink(index)"
                    :disabled="linksData.productLinks.length === 1"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="wizard-actions">
      <button 
        type="button" 
        class="btn btn-outline-secondary"
        @click="goBack"
        :disabled="submitting"
      >
        {{ t('common.back') }}
      </button>
      
      <div class="action-buttons">
        <button 
          type="button" 
          class="btn btn-success"
          @click="saveProduct"
          :disabled="submitting"
        >
          <span v-if="submitting">{{ t('common.saving') }}...</span>
          <span v-else>{{ t('common.save') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/css/components/common-layout.css';
@import '@/assets/styles/wizard-tabs.css';

.product-links-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
}

.wizard-content {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: var(--spacing-md);
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.form-options-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--glass-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.form-group {
  flex: 1;
  min-width: 200px;
  margin-bottom: var(--spacing-md);
}

.card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.card-header {
  padding: var(--spacing-md);
  background: var(--glass-bg-tertiary);
  border-bottom: 1px solid var(--glass-border);
  border-top-left-radius: var(--radius-md);
  border-top-right-radius: var(--radius-md);
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-body {
  padding: var(--spacing-md);
}

.download-links-table {
  width: 100%;
  border-collapse: collapse;
}

.download-links-table th,
.download-links-table td {
  padding: var(--spacing-sm);
  text-align: left;
  border-bottom: 1px solid var(--glass-border);
}

.download-links-table th {
  font-weight: 600;
  color: var(--text-color);
}

.download-links-table td {
  color: var(--text-color-secondary);
}

.download-links-table tr:last-child td {
  border-bottom: none;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-color);
  background: var(--input-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.form-control:focus {
  border-color: var(--primary-blue);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(var(--primary-blue-rgb), 0.25);
}

select.form-control {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='4' viewBox='0 0 8 4'%3E%3Cpath fill='%23ffffff' d='M0 0l4 4 4-4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 8px 4px;
  padding-right: 2rem;
}

.input-group {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  width: 100%;
}

.input-group > .form-control {
  position: relative;
  flex: 1 1 auto;
  width: 1%;
  min-width: 0;
}

.input-group-append {
  display: flex;
  margin-left: -1px;
}

.input-group-text {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-color);
  text-align: center;
  white-space: nowrap;
  background: var(--glass-bg-tertiary);
  border: 1px solid var(--glass-border);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-primary {
  color: #fff;
  background: var(--primary-blue);
  border: 1px solid var(--primary-blue);
}

.btn-primary:hover {
  background: var(--primary-blue-dark);
  border-color: var(--primary-blue-dark);
}

.btn-outline-secondary {
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  background: transparent;
}

.btn-outline-secondary:hover {
  background: var(--hover-bg);
  color: var(--text-color);
}

.btn-danger {
  color: #fff;
  background: var(--danger);
  border: 1px solid var(--danger);
}

.btn-danger:hover {
  background: var(--danger-dark);
  border-color: var(--danger-dark);
}

.btn-success {
  color: #fff;
  background: var(--success);
  border: 1px solid var(--success);
}

.btn-success:hover {
  background: var(--success-dark);
  border-color: var(--success-dark);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-group label {
  display: inline-block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--text-color);
}

.form-text {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: 0.875rem;
  color: var(--text-muted);
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
}

/* Style responsive */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .form-group {
    width: 100%;
  }
  
  .wizard-actions {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .wizard-actions button {
    width: 100%;
  }
}
</style>
