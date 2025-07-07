<template>
  <div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5>Automatisation des services</h5>
      <button class="btn btn-sm btn-primary" :disabled="isSaving" @click="saveSettings">
        <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <i v-else class="bi bi-save me-1"></i> Enregistrer
      </button>
    </div>
    <div class="card-body">
      <form @submit.prevent="saveSettings">
        <!-- Suspension automatique des services -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoSuspend" v-model="settings.auto_suspend_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoSuspend">Suspension automatique des services impayés</label>
          </div>
          <div v-if="settings.auto_suspend_enabled" class="mt-2">
            <div class="input-group">
              <input v-model.number="settings.suspend_days" type="number" class="form-control" min="1" max="60">
              <span class="input-group-text">jours après l'échéance</span>
            </div>
            <small class="text-muted">Suspendre automatiquement les services impayés après ce nombre de jours</small>
          </div>
        </div>
        
        <!-- Email avant la suspension -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enablePreSuspendEmail" v-model="settings.pre_suspend_email" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enablePreSuspendEmail">Email de pré-suspension</label>
          </div>
          <div v-if="settings.pre_suspend_email" class="mt-2">
            <div class="input-group">
              <input v-model.number="settings.pre_suspend_days" type="number" class="form-control" min="1" max="30">
              <span class="input-group-text">jours avant la suspension</span>
            </div>
            <small class="text-muted">Envoyer un avertissement avant la suspension automatique</small>
          </div>
        </div>
        
        <!-- Résiliation automatique -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoTerminate" v-model="settings.auto_terminate_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoTerminate">Résiliation automatique des services suspendus</label>
          </div>
          <div v-if="settings.auto_terminate_enabled" class="mt-2">
            <div class="input-group">
              <input v-model.number="settings.terminate_days" type="number" class="form-control" min="1" max="90">
              <span class="input-group-text">jours après la suspension</span>
            </div>
            <small class="text-muted">Résilier automatiquement les services suspendus après ce nombre de jours</small>
          </div>
        </div>
        
        <!-- Email avant la résiliation -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enablePreTerminateEmail" v-model="settings.pre_terminate_email" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enablePreTerminateEmail">Email de pré-résiliation</label>
          </div>
          <div v-if="settings.pre_terminate_email" class="mt-2">
            <div class="input-group">
              <input v-model.number="settings.pre_terminate_days" type="number" class="form-control" min="1" max="30">
              <span class="input-group-text">jours avant la résiliation</span>
            </div>
            <small class="text-muted">Envoyer un avertissement avant la résiliation automatique</small>
          </div>
        </div>
        
        <!-- Renouvellement automatique -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoRenew" v-model="settings.auto_renew_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoRenew">Renouvellement automatique des services</label>
          </div>
          <div v-if="settings.auto_renew_enabled" class="mt-2">
            <div class="form-check">
              <input id="renewOnlyWithCard" v-model="settings.renew_only_with_card" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="renewOnlyWithCard">Uniquement pour les clients avec carte de crédit enregistrée</label>
            </div>
            <div class="form-check">
              <input id="createInvoicesForRenew" v-model="settings.create_invoices_for_renewal" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="createInvoicesForRenew">Créer des factures pour les clients sans paiement automatique</label>
            </div>
          </div>
        </div>
        
        <!-- Notification de services actifs -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableServiceNotifications" v-model="settings.service_notifications" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableServiceNotifications">Notifications périodiques des services actifs</label>
          </div>
          <div v-if="settings.service_notifications" class="mt-2">
            <select v-model="settings.service_notification_frequency" class="form-select">
              <option value="monthly">Mensuelle</option>
              <option value="quarterly">Trimestrielle</option>
              <option value="biannually">Semestrielle</option>
              <option value="annually">Annuelle</option>
              <option value="never">Jamais</option>
            </select>
            <small class="text-muted">Fréquence des notifications récapitulatives des services actifs</small>
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
  name: 'ServicesAutomation',
  setup() {
    const notificationStore = useNotificationStore();
    const settingsStore = useSettingsStore();
    const isSaving = ref(false);
    
    // Paramètres par défaut
    const settings = ref({
      auto_suspend_enabled: false,
      suspend_days: 14,
      pre_suspend_email: true,
      pre_suspend_days: 2,
      auto_terminate_enabled: false,
      terminate_days: 30,
      pre_terminate_email: true,
      pre_terminate_days: 7,
      auto_renew_enabled: true,
      renew_only_with_card: true,
      create_invoices_for_renewal: true,
      service_notifications: false,
      service_notification_frequency: 'quarterly'
    });
    
    // Chargement des paramètres depuis le store settings
    const loadSettings = async () => {
      try {
        // Récupération des paramètres d'automatisation des services via le store
        await settingsStore.fetchAutomationSettings('services');
        
        // Si les paramètres sont disponibles dans le store, on les utilise
        if (settingsStore.automationSettings.value && settingsStore.automationSettings.value.services) {
          settings.value = { ...settings.value, ...settingsStore.automationSettings.value.services };
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres d\'automatisation des services:', error);
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
        // Mise à jour des paramètres d'automatisation des services via le store
        await settingsStore.updateAutomationSettings({ settings: settings.value }, 'services');
        
        // Vérification du succès de l'opération
        if (settingsStore.success) {
          notificationStore.showNotification({
            title: 'Enregistrement réussi',
            text: 'Paramètres d\'automatisation des services enregistrés',
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
        console.error('Erreur lors de l\'enregistrement des paramètres d\'automatisation des services:', error);
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
      isSaving,
      saveSettings
    };
  }
};
</script>