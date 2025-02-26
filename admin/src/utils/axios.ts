import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

console.log('[AXIOS] Configuration de l\'instance Axios')

const instance = axios.create({
  baseURL: '',  
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true // Important pour envoyer les cookies avec les requêtes
})

// Intercepteur de requêtes
instance.interceptors.request.use(
  (config) => {
    console.log('[AXIOS] Requête sortante:', config.method?.toUpperCase(), config.url)
    
    // Supprimer les doubles slashes dans l'URL sauf après http(s):
    if (config.url) {
      config.url = config.url.replace(/([^:]\/)\/+/g, '$1')
    }
    
    return config
  },
  (error) => {
    console.error('[AXIOS] Erreur de requête:', error)
    return Promise.reject(error)
  }
)

// Variable pour éviter les déconnexions en boucle
let isLoggingOut = false

// Intercepteur de réponses
instance.interceptors.response.use(
  (response) => {
    console.log('[AXIOS] Réponse reçue:', response.status, response.config.url)
    return response
  },
  async (error) => {
    console.error('[AXIOS] Erreur de réponse:', error.response?.status, error.config.url)
    
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      console.log('[AXIOS] Erreur 401 détectée', error.config.url)
      
      // Ne pas déconnecter si c'est une vérification d'authentification
      // ou si on est déjà en train de se déconnecter
      // ou si on essaie d'accéder à un endpoint d'authentification
      if (!error.config.url?.includes('/auth/check') && 
          !error.config.url?.includes('/auth/login') && 
          !error.config.url?.includes('/auth/logout') && 
          !isLoggingOut) {
        
        console.log('[AXIOS] Déconnexion requise')
        isLoggingOut = true
        await authStore.logout()
        isLoggingOut = false
        router.push('/login')
      }
    }

    return Promise.reject(error)
  }
)

export default instance
