<template>
  <aside class="sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }" data-component="sidebar">
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

        <li :class="{ active: route.name && route.name.toString().includes('service') }">
          <router-link to="/services">
            <i class="fas fa-server"></i>
            <span>{{ $t('sidebar.menu.services') }}</span>
          </router-link>
        </li>

        <li class="has-submenu" :class="{ 'submenu-open': openSubmenus.includes('catalogue') }">
          <a href="#" class="menu-toggle" :class="{ active: route.name === 'products' }" @click.prevent="toggleSubmenu('catalogue')">
            <i class="fas fa-cube"></i>
            <span>{{ $t('sidebar.menu.catalog.title') }}</span>
            <i class="fas fa-chevron-right menu-arrow"></i>
          </a>
          <ul class="submenu" :class="{ show: openSubmenus.includes('catalogue') }">
            <li :class="{ active: route.name === 'products' }">
              <router-link to="/products">
                <i class="fas fa-cogs"></i>
                <span>{{ $t('sidebar.menu.catalog.products_services') }}</span>
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

        <li :class="{ active: route.name === 'system-updates' }">
          <router-link to="/system/updates">
            <i class="fas fa-download"></i>
            <span>{{ $t('sidebar.menu.system_updates') }}</span>
          </router-link>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

import { useNotificationStore } from '@/stores/notifications'
import logger from '@/services/logger'

const route = useRoute()

const notificationStore = useNotificationStore()

const openSubmenus = ref<string[]>([])
const openTickets = computed(() => notificationStore.unreadCount)

const toggleSubmenu = (menu: string) => {
  logger.debug('Tentative d\'ouverture du sous-menu', { menu })
  const index = openSubmenus.value.indexOf(menu)
  
  // Si le menu n'était pas ouvert, l'ouvrir
  if (index === -1) {
    // Fermer tous les autres sous-menus
    openSubmenus.value = [menu]
    logger.debug(`Sous-menu ${menu} ouvert`)
  } else {
    // Sinon, le fermer
    openSubmenus.value = []
    logger.debug(`Sous-menu ${menu} fermé`)
  }
  
  logger.debug('État des sous-menus après toggle', { submenus: openSubmenus.value })
}

// Ouvrir automatiquement le sous-menu parent de la route actuelle
onMounted(() => {
  logger.debug('Route actuelle', { route: route.name })
  
  // Déterminer quel sous-menu ouvrir en fonction de la route actuelle
  const name = route.name?.toString() || ''
  let menuToOpen = ''
  
  if (name === 'products') {
    menuToOpen = 'catalogue'
  } else if (name === 'invoices' || name === 'payments' || name === 'subscriptions') {
    menuToOpen = 'billing'
  } else if (name === 'tickets' || name === 'kb') {
    menuToOpen = 'support'
  }
  
  logger.debug('Menu à ouvrir', { menu: menuToOpen })
  if (menuToOpen && !openSubmenus.value.includes(menuToOpen)) {
    openSubmenus.value.push(menuToOpen)
  }
  
  // Ajouter un écouteur pour fermer la sidebar quand on clique en dehors sur mobile
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  // Nettoyer l'écouteur d'événements lors de la destruction du composant
  document.removeEventListener('click', handleOutsideClick)
})

const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  document.body.classList.toggle('sidebar-collapsed')
}

// Fonction pour fermer la sidebar quand on clique en dehors sur mobile
const handleOutsideClick = (event: MouseEvent) => {
  // Vérifier si la sidebar est ouverte et si on est en mode mobile
  if (document.body.classList.contains('sidebar-open') && window.innerWidth <= 768) {
    // Vérifier si le clic est en dehors de la sidebar
    const sidebar = document.querySelector('.sidebar')
    const sidebarToggle = document.querySelector('.sidebar-toggle')
    
    // Conversion de EventTarget en Node pour la compatibilité avec la méthode contains
    const target = event.target as Node;
    
    if (sidebar && !sidebar.contains(target) && 
        sidebarToggle && !sidebarToggle.contains(target)) {
      // Fermer la sidebar
      document.body.classList.remove('sidebar-open')
    }
  }
}
</script>


