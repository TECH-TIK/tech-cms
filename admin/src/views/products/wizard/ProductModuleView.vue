<template>
  <div class="product-module-page">
<div class="module-section">
      <p class="section-description">
        {{ t('products_services.module.description') }}
      </p>

      <div v-if="loading" class="text-center" style="padding: var(--spacing-xl)">
        <div class="spinner-loading" style="margin: 0 auto;"></div>
      </div>

      <template v-else>
        <h3 class="module-section-title">{{ t('products_services.module.select_module') }}</h3>
        
        <div class="module-options">
          <div 
            v-for="(module, name) in availableModules.servers" 
            :key="name"
            class="module-card"
            :class="{ 'selected': selectedModule === name }"
            @click="selectModule(name)"
          >
            <div class="module-icon">
              <img v-if="module.logo" :src="`/${module.logo}`" :alt="`${module.name} logo`" class="module-logo-img" />
              <i v-else class="fas fa-server"></i>
            </div>
            <h4 class="module-name">{{ module.name }}</h4>
            <p class="module-description">{{ module.description }}</p>
          </div>
        </div>
        
        <div v-if="selectedModule" class="provision-options mt-l">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="module-section-title mb-0">{{ t('products_services.module.provision_settings') }}</h3>
            <div class="btn-group">
              <button 
                type="button" 
                class="btn"
                :class="{'btn-primary': configMode === 'simple', 'btn-secondary': configMode !== 'simple'}"
                @click="configMode = 'simple'"
              >
                {{ t('common.simple') }}
              </button>
              <button 
                type="button" 
                class="btn" 
                :class="{'btn-primary': configMode === 'advanced', 'btn-secondary': configMode !== 'advanced'}"
                @click="configMode = 'advanced'"
              >
                {{ t('common.advanced') }}
              </button>
            </div>
          </div>
          
          <div v-if="loadingCompatibleServers" class="text-center py-l">
            <div class="spinner-loading mx-auto"></div>
          </div>
          
          <template v-else>
            <template v-if="compatibleServers.length > 0">
              <div class="form-group mb-3">
                <label class="form-label">{{ t('products_services.module.select_server') }}</label>
                <select 
                  v-model="moduleSettings.server_id" 
                  class="form-control" 
                  required
                >
                  <option value="" selected>{{ t('products_services.module.select_server_placeholder') || 'Sélectionnez un serveur' }}</option>
                  <option v-for="server in compatibleServers" :key="server.value" :value="server.value">
                    {{ server.label }}
                  </option>
                </select>
              </div>
            </template>
            <p v-else class="text-center">
              {{ t('products_services.module.no_compatible_servers') }}
            </p>
            
            <div v-if="loadingConfigOptions" class="text-center py-l">
              <div class="spinner-loading mx-auto"></div>
            </div>
            
            <div v-if="moduleSettings.server_id && serverConfigOptions" class="server-config-options mt-l">
              <!-- Sélecteur de package (uniquement en mode simple) -->
              <div v-if="configMode === 'simple' && packageOptions.length > 0" class="form-group mb-3">
                <label for="package_name" class="form-label">{{ t('products_services.module.package_name') || 'Package' }}</label>
                <select 
                  id="package_name" 
                  v-model="moduleSettings.package_name"
                  class="form-select"
                  @change="logPackageSelection"
                >
                  <option :value="null">{{ t('common.select') || 'Sélectionner...' }}</option>
                  <option v-for="option in packageOptions" :key="option.value" :value="option.value">
                    {{ option.text }}
                  </option>
                </select>
                <small class="text-muted d-block mt-1">
                  {{ t('products_services.module.package_name_help') || 'Sélectionnez le package à provisionner pour ce produit.' }}
                </small>
              </div>
              
              <!-- Autres options de configuration serveur -->
              <div class="config-grid">
                <!-- Rendu des options en fonction de leur type -->
                <div 
                  v-for="option in otherConfigOptions" 
                  :key="option.name" 
                  class="form-group mb-3"
                >
                  <label class="form-label">{{ option.label }}</label>
                  
                  <!-- Select pour les options de type select -->
                  <select 
                    v-if="option.type === 'select'" 
                    v-model="moduleSettings[option.name]" 
                    class="form-control"
                    :required="option.validation === 'required'"
                  >
                    <option v-if="option.placeholder" value="">{{ option.placeholder }}</option>
                    <option 
                      v-for="opt in option.options" 
                      :key="opt.value" 
                      :value="opt.value"
                    >
                      {{ opt.text || opt.label || opt.value }}
                    </option>
                  </select>
                  
                  <!-- Input text pour les options de type text -->
                  <input 
                    v-else-if="option.type === 'text'" 
                    v-model="moduleSettings[option.name]" 
                    type="text" 
                    class="form-control"
                    :placeholder="option.placeholder"
                    :required="option.validation === 'required'"
                  />
                  
                  <!-- Input number pour les options de type number -->
                  <input 
                    v-else-if="option.type === 'number'" 
                    v-model="moduleSettings[option.name]" 
                    type="number" 
                    class="form-control"
                    :placeholder="option.placeholder"
                    :required="option.validation === 'required'"
                  />
                  
                  <!-- Input password pour les options de type password -->
                  <input 
                    v-else-if="option.type === 'password'" 
                    v-model="moduleSettings[option.name]" 
                    type="password" 
                    class="form-control"
                    :placeholder="option.placeholder"
                    :required="option.validation === 'required'"
                  />
                  
                  <!-- Checkbox pour les options de type checkbox -->
                  <div v-else-if="option.type === 'checkbox'" class="form-check">
                    <input 
                      :id="'checkbox-' + option.name" 
                      v-model="moduleSettings[option.name]" 
                      type="checkbox" 
                      class="form-check-input"
                    />
                    <label :for="'checkbox-' + option.name" class="form-check-label">{{ option.label }}</label>
                  </div>
                  
                  <!-- Fallback pour les autres types -->
                  <input 
                    v-else 
                    v-model="moduleSettings[option.name]" 
                    type="text" 
                    class="form-control"
                    :placeholder="option.placeholder"
                  />
                  
                  <!-- Afficher les messages d'aide si disponibles -->
                  <small v-if="option.help" class="form-text text-muted">{{ option.help }}</small>
                </div>
