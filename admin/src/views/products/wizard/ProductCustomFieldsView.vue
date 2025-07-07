<template>
  <div>
    <p class="section-description">
      {{ t('products_services.custom_fields.description') }}
    </p>

    <div v-if="loading" class="text-center" style="padding: var(--spacing-xl)">
      <div class="spinner-loading" style="margin: 0 auto;"></div>
    </div>

    <div v-else>
      <div v-if="customFields.length > 0" class="custom-fields-list">
        <div v-for="field in customFields" :key="field.id" class="custom-field-item">
          <div class="custom-field-header">
            <h4 class="custom-field-name">{{ field.name }}</h4>
            <div class="custom-field-actions">
              <button class="btn-icon edit" @click="editField(field)">
                <i class="fas fa-pencil-alt"></i>
              </button>
              <button class="btn-icon delete" @click="deleteField(field)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="custom-field-details">
            <div class="custom-field-detail">
              <span class="detail-label">{{ t('products_services.custom_fields.type') }}</span>
              <span class="detail-value">{{ getFieldTypeName(field.type) }}</span>
            </div>
            <div class="custom-field-detail">
              <span class="detail-label">{{ t('products_services.custom_fields.required') }}</span>
              <span class="detail-value">{{ field.required ? t('common.yes') : t('common.no') }}</span>
            </div>
            <div class="custom-field-detail">
              <span class="detail-label">{{ t('products_services.custom_fields.description') }}</span>
              <span class="detail-value">{{ field.description || t('common.none') }}</span>
            </div>
            <div v-if="hasOptions(field.type)" class="custom-field-detail">
              <span class="detail-label">{{ t('products_services.custom_fields.options') }}</span>
              <span class="detail-value">{{ field.options ? field.options.join(', ') : t('common.none') }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-clipboard-list"></i>
        </div>
        <h4>{{ t('products_services.custom_fields.no_fields') }}</h4>
        <p>{{ t('products_services.custom_fields.no_fields_description') }}</p>
      </div>
      
      <div class="fields-footer">
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="showAddField = true"
        >
          <i class="fas fa-plus"></i>
          {{ t('products_services.custom_fields.add_field') }}
        </button>
      </div>
      
      <div class="actions-container">
        <button type="button" class="btn btn-primary" :disabled="loading" @click="saveData">
          {{ t('common.save') }}
        </button>

        <button type="button" class="btn btn-secondary" @click="emit('cancel')">
          {{ t('common.cancel') }}
        </button>
      </div>
      
      <!-- Modal d'ajout/édition de champ personnalisé -->
      <div v-if="showAddField" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>
              {{ editingField ? t('products_services.custom_fields.edit_field') : t('products_services.custom_fields.add_field') }}
            </h3>
            <button class="close-button" @click="closeFieldModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="saveField">
              <div class="form-group">
                <label class="form-label">{{ t('products_services.custom_fields.field_name') }} *</label>
                <input v-model="newField.name" type="text" class="form-control" :placeholder="t('products_services.custom_fields.field_name_placeholder')" required />
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('products_services.custom_fields.field_type') }} *</label>
                <select v-model="newField.type" class="form-select">
                  <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
                    {{ type.name }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('products_services.custom_fields.field_description') }}</label>
                <textarea v-model="newField.description" class="form-control" rows="3" :placeholder="t('products_services.custom_fields.field_description_placeholder')"></textarea>
              </div>
              
              <div class="form-group form-checkbox">
                <input 
                  id="field-required" 
                  v-model="newField.required" 
                  type="checkbox" 
                  class="form-checkbox-input" 
                />
                <label for="field-required" class="form-checkbox-label">
                  {{ t('products_services.custom_fields.field_required') }}
                </label>
              </div>
              
              <div v-if="hasOptions(newField.type)" class="form-group">
                <label class="form-label">{{ t('products_services.custom_fields.field_options') }} *</label>
                <div class="options-list">
                  <div v-for="(_, index) in newField.options" :key="index" class="option-item">
                    <input
                      v-model="newField.options[index]"
                      type="text"
                      class="form-control"
                      :placeholder="t('products_services.custom_fields.option_placeholder')"
                    />
                    <button 
                      type="button" 
                      class="btn btn-danger btn-sm" 
                      @click="removeOption(index)"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <button 
                  type="button" 
                  class="btn btn-outline-primary" 
                  @click="addOption"
                >
                  {{ t('products_services.custom_fields.add_option') }}
                </button>
              </div>
              
              <div v-if="newField.type === 'text'" class="form-group">
                <label class="form-label">{{ t('products_services.custom_fields.validation_regex') }}</label>
                <input 
                  v-model="newField.validation" 
                  type="text" 
                  class="form-control" 
                  :placeholder="t('products_services.custom_fields.validation_placeholder')"
                />
                <p class="form-hint">{{ t('products_services.custom_fields.validation_hint') }}</p>
              </div>
              
              <div class="form-group form-checkbox">
                <input 
                  id="field-admin-only" 
                  v-model="newField.admin_only" 
                  type="checkbox" 
                  class="form-checkbox-input" 
                />
                <label for="field-admin-only" class="form-checkbox-label">
                  {{ t('products_services.custom_fields.field_admin_only') }}
                </label>
              </div>
              
              <div class="modal-footer">
                <button 
                  type="button" 
                  class="btn btn-secondary" 
                  @click="closeFieldModal"
                >
                  {{ t('common.cancel') }}
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary"
                >
                  {{ t('common.save') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useProductWizardStore } from '@/stores/product-wizard'
import { useProductStore } from '@/stores/products'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'
import { Product } from '@/types/product'

// Définition des événements émis par le composant
const emit = defineEmits<{
  'cancel': []  // Événement déclenché lors de l'annulation
}>()

// Interface pour les champs personnalisés
interface CustomFieldOption {
  name: string
  value: string
}

interface CustomField {
  id?: number | string
  name: string
  type: string
  description: string
  required: boolean
  admin_only: boolean
  validation: string
  options: string[] | CustomFieldOption[]
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()
const productWizardStore = useProductWizardStore()

// État local
const loading = ref(false)
const customFields = ref<CustomField[]>([])
const showAddField = ref(false)
const editingField = ref<CustomField | null>(null)
const newField = ref<CustomField>({
  name: '',
  type: 'text',
  description: '',
  required: false,
  admin_only: false,
  validation: '',
  options: [] as string[]
})

// Navigation
const nextPage = ref<string | null>(null)

const productId = computed(() => route.params.idOrAction as string)
const isEditMode = computed(() => !isNaN(parseInt(productId.value)))

// Types de champs disponibles
const fieldTypes = [
  { name: t('products_services.custom_fields.type_text'), value: 'text' },
  { name: t('products_services.custom_fields.type_textarea'), value: 'textarea' },
  { name: t('products_services.custom_fields.type_dropdown'), value: 'dropdown' },
  { name: t('products_services.custom_fields.type_radio'), value: 'radio' },
  { name: t('products_services.custom_fields.type_checkbox'), value: 'checkbox' },
  { name: t('products_services.custom_fields.type_date'), value: 'date' },
  { name: t('products_services.custom_fields.type_password'), value: 'password' }
]

// Vérifier si un type de champ a des options
const hasOptions = (type: string): boolean => {
  return ['dropdown', 'radio', 'checkbox'].includes(type)
}

// Obtenir le nom du type de champ
const getFieldTypeName = (type: string): string => {
  const fieldType = fieldTypes.find(t => t.value === type)
  return fieldType ? fieldType.name : type
}

// Ajouter une option
const addOption = (): void => {
  (newField.value.options as string[]).push('')
}

// Supprimer une option
const removeOption = (index: number): void => {
  (newField.value.options as string[]).splice(index, 1)
}

// Éditer un champ existant
const editField = (field: CustomField): void => {
  editingField.value = field
  newField.value = JSON.parse(JSON.stringify(field))
  showAddField.value = true
}

// Supprimer un champ
const deleteField = (field: CustomField): void => {
  if (confirm(t('products_services.custom_fields.delete_confirm'))) {
    const index = customFields.value.findIndex(f => f.id === field.id)
    if (index !== -1) {
      customFields.value.splice(index, 1)
    }
  }
}

// Sauvegarder le champ
const saveField = () => {
  // Validation de base
  if (!newField.value.name) {
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.custom_fields.name_required')
    })
    return
  }
  
  if (hasOptions(newField.value.type) && (!newField.value.options || newField.value.options.length === 0)) {
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.custom_fields.options_required')
    })
    return
  }
  
  // Créer une copie du champ
  const fieldToSave = JSON.parse(JSON.stringify(newField.value))
  
  // Si c'est un nouveau champ, générer un ID
  if (fieldToSave.id === undefined) {
    fieldToSave.id = Date.now()
  }
  
  // Mise à jour ou ajout du champ
  if (editingField.value) {
    const index = customFields.value.findIndex(f => f.id === fieldToSave.id)
    if (index !== -1) {
      customFields.value[index] = fieldToSave
    }
  } else {
    customFields.value.push(fieldToSave as CustomField)
  }
  
  // Fermer le modal
  closeFieldModal()
}

// Fermer le modal de champ
const closeFieldModal = () => {
  newField.value = {
    name: '',
    type: 'text',
    description: '',
    required: false,
    admin_only: false,
    validation: '',
    options: []
  }
  editingField.value = null
  showAddField.value = false
}

// Charger les données initiales
const loadData = async () => {
  loading.value = true
  
  try {
    // Si nous sommes en mode édition et que les données ne sont pas chargées,
    // nous devons les récupérer
    if (isEditMode.value) {
      // Importer le ProductStore
      const productStore = useProductStore();
      // Récupérer les détails du produit depuis le productStore
      const productDetails = await productStore.fetchProduct(productId.value);
      // Mettre à jour les données dans le wizard
      productWizardStore.setProductData(productDetails);
    }
    
    // Initialiser les champs personnalisés à partir du store
    if (productWizardStore.productData.custom_fields) {
      const storeFields = productWizardStore.productData.custom_fields;
      // S'assurer que les champs sont du bon format
      customFields.value = Array.isArray(storeFields) ? storeFields as CustomField[] : []
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des données des champs personnalisés', { error });
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.error_loading_data')
    })
  } finally {
    loading.value = false
  }
}

// Sauvegarder les modifications du produit dans le ProductStore
const saveProductChanges = async (): Promise<void> => {
  // Importer le ProductStore
  const productStore = useProductStore()
  
  // Récupérer le produit actuel
  const product = await productStore.fetchProduct(productId.value)
  
  // Vérifier si le produit existe
  if (product) {
    // Mettre à jour les champs personnalisés
    const updatedProduct: Partial<Product> = {
      custom_fields: customFields.value
    }
  
    // Sauvegarder le produit
    await productStore.updateProduct(product.id, updatedProduct)
  }
}

