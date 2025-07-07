<template>
  <div class="update-status-card">
    <div class="card-header">
      <h3>{{ $t('updates.system_status') }}</h3>
      <div class="status-indicator" :class="statusClass">
        <i :class="statusIcon"></i>
        <span>{{ statusText }}</span>
      </div>
    </div>

    <div class="card-content">
      <div class="status-grid">
        <!-- Version actuelle -->
        <div class="status-item">
          <div class="status-label">{{ $t('updates.current_version') }}</div>
          <div class="status-value">
            <i class="icon-tag"></i>
            <span>{{ data.current_version }}</span>
          </div>
        </div>

        <!-- Mises à jour disponibles -->
        <div class="status-item">
          <div class="status-label">{{ $t('updates.available_updates') }}</div>
          <div class="status-value">
            <i class="icon-download"></i>
            <span class="update-count" :class="{ 'has-updates': data.updates_available > 0 }">
              {{ data.updates_available }}
            </span>
          </div>
        </div>

        <!-- Dernière vérification -->
        <div class="status-item">
          <div class="status-label">{{ $t('updates.last_check') }}</div>
          <div class="status-value">
            <i class="icon-clock"></i>
            <span>{{ formatLastCheck }}</span>
          </div>
        </div>

        <!-- Dernière mise à jour -->
        <div class="status-item">
          <div class="status-label">{{ $t('updates.last_update') }}</div>
          <div class="status-value">
            <i class="icon-calendar"></i>
            <span>{{ formatLastUpdate }}</span>
          </div>
        </div>
      </div>

      <!-- Configuration automatique -->
      <div class="automation-status">
        <h4>{{ $t('updates.automation_status') }}</h4>
        <div class="automation-grid">
          <div class="automation-item">
            <div class="automation-toggle" :class="{ 'enabled': data.auto_check_enabled }">
              <i :class="data.auto_check_enabled ? 'icon-check' : 'icon-x'"></i>
            </div>
            <div class="automation-info">
              <span class="automation-label">{{ $t('updates.auto_check') }}</span>
              <span class="automation-status-text">
                {{ data.auto_check_enabled ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </div>
          </div>

          <div class="automation-item">
            <div class="automation-toggle" :class="{ 'enabled': data.auto_download_enabled }">
              <i :class="data.auto_download_enabled ? 'icon-check' : 'icon-x'"></i>
            </div>
            <div class="automation-info">
              <span class="automation-label">{{ $t('updates.auto_download') }}</span>
              <span class="automation-status-text">
                {{ data.auto_download_enabled ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </div>
          </div>

          <div class="automation-item">
            <div class="automation-toggle" :class="{ 'enabled': data.auto_install_enabled }">
              <i :class="data.auto_install_enabled ? 'icon-check' : 'icon-x'"></i>
            </div>
            <div class="automation-info">
              <span class="automation-label">{{ $t('updates.auto_install') }}</span>
              <span class="automation-status-text">
                {{ data.auto_install_enabled ? $t('common.enabled') : $t('common.disabled') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card-actions">
      <button 
        class="btn btn-secondary"
        :disabled="loading"
        @click="$emit('check-updates')"
      >
        <i class="icon-refresh" :class="{ 'spinning': loading }"></i>
        {{ $t('updates.check_now') }}
      </button>
      
      <button 
        v-if="data.updates_available > 0"
        class="btn btn-primary"
        @click="handleDownloadLatest"
      >
        <i class="icon-download"></i>
        {{ $t('updates.download_latest') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UpdateCardData, AvailableVersion } from '@/types/update'

interface Props {
  data: UpdateCardData
  loading?: boolean
  availableVersions?: AvailableVersion[]
}

interface Emits {
  (e: 'check-updates'): void
  (e: 'download-update', version: AvailableVersion): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  availableVersions: () => []
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Statut du système
const statusClass = computed(() => {
  if (props.loading) return 'status-checking'
  if (props.data.updates_available > 0) return 'status-updates-available'
  return 'status-up-to-date'
})

const statusIcon = computed(() => {
  if (props.loading) return 'icon-refresh spinning'
  if (props.data.updates_available > 0) return 'icon-alert-circle'
  return 'icon-check-circle'
})

const statusText = computed(() => {
  if (props.loading) return t('updates.checking')
  if (props.data.updates_available > 0) {
    return t('updates.updates_available_count', { count: props.data.updates_available })
  }
  return t('updates.up_to_date')
})

// Formatage des dates
const formatLastCheck = computed(() => {
  if (!props.data.last_check) return t('updates.never')
  
  const date = new Date(props.data.last_check)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 1) return t('updates.just_now')
  if (diffHours < 24) return t('updates.hours_ago', { count: diffHours })
  if (diffDays < 7) return t('updates.days_ago', { count: diffDays })
  
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const formatLastUpdate = computed(() => {
  if (!props.data.last_update) return t('updates.never')
  
  const date = new Date(props.data.last_update)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Actions
const handleDownloadLatest = () => {
  if (props.availableVersions && props.availableVersions.length > 0) {
    // Télécharger la première version (la plus récente)
    emit('download-update', props.availableVersions[0])
  }
}
</script>
