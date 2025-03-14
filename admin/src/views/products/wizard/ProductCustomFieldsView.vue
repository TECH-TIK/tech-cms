<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notifications'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()

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
  return tab ? tab.id : 'custom_fields'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  // Sauvegarder les données dans localStorage
  localStorage.setItem('customFieldsData', JSON.stringify(customFieldsData.value))
  
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

// État
const loading = ref(false)
const errors = ref({})
const showAddFieldForm = ref(false)
const editingField = ref(null as number | null)

// Données des champs personnalisés
const customFieldsData = ref({
  fields: [] as Array<{
    id: number;
    name: string;
    type: string;
    description: string;
    required: boolean;
    adminOnly: boolean;
    showOnOrder: boolean;
    showOnInvoice: boolean;
    validation: string;
    options: string;
  }>
})

// Types de champs disponibles
const fieldTypes = [
  { value: 'text', label: t('products_services.custom_fields.types.text') },
  { value: 'password', label: t('products_services.custom_fields.types.password') },
  { value: 'textarea', label: t('products_services.custom_fields.types.textarea') },
  { value: 'dropdown', label: t('products_services.custom_fields.types.dropdown') },
  { value: 'radio', label: t('products_services.custom_fields.types.radio') },
  { value: 'checkbox', label: t('products_services.custom_fields.types.checkbox') },
  { value: 'date', label: t('products_services.custom_fields.types.date') }
]

// Nouveau champ personnalisé
const newField = ref({
  name: '',
  type: 'text',
  description: '',
  required: false,
  adminOnly: false,
  showOnOrder: true,
  showOnInvoice: true,
  validation: '',
  options: ''
})

// Réinitialiser le formulaire de nouveau champ
const resetNewField = () => {
  newField.value = {
    name: '',
    type: 'text',
    description: '',
    required: false,
    adminOnly: false,
    showOnOrder: true,
    showOnInvoice: true,
    validation: '',
    options: ''
  }
  showAddFieldForm.value = false
  editingField.value = null
}

// Ajouter ou mettre à jour un champ personnalisé
const saveField = () => {
  const formErrors = {} as Record<string, string>
  
  // Validation
  if (!newField.value.name) {
    formErrors.name = t('products_services.custom_fields.errors.name_required')
  } else if (newField.value.name.length < 3) {
    formErrors.name = t('products_services.custom_fields.errors.name_too_short')
  }
  
  if (['dropdown', 'radio'].includes(newField.value.type) && !newField.value.options) {
    formErrors.options = t('products_services.custom_fields.errors.options_required')
  }
  
  if (Object.keys(formErrors).length > 0) {
    errors.value = formErrors
    return
  }
  
  if (editingField.value !== null) {
    // Mettre à jour un champ existant
    const index = customFieldsData.value.fields.findIndex(f => f.id === editingField.value)
    if (index !== -1) {
      customFieldsData.value.fields[index] = {
        ...customFieldsData.value.fields[index],
        ...newField.value
      }
      
      notificationStore.addNotification({
        type: 'success',
        title: t('products_services.custom_fields.success.field_updated_title'),
        message: t('products_services.custom_fields.success.field_updated_message')
      })
    }
  } else {
    // Ajouter un nouveau champ
    const newId = customFieldsData.value.fields.length > 0 
      ? Math.max(...customFieldsData.value.fields.map(f => f.id)) + 1 
      : 1
      
    customFieldsData.value.fields.push({
      id: newId,
      ...newField.value
    })
    
    notificationStore.addNotification({
      type: 'success',
      title: t('products_services.custom_fields.success.field_added_title'),
      message: t('products_services.custom_fields.success.field_added_message')
    })
  }
  
  resetNewField()
}

// Éditer un champ personnalisé
const editField = (fieldId: number) => {
  const field = customFieldsData.value.fields.find(f => f.id === fieldId)
  if (field) {
    newField.value = { ...field }
    editingField.value = fieldId
    showAddFieldForm.value = true
  }
}

// Supprimer un champ personnalisé
const deleteField = (fieldId: number) => {
  customFieldsData.value.fields = customFieldsData.value.fields.filter(f => f.id !== fieldId)
  
  notificationStore.addNotification({
    type: 'success',
    title: t('products_services.custom_fields.success.field_deleted_title'),
    message: t('products_services.custom_fields.success.field_deleted_message')
  })
}

// Fusionner les données précédentes avec les données des champs personnalisés
onMounted(() => {
  if (previousData.value && previousData.value.customFields) {
    customFieldsData.value.fields = previousData.value.customFields
  }
})

