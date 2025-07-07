<template>
  <div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5>Automatisation de la facturation</h5>
      <button class="btn btn-sm btn-primary" :disabled="isSaving" @click="saveSettings">
        <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <i v-else class="bi bi-save me-1"></i> Enregistrer
      </button>
    </div>
    <div class="card-body">
      <form @submit.prevent="saveSettings">
        <!-- Génération automatique de factures -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoInvoice" v-model="settings.auto_invoice_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoInvoice">Génération automatique de factures</label>
          </div>
          <div v-if="settings.auto_invoice_enabled" class="mt-2">
            <div class="input-group">
              <input v-model.number="settings.generate_days_before" type="number" class="form-control" min="1" max="30">
              <span class="input-group-text">jours</span>
            </div>
            <small class="text-muted">Générer les factures ce nombre de jours avant la date de renouvellement</small>
          </div>
        </div>
        
        <!-- Rappels de paiement -->
        <div class="form-group mb-3">
          <label class="form-label">Rappels de paiement avant échéance</label>
          <div class="row g-2 mb-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">Premier rappel</span>
                <input v-model.number="settings.first_reminder_days" type="number" class="form-control" min="1" max="30">
                <span class="input-group-text">jours avant</span>
              </div>
            </div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">Second rappel</span>
                <input v-model.number="settings.second_reminder_days" type="number" class="form-control" min="1" max="15">
                <span class="input-group-text">jours avant</span>
              </div>
            </div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col">
              <div class="input-group">
                <span class="input-group-text">Rappel final</span>
                <input v-model.number="settings.final_reminder_days" type="number" class="form-control" min="0" max="5">
                <span class="input-group-text">jours avant</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Rappels post-échéance -->
        <div class="form-group mb-3">
          <div class="form-check form-switch mb-2">
            <input id="enablePostDueReminders" v-model="settings.post_due_reminders_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enablePostDueReminders">Rappels après la date d'échéance</label>
          </div>
          
          <div v-if="settings.post_due_reminders_enabled" class="mt-2">
            <div v-for="(day, index) in settings.post_due_days" :key="index" class="input-group mb-2">
              <input v-model.number="settings.post_due_days[index]" type="number" class="form-control" min="1" max="60">
              <span class="input-group-text">jours après</span>
              <button type="button" class="btn btn-outline-danger" @click="removePostDueDay(index)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary mt-1" @click="addPostDueDay">
              <i class="bi bi-plus-circle me-1"></i> Ajouter un rappel
            </button>
          </div>
        </div>
        
        <!-- Paiements automatiques -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoBilling" v-model="settings.auto_billing_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoBilling">Tenter le prélèvement automatique</label>
          </div>
          <div v-if="settings.auto_billing_enabled" class="mt-2">
            <select v-model="settings.auto_billing_days_offset" class="form-select">
              <option value="-1">1 jour avant l'échéance</option>
              <option value="0">Le jour même de l'échéance</option>
              <option value="1">1 jour après l'échéance</option>
              <option value="3">3 jours après l'échéance</option>
              <option value="5">5 jours après l'échéance</option>
              <option value="7">1 semaine après l'échéance</option>
            </select>
            <small class="text-muted">Quand tenter le prélèvement automatique</small>
          </div>
        </div>
        
        <!-- Application de frais de retard -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableLateFees" v-model="settings.late_fees_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableLateFees">Appliquer des frais de retard</label>
          </div>
          <div v-if="settings.late_fees_enabled" class="mt-2">
            <div class="row g-2">
              <div class="col-md-6">
                <div class="input-group">
                  <input v-model.number="settings.late_fee_days" type="number" class="form-control" min="1" max="30">
                  <span class="input-group-text">jours après</span>
                </div>
              </div>
              <div class="col-md-6">
                <div class="input-group">
                  <input v-model.number="settings.late_fee_amount" type="number" class="form-control" min="0" step="0.01">
                  <select v-model="settings.late_fee_type" class="form-select" style="max-width: 120px;">
                    <option value="percentage">% du total</option>
                    <option value="fixed">Montant fixe</option>
                  </select>
                </div>
              </div>
            </div>
            <small class="text-muted">Appliquer des frais de retard après le nombre de jours spécifié</small>
          </div>
        </div>
        
        <!-- Annulation automatique -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoCancellation" v-model="settings.auto_cancellation_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoCancellation">Annulation automatique des services impayés</label>
          </div>
          <div v-if="settings.auto_cancellation_enabled" class="mt-2">
            <div class="input-group">
              <input v-model.number="settings.cancellation_days" type="number" class="form-control" min="1" max="60">
              <span class="input-group-text">jours après l'échéance</span>
            </div>
            <small class="text-muted">Annuler automatiquement les services impayés après ce nombre de jours</small>
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
  name: 'BillingAutomation',
  setup() {
    const notificationStore = useNotificationStore();
    const settingsStore = useSettingsStore();
    const isSaving = ref(false);
    
    // Paramètres par défaut
    const settings = ref({
      auto_invoice_enabled: true,
      generate_days_before: 7,
      first_reminder_days: 7,
      second_reminder_days: 3,
      final_reminder_days: 1,
      post_due_reminders_enabled: true,
      post_due_days: [1, 5, 10, 15],
      auto_billing_enabled: false,
      auto_billing_days_offset: 0,
      late_fees_enabled: false,
      late_fee_days: 7,
      late_fee_amount: 5,
      late_fee_type: 'percentage',
      auto_cancellation_enabled: false,
      cancellation_days: 30
    });
    
    // Ajout d'un jour de rappel post-échéance
    const addPostDueDay = () => {
      let lastDay = 1;
      if (settings.value.post_due_days.length > 0) {
        lastDay = Math.max(...settings.value.post_due_days) + 5;
      }
      settings.value.post_due_days.push(lastDay);
    };
    
    // Suppression d'un jour de rappel post-échéance
    const removePostDueDay = (index) => {
      settings.value.post_due_days.splice(index, 1);
    };
    
    // Chargement des paramètres depuis le store settings
    const loadSettings = async () => {
      try {
        // Récupération des paramètres d'automatisation de facturation via le store
        await settingsStore.fetchAutomationSettings('billing');
        
        // Si les paramètres sont disponibles dans le store, on les utilise
        if (settingsStore.automationSettings.value && settingsStore.automationSettings.value.billing) {
          settings.value = { ...settings.value, ...settingsStore.automationSettings.value.billing };
          
          // S'assurer que post_due_days est un tableau
          if (typeof settings.value.post_due_days === 'string') {
            try {
              settings.value.post_due_days = JSON.parse(settings.value.post_due_days);
            } catch {
              settings.value.post_due_days = [1, 5, 10, 15];
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres d\'automatisation de facturation:', error);
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
        // Mise à jour des paramètres d'automatisation de facturation via le store
        await settingsStore.updateAutomationSettings({ settings: settings.value }, 'billing');
        
        // Vérification du succès de l'opération
        if (settingsStore.success) {
          notificationStore.showNotification({
            title: 'Enregistrement réussi',
            text: 'Paramètres d\'automatisation de facturation enregistrés',
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
        console.error('Erreur lors de l\'enregistrement des paramètres d\'automatisation de facturation:', error);
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
      addPostDueDay,
      removePostDueDay,
      saveSettings
    };
  }
};
</script>