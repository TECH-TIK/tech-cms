<template>
  <div class="view-container">
    <!-- En-tête avec titre et bouton de rafraîchissement -->
    <div class="header-box">
      <div>
        <h1 class="page-title">{{ t('settings.modules.title') }}</h1>
        <span class="page-description">{{ t('settings.modules.description') || 'Gérez les modules et extensions du système' }}</span>
      </div>
      <button class="btn btn-gradient" :disabled="loading" @click="refreshModules">
        <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
        {{ t('common.refresh') }}
      </button>
    </div>
    
    <!-- Filtres et recherche -->
    <div class="filter-box">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">{{ t('common.search') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="filter-input" 
              :placeholder="t('settings.modules.searchPlaceholder') || 'Rechercher un module...'" 
            >
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('settings.modules.filterByStatus') }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-filter"></i>
            <select v-model="statusFilter" class="filter-input">
              <option value="">{{ t('settings.modules.statusAll') || 'Tous' }}</option>
              <option value="active">{{ t('settings.modules.statusActive') || 'Actifs' }}</option>
              <option value="inactive">{{ t('settings.modules.statusInactive') || 'Inactifs' }}</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">{{ t('settings.modules.filterByType') || 'Type de module' }}</label>
          <div class="filter-input-wrapper">
            <i class="fas fa-tags"></i>
            <select v-model="moduleTypeFilter" class="filter-input">
              <option value="">{{ t('settings.modules.typeAll') || 'Tous les types' }}</option>
              <option v-for="(_, type) in groupedModules" :key="type" :value="type">
                {{ t(`settings.modules.types.${type}`) || type }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <el-tabs v-model="activeTabType" class="module-tabs" @tab-click="handleTabChange">
      <el-tab-pane
        v-for="(modulesList, type) in groupedModules"
        :key="type"
        :label="t(`settings.modules.types.${type}`) || type"
        :name="type"
      >
        <div v-if="loading" class="modules-loading">
          <el-skeleton animated :count="3" />
        </div>
        
        <div v-else class="modules-grid">
          <div
            v-for="(module, name) in filteredModules"
            :key="`${type}-${name}`"
            class="module-wrapper"
          >
            <div 
              class="module-card" 
            >
              <!-- En-tête du module -->
              <div class="module-header">
                <div class="module-info">
                  <h3 class="module-name">{{ module.display_name || module.name }}</h3>
                  <span class="module-version">v{{ module.version }}</span>
                </div>
                <div class="module-actions">
                  <!-- Bouton avec l'icône correspondant au type de module, sans redirection -->
                  <el-tooltip :content="t(`settings.modules.types.${type}`) || type" placement="top">
                    <el-button
                      type="warning"
                      size="small"
                      circle
                      @click="() => {}"
                    >
                      <i class="fas" :class="getModuleTypeIcon(type)"></i>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
              
              <!-- Description du module -->
              <div class="module-description">
                <p>{{ module.description }}</p>
              </div>
              
              <!-- Fonctionnalités du module -->
              <div v-if="module.features && Object.keys(module.features).length > 0" class="module-features">
                <span 
                  v-for="(enabled, feature) in module.features" 
                  :key="feature"
                  :class="['feature-badge', enabled ? 'feature-enabled' : 'feature-disabled']"
                >
                  {{ feature }}
                </span>
              </div>
              
              <!-- Pied de carte -->
              <div class="module-footer">
                <span class="module-author">
                  {{ t('settings.modules.by') }} {{ module.author }}
                </span>
                
                <!-- Bouton d'activation/désactivation -->
                <div class="module-status-control">
                  <button 
                    class="btn btn-xs module-toggle-btn" 
                    :class="module.active ? 'btn-danger' : 'btn-success'"
                    :disabled="loading"
                    @click="toggleModuleStatus(module.type || activeTabType, name, !module.active)"
                  >
                    {{ module.active ? t('common.deactivate') || 'Désactiver' : t('common.activate') || 'Activer' }}
                  </button>
                  <span class="module-status">
                    {{ module.active ? t('settings.modules.active') : t('settings.modules.inactive') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Message si pas de résultats -->
          <div v-if="filteredModules.length === 0 && !loading" class="no-results">
            <i class="fas fa-search"></i>
            <h3>{{ t('settings.modules.noModulesFound') }}</h3>
            <p>
{{ 
              searchQuery ? t('settings.modules.noModulesMatchSearch') : 
              statusFilter ? t('settings.modules.noModulesMatchFilter') : 
              t('settings.modules.noModulesAvailable')
            }}
</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Modal de configuration -->
    <el-dialog
      v-model="configDialogVisible"
      :title="t('settings.modules.configTitle')"
      width="650px"
      class="module-config-dialog"
      :close-on-click-modal="false"
    >
      <el-form v-if="moduleConfigFields.length > 0" class="module-config-form" label-position="top">
        <el-form-item
          v-for="field in moduleConfigFields"
          :key="field.name"
          :label="field.label"
        >
          <!-- Champ text -->
          <el-input
            v-if="field.type === 'text'"
            v-model="moduleConfigValues[field.name]"
            :placeholder="field.placeholder || ''"
          />
          
          <!-- Champ password -->
          <el-input
            v-else-if="field.type === 'password'"
            v-model="moduleConfigValues[field.name]"
            type="password"
            :placeholder="field.placeholder || ''"
            show-password
          />
          
          <!-- Champ select -->
          <el-select
            v-else-if="field.type === 'select'"
            v-model="moduleConfigValues[field.name]"
            :placeholder="field.placeholder || t('common.select')"
            style="width: 100%;"
          >
            <el-option
              v-for="option in field.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          
          <!-- Champ nombre -->
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="moduleConfigValues[field.name]"
            :min="field.min || 0"
            :max="field.max || Infinity"
            style="width: 100%;"
          />
          
          <!-- Champ boolean -->
          <el-switch
            v-else-if="field.type === 'boolean'"
            v-model="moduleConfigValues[field.name]"
            active-color="#0066FF"
          />
          
          <!-- Description du champ -->
          <div v-if="field.description" class="field-description">
            <small>{{ field.description }}</small>
          </div>
        </el-form-item>
      </el-form>
      
      <div v-else class="no-config">
        <i class="el-icon-info-circle"></i>
        <p>{{ t('settings.modules.noConfigAvailable') }}</p>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="configDialogVisible = false">
            {{ t('common.cancel') }}
          </el-button>
          <el-button
            type="primary"
            :loading="savingConfig"
            @click="saveModuleConfig"
          >
            {{ t('common.save') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notifications';
import { ApiService } from '@/services/api';
import { useI18n } from 'vue-i18n';
import logger from '@/services/logger';

const { t } = useI18n();
const notificationStore = useNotificationStore();

// États
const modules = ref({});
const loading = ref(true);
const activeTabType = ref('servers'); // Type par défaut
const searchQuery = ref('');
const statusFilter = ref('');
const moduleTypeFilter = ref('');
// Variable moduleTestingStatus supprimée car plus nécessaire
const savingConfig = ref(false);

// État pour le dialogue de configuration
const configDialogVisible = ref(false);
const currentModuleType = ref('');
const currentModuleName = ref('');
const moduleConfigFields = ref([]);
const moduleConfigValues = ref({});

// Calcul des modules groupés par type
const groupedModules = computed(() => {
  const grouped = {};
  
  Object.entries(modules.value).forEach(([type, moduleList]) => {
    if (Object.keys(moduleList).length > 0) {
      grouped[type] = moduleList;
    }
  });
  
  return grouped;
});

// Filtrage des modules selon la recherche et les filtres
const filteredModules = computed(() => {
  // Déterminer le type de module à afficher
  const currentType = moduleTypeFilter.value || activeTabType.value;
  
  if (!currentType || !groupedModules.value[currentType]) {
    return {};
  }
  
  let filtered = { ...groupedModules.value[currentType] };
  
  // Filtre par terme de recherche
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    filtered = Object.fromEntries(
      Object.entries(filtered).filter(([_, module]) => {
        return (
          module.name.toLowerCase().includes(search) ||
          module.description.toLowerCase().includes(search) ||
          module.author.toLowerCase().includes(search)
        );
      })
    );
  }
  
  // Filtre par statut
  if (statusFilter.value) {
    filtered = Object.fromEntries(
      Object.entries(filtered).filter(([_, module]) => {
        return statusFilter.value === 'active' ? module.active : !module.active;
      })
    );
  }
  
  return filtered;
});

// Chargement des modules au montage du composant
onMounted(async () => {
  await loadModules();
});

/**
 * Récupère la liste de tous les modules
 */
async function loadModules() {
  loading.value = true;
  try {
    const response = await ApiService.routes.admin.module.list();
    if (response.data && response.data.success) {
      modules.value = response.data.data;
      
      // Si aucun module du type actif n'est disponible, choisir le premier type disponible
      if (Object.keys(groupedModules.value).length > 0 && !groupedModules.value[activeTabType.value]) {
        const availableTypes = Object.keys(groupedModules.value);
        if (availableTypes.length > 0) {
          activeTabType.value = availableTypes[0];
        }
      }
    } else {
      notificationStore.notificationError(t('settings.modules.loadError'));
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des modules', { error });
    notificationStore.notificationError(t('settings.modules.loadError'));
  } finally {
    loading.value = false;
  }
}

/**
 * Rafraîchit la liste des modules
 */
async function refreshModules() {
  await loadModules();
  notificationStore.notificationSuccess(t('settings.modules.refreshSuccess'));
}

/**
 * Gère le changement d'onglet
 */
function handleTabChange(tab) {
  activeTabType.value = tab.props.name;
}

/**
 * Active ou désactive un module
 */
async function toggleModuleStatus(type, name, isActive) {
  try {
    // Vérifier que les paramètres sont bien définis
    if (!type || !name) {
      logger.error('Type ou nom de module manquant', { type, name });
      notificationStore.notificationError("Erreur: type ou nom de module manquant");
      return;
    }
    
    // Débuguer les valeurs des paramètres
    logger.debug('toggleModuleStatus paramètres', { type, name, isActive });
    
    // Appeler l'API pour activer/désactiver le module
    const action = isActive ? 'activate' : 'deactivate';
    const payload = {
      type: type,
      name: name
    };
    
    logger.debug(`Appel API modules/${action} avec payload`, { payload });
    
    // Préparer les données pour l'API centrallisée
    const data = { type, name };
    
    logger.debug('Envoi des données via API centralisée', data);
    
    // Utiliser la route API centralisée appropriée selon l'action
    const response = isActive 
      ? await ApiService.routes.admin.module.activate(data)
      : await ApiService.routes.admin.module.deactivate(data);
    
    logger.debug(`Réponse API modules/${action} pour ${type}/${name}`, { response: response.data });
    
    if (response.data && response.data.success) {
      // Mettre à jour l'état du module
      if (modules.value?.[type]?.[name]) {
        modules.value[type][name].active = isActive;
      }
      
      const message = isActive 
        ? `Module ${name} activé avec succès`
        : `Module ${name} désactivé avec succès`;
      
      // Utilisation de la méthode 'success' qui existe dans le store
      notificationStore.success(message);
    } else {
      // Rétablir l'état précédent en cas d'erreur
      if (modules.value?.[type]?.[name]) {
        modules.value[type][name].active = !isActive;
      }
      
      notificationStore.notificationError(response.data?.message || "Erreur lors de l'action sur le module");
    }
  } catch (error) {
    logger.error('Erreur lors de la modification du statut du module', { moduleType: type, moduleName: name, error });
    
    // Rétablir l'état précédent en cas d'erreur
    if (modules.value?.[type]?.[name]) {
      modules.value[type][name].active = !isActive;
    }
    
    notificationStore.notificationError(
      error.response?.data?.message || "Erreur lors de l'action sur le module"
    );
  }
}

// La fonction testModule a été supprimée car la fonctionnalité n'est plus nécessaire

/**
 * Renvoie la classe d'icône FontAwesome appropriée selon le type de module
 */
function getModuleTypeIcon(type) {
  const iconMap = {
    'servers': 'fa-server',
    'gateways': 'fa-credit-card',
    'addons': 'fa-puzzle-piece',
    'fraud': 'fa-shield-alt',
    'registrars': 'fa-globe',
    'reports': 'fa-chart-bar',
    'widgets': 'fa-th'
  };
  
  return iconMap[type] || 'fa-cube';
}

/**
 * Enregistre la configuration d'un module
 */
async function saveModuleConfig() {
  savingConfig.value = true;
  
  try {
    const response = await axios.post('/api/v1/modules/saveconfig', {
      type: currentModuleType.value,
      name: currentModuleName.value,
      config: moduleConfigValues.value
    });
    
    if (response.data && response.data.success) {
      configDialogVisible.value = false;
      notificationStore.notificationSuccess('Configuration enregistrée avec succès');
      
      // Notification simple après sauvegarde
      notificationStore.notificationInfo('Configuration enregistrée. N\'oubliez pas de configurer vos serveurs.');
    } else {
      notificationStore.notificationError(
        response.data?.message || 'Erreur lors de la sauvegarde de la configuration'
      );
    }
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement de la configuration', { moduleType: currentModuleType.value, moduleName: currentModuleName.value, error });
    notificationStore.notificationError(
      error.response?.data?.message || 'Erreur lors de la sauvegarde de la configuration'
    );
  } finally {
    savingConfig.value = false;
  }
}
</script>

<style>
@import '@/assets/css/pages/modules.css';
@import '@/assets/css/components/common-layout.css';

/* Styles spécifiques au composant */
.field-description {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.no-config {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}

.no-config i {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

/* Style pour les onglets */
.module-tabs {
  margin-top: 1.5rem;
  background: var(--bg-color);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  padding: 1rem;
}

/* Style pour le bouton d'activation/désactivation */
.module-toggle-btn {
  font-size: 0.75rem;
  padding: 2px 6px;
  margin-right: 8px;
  min-width: 70px;
}

/* Style pour le statut du module */
.module-status {
  font-size: 0.85rem;
  color: #fff;
}

/* Centrer verticalement les éléments dans le pied de carte */
.module-status-control {
  display: flex;
  align-items: center;
}
</style>