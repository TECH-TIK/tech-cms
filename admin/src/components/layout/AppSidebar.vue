<template>
  <aside class="sidebar" data-component="sidebar">
    <div class="sidebar-header">
      <router-link to="/dashboard" class="logo">
        <img src="@/assets/img/logo.png" alt="TechCMS">
      </router-link>
      <button class="sidebar-toggle" @click="toggleSidebar">
        <i class="fas fa-bars"></i>
      </button>
    </div>
    
    <nav class="sidebar-nav">
      <ul>
        <li :class="{ active: route.name === 'dashboard' }">
          <router-link to="/dashboard">
            <i class="fas fa-home"></i>
            <span>{{ $t('sidebar.menu.dashboard') }}</span>
          </router-link>
        </li>

        <li :class="{ active: route.name === 'clients' }">
          <router-link to="/clients">
            <i class="fas fa-users"></i>
            <span>{{ $t('sidebar.menu.clients') }}</span>
          </router-link>
        </li>

        <li class="has-submenu" :class="{ 'submenu-open': openSubmenus.includes('catalogue') }">
          <a href="#" class="menu-toggle" :class="{ active: route.name === 'services' || route.name === 'products' }" @click.prevent="toggleSubmenu('catalogue')">
            <i class="fas fa-cube"></i>
            <span>{{ $t('sidebar.menu.catalog.title') }}</span>
            <i class="fas fa-chevron-right menu-arrow"></i>
          </a>
          <ul class="submenu" :class="{ show: openSubmenus.includes('catalogue') }">
            <li :class="{ active: route.name === 'services' }">
              <router-link to="/services">
                <i class="fas fa-cogs"></i>
                <span>{{ $t('sidebar.menu.catalog.services') }}</span>
              </router-link>
            </li>
            <li :class="{ active: route.name === 'products' }">
              <router-link to="/products">
                <i class="fas fa-box"></i>
                <span>{{ $t('sidebar.menu.catalog.products') }}</span>
              </router-link>
            </li>
          </ul>
        </li>

        <li class="has-submenu" :class="{ 'submenu-open': openSubmenus.includes('billing') }">
          <a href="#" class="menu-toggle" :class="{ active: route.name === 'invoices' || route.name === 'payments' || route.name === 'subscriptions' }" @click.prevent="toggleSubmenu('billing')">
            <i class="fas fa-file-invoice-dollar"></i>
            <span>{{ $t('sidebar.menu.billing.title') }}</span>
            <i class="fas fa-chevron-right menu-arrow"></i>
          </a>
          <ul class="submenu" :class="{ show: openSubmenus.includes('billing') }">
            <li :class="{ active: route.name === 'invoices' }">
              <router-link to="/invoices">
                <i class="fas fa-file-invoice"></i>
                <span>{{ $t('sidebar.menu.billing.invoices') }}</span>
              </router-link>
            </li>
            <li :class="{ active: route.name === 'payments' }">
              <router-link to="/payments">
                <i class="fas fa-credit-card"></i>
                <span>{{ $t('sidebar.menu.billing.payments') }}</span>
              </router-link>
            </li>
            <li :class="{ active: route.name === 'subscriptions' }">
              <router-link to="/subscriptions">
                <i class="fas fa-sync"></i>
                <span>{{ $t('sidebar.menu.billing.subscriptions') }}</span>
              </router-link>
            </li>
          </ul>
        </li>

        <li class="has-submenu" :class="{ 'submenu-open': openSubmenus.includes('support') }">
          <a href="#" class="menu-toggle" :class="{ active: route.name === 'tickets' || route.name === 'kb' }" @click.prevent="toggleSubmenu('support')">
            <i class="fas fa-headset"></i>
            <span>{{ $t('sidebar.menu.support.title') }}</span>
            <span v-if="openTickets > 0" class="badge">{{ openTickets }}</span>
            <i class="fas fa-chevron-right menu-arrow"></i>
          </a>
          <ul class="submenu" :class="{ show: openSubmenus.includes('support') }">
            <li :class="{ active: route.name === 'tickets' }">
              <router-link to="/tickets">
                <i class="fas fa-ticket-alt"></i>
                <span>{{ $t('sidebar.menu.support.tickets') }}</span>
              </router-link>
            </li>
            <li :class="{ active: route.name === 'kb' }">
              <router-link to="/kb">
                <i class="fas fa-book"></i>
                <span>{{ $t('sidebar.menu.support.kb') }}</span>
              </router-link>
            </li>
          </ul>
        </li>

        <li :class="{ active: route.name === 'settings' }">
          <router-link to="/settings">
            <i class="fas fa-cog"></i>
            <span>{{ $t('sidebar.menu.settings') }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notifications'

const route = useRoute()
const { t } = useI18n()
const notificationStore = useNotificationStore()

const openSubmenus = ref<string[]>([])
const openTickets = computed(() => notificationStore.unreadCount)

const toggleSubmenu = (menu: string) => {
  console.log('Tentative d\'ouverture du sous-menu:', menu)
  const index = openSubmenus.value.indexOf(menu)
  
  // Si le menu n’était pas ouvert, l’ouvrir
  if (index === -1) {
    // Fermer tous les autres sous-menus
    openSubmenus.value = [menu]
    console.log(`Sous-menu ${menu} ouvert`)
  } else {
    // Sinon, le fermer
    openSubmenus.value = []
    console.log(`Sous-menu ${menu} fermé`)
  }
  
  console.log('État des sous-menus après toggle:', openSubmenus.value)
}

// Ouvrir automatiquement le sous-menu parent de la route actuelle
onMounted(() => {
  console.log('Route actuelle:', route.name)
  
  // Déterminer quel sous-menu ouvrir en fonction de la route actuelle
  const name = route.name?.toString() || ''
  let menuToOpen = ''
  
  if (name === 'services' || name === 'products') {
    menuToOpen = 'catalogue'
  } else if (name === 'invoices' || name === 'payments' || name === 'subscriptions') {
    menuToOpen = 'billing'
  } else if (name === 'tickets' || name === 'kb') {
    menuToOpen = 'support'
  }
  
  console.log('Menu à ouvrir:', menuToOpen)
  if (menuToOpen && !openSubmenus.value.includes(menuToOpen)) {
    openSubmenus.value.push(menuToOpen)
  }
})

const toggleSidebar = () => {
  document.body.classList.toggle('sidebar-collapsed')
}
</script>

<style scoped>
.sidebar {
  @apply fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-all duration-300;
}

.sidebar-header {
  @apply flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700;
}

.logo {
  @apply flex items-center;
}

.logo img {
  @apply h-8 w-auto;
}

.sidebar-toggle {
  @apply p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700;
}

.sidebar-nav {
  @apply p-4 h-[calc(100% - 4rem)] overflow-y-auto;
}

.sidebar-nav ul {
  @apply space-y-2;
}

.sidebar-nav li {
  @apply rounded-lg overflow-hidden;
}

.sidebar-nav li a {
  @apply flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg;
}

/* Style pour les liens actifs dans le menu principal */
.sidebar-nav > ul > li.active > a {
  @apply bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-300;
}

/* Style pour les liens actifs dans les sous-menus */
.sidebar-nav .submenu li.active > a {
  @apply bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-300;
}

.sidebar-nav li a i {
  @apply mr-3 text-lg;
}

.menu-arrow {
  @apply ml-auto transition-transform duration-300 ease-in-out;
}

.has-submenu > a .menu-arrow {
  transform: rotate(0deg);
}

.submenu-open > a .menu-arrow {
  transform: rotate(90deg);
}

.submenu {
  @apply ml-4 mt-1 overflow-hidden transition-all duration-300 ease-in-out;
  display: none;
}

.submenu.show {
  display: block;
}

.badge {
  @apply ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-full;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    @apply transform -translate-x-full;
  }

  .sidebar-collapsed .sidebar {
    @apply translate-x-0;
  }
}

.submenu-open {
  @apply bg-gray-100 dark:bg-gray-700;
}

.submenu-open > a {
  @apply bg-gray-100 dark:bg-gray-700;
}

/* Assurer que seul le sous-menu actif est mis en évidence */
.sidebar-nav .submenu li:not(.active) > a {
  @apply bg-transparent text-gray-700 dark:text-gray-300;
}
</style>
