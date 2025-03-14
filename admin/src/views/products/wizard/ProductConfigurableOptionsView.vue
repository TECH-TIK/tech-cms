<template>
  <div class="product-configurable-options-view">
    <div class="wizard-content">
      <div class="section-header">
        <h3 class="section-title">{{ t('products_services.configurable_options.title') }}</h3>
        <button 
          v-if="!showAddOptionForm" 
          type="button" 
          class="btn btn-primary"
          @click="showAddOptionForm = true"
        >
          <i class="fas fa-plus"></i> {{ t('products_services.configurable_options.add_option') }}
        </button>
      </div>

      <p class="section-description">
        {{ t('products_services.configurable_options.description') }}
      </p>

      <!-- Formulaire d'ajout/édition d'option -->
      <div v-if="showAddOptionForm" class="custom-field-form">
        <h4 class="form-title">
          {{ editingOption !== null 
            ? t('products_services.configurable_options.edit_option') 
            : t('products_services.configurable_options.new_option') 
          }}
        </h4>

        <div class="form-section">
          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="option-name">{{ t('products_services.configurable_options.fields.name') }}</label>
              <input
                id="option-name"
                v-model="newOption.name"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.name }"
              />
              <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
            </div>

            <div class="form-group col-md-6">
              <label for="option-type">{{ t('products_services.configurable_options.fields.type') }}</label>
              <select
                id="option-type"
                v-model="newOption.type"
                class="form-control"
              >
                <option 
                  v-for="type in optionTypes" 
                  :key="type.value" 
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="option-group">{{ t('products_services.configurable_options.fields.option_group') }}</label>
              <select
                id="option-group"
                v-model="newOption.optionGroup"
                class="form-control"
              >
                <option :value="null">{{ t('products_services.configurable_options.no_group') }}</option>
                <option 
                  v-for="group in optionGroups" 
                  :key="group.id" 
                  :value="group.id"
                >
                  {{ group.name }}
                </option>
              </select>
            </div>

            <div class="form-group col-md-6">
              <label for="option-description">{{ t('products_services.configurable_options.fields.description') }}</label>
              <input
                id="option-description"
                v-model="newOption.description"
                type="text"
                class="form-control"
              />
              <div class="form-text">
                {{ t('products_services.configurable_options.fields.description_help') }}
              </div>
            </div>
          </div>

          <div class="form-check">
            <input
              id="option-required"
              v-model="newOption.required"
              type="checkbox"
              class="form-check-input"
            />
            <label class="form-check-label" for="option-required">
              {{ t('products_services.configurable_options.fields.required') }}
            </label>
          </div>
        </div>

        <!-- Section pour les éléments d'option (dropdown, radio, checkbox) -->
        <div 
          v-if="['dropdown', 'radio', 'checkbox'].includes(newOption.type)"
          class="form-section option-items"
        >
          <h5>{{ t('products_services.configurable_options.option_items') }}</h5>

          <div v-if="errors.items" class="invalid-feedback d-block mb-3">{{ errors.items }}</div>

          <!-- Tableau des éléments existants -->
          <div v-if="newOption.items.length > 0" class="option-items-table">
            <div class="option-items-header">
              <div>{{ t('products_services.configurable_options.fields.item_name') }}</div>
              <div>{{ t('products_services.configurable_options.fields.price') }}</div>
              <div>{{ t('products_services.configurable_options.fields.setup_fee') }}</div>
              <div>{{ t('products_services.configurable_options.fields.default') }}</div>
              <div>{{ t('common.actions') }}</div>
            </div>

            <div 
              v-for="item in newOption.items" 
              :key="item.id" 
              class="option-item-row"
            >
              <div>{{ item.name }}</div>
              <div>{{ item.price }}</div>
              <div>{{ item.setupFee }}</div>
              <div>
                <button 
                  class="btn btn-icon" 
                  :class="{ 'text-success': item.isDefault }"
                  @click="setItemAsDefault(item.id)"
                  type="button"
                >
                  <i class="fas" :class="item.isDefault ? 'fa-check-circle' : 'fa-circle'"></i>
                </button>
              </div>
              <div class="field-actions">
                <button 
                  class="btn btn-icon text-danger" 
                  @click="removeItemFromOption(item.id)"
                  type="button"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Formulaire d'ajout d'élément -->
          <div class="option-item-form">
            <div class="form-row">
              <div class="form-group col-md-4">
                <label for="item-name">{{ t('products_services.configurable_options.fields.item_name') }}</label>
                <input
                  id="item-name"
                  v-model="newItem.name"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.item }"
                />
                <div v-if="errors.item" class="invalid-feedback">{{ errors.item }}</div>
              </div>

              <div class="form-group col-md-3">
                <label for="item-price">{{ t('products_services.configurable_options.fields.price') }}</label>
                <input
                  id="item-price"
                  v-model.number="newItem.price"
                  type="number"
                  step="0.01"
                  min="0"
                  class="form-control"
                />
              </div>

              <div class="form-group col-md-3">
                <label for="item-setup-fee">{{ t('products_services.configurable_options.fields.setup_fee') }}</label>
                <input
                  id="item-setup-fee"
                  v-model.number="newItem.setupFee"
                  type="number"
                  step="0.01"
                  min="0"
                  class="form-control"
                />
              </div>

              <div class="form-group col-md-2 d-flex align-items-end">
                <button 
                  class="btn btn-primary btn-sm w-100"
                  @click="addItemToOption"
                  type="button"
                >
                  <i class="fas fa-plus"></i> {{ t('common.add') }}
                </button>
              </div>
            </div>

            <div class="form-check">
              <input
                id="item-default"
                v-model="newItem.isDefault"
                type="checkbox"
                class="form-check-input"
              />
              <label class="form-check-label" for="item-default">
                {{ t('products_services.configurable_options.fields.set_as_default') }}
              </label>
            </div>
          </div>
        </div>

        <!-- Options pour le type Quantity -->
        <div v-if="newOption.type === 'quantity'" class="form-section">
          <h5>{{ t('products_services.configurable_options.quantity_options') }}</h5>
          
          <div class="form-row">
            <div class="form-group col-md-3">
              <label for="min-quantity">{{ t('products_services.configurable_options.fields.min_quantity') }}</label>
              <input
                id="min-quantity"
                type="number"
                min="0"
                class="form-control"
              />
            </div>
            
            <div class="form-group col-md-3">
              <label for="max-quantity">{{ t('products_services.configurable_options.fields.max_quantity') }}</label>
              <input
                id="max-quantity"
                type="number"
                min="0"
                class="form-control"
              />
            </div>
            
            <div class="form-group col-md-3">
              <label for="quantity-price">{{ t('products_services.configurable_options.fields.price_per_unit') }}</label>
              <input
                id="quantity-price"
                type="number"
                step="0.01"
                min="0"
                class="form-control"
              />
            </div>
            
            <div class="form-group col-md-3">
              <label for="quantity-setup-fee">{{ t('products_services.configurable_options.fields.setup_fee') }}</label>
              <input
                id="quantity-setup-fee"
                type="number"
                step="0.01"
                min="0"
                class="form-control"
              />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            class="btn btn-outline-secondary" 
            @click="resetNewOption"
            type="button"
          >
            {{ t('common.cancel') }}
          </button>
          <button 
            class="btn btn-primary" 
            @click="saveOption"
            type="button"
          >
            {{ editingOption !== null ? t('common.update') : t('common.add') }}
          </button>
        </div>
      </div>

      <!-- Liste des options configurables -->
      <div v-else>
        <div v-if="configurableOptionsData.options.length === 0" class="empty-state">
          <div class="empty-state-content">
            <i class="fas fa-sliders-h"></i>
            <p>{{ t('products_services.configurable_options.empty_state') }}</p>
            <button 
              class="btn btn-primary btn-sm" 
              @click="showAddOptionForm = true"
            >
              {{ t('products_services.configurable_options.add_first_option') }}
            </button>
          </div>
        </div>

        <div v-else class="configurable-options-table">
          <div class="configurable-options-header">
            <div>{{ t('products_services.configurable_options.fields.name') }}</div>
            <div>{{ t('products_services.configurable_options.fields.type') }}</div>
            <div>{{ t('products_services.configurable_options.fields.items') }}</div>
            <div>{{ t('products_services.configurable_options.fields.required') }}</div>
            <div>{{ t('common.actions') }}</div>
          </div>

          <div 
            v-for="option in configurableOptionsData.options" 
            :key="option.id" 
            class="configurable-option-row"
          >
            <div>
              <div class="option-name">{{ option.name }}</div>
              <div v-if="option.description" class="option-description text-muted">{{ option.description }}</div>
            </div>
            <div>
              {{ optionTypes.find(type => type.value === option.type)?.label || option.type }}
            </div>
            <div>{{ option.items.length }}</div>
            <div>
              <i 
                class="fas" 
                :class="option.required ? 'fa-check text-success' : 'fa-times text-muted'"
              ></i>
            </div>
            <div class="field-actions">
              <button 
                class="btn btn-icon" 
                @click="editOption(option.id)"
                type="button"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button 
                class="btn btn-icon text-danger" 
                @click="deleteOption(option.id)"
                type="button"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions du wizard -->
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
      >
        {{ t('common.continue') }}
      </button>
    </div>
  </div>
