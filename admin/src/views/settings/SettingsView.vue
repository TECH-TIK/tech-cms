<template>
  <div class="settings-view view-container">
    <div class="header-box">
      <div>
        <h1>{{ t('settings.title') }}</h1>
        <div class="page-description">{{ t('settings.description') }}</div>
      </div>
    </div>

    <!-- Indicateur de chargement -->
    <div v-if="loading" class="loading-state">
      <div class="loading-state-icon">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <div class="loading-state-text">{{ t('common.loading') }}</div>
    </div>

    <!-- Grille de paramètres -->
    <div v-else class="settings-grid">
      <div v-for="(setting, index) in settingsBoxes" :key="index" class="settings-box" @click="navigateTo(setting.route)">
        <div class="settings-box-header">
          <div class="settings-box-icon">
            <i :class="setting.icon"></i>
          </div>
          <div>
            <h3 class="settings-box-title">
              {{ setting.title }}
              <span v-if="setting.badge" class="settings-box-badge">{{ setting.badge }}</span>
            </h3>
          </div>
        </div>
        <p class="settings-box-description">{{ setting.description }}</p>
        <div class="settings-box-actions">
          <button class="btn btn-secondary">
            <i class="fas fa-cog"></i> {{ t('common.configure') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notifications'
import '@/assets/css/components/common-layout.css'
import '@/assets/css/pages/settings.css'

const { t } = useI18n()
const router = useRouter()
const notificationStore = useNotificationStore()

// État
const loading = ref(true)

// Définition des boxes de paramètres
const settingsBoxes = computed(() => [
  { 
    id: 'general', 
    title: t('settings.general.title'), 
    description: t('settings.general.description'), 
    icon: 'fas fa-cog',
    route: '/settings/general'
  },
  { 
    id: 'notifications', 
    title: t('settings.notifications.title'), 
    description: t('settings.notifications.description'), 
    icon: 'fas fa-bell',
    route: '/settings/notifications'
  },
  { 
    id: 'security', 
    title: t('settings.security.title'), 
    description: t('settings.security.description'), 
    icon: 'fas fa-shield-alt',
    route: '/settings/security'
  },
  { 
    id: 'billing', 
    title: t('settings.billing.title'), 
    description: t('settings.billing.description'), 
    icon: 'fas fa-file-invoice-dollar',
    route: '/settings/billing'
  },
  { 
    id: 'servers', 
    title: t('settings.servers.title'), 
    description: t('settings.servers.description'), 
    icon: 'fas fa-server',
    route: '/settings/servers'
  },
  { 
    id: 'integrations', 
    title: t('settings.integrations.title'), 
    description: t('settings.integrations.description'), 
    icon: 'fas fa-plug',
    badge: 'API',
    route: '/settings/integrations'
  },
  { 
    id: 'license', 
    title: t('settings.license.title'), 
    description: t('settings.license.description'), 
    icon: 'fas fa-key',
    route: '/settings/license'
  }
])

// Méthodes
const navigateTo = (route) => {
  router.push(route)
}

// Cycle de vie
onMounted(async () => {
  try {
    // Juste pour simuler un chargement
    setTimeout(() => {
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('Error loading settings:', error)
    notificationStore.notificationError(t('common.errorLoading'))
  }
})
</script>

<style scoped>
.settings-view {
  width: 100%;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.settings-box {
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.settings-box:hover {
  transform: translateY(-5px);
}

.settings-box-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.settings-box-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 18px;
}

.settings-box-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
}

.settings-box-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 10px;
}

.settings-box-description {
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.5;
  flex-grow: 1;
}

.settings-box-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}
</style>
