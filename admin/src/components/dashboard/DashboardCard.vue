<template>
  <div 
    class="dashboard-card bg-white rounded-lg shadow p-6 transition-transform hover:scale-[1.02]"
    :class="`border-l-4 border-${color}-500`"
  >
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <div class="mt-2 text-3xl font-bold" :class="`text-${color}-600`">
          {{ typeof stats === 'object' ? stats.total : stats }}
        </div>
      </div>
      
      <div :class="`text-${color}-500`">
        <i :class="`fas fa-${icon} text-2xl`"></i>
      </div>
    </div>

    <div class="mt-4">
      <slot name="details"></slot>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-100">
      <slot name="footer">
        <a 
          href="#" 
          class="text-sm font-medium hover:underline"
          :class="`text-${color}-600 hover:text-${color}-700`"
        >
          Voir plus
        </a>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  stats: number | Record<string, number>
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
}

defineProps<Props>()
</script>

<style scoped>
.dashboard-card {
  @apply relative overflow-hidden;
}

.dashboard-card::before {
  content: '';
  @apply absolute inset-0 bg-gradient-to-br opacity-5;
}

.dashboard-card:hover::before {
  @apply opacity-10;
}
</style>