</template>

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
const productsStore = useProductStore()

// Récupérer le type de produit depuis les paramètres de route
const productType = computed(() => route.params.type as string || 'shared_hosting')

// Déterminer si nous sommes en mode édition
const productId = computed(() => {
  const idOrAction = route.params.idOrAction as string
  if (idOrAction && idOrAction !== 'create') {
    return parseInt(idOrAction, 10)
  }
  return null
})

const isEditMode = computed(() => !!productId.value)

// Récupérer les données précédentes
const previousData = computed(() => {
  const savedProductData = localStorage.getItem('currentProductData')
  if (savedProductData) {
    try {
      return JSON.parse(savedProductData)
    } catch (error) {
      console.error('Erreur lors de la récupération des données précédentes:', error)
    }
  }
  return {}
})

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

// Onglet actif
const activeTab = computed(() => {
  const currentRouteName = route.name as string
  const tab = tabs.find(tab => tab.route === currentRouteName)
  return tab ? tab.id : 'configurable_options'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  // Sauvegarder les données dans localStorage
  localStorage.setItem('configurableOptionsData', JSON.stringify(configurableOptionsData.value))
  
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
const showAddOptionForm = ref(false)
const editingOption = ref(null as number | null)
const optionGroups = ref<Array<{ id: number; name: string }>>([])
const submitting = ref(false)
const success = ref(false)

// Données des options configurables
const configurableOptionsData = ref({
  options: [] as Array<{
    id: number;
    name: string;
    type: string;
    description: string;
    required: boolean;
    optionGroup: number | null;
    items: Array<{
      id: number;
      name: string;
      price: number;
      setupFee: number;
      isDefault: boolean;
    }>;
  }>
})

// Types d'options disponibles
const optionTypes = [
  { value: 'dropdown', label: t('products_services.configurable_options.types.dropdown') },
  { value: 'radio', label: t('products_services.configurable_options.types.radio') },
  { value: 'checkbox', label: t('products_services.configurable_options.types.checkbox') },
  { value: 'quantity', label: t('products_services.configurable_options.types.quantity') },
  { value: 'text', label: t('products_services.configurable_options.types.text') }
]

// Nouvelle option configurable
const newOption = ref({
  name: '',
  type: 'dropdown',
  description: '',
  required: true,
  optionGroup: null as number | null,
  items: [] as Array<{
    id: number;
    name: string;
    price: number;
    setupFee: number;
    isDefault: boolean;
  }>
})

// Nouvel élément d'option
const newItem = ref({
  name: '',
  price: 0,
  setupFee: 0,
  isDefault: false
})

// Récupérer les groupes d'options
const fetchOptionGroups = async () => {
  try {
    // Simuler la récupération des groupes d'options depuis l'API
    // Dans une implémentation réelle, vous remplaceriez cela par un appel API
    optionGroups.value = [
      { id: 1, name: 'Ressources serveur' },
      { id: 2, name: 'Licences' },
      { id: 3, name: 'Services additionnels' }
    ]
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes d\'options:', error)
  }
}

// Réinitialiser le formulaire de nouvelle option
const resetNewOption = () => {
  newOption.value = {
    name: '',
    type: 'dropdown',
    description: '',
    required: true,
    optionGroup: null,
    items: []
  }
  newItem.value = {
    name: '',
    price: 0,
    setupFee: 0,
    isDefault: false
  }
  showAddOptionForm.value = false
  editingOption.value = null
}

// Ajouter un élément à l'option
const addItemToOption = () => {
  if (!newItem.value.name) {
    errors.value = { item: t('products_services.configurable_options.errors.item_name_required') }
    return
  }
  
  const newId = newOption.value.items.length > 0 
    ? Math.max(...newOption.value.items.map(i => i.id)) + 1 
    : 1
    
  newOption.value.items.push({
    id: newId,
    name: newItem.value.name,
    price: newItem.value.price,
    setupFee: newItem.value.setupFee,
    isDefault: newItem.value.isDefault
  })
  
  // Réinitialiser le formulaire d'élément
  newItem.value = {
    name: '',
    price: 0,
    setupFee: 0,
    isDefault: false
  }
  
  errors.value = {}
}

// Supprimer un élément de l'option
const removeItemFromOption = (itemId: number) => {
  newOption.value.items = newOption.value.items.filter(i => i.id !== itemId)
}

// Définir un élément comme défaut
const setItemAsDefault = (itemId: number) => {
  newOption.value.items = newOption.value.items.map(item => ({
    ...item,
    isDefault: item.id === itemId
  }))
}

// Ajouter ou mettre à jour une option configurable
const saveOption = () => {
  const formErrors = {} as Record<string, string>
  
  // Validation
  if (!newOption.value.name) {
    formErrors.name = t('products_services.configurable_options.errors.name_required')
  } else if (newOption.value.name.length < 3) {
    formErrors.name = t('products_services.configurable_options.errors.name_too_short')
  }
  
  if (['dropdown', 'radio', 'checkbox'].includes(newOption.value.type) && newOption.value.items.length === 0) {
    formErrors.items = t('products_services.configurable_options.errors.items_required')
  }
  
  if (Object.keys(formErrors).length > 0) {
    errors.value = formErrors
    return
  }
  
  if (editingOption.value !== null) {
    // Mettre à jour une option existante
    const index = configurableOptionsData.value.options.findIndex(o => o.id === editingOption.value)
    if (index !== -1) {
      configurableOptionsData.value.options[index] = {
        ...configurableOptionsData.value.options[index],
        ...newOption.value
      }
      
      notificationStore.addNotification({
        type: 'success',
        title: t('products_services.configurable_options.success.option_updated_title'),
        message: t('products_services.configurable_options.success.option_updated_message')
      })
    }
  } else {
    // Ajouter une nouvelle option
    const newId = configurableOptionsData.value.options.length > 0 
      ? Math.max(...configurableOptionsData.value.options.map(o => o.id)) + 1 
      : 1
      
    configurableOptionsData.value.options.push({
      id: newId,
      ...newOption.value
    })
    
    notificationStore.addNotification({
      type: 'success',
      title: t('products_services.configurable_options.success.option_added_title'),
      message: t('products_services.configurable_options.success.option_added_message')
    })
  }
  
  resetNewOption()
}

// Éditer une option configurable
const editOption = (optionId: number) => {
  const option = configurableOptionsData.value.options.find(o => o.id === optionId)
  if (option) {
    newOption.value = JSON.parse(JSON.stringify(option)) // Deep clone
    editingOption.value = optionId
    showAddOptionForm.value = true
  }
}

// Supprimer une option configurable
const deleteOption = (optionId: number) => {
  configurableOptionsData.value.options = configurableOptionsData.value.options.filter(o => o.id !== optionId)
  
  notificationStore.addNotification({
    type: 'success',
    title: t('products_services.configurable_options.success.option_deleted_title'),
    message: t('products_services.configurable_options.success.option_deleted_message')
  })
}

// Continuer vers l'étape suivante
const continueToNextStep = () => {
  // Sauvegarder les données
  localStorage.setItem('configurableOptionsData', JSON.stringify(configurableOptionsData.value))
  
  // Naviguer vers la prochaine étape
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-upgrades',
    params: { idOrAction }
  })
}

