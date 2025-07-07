<template>
  <div class="client-app-layout">
    <!-- En-tête -->
    <header>
      <AppHeader />
    </header>

    <div class="app-container">
      <!-- Sidebar -->
      <AppSidebar :collapsed="isSidebarCollapsed" @sidebar-toggle="handleSidebarToggle" />

      <!-- Contenu principal -->
      <main class="app-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

// Gestion de l'état de la sidebar
const isSidebarCollapsed = ref(false)

// Fonction pour gérer le toggle de la sidebar
const handleSidebarToggle = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style scoped>
@import '@/assets/css/layouts/layout.css';
</style>
