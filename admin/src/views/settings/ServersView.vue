<template>
  <div class="view-container">
    <div class="header-box">
      <div>
        <h1>{{ t('settings.servers.title') }}</h1>
        <div class="page-description">
          {{ t('settings.servers.description') }}
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div v-if="loading" class="loading-state">
        <div class="loading-state-icon">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <div class="loading-state-text">{{ t('common.loading') }}</div>
      </div>

      <!-- Liste des serveurs -->
      <div class="server-list-container">
        <div class="header-box">
          <div class="header-actions">
            <button @click="openServerModal()" class="btn btn-primary">
              <i class="fas fa-plus"></i> {{ t('settings.servers.add') }}
            </button>
          </div>
        </div>

        <div class="table-box">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('settings.servers.name') }}</th>
                <th>{{ t('settings.servers.hostname') }}</th>
                <th>{{ t('settings.servers.type') }}</th>
                <th>{{ t('settings.servers.ip') }}</th>
                <th>{{ t('settings.servers.status') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody v-if="!loading">
              <tr v-if="servers.length === 0">
                <td colspan="6" class="text-center">{{ t('settings.servers.noServers') }}</td>
              </tr>
              <tr v-for="server in servers" :key="server.id" @click="toggleServerDetails(server)" class="server-row" :class="{'selected': selectedServer && selectedServer.id === server.id}">
                <td>{{ server.name }}</td>
                <td>{{ server.hostname }}</td>
                <td>
                  <span class="server-type-badge" :class="getTypeClass(server.type)">
                    {{ server.type }}
                  </span>
                </td>
                <td>{{ server.ip }}</td>
                <td>
                  <div class="status-container">
                    <span class="status-badge" :class="getStatusClass(server.active)">
                      {{ server.active ? t('common.active') : t('common.inactive') }}
                    </span>
                    <span v-if="server.active && server.status" class="status-badge ml-2" :class="getServerStatusClass(server.status)">
                      {{ server.status === 'online' ? t('settings.servers.online') : t('settings.servers.offline') }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="action-buttons">
                    <button @click.stop="testServerConnection(server)" class="btn btn-sm btn-info mr-1" title="Test Connection">
                      <i class="fas fa-plug"></i>
                    </button>
                    <button @click.stop="openServerModal(server)" class="btn btn-sm btn-primary mr-1" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click.stop="confirmDeleteServer(server)" class="btn btn-sm btn-danger" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="6" class="text-center">
                  <div class="loading-spinner"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Détails du serveur sélectionné -->
      <div v-if="selectedServer && selectedServer.id" class="server-details-container mt-4">
        <div class="header-box">
          <h3>{{ t('settings.servers.details') }}: {{ selectedServer.name }}</h3>
          <button @click="refreshServerStats(selectedServer)" class="btn btn-sm btn-outline-primary">
            <i class="fas fa-sync-alt"></i> {{ t('settings.servers.refresh') }}
          </button>
          <div v-if="selectedServer.loadingStats" class="loading-state-text ml-2">
            {{ t('settings.servers.refreshing') }}
          </div>
        </div>

        <div class="server-stats-grid table-box">
          <!-- Statut -->
          <div class="server-stat-card">
            <div class="stat-header">
              <i class="fas fa-info-circle"></i>
              {{ t('settings.servers.status') }}
            </div>
            <div class="stat-content">
              <div v-if="selectedServer.loadingStats" class="loading-spinner"></div>
              <div v-else>
                <div class="stat-value">
                  <span :class="getServerStatusClass(selectedServer.status)">
                    {{ selectedServer.status === 'online' ? t('settings.servers.online') : t('settings.servers.offline') }}
                  </span>
                </div>
                <div class="stat-details" v-if="selectedServer.lastRefresh">
                  {{ t('settings.servers.lastRefresh') }}: {{ selectedServer.lastRefresh }}
                </div>
                <div class="stat-details" v-if="selectedServer.last_check">
                  {{ t('settings.servers.lastCheck') }}: {{ formatDate(selectedServer.last_check) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Charge CPU -->
          <div class="server-stat-card">
            <div class="stat-header">
              <i class="fas fa-microchip"></i>
              {{ t('settings.servers.load') }}
            </div>
            <div class="stat-content">
              <div v-if="selectedServer.loadingStats" class="loading-spinner"></div>
              <div v-else>
                <div class="stat-value">{{ selectedServer.server_load || 0 }}%</div>
                <div class="progress">
                  <div 
                    class="progress-bar" 
                    :class="getLoadClass(selectedServer.server_load)" 
                    :style="{ width: `${selectedServer.server_load || 0}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mémoire -->
          <div class="server-stat-card">
            <div class="stat-header">
              <i class="fas fa-memory"></i>
              {{ t('settings.servers.memory') }}
            </div>
            <div class="stat-content">
              <div v-if="selectedServer.loadingStats" class="loading-spinner"></div>
              <div v-else>
                <div class="stat-value">
                  {{ selectedServer.memory && selectedServer.memory.percent ? selectedServer.memory.percent + '%' : '0%' }}
                </div>
                <div class="progress">
                  <div 
                    class="progress-bar" 
                    :class="getLoadClass(selectedServer.memory ? selectedServer.memory.percent : 0)" 
                    :style="{ width: `${selectedServer.memory ? selectedServer.memory.percent : 0}%` }"
                  ></div>
                </div>
                <div class="stat-details" v-if="selectedServer.memory">
                  {{ formatBytes(selectedServer.memory.used || 0) }} / {{ formatBytes(selectedServer.memory.total || 0) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Disque -->
          <div class="server-stat-card">
            <div class="stat-header">
              <i class="fas fa-hdd"></i>
              {{ t('settings.servers.disk') }}
            </div>
            <div class="stat-content">
              <div v-if="selectedServer.loadingStats" class="loading-spinner"></div>
              <div v-else>
                <div class="stat-value">
                  {{ selectedServer.disk && selectedServer.disk.percent ? selectedServer.disk.percent + '%' : '0%' }}
                </div>
                <div class="progress">
                  <div 
                    class="progress-bar" 
                    :class="getLoadClass(selectedServer.disk ? selectedServer.disk.percent : 0)" 
                    :style="{ width: `${selectedServer.disk ? selectedServer.disk.percent : 0}%` }"
                  ></div>
                </div>
                <div class="stat-details" v-if="selectedServer.disk">
                  {{ formatBytes(selectedServer.disk.used || 0) }} / {{ formatBytes(selectedServer.disk.total || 0) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Uptime -->
          <div class="server-stat-card">
            <div class="stat-header">
              <i class="fas fa-clock"></i>
              {{ t('settings.servers.uptime') }}
            </div>
            <div class="stat-content">
              <div v-if="selectedServer.loadingStats" class="loading-spinner"></div>
              <div v-else class="stat-value">
                {{ formatUptime(selectedServer.uptime || 0) }}
              </div>
            </div>
          </div>

          <!-- Informations supplémentaires -->
          <div class="server-stat-card">
            <div class="stat-header">
              <i class="fas fa-info-circle"></i>
              {{ t('settings.servers.info') }}
            </div>
            <div class="stat-content">
              <div class="stat-details">
                <div>{{ t('settings.servers.port') }}: {{ selectedServer.port }}</div>
                <div>{{ t('settings.servers.secure') }}: {{ selectedServer.secure ? t('common.yes') : t('common.no') }}</div>
                <div v-if="selectedServer.maxAccounts">{{ t('settings.servers.maxAccounts') }}: {{ selectedServer.maxAccounts }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Dernière mise à jour -->
        <div v-if="selectedServer.lastUpdated" class="last-updated">
          {{ t('settings.servers.last_updated') }}: {{ selectedServer.lastUpdated }}
        </div>
      </div>
    </div>

    <!-- Modal d'ajout/édition de serveur -->
    <div v-if="showServerModal" class="modal" tabindex="-1" role="dialog" style="display: block;">
      <div class="modal-dialog" role="document" @click.stop>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingServer.id ? t('settings.servers.edit') : t('settings.servers.add') }}
            </h5>
            <button type="button" class="close" @click="closeServerModal">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveServer">
              <div class="form-group">
                <label for="serverName">{{ t('settings.servers.name') }}</label>
                <input
                  type="text"
                  class="form-control"
                  id="serverName"
                  v-model="editingServer.name"
                  required
                />
              </div>
              <div class="form-group">
                <label for="serverType">{{ t('settings.servers.type') }}</label>
                <select
                  id="serverType"
                  v-model="editingServer.type"
                  class="form-control"
                  required
                  @change="updateDefaultPort"
                >
                  <option value="cPanel">cPanel</option>
                  <option value="Proxmox">Proxmox</option>
                  <option value="Virtualizor">Virtualizor</option>
                </select>
              </div>
              <div class="form-group">
                <label for="serverHostname">{{ t('settings.servers.hostname') }}</label>
                <input
                  type="text"
                  class="form-control"
                  id="serverHostname"
                  v-model="editingServer.hostname"
                  required
                />
              </div>
              <div class="form-group">
                <label for="serverIp">{{ t('settings.servers.ip') }}</label>
                <input
                  type="text"
                  class="form-control"
                  id="serverIp"
                  v-model="editingServer.ip"
                  required
                />
              </div>
              <div class="form-group">
                <label for="serverPort">{{ t('settings.servers.port') }}</label>
                <input
                  type="number"
                  class="form-control"
                  id="serverPort"
                  v-model="editingServer.port"
                />
              </div>
              <div class="form-group">
                <label for="serverUsername">{{ t('settings.servers.username') }}</label>
                <input
                  type="text"
                  class="form-control"
                  id="serverUsername"
                  v-model="editingServer.username"
                  required
                />
              </div>
              <div class="form-group">
                <label for="serverPassword">{{ t('settings.servers.password') }}</label>
                <input
                  type="password"
                  class="form-control"
                  id="serverPassword"
                  v-model="editingServer.password"
                  :required="!editingServer.id"
                />
                <small v-if="editingServer.id" class="form-text text-muted">
                  {{ t('settings.servers.passwordHint') }}
                </small>
              </div>
              <div v-if="editingServer.type === 'cPanel'" class="form-group">
                <label for="serverApiToken">{{ t('settings.servers.apiToken') }}</label>
                <input
                  type="password"
                  class="form-control"
                  id="serverApiToken"
                  v-model="editingServer.api_token"
                />
                <small v-if="editingServer.id" class="form-text text-muted">
                  {{ t('settings.servers.apiTokenInputHint') }}
                </small>
              </div>
              <div class="form-group">
                <label for="serverNameservers">{{ t('settings.servers.nameservers') }}</label>
                <textarea
                  class="form-control"
                  id="serverNameservers"
                  v-model="editingServer.nameservers"
                  placeholder="ns1.example.com&#10;ns2.example.com"
                  rows="3"
                ></textarea>
                <small class="form-text text-muted">
                  {{ t('settings.servers.nameserversHint') }}
                </small>
              </div>
              <div class="form-group">
                <label for="serverMaxAccounts">{{ t('settings.servers.maxAccounts') }}</label>
                <input
                  type="number"
                  class="form-control"
                  id="serverMaxAccounts"
                  v-model="editingServer.maxAccounts"
                  min="0"
                />
                <small class="form-text text-muted">
                  {{ t('settings.servers.maxAccountsHint') }}
                </small>
              </div>
              <div class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  id="serverSecure"
                  v-model="editingServer.secure"
                />
                <label class="form-check-label" for="serverSecure">
                  {{ t('settings.servers.secure') }}
                </label>
              </div>
              <div class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  id="serverActive"
                  v-model="editingServer.active"
                />
                <label class="form-check-label" for="serverActive">
                  {{ t('settings.servers.active') }}
                </label>
              </div>
              <div class="form-group mt-3">
                <small v-if="!isFormValid()" class="form-text text-muted">
                  {{ t('settings.servers.fillRequiredFields') }}
                </small>
              </div>
              <div class="modal-footer justify-content-between">
                <div>
                  <button type="button" class="btn btn-secondary" @click="closeServerModal">
                    {{ t('common.cancel') }}
                  </button>
                </div>
                <div>
                  <button 
                    type="button" 
                    class="btn btn-info me-2" 
                    @click="editingServer.id ? testServerConnection(editingServer) : testNewServerConnection()"
                    :disabled="testingConnection || !isFormValid()"
                  >
                    <span v-if="testingConnection" class="spinner-border spinner-border-sm" role="status"></span>
                    {{ t('settings.servers.testConnection') }}
                  </button>
                  <button type="submit" class="btn btn-primary" :disabled="saving">
                    <span v-if="saving" class="spinner-border spinner-border-sm" role="status"></span>
                    {{ t('common.save') }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal" tabindex="-1" role="dialog" style="display: block;">
      <div class="modal-dialog" role="document" @click.stop>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ t('common.confirmDelete') }}</h5>
            <button type="button" class="close" @click="cancelDeleteServer">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>{{ t('settings.servers.deleteConfirm', { name: serverToDelete?.name }) }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancelDeleteServer">
              {{ t('common.cancel') }}
            </button>
            <button type="button" class="btn btn-danger" @click="deleteServer">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useServersStore } from '@/stores/servers'
import { useNotificationStore } from '@/stores/notifications'

const { t } = useI18n({
  messages: {
    fr: {
      'settings.servers': {
        'title': 'Gestion des Serveurs',
        'description': 'Gérez vos serveurs et leurs configurations',
        'add': 'Ajouter un Serveur',
        'edit': 'Modifier le Serveur',
        'delete': 'Supprimer le Serveur',
        'name': 'Nom',
        'type': 'Type',
        'hostname': 'Nom d\'hôte',
        'ip': 'Adresse IP',
        'port': 'Port',
        'username': 'Nom d\'utilisateur',
        'password': 'Mot de passe',
        'passwordHint': 'Laissez vide si vous ne souhaitez pas modifier le mot de passe',
        'apiToken': 'Token API',
        'apiTokenHint': 'Laissez vide si vous ne souhaitez pas modifier le token API',
        'secure': 'Connexion sécurisée (SSL/TLS)',
        'active': 'Actif',
        'maxAccounts': 'Nombre maximum de comptes',
        'nameservers': 'Serveurs de noms (un par ligne)',
        'status': 'Statut',
        'online': 'En ligne',
        'offline': 'Hors ligne',
        'inactive': 'Inactif',
        'load': 'Charge CPU',
        'memory': 'Mémoire',
        'disk': 'Disque',
        'uptime': 'Temps de fonctionnement',
        'info': 'Informations',
        'used': 'Utilisé',
        'total': 'Total',
        'free': 'Libre',
        'lastCheck': 'Dernière vérification',
        'lastRefresh': 'Dernière actualisation',
        'refresh': 'Actualiser',
        'refreshing': 'Actualisation en cours...',
        'refreshSuccess': 'Statistiques actualisées avec succès',
        'refreshError': 'Erreur lors de l\'actualisation des statistiques',
        'testConnection': 'Tester la connexion',
        'testConnectionSuccess': 'Connexion réussie',
        'testConnectionError': 'Erreur de connexion',
        'confirmDelete': 'Êtes-vous sûr de vouloir supprimer ce serveur ?',
        'deleteSuccess': 'Serveur supprimé avec succès',
        'deleteError': 'Erreur lors de la suppression du serveur',
        'saveSuccess': 'Serveur enregistré avec succès',
        'saveError': 'Erreur lors de l\'enregistrement du serveur',
        'details': 'Détails du serveur',
        'requiredField': 'Ce champ est requis',
        'cancel': 'Annuler',
        'save': 'Enregistrer',
        'confirm': 'Confirmer',
        'cpuLoad': 'Charge CPU',
        'last_updated': 'Dernière mise à jour',
        'apiTokenInputHint': 'Entrez le token API'
      }
    }
  }
})

const serversStore = useServersStore()
const notificationStore = useNotificationStore()

// État
const loading = ref(true)
const saving = ref(false)
const testingConnection = ref(false)
const servers = ref([])
const showServerModal = ref(false)
const showDeleteModal = ref(false)
const editingServer = ref({
  id: null,
  name: '',
  hostname: '',
  type: 'cPanel',
  username: '',
  password: '',
  port: 2087,
  secure: true,
  active: true,
  api_token: '',
  ip: '',
  maxAccounts: 0,
  nameservers: ''
})
const serverToDelete = ref(null)
const selectedServer = ref({
  loadingStats: false
})

// Méthodes
const fetchServers = async () => {
  loading.value = true
  try {
    servers.value = await serversStore.fetchServers()
  } catch (error) {
    console.error('Error fetching servers:', error)
    notificationStore.error(t('common.errorFetching'))
  } finally {
    loading.value = false
  }
}

const openServerModal = (server = null) => {
  if (server) {
    // Édition d'un serveur existant
    editingServer.value = {
      id: server.id,
      name: server.name,
      hostname: server.hostname,
      type: server.type || 'cPanel', // Ajouter une valeur par défaut si type est vide
      username: server.username,
      password: '', // Ne pas afficher le mot de passe existant
      port: server.port || 2087,
      secure: server.secure !== undefined ? server.secure : true,
      active: server.active !== undefined ? server.active : true,
      api_token: '',
      ip: server.ip || '',
      maxAccounts: server.maxAccounts || 0,
      nameservers: server.nameservers || ''
    }
    
    // Ajouter des logs pour déboguer
    console.log('Serveur à éditer:', server);
    console.log('Type de serveur:', server.type);
    console.log('Statut actif:', server.active);
    console.log('Statut secure:', server.secure);
  } else {
    // Création d'un nouveau serveur
    editingServer.value = {
      id: null,
      name: '',
      hostname: '',
      type: 'cPanel',
      username: '',
      password: '',
      port: 2087,
      secure: true,
      active: true,
      api_token: '',
      ip: '',
      maxAccounts: 0,
      nameservers: ''
    }
  }
  showServerModal.value = true
}

const closeServerModal = () => {
  showServerModal.value = false
}

const saveServer = async () => {
  saving.value = true
  try {
    if (editingServer.value.id) {
      // Mise à jour d'un serveur existant
      await serversStore.updateServer(editingServer.value)
      notificationStore.success(t('settings.servers.saveSuccess'))
    } else {
      // Création d'un nouveau serveur
      await serversStore.createServer(editingServer.value)
      notificationStore.success(t('settings.servers.saveSuccess'))
    }
    closeServerModal()
    fetchServers()
  } catch (error) {
    console.error('Error saving server:', error)
    notificationStore.error(t('settings.servers.saveError'))
  } finally {
    saving.value = false
  }
}

const confirmDeleteServer = (server) => {
  serverToDelete.value = server
  showDeleteModal.value = true
}

const cancelDeleteServer = () => {
  serverToDelete.value = null
  showDeleteModal.value = false
}

const deleteServer = async () => {
  try {
    await serversStore.deleteServer(serverToDelete.value.id)
    notificationStore.success(t('settings.servers.deleteSuccess'))
    cancelDeleteServer()
    fetchServers()
  } catch (error) {
    console.error('Error deleting server:', error)
    notificationStore.error(t('settings.servers.deleteError'))
  }
}

const testServerConnection = async (server) => {
  testingConnection.value = true
  try {
    const result = await serversStore.testServerConnection(server.id)
    if (result.success) {
      notificationStore.success(t('settings.servers.testSuccess'))
    } else {
      notificationStore.error(t('settings.servers.testError'))
    }
  } catch (error) {
    console.error('Error testing server connection:', error)
    notificationStore.error(t('settings.servers.testError'))
  } finally {
    testingConnection.value = false
  }
}

const testNewServerConnection = async () => {
  testingConnection.value = true
  try {
    const result = await serversStore.testServerConnection(null, editingServer.value)
    if (result.success) {
      notificationStore.success(t('settings.servers.testSuccess'))
    } else {
      notificationStore.error(t('settings.servers.testError'))
    }
  } catch (error) {
    console.error('Error testing new server connection:', error)
    notificationStore.error(t('settings.servers.testError'))
  } finally {
    testingConnection.value = false
  }
}

const isFormValid = () => {
  return (
    editingServer.value.name !== '' &&
    editingServer.value.hostname !== '' &&
    editingServer.value.username !== '' &&
    editingServer.value.password !== '' &&
    editingServer.value.ip !== ''
  )
}

const getStatusClass = (status) => {
  return {
    'status-active': status,
    'status-inactive': !status
  }
}

const getTypeClass = (type) => {
  return {
    'server-type-badge-cpanel': type === 'cPanel',
    'server-type-badge-proxmox': type === 'Proxmox',
    'server-type-badge-virtualizor': type === 'Virtualizor'
  }
}

const getServerStatusClass = (status) => {
  return {
    'status-online': status === 'online',
    'status-offline': status === 'offline'
  }
}

const getLoadClass = (load) => {
  if (load < 33) {
    return 'bg-success'
  } else if (load < 66) {
    return 'bg-warning'
  } else {
    return 'bg-danger'
  }
}

const toggleServerDetails = (server) => {
  if (selectedServer.value && selectedServer.value.id === server.id) {
    selectedServer.value = null
  } else {
    selectedServer.value = server
  }
}

const refreshServerStats = async (server) => {
  if (!server || !server.id) {
    return;
  }
  
  // Mettre à jour l'état de chargement
  server.loadingStats = true;
  
  try {
    const response = await serversStore.getServerStats(server.id);
    
    if (response.data && response.data.success) {
      // Mettre à jour les statistiques du serveur
      server.stats = response.data.data;
      server.status = response.data.data.status;
      server.lastUpdated = new Date().toLocaleString();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du serveur:', error);
    
    // Notifier l'utilisateur de l'erreur
    notificationStore.error(t('settings.servers.stats_error'));
  } finally {
    // Réinitialiser l'état de chargement
    server.loadingStats = false;
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const formatUptime = (seconds) => {
  if (!seconds) return '0 secondes';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = '';
  
  if (days > 0) {
    result += `${days} jour${days > 1 ? 's' : ''} `;
  }
  
  if (hours > 0 || days > 0) {
    result += `${hours} heure${hours > 1 ? 's' : ''} `;
  }
  
  result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
  
  return result;
}

const formatUptimeSince = (seconds) => {
  if (!seconds) return '';
  
  const startDate = new Date(Date.now() - (seconds * 1000));
  
  return startDate.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const updateDefaultPort = () => {
  switch (editingServer.value.type) {
    case 'cPanel':
      editingServer.value.port = 2087
      break
    case 'Proxmox':
      editingServer.value.port = 8006
      break
    case 'Virtualizor':
      editingServer.value.port = 4085
      break
    default:
      editingServer.value.port = 2087
  }
}

// Cycle de vie
onMounted(() => {
  fetchServers()
})
</script>
