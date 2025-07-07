import { defineStore } from 'pinia'

import { ApiService } from '@/services/api'
import router from '@/router'

import logger from '@/services/logger'

logger.info('[AUTH STORE] Initialisation du store d\'authentification')

// Type d'actions du store d'authentification pour une meilleure inférence de type
interface AuthStoreActions {
  init: () => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  updateLanguage: (lang: string) => Promise<void>;
}

export const useAuthStore = defineStore<string, {
  user: any | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}, {
  isAuthenticated: (state: any) => boolean;
  userFullName: (state: any) => string;
}, AuthStoreActions>('auth', {
  // Contourner le problème de typage en utilisant la structure minimale
  persist: true,

  state: () => ({
    user: null as any | null,
    loading: false,
    error: null as string | null,
    initialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userFullName: (state) => state.user ? `${state.user.firstName} ${state.user.lastName}` : ''
  },

  actions: {
    async init() {
      if (this.initialized) {
        logger.info('[AUTH STORE] Déjà initialisé')
        return
      }

      logger.info('[AUTH STORE] Initialisation...')
      
      try {
        // Utilisation de la route centralisée pour vérifier l'authentification
        const response = await ApiService.routes.auth.me()
        if (response.data?.user) {
          logger.info('[AUTH STORE] Utilisateur authentifié', { user: response.data.user })
          this.user = response.data.user
        }
      } catch {
        logger.info('[AUTH STORE] Non authentifié')
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    async login(email: string, password: string, _remember: boolean = false) {
      logger.info('[AUTH STORE] Tentative de connexion', { email })
      try {
        this.loading = true
        this.error = null

        // Utilisation de la route centralisée pour la connexion
        // Note: remember n'est pas supporté directement par l'API centralisée
        const response = await ApiService.routes.auth.login(email, password)


        if (!response.data?.user) {
          throw new Error('Réponse invalide du serveur')
        }

        // Stocker uniquement les données utilisateur
        this.user = response.data.user

        // Rediriger vers le dashboard après connexion
        router.push('/dashboard')

        return true
      } catch (err: any) {
        logger.error('[AUTH STORE] Erreur de connexion', { error: err })
        this.error = err.message
        return false
      } finally {
        this.loading = false
      }
    },

    async logout() {
      // Si l'utilisateur est déjà déconnecté, ne rien faire
      if (!this.user) {
        logger.info('[AUTH STORE] Utilisateur déjà déconnecté')
        return
      }

      logger.info('[AUTH STORE] Déconnexion...')
      try {
        // Utilisation de la route centralisée pour la déconnexion
        await ApiService.routes.auth.logout()
      } catch (err) {
        logger.error('[AUTH STORE] Erreur de déconnexion', { error: err })
      } finally {
        // Nettoyer l'état local
        this.user = null
        this.initialized = false
        
        // Rediriger vers la page de login
        router.push('/login')
      }
    },

    async checkAuth() {
      logger.info('[AUTH STORE] Vérification de l\'authentification...')
      try {
        // Utilisation de la route centralisée pour vérifier l'authentification
        const response = await ApiService.routes.auth.me()
        
        if (response.data?.user) {
          logger.info('[AUTH STORE] Utilisateur authentifié')
          this.user = response.data.user
          return true
        }

        logger.info('[AUTH STORE] Utilisateur non authentifié')
        return false
      } catch (err) {
        logger.error('[AUTH STORE] Erreur lors de la vérification de l\'authentification', { error: err })
        this.user = null
        return false
      }
    },

    async forgotPassword(email: string) {
      logger.info('[AUTH STORE] Demande de réinitialisation', { email })
      try {
        // Utilisation de la route centralisée pour la demande de réinitialisation
        const response = await ApiService.routes.auth.forgotPassword(email)
        logger.info('[AUTH STORE] Email de réinitialisation envoyé')
        return response.data
      } catch (err) {
        logger.error('[AUTH STORE] Erreur lors de la demande', { error: err })
        throw err
      }
    },

    async resetPassword(token: string, password: string) {
      try {
        this.loading = true
        this.error = null
        
        // Utilisation de la route centralisée pour la réinitialisation du mot de passe
        await ApiService.routes.auth.resetPassword(token, password, password)
        return true
      } catch (err: any) {
        this.error = err.message
        return false
      } finally {
        this.loading = false
      }
    },

    async updateLanguage(lang: string): Promise<void> {
      // Cette méthode est utilisée pour mettre à jour la langue de l'utilisateur
      // Pour le moment, elle ne fait que stocker la préférence localement
      // Dans une implémentation complète, elle pourrait envoyer cette préférence au serveur
      logger.info(`[AUTH STORE] Changement de langue vers: ${lang}`)
      
      try {
        // Si nous avons un utilisateur connecté, on pourrait sauvegarder sa préférence
        if (this.user) {
          // Optionnel: Envoyer la préférence au serveur
          // await ApiService.client.post('/api/v1/user/preferences', { language: lang })
          
          // Mettre à jour l'état local
          this.user = {
            ...this.user,
            language: lang
          }
        }
        
        // Ne pas retourner de valeur pour Promise<void>
      } catch (err: any) {
        logger.error('[AUTH STORE] Erreur lors du changement de langue', { error: err })
        this.error = err?.message || 'Erreur lors du changement de langue'
        // Ne pas retourner de valeur pour Promise<void>
      }
    }
  }
})