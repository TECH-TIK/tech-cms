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
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import AppLayout from '@/components/layout/AppLayout.vue'
import NotificationsContainer from '@/components/common/NotificationsContainer.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const isDarkMode = computed(() => themeStore.darkMode)

// Configuration initiale
onMounted(async () => {
  console.log('TechCMS Admin - Initialisation...')
  await authStore.init()
})
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
</style>
