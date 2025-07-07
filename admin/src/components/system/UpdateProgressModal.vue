<template>
  <div v-if="data.show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container update-progress-modal">
      <div class="modal-header">
        <h3>{{ data.title }}</h3>
        <button 
          v-if="!isInProgress"
          class="modal-close"
          @click="handleClose"
        >
          <i class="icon-x"></i>
        </button>
      </div>

      <div class="modal-content">
        <!-- Progression du téléchargement/installation -->
        <div v-if="data.type === 'download' || data.type === 'install'" class="progress-section">
          <div class="progress-info">
            <div class="progress-status">
              <i :class="progressIcon" :style="{ color: progressColor }"></i>
              <span class="progress-text">{{ progressText }}</span>
            </div>
            <div v-if="data.progress" class="progress-percentage">
              {{ Math.round(data.progress.progress) }}%
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="progress-bar-container">
            <div 
              class="progress-bar"
              :style="{ 
                width: progressPercentage + '%',
                backgroundColor: progressColor
              }"
            ></div>
          </div>

          <!-- Message de progression -->
          <div v-if="data.progress?.message" class="progress-message">
            {{ data.progress.message }}
          </div>

          <!-- Erreur -->
          <div v-if="data.progress?.error" class="progress-error">
            <i class="icon-alert-triangle"></i>
            <span>{{ data.progress.error }}</span>
          </div>

          <!-- Détails de la version -->
          <div v-if="data.version" class="version-details">
            <h4>{{ $t('updates.version_details') }}</h4>
            <div class="detail-item">
              <span class="detail-label">{{ $t('updates.version') }}:</span>
              <span class="detail-value">{{ data.version }}</span>
            </div>
            <div v-if="data.update_id" class="detail-item">
              <span class="detail-label">{{ $t('updates.update_id') }}:</span>
              <span class="detail-value">#{{ data.update_id }}</span>
            </div>
          </div>
        </div>

        <!-- Progression générale -->
        <div v-else-if="data.type === 'progress'" class="general-progress">
          <div class="progress-steps">
            <div 
              v-for="(step, index) in progressSteps" 
              :key="index"
              class="progress-step"
              :class="{ 
                'active': index === currentStep,
                'completed': index < currentStep,
                'error': step.error
              }"
            >
              <div class="step-indicator">
                <i v-if="step.error" class="icon-x"></i>
                <i v-else-if="index < currentStep" class="icon-check"></i>
                <i v-else-if="index === currentStep" class="icon-loader spinning"></i>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="step-content">
                <div class="step-title">{{ step.title }}</div>
                <div v-if="step.description" class="step-description">{{ step.description }}</div>
                <div v-if="step.error" class="step-error">{{ step.error }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button 
          v-if="!isInProgress"
          class="btn btn-secondary"
          @click="handleClose"
        >
          {{ $t('common.close') }}
        </button>
        
        <button 
          v-if="isInProgress"
          class="btn btn-danger"
          @click="handleCancel"
        >
          {{ $t('common.cancel') }}
        </button>

        <button 
          v-if="isCompleted && !hasError"
          class="btn btn-primary"
          @click="handleContinue"
        >
          {{ $t('common.continue') }}
        </button>

        <button 
          v-if="hasError"
          class="btn btn-warning"
          @click="handleRetry"
        >
          {{ $t('common.retry') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UpdateModalState } from '@/types/update'

interface Props {
  data: UpdateModalState
}

interface Emits {
  (e: 'close'): void
  (e: 'cancel'): void
  (e: 'continue'): void
  (e: 'retry'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const currentStep = ref(0)

// États calculés
const isInProgress = computed(() => {
  if (!props.data.progress) return false
  const status = props.data.progress.status
  return status === 'downloading' || status === 'installing'
})

const isCompleted = computed(() => {
  if (!props.data.progress) return false
  return props.data.progress.status === 'completed'
})

const hasError = computed(() => {
  if (!props.data.progress) return false
  return props.data.progress.status === 'failed' || !!props.data.progress.error
})

const progressPercentage = computed(() => {
  if (!props.data.progress) return 0
  return Math.min(100, Math.max(0, props.data.progress.progress || 0))
})

const progressColor = computed(() => {
  if (hasError.value) return '#ef4444'
  if (isCompleted.value) return '#10b981'
  return '#3b82f6'
})

const progressIcon = computed(() => {
  if (hasError.value) return 'icon-alert-triangle'
  if (isCompleted.value) return 'icon-check-circle'
  if (isInProgress.value) return 'icon-loader spinning'
  return 'icon-download'
})

const progressText = computed(() => {
  if (!props.data.progress) {
    if (props.data.type === 'download') return t('updates.preparing_download')
    if (props.data.type === 'install') return t('updates.preparing_install')
    return t('updates.preparing')
  }

  const status = props.data.progress.status
  switch (status) {
    case 'downloading':
      return t('updates.downloading')
    case 'installing':
      return t('updates.installing')
    case 'completed':
      return t('updates.completed')
    case 'failed':
      return t('updates.failed')
    default:
      return t('updates.processing')
  }
})

// Étapes de progression pour les opérations complexes
const progressSteps = computed(() => {
  if (props.data.type === 'download') {
    return [
      {
        title: t('updates.step_validate_token'),
        description: t('updates.step_validate_token_desc'),
        error: null
      },
      {
        title: t('updates.step_download_file'),
        description: t('updates.step_download_file_desc'),
        error: null
      },
      {
        title: t('updates.step_verify_integrity'),
        description: t('updates.step_verify_integrity_desc'),
        error: null
      },
      {
        title: t('updates.step_complete'),
        description: t('updates.step_complete_desc'),
        error: null
      }
    ]
  }

  if (props.data.type === 'install') {
    return [
      {
        title: t('updates.step_backup'),
        description: t('updates.step_backup_desc'),
        error: null
      },
      {
        title: t('updates.step_extract'),
        description: t('updates.step_extract_desc'),
        error: null
      },
      {
        title: t('updates.step_apply'),
        description: t('updates.step_apply_desc'),
        error: null
      },
      {
        title: t('updates.step_cleanup'),
        description: t('updates.step_cleanup_desc'),
        error: null
      }
    ]
  }

  return []
})

// Actions
const handleClose = () => {
  if (!isInProgress.value) {
    emit('close')
  }
}

const handleCancel = () => {
  emit('cancel')
}

const handleContinue = () => {
  emit('continue')
}

const handleRetry = () => {
  emit('retry')
}
</script>
