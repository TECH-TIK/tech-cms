<template>
  <div v-if="!isPublicRoute" class="app-layout" :class="{ 'dark': isDarkMode }">
    <!-- En-tête -->
    <AppHeader />

    <div class="app-container">
      <!-- Sidebar -->
      <AppSidebar />

      <!-- Contenu principal -->
      <main class="app-content">
        <slot />
      </main>
    </div>
  </div>
  <div v-else>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const route = useRoute()
const themeStore = useThemeStore()
const isPublicRoute = computed(() => route.meta.public)
const isDarkMode = computed(() => themeStore.darkMode)
</script>

<style scoped>
.app-layout {
  @apply min-h-screen bg-gray-100;
}

.app-container {
  @apply flex;
}

.app-content {
  @apply flex-1 p-6;
}
</style>
