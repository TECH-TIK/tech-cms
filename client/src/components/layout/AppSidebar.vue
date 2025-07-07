<template>
  <aside class="client-sidebar" :class="{ 'sidebar-collapsed': collapsed }">
    <div class="sidebar-header">
      <router-link to="/dashboard" class="logo">
        <img src="@/assets/logo.png" alt="TechCMS" class="logo-img">
        <span v-if="!collapsed" class="logo-text">TechCMS</span>
      </router-link>
      <button class="sidebar-toggle" @click="toggleSidebar">
        <i class="fas fa-bars"></i>
      </button>
    </div>
    
    <!-- Indicateur client supprimé -->
    
    <nav class="sidebar-nav">
      <ul>
        <li :class="{ active: $route.name === 'dashboard' }">
          <router-link to="/dashboard" class="nav-link">
            <i class="fas fa-home"></i>
            <span v-if="!collapsed">{{ $t('dashboard.title') }}</span>
          </router-link>
        </li>

        <li :class="{ active: $route.name === 'services' }">
          <router-link to="/services" class="nav-link">
            <i class="fas fa-server"></i>
            <span v-if="!collapsed">{{ $t('services.title') }}</span>
          </router-link>
        </li>

        <li :class="{ active: $route.name === 'billing' }">
          <router-link to="/billing" class="nav-link">
            <i class="fas fa-file-invoice"></i>
            <span v-if="!collapsed">{{ $t('billing.title') }}</span>
          </router-link>
        </li>

        <li :class="{ active: $route.name === 'support' }">
          <router-link to="/support" class="nav-link">
            <i class="fas fa-headset"></i>
            <span v-if="!collapsed">{{ $t('support.title') }}</span>
          </router-link>
        </li>

        <li :class="{ active: $route.name === 'account' }">
          <router-link to="/account" class="nav-link">
            <i class="fas fa-user-cog"></i>
            <span v-if="!collapsed">{{ $t('account.title') }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer" v-if="!collapsed">
      <div class="user-info">
        <div class="user-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="user-details" v-if="authStore.isAuthenticated">
          <div class="user-name">{{ authStore.userFullName }}</div>
          <div class="user-email">{{ authStore.user?.email }}</div>
        </div>
        <div class="user-details" v-else-if="authStore.loading">
          <div class="user-name">{{ $t('common.loading') }}</div>
          <div class="user-email">---</div>
        </div>
        <div class="user-details" v-else>
          <div class="user-name">{{ $t('auth.not_connected') }}</div>
          <div class="user-email">---</div>
        </div>
      </div>
      <button class="logout-btn" @click="handleLogout" :disabled="authStore.loading">
        <i class="fas fa-sign-out-alt"></i>
        <span>{{ $t('auth.logout') }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

interface Props {
  collapsed: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'sidebar-toggle': []
}>()

const authStore = useAuthStore()
const router = useRouter()

const toggleSidebar = () => {
  emit('sidebar-toggle')
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/client/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

// Initialiser le store d'authentification au montage
onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.initialize()
  }
})
</script>

<style scoped>
@import '@/assets/css/layouts/sidebar.css';
</style>
