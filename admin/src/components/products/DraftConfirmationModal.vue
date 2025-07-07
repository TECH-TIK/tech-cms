<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-content">
        <!-- En-tête du modal -->
        <div class="modal-header">
          <h3 class="modal-title">
            {{ $t('product_wizard.draft_modal.title') }}
          </h3>
          <button class="modal-close" @click="cancel">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Corps du modal -->
        <div class="modal-body">
          <p class="modal-text">
            {{ $t('product_wizard.draft_modal.description') }}
          </p>
          
          <!-- Affichage des différences -->
          <div v-if="showDiff" class="draft-diff">
            <h4 class="diff-title">
              {{ $t('product_wizard.draft_modal.changes') }}
            </h4>
            
            <div class="diff-container">
              <template v-if="Object.keys(draftChanges).length > 0">
                <div
v-for="(change, key) in draftChanges" :key="key" 
                     class="diff-item"
>
                  <div class="diff-label">{{ formatFieldName(key) }}</div>
                  <div class="diff-values">
                    <div class="diff-old">{{ formatDiffValue(change.old) }}</div>
                    <div class="diff-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="diff-new">{{ formatDiffValue(change.new) }}</div>
                  </div>
                </div>
              </template>
              <div v-else class="diff-empty">
                {{ $t('product_wizard.draft_modal.no_changes') }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pied du modal -->
        <div class="modal-footer">
          <button type="button" class="btn-link" @click="toggleDiff">
            <span v-if="showDiff">{{ $t('product_wizard.draft_modal.hide_changes') }}</span>
            <span v-else>{{ $t('product_wizard.draft_modal.view_changes') }}</span>
          </button>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-outline-secondary" @click="discardDraft">
              {{ $t('product_wizard.draft_modal.discard') }}
            </button>
            <button type="button" class="btn btn-primary" @click="resumeDraft">
              {{ $t('product_wizard.draft_modal.resume') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Props
const props = defineProps({
  draftData: {
    type: Object,
    required: true
  },
  currentData: {
    type: Object,
    required: true
  }
})

// Émissions
const emit = defineEmits(['resume', 'discard'])

// État local
const isVisible = ref(false)
const showDiff = ref(false)

// Calculer les différences entre le brouillon et les données actuelles
const draftChanges = ref<Record<string, { old: any, new: any }>>({})

onMounted(() => {
  // Calculer les différences entre les données
  calculateDiff()
})

// Ajouter un gestionnaire d'événement pour la touche Echap
const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isVisible.value) {
    cancel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscKey)
})

// Ouvrir le modal
const open = () => {
  isVisible.value = true
  
  // Empêcher le défilement du corps
  document.body.style.overflow = 'hidden'
}

// Fermer le modal
const close = () => {
  isVisible.value = false
  
  // Restaurer le défilement du corps
  document.body.style.overflow = ''
}

// Annuler et fermer
const cancel = () => {
  close()
}

// Montrer/cacher les différences
const toggleDiff = () => {
  showDiff.value = !showDiff.value
}

// Reprendre le brouillon
const resumeDraft = () => {
  close()
  emit('resume', props.draftData)
}

// Supprimer le brouillon
const discardDraft = () => {
  close()
  emit('discard')
}

// Calculer les différences entre le brouillon et les données actuelles
const calculateDiff = () => {
  const changes: Record<string, { old: any, new: any }> = {}
  
  // Comparer les champs
  for (const key in props.draftData) {
    if (JSON.stringify(props.draftData[key]) !== JSON.stringify(props.currentData[key])) {
      changes[key] = {
        old: props.currentData[key],
        new: props.draftData[key]
      }
    }
  }
  
  draftChanges.value = changes
}

// Formater le nom du champ pour l'affichage
const formatFieldName = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
}

// Formater la valeur pour l'affichage dans la diff
const formatDiffValue = (value: any) => {
  if (value === null || value === undefined) {
    return '-'
  } else if (typeof value === 'object') {
    return JSON.stringify(value).substring(0, 30) + '...'
  } else if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non'
  }
  return value.toString()
}

// Exposer les méthodes à utiliser dans le composant parent
defineExpose({
  open,
  close
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgb(0 0 0 / 50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
}

.modal-content {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgb(0 0 0 / 15%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: var(--spacing-xs);
  transition: color var(--transition-fast);
}

.modal-close:hover {
  color: var(--text-color);
}

.modal-body {
  padding: var(--spacing-md);
  flex: 1;
  overflow-y: auto;
}

.modal-text {
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
}

.modal-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-blue);
  cursor: pointer;
  padding: 0;
  transition: color var(--transition-fast);
  font-size: 0.875rem;
}

.btn-link:hover {
  color: var(--secondary-blue);
  text-decoration: underline;
}

.draft-diff {
  margin-top: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
  padding-top: var(--spacing-md);
}

.diff-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: var(--spacing-sm);
}

.diff-container {
  max-height: 250px;
  overflow-y: auto;
  background: rgb(0 0 0 / 10%);
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-border);
}

.diff-item {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--glass-border);
}

.diff-item:last-child {
  border-bottom: none;
}

.diff-label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--primary-blue);
  margin-bottom: var(--spacing-xs);
}

.diff-values {
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
}

.diff-old {
  text-decoration: line-through;
  color: var(--error);
  flex: 1;
  overflow-wrap: break-word;
}

.diff-arrow {
  margin: 0 var(--spacing-sm);
  color: var(--text-muted);
}

.diff-new {
  color: #2ed573;
  flex: 1;
  overflow-wrap: break-word;
}

.diff-empty {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}
</style>