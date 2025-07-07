import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import logger from '@/services/logger'

logger.debug('[AXIOS] Configuration de l\'instance Axios')

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
    logger.debug('[AXIOS] Requête sortante', { method: config.method?.toUpperCase(), url: config.url })
    
    // Supprimer les doubles slashes dans l'URL sauf après http(s):
    if (config.url) {
      config.url = config.url.replace(/([^:]\/)\/+/g, '$1')
    }
    
    return config
  },
  (error) => {
    logger.error('[AXIOS] Erreur de requête', { error })
    return Promise.reject(error)
  }
)

// Variable pour éviter les déconnexions en boucle
let isLoggingOut = false

// Intercepteur de réponses
instance.interceptors.response.use(
  (response) => {
    logger.debug('[AXIOS] Réponse reçue', { status: response.status, url: response.config.url })
    return response
  },
  async (error) => {
    logger.error('[AXIOS] Erreur de réponse', { status: error.response?.status, url: error.config.url, error })
    
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      logger.warn('[AXIOS] Erreur 401 détectée', { url: error.config.url })
      
      // Ne pas déconnecter si c'est une vérification d'authentification
      // ou si on est déjà en train de se déconnecter
      // ou si on essaie d'accéder à un endpoint d'authentification
      if (!error.config.url?.includes('/auth/check') && 
          !error.config.url?.includes('/auth/login') && 
          !error.config.url?.includes('/auth/logout') && 
          !isLoggingOut) {
        
        logger.info('[AXIOS] Déconnexion requise')
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
