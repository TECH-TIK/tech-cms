<template>
  <div v-if="!isPublicRoute" class="app-layout" :class="{ 'dark': isDarkMode }">
    <!-- En-tête -->
    <header>
      <AppHeader />
    </header>

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
  @apply min-h-screen bg-gray-100 dark:bg-gray-900;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-container {
  @apply flex;
  flex: 1;
  overflow: hidden;
  margin-top: var(--header-height, 64px); /* Ajouter une marge pour le header */
  display: flex; /* Ajouter display: flex pour un meilleur positionnement */
  flex-direction: row; /* Définir la direction des éléments */
}

.app-content {
  @apply p-6;
  flex: 1;
  overflow-y: auto;
  height: calc(100vh - var(--header-height, 64px));
  margin-left: var(--sidebar-width, 280px); /* Ajouter une marge à gauche pour la sidebar */
  transition: all 0.3s ease;
}

/* Ajustement pour le mode responsive */
@media (max-width: 768px) {
  .app-content {
    margin-left: 0; /* Pas de marge sur mobile quand la sidebar est fermée */
  }
  
  body.sidebar-open .app-content {
    margin-left: var(--sidebar-width, 280px); /* Ajouter la marge quand la sidebar est ouverte */
  }
}
</style>
