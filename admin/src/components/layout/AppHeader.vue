<template>
  <div class="top-bar" data-component="topbar">
    <div class="search-bar">
      <i class="fas fa-search"></i>
      <input 
        type="text" 
        :placeholder="$t('common.search')" 
        v-model="searchQuery"
        @input="handleSearch"
      >
    </div>
    
    <div class="top-bar-actions">
      <!-- Sélecteur de langue -->
      <div class="dropdown" ref="languageDropdown">
        <button class="btn-icon dropdown-toggle" @click="toggleLanguage">
          <i class="fas fa-globe"></i>
          <span class="current-lang">{{ currentLanguage.toUpperCase() }}</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="dropdown-menu" :class="{ show: showLanguageMenu }">
          <div class="menu-header">
            <h3>{{ $t('common.language.select') }}</h3>
          </div>
          <div class="menu-items">
            <a 
              href="#" 
              class="menu-item" 
              :class="{ active: currentLanguage === 'fr' }"
              @click.prevent="changeLanguage('fr')"
            >
              <span class="flag">🇫🇷</span>
              <span class="label">{{ $t('common.language.fr') }}</span>
              <i v-if="currentLanguage === 'fr'" class="fas fa-check"></i>
            </a>
            <a 
              href="#" 
              class="menu-item" 
              :class="{ active: currentLanguage === 'en' }"
              @click.prevent="changeLanguage('en')"
            >
              <span class="flag">🇬🇧</span>
              <span class="label">{{ $t('common.language.en') }}</span>
              <i v-if="currentLanguage === 'en'" class="fas fa-check"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Thème -->
      <button class="btn-icon" @click="toggleTheme">
        <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
      </button>

      <!-- Notifications -->
      <div class="notifications-container" ref="notificationsDropdown">
        <button 
          type="button" 
          class="btn-icon notification-btn" 
          :aria-label="$t('topbar.notifications.toggle')"
          @click="toggleNotifications"
        >
          <i class="fas fa-bell"></i>
          <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
        </button>

        <div 
          class="notification-panel" 
          :class="{ show: showNotifications }" 
          role="dialog" 
          aria-labelledby="notification-title"
        >
          <div class="notifications-header">
            <h3 id="notification-title">{{ $t('topbar.notifications.title') }}</h3>
            <button 
              type="button" 
              class="mark-all-read" 
              @click="markAllAsRead"
              :aria-label="$t('topbar.notifications.mark_all_read')"
            >
              <i class="fas fa-check-double"></i>
              <span>{{ $t('topbar.notifications.mark_all_read') }}</span>
            </button>
          </div>

          <div class="notifications-list">
            <div v-if="notifications.length === 0" class="empty-notifications">
              <i class="fas fa-bell-slash"></i>
              <p>{{ $t('topbar.notifications.empty') }}</p>
            </div>

            <div 
              v-else
              v-for="notification in notifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
            >
              <div class="notification-icon">
                <i :class="notification.icon"></i>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">{{ formatTime(notification.time) }}</div>
              </div>
              <button 
                class="notification-action"
                @click="markAsRead(notification.id)"
                v-if="!notification.read"
              >
                <i class="fas fa-check"></i>
              </button>
            </div>
          </div>
          <div class="notifications-footer">
            <router-link to="/notifications" @click="closeNotifications">
              {{ $t('topbar.notifications.view_all') }}
              <i class="fas fa-arrow-right"></i>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Profil -->
      <div class="profile-container" ref="profileDropdown">
        <button class="profile-btn" @click="toggleProfile">
          <img :src="avatarUrl" alt="Avatar" class="avatar">
          <span class="username">{{ username }}</span>
          <i class="fas fa-chevron-down"></i>
        </button>

        <div class="profile-menu" :class="{ show: showProfileMenu }">
          <div class="menu-header">
            <div class="user-info">
              <img :src="avatarUrl" alt="Avatar" class="avatar">
              <div class="user-details">
                <div class="username">{{ username }}</div>
                <div class="email">{{ email }}</div>
              </div>
            </div>
          </div>

          <div class="menu-items">
            <router-link to="/profile" class="menu-item">
              <i class="fas fa-user"></i>
              <span>{{ $t('topbar.profile.my_profile') }}</span>
            </router-link>
            <router-link to="/settings" class="menu-item">
              <i class="fas fa-cog"></i>
              <span>{{ $t('topbar.profile.settings') }}</span>
            </router-link>
            <div class="menu-divider"></div>
            <a href="#" class="menu-item text-red-600" @click.prevent="logout">
              <i class="fas fa-sign-out-alt"></i>
              <span>{{ $t('topbar.profile.logout') }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useThemeStore } from '@/stores/theme'
import { useLanguageStore } from '@/stores/language'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { hash } from '@/utils/hash'

