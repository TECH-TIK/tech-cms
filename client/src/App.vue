<template>
  <div id="app" class="tech-cms-client-app">
    <!-- Router view avec layout conditionnel -->
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <!-- Pages d'authentification sans layout -->
        <div v-if="route.meta.hideLayout" class="auth-container">
          <component :is="Component" />
        </div>
        <!-- Pages normales avec layout principal -->
        <AppLayout v-else>
          <component :is="Component" />
        </AppLayout>
      </transition>
    </router-view>

    <!-- Affichage des erreurs de connexion temps réel -->
    <div v-if="realtimeError" class="realtime-error-banner">
      <div class="realtime-error-content">
        <span>Connexion temps réel interrompue</span>
        <button class="retry-button" @click="retryRealtimeConnection">
          Réessayer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import logger from '@/services/logger'
import { useAuthStore } from '@/stores/auth'
import { useRealtimeStore } from '@/stores/realtime'

// Stores
const authStore = useAuthStore()
const realtimeStore = useRealtimeStore()

// Computed
const realtimeError = computed(() => realtimeStore.hasError && authStore.isAuthenticated)

// Configuration initiale
onMounted(async () => {
  logger.info('TechCMS Client - Initialisation...')

  // Initialiser le store d'authentification
  await authStore.initialize()

  // Initialiser le service de temps réel si l'utilisateur est authentifié
  if (authStore.isAuthenticated) {
    logger.info('TechCMS Client - Initialisation du temps réel...')
    initRealtimeService()
  }
})

// Observation du changement d'état d'authentification
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    logger.info('TechCMS Client - Utilisateur authentifié, initialisation du temps réel...')
    initRealtimeService()
  } else {
    logger.info('TechCMS Client - Utilisateur déconnecté, déconnexion du temps réel...')
    realtimeStore.disconnect()
  }
})

// Fonction d'initialisation du service temps réel
const initRealtimeService = async () => {
  try {
    await realtimeStore.init()
  } catch (err) {
    logger.error('TechCMS Client - Erreur d\'initialisation du temps réel:', { error: err })
  }
}

// Fonction pour réessayer la connexion temps réel
const retryRealtimeConnection = async () => {
  logger.info('TechCMS Client - Tentative de reconnexion au service temps réel...')
  await realtimeStore.retry()
}
</script>

<style scoped>
.realtime-error-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  padding: 0.75rem;
  z-index: 9999;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.realtime-error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.retry-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* Styles globaux pour l'application client */
.tech-cms-client-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
  color: #fff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Conteneur pour les pages d'authentification - Pleine page */
.auth-container {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>