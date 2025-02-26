import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/utils/axios'
import router from '@/router'
import { persist } from 'pinia-plugin-persistedstate'

console.log('[AUTH STORE] Initialisation du store d\'authentification')

export const useAuthStore = defineStore('auth', {
  persist: {
    key: 'auth-state',
    paths: ['initialized'],
    storage: sessionStorage
  },

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
        console.log('[AUTH STORE] Déjà initialisé')
        return
      }

      console.log('[AUTH STORE] Initialisation...')
      
      try {
        const response = await axios.get('/api/v1/auth/check')
        if (response.data?.user) {
          console.log('[AUTH STORE] Utilisateur authentifié:', response.data.user)
          this.user = response.data.user
        }
      } catch (err) {
        console.log('[AUTH STORE] Non authentifié')
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    async login(email: string, password: string, remember: boolean = false) {
      console.log('[AUTH STORE] Tentative de connexion pour:', email)
      try {
        this.loading = true
        this.error = null

        const response = await axios.post('/api/v1/auth/login', {
          email,
          password,
          remember
        })

        if (!response.data?.user) {
          throw new Error('Réponse invalide du serveur')
        }

        // Stocker uniquement les données utilisateur
        this.user = response.data.user

        // Rediriger vers le dashboard après connexion
        router.push('/dashboard')

        return true
      } catch (err: any) {
        console.error('[AUTH STORE] Erreur de connexion:', err)
        this.error = err.message
        return false
      } finally {
        this.loading = false
      }
    },

    async logout() {
      // Si l'utilisateur est déjà déconnecté, ne rien faire
      if (!this.user) {
        console.log('[AUTH STORE] Utilisateur déjà déconnecté')
        return
      }

      try {
        console.log('[AUTH STORE] Tentative de déconnexion')
        await axios.post('/api/v1/auth/logout')
      } catch (err) {
        console.error('[AUTH STORE] Erreur lors de la déconnexion:', err)
      } finally {
        // Nettoyer l'état local
        this.user = null
        this.initialized = false
        
        // Rediriger vers la page de login
        router.push('/login')
      }
    },

    async checkAuth() {
      try {
        console.log('[AUTH STORE] Vérification de l\'authentification')
        const response = await axios.get('/api/v1/auth/check')
        
        if (response.data?.user) {
          console.log('[AUTH STORE] Utilisateur authentifié:', response.data.user)
          this.user = response.data.user
          return true
        }

        console.log('[AUTH STORE] Utilisateur non authentifié')
        return false
      } catch (err) {
        console.error('[AUTH STORE] Erreur lors de la vérification de l\'authentification:', err)
        this.user = null
        return false
      }
    },

    async forgotPassword(email: string) {
      console.log('[AUTH STORE] Demande de réinitialisation pour:', email)
      try {
        const response = await axios.post('/api/v1/auth/forgot-password', { email })
        console.log('[AUTH STORE] Email de réinitialisation envoyé')
        return response.data
      } catch (err) {
        console.error('[AUTH STORE] Erreur lors de la demande:', err)
        throw err
      }
    },

    async resetPassword(token: string, password: string) {
      try {
        this.loading = true
        this.error = null
        
        await axios.post('/api/v1/auth/reset-password', { token, password })
        return true
      } catch (err: any) {
        this.error = err.message
        return false
      } finally {
        this.loading = false
      }
    },

    async updateLanguage(lang: string) {
      // Cette méthode est utilisée pour mettre à jour la langue de l'utilisateur
      // Pour le moment, elle ne fait que stocker la préférence localement
      // Dans une implémentation complète, elle pourrait envoyer cette préférence au serveur
      console.log(`[AUTH STORE] Changement de langue vers: ${lang}`)
      
      try {
        // Si nous avons un utilisateur connecté, on pourrait sauvegarder sa préférence
        if (this.user) {
          // Optionnel: Envoyer la préférence au serveur
          // await axios.post('/api/v1/user/preferences', { language: lang })
          
          // Mettre à jour l'état local
          this.user = {
            ...this.user,
            language: lang
          }
        }
        
        return true
      } catch (err: any) {
        console.error('[AUTH STORE] Erreur lors du changement de langue:', err)
        return false
      }
    }
  }
})
