<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useNotificationStore } from '@/stores/notifications'
import { useServersStore } from '@/stores/servers'
import { useServerService } from '@/services/server'
import type { Server, VirtualizationType, OsTemplate, ProxmoxStorage, ProxmoxTemplate, CpanelPlan } from '@/types'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()
const serversStore = useServersStore()
const serverService = useServerService()

// Récupérer le type de produit et les données précédentes
const productType = computed(() => route.params.type as string || 'shared_hosting')
const previousData = computed(() => {
  const savedProductData = localStorage.getItem('currentProductData')
  if (savedProductData) {
    try {
      return JSON.parse(savedProductData)
    } catch (e) {
      console.error('Erreur lors du parsing des données:', e)
      return {}
    }
  }
  return {}
})

// Déterminer si nous sommes en mode édition
const productId = computed(() => {
  const idOrAction = route.params.idOrAction as string
  if (idOrAction && idOrAction !== 'create') {
    return parseInt(idOrAction, 10)
  }
  return null
})

const isEditMode = computed(() => !!productId.value)

// Définition des onglets
const tabs = [
  { id: 'type', label: t('products_services.tabs.type'), icon: 'tag', route: 'create-product' },
  { id: 'details', label: t('products_services.tabs.details'), icon: 'info-circle', route: 'product-details' },
  { id: 'pricing', label: t('products_services.tabs.pricing'), icon: 'money-bill', route: 'product-pricing' },
  { id: 'module', label: t('products_services.tabs.module'), icon: 'puzzle-piece', route: 'product-module' },
  { id: 'custom_fields', label: t('products_services.tabs.custom_fields'), icon: 'list-alt', route: 'product-custom-fields' },
  { id: 'configurable_options', label: t('products_services.tabs.configurable_options'), icon: 'cogs', route: 'product-configurable-options' },
  { id: 'upgrades', label: t('products_services.tabs.upgrades'), icon: 'arrow-up', route: 'product-upgrades' },
  { id: 'freedomain', label: t('products_services.tabs.freedomain'), icon: 'globe', route: 'product-freedomain' },
  { id: 'cross_sells', label: t('products_services.tabs.cross_sells'), icon: 'shopping-cart', route: 'product-cross-sells' },
  { id: 'other', label: t('products_services.tabs.other'), icon: 'ellipsis-h', route: 'product-other' },
  { id: 'links', label: t('products_services.tabs.links'), icon: 'link', route: 'product-links' }
]

// Déterminer l'onglet actif en fonction de la route actuelle
const activeTab = computed(() => {
  const currentRouteName = route.name as string
  const tab = tabs.find(tab => tab.route === currentRouteName)
  return tab ? tab.id : 'module'
})

// Naviguer vers un onglet spécifique
const navigateToTab = (tab) => {
  // Sauvegarder les données dans localStorage
  localStorage.setItem('moduleData', JSON.stringify(moduleData.value))
  
  if (tab.id === 'type') {
    // Si nous sommes en mode édition, rediriger vers la page d'édition du produit
    if (isEditMode.value) {
      router.push({ path: `/products/${productId.value}` })
    } else {
      // Sinon, rediriger vers la création de produit
      router.push({ name: 'create-product' })
    }
  } else {
    const idOrAction = isEditMode.value ? productId.value : 'create'
    router.push({
      name: tab.route,
      params: { idOrAction }
    })
  }
}

// État
const loading = ref(false)
const errors = ref<Record<string, string>>({})

// Données du module
interface ModuleSettings {
  cpanelPlan: string;
  virtualizorResources: {
    cpu: number;
    memory: number;
    disk_space: number;
    bandwidth: number;
    ips: number;
    virtualization_type: string;
    os_template: string;
  };
  proxmoxResources: {
    cpu: number;
    memory: number;
    disk_space: number;
    bandwidth: number;
    ips: number;
    container_type: string;
    storage: string;
    template: string;
  };
  [key: string]: any;
}

interface ModuleData {
  moduleName: string;
  serverGroup: string;
  serverId: string;
  autoSetupOnOrder: boolean;
  autoSetupOnPayment: boolean;
  autoSetupOnPendingOrder: boolean;
  noAutoSetup: boolean;
  moduleSettings: ModuleSettings;
  [key: string]: any;
}

const moduleData = reactive<ModuleData>({
  moduleName: '',
  serverGroup: '',
  serverId: '',
  autoSetupOnOrder: false,
  autoSetupOnPayment: false,
  autoSetupOnPendingOrder: false,
  noAutoSetup: true,
  moduleSettings: {
    cpanelPlan: '',
    virtualizorResources: {
      cpu: 1,
      memory: 1024,
      disk_space: 10,
      bandwidth: 100,
      ips: 1,
      virtualization_type: '',
      os_template: ''
    },
    proxmoxResources: {
      cpu: 1,
      memory: 1024,
      disk_space: 10,
      bandwidth: 100,
      ips: 1,
      container_type: 'lxc',
      storage: '',
      template: ''
    }
  }
})

// Options de modules disponibles en fonction du type de produit
const moduleOptions = computed(() => {
  const baseOptions = [
    { value: '', label: t('products_services.modules.none') },
    { value: 'custom', label: t('products_services.modules.custom') }
  ]
  
  // Inclure tous les modules importants quelle que soit la catégorie
  return [
    ...baseOptions,
    { value: 'cpanel', label: 'cPanel/WHM' },
    { value: 'virtualizor', label: 'Virtualizor' },
    { value: 'proxmox', label: 'Proxmox' }
  ]
})

// Options de groupes de serveurs
const serverGroupOptions = [
  { value: '', label: t('products_services.modules.no_server_group') },
  { value: 'shared_servers', label: t('products_services.modules.shared_servers') },
  { value: 'reseller_servers', label: t('products_services.modules.reseller_servers') },
  { value: 'vps_servers', label: t('products_services.modules.vps_servers') }
]

// Liste des serveurs disponibles
const availableServers = ref<Server[]>([])
// État de chargement des serveurs
const loadingServers = ref(false)
// Plans cPanel disponibles
const cpanelPlans = ref<CpanelPlan[]>([])
// État de chargement des plans
const loadingPlans = ref(false)

// Variables pour les templates et options de stockage Proxmox/Virtualizor
const virtualizationTypes = ref<VirtualizationType[]>([])
const osTemplates = ref<OsTemplate[]>([])
const proxmoxStorages = ref<ProxmoxStorage[]>([])
const proxmoxTemplates = ref<ProxmoxTemplate[]>([])
const loadingVirtualizorOptions = ref(false)
const loadingProxmoxOptions = ref(false)

// Fonction pour charger les serveurs
const loadServers = async () => {
  try {
    loadingServers.value = true
    await serversStore.fetchServers()
    
    // Type assertion pour aider TypeScript à comprendre que les serveurs sont compatibles avec Server[]
    availableServers.value = serversStore.servers.filter(server => 
      (moduleData.moduleName === 'cpanel' && server.type === 'cPanel') ||
      (moduleData.moduleName === 'virtualizor' && server.type === 'Virtualizor') ||
      (moduleData.moduleName === 'proxmox' && server.type === 'Proxmox')
    ) as Server[]
  } catch (error) {
    console.error('Erreur lors du chargement des serveurs:', error)
    notificationStore.showNotification({
      title: 'Erreur',
      type: 'error',
      message: t('products_services.modules.errors.server_load_failed')
    })
  } finally {
    loadingServers.value = false
  }
}

// Fonction pour charger les plans cPanel
const loadCpanelPlans = async (serverId: number | null) => {
  if (!serverId) return
  
  try {
    loadingPlans.value = true
    // Appel API pour récupérer les plans cPanel
    const response = await serverService.getServerPlans(serverId)
    
    if (response.success && response.plans && response.plans.length > 0) {
      cpanelPlans.value = response.plans
      
      // Informer l'utilisateur que les plans ont été chargés
      notificationStore.showNotification({
        title: 'Succès',
        type: 'success',
        message: t('products_services.modules.plans_loaded_success')
      })
    } else {
      // Afficher un message d'erreur spécifique si disponible
      notificationStore.showNotification({
        title: 'Attention',
        type: 'warning',
        message: response.error || response.message || t('products_services.modules.plans_load_empty')
      })
      console.warn('Détails de l\'erreur de chargement des plans:', response)
    }
  } catch (error: any) {
    console.error('Erreur lors du chargement des plans cPanel:', error)
    let errorMessage = t('products_services.modules.errors.plans_load_failed')
    
    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || error.response.data.error || errorMessage
    } else if (error.message) {
      errorMessage = error.message
    }
    
    notificationStore.showNotification({
      title: 'Erreur',
      type: 'error',
      message: errorMessage
    })
  } finally {
    loadingPlans.value = false
  }
}

// Serveur sélectionné
const selectedServer = ref<number | null>(null)

// Observer les changements du module sélectionné
watch(() => moduleData.moduleName, async (newModule) => {
  // Réinitialiser le serveur sélectionné quand le module change
  selectedServer.value = null
  availableServers.value = []
  
  // Réinitialiser les plans cPanel
  cpanelPlans.value = []
  
  // Réinitialiser les options Virtualizor/Proxmox
  virtualizationTypes.value = []
  osTemplates.value = []
  proxmoxStorages.value = []
  proxmoxTemplates.value = []
  
  // Charger les serveurs si un module compatible est sélectionné
  if (newModule === 'cpanel' || 
      newModule === 'virtualizor' || 
      newModule === 'proxmox') {
    loadServers()
  }
})

// Observer les changements du serveur sélectionné
watch(() => selectedServer.value, async (newServerId) => {
  if (moduleData.moduleName === 'cpanel' && newServerId !== null) {
    await loadCpanelPlans(newServerId)
  } else if (moduleData.moduleName === 'virtualizor' && newServerId !== null) {
    await loadVirtualizorOptions(newServerId)
  } else if (moduleData.moduleName === 'proxmox' && newServerId !== null) {
    await loadProxmoxOptions(newServerId)
  }
})

// Fusionner les données précédentes avec les données du module
onMounted(async () => {
  if (previousData.value) {
    // Récupérer les données du module si elles existent
    if (previousData.value.module) {
      moduleData.moduleName = previousData.value.module
    }
    
    // Récupérer les autres propriétés si elles existent
    Object.keys(moduleData).forEach(key => {
      if (previousData.value[key] !== undefined) {
        moduleData[key] = previousData.value[key]
      }
    })
    
    // Si un serverId était précédemment sélectionné, le restaurer
    if (previousData.value.serverId) {
      // Charger les serveurs d'abord
      if (moduleData.moduleName === 'cpanel' || 
          moduleData.moduleName === 'virtualizor' || 
          moduleData.moduleName === 'proxmox') {
        await loadServers()
        selectedServer.value = previousData.value.serverId
        
        // Si c'est un serveur cPanel, charger les plans également
        if (moduleData.moduleName === 'cpanel') {
          await loadCpanelPlans(selectedServer.value)
        }
      }
    }
  }
})

// Fonction pour charger les options de Virtualizor
const loadVirtualizorOptions = async (serverId: number | null) => {
  if (!serverId) return
  
  try {
    loadingVirtualizorOptions.value = true
    // Nous n'avons pas encore le service réel, donc nous simulons une réponse
    // Cette partie sera remplacée par un vrai appel API quand le backend sera prêt
    setTimeout(() => {
      virtualizationTypes.value = [
        { id: 'openvz', name: 'OpenVZ' },
        { id: 'kvm', name: 'KVM' },
        { id: 'xen', name: 'Xen' },
        { id: 'lxc', name: 'LXC' }
      ]
      
      osTemplates.value = [
        { id: 'centos-7-x64', name: 'CentOS 7 (64-bit)' },
        { id: 'ubuntu-20-04-x64', name: 'Ubuntu 20.04 (64-bit)' },
        { id: 'debian-10-x64', name: 'Debian 10 (64-bit)' },
        { id: 'fedora-34-x64', name: 'Fedora 34 (64-bit)' }
      ]
      
      notificationStore.showNotification({
        title: 'Succès',
        type: 'success',
        message: 'Options Virtualizor chargées avec succès'
      })
      
      loadingVirtualizorOptions.value = false
    }, 1000)
  } catch (error: any) {
    console.error('Erreur lors du chargement des options Virtualizor:', error)
    let errorMessage = 'Erreur lors du chargement des options'
    
    notificationStore.showNotification({
      title: 'Erreur',
      type: 'error',
      message: errorMessage
    })
    
    loadingVirtualizorOptions.value = false
  }
}

// Fonction pour charger les options de Proxmox
const loadProxmoxOptions = async (serverId: number | null) => {
  if (!serverId) return
  
  try {
    loadingProxmoxOptions.value = true
    // Nous n'avons pas encore le service réel, donc nous simulons une réponse
    // Cette partie sera remplacée par un vrai appel API quand le backend sera prêt
    setTimeout(() => {
      proxmoxStorages.value = [
        { id: 'local', name: 'Local' },
        { id: 'local-lvm', name: 'Local-LVM' },
        { id: 'ceph', name: 'Ceph' },
        { id: 'nfs', name: 'NFS' }
      ]
      
      proxmoxTemplates.value = [
        { id: 'centos-7-x64', name: 'CentOS 7 (64-bit)' },
        { id: 'ubuntu-20-04-x64', name: 'Ubuntu 20.04 (64-bit)' },
        { id: 'debian-10-x64', name: 'Debian 10 (64-bit)' },
        { id: 'alpine-3-14-x64', name: 'Alpine 3.14 (64-bit)' }
      ]
      
      notificationStore.showNotification({
        title: 'Succès',
        type: 'success',
        message: 'Options Proxmox chargées avec succès'
      })
      
      loadingProxmoxOptions.value = false
    }, 1000)
  } catch (error: any) {
    console.error('Erreur lors du chargement des options Proxmox:', error)
    let errorMessage = 'Erreur lors du chargement des options'
    
    notificationStore.showNotification({
      title: 'Erreur',
      type: 'error',
      message: errorMessage
    })
    
    loadingProxmoxOptions.value = false
  }
}

// Validation du formulaire
const validateForm = () => {
  const formErrors = {} as Record<string, string>
  
  // Validation spécifique pour le module sélectionné
  if (moduleData.moduleName && !moduleData.serverGroup) {
    formErrors.serverGroup = t('products_services.modules.errors.server_group_required')
  }
  
  // Validation du serveur sélectionné pour les modules compatibles
  if ((moduleData.moduleName === 'cpanel' || 
       moduleData.moduleName === 'virtualizor' || 
       moduleData.moduleName === 'proxmox') && 
      !selectedServer.value) {
    formErrors.server = t('products_services.modules.errors.server_required')
  }
  
  // Validation du plan sélectionné pour cPanel
  if (moduleData.moduleName === 'cpanel' && 
      cpanelPlans.value.length > 0 && 
      !moduleData.moduleSettings.cpanelPlan) {
    formErrors.cpanelPlan = t('products_services.modules.errors.cpanel_plan_required')
  }
  
  // Validation des ressources pour Virtualizor
  if (moduleData.moduleName === 'virtualizor') {
    const vResources = moduleData.moduleSettings.virtualizorResources
    if (!vResources.virtualization_type || !vResources.os_template) {
      formErrors.virtualizorResources = t('products_services.modules.errors.virtualizor_resources_required')
    }
  }
  
  // Validation des ressources pour Proxmox
  if (moduleData.moduleName === 'proxmox') {
    const pResources = moduleData.moduleSettings.proxmoxResources
    if (!pResources.storage || !pResources.template) {
      formErrors.proxmoxResources = t('products_services.modules.errors.proxmox_resources_required')
    }
  }
  
  errors.value = formErrors
  return Object.keys(formErrors).length === 0
}

// Continuer vers l'étape suivante
const continueToNextStep = () => {
  // Sauvegarder les données
  localStorage.setItem('moduleData', JSON.stringify(moduleData.value))
  
  // Naviguer vers la prochaine étape
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-custom-fields',
    params: { idOrAction }
  })
}

// Retour à l'étape précédente
const goBack = () => {
  // Sauvegarder les données
  localStorage.setItem('moduleData', JSON.stringify(moduleData.value))
  
  // Naviguer vers l'étape précédente
  const idOrAction = isEditMode.value ? productId.value : 'create'
  router.push({
    name: 'product-pricing',
    params: { idOrAction }
  })
}
</script>

<template>
  <div class="product-module-view">
    <div class="wizard-content">
      <div class="form-section">
        <!-- Sélection du module -->
        <div class="form-group">
          <label>{{ t('products_services.modules.module_name') }}</label>
          <select 
            v-model="moduleData.moduleName"
            class="form-control"
          >
            <option v-for="option in moduleOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <small class="form-text text-muted">{{ t('products_services.modules.module_name_help') }}</small>
        </div>
        
        <!-- Groupe de serveurs -->
        <div class="form-group" v-if="moduleData.moduleName">
          <label>{{ t('products_services.modules.server_group') }}</label>
          <select 
            v-model="moduleData.serverGroup"
            class="form-control"
            :class="{ 'is-invalid': errors.serverGroup }"
          >
            <option v-for="option in serverGroupOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <div v-if="errors.serverGroup" class="invalid-feedback">{{ errors.serverGroup }}</div>
          <small class="form-text text-muted">{{ t('products_services.modules.server_group_help') }}</small>
        </div>
        
        <!-- Sélection du serveur -->
        <div class="form-group" v-if="loadingServers || availableServers.length > 0">
          <label>{{ t('products_services.modules.server') }}</label>
          <select 
            v-model="selectedServer"
            class="form-control"
            :class="{ 'is-invalid': errors.server }"
            :disabled="loadingServers"
          >
            <option value="" disabled>{{ loadingServers ? t('common.loading') : t('products_services.modules.select_server') }}</option>
            <option v-for="server in availableServers" :key="server.id" :value="server.id">
              {{ server.name }}
            </option>
          </select>
          <div v-if="errors.server" class="invalid-feedback">{{ errors.server }}</div>
          <small class="form-text text-muted">{{ t('products_services.modules.server_help') }}</small>
          <div class="spinner-container" v-if="loadingServers">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="sr-only">{{ t('common.loading') }}</span>
            </div>
            <span class="ml-2">{{ t('products_services.modules.loading_servers') }}</span>
          </div>
        </div>
        
        <!-- Plans cPanel -->
        <div class="form-group" v-if="loadingPlans || cpanelPlans.length > 0">
          <label>{{ t('products_services.modules.cpanel_plans') }}</label>
          <select 
            v-model="moduleData.moduleSettings.cpanelPlan"
            class="form-control"
            :class="{ 'is-invalid': errors.cpanelPlan }"
            :disabled="loadingPlans"
          >
            <option value="" disabled>{{ loadingPlans ? t('common.loading') : t('products_services.modules.select_plan') }}</option>
            <option v-for="plan in cpanelPlans" :key="plan.id" :value="plan.id">
              {{ plan.name }}
            </option>
          </select>
          <div v-if="errors.cpanelPlan" class="invalid-feedback">{{ errors.cpanelPlan }}</div>
          <small class="form-text text-muted">{{ t('products_services.modules.cpanel_plans_help') }}</small>
          <div class="spinner-container" v-if="loadingPlans">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="sr-only">{{ t('common.loading') }}</span>
            </div>
            <span class="ml-2">{{ t('products_services.modules.loading_plans') }}</span>
          </div>
        </div>
        
        <!-- Message pour un module sélectionné -->
        <div class="module-info" v-if="moduleData.moduleName">
          <div class="info-box">
            <i class="fas fa-info-circle"></i>
            <p>{{ t('products_services.modules.choose_module_info') }}</p>
          </div>
        </div>
        
        <!-- Message pour aucun module sélectionné -->
        <div class="module-info" v-else>
          <div class="info-box">
            <i class="fas fa-info-circle"></i>
            <p>{{ t('products_services.modules.no_module_info') }}</p>
          </div>
        </div>
        
        <!-- Section pour les ressources Virtualizor -->
        <div v-if="moduleData.moduleName === 'virtualizor'" class="resource-config-section">
          <h3 class="section-title">{{ t('products_services.modules.resources.virtualizor.title') }}</h3>
          <p class="section-description">{{ t('products_services.modules.resources.virtualizor.description') }}</p>
          
          <!-- Ressources communes -->
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.cpu') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.virtualizorResources.cpu" 
                  class="form-control" 
                  min="1" 
                  max="32"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.cpu_help') }}</small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.memory') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.virtualizorResources.memory" 
                  class="form-control" 
                  min="512" 
                  step="256"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.memory_help') }}</small>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.disk_space') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.virtualizorResources.disk_space" 
                  class="form-control" 
                  min="5"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.disk_space_help') }}</small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.bandwidth') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.virtualizorResources.bandwidth" 
                  class="form-control" 
                  min="0"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.bandwidth_help') }}</small>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.ips') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.virtualizorResources.ips" 
                  class="form-control" 
                  min="1" 
                  max="10"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.ips_help') }}</small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.virtualizor.virtualization') }}</label>
                <select 
                  v-model="moduleData.moduleSettings.virtualizorResources.virtualization_type" 
                  class="form-control"
                  :class="{'is-invalid': errors.virtualizorResources}"
                >
                  <option value="" disabled>{{ loadingVirtualizorOptions ? t('common.loading') : t('common.select') }}</option>
                  <option v-for="vType in virtualizationTypes" :key="vType.id" :value="vType.id">
                    {{ vType.name }}
                  </option>
                </select>
                <div v-if="errors.virtualizorResources" class="invalid-feedback">
                  {{ errors.virtualizorResources }}
                </div>
                <small class="form-text text-muted">{{ t('products_services.modules.resources.virtualizor.virtualization_help') }}</small>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-12">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.virtualizor.os_template') }}</label>
                <select 
                  v-model="moduleData.moduleSettings.virtualizorResources.os_template" 
                  class="form-control"
                  :class="{'is-invalid': errors.virtualizorResources}"
                >
                  <option value="" disabled>{{ loadingVirtualizorOptions ? t('common.loading') : t('common.select') }}</option>
                  <option v-for="template in osTemplates" :key="template.id" :value="template.id">
                    {{ template.name }}
                  </option>
                </select>
                <small class="form-text text-muted">{{ t('products_services.modules.resources.virtualizor.os_template_help') }}</small>
              </div>
            </div>
          </div>
          
          <!-- Indicateur de chargement pour les options Virtualizor -->
          <div v-if="loadingVirtualizorOptions" class="loading-container">
            <div class="loading-spinner">
              <span class="spinner-border spinner-border-sm"></span>
            </div>
            <span class="ml-2">{{ t('common.loading') }}</span>
          </div>
        </div>
        
        <!-- Section pour les ressources Proxmox -->
        <div v-if="moduleData.moduleName === 'proxmox'" class="resource-config-section">
          <h3 class="section-title">{{ t('products_services.modules.resources.proxmox.title') }}</h3>
          <p class="section-description">{{ t('products_services.modules.resources.proxmox.description') }}</p>
          
          <!-- Ressources communes -->
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.cpu') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.proxmoxResources.cpu" 
                  class="form-control" 
                  min="1" 
                  max="32"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.cpu_help') }}</small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.memory') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.proxmoxResources.memory" 
                  class="form-control" 
                  min="512" 
                  step="256"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.memory_help') }}</small>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.disk_space') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.proxmoxResources.disk_space" 
                  class="form-control" 
                  min="5"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.disk_space_help') }}</small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.bandwidth') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.proxmoxResources.bandwidth" 
                  class="form-control" 
                  min="0"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.bandwidth_help') }}</small>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.ips') }}</label>
                <input 
                  type="number" 
                  v-model="moduleData.moduleSettings.proxmoxResources.ips" 
                  class="form-control" 
                  min="1" 
                  max="10"
                />
                <small class="form-text text-muted">{{ t('products_services.modules.resources.ips_help') }}</small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.proxmox.container_type') }}</label>
                <select 
                  v-model="moduleData.moduleSettings.proxmoxResources.container_type" 
                  class="form-control"
                >
                  <option value="lxc">LXC</option>
                  <option value="qemu">VM (QEMU/KVM)</option>
                </select>
                <small class="form-text text-muted">{{ t('products_services.modules.resources.proxmox.container_type_help') }}</small>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.proxmox.storage') }}</label>
                <select 
                  v-model="moduleData.moduleSettings.proxmoxResources.storage" 
                  class="form-control"
                  :class="{'is-invalid': errors.proxmoxResources}"
                >
                  <option value="" disabled>{{ loadingProxmoxOptions ? t('common.loading') : t('common.select') }}</option>
                  <option v-for="storage in proxmoxStorages" :key="storage.id" :value="storage.id">
                    {{ storage.name }}
                  </option>
                </select>
                <div v-if="errors.proxmoxResources" class="invalid-feedback">
                  {{ errors.proxmoxResources }}
                </div>
                <small class="form-text text-muted">{{ t('products_services.modules.resources.proxmox.storage_help') }}</small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label>{{ t('products_services.modules.resources.proxmox.template') }}</label>
                <select 
                  v-model="moduleData.moduleSettings.proxmoxResources.template" 
                  class="form-control"
                  :class="{'is-invalid': errors.proxmoxResources}"
                >
                  <option value="" disabled>{{ loadingProxmoxOptions ? t('common.loading') : t('common.select') }}</option>
                  <option v-for="template in proxmoxTemplates" :key="template.id" :value="template.id">
                    {{ template.name }}
                  </option>
                </select>
                <small class="form-text text-muted">{{ t('products_services.modules.resources.proxmox.template_help') }}</small>
              </div>
            </div>
          </div>
          
          <!-- Indicateur de chargement pour les options Proxmox -->
          <div v-if="loadingProxmoxOptions" class="loading-container">
            <div class="loading-spinner">
              <span class="spinner-border spinner-border-sm"></span>
            </div>
            <span class="ml-2">{{ t('common.loading') }}</span>
          </div>
        </div>
        
        <!-- Options de configuration automatique -->
        <div v-if="moduleData.moduleName" class="auto-setup-section">
          <h3 class="section-title">{{ t('products_services.modules.auto_setup_options') }}</h3>
          
          <div class="form-check">
            <input 
              type="radio" 
              id="auto-setup-on-order" 
              v-model="moduleData.autoSetupOnOrder"
              :value="true"
              class="form-check-input"
              @change="() => {
                moduleData.autoSetupOnPayment = false;
                moduleData.autoSetupOnPendingOrder = false;
                moduleData.noAutoSetup = false;
              }"
            />
            <label class="form-check-label" for="auto-setup-on-order">
              {{ t('products_services.modules.auto_setup_on_order') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.modules.auto_setup_on_order_help') }}</small>
          </div>
          
          <div class="form-check">
            <input 
              type="radio" 
              id="auto-setup-on-payment" 
              v-model="moduleData.autoSetupOnPayment"
              :value="true"
              class="form-check-input"
              @change="() => {
                moduleData.autoSetupOnOrder = false;
                moduleData.autoSetupOnPendingOrder = false;
                moduleData.noAutoSetup = false;
              }"
            />
            <label class="form-check-label" for="auto-setup-on-payment">
              {{ t('products_services.modules.auto_setup_on_payment') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.modules.auto_setup_on_payment_help') }}</small>
          </div>
          
          <div class="form-check">
            <input 
              type="radio" 
              id="auto-setup-on-pending-order" 
              v-model="moduleData.autoSetupOnPendingOrder"
              :value="true"
              class="form-check-input"
              @change="() => {
                moduleData.autoSetupOnOrder = false;
                moduleData.autoSetupOnPayment = false;
                moduleData.noAutoSetup = false;
              }"
            />
            <label class="form-check-label" for="auto-setup-on-pending-order">
              {{ t('products_services.modules.auto_setup_on_pending_order') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.modules.auto_setup_on_pending_order_help') }}</small>
          </div>
          
          <div class="form-check">
            <input 
              type="radio" 
              id="no-auto-setup" 
              v-model="moduleData.noAutoSetup"
              :value="true"
              class="form-check-input"
              @change="() => {
                moduleData.autoSetupOnOrder = false;
                moduleData.autoSetupOnPayment = false;
                moduleData.autoSetupOnPendingOrder = false;
              }"
            />
            <label class="form-check-label" for="no-auto-setup">
              {{ t('products_services.modules.no_auto_setup') }}
            </label>
            <small class="form-text text-muted">{{ t('products_services.modules.no_auto_setup_help') }}</small>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Boutons de navigation -->
    <div class="wizard-actions">
      <button 
        type="button" 
        class="btn btn-outline-secondary"
        @click="goBack"
      >
        {{ t('common.back') }}
      </button>
      
      <button 
        type="button" 
        class="btn btn-primary"
        @click="continueToNextStep"
        :disabled="loading"
      >
        {{ t('common.continue') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/css/components/common-layout.css';
@import '@/assets/styles/wizard-tabs.css';

.wizard-content {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.form-section {
  margin-bottom: var(--spacing-xl);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
  color: var(--text-color);
}

.form-control {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-color);
  padding: 0.75rem 1rem;
  width: 100%;
  transition: all var(--transition-fast);
}

.form-control:focus {
  border-color: var(--primary-blue);
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 195, 255, 0.25);
}

.form-control.is-invalid {
  border-color: var(--error);
}

.invalid-feedback {
  color: var(--error);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.form-text {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.info-box {
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-md);
  margin: var(--spacing-md) 0;
  background: rgba(51, 153, 255, 0.1);
  border-left: 3px solid var(--primary-blue);
  border-radius: var(--radius-sm);
}

.info-box i {
  color: var(--primary-blue);
  margin-right: var(--spacing-md);
  margin-top: 0.2rem;
}

.info-box p {
  margin: 0;
  color: var(--text-color);
  font-size: 0.9rem;
}

.module-info {
  margin-top: var(--spacing-lg);
}

.section-title {
  font-size: 1.15rem;
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
  color: var(--text-color);
  font-weight: 600;
}

.auto-setup-options {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
}

.form-check {
  margin-bottom: var(--spacing-lg);
  padding-left: var(--spacing-md);
  display: flex;
  flex-direction: column;
}

.form-check-input {
  margin-right: var(--spacing-md);
  margin-left: calc(-1 * var(--spacing-md));
}

.form-check-label {
  font-weight: 500;
  display: flex;
  align-items: center;
}

.form-check-input + .form-check-label {
  margin-bottom: var(--spacing-xs);
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-xl);
}

.btn {
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: linear-gradient(to right, var(--primary-blue), var(--secondary-blue));
  border: none;
  color: white;
}

.btn-outline-secondary {
  background: transparent;
  border: 1px solid var(--text-muted);
  color: var(--text-muted);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-outline-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-container {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-size: 0.9rem;
  color: var(--primary);
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .auto-setup-options {
    padding: var(--spacing-md);
  }
  
  .form-check {
    padding-left: 0;
  }
  
  .form-check-input {
    margin-right: var(--spacing-sm);
    margin-left: 0;
  }
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-lg);
}

.resource-config-section {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background-color: #fcfcfc;
}

.section-title {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
}

.section-description {
  margin-bottom: 20px;
  color: #666;
}

.loading-container {
  display: flex;
  align-items: center;
  margin-top: 15px;
  font-size: 0.9rem;
  color: #666;
}

.loading-spinner {
  color: #007bff;
}
</style>
