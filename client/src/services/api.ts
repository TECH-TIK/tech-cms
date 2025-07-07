/**
 * Service API centralisé pour l'espace client
 * 
 * Ce service gère toutes les routes API de l'espace client, organisées par domaine fonctionnel
 * en cohérence avec la structure backend. Il fournit une interface unique pour tous les
 * appels API et facilite la maintenance.
 */

import axios from 'axios';

// Configuration de l'instance axios pour toutes les requêtes API
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000 // 30 secondes
});

// Configuration pour inclure les cookies dans les requêtes
apiClient.defaults.withCredentials = true;

// Structure modulaire des routes API
const ApiRoutes = {
  /**
   * Routes d'authentification client et gestion des tokens
   */
  auth: {
    login: (email: string, password: string, remember: boolean = false) =>
      apiClient.post('/api/v1/client/auth/login', { email, password, remember }),
    register: (userData: any) =>
      apiClient.post('/api/v1/client/auth/register', userData),
    logout: () =>
      apiClient.post('/api/v1/client/auth/logout'),
    me: () =>
      apiClient.get('/api/v1/client/auth/me'),
    forgotPassword: (email: string) =>
      apiClient.post('/api/v1/client/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string, passwordConfirmation: string) =>
      apiClient.post('/api/v1/client/auth/reset-password', { token, password, password_confirmation: passwordConfirmation })
  },

  /**
   * Routes pour les fonctionnalités temps réel
   */
  realtime: {
    getToken: () => 
      apiClient.get('/api/v1/realtime/token')
  },

  /**
   * Routes pour le client (portail client)
   */
  client: {
    /**
     * Dashboard client
     */
    dashboard: {
      getStats: () =>
        apiClient.get('/api/v1/client/dashboard/stats'),
      getOverview: () =>
        apiClient.get('/api/v1/client/dashboard/overview')
    },

    /**
     * Services client
     */
    service: {
      list: (params?: any) =>
        apiClient.get('/api/v1/client/services', { params }),
      get: (id: string) =>
        apiClient.get(`/api/v1/client/services/${id}`),
      getById: (id: number) =>
        apiClient.get(`/api/v1/client/services/${id}`),
      getHistory: (id: number) =>
        apiClient.get(`/api/v1/client/services/${id}/history`),
      getUsage: (id: number) =>
        apiClient.get(`/api/v1/client/services/${id}/usage`),
      getRecent: () =>
        apiClient.get('/api/v1/client/services/recent')
    },

    /**
     * Factures client
     */
    invoice: {
      list: (params?: any) =>
        apiClient.get('/api/v1/client/invoices', { params }),
      get: (id: string) =>
        apiClient.get(`/api/v1/client/invoices/${id}`),
      getById: (id: number) =>
        apiClient.get(`/api/v1/client/invoices/${id}`),
      downloadPdf: (id: number) =>
        apiClient.get(`/api/v1/client/invoices/${id}/pdf`, { responseType: 'blob' }),
      getRecent: () =>
        apiClient.get('/api/v1/client/invoices/recent'),
      getUnpaid: () =>
        apiClient.get('/api/v1/client/invoices/unpaid')
    },

    /**
     * Tickets client
     */
    ticket: {
      list: (params?: any) =>
        apiClient.get('/api/v1/client/tickets', { params }),
      get: (id: string) =>
        apiClient.get(`/api/v1/client/tickets/${id}`),
      getById: (id: number) =>
        apiClient.get(`/api/v1/client/tickets/${id}`),
      getMessages: (id: number, params?: any) =>
        apiClient.get(`/api/v1/client/tickets/${id}/messages`, { params }),
      create: (data: any) =>
        apiClient.post('/api/v1/client/tickets', data),
      addReply: (id: number, data: any) =>
        apiClient.post(`/api/v1/client/tickets/${id}/messages`, data),
      close: (id: number) =>
        apiClient.put(`/api/v1/client/tickets/${id}/close`),
      reopen: (id: number) =>
        apiClient.put(`/api/v1/client/tickets/${id}/reopen`),
      getRecent: () =>
        apiClient.get('/api/v1/client/tickets/recent'),
      getOpen: () =>
        apiClient.get('/api/v1/client/tickets/open')
    },

    /**
     * Profil client
     */
    profile: {
      get: () =>
        apiClient.get('/api/v1/client/profile'),
      update: (data: any) =>
        apiClient.put('/api/v1/client/profile', data),
      changePassword: (data: any) =>
        apiClient.post('/api/v1/client/profile/password', data)
    },

    /**
     * Token temps réel Ably pour client
     */
    getRealtimeToken: () =>
      apiClient.get('/api/v1/client/realtime/token'),

    /**
     * Départements de tickets
     */
    department: {
      list: () =>
        apiClient.get('/api/v1/client/departments')
    },

    /**
     * Logging côté client
     */
    logging: {
      log: (level: string, message: string, context?: any) =>
        apiClient.post('/api/v1/client/log', { level, message, context })
    }
  }
};

/**
 * Service API principal
 */
export class ApiService {
  /**
   * Routes API organisées par domaine fonctionnel
   */
  static routes = ApiRoutes;

  /**
   * Instance axios configurée
   */
  static get client() {
    return apiClient;
  }

  /**
   * Définir le token d'authentification pour toutes les requêtes
   */
  static setAuthToken(token: string | null) {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }
  
  /**
   * Intercepteur de réponse pour gérer les erreurs d'authentification
   */
  static setupInterceptors() {
    apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Rediriger vers la page de connexion CLIENT en cas d'erreur 401
          window.location.href = '/client/login';
        }
        return Promise.reject(error);
      }
    );
  }
}

// Configurer les intercepteurs au chargement du module
ApiService.setupInterceptors();

export default ApiService;