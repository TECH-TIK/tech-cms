<template>
  <div class="client-header">
    <div class="header-left">
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>
    
    <div class="header-right">
      <!-- Barre de recherche -->
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Rechercher..."
          @input="handleSearch"
        >
      </div>

      <!-- Sélecteur de langue -->
      <div ref="languageDropdown" class="dropdown">
        <button class="btn-icon dropdown-toggle" @click="toggleLanguage">
          <span class="current-lang">{{ currentLanguage.toUpperCase() }}</span>
        </button>
        <div class="dropdown-menu" :class="{ show: showLanguageMenu }">
          <div class="menu-header">
            <h3>Langue</h3>
          </div>
          <div class="menu-items">
            <a 
              href="#" 
              class="menu-item" 
              :class="{ active: currentLanguage === 'fr' }"
              @click.prevent="changeLanguage('fr')"
            >
              <span class="flag">🇫🇷</span>
              <span class="label">Français</span>
              <i v-if="currentLanguage === 'fr'" class="fas fa-check"></i>
            </a>
            <a 
              href="#" 
              class="menu-item" 
              :class="{ active: currentLanguage === 'en' }"
              @click.prevent="changeLanguage('en')"
            >
              <span class="flag">🇬🇧</span>
              <span class="label">English</span>
              <i v-if="currentLanguage === 'en'" class="fas fa-check"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Notifications - Système temps réel intégré -->
      <NotificationCenter
        :notifications="realtimeNotifications"
        @notification-click="handleNotificationClick"
        @mark-as-read="handleMarkAsRead"
        @mark-all-as-read="handleMarkAllAsRead"
        @clear-all="handleClearAll"
      />

      <!-- Menu utilisateur -->
      <div ref="userDropdown" class="user-menu">
        <button class="user-btn" @click="toggleUserMenu">
          <div class="user-avatar">
            <i class="fas fa-user-circle"></i>
          </div>
          <span class="user-name">{{
            authStore.isAuthenticated ? authStore.userFullName :
            authStore.loading ? 'Chargement...' : 'Non connecté'
          }}</span>
          <i class="fas fa-chevron-down"></i>
        </button>

        <div class="user-dropdown" :class="{ show: showUserMenu }">
          <div class="user-info" v-if="authStore.isAuthenticated">
            <div class="user-avatar-large">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-details">
              <div class="name">{{ authStore.userFullName }}</div>
              <div class="email">{{ authStore.user?.email }}</div>
            </div>
          </div>
          <div class="user-info" v-else-if="authStore.loading">
            <div class="user-avatar-large">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-details">
              <div class="name">Chargement...</div>
              <div class="email">---</div>
            </div>
          </div>
          <div class="user-info" v-else>
            <div class="user-avatar-large">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-details">
              <div class="name">Non connecté</div>
              <div class="email">---</div>
            </div>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-items">
            <router-link to="/account" class="menu-item">
              <i class="fas fa-user-cog"></i>
              <span>Mon Compte</span>
            </router-link>
            <router-link to="/settings" class="menu-item">
              <i class="fas fa-cog"></i>
              <span>Paramètres</span>
            </router-link>
            <a href="#" class="menu-item" @click.prevent="handleLogout" :class="{ disabled: authStore.loading }">
              <i class="fas fa-sign-out-alt"></i>
              <span>Déconnexion</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useRealtimeStore } from '@/stores/realtime'
import NotificationCenter from '@/components/dashboard/NotificationCenter.vue'
import logger from '@/services/logger'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const authStore = useAuthStore()
const realtimeStore = useRealtimeStore()

// État
const searchQuery = ref('')
const currentLanguage = ref(locale.value || 'fr')
const showLanguageMenu = ref(false)
const showUserMenu = ref(false)

// Références pour les dropdowns
const languageDropdown = ref<HTMLElement>()
const userDropdown = ref<HTMLElement>()

// Computed pour les notifications temps réel
const realtimeNotifications = computed(() => realtimeStore.notifications)

// Titre de la page basé sur la route
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: 'Tableau de bord',
    services: 'Mes Services',
    invoices: 'Factures',
    tickets: 'Support',
    account: 'Mon Compte'
  }
  return titles[route.name as string] || 'TechCMS Client'
})

// Méthodes
const handleSearch = () => {
  // Logique de recherche
  console.log('Recherche:', searchQuery.value)
}

const toggleLanguage = () => {
  showLanguageMenu.value = !showLanguageMenu.value
  showUserMenu.value = false
}

const changeLanguage = (lang: string) => {
  currentLanguage.value = lang
  locale.value = lang
  showLanguageMenu.value = false
  // Sauvegarder dans localStorage
  localStorage.setItem('preferred-language', lang)
  console.log('Langue changée vers:', lang)
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  showLanguageMenu.value = false
}

// Handlers pour NotificationCenter
const handleNotificationClick = (notification: any) => {
  logger.info('[HEADER] Clic sur notification', { notification })
  // Redirection selon le type de notification
  if (notification.action_url) {
    router.push(notification.action_url)
  }
}

const handleMarkAsRead = (notificationId: string) => {
  logger.debug('[HEADER] Marquer notification comme lue', { notificationId })
  realtimeStore.markNotificationAsRead(notificationId)
}

const handleMarkAllAsRead = () => {
  logger.info('[HEADER] Marquer toutes les notifications comme lues')
  realtimeStore.markAllNotificationsAsRead()
}

const handleClearAll = () => {
  logger.info('[HEADER] Effacer toutes les notifications')
  realtimeStore.clearNotifications()
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/client/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

// Fermer les dropdowns en cliquant à l'extérieur
const handleClickOutside = (event: Event) => {
  if (languageDropdown.value && !languageDropdown.value.contains(event.target as Node)) {
    showLanguageMenu.value = false
  }
  if (userDropdown.value && !userDropdown.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)

  // Initialiser la langue depuis localStorage
  const savedLanguage = localStorage.getItem('preferred-language')
  if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
    currentLanguage.value = savedLanguage
    locale.value = savedLanguage
  }

  // Initialiser le store d'authentification au montage
  if (!authStore.initialized) {
    await authStore.initialize()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@import '@/assets/css/layouts/topbar.css';
</style>
