/**
 * Service API centralisé
 * 
 * Ce service gère toutes les routes API de l'application, organisées par domaine fonctionnel
 * en cohérence avec la structure backend. Il fournit une interface unique pour tous les
 * appels API et facilite la maintenance.
 */

import axios from 'axios';
import { useAuthStore } from '../stores/auth';

// Configuration de l'instance axios pour toutes les requêtes API
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 300000 // 5 minutes
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
apiClient.interceptors.request.use(config => {
  const authStore = useAuthStore();
  // Vérifie si le token est dans l'authStore.user
  if (authStore.user && authStore.user.token) {
    config.headers.Authorization = `Bearer ${authStore.user.token}`;
  }
  return config;
});

// Structure modulaire des routes API
const ApiRoutes = {
  /**
   * Routes d'authentification et gestion des tokens
   */
  auth: {
    login: (email: string, password: string) => 
      apiClient.post('/api/v1/auth/login', { email, password }),
    register: (userData: any) => 
      apiClient.post('/api/v1/auth/register', userData),
    logout: () => 
      apiClient.post('/api/v1/auth/logout'),
    refreshToken: () => 
      apiClient.post('/api/v1/auth/refresh'),
    getAuthUser: () => 
      apiClient.get('/api/v1/auth/user'),
    me: () => 
      apiClient.get('/api/v1/auth/check'),
    forgotPassword: (email: string) => 
      apiClient.post('/api/v1/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string, passwordConfirmation: string) => 
      apiClient.post('/api/v1/auth/reset-password', { token, password, password_confirmation: passwordConfirmation })
  },

  /**
   * Routes pour les fonctionnalités temps réel
   */
  realtime: {
    getToken: () => 
      apiClient.get('/api/v1/realtime/token')
  },

  /**
   * Routes d'administration - Produits
   */
  admin: {
    product: {
      list: (params?: any) => 
        apiClient.get('/api/v1/admin/products', { params }),
      get: (id: string) => 
        apiClient.get(`/api/v1/admin/products/${id}`),
      create: (data: any) => 
        apiClient.post('/api/v1/admin/products', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admin/products/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admin/products/${id}`),
      search: (query: string) => 
        apiClient.get('/api/v1/admin/products/search', { params: { q: query } }),
      import: (data: any) => 
        apiClient.post('/api/v1/admin/products/import', data),
      export: (params?: any) => 
        apiClient.get('/api/v1/admin/products/export', { params })
    },

    productGroup: {
      list: (params?: any) => 
        apiClient.get('/api/v1/admin/product-groups', { params }),
      get: (id: string) => 
        apiClient.get(`/api/v1/admin/product-groups/${id}`),
      create: (data: any) => 
        apiClient.post('/api/v1/admin/product-groups', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admin/product-groups/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admin/product-groups/${id}`),
      getProducts: (groupId: string) => 
        apiClient.get(`/api/v1/admin/product-groups/${groupId}/products`)
    },

    productDraft: {
      list: (params?: any) => 
        apiClient.get('/api/v1/admin/product-drafts', { params }),
      get: (id: string) => 
        apiClient.get(`/api/v1/admin/product-drafts/${id}`),
      getLatest: () => 
        apiClient.get('/api/v1/admin/product-drafts/latest'),
      create: (data: any) => 
        apiClient.post('/api/v1/admin/product-drafts', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admin/product-drafts/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admin/product-drafts/${id}`),
      publish: (id: string) => 
        apiClient.post(`/api/v1/admin/product-drafts/${id}/publish`)
    },

    productModule: {
      getConfigOptions: () => 
        apiClient.get('/api/v1/admin/product-modules/config-options'),
      getModulePlans: () => 
        apiClient.get('/api/v1/admin/product-modules/plans'),
      testConnection: (data: any) => 
        apiClient.post('/api/v1/admin/product-modules/test-connection', data)
    },

    /**
     * Routes d'administration - Clients
     */
    client: {
      list: (params?: any) => 
        apiClient.get('/api/v1/admin/clients', { params }),
      get: (id: string) => 
        apiClient.get(`/api/v1/admin/clients/${id}`),
      create: (data: any) => 
        apiClient.post('/api/v1/admin/clients', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admin/clients/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admin/clients/${id}`)
    },

    /**
     * Routes d'administration - Services
     */
    service: {
      list: (params?: any) => 
        apiClient.get('/api/v1/admin/services', { params }),
      get: (id: string) => 
        apiClient.get(`/api/v1/admin/services/${id}`),
      create: (data: any) => 
        apiClient.post('/api/v1/admin/services', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admin/services/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admin/services/${id}`),
      changeStatus: (id: string, statusOrPayload: string | { status: string, notes?: string }) => {
        // Si statusOrPayload est une chaîne, c'est le statut simple
        // Sinon, c'est un objet contenant le statut et les notes optionnelles
        const payload = typeof statusOrPayload === 'string' 
          ? { status: statusOrPayload } 
          : statusOrPayload;
          
        return apiClient.put(`/api/v1/admin/services/${id}/status`, payload);
      },
      getStats: () => 
        apiClient.get('/api/v1/admin/services/stats'),
      getClientServices: (clientId: string) => 
        apiClient.get(`/api/v1/admin/clients/${clientId}/services`),
      provision: (id: string, data: any) => 
        apiClient.post(`/api/v1/admin/services/${id}/provision`, data),
      changePassword: (id: string, data: any) => 
        apiClient.post(`/api/v1/admin/services/${id}/password`, data),
      checkStatus: (id: string) => 
        apiClient.get(`/api/v1/admin/services/${id}/status`)
    },

    /**
     * Routes d'administration - Factures
     */
    invoice: {
      list: (params?: any) => 
        apiClient.get('/api/v1/admin/invoices', { params }),
      get: (id: string) => 
        apiClient.get(`/api/v1/admin/invoices/${id}`),
      create: (data: any) => 
        apiClient.post('/api/v1/admin/invoices', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admin/invoices/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admin/invoices/${id}`),
      markAsPaid: (id: string, paymentDetails: any = {}) => 
        apiClient.put(`/api/v1/admin/invoices/${id}/mark-paid`, paymentDetails)
    },

    /**
     * Routes d'administration - Paiements
     */
    payment: {
      list: (params: any = {}) => 
        apiClient.get('/api/v1/admin/payments', { params }),
      get: (id: string) => 
        apiClient.get(`/api/v1/admin/payments/${id}`),
      create: (data: any) => 
        apiClient.post('/api/v1/admin/payments', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admin/payments/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admin/payments/${id}`),
      refund: (id: string, reason: string = '') => 
        apiClient.post(`/api/v1/admin/payments/${id}/refund`, { reason })
    },

    /**
     * Routes d'administration - Abonnements
     */
    subscription: {
      list: (params?: any) => 
        apiClient.get('/api/v1/admin/subscriptions', { params }),
      get: (id: string) => 
        apiClient.get(`/api/v1/admin/subscriptions/${id}`),
      getByClient: (clientId: string) => 
        apiClient.get(`/api/v1/admin/subscriptions/client/${clientId}`),
      getByStatus: (status: string) => 
        apiClient.get(`/api/v1/admin/subscriptions/status/${status}`),
      create: (data: any) => 
        apiClient.post('/api/v1/admin/subscriptions', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admin/subscriptions/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admin/subscriptions/${id}`),
      cancel: (id: string, reason: string = '') => 
        apiClient.post(`/api/v1/admin/subscriptions/${id}/cancel`, reason ? { reason } : {}),
      renew: (id: string) => 
        apiClient.post(`/api/v1/admin/subscriptions/${id}/renew`)
    },

    /**
     * Routes d'administration - Tickets
     */
    ticket: {
      list: (params?: any) => 
        apiClient.get('/api/v1/admin/tickets', { params }),
      get: (id: string, params?: any) =>
        apiClient.get(`/api/v1/admin/tickets/${id}`, { params }),
      getByStatus: (status: string) => 
        apiClient.get(`/api/v1/admin/tickets/status/${status}`),
      getByPriority: (priority: string) => 
        apiClient.get(`/api/v1/admin/tickets/priority/${priority}`),
      getByDepartment: (departmentId: string) => 
        apiClient.get(`/api/v1/admin/tickets/department/${departmentId}`),
      getByAssignee: (userId: string) => 
        apiClient.get(`/api/v1/admin/tickets/assigned/${userId}`),
      create: (data: any) => 
        apiClient.post('/api/v1/admin/tickets', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admin/tickets/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admin/tickets/${id}`),
      addReply: (id: string, data: any) => 
        apiClient.post(`/api/v1/admin/tickets/${id}/replies`, data),
      close: (id: string) => 
        apiClient.post(`/api/v1/admin/tickets/${id}/close`),
      reopen: (id: string) => 
        apiClient.post(`/api/v1/admin/tickets/${id}/reopen`),
      // Départements de tickets
      departments: {
        list: () => 
          apiClient.get('/api/v1/admin/ticket-departments'),
        get: (id: string) => 
          apiClient.get(`/api/v1/admin/ticket-departments/${id}`),
        create: (data: any) => 
          apiClient.post('/api/v1/admin/ticket-departments', data),
        update: (id: string, data: any) => 
          apiClient.put(`/api/v1/admin/ticket-departments/${id}`, data),
        delete: (id: string) => 
          apiClient.delete(`/api/v1/admin/ticket-departments/${id}`)
      },
      // Assignations de tickets
      assignments: {
        assign: (ticketId: string, data: any) => 
          apiClient.post(`/api/v1/admin/tickets/${ticketId}/assign`, data),
        unassign: (ticketId: string) => 
          apiClient.post(`/api/v1/admin/tickets/${ticketId}/unassign`),
        getTicketAssignments: (ticketId: string) => 
          apiClient.get(`/api/v1/admin/tickets/${ticketId}/assignments`),
        getAdminAssignments: (adminId: string) => 
          apiClient.get(`/api/v1/admins/${adminId}/assigned-tickets`)
      }
    },
    
    /**
     * Routes d'administration - Système
     */
    /**
     * Routes d'administration - Administrateurs
     */
    admins: {
      list: (params?: any) => 
        apiClient.get('/api/v1/admins', { params }),
      get: (id: string) => 
        apiClient.get(`/api/v1/admins/${id}`),
      create: (data: any) => 
        apiClient.post('/api/v1/admins', data),
      update: (id: string, data: any) => 
        apiClient.put(`/api/v1/admins/${id}`, data),
      delete: (id: string) => 
        apiClient.delete(`/api/v1/admins/${id}`)
    },
    
    system: {
      // Tableau de bord
      dashboard: {
        getStats: () => 
          apiClient.get('/api/v1/admin/dashboard/stats'),
        getActivity: () => 
          apiClient.get('/api/v1/admin/dashboard/activity'),
        getRevenue: () => 
          apiClient.get('/api/v1/admin/dashboard/revenue')
      },
      // Paramètres
      settings: {
        getGeneralSettings: () => 
          apiClient.get('/api/v1/admin/settings/general'),
        updateGeneralSettings: (data: any) => 
          apiClient.post('/api/v1/admin/settings/general', data),
        getSecuritySettings: () => 
          apiClient.get('/api/v1/admin/settings/security'),
        updateSecuritySettings: (data: any) => 
          apiClient.post('/api/v1/admin/settings/security', data),
        getBillingSettings: () => 
          apiClient.get('/api/v1/admin/settings/billing'),
        updateBillingSettings: (data: any) => 
          apiClient.post('/api/v1/admin/settings/billing', data),
        getIntegrationSettings: () => 
          apiClient.get('/api/v1/admin/settings/integration'),
        updateIntegrationSettings: (data: any) => 
          apiClient.post('/api/v1/admin/settings/integration', data),
        getNotificationSettings: () => 
          apiClient.get('/api/v1/admin/settings/notifications'),
        updateNotificationSettings: (data: any) => 
          apiClient.post('/api/v1/admin/settings/notifications', data),
        getLicense: () => 
          apiClient.get('/api/v1/admin/settings/license'),
        updateLicense: (data: any) => 
          apiClient.post('/api/v1/admin/settings/license', data),
        // Tests des services
        testSmtpConnection: () => 
          apiClient.post('/api/v1/admin/settings/integrations/smtp/test'),
        testEmailNotification: () => 
          apiClient.post('/api/v1/admin/settings/notifications/test-email'),
        // API Keys
        generateApiKey: () => 
          apiClient.post('/api/v1/admin/settings/security/api-keys'),
        deleteApiKey: (keyId: string) => 
          apiClient.delete(`/api/v1/admin/settings/security/api-keys/${keyId}`),
        // Webhooks
        listWebhooks: () => 
          apiClient.get('/api/v1/admin/settings/webhooks'),
        createWebhook: (data: any) => 
          apiClient.post('/api/v1/admin/settings/webhooks', data),
        updateWebhook: (id: string, data: any) => 
          apiClient.put(`/api/v1/admin/settings/webhooks/${id}`, data),
        deleteWebhook: (id: string) => 
          apiClient.delete(`/api/v1/admin/settings/webhooks/${id}`),
        testWebhook: (id: string) => 
          apiClient.post(`/api/v1/admin/settings/webhooks/${id}/test`),
        toggleWebhookStatus: (id: string, active: boolean) => 
          apiClient.patch(`/api/v1/admin/settings/webhooks/${id}/status`, { active }),
        // Paramètres d'automatisation
        getAutomationSettings: (group?: string) => 
          apiClient.get('/api/v1/admin/settings/automation', { params: group ? { group } : undefined }),
        updateAutomationSettings: (data: any, group?: string) => 
          apiClient.post('/api/v1/admin/settings/automation', data, { params: group ? { group } : undefined })
      },
      // Licence
      license: {
        getLicenseInfo: () => 
          apiClient.get('/api/v1/admin/settings/license'),
        activateLicense: (licenseKey: string) =>
          apiClient.post('/api/v1/admin/settings/license/activate', { licenseKey }),
        checkLicense: () =>
          apiClient.get('/api/v1/admin/license/check')
      },
      // Notifications
      notifications: {
        list: () => 
          apiClient.get('/api/v1/admin/notifications'),
        markAsRead: (data: any) => 
          apiClient.post('/api/v1/admin/notifications/read', data),
        delete: (id: string) => 
          apiClient.delete(`/api/v1/admin/notifications/${id}`)
      },
      // Automatisation
      automation: {
        getCronJobs: () => 
          apiClient.get('/api/v1/admin/cron-jobs'),
        getCronJobLogs: (id: string) => 
          apiClient.get(`/api/v1/admin/cron-jobs/${id}/logs`),
        runCronJob: (id: string) => 
          apiClient.post(`/api/v1/admin/cron-jobs/${id}/run`),
        toggleCronJob: (id: string) => 
          apiClient.post(`/api/v1/admin/cron-jobs/${id}/toggle`),
        getSettings: () => 
          apiClient.get('/api/v1/admin/settings/automation'),
        saveSettings: (data: any) => 
          apiClient.post('/api/v1/admin/settings/automation', data),
        getCronStatus: () => 
          apiClient.get('/api/v1/admin/settings/cron-status')
      },
      // Utilisateurs admin
      users: {
        list: () => 
          apiClient.get('/api/v1/admin/users'),
        get: (id: string) => 
          apiClient.get(`/api/v1/admin/users/${id}`),
        create: (data: any) => 
          apiClient.post('/api/v1/admin/users', data),
        update: (id: string, data: any) => 
          apiClient.put(`/api/v1/admin/users/${id}`, data),
        delete: (id: string) => 
          apiClient.delete(`/api/v1/admin/users/${id}`),
        getRoles: () => 
          apiClient.get('/api/v1/admin/users/roles'),
        assignRole: (id: string, data: any) => 
          apiClient.post(`/api/v1/admin/users/${id}/roles`, data)
      },
      // Serveurs
      server: {
        list: () => 
          apiClient.get('/api/v1/admin/settings/servers'),
        get: (id: string) => 
          apiClient.get(`/api/v1/admin/servers/${id}`),
        create: (data: any) => 
          apiClient.post('/api/v1/admin/settings/servers', data),
        update: (id: string, data: any) => 
          apiClient.put(`/api/v1/admin/settings/servers/${id}`, data),
        delete: (id: string) => 
          apiClient.delete(`/api/v1/admin/settings/servers/${id}`),
        test: (id: string) => 
          apiClient.post(`/api/v1/admin/settings/servers/${id}/test`),
        testNew: (data: any) => 
          apiClient.post('/api/v1/admin/settings/servers/test', data),
        getStats: (id: string) => 
          apiClient.get(`/api/v1/admin/settings/servers/${id}/stats`),
        getPlans: (id: string) => 
          apiClient.get(`/api/v1/admin/settings/servers/${id}/plans`),
        getVirtualizorOptions: (id: string) => 
          apiClient.get(`/api/v1/admin/settings/servers/${id}/virtualizor-options`),
        getProxmoxOptions: (id: string) => 
          apiClient.get(`/api/v1/admin/settings/servers/${id}/proxmox-options`)
      },
      // Modules système
      module: {
        list: (type: string = 'all') =>
          apiClient.get(`/api/v1/admin/modules?type=${type}`),
        getDetails: (type: string, name: string) =>
          apiClient.get(`/api/v1/admin/modules/details?type=${type}&name=${name}`),
        getProductConfigFields: (type: string, name: string) =>
          apiClient.get(`/api/v1/admin/modules/product-config-fields?type=${type}&name=${name}`),
        getTemplates: (type: string, name: string) =>
          apiClient.get(`/api/v1/admin/modules/templates?type=${type}&name=${name}`),
        validateProductConfig: (data: any) =>
          apiClient.post('/api/v1/admin/modules/validate-product-config', data),
        test: (data: any) =>
          apiClient.post('/api/v1/admin/modules/test', data),
        activate: (data: any) =>
          apiClient.post('/api/v1/admin/modules/activate', data),
        deactivate: (data: any) =>
          apiClient.post('/api/v1/admin/modules/deactivate', data),
        updateConfig: (data: any) =>
          apiClient.post('/api/v1/admin/modules/config', data)
      },

      // Système de mise à jour
      updates: {
        check: () =>
          apiClient.get('/api/v1/admin/updates/check'),
        download: (data: { token: string; version: string }) =>
          apiClient.post('/api/v1/admin/updates/download', data),
        install: (data: { update_id: number }) =>
          apiClient.post('/api/v1/admin/updates/install', data),
        rollback: (data: { update_id: number; backup_id: string }) =>
          apiClient.post('/api/v1/admin/updates/rollback', data),
        checkRequirements: () =>
          apiClient.get('/api/v1/admin/updates/requirements'),
        listBackups: () =>
          apiClient.get('/api/v1/admin/updates/backups'),
        history: (params?: any) =>
          apiClient.get('/api/v1/admin/updates/history', { params }),
        getSettings: () =>
          apiClient.get('/api/v1/admin/updates/settings'),
        updateSettings: (data: any) =>
          apiClient.put('/api/v1/admin/updates/settings', data),
        validateToken: (data: { token: string }) =>
          apiClient.post('/api/v1/admin/updates/validate-token', data),
        cleanup: (data?: { max_age?: number }) =>
          apiClient.post('/api/v1/admin/updates/cleanup', data || {})
      }
    }
  },


};

/**
 * Service API principal
 */
export const ApiService = {
  /**
   * Obtenir le client axios pour les requêtes personnalisées
   */
  get client() {
    return apiClient;
  },

  /**
   * Toutes les routes API organisées par domaine fonctionnel
   */
  routes: ApiRoutes,

  /**
   * Méthode utilitaire pour définir un token d'authentification
   */
  setAuthToken(token: string | null) {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  },
  
  /**
   * Méthode utilitaire pour définir la langue des requêtes API
   */
  setLanguage(lang: string) {
    apiClient.defaults.headers.common['Accept-Language'] = lang;
  }
};

export default ApiService;