</div>
            </div>
          </template>
        </div>
      </template>
      
      <!-- Options de provisionnement automatique style image -->
      <div v-if="selectedModule" class="card my-3">
        <div class="card-header bg-primary-subtle">
          <h5 class="mb-0">{{ t('products_services.module.auto_provisioning_options') || 'Options de provisionnement automatique' }}</h5>
        </div>
        <div class="card-body">
          <p class="text-muted mb-3">
            {{ t('products_services.module.auto_provision_intro') || 'Définissez quand le produit sera automatiquement configuré.' }}
          </p>
          
          <!-- Options de provisionnement avec boutons radio comme sur l'image -->
          <div class="provisioning-options">
            <div class="form-check mb-2">
              <input 
                id="provisioning_immediate" 
                v-model="moduleSettings.provisioning_type" 
                type="radio"
                class="form-check-input" 
                value="auto_setup_on_order"
              />
              <label for="provisioning_immediate" class="form-check-label">
                {{ t('products_services.module.provisioning_immediate_full') || 'Configurer automatiquement le produit dès qu\'une commande est passée' }}
              </label>
            </div>
            
            <div class="form-check mb-2">
              <input 
                id="provisioning_payment" 
                v-model="moduleSettings.provisioning_type" 
                type="radio"
                class="form-check-input" 
                value="auto_setup_on_payment"
              />
              <label for="provisioning_payment" class="form-check-label">
                {{ t('products_services.module.provisioning_payment_full') || 'Configurer automatiquement le produit dès réception du premier paiement' }}
              </label>
            </div>
            
            <div class="form-check mb-2">
              <input 
                id="provisioning_manual_accept" 
                v-model="moduleSettings.provisioning_type" 
                type="radio"
                class="form-check-input" 
                value="manual_accept"
              />
              <label for="provisioning_manual_accept" class="form-check-label">
                {{ t('products_services.module.provisioning_manual_accept_full') || 'Configurer automatiquement le produit lorsque vous acceptez manuellement une commande en attente' }}
              </label>
            </div>
            
            <div class="form-check mb-2">
              <input 
                id="provisioning_manual" 
                v-model="moduleSettings.provisioning_type" 
                type="radio"
                class="form-check-input" 
                value="manual"
              />
              <label for="provisioning_manual" class="form-check-label">
                {{ t('products_services.module.provisioning_manual_full') || 'Ne pas configurer automatiquement ce produit' }}
              </label>
            </div>
          </div>

          <!-- Note: Le groupe de produit est géré dans ProductDetailsView.vue -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ApiService } from '@/services/api'
