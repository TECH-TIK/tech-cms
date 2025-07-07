<template>
  <div class="card mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5>Paramètres divers</h5>
      <button class="btn btn-sm btn-primary" :disabled="isSaving" @click="saveSettings">
        <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <i v-else class="bi bi-save me-1"></i> Enregistrer
      </button>
    </div>
    <div class="card-body">
      <form @submit.prevent="saveSettings">
        <!-- Rétention des données -->
        <div class="form-group mb-3">
          <label class="form-label">Rétention des données</label>
          
          <div class="input-group mb-2">
            <span class="input-group-text">Logs du système</span>
            <input v-model.number="settings.system_logs_retention" type="number" class="form-control" min="1" max="365">
            <span class="input-group-text">jours</span>
          </div>
          
          <div class="input-group mb-2">
            <span class="input-group-text">Logs des tâches cron</span>
            <input v-model.number="settings.cron_logs_retention" type="number" class="form-control" min="1" max="365">
            <span class="input-group-text">jours</span>
          </div>
          
          <div class="input-group mb-2">
            <span class="input-group-text">Emails archivés</span>
            <input v-model.number="settings.email_logs_retention" type="number" class="form-control" min="1" max="365">
            <span class="input-group-text">jours</span>
          </div>
        </div>
        
        <!-- Nettoyage de la base de données -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableDbCleanup" v-model="settings.db_cleanup_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableDbCleanup">Nettoyage périodique de la base de données</label>
          </div>
          <div v-if="settings.db_cleanup_enabled" class="mt-2">
            <select v-model="settings.db_cleanup_frequency" class="form-select mb-2">
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
            </select>
            
            <div class="form-check">
              <input id="cleanupSessions" v-model="settings.cleanup_sessions" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="cleanupSessions">Nettoyer les sessions expirées</label>
            </div>
            
            <div class="form-check">
              <input id="cleanupActivityLogs" v-model="settings.cleanup_activity_logs" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="cleanupActivityLogs">Nettoyer les logs d'activité anciens</label>
            </div>
            
            <div class="form-check">
              <input id="cleanupTempData" v-model="settings.cleanup_temp_data" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="cleanupTempData">Nettoyer les données temporaires</label>
            </div>
          </div>
        </div>
        
        <!-- Sauvegarde automatique -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoBackup" v-model="settings.auto_backup_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoBackup">Sauvegarde automatique</label>
          </div>
          <div v-if="settings.auto_backup_enabled" class="mt-2">
            <select v-model="settings.backup_frequency" class="form-select mb-2">
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Bihebdomadaire</option>
              <option value="monthly">Mensuelle</option>
            </select>
            
            <div class="form-check mb-2">
              <input id="backupFiles" v-model="settings.backup_files" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="backupFiles">Inclure les fichiers</label>
            </div>
            
            <div class="form-check mb-2">
              <input id="backupDatabase" v-model="settings.backup_database" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="backupDatabase">Inclure la base de données</label>
            </div>
            
            <div class="form-check">
              <input id="compressBackup" v-model="settings.compress_backup" class="form-check-input" type="checkbox">
              <label class="form-check-label" for="compressBackup">Compresser la sauvegarde</label>
            </div>
            
            <div class="mt-2">
              <input v-model.number="settings.backups_to_keep" type="number" class="form-control" min="1" max="99" placeholder="Nombre de sauvegardes à conserver">
              <small class="text-muted">Nombre de sauvegardes à conserver (0 = illimité)</small>
            </div>
          </div>
        </div>
        
        <!-- Statistiques et rapports -->
        <div class="form-group mb-3">
          <div class="form-check form-switch">
            <input id="enableAutoReports" v-model="settings.auto_reports_enabled" class="form-check-input" type="checkbox">
            <label class="form-check-label" for="enableAutoReports">Génération automatique de rapports</label>
          </div>
          <div v-if="settings.auto_reports_enabled" class="mt-2">
            <div class="row">
              <div class="col-md-6">
                <div class="form-check">
                  <input id="dailyReports" v-model="settings.daily_reports" class="form-check-input" type="checkbox">
                  <label class="form-check-label" for="dailyReports">Rapports quotidiens</label>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-check">
                  <input id="weeklyReports" v-model="settings.weekly_reports" class="form-check-input" type="checkbox">
                  <label class="form-check-label" for="weeklyReports">Rapports hebdomadaires</label>
                </div>
              </div>
            </div>
            <div class="row mt-2">
              <div class="col-md-6">
                <div class="form-check">
                  <input id="monthlyReports" v-model="settings.monthly_reports" class="form-check-input" type="checkbox">
                  <label class="form-check-label" for="monthlyReports">Rapports mensuels</label>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-check">
                  <input id="emailReports" v-model="settings.email_reports" class="form-check-input" type="checkbox">
                  <label class="form-check-label" for="emailReports">Envoyer par email</label>
                </div>
              </div>
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
import logger from '@/services/logger';

export default {
  name: 'MiscAutomation',
  setup() {
    const notificationStore = useNotificationStore();
    const settingsStore = useSettingsStore();
    const isSaving = ref(false);
    
    // Récupérer les paramètres d'automatisation du store
    const settings = ref({ ...settingsStore.automationSettings.value.misc });
    
    // Chargement des paramètres
    const loadSettings = async () => {
      try {
        await settingsStore.fetchAutomationSettings('misc');
        // Mise à jour des paramètres locaux depuis le store
        settings.value = { ...settingsStore.automationSettings.value.misc };
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres d\'automatisation:', error);
        notificationStore.showNotification({
          title: 'Erreur de connexion',
          text: 'Impossible de communiquer avec le serveur',
          type: 'error'
        });
      }
    };
    
    // Enregistrement des paramètres
    const saveSettings = async () => {
      isSaving.value = true;
      
      try {
        await settingsStore.updateAutomationSettings({ settings: settings.value }, 'misc');
        
        if (settingsStore.success) {
          notificationStore.showNotification({
            title: 'Enregistrement réussi',
            text: 'Paramètres divers enregistrés',
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
        logger.error('[MiscAutomation] Erreur lors de l\'enregistrement des paramètres d\'automatisation', { error });
        notificationStore.showNotification({
          title: 'Erreur de connexion',
          text: 'Impossible de communiquer avec le serveur',
          type: 'error'
        });
      } finally {
        isSaving.value = false;
      }
    };
    
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