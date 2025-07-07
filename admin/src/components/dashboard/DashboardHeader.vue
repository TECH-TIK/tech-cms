<template>
  <header class="mb-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{ title }}</h1>
        <p class="mt-2 text-gray-600">{{ subtitle }}</p>
      </div>
      
      <div class="flex space-x-4">
        <button
          class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          @click="refresh"
        >
          <i class="fas fa-sync-alt mr-2"></i>
          {{ $t('dashboard.refresh') }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">



// Props
interface Props {
  title?: string
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Dashboard',
  subtitle: 'Overview of your activity'
})

// Émissions
const emit = defineEmits<{
  (e: 'refresh'): void
}>()

function refresh() {
  emit('refresh')
}
</script>
