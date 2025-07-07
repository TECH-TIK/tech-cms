<template>
  <div v-if="!isPublicRoute" class="app-layout" :class="{ 'dark': isDarkMode, 'sidebar-collapsed-layout': isSidebarCollapsed }">
    <!-- En-tête -->
    <header>
      <AppHeader />
    </header>

    <div class="app-container">
      <!-- Sidebar -->
      <AppSidebar :collapsed="isSidebarCollapsed" @sidebar-toggle="handleSidebarToggle" />

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
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const route = useRoute()
const themeStore = useThemeStore()
const isPublicRoute = computed(() => route.meta.public)
const isDarkMode = computed(() => themeStore.darkMode)

// Ajout de la gestion de l'état de la sidebar
const isSidebarCollapsed = ref(false)

// Fonction pour gérer le toggle de la sidebar
const handleSidebarToggle = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: #f3f4f6; /* bg-gray-100 */
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Ajout du mode sombre */
@media (prefers-color-scheme: dark) {
  .dark .app-layout {
    background-color: #111827; /* dark:bg-gray-900 */
  }
}

.app-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  margin-top: var(--header-height, 64px); /* Ajouter une marge pour le header */
  flex-direction: row; /* Définir la direction des éléments */
}

/* Styles .app-content déplacés vers variables.css pour centraliser les styles et éviter les conflits CSS */
</style>