import { useProductWizardStore } from '@/stores/product-wizard'
import { useI18n } from 'vue-i18n'
import logger from '@/services/logger'
// import { useNotificationStore } from '@/stores/notifications' // Unused for now

const { t } = useI18n()
const productWizardStore = useProductWizardStore()
// const notificationStore = useNotificationStore() // Unused for now

// --- State ---

const availableModules = ref({ servers: {} })
const loading = ref(true)
const selectedModule = ref(productWizardStore.productData.module || null)
const productGroups = ref([])

const moduleSettings = ref({
  module_name: productWizardStore.productData.module || null,
  server_id: productWizardStore.productData.server_id || null,
  server_group: productWizardStore.productData.server_group || null,
  package_name: productWizardStore.productData.package_name || null,
  // Option de provisionnement comme boutons radio
  provisioning_type: productWizardStore.productData.provisioning_type || 'manual',
  group_id: productWizardStore.productData.group_id || null
})

const compatibleServers = ref([])
const loadingCompatibleServers = ref(false)

const serverConfigOptions = ref(null)
const loadingConfigOptions = ref(false)

const configMode = ref('simple'); // 'simple' or 'advanced'

// --- Computed ---

// Options de package séparées pour notre propre sélecteur
const packageOptions = computed(() => {
  if (!serverConfigOptions.value || !serverConfigOptions.value.form) {
    return [];
  }
  
  // Recherche de l'option package_name dans les options de configuration
  const packageOption = serverConfigOptions.value.form.find(option => option.name === 'package_name');
  
  if (!packageOption || !packageOption.options) {
    return [];
  }
  
  console.log('[DEBUG] Options de package trouvées:', packageOption.options);
  
  // Formatage des options pour notre select
  return packageOption.options.map(option => ({
    value: option.value,
    text: option.label || option.value
  }));
});

// Les autres options de configuration (sans package_name)
const otherConfigOptions = computed(() => {
  if (!serverConfigOptions.value || !serverConfigOptions.value.form) {
    return [];
  }

  const filtered = serverConfigOptions.value.form.filter(option => {
    // Toujours exclure package_name car on le gère séparément
    if (option.name === 'package_name') {
      return false;
    }
    
    // En mode simple, n'afficher que les options simples
    if (configMode.value === 'simple') {
      return option.displayMode === 'simple' || !option.displayMode;
    }
    
    // En mode avancé, tout afficher sauf package_name
    return true;
  });

  // Add styling class to all relevant inputs
  return filtered.map(option => {
    if (['select', 'text', 'number', 'password'].includes(option.type)) {
      return {
        ...option,
        inputClass: 'form-control'
      };
    }
    return option;
  });
});

// Note: La variable filteredServerConfigOptions a été supprimée car elle n'était pas utilisée


// --- Methods ---

async function fetchAvailableModules() {
  loading.value = true
  try {
    const response = await ApiService.routes.admin.system.module.list('servers')
    const data = response.data
    if (data.success) {
      availableModules.value = data.data
      if (selectedModule.value) {
        fetchCompatibleServers(selectedModule.value)
      }
    } else {
      logger.error('Failed to fetch available modules', { message: data.message })
    }
  } catch (error) {
    logger.error('Error fetching available modules', { error })
  } finally {
    loading.value = false
  }
}

async function fetchProductGroups() {
  try {
    // Utiliser le service API centralisé pour récupérer les groupes de produits
    const response = await ApiService.routes.admin.product.groups.list()
    const data = response.data
    if (data.success) {
      productGroups.value = data.groups || []
    } else {
      logger.error('Failed to fetch product groups', { message: data.message })
    }
  } catch (error) {
    logger.error('Error fetching product groups', { error })
  }
}

function logPackageSelection() {
  logger.debug('[ProductModule] Package sélectionné', {
    package_name: moduleSettings.value.package_name
  });
}