// Validation du formulaire
const validateForm = () => {
  return true // Pas de validation nécessaire pour cette étape
}

// Continuer vers l'étape suivante
const continueToNextStep = () => {
  // Sauvegarder les données
  localStorage.setItem('customFieldsData', JSON.stringify(customFieldsData.value))
  
  // Naviguer vers la prochaine étape
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-configurable-options',
    params: { idOrAction }
  })
}

// Retour à l'étape précédente
const goBack = () => {
  // Sauvegarder les données
  localStorage.setItem('customFieldsData', JSON.stringify(customFieldsData.value))
  
  // Naviguer vers l'étape précédente
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-module',
    params: { idOrAction }
  })
}
</script>

<template>
  <div class="product-custom-fields-view">
    <div class="wizard-content">
      <!-- Liste des champs personnalisés -->
      <div class="custom-fields-list">
        <div class="section-header">
          <h3 class="section-title">{{ t('products_services.custom_fields.list_title') }}</h3>
          <button 
            type="button" 
            class="btn btn-sm btn-primary" 
            @click="showAddFieldForm = true; editingField = null; resetNewField()"
            v-if="!showAddFieldForm"
          >
            <i class="fas fa-plus"></i> {{ t('products_services.custom_fields.add_field') }}
          </button>
        </div>
        
        <!-- Message si aucun champ personnalisé -->
        <div class="empty-state" v-if="customFieldsData.fields.length === 0 && !showAddFieldForm">
          <div class="empty-state-content">
            <i class="fas fa-info-circle"></i>
            <p>{{ t('products_services.custom_fields.no_fields') }}</p>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="showAddFieldForm = true; editingField = null; resetNewField()"
            >
              {{ t('products_services.custom_fields.add_first_field') }}
            </button>
          </div>
        </div>
        
        <!-- Tableau des champs personnalisés -->
        <div class="custom-fields-table" v-if="customFieldsData.fields.length > 0 && !showAddFieldForm">
          <div class="custom-fields-header">
            <span class="field-name">{{ t('products_services.custom_fields.field_name') }}</span>
            <span class="field-type">{{ t('products_services.custom_fields.field_type') }}</span>
            <span class="field-required">{{ t('products_services.custom_fields.required') }}</span>
            <span class="field-actions">{{ t('common.actions') }}</span>
          </div>
          
          <div 
            v-for="field in customFieldsData.fields" 
            :key="field.id" 
            class="custom-field-row"
          >
            <span class="field-name">{{ field.name }}</span>
            <span class="field-type">
              {{ fieldTypes.find(t => t.value === field.type)?.label || field.type }}
            </span>
            <span class="field-required">
              <i v-if="field.required" class="fas fa-check text-success"></i>
              <i v-else class="fas fa-x text-muted"></i>
            </span>
            <span class="field-actions">
              <button 
                type="button"
                class="btn btn-sm btn-icon"
                @click="editField(field.id)"
                title="Modifier"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button 
                type="button"
                class="btn btn-sm btn-icon text-danger"
                @click="deleteField(field.id)"
                title="Supprimer"
              >
                <i class="fas fa-trash"></i>
              </button>
            </span>
          </div>
        </div>
        
        <!-- Formulaire d'ajout/modification de champ personnalisé -->
        <div class="custom-field-form" v-if="showAddFieldForm">
          <h3 class="form-title">
            {{ editingField !== null 
              ? t('products_services.custom_fields.edit_field') 
              : t('products_services.custom_fields.add_field') 
            }}
          </h3>
          
          <div class="form-section">
            <!-- Nom du champ -->
            <div class="form-group">
              <label for="field-name">{{ t('products_services.custom_fields.field_name') }} *</label>
              <input 
                type="text" 
                id="field-name" 
                v-model="newField.name"
                class="form-control"
                :class="{ 'is-invalid': errors.name }"
              />
              <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
            </div>
            
            <!-- Type de champ -->
            <div class="form-group">
              <label for="field-type">{{ t('products_services.custom_fields.field_type') }}</label>
              <select 
                id="field-type" 
                v-model="newField.type"
                class="form-control"
              >
                <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            
            <!-- Description -->
            <div class="form-group">
              <label for="field-description">{{ t('products_services.custom_fields.description') }}</label>
              <textarea 
                id="field-description" 
                v-model="newField.description"
                class="form-control"
                rows="3"
              ></textarea>
            </div>
            
            <!-- Options (pour dropdown/radio) -->
            <div class="form-group" v-if="['dropdown', 'radio'].includes(newField.type)">
              <label for="field-options">{{ t('products_services.custom_fields.options') }} *</label>
              <textarea 
                id="field-options" 
                v-model="newField.options"
                class="form-control"
                rows="3"
                :class="{ 'is-invalid': errors.options }"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              ></textarea>
              <div v-if="errors.options" class="invalid-feedback">{{ errors.options }}</div>
              <small class="form-text text-muted">{{ t('products_services.custom_fields.options_help') }}</small>
            </div>
            
            <!-- Validation -->
            <div class="form-group">
              <label for="field-validation">{{ t('products_services.custom_fields.validation') }}</label>
              <input 
                type="text" 
                id="field-validation" 
                v-model="newField.validation"
                class="form-control"
                placeholder="Ex: numeric|min:1|max:100"
              />
              <small class="form-text text-muted">{{ t('products_services.custom_fields.validation_help') }}</small>
            </div>
            
            <!-- Options -->
            <div class="form-options">
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="field-required" 
                  v-model="newField.required"
                  class="form-check-input"
                />
                <label class="form-check-label" for="field-required">
                  {{ t('products_services.custom_fields.required_field') }}
                </label>
              </div>
              
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="field-admin-only" 
                  v-model="newField.adminOnly"
                  class="form-check-input"
                />
                <label class="form-check-label" for="field-admin-only">
                  {{ t('products_services.custom_fields.admin_only') }}
                </label>
              </div>
              
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="field-show-on-order" 
                  v-model="newField.showOnOrder"
                  class="form-check-input"
                />
                <label class="form-check-label" for="field-show-on-order">
                  {{ t('products_services.custom_fields.show_on_order') }}
                </label>
              </div>
              
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="field-show-on-invoice" 
                  v-model="newField.showOnInvoice"
                  class="form-check-input"
                />
                <label class="form-check-label" for="field-show-on-invoice">
                  {{ t('products_services.custom_fields.show_on_invoice') }}
                </label>
              </div>
            </div>
            
            <!-- Boutons d'action du formulaire -->
            <div class="form-actions">
              <button 
                type="button" 
                class="btn btn-outline-secondary"
                @click="resetNewField"
              >
                {{ t('common.cancel') }}
              </button>
              
              <button 
                type="button" 
                class="btn btn-primary"
                @click="saveField"
              >
                {{ editingField !== null 
                  ? t('common.update') 
                  : t('common.save') 
                }}
              </button>
            </div>
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
      
      <button 
        type="button" 
        class="btn btn-primary"
        @click="continueToNextStep"
        :disabled="loading"
      >
        {{ t('common.continue') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/css/components/common-layout.css';
@import '@/assets/styles/wizard-tabs.css';

.wizard-content {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--glass-border);
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

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: linear-gradient(to right, var(--primary-blue), var(--secondary-blue));
  border: none;
  color: white;
}

.btn-outline-secondary {
  background: transparent;
  border: 1px solid var(--text-muted);
  color: var(--text-muted);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-outline-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-fields-list {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.empty-state {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  margin: var(--spacing-lg) 0;
  text-align: center;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state-content i {
  font-size: 2.5rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
}

.empty-state-content p {
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
}

.custom-fields-table {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xl);
}

.custom-fields-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.05);
  border-top-left-radius: var(--radius-md);
  border-top-right-radius: var(--radius-md);
  font-weight: 600;
  color: var(--text-color);
}

.custom-field-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
}

.custom-field-row:last-child {
  border-bottom: none;
}

.field-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--text-color);
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-icon.text-danger {
  color: var(--error);
}

.btn-icon.text-danger:hover {
  background: rgba(255, 59, 48, 0.1);
}

.text-success {
  color: var(--success);
}

.text-muted {
  color: var(--text-muted);
}

.custom-field-form {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.form-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--text-color);
}

.form-section {
  margin-bottom: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
  color: var(--text-color);
}

.form-control {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-color);
  padding: 0.75rem 1rem;
  width: 100%;
  transition: all var(--transition-fast);
}

.form-control:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 195, 255, 0.25);
}

.form-control.is-invalid {
  border-color: var(--error);
}

.invalid-feedback {
  color: var(--error);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.form-text {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--glass-border);
}

.form-check {
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.form-check-input {
  margin-right: var(--spacing-sm);
  margin-top: 0.2rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
}

@media (max-width: 768px) {
  .custom-fields-header,
  .custom-field-row {
    grid-template-columns: 2fr 1fr 1fr;
  }
  
  .field-type {
    display: none;
  }
  
  .form-options {
    grid-template-columns: 1fr;
  }
}
</style>
