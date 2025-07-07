<template>
  <div>
    <p class="section-description">
      {{ t('products_services.configurable_options.description') }}
    </p>

    <div v-if="loading" class="text-center" style="padding: var(--spacing-xl)">
      <div class="spinner-loading" style="margin: 0 auto;"></div>
    </div>

    <div v-else>
      <div v-if="configurableOptions.length > 0" class="options-list">
        <div v-for="option in configurableOptions" :key="option.id" class="option-item">
          <div class="option-header" @click="toggleOption(option)">
            <div class="option-name">
              {{ option.name }}
              <span class="option-type-badge">{{ getOptionTypeName(option.type) }}</span>
            </div>

            <div class="option-actions">
              <button class="btn-icon edit" @click.stop="editOption(option)">
                <i class="fas fa-pencil-alt"></i>
              </button>
              <button class="btn-icon delete" @click.stop="deleteOption(option)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div v-if="expandedOption === option.id" class="option-content">
            <div class="form-group">
              <label class="form-label">{{ t('products_services.configurable_options.required') }}</label>
              <div>{{ option.required ? t('common.yes') : t('common.no') }}</div>
            </div>
            
            <div v-if="option.choices && option.choices.length > 0" class="option-choices">
              <h4 class="form-label">{{ t('products_services.configurable_options.choices') }}</h4>
              <table class="choices-table">
                <thead>
                  <tr>
                    <th>{{ t('products_services.configurable_options.choice_name') }}</th>
                    <th>{{ t('products_services.configurable_options.choice_price') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="choice in option.choices" :key="choice.id">
                    <td>{{ choice.name }}</td>
                    <td>
                      <span v-if="choice.pricing_type === 'free'">{{ t('products_services.pricing.free') }}</span>
                      <span v-else-if="choice.pricing_type === 'one_time'">
                        {{ formatPrice(choice.price) }} ({{ t('products_services.pricing.one_time') }})
                      </span>
                      <span v-else-if="choice.pricing_type === 'recurring'">
                        {{ formatPrice(choice.price) }} ({{ t('products_services.pricing.recurring') }})
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-sliders-h"></i>
        </div>
        <h4>{{ t('products_services.configurable_options.no_options') }}</h4>
        <p>{{ t('products_services.configurable_options.no_options_description') }}</p>
      </div>
      
      <div class="options-footer">
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="showAddOption = true"
        >
          <i class="fas fa-plus"></i>
          {{ t('products_services.configurable_options.add_option') }}
        </button>
      </div>
      
      <!-- Modal d'ajout/édition d'option -->
      <div v-if="showAddOption || editingOption" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>
              {{ editingOption ? t('products_services.configurable_options.edit_option') : t('products_services.configurable_options.add_option') }}
            </h3>
            <button class="close-button" @click="closeOptionModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="saveOption">
              <div class="form-group">
                <label class="form-label">{{ t('products_services.configurable_options.option_name') }} *</label>
                <input 
                  v-model="newOption.name" 
                  type="text" 
                  class="form-control" 
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ t('products_services.configurable_options.option_type') }} *</label>
                <select v-model="newOption.type" class="form-control" required>
                  <option value="dropdown">{{ t('products_services.configurable_options.type_dropdown') }}</option>
                  <option value="radio">{{ t('products_services.configurable_options.type_radio') }}</option>
                  <option value="checkbox">{{ t('products_services.configurable_options.type_checkbox') }}</option>
                  <option value="quantity">{{ t('products_services.configurable_options.type_quantity') }}</option>
                </select>
              </div>
              
              <div class="form-group form-checkbox">
                <input 
                  id="option-required" 
                  v-model="newOption.required" 
                  type="checkbox" 
                  class="form-checkbox-input" 
                />
                <label for="option-required" class="form-checkbox-label">
                  {{ t('products_services.configurable_options.required') }}
                </label>
              </div>
              
              <div v-if="newOption.type !== 'quantity'" class="option-choices-section">
                <h4>{{ t('products_services.configurable_options.choices') }}</h4>
                
                <div class="choice-items">
                  <div v-for="(choice, index) in newOption.choices" :key="index" class="choice-item">
                    <div class="form-group">
                      <label class="form-label">{{ t('products_services.configurable_options.choice_name') }}</label>
                      <input 
                        v-model="choice.name" 
                        type="text" 
                        class="form-control" 
                      />
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">{{ t('products_services.configurable_options.pricing_type') }}</label>
                      <select v-model="choice.pricing_type" class="form-control">
                        <option value="free">{{ t('products_services.pricing.free') }}</option>
                        <option value="one_time">{{ t('products_services.pricing.one_time') }}</option>
                        <option value="recurring">{{ t('products_services.pricing.recurring') }}</option>
                      </select>
                    </div>
                    
                    <div v-if="choice.pricing_type !== 'free'" class="form-group">
                      <label class="form-label">{{ t('products_services.configurable_options.price') }}</label>
                      <div class="price-field">
                        <span class="currency-symbol">€</span>
                        <input 
                          v-model="choice.price" 
                          type="number" 
                          class="form-control" 
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="button" 
                      class="btn btn-danger btn-sm" 
                      @click="removeChoice(index)"
                    >
                      {{ t('common.remove') }}
                    </button>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  class="btn btn-outline-primary" 
                  @click="addChoice"
                >
                  {{ t('products_services.configurable_options.add_choice') }}
                </button>
              </div>
              
              <div v-if="newOption.type === 'quantity'" class="option-quantity-section">
                <div class="form-row">
                  <div class="form-col">
                    <div class="form-group">
                      <label class="form-label">{{ t('products_services.configurable_options.min_quantity') }}</label>
                      <input 
                        v-model="newOption.min_quantity" 
                        type="number" 
                        class="form-control" 
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div class="form-col">
                    <div class="form-group">
                      <label class="form-label">{{ t('products_services.configurable_options.max_quantity') }}</label>
                      <input 
                        v-model="newOption.max_quantity" 
                        type="number" 
                        class="form-control" 
                        min="1"
                      />
                    </div>
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">{{ t('products_services.configurable_options.pricing_type') }}</label>
                  <select v-model="newOption.pricing_type" class="form-control">
                    <option value="free">{{ t('products_services.pricing.free') }}</option>
                    <option value="one_time">{{ t('products_services.pricing.one_time') }}</option>
                    <option value="recurring">{{ t('products_services.pricing.recurring') }}</option>
                  </select>
                </div>
                
                <div v-if="newOption.pricing_type !== 'free'" class="form-group">
                  <label class="form-label">{{ t('products_services.configurable_options.price_per_unit') }}</label>
                  <div class="price-field">
                    <span class="currency-symbol">€</span>
                    <input 
                      v-model="newOption.price" 
                      type="number" 
                      class="form-control" 
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              <div class="modal-footer">
                <button 
                  type="button" 
                  class="btn btn-secondary" 
                  @click="closeOptionModal"
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

    <!-- Boutons de navigation -->
    <div class="wizard-actions">
      <button class="btn btn-secondary" @click="$router.push('/products/wizard/links')">
        {{ t('common.back') }}
      </button>
      
      <button class="btn btn-primary" @click="proceedToNext">
        {{ t('common.next') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useProductWizardStore } from '@/stores/product-wizard'
import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'
import type { ConfigurableOption, NewOptionForm } from '@/types/product-options'

const { t } = useI18n()
const router = useRouter()
const productWizardStore = useProductWizardStore()
const notificationStore = useNotificationStore()

// Ces variables sont maintenant définies comme des fonctions plus bas dans le code

// État local
const loading = ref(false)
const configurableOptions = ref<ConfigurableOption[]>([])
const expandedOption = ref<number | null>(null)
const showAddOption = ref(false)
const editingOption = ref<ConfigurableOption | null>(null)
const newOption = ref<NewOptionForm>({
  id: null,
  name: '',
  type: 'dropdown',
  required: false,
  pricing_type: 'free',
  price: 0,
  min_quantity: 1,
  max_quantity: 10,
  choices: []
})

// Vérifier si on est en mode édition basé sur editingProductId
const isEditMode = computed(() => productWizardStore.editingProductId !== null)

// Formater le prix avec le symbole de devise
const formatPrice = (price: number): string => {
  return `€${parseFloat(price.toString()).toFixed(2)}`
}

// Convertir les données du store au format ConfigurableOption
const convertToConfigurableOption = (option: any): ConfigurableOption => {
  // Si l'option est déjà au bon format, on la retourne telle quelle
  if (option.id && option.choices) {
    return option as ConfigurableOption
  }
  
  // Sinon on la convertit du format ProductWizardState.configurable_options
  return {
    id: option.id || Date.now(),
    name: option.name,
    type: option.type as 'dropdown' | 'radio' | 'checkbox' | 'quantity',
    required: option.required,
    pricing_type: 'free',
    price: 0,
    min_quantity: option.type === 'quantity' ? 1 : undefined,
    max_quantity: option.type === 'quantity' ? 10 : undefined,
    choices: option.options?.map((opt: any) => ({
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: opt.name,
      pricing_type: opt.price > 0 ? 'recurring' : 'free',
      price: opt.price || 0
    })) || []
  }
}

// Obtenir le nom du type d'option
const getOptionTypeName = (type: string): string => {
  const types: Record<string, string> = {
    'dropdown': t('products_services.configurable_options.type_dropdown'),
    'radio': t('products_services.configurable_options.type_radio'),
    'checkbox': t('products_services.configurable_options.type_checkbox'),
    'quantity': t('products_services.configurable_options.type_quantity')
  }
  return types[type] || type
}

// Afficher/masquer le contenu de l'option
const toggleOption = (option: ConfigurableOption): void => {
  if (expandedOption.value === option.id) {
    expandedOption.value = null
  } else {
    expandedOption.value = option.id
  }
}

// Ajouter un nouveau choix
const addChoice = (): void => {
  newOption.value.choices.push({
    id: Date.now(),
    name: '',
    pricing_type: 'free',
    price: 0
  })
}

// Supprimer un choix
const removeChoice = (index: number): void => {
  newOption.value.choices.splice(index, 1)
}

// Éditer une option existante
const editOption = (option: ConfigurableOption): void => {
  editingOption.value = option
  
  // Cloner l'option pour éviter la modification directe
  newOption.value = JSON.parse(JSON.stringify(option))
  showAddOption.value = true
}

// Supprimer une option
const deleteOption = (option: ConfigurableOption): void => {
  const confirmMessage = t('products_services.configurable_options.delete_confirm', {
    name: option.name
  })
  
  if (window.confirm(confirmMessage)) {
    const index = configurableOptions.value.findIndex(item => item.id === option.id)
    if (index !== -1) {
      configurableOptions.value.splice(index, 1)
      expandedOption.value = null
      
      // Mise à jour automatique
      // Convertir les ConfigurableOption au format du store ProductWizardState.configurable_options
      const storeCompatibleOptions = configurableOptions.value.map(option => ({
        name: option.name,
        type: option.type,
        required: option.required,
        options: option.choices.map(choice => ({
          name: choice.name,
          price: choice.price || 0,
          setup_fee: 0 // Valeur par défaut car non présent dans OptionChoice
        }))
      }))
      productWizardStore.productData.configurable_options = storeCompatibleOptions
      
      // Notification de succès
      notificationStore.showNotification({ 
        type: 'success',
        title: t('common.success'),
        message: t('products_services.configurable_options.deleted_success')
      })
    }
  }
}

// Sauvegarder l'option
const saveOption = () => {
  // Validation de base
  if (!newOption.value.name) {
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.configurable_options.name_required')
    })
    return
  }
  
  if (newOption.value.type !== 'quantity' && (!newOption.value.choices || newOption.value.choices.length === 0)) {
    notificationStore.showNotification({
      type: 'error',
      title: t('common.error'),
      message: t('products_services.configurable_options.choices_required')
    })
    return
  }
  
  // S'assurer que l'ID est un nombre valide (non null)
  const optionToSave = { ...newOption.value }
  if (optionToSave.id === null) {
    optionToSave.id = Date.now()
  }
  
  if (editingOption.value !== null) {
    // S'assurer que editingOption.value n'est pas null avant d'y accéder
    const editingId = editingOption.value.id
    const index = configurableOptions.value.findIndex(item => item.id === editingId)
    if (index !== -1) {
      // S'assurer que l'option a une ID valide
      configurableOptions.value[index] = optionToSave as ConfigurableOption
    }
  } else {
    // Ajouter la nouvelle option avec ID généré
    configurableOptions.value.push(optionToSave as ConfigurableOption)
  }
  
  // Réinitialiser le formulaire
  resetForm()
  
  // Message de confirmation
  notificationStore.showNotification({ 
    type: 'success',
    title: t('common.success'),
    message: editingOption.value !== null ? 
      t('products_services.configurable_options.updated_success') : 
      t('products_services.configurable_options.added_success')
  })
}

