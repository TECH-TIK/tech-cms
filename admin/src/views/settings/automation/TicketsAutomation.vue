<template>
  <div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5>Automatisation des tickets</h5>
      <button class="btn btn-sm btn-primary" :disabled="isSaving" @click="saveSettings">
        <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <i v-else class="bi bi-save me-1"></i> Enregistrer
      </button>
    </div>
    <div class="card-body">
      <form @submit.prevent="saveSettings">
        <!-- Fermeture automatique des tickets inactifs -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoClose" v-model="settings.auto_close_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoClose">Fermeture automatique des tickets inactifs</label>
          </div>
          <div v-if="settings.auto_close_enabled" class="mt-2">
            <div class="input-group">
              <input v-model.number="settings.close_inactive_days" type="number" class="form-control" min="1" max="365">
              <span class="input-group-text">jours</span>
            </div>
            <small class="text-muted">Fermer automatiquement les tickets qui n'ont pas reçu de réponse pendant ce nombre de jours</small>
          </div>
        </div>
        
        <!-- Notification au client -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="notifyOnClose" v-model="settings.notify_on_auto_close" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="notifyOnClose">Notifier le client lors de la fermeture automatique</label>
          </div>
        </div>
        
        <!-- Rappels de tickets sans réponse -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableReminders" v-model="settings.reminders_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableReminders">Rappels pour tickets sans réponse des administrateurs</label>
          </div>
          <div v-if="settings.reminders_enabled" class="mt-2">
            <div class="input-group mb-2">
              <input v-model.number="settings.first_reminder_hours" type="number" class="form-control" min="1" max="48">
              <span class="input-group-text">heures</span>
            </div>
            <small class="text-muted">Envoyer le premier rappel après ce délai sans réponse d'un administrateur</small>
            
            <div class="input-group mt-2">
              <input v-model.number="settings.escalation_hours" type="number" class="form-control" min="1" max="72">
              <span class="input-group-text">heures supplémentaires</span>
            </div>
            <small class="text-muted">Escalader le ticket aux administrateurs seniors après ce délai additionnel</small>
          </div>
        </div>
        
        <!-- Assignation automatique des tickets -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoAssign" v-model="settings.auto_assign_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoAssign">Assignation automatique des tickets</label>
          </div>
          <div v-if="settings.auto_assign_enabled" class="mt-2">
            <select v-model="settings.auto_assign_method" class="form-select">
              <option value="round_robin">Répartition équitable (Round-robin)</option>
              <option value="load_balance">Équilibrage de charge (selon la charge actuelle)</option>
              <option value="department_head">Au responsable du département</option>
            </select>
            <small class="text-muted">Méthode d'assignation automatique des nouveaux tickets</small>
          </div>
        </div>
        
        <!-- Notifications de nouveaux tickets -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="notifyNewTickets" v-model="settings.notify_new_tickets" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="notifyNewTickets">Notifier les administrateurs des nouveaux tickets</label>
          </div>
          <div v-if="settings.notify_new_tickets" class="mt-2">
            <select v-model="settings.notify_admin_group" class="form-select" multiple>
              <option v-for="group in adminGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
            </select>
            <small class="text-muted">Groupes d'administrateurs à notifier (aucune sélection = tous)</small>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';

export default {
  name: 'TicketsAutomation',
  setup() {
    const notificationStore = useNotificationStore();
    const settingsStore = useSettingsStore();
    const isSaving = ref(false);
    
    // Paramètres par défaut
    const settings = ref({
      auto_close_enabled: false,
      close_inactive_days: 30,
      notify_on_auto_close: true,
      reminders_enabled: false,
      first_reminder_hours: 24,
      escalation_hours: 48,
      auto_assign_enabled: false,
      auto_assign_method: 'round_robin',
      notify_new_tickets: true,
      notify_admin_group: []
    });
    
    // Groupes d'administrateurs fictifs (à remplacer par des données réelles)
    const adminGroups = ref([
      { id: 1, name: 'Support niveau 1' },
      { id: 2, name: 'Support niveau 2' },
      { id: 3, name: 'Administrateurs' }
    ]);
    
    // Chargement des paramètres depuis le store settings
    const loadSettings = async () => {
      try {
        // Récupération des paramètres d'automatisation des tickets via le store
        await settingsStore.fetchAutomationSettings('tickets');
        
        // Si les paramètres sont disponibles dans le store, on les utilise
        if (settingsStore.automationSettings.value && settingsStore.automationSettings.value.tickets) {
          settings.value = { ...settings.value, ...settingsStore.automationSettings.value.tickets };
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres d\'automatisation des tickets:', error);
        notificationStore.showNotification({
          title: 'Erreur de connexion',
          text: 'Impossible de communiquer avec le serveur',
          type: 'error'
        });
      }
    };
    
    // Enregistrement des paramètres via le store settings
    const saveSettings = async () => {
      isSaving.value = true;
      
      try {
        // Mise à jour des paramètres d'automatisation des tickets via le store
        await settingsStore.updateAutomationSettings({ settings: settings.value }, 'tickets');
        
        // Vérification du succès de l'opération
        if (settingsStore.success) {
          notificationStore.showNotification({
            title: 'Enregistrement réussi',
            text: 'Paramètres d\'automatisation des tickets enregistrés',
            type: 'success'
          });
        } else if (settingsStore.error) {
          notificationStore.showNotification({
            title: 'Erreur d\'enregistrement',
            text: 'Erreur lors de l\'enregistrement: ' + settingsStore.error,
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement des paramètres d\'automatisation des tickets:', error);
        notificationStore.showNotification({
          title: 'Erreur de connexion',
          text: 'Impossible de communiquer avec le serveur',
          type: 'error'
        });
      } finally {
        isSaving.value = false;
      }
    };
    
    // Chargement des paramètres au montage du composant
    onMounted(() => {
      loadSettings();
    });
    
    return {
      settings,
      adminGroups,
      isSaving,
      saveSettings
    };
  }
};
</script>