function resetProvisioningOptions() {
  compatibleServers.value = []
  serverConfigOptions.value = null
  moduleSettings.value.server_id = null
  moduleSettings.value.package_name = null
  moduleSettings.value.server_group = null
  moduleSettings.value.provisioning_type = 'manual'
}

async function fetchCompatibleServers(moduleName) {
  resetProvisioningOptions()
  loadingCompatibleServers.value = true
  try {
    // Utiliser le service API centralisé pour récupérer les serveurs compatibles
    const response = await ApiService.routes.admin.server.list({ module: moduleName })
    const data = response.data
    if (data.servers) {
      compatibleServers.value = data.servers.map(server => ({
        label: `${server.name} (${server.hostname})`,
        value: server.id
      }))
    } else {
      logger.error('Failed to fetch compatible servers: response did not contain a `servers` key.')
      compatibleServers.value = []
    }
  } catch (error) {
    logger.error('Error fetching compatible servers', { error })
    compatibleServers.value = []
  } finally {
    loadingCompatibleServers.value = false
  }
}

function selectModule(moduleName) {
  if (selectedModule.value === moduleName) {
    selectedModule.value = null
    moduleSettings.value.module_name = null
    resetProvisioningOptions()
  } else {
    selectedModule.value = moduleName
    moduleSettings.value.module_name = moduleName
    fetchCompatibleServers(moduleName)
  }
}

async function fetchServerConfigOptions(serverId) {
  if (!serverId) {
    serverConfigOptions.value = null
    return
  }
  loadingConfigOptions.value = true
  try {
    // Utiliser le service API centralisé pour récupérer les options de configuration
    const response = await ApiService.routes.admin.server.getConfigOptions(serverId)
    const data = response.data
    if (data.success) {
      serverConfigOptions.value = data.data
      logger.debug('[ProductModule] Structure des options de serveur récupérée', {
        server_id: serverId,
        options_count: data.data ? Object.keys(data.data).length : 0
      })
    } else {
      logger.error('Failed to fetch config options', { message: data.message })
      serverConfigOptions.value = null
    }
  } catch (error) {
    logger.error('Error fetching config options', { error })
    serverConfigOptions.value = null
  } finally {
    loadingConfigOptions.value = false
  }
}

// --- Watchers ---

watch(() => moduleSettings.value.server_id, (newServerId) => {
  fetchServerConfigOptions(newServerId)
})

watch(moduleSettings, (newSettings) => {
  logger.debug('[ProductModule] Mise à jour des paramètres du module', {
    package_name: newSettings.package_name,
    config_mode: configMode.value,
    module_name: newSettings.module_name
  });
  
  // Créer un objet avec toutes les propriétés de moduleSettings
  // pour les envoyer au store
  const dataToUpdate = {
    module: newSettings.module_name,
    server_id: newSettings.server_id,
    server_group: newSettings.server_group,
    package_name: newSettings.package_name,
    provisioning_type: newSettings.provisioning_type,
    // Déterminer auto_provision basé sur le type de provisionnement
    auto_provision: newSettings.provisioning_type !== 'manual',
    // Sauvegarder le groupe de produit
    group_id: newSettings.group_id
  };
  
  // Ajouter toutes les autres options de configuration dynamiques
  if (serverConfigOptions.value && serverConfigOptions.value.form) {
    for (const option of serverConfigOptions.value.form) {
      if (newSettings.hasOwnProperty(option.name)) {
        dataToUpdate[option.name] = newSettings[option.name];
      }
    }
  }
  
  productWizardStore.setProductData(dataToUpdate);
  
  // Vérifier que la valeur est bien dans le store après mise à jour
  console.log('[DEBUG] package_name dans le store après mise à jour:', productWizardStore.productData.package_name);
}, { deep: true })

watch(() => productWizardStore.productData.module, (newModule) => {
  if (newModule && newModule !== selectedModule.value) {
    selectModule(newModule);
  }
});

// --- Lifecycle ---

onMounted(() => {
  fetchAvailableModules()
  fetchProductGroups()
})
</script>

<style scoped>
@import '@/assets/css/pages/products/product-module.css';

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.radio-label {
  margin: 0;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-checkbox {
  margin: 0;
}

.module-logo-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
</style>