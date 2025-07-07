<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductGroupsStore, type ProductGroup } from '@/stores/product-groups'
import logger from '@/services/logger'

const { t } = useI18n()
const productGroupsStore = useProductGroupsStore()

const props = defineProps<{
  show: boolean
  editMode: boolean
  groupToEdit?: ProductGroup
}>()

const emit = defineEmits(['close', 'created', 'updated'])

const name = ref('')
const slug = ref('')
const description = ref('')
const errors = ref<Record<string, string>>({})

// Générer automatiquement le slug à partir du nom
watch(name, (newName) => {
  if (!props.editMode || (props.editMode && !props.groupToEdit?.slug)) {
    slug.value = newName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
})

// Remplir le formulaire avec les données du groupe à éditer
watch(() => props.groupToEdit, (group) => {
  if (group) {
    name.value = group.name || ''
    slug.value = group.slug || ''
    description.value = group.description || ''
  }
}, { immediate: true })

// Réinitialiser le formulaire
const resetForm = () => {
  name.value = ''
  slug.value = ''
  description.value = ''
  errors.value = {}
}

// Valider le formulaire
const validateForm = () => {
  errors.value = {}
  
  if (!name.value.trim()) {
    errors.value.name = t('product_groups.errors.name_required')
  }
  
  if (!slug.value.trim()) {
    errors.value.slug = t('product_groups.errors.slug_required')
  } else if (!/^[a-z0-9-]+$/.test(slug.value)) {
    errors.value.slug = t('product_groups.errors.slug_invalid')
  }
  
  return Object.keys(errors.value).length === 0
}

// Soumettre le formulaire
const submitForm = async () => {
  if (!validateForm()) return
  
  try {
    if (props.editMode && props.groupToEdit) {
      // Mode édition
      await productGroupsStore.updateProductGroup(props.groupToEdit.id, {
        name: name.value,
        slug: slug.value,
        description: description.value
      })
      emit('updated')
    } else {
      // Mode création
      await productGroupsStore.createProductGroup({
        name: name.value,
        slug: slug.value,
        description: description.value
      })
      emit('created')
    }
    
    resetForm()
    emit('close')
  } catch (error) {
    logger.error('Erreur lors de la soumission du formulaire', { error })
  }
}

// Fermer la modal
const closeModal = () => {
  resetForm()
  emit('close')
}

// Titre de la modal
const modalTitle = computed(() => {
  return props.editMode 
    ? t('product_groups.edit_title') 
    : t('product_groups.add_title')
})
</script>

<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button class="close-button" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="name">{{ t('product_groups.fields.name') }} *</label>
            <input 
              id="name" 
              v-model="name" 
              type="text" 
              class="form-control" 
              :class="{ 'is-invalid': errors.name }"
              :placeholder="t('product_groups.placeholders.name')"
            />
            <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
          </div>
          
          <div class="form-group">
            <label for="slug">{{ t('product_groups.fields.slug') }} *</label>
            <input 
              id="slug" 
              v-model="slug" 
              type="text" 
              class="form-control" 
              :class="{ 'is-invalid': errors.slug }"
              :placeholder="t('product_groups.placeholders.slug')"
            />
            <div v-if="errors.slug" class="error-message">{{ errors.slug }}</div>
            <small class="form-text text-muted">{{ t('product_groups.slug_help') }}</small>
          </div>
          
          <div class="form-group">
            <label for="description">{{ t('product_groups.fields.description') }}</label>
            <textarea 
              id="description" 
              v-model="description" 
              class="form-control" 
              :placeholder="t('product_groups.placeholders.description')"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary">
              {{ t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgb(0 0 0 / 50%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgb(0 0 0 / 33%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0069d9;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}
</style>