// Sauvegarder les champs personnalisés
const saveData = async (): Promise<void> => {
  loading.value = true

  try {
    // Sauvegarder les champs personnalisés dans le store
    productWizardStore.setProductData({
      custom_fields: customFields.value
    })

    // Si nous sommes en mode édition, sauvegarder dans le ProductStore
    if (isEditMode.value && productId.value) {
      await saveProductChanges()
    }

    // Notification de succès
    notificationStore.showNotification({
      type: 'success',
      title: t('common.success'),
      message: t('products_services.custom_fields.saved_success')
    })

    // Si on a indiqué une fonction à exécuter après la sauvegarde, l'exécuter
    if (nextPage.value) {
      router.push(nextPage.value)
    }
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde des champs personnalisés', { error })
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.error_saving_data')
    })
  } finally {
    loading.value = false
  }
}

// Fonction pour mettre à jour la configuration du wizard
function setConfig() {
  const config = {
    steps: [
      { name: 'details', label: t('products_services.wizard.steps.details'), completed: true },
      { name: 'pricing', label: t('products_services.wizard.steps.pricing'), completed: true },
      { name: 'custom_fields', label: t('products_services.wizard.steps.custom_fields'), completed: false, current: true },
      { name: 'configurable_options', label: t('products_services.wizard.steps.configurable_options'), completed: false },
      { name: 'upgrades', label: t('products_services.wizard.steps.upgrades'), completed: false },
      { name: 'cross_sells', label: t('products_services.wizard.steps.cross_sells'), completed: false },
      { name: 'links', label: t('products_services.wizard.steps.links'), completed: false }
    ],
    exitUrl: '/products-services'
  };
  
  productWizardStore.setWizardConfig(config);
}

// Hook de cycle de vie - Au montage du composant
onMounted(() => {
  // Mise à jour de la configuration du wizard
  setConfig()
  
  // Charger les données initiales
  loadData()
})

// Exposer les fonctions nécessaires au template
defineExpose({
  saveData
})
</script>

<style scoped>
@import '@/assets/css/pages/products/product-custom-fields.css';
</style>