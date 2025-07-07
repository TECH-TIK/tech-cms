<template>
  <div class="automation-settings">
    <div class="page-header">
      <div class="page-title">
        <h3>
          <i class="bi bi-clock-history"></i> Paramètres d'automatisation
        </h3>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h5>Statut des tâches cron</h5>
      </div>
      <div class="card-body">
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          <strong>TechCMS</strong> nécessite l'invocation régulière et fréquente d'un fichier via cron pour automatiser les tâches.
        </div>
        
        <div class="mb-4">
          <h6>Commande Cron</h6>
          <p>La commande ci-dessous est fournie pour votre convenance. Vous devez configurer une tâche cron pour s'exécuter toutes les 5 minutes en utilisant cette commande dans votre utilitaire cron ou votre panneau de contrôle d'hébergement.</p>
          
          <div class="input-group">
            <input ref="cronCommandInput" type="text" class="form-control" readonly :value="cronCommand">
            <button class="btn btn-outline-secondary" type="button" @click="copyCommand">
              <i class="bi bi-clipboard"></i>
            </button>
          </div>
          <small class="text-muted">Fréquence recommandée : Toutes les 5 minutes, ou aussi fréquemment que votre hébergeur le permet</small>
        </div>

        <div>
          <h6>Statut des tâches</h6>
          <table class="table">
            <thead>
              <tr>
                <th>Tâche</th>
                <th>Statut</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="3" class="text-center">
                  <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Chargement...</span>
                  </div> Chargement des tâches...
                </td>
              </tr>
              <tr v-else-if="cronJobs.length === 0">
                <td colspan="3" class="text-center">Aucune tâche cron configurée</td>
              </tr>
              <tr v-for="job in cronJobs" :key="job.id" :class="{'table-danger': job.status === 'error', 'table-warning': job.status === 'warning'}">
                <td>{{ job.display_name }}</td>
                <td>
                  <span v-if="job.status === 'success'" class="badge bg-success">
                    <i class="bi bi-check-circle me-1"></i> OK
                  </span>
                  <span v-else-if="job.status === 'warning'" class="badge bg-warning text-dark">
                    <i class="bi bi-exclamation-triangle me-1"></i> Attention
                  </span>
                  <span v-else-if="job.status === 'error'" class="badge bg-danger">
                    <i class="bi bi-x-circle me-1"></i> Erreur
                  </span>
                  <span v-else class="badge bg-secondary">
                    <i class="bi bi-question-circle me-1"></i> Inconnu
                  </span>
                </td>
                <td>
                  <div>{{ job.description }}</div>
                  <small v-if="job.last_run" class="text-muted">Dernière exécution : {{ formatDate(job.last_run) }}</small>
                  <div v-if="job.error" class="text-danger small mt-1">{{ job.error }}</div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="text-end">
            <button class="btn btn-primary btn-sm" @click="refreshStatus">
              <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6">
        <tickets-automation />
      </div>
      <div class="col-md-6">
        <billing-automation />
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-6">
        <services-automation />
      </div>
      <div class="col-md-6">
        <domains-automation v-if="hasDomainFeature" />
        <misc-automation v-else />
      </div>
    </div>
</div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { ApiService } from '@/services/api';
import TicketsAutomation from './automation/TicketsAutomation.vue';
import BillingAutomation from './automation/BillingAutomation.vue';
import ServicesAutomation from './automation/ServicesAutomation.vue';
import DomainsAutomation from './automation/DomainsAutomation.vue';
import MiscAutomation from './automation/MiscAutomation.vue';
import { useNotificationStore } from '@/stores/notifications';
import logger from '@/services/logger';

export default {
  name: 'AutomationView',
  components: {
    TicketsAutomation,
    BillingAutomation,
    ServicesAutomation,
    DomainsAutomation,
    MiscAutomation
  },
  setup() {
    const notificationStore = useNotificationStore();
    const isLoading = ref(true);
    const cronJobs = ref([]);
    const cronCommandInput = ref(null);
    const serverPath = ref('');

    // Calculer la commande cron basée sur le chemin complet du script
    const cronScriptPath = ref('');
    const cronCommand = computed(() => {
      return `*/5 * * * * php ${cronScriptPath.value}`;
    });

    // Déterminer si la fonctionnalité des domaines est activée
    const hasDomainFeature = ref(false);

    // Récupérer le statut des tâches cron
    const refreshStatus = async () => {
      isLoading.value = true;
      try {
        const response = await ApiService.routes.admin.settings.getCronStatus();
        const data = response.data;
        
        if (data.success) {
          cronJobs.value = data.jobs;
          serverPath.value = data.server_path || '';
          cronScriptPath.value = data.cron_script_path || '';
          hasDomainFeature.value = data.has_domain_feature || false;
        } else {
          notificationStore.showError('Erreur de chargement', 'Erreur lors du chargement des tâches cron: ' + data.message);
        }
      } catch (error) {
        logger.error('[AutomationView] Erreur lors du chargement des tâches cron', { error });
        notificationStore.showError('Erreur de connexion', 'Impossible de communiquer avec le serveur');
      } finally {
        isLoading.value = false;
      }
    };

    // Copier la commande cron dans le presse-papier
    const copyCommand = () => {
      if (cronCommandInput.value) {
        cronCommandInput.value.select();
        document.execCommand('copy');
        notificationStore.showSuccess('Copie réussie', 'Commande copiée dans le presse-papier');
      }
    };

    // Formater les dates
    const formatDate = (dateString) => {
      if (!dateString) return 'Jamais';
      const date = new Date(dateString);
      
      // Si la date est aujourd'hui, afficher uniquement l'heure
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return `Aujourd'hui à ${date.toLocaleTimeString()}`;
      }
      
      // Si la date est hier
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Hier à ${date.toLocaleTimeString()}`;
      }
      
      // Sinon, afficher la date complète
      return date.toLocaleString();
    };

    onMounted(() => {
      refreshStatus();
    });

    return {
      isLoading,
      cronJobs,
      cronCommand,
      cronCommandInput,
      cronScriptPath,
      hasDomainFeature,
      refreshStatus,
      copyCommand,
      formatDate
    };
  }
};
</script>

<style scoped>
.automation-settings h5 {
  margin-bottom: 0;
}
</style>