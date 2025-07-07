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
            <button class="btn btn-primary" @click="openServerModal()">
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
              <tr v-for="server in servers" :key="server.id" class="server-row" :class="{'selected': selectedServer && selectedServer.id === server.id}" @click="toggleServerDetails(server)">
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
                    <button class="btn btn-sm btn-info mr-1" title="Test Connection" @click.stop="testServerConnection(server)">
                      <i class="fas fa-plug"></i>
                    </button>
                    <button class="btn btn-sm btn-primary mr-1" title="Edit" @click.stop="openServerModal(server)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" title="Delete" @click.stop="confirmDeleteServer(server)">
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
          <button class="btn btn-sm btn-outline-primary" @click="refreshServerStats(selectedServer)">
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
                                <div v-if="selectedServer.stats && selectedServer.stats.last_updated" class="stat-details">
                  {{ t('settings.servers.lastRefresh') }}: {{ formatDate(selectedServer.stats.last_updated) }}
                </div>
                <div v-if="selectedServer.last_check" class="stat-details">
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
                <div class="stat-value">{{ selectedServer.stats && selectedServer.stats.server_load ? selectedServer.stats.server_load : 0 }}%</div>
                <div class="progress">
                  <div 
                    class="progress-bar" 
                    :class="getLoadClass(selectedServer.stats && selectedServer.stats.server_load ? selectedServer.stats.server_load : 0)" 
                    :style="{ width: `${selectedServer.stats && selectedServer.stats.server_load ? selectedServer.stats.server_load : 0}%` }"
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
                  {{ selectedServer.stats && selectedServer.stats.memory && selectedServer.stats.memory.percent ? selectedServer.stats.memory.percent + '%' : '0%' }}
                </div>
                <div class="progress">
                  <div 
                    class="progress-bar" 
                    :class="getLoadClass(selectedServer.stats && selectedServer.stats.memory ? selectedServer.stats.memory.percent : 0)" 
                    :style="{ width: `${selectedServer.stats && selectedServer.stats.memory ? selectedServer.stats.memory.percent : 0}%` }"
                  ></div>
                </div>
                <div v-if="selectedServer.stats && selectedServer.stats.memory" class="stat-details">
                  {{ formatBytes(selectedServer.stats.memory.used || 0) }} / {{ formatBytes(selectedServer.stats.memory.total || 0) }}
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
                  {{ selectedServer.stats && selectedServer.stats.disk && selectedServer.stats.disk.percent ? selectedServer.stats.disk.percent + '%' : '0%' }}
                </div>
                <div class="progress">
                  <div 
                    class="progress-bar" 
                    :class="getLoadClass(selectedServer.stats && selectedServer.stats.disk ? selectedServer.stats.disk.percent : 0)" 
                    :style="{ width: `${selectedServer.stats && selectedServer.stats.disk ? selectedServer.stats.disk.percent : 0}%` }"
                  ></div>
                </div>
                <div v-if="selectedServer.stats && selectedServer.stats.disk" class="stat-details">
                  {{ formatBytes(selectedServer.stats.disk.used || 0) }} / {{ formatBytes(selectedServer.stats.disk.total || 0) }}
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
              <div v-else-if="selectedServer.stats" class="stat-value">
                {{ formatUptime(selectedServer.stats.uptime || 0) }}
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
                  id="serverName"
                  v-model="editingServer.name"
                  type="text"
                  class="form-control"
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
                  <option value="" disabled>{{ t('settings.servers.selectModule') }}</option>
                  <option v-for="(module, moduleName) in availableServerModules" :key="moduleName" :value="module.name">{{ module.display_name || module.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="serverHostname">{{ t('settings.servers.hostname') }}</label>
                <input
                  id="serverHostname"
                  v-model="editingServer.hostname"
                  type="text"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group">
                <label for="serverIp">{{ t('settings.servers.ip') }}</label>
                <input
                  id="serverIp"
                  v-model="editingServer.ip"
                  type="text"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group">
                <label for="serverPort">{{ t('settings.servers.port') }}</label>
                <input
                  id="serverPort"
                  v-model="editingServer.port"
                  type="number"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label for="serverUsername">{{ t('settings.servers.username') }}</label>
                <input
                  id="serverUsername"
                  v-model="editingServer.username"
                  type="text"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group">
                <label for="serverPassword">{{ t('settings.servers.password') }}</label>
                <input
                  id="serverPassword"
                  v-model="editingServer.password"
                  type="password"
                  class="form-control"
                  :required="!editingServer.id"
                />
                <small v-if="editingServer.id" class="form-text text-muted">
                  {{ t('settings.servers.passwordHint') }}
                </small>
              </div>
              <div v-if="editingServer.type === 'cpanel'" class="form-group">
                <label for="serverApiToken">{{ t('settings.servers.apiToken') }}</label>
                <input
                  id="serverApiToken"
                  v-model="editingServer.api_token"
                  type="password"
                  class="form-control"
                />
                <small v-if="editingServer.id" class="form-text text-muted">
                  {{ t('settings.servers.apiTokenInputHint') }}
                </small>
              </div>
              <div class="form-group">
                <label for="serverNameservers">{{ t('settings.servers.nameservers') }}</label>
                <textarea
                  id="serverNameservers"
                  v-model="editingServer.nameservers"
                  class="form-control"
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
                  id="serverMaxAccounts"
                  v-model="editingServer.maxAccounts"
                  type="number"
                  class="form-control"
                  min="0"
                />
                <small class="form-text text-muted">
                  {{ t('settings.servers.maxAccountsHint') }}
                </small>
              </div>
              <div class="form-check">
                <input
                  id="serverSecure"
                  v-model="editingServer.secure"
                  type="checkbox"
                  class="form-check-input"
                />
                <label class="form-check-label" for="serverSecure">
                  {{ t('settings.servers.secure') }}
                </label>
              </div>
              <div class="form-check">
                <input
                  id="serverActive"
                  v-model="editingServer.active"
                  type="checkbox"
                  class="form-check-input"
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
                    :disabled="testingConnection || !isFormValid()"
                    @click="editingServer.id ? testServerConnection(editingServer as Server) : testNewServerConnection()"
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
import { ref, onMounted, type Ref } from 'vue'
import { ApiService } from '@/services/api'
import type { Server, ServerModule } from '@/types/server.d.ts'



import { useI18n } from 'vue-i18n';
import logger from '@/services/logger';
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
        'selectModule': 'Sélectionner un module',
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
const servers: Ref<Server[]> = ref([])
const availableServerModules: Ref<{ [key: string]: ServerModule }> = ref({});
const showServerModal = ref(false)
const showDeleteModal = ref(false)
const editingServer: Ref<Partial<Server>> = ref({
  type: 'cPanel',
  port: 2087,
  secure: true,
  active: true,
  name: '',
  hostname: '',
  username: '',
  password: '',
  api_token: '',
  ip: '',
  maxAccounts: 0,
  nameservers: ''
})
const serverToDelete: Ref<Server | null> = ref(null)
const selectedServer: Ref<Server | null> = ref(null)

// Méthodes
const fetchServers = async () => {
  loading.value = true
  try {
    servers.value = await serversStore.fetchServers()
  } catch (error) {
    if (logger) logger.error('Error fetching servers', { error });
    if (notificationStore) notificationStore.error(t('common.errorFetching'));
  } finally {
    loading.value = false
  }
}

const openServerModal = (server: Server | null = null) => {
  if (server) {
    // Édition d'un serveur existant
    editingServer.value = {
      ...server,
      password: '', // Ne pas pré-remplir le mot de passe pour la sécurité
      api_token: '', // Ne pas pré-remplir le token pour la sécurité
      type: server.type // Conserver le type lors de l'édition pour le pré-remplir
    };
  } else {
    // Création d'un nouveau serveur
    editingServer.value = {
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
    };
  }
  showServerModal.value = true;
}

const closeServerModal = () => {
  showServerModal.value = false
}

const saveServer = async () => {
  const serverData = editingServer.value;

  // Validation des champs requis
  if (!serverData.name || !serverData.hostname || !serverData.username || !serverData.ip) {
    if (notificationStore) notificationStore.error('Veuillez remplir tous les champs obligatoires.');
    return;
  }
  if (!serverData.id && !serverData.password) {
    if (notificationStore) notificationStore.error('Le mot de passe est requis pour la création d\'un nouveau serveur.');
    return;
  }

  saving.value = true;
  try {
    if (serverData.id) {
      await serversStore.updateServer(serverData as Server);
    } else {
      await serversStore.createServer(serverData as Server);
    }
    if (notificationStore) notificationStore.success(t('settings.servers.saveSuccess'));
    closeServerModal();
    fetchServers();
  } catch (error) {
    if (logger) logger.error('Error saving server', { error });
    if (notificationStore) notificationStore.error(t('settings.servers.saveError'));
  } finally {
    saving.value = false;
  }
}

const confirmDeleteServer = (server: Server) => {
  serverToDelete.value = server
  showDeleteModal.value = true
}

const cancelDeleteServer = () => {
  serverToDelete.value = null
  showDeleteModal.value = false
}

const deleteServer = async () => {
  if (!serverToDelete.value || typeof serverToDelete.value.id === 'undefined') {
    if (logger) logger.warn('Attempted to delete a server without an ID.');
    if (serverToDelete.value) {
      cancelDeleteServer();
    }
    return;
  }

  try {
    await serversStore.deleteServer(serverToDelete.value.id);
    if (notificationStore) notificationStore.success(t('settings.servers.deleteSuccess'));
    fetchServers();
  } catch (error) {
    if (logger) logger.error('Error deleting server', { error });
    if (notificationStore) notificationStore.error(t('settings.servers.deleteError'));
  } finally {
    cancelDeleteServer();
  }
}

const testServerConnection = async (server: Server) => {
  if (typeof server.id === 'undefined') {
    if (logger) logger.warn('testServerConnection called on a server without an ID.', { server });
    return;
  }
  testingConnection.value = true;
  try {
    const result = await serversStore.testServerConnection(server.id);
    if (result.success) {
      if (notificationStore) notificationStore.success(t('settings.servers.testSuccess'));
    } else {
      if (notificationStore) notificationStore.error(t('settings.servers.testError'));
    }
  } catch (error) {
    if (logger) logger.error('Error testing server connection', { error, serverId: server.id });
    if (notificationStore) notificationStore.error(t('settings.servers.testError'));
  } finally {
    testingConnection.value = false;
  }
}

const testNewServerConnection = async () => {
  testingConnection.value = true;
  try {
    // Assurons-nous que les données sont conformes avant de les envoyer
    const result = await serversStore.testServerConnection(null, editingServer.value as Server);
    if (result.success) {
      if (notificationStore) notificationStore.success(t('settings.servers.testConnectionSuccess'));
    } else {
      if (notificationStore) notificationStore.error(t('settings.servers.testConnectionError'));
    }
  } catch (error) {
    if (logger) logger.error('Error testing new server connection', { error });
    if (notificationStore) notificationStore.error(t('settings.servers.testConnectionError'));
  } finally {
    testingConnection.value = false;
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

const getStatusClass = (status: boolean) => {
  return {
    'status-active': status,
    'status-inactive': !status
  }
}

const getTypeClass = (type: string) => {
  return {
    'server-type-badge-cpanel': type === 'cPanel',
    'server-type-badge-proxmox': type === 'Proxmox',
    'server-type-badge-virtualizor': type === 'Virtualizor'
  }
}

const getServerStatusClass = (status: Server['status']) => {
  return {
    'status-online': status === 'online',
    'status-offline': status === 'offline'
  }
}

const getLoadClass = (load: number) => {
  if (load < 33) {
    return 'bg-success'
  } else if (load < 66) {
    return 'bg-warning'
  } else {
    return 'bg-danger'
  }
}

const toggleServerDetails = (server: Server) => {
  if (selectedServer.value && selectedServer.value.id === server.id) {
    selectedServer.value = null
  } else {
    selectedServer.value = server
  }
}

const refreshServerStats = async (server: Server) => {
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
    if (logger) logger.error('Erreur lors de la récupération des statistiques du serveur', { error });
    
    // Notifier l'utilisateur de l'erreur
    if (notificationStore) notificationStore.error(t('settings.servers.stats_error'));
  } finally {
    // Réinitialiser l'état de chargement
    server.loadingStats = false;
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const formatUptime = (seconds: number | undefined) => {
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


const updateDefaultPort = () => {
  // Type est maintenant le nom du module (en minuscules)
  const serverType = editingServer.value.type ? editingServer.value.type.toLowerCase() : '';
  switch (serverType) {
    case 'cpanel':
      editingServer.value.port = 2087
      break
    case 'proxmox':
      editingServer.value.port = 8006
      break
    case 'virtualizor':
      editingServer.value.port = 4085
      break
    default:
      editingServer.value.port = 2087
  }
}

// Fonctions pour la gestion des modules
async function fetchAvailableServerModules() {
  try {
    const response = await ApiService.routes.admin.system.module.list('servers')
    const data = response.data
    
    if (data.success && data.data && data.data.servers) {
      availableServerModules.value = data.data.servers
    } else {
      notificationStore.notificationError('Erreur lors du chargement des modules de serveurs')
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des modules de serveurs', { error });
    notificationStore.notificationError('Erreur lors du chargement des modules de serveurs')
  }
}

// Cycle de vie
onMounted(async () => {
  // Charger d'abord les modules de type servers disponibles
  await fetchAvailableServerModules()
  
  // Ensuite charger les serveurs
  await fetchServers()
  
  // Vérifier si un type de module est spécifié dans l'URL
  const urlParams = new URLSearchParams(window.location.search)
  const moduleType = urlParams.get('moduleType')
  
  if (moduleType) {
    // Chercher le module avec le bon name
    for (const key in availableServerModules.value) {
      if (availableServerModules.value[key].name === moduleType) {
        editingServer.value.type = moduleType;
        break;
      }
    }
    updateDefaultPort()
    openServerModal()
  }
})
</script>