const { t, locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const themeStore = useThemeStore()
const languageStore = useLanguageStore()

// État local
const searchQuery = ref('')
const showLanguageMenu = ref(false)
const showNotifications = ref(false)
const showProfileMenu = ref(false)

// Refs pour les dropdowns
const languageDropdown = ref<HTMLElement | null>(null)
const notificationsDropdown = ref<HTMLElement | null>(null)
const profileDropdown = ref<HTMLElement | null>(null)

// Computed properties
const currentLanguage = computed(() => languageStore.currentLanguage)
const isDarkMode = computed(() => themeStore.isDarkMode)
const unreadCount = computed(() => notificationStore.unreadCount)
const notifications = computed(() => notificationStore.notifications)
const username = computed(() => authStore.user?.username || '')
const email = computed(() => authStore.user?.email || '')
const avatarUrl = computed(() => {
  const hashValue = authStore.user?.email 
    ? hash.md5(authStore.user.email.toLowerCase().trim()) 
    : ''
  return `https://www.gravatar.com/avatar/${hashValue}?s=40&d=identicon`
})

// Méthodes
const handleSearch = () => {
  // Implémenter la recherche
}

const toggleLanguage = () => {
  showLanguageMenu.value = !showLanguageMenu.value
  showNotifications.value = false
  showProfileMenu.value = false
}

const changeLanguage = async (lang: string) => {
  // Mettre à jour la langue dans le store d'authentification
  await authStore.updateLanguage(lang)
  
  // Mettre à jour la langue dans le store de langue
  languageStore.setLanguage(lang)
  
  // Mettre à jour la locale de i18n
  locale.value = lang
  
  // Fermer le menu de langue
  showLanguageMenu.value = false
  
  // Pas besoin de recharger la page, les changements sont appliqués immédiatement
}

const toggleTheme = () => {
  themeStore.toggleDarkMode()
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showLanguageMenu.value = false
  showProfileMenu.value = false
}

const markAsRead = (id: string) => {
  notificationStore.markAsRead(id)
}

const markAllAsRead = () => {
  notificationStore.markAllAsRead()
}

const toggleProfile = () => {
  showProfileMenu.value = !showProfileMenu.value
  showLanguageMenu.value = false
  showNotifications.value = false
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}

const formatTime = (time: string | Date) => {
  const date = typeof time === 'string' ? new Date(time) : time
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: locale.value === 'fr' ? fr : enUS
  })
}

const closeNotifications = () => {
  showNotifications.value = false
}

// Gestionnaire de clic en dehors des menus
const handleClickOutside = (event: MouseEvent) => {
  if (
    languageDropdown.value && 
    !languageDropdown.value.contains(event.target as Node)
  ) {
    showLanguageMenu.value = false
  }
  if (
    notificationsDropdown.value && 
    !notificationsDropdown.value.contains(event.target as Node)
  ) {
    showNotifications.value = false
  }
  if (
    profileDropdown.value && 
    !profileDropdown.value.contains(event.target as Node)
  ) {
    showProfileMenu.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Top Bar */
.top-bar {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 102, 255, 0.1);
  position: relative;
  z-index: 100;
}

.top-bar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, 
      transparent,
      var(--primary-blue),
      var(--secondary-blue),
      transparent
  );
  opacity: 0.3;
}

.search-bar {
  position: relative;
  width: 400px;
}

.search-bar input {
  width: 100%;
  padding: 0.75rem 1.25rem;
  padding-left: 3rem;
  background: rgba(0, 102, 255, 0.05);
  border: 1px solid rgba(0, 102, 255, 0.1);
  border-radius: 12px;
  color: var(--text-color);
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-bar input:focus {
  outline: none;
  background: rgba(0, 102, 255, 0.08);
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
}

.search-bar i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-blue);
  font-size: 1.1rem;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.search-bar input:focus + i {
  opacity: 1;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Boutons */
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(0, 102, 255, 0.1);
  background: var(--glass-bg);
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, var(--primary-blue), var(--secondary-blue));
  border-radius: 12px;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.3s ease;
  opacity: 0.1;
}

.btn-icon:hover::before {
  transform: translate(-50%, -50%) scale(1.5);
}

.btn-icon:hover {
  border-color: var(--primary-blue);
  color: var(--primary-blue);
  transform: translateY(-2px);
}

/* Dropdowns */
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: -10px;
  min-width: 180px;
  background: var(--bg-primary) !important;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px) scale(0.98);
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1),
              transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0s linear 300ms;
  z-index: 9999;
  box-shadow: var(--shadow-lg);
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.dropdown-menu.show {
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1),
              transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0s linear 0s;
}

/* Notifications */
.notifications-container {
  position: relative;
}

.notification-btn {
  position: relative;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--danger);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px var(--bg-primary);
}

.notification-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: -10px;
  width: 320px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 9999;
}

.notification-panel.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.notifications-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notifications-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.mark-all-read {
  font-size: 0.875rem;
  color: var(--primary-blue);
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.mark-all-read:hover {
  background: var(--primary-light);
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: var(--hover-bg);
}

.notification-item.unread {
  background: var(--primary-light);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.empty-notifications {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-notifications i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.notifications-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.notifications-footer a {
  font-size: 0.875rem;
  color: var(--primary-blue);
  text-decoration: none;
}

.notifications-footer a:hover {
  text-decoration: underline;
}

/* Profile */
.profile-container {
  position: relative;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 102, 255, 0.05);
  border: 1px solid rgba(0, 102, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-btn:hover {
  background: rgba(0, 102, 255, 0.08);
  transform: translateY(-2px);
  border-color: var(--primary-blue);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid var(--primary-blue);
  box-shadow: 0 0 15px rgba(0, 102, 255, 0.2);
}

.username {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-color);
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.profile-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: -10px;
  width: 280px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 9999;
}

.profile-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.user-info {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.email {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.menu-items {
  padding: 0.5rem 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.menu-item i {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.menu-item:hover {
  background: var(--hover-bg);
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

/* Responsive */
@media (max-width: 768px) {
  .search-bar {
    display: none;
  }

  .profile-btn {
    padding: 0.5rem;
  }

  .username {
    display: none;
  }
}
</style>
