<template>
  <div id="app" class="tech-cms-app" :class="{ 'dark': isDarkMode }">
    <!-- Layout principal -->
    <AppLayout>
      <!-- Router view pour le contenu dynamique -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </AppLayout>

    <!-- Notifications globales -->
    <NotificationsContainer />
    
    <!-- Affichage des erreurs de connexion temps réel -->
    <div v-if="realtimeError" class="realtime-error-banner">
      <div class="realtime-error-content">
        <span>{{ $t('errors.realtime_connection') }}</span>
        <button @click="retryRealtimeConnection" class="retry-button">
          {{ $t('common.retry') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useRealtimeStore } from '@/stores/realtime'
import AppLayout from '@/components/layout/AppLayout.vue'
import NotificationsContainer from '@/components/common/NotificationsContainer.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const realtimeStore = useRealtimeStore()
const isDarkMode = computed(() => themeStore.darkMode)
const realtimeError = computed(() => realtimeStore.hasError && authStore.isAuthenticated)

// Configuration initiale
onMounted(async () => {
  console.log('TechCMS Admin - Initialisation...')
  await authStore.init()
  
  // Initialiser le service de temps réel si l'utilisateur est authentifié
  if (authStore.isAuthenticated) {
    console.log('TechCMS Admin - Initialisation du temps réel...')
    initRealtimeService()
  }
})

// Observation du changement d'état d'authentification
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    console.log('TechCMS Admin - Utilisateur authentifié, initialisation du temps réel...')
    initRealtimeService()
  } else {
    console.log('TechCMS Admin - Utilisateur déconnecté, déconnexion du temps réel...')
    realtimeStore.disconnect()
  }
})

// Fonction d'initialisation du service temps réel
const initRealtimeService = async () => {
  try {
    await realtimeStore.init()
  } catch (err) {
    console.error('TechCMS Admin - Erreur d\'initialisation du temps réel:', err)
  }
}

// Fonction pour réessayer la connexion temps réel
const retryRealtimeConnection = async () => {
  console.log('TechCMS Admin - Tentative de reconnexion au service temps réel...')
  await realtimeStore.retry()
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.realtime-error-banner {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem 1.25rem;
  border-radius: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  max-width: 400px;
}

.realtime-error-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.retry-button {
  margin-left: 1rem;
  padding: 0.25rem 0.75rem;
  background-color: #721c24;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #5c171c;
}
</style>
