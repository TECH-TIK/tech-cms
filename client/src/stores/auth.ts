/**
 * Store d'authentification client
 * 
 * Gère l'état d'authentification, la connexion, la déconnexion et la persistance
 * de l'utilisateur client dans l'application TechCMS.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '../services/api'

// Interface pour l'utilisateur client
interface ClientUser {
  id: number
  email: string
  firstName: string
  lastName: string
  company?: string
  role: 'client'
}

// Interface pour les données d'inscription
interface RegisterData {
  firstname: string
  lastname: string
  email: string
  company?: string // Seul champ optionnel
  phone: string
  address: string
  postal_code: string
  city: string
  country: string
  password: string
  passwordConfirmation: string
  acceptTerms: boolean
}



export const useAuthStore = defineStore('clientAuth', () => {
  // État réactif
  const user = ref<ClientUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userFullName = computed(() => 
    user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
  )

  /**
   * Connexion client
   */
  const login = async (email: string, password: string, remember: boolean = false) => {
    loading.value = true
    error.value = null

    try {
      const response = await ApiService.routes.auth.login(email, password, remember)

      if (response.data?.user) {
        user.value = response.data.user
        console.log('[AUTH] Connexion client réussie:', user.value)
        return true
      } else {
        throw new Error('Réponse invalide du serveur')
      }
    } catch (err: any) {
      console.error('[AUTH] Erreur de connexion:', err)
      error.value = err.response?.data?.message || err.message || 'Erreur de connexion'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Inscription client
   */
  const register = async (data: RegisterData) => {
    loading.value = true
    error.value = null

    try {
      console.log('[AUTH] Envoi des données d\'inscription:', {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        company: data.company,
        phone: data.phone,
        address: data.address,
        postal_code: data.postal_code,
        city: data.city,
        country: data.country
      })

      const response = await ApiService.routes.auth.register({
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        company: data.company,
        phone: data.phone,
        address: data.address,
        postal_code: data.postal_code,
        city: data.city,
        country: data.country,
        password: data.password
      })

      console.log('[AUTH] Inscription client réussie:', response.data)
      return response.data
    } catch (err: any) {
      console.error('[AUTH] Erreur d\'inscription:', err)
      error.value = err.response?.data?.message || err.message || 'Erreur d\'inscription'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Déconnexion client
   */
  const logout = async () => {
    loading.value = true

    try {
      await ApiService.routes.auth.logout()
    } catch (err) {
      console.error('[AUTH] Erreur lors de la déconnexion:', err)
    } finally {
      user.value = null
      error.value = null
      loading.value = false
      console.log('[AUTH] Déconnexion client effectuée')
    }
  }

  /**
   * Vérification de l'authentification
   */
  const checkAuth = async () => {
    if (initialized.value) {
      return isAuthenticated.value
    }

    loading.value = true

    try {
      const response = await ApiService.routes.auth.me()

      if (response.data?.user) {
        user.value = response.data.user
        console.log('[AUTH] Client authentifié:', user.value)
        return true
      }

      console.log('[AUTH] Client non authentifié')
      return false
    } catch (err) {
      console.error('[AUTH] Erreur lors de la vérification de l\'authentification:', err)
      user.value = null
      return false
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  /**
   * Initialisation du store
   */
  const initialize = async () => {
    if (!initialized.value) {
      await checkAuth()
    }
  }

  /**
   * Réinitialisation de l'état d'erreur
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Mise à jour des informations utilisateur
   */
  const updateUser = (userData: Partial<ClientUser>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
    }
  }

  return {
    // État
    user,
    loading,
    error,
    initialized,
    
    // Computed
    isAuthenticated,
    userFullName,
    
    // Actions
    login,
    register,
    logout,
    checkAuth,
    initialize,
    clearError,
    updateUser
  }
}, {
  persist: {
    key: 'techcms-client-auth',
    storage: localStorage
  }
})
