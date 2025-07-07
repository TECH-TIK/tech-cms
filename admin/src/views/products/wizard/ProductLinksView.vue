<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notifications'
import { useProductWizardStore } from '@/stores/product-wizard'

const { t } = useI18n()
const notificationStore = useNotificationStore()
const productWizardStore = useProductWizardStore()







// États locaux pour les liens - initialisés depuis le store Pinia
const linksData = ref({
  directLinks: {
    cartLink: productWizardStore.productData.links?.directLinks?.cartLink || '',
    cartLinkWithTemplate: productWizardStore.productData.links?.directLinks?.cartLinkWithTemplate || '',
    cartLinkWithDomain: productWizardStore.productData.links?.directLinks?.cartLinkWithDomain || '',
    groupLink: productWizardStore.productData.links?.directLinks?.groupLink || ''
  },
  productLinks: productWizardStore.productData.links?.productLinks || [] as Array<{ url: string, visits: number }>
})


// Gestion des formulaires
const updateDirectLink = (type: 'cartLink' | 'cartLinkWithTemplate' | 'cartLinkWithDomain' | 'groupLink', value: string): void => {
  linksData.value.directLinks[type] = value
}

// Ajouter un lien de produit
const addProductLink = (): void => {
  linksData.value.productLinks.push({ url: '', visits: 0 })
}

// Mettre à jour un lien de produit
const updateProductLink = (index: number, url: string): void => {
  linksData.value.productLinks[index].url = url
}

// Supprimer un lien de produit
const removeProductLink = (index: number): void => {
  linksData.value.productLinks.splice(index, 1)
  notificationStore.addNotification({
    type: 'success',
    title: t('products_services.links.success.link_removed_title'),
    message: t('products_services.links.success.link_removed_message')
  })
}




// Initialisation
onMounted(() => {
  // Si aucun lien de produit n'est défini, en ajouter un vide par défaut
  if (linksData.value.productLinks.length === 0) {
    addProductLink()
  }
  
  // Définir l'étape courante
  productWizardStore.currentStep = 'links';
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
                id="cart-link" 
                type="text" 
                class="form-control" 
                :value="linksData.directLinks.cartLink"
                :placeholder="t('products_services.links.direct_cart_link_placeholder')"
                @input="e => updateDirectLink('cartLink', (e.target as HTMLInputElement).value)"
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
                id="cart-link-template" 
                type="text" 
                class="form-control" 
                :value="linksData.directLinks.cartLinkWithTemplate"
                :placeholder="t('products_services.links.direct_cart_link_template_placeholder')"
                @input="e => updateDirectLink('cartLinkWithTemplate', (e.target as HTMLInputElement).value)"
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
                id="cart-link-domain" 
                type="text" 
                class="form-control" 
                :value="linksData.directLinks.cartLinkWithDomain"
                :placeholder="t('products_services.links.direct_cart_link_domain_placeholder')"
                @input="e => updateDirectLink('cartLinkWithDomain', (e.target as HTMLInputElement).value)"
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
                id="group-link" 
                type="text" 
                class="form-control" 
                :value="linksData.directLinks.groupLink"
                :placeholder="t('products_services.links.group_cart_link_placeholder')"
                @input="e => updateDirectLink('groupLink', (e.target as HTMLInputElement).value)"
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
                    :placeholder="t('products_services.links.url_placeholder')"
                    @input="e => updateProductLink(index, (e.target as HTMLInputElement).value)"
                  />
                </td>
                <td class="text-center visits-column">{{ link.visits }}</td>
                <td class="text-center actions-column">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-danger"
                    :disabled="linksData.productLinks.length === 1"
                    @click="removeProductLink(index)"
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
  box-shadow: 0 0 0 0.2rem rgb(var(--primary-blue-rgb), 0.25);
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
@media (width <= 768px) {
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