// Sauvegarder toutes les options
const saveOptions = async (): Promise<void> => {
  loading.value = true
  
  try {
    // Convertir les ConfigurableOption au format du store ProductWizardState.configurable_options
    const storeCompatibleOptions = configurableOptions.value.map(option => ({
      name: option.name,
      type: option.type,
      required: option.required,
      options: option.choices.map(choice => ({
        name: choice.name,
        price: choice.price || 0,
        setup_fee: 0 // Valeur par défaut car non présent dans OptionChoice
      }))
    }))
    
    // Mise à jour des options configurables dans les données du produit
    productWizardStore.productData.configurable_options = storeCompatibleOptions
    
    // Message de confirmation
    notificationStore.showNotification({ 
      type: 'success',
      title: t('common.success'),
      message: t('products_services.configurable_options.all_saved')
    })
    
    // La redirection est déjà gérée dans la fonction proceedToNext
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement des options', { error })
    notificationStore.showNotification({ 
      type: 'error',
      title: t('common.error'),
      message: t('products_services.configurable_options.save_error')
    })
  } finally {
    loading.value = false
  }
}

// Réinitialiser le formulaire
const resetForm = (): void => {
  newOption.value = {
    id: null,
    name: '',
    type: 'dropdown',
    required: false,
    pricing_type: 'free',
    price: 0,
    min_quantity: 1,
    max_quantity: 10,
    choices: []
  }
  editingOption.value = null
  showAddOption.value = false
}

// Fermer le modal d'option
const closeOptionModal = (): void => {
  resetForm()
}

// Charger les données initiales
const loadData = async (): Promise<void> => {
  loading.value = true
  
  try {
    if (isEditMode.value && productWizardStore.productData.configurable_options) {
      // Convertir chaque option au format ConfigurableOption
      configurableOptions.value = productWizardStore.productData.configurable_options
        .map((option: any) => convertToConfigurableOption(option))
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des données', { error })
    notificationStore.showNotification({ 
      type: 'error',
      title: t('common.error'), 
      message: t('products_services.error_loading_data')
    })
  } finally {
    loading.value = false
  }
}


// Naviguer vers la page suivante
const proceedToNext = async (): Promise<void> => {
  await saveOptions()
  router.push('/products/wizard/pricing')
}

// Hook de cycle de vie - Au montage du composant
onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import '@/assets/css/pages/products/product-configurable-options.css';
</style>