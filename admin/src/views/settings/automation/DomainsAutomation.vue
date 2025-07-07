<template>
  <div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5>Automatisation des domaines</h5>
      <button class="btn btn-sm btn-primary" :disabled="isSaving" @click="saveSettings">
        <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <i v-else class="bi bi-save me-1"></i> Enregistrer
      </button>
    </div>
    <div class="card-body">
      <form @submit.prevent="saveSettings">
        <!-- Rappels de renouvellement -->
        <div class="form-group mb-3">
          <label class="form-label">Rappels de renouvellement de domaines</label>
          <div class="row g-2 mb-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">Premier rappel</span>
                <input v-model.number="settings.first_reminder_days" type="number" class="form-control" min="1" max="90">
                <span class="input-group-text">jours avant expiration</span>
              </div>
            </div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">Second rappel</span>
                <input v-model.number="settings.second_reminder_days" type="number" class="form-control" min="1" max="30">
                <span class="input-group-text">jours avant expiration</span>
              </div>
            </div>
          </div>
          <div class="row g-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">Rappel final</span>
                <input v-model.number="settings.final_reminder_days" type="number" class="form-control" min="1" max="10">
                <span class="input-group-text">jours avant expiration</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Rappels après expiration -->
        <div class="form-group mb-3">
          <label class="form-label">Rappels après expiration</label>
          <div class="row g-2 mb-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">Premier rappel</span>
                <input v-model.number="settings.expired_first_reminder_days" type="number" class="form-control" min="1" max="10">
                <span class="input-group-text">jours après expiration</span>
              </div>
            </div>
          </div>
          <div class="row g-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">Second rappel</span>
                <input v-model.number="settings.expired_second_reminder_days" type="number" class="form-control" min="5" max="30">
                <span class="input-group-text">jours après expiration</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Renouvellement automatique -->
        <div class="form-group mb-3">
          <div class="form-check form-switch mb-2">
            <input id="enableAutoRenew" v-model="settings.auto_renewal_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoRenew">Renouvellement automatique des domaines</label>
          </div>
          <div v-if="settings.auto_renewal_enabled" class="mt-2">
            <select v-model="settings.auto_renewal_days" class="form-select mb-2">
              <option value="30">30 jours avant expiration</option>
              <option value="15">15 jours avant expiration</option>
              <option value="10">10 jours avant expiration</option>
              <option value="7">7 jours avant expiration</option>
              <option value="3">3 jours avant expiration</option>
            </select>
            
            <div class="form-check">
              <input id="renewOnlyActive" v-model="settings.renew_only_active" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="renewOnlyActive">Uniquement les domaines avec renouvellement automatique activé</label>
            </div>
            
            <div class="form-check">
              <input id="createInvoices" v-model="settings.create_invoices" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="createInvoices">Créer des factures pour les domaines sans carte enregistrée</label>
            </div>
          </div>
        </div>
        
        <!-- Vérification WHOIS -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableWhoisSync" v-model="settings.whois_sync_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableWhoisSync">Synchronisation des dates d'expiration WHOIS</label>
          </div>
          <div v-if="settings.whois_sync_enabled" class="mt-2">
            <select v-model="settings.whois_sync_frequency" class="form-select">
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Bihebdomadaire</option>
              <option value="monthly">Mensuelle</option>
            </select>
            <small class="text-muted">Fréquence de vérification WHOIS pour synchroniser les dates d'expiration</small>
          </div>
        </div>
        
        <!-- Synchronisation des prix TLD -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enablePriceSync" v-model="settings.price_sync_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enablePriceSync">Synchronisation automatique des prix TLD</label>
          </div>
          <div v-if="settings.price_sync_enabled" class="mt-2">
            <select v-model="settings.price_sync_frequency" class="form-select">
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Bihebdomadaire</option>
              <option value="monthly">Mensuelle</option>
              <option value="quarterly">Trimestrielle</option>
            </select>
            <small class="text-muted">Fréquence de synchronisation des prix avec les registrars</small>
            
            <div class="form-check mt-2">
              <input id="updateExistingPricing" v-model="settings.update_existing_pricing" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="updateExistingPricing">Mettre à jour les prix des domaines existants</label>
            </div>
            
            <div class="form-check">
              <input id="alertOnChanges" v-model="settings.alert_on_changes" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="alertOnChanges">Alerter les administrateurs lors des changements de prix</label>
            </div>
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
  name: 'DomainsAutomation',
  setup() {
    const notificationStore = useNotificationStore();
    const settingsStore = useSettingsStore();
    const isSaving = ref(false);
    
    // Initialisation des paramètres avec des valeurs par défaut
    // Si le store settings ne contient pas encore les paramètres domains
    const settings = ref({
      first_reminder_days: 30,
      second_reminder_days: 14,
      final_reminder_days: 7,
      expired_first_reminder_days: 1,
      expired_second_reminder_days: 7,
      auto_renewal_enabled: true,
      auto_renewal_days: 15,
      renew_only_active: true,
      create_invoices: true,
      whois_sync_enabled: true,
      whois_sync_frequency: 'weekly',
      price_sync_enabled: false,
      price_sync_frequency: 'monthly',
      update_existing_pricing: false,
      alert_on_changes: true
    });
    
    // Chargement des paramètres depuis le store settings
    const loadSettings = async () => {
      try {
        // Récupération des paramètres d'automatisation des domaines via le store
        await settingsStore.fetchAutomationSettings('domains');
        
        // Si les paramètres sont disponibles dans le store, on les utilise
        if (settingsStore.automationSettings.value && settingsStore.automationSettings.value.domains) {
          settings.value = { ...settings.value, ...settingsStore.automationSettings.value.domains };
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres d\'automatisation des domaines:', error);
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
        // Mise à jour des paramètres d'automatisation des domaines via le store
        await settingsStore.updateAutomationSettings({ settings: settings.value }, 'domains');
        
        // Vérification du succès de l'opération
        if (settingsStore.success) {
          notificationStore.showNotification({
            title: 'Enregistrement réussi',
            text: 'Paramètres d\'automatisation des domaines enregistrés',
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
        console.error('Erreur lors de l\'enregistrement des paramètres d\'automatisation des domaines:', error);
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