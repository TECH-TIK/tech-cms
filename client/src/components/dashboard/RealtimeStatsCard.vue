<template>
  <div 
    :class="['realtime-stats-card', 'card-box', { 
      'updating': isUpdating,
      'has-change': hasRecentChange,
      'positive-change': changeDirection === 'up',
      'negative-change': changeDirection === 'down'
    }]"
  >
    <!-- Update Indicator -->
    <div v-if="isUpdating" class="update-indicator">
      <div class="update-pulse"></div>
      <i class="fas fa-sync fa-spin"></i>
    </div>
    
    <!-- Card Content -->
    <div class="stat-content">
      <!-- Icon Section -->
      <div class="stat-icon-section">
        <div class="stat-icon">
          <i :class="icon"></i>
        </div>
        
        <!-- Change Indicator -->
        <div v-if="showChangeIndicator && hasRecentChange" class="change-indicator">
          <i :class="changeIcon"></i>
          <span class="change-value">{{ changeText }}</span>
        </div>
      </div>
      
      <!-- Stats Section -->
      <div class="stat-data">
        <!-- Main Value -->
        <div class="stat-number">
          <transition name="number-change" mode="out-in">
            <span :key="displayValue" class="number-value">
              {{ formattedValue }}
            </span>
          </transition>
        </div>
        
        <!-- Label -->
        <div class="stat-label">{{ label }}</div>
        
        <!-- Subtitle/Additional Info -->
        <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
        
        <!-- Last Update -->
        <div v-if="showLastUpdate && lastUpdate" class="last-update">
          <i class="fas fa-clock"></i>
          {{ formatLastUpdate(lastUpdate) }}
        </div>
      </div>
    </div>
    
    <!-- Progress Bar (optionnel) -->
    <div v-if="showProgress && maxValue" class="progress-section">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <div class="progress-text">
        {{ value }} / {{ maxValue }}
      </div>
    </div>
    
    <!-- Action Button (optionnel) -->
    <div v-if="actionLabel" class="card-action">
      <button @click="handleAction" class="action-btn">
        <i v-if="actionIcon" :class="actionIcon"></i>
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import logger from '@/services/logger'

// Props
interface Props {
  value: number | string
  label: string
  icon: string
  subtitle?: string
  format?: 'number' | 'currency' | 'percentage'
  currency?: string
  showChangeIndicator?: boolean
  showLastUpdate?: boolean
  showProgress?: boolean
  maxValue?: number
  actionLabel?: string
  actionIcon?: string
  lastUpdate?: string
  animationDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  currency: 'EUR',
  showChangeIndicator: true,
  showLastUpdate: false,
  showProgress: false,
  animationDuration: 1000
})

// Emits
const emit = defineEmits<{
  action: []
  valueChange: [oldValue: number | string, newValue: number | string]
}>()

// État local
const isUpdating = ref(false)
const hasRecentChange = ref(false)
const changeDirection = ref<'up' | 'down' | null>(null)
const previousValue = ref<number | string>(props.value)
const displayValue = ref<number | string>(props.value)

// Computed
const formattedValue = computed(() => {
  const numValue = typeof displayValue.value === 'string' 
    ? parseFloat(displayValue.value) || 0 
    : displayValue.value

  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: props.currency
      }).format(numValue)
    
    case 'percentage':
      return new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(numValue / 100)
    
    case 'number':
    default:
      return new Intl.NumberFormat('fr-FR').format(numValue)
  }
})

const changeIcon = computed(() => {
  if (changeDirection.value === 'up') return 'fas fa-arrow-up'
  if (changeDirection.value === 'down') return 'fas fa-arrow-down'
  return 'fas fa-minus'
})

const changeText = computed(() => {
  const current = typeof displayValue.value === 'string' 
    ? parseFloat(displayValue.value) || 0 
    : displayValue.value
  const previous = typeof previousValue.value === 'string' 
    ? parseFloat(previousValue.value) || 0 
    : previousValue.value
  
  const diff = Math.abs(current - previous)
  
  if (props.format === 'currency') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: props.currency
    }).format(diff)
  }
  
  return new Intl.NumberFormat('fr-FR').format(diff)
})

const progressPercentage = computed(() => {
  if (!props.maxValue) return 0
  const numValue = typeof displayValue.value === 'string' 
    ? parseFloat(displayValue.value) || 0 
    : displayValue.value
  return Math.min((numValue / props.maxValue) * 100, 100)
})

// Méthodes
const handleAction = () => {
  logger.debug('[REALTIME STATS CARD] Action déclenchée', { label: props.label })
  emit('action')
}

const formatLastUpdate = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const animateValueChange = () => {
  isUpdating.value = true
  hasRecentChange.value = true
  
  // Déterminer la direction du changement
  const current = typeof props.value === 'string' 
    ? parseFloat(props.value) || 0 
    : props.value
  const previous = typeof previousValue.value === 'string' 
    ? parseFloat(previousValue.value) || 0 
    : previousValue.value
  
  if (current > previous) {
    changeDirection.value = 'up'
  } else if (current < previous) {
    changeDirection.value = 'down'
  } else {
    changeDirection.value = null
  }
  
  // Animer la valeur
  displayValue.value = props.value
  
  // Arrêter l'animation après la durée spécifiée
  setTimeout(() => {
    isUpdating.value = false
  }, props.animationDuration)
  
  // Arrêter l'indicateur de changement après 3 secondes
  setTimeout(() => {
    hasRecentChange.value = false
    changeDirection.value = null
  }, 3000)
  
  // Émettre l'événement de changement
  emit('valueChange', previousValue.value, props.value)
  
  logger.debug('[REALTIME STATS CARD] Valeur mise à jour', {
    label: props.label,
    oldValue: previousValue.value,
    newValue: props.value,
    direction: changeDirection.value
  })
}

// Watchers
watch(() => props.value, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    previousValue.value = oldValue
    animateValueChange()
  }
})

// Lifecycle
onMounted(() => {
  displayValue.value = props.value
  logger.debug('[REALTIME STATS CARD] Composant monté', { 
    label: props.label, 
    value: props.value 
  })
})
</script>

<style scoped>
@import '@/assets/css/components/realtime-stats-card.css';
</style>
