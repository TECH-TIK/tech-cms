<template>
  <header class="mb-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{ title }}</h1>
        <p class="mt-2 text-gray-600">{{ subtitle }}</p>
      </div>
      
      <div class="flex space-x-4">
        <button 
          @click="refresh"
          class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          <i class="fas fa-sync-alt mr-2"></i>
          Actualiser
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Props
interface Props {
  title?: string
  subtitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Tableau de bord',
  subtitle: 'Vue d\'ensemble de votre activité'
})

// Émissions
const emit = defineEmits<{
  (e: 'refresh'): void
}>()

function refresh() {
  emit('refresh')
}
</script>