// Finaliser et enregistrer le produit
const saveProduct = async () => {
  submitting.value = true
  
  try {
    // Fusionner toutes les données du produit
    const productData = {
      ...previousData.value,
      configurableOptions: configurableOptionsData.value.options
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('currentProductData', JSON.stringify(productData))
    
    // Appel à l'API pour créer/mettre à jour le produit
    await productsStore.createProduct(productData)
    
    success.value = true
    
    notificationStore.addNotification({
      type: 'success',
      title: t('products_services.success.product_created_title'),
      message: t('products_services.success.product_created_message')
    })
    
    // Nettoyer le localStorage
    localStorage.removeItem('currentProductData')
    
    // Rediriger vers la liste des produits après un court délai
    setTimeout(() => {
      router.push({ name: 'products' })
    }, 1500)
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error)
    
    notificationStore.addNotification({
      type: 'error',
      title: t('products_services.errors.product_creation_failed_title'),
      message: t('products_services.errors.product_creation_failed_message')
    })
  } finally {
    submitting.value = false
  }
}

// Fusionner les données précédentes avec les données des options configurables
onMounted(() => {
  fetchOptionGroups()
  
  if (previousData.value && previousData.value.configurableOptions) {
    configurableOptionsData.value.options = previousData.value.configurableOptions
  }
})

// Retour à l'étape précédente
const goBack = () => {
  // Sauvegarder les données
  localStorage.setItem('configurableOptionsData', JSON.stringify(configurableOptionsData.value))
  
  // Naviguer vers l'étape précédente
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-custom-fields',
    params: { idOrAction }
  })
}
</script>

<style scoped>
@import '@/assets/css/components/common-layout.css';
@import '@/assets/styles/wizard-tabs.css';
</style>
