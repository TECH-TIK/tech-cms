import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import axios from '@/utils/axios'
import * as ablyService from '@/services/ably'
import * as Ably from 'ably'

export const useRealtimeStore = defineStore('realtime', () => {
  // État
  console.log('[REALTIME STORE] Initialisation du store')
  const initialized = ref(false)
  const connected = ref(false)
  const error = ref<Error | null>(null)
  const loading = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const autoDisplayInterval = ref<ReturnType<typeof setInterval> | null>(null)

  // Getters
  const isInitialized = computed(() => initialized.value)
  const isConnected = computed(() => connected.value)
  const hasError = computed(() => error.value !== null)
  const isReconnecting = computed(() => reconnectAttempts.value > 0)

  // Actions
  const init = async () => {
    console.log('[REALTIME STORE] Initialisation du service de temps réel')
    try {
      if (initialized.value) {
        console.log('[REALTIME STORE] Service déjà initialisé')
        return
      }

      loading.value = true
      error.value = null

      // Récupérer le token depuis l'API
      console.log('[REALTIME STORE] Récupération du token API')
      const response = await axios.get('/api/v1/realtime/token')
      
      console.log('[REALTIME STORE] Réponse API token:', response.data)
      
      // Vérifier si la réponse contient une erreur
      if (response.data?.error) {
        throw new Error(`Erreur serveur: ${response.data.error}`)
      }
      
      const token = response.data?.token
      
      if (!token) {
        throw new Error('Token Ably non trouvé dans la réponse')
      }

      // Initialiser Ably avec le token
      console.log('[REALTIME STORE] Initialisation d\'Ably avec le token')
      await ablyService.initAbly(token)
      
      // Configurer les écouteurs d'état de la connexion
      setupConnectionListeners()
      
      initialized.value = true
      connected.value = true
      reconnectAttempts.value = 0
      console.log('[REALTIME STORE] Service de temps réel initialisé avec succès')
      
      // Afficher les canaux après l'initialisation
      setTimeout(() => {
        console.log('[REALTIME STORE] État initial des canaux:')
        debugShowChannels()
      }, 1000) // Délai court pour permettre l'établissement des connexions
    } catch (err) {
      console.error('[REALTIME STORE] Erreur d\'initialisation:', err)
      error.value = err as Error
      initialized.value = false
      connected.value = false
      
      // Tenter une reconnexion automatique en cas d'échec initial
      scheduleReconnect()
    } finally {
      loading.value = false
    }
  }

  // Configurer les écouteurs pour l'état de la connexion Ably
  const setupConnectionListeners = () => {
    const client = ablyService.getClient()
    if (!client) return
    
    client.connection.on('connected', () => {
      console.log('[REALTIME STORE] Connexion établie')
      connected.value = true
      error.value = null
      reconnectAttempts.value = 0
      
      // Annuler toute tentative de reconnexion programmée
      if (reconnectTimeout.value) {
        clearTimeout(reconnectTimeout.value)
        reconnectTimeout.value = null
      }
    })
    
    client.connection.on('disconnected', () => {
      console.log('[REALTIME STORE] Connexion perdue')
      connected.value = false
      
      // Ne pas déclencher de reconnexion ici, Ably va essayer de se reconnecter automatiquement
    })
    
    client.connection.on('suspended', () => {
      console.warn('[REALTIME STORE] Connexion suspendue')
      connected.value = false
      
      // Si Ably n'arrive pas à se reconnecter, on programme notre propre tentative
      scheduleReconnect()
    })
    
    client.connection.on('failed', (stateChange: Ably.Types.ConnectionStateChange) => {
      console.error('[REALTIME STORE] Échec de connexion:', stateChange.reason)
      connected.value = false
      error.value = new Error(stateChange.reason?.message || 'Échec de connexion')
      
      // Échec définitif, tentative manuelle de reconnexion
      scheduleReconnect()
    })
  }

  const disconnect = () => {
    console.log('[REALTIME STORE] Déconnexion du service de temps réel')
    ablyService.disconnect()
    initialized.value = false
    connected.value = false
    
    // Annuler toute tentative de reconnexion programmée
    if (reconnectTimeout.value) {
      clearTimeout(reconnectTimeout.value)
      reconnectTimeout.value = null
    }
    
    // Arrêter l'affichage automatique
    stopAutoDisplay()
  }

  // Réinitialiser en cas d'erreur
  const resetError = () => {
    error.value = null
  }

  const retry = async () => {
    console.log('[REALTIME STORE] Nouvelle tentative d\'initialisation')
    resetError()
    reconnectAttempts.value = 0
    
    // Annuler toute tentative de reconnexion programmée
    if (reconnectTimeout.value) {
      clearTimeout(reconnectTimeout.value)
      reconnectTimeout.value = null
    }
    
    return init()
  }
  
  // Programmer une tentative de reconnexion avec backoff exponentiel
  const scheduleReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.error('[REALTIME STORE] Nombre maximum de tentatives de reconnexion atteint')
      return
    }
    
    // Incrémenter le compteur de tentatives
    reconnectAttempts.value++
    
    // Calcul du délai avec backoff exponentiel (1s, 2s, 4s, 8s, 16s...)
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value - 1), 30000)
    
    console.log(`[REALTIME STORE] Tentative de reconnexion ${reconnectAttempts.value}/${maxReconnectAttempts} dans ${delay}ms`)
    
    // Programmer la reconnexion
    reconnectTimeout.value = setTimeout(() => {
      console.log(`[REALTIME STORE] Exécution de la tentative de reconnexion ${reconnectAttempts.value}`)
      init()
    }, delay)
  }

  // Actions de débogage
  const debugShowChannels = () => {
    console.log('[REALTIME STORE] Affichage des canaux actifs')
    return ablyService.logSubscriptions()
  }
  
  // Démarrer l'affichage automatique des canaux
  const startAutoDisplay = (intervalMs = 30000) => {
    // Arrêter tout intervalle existant
    stopAutoDisplay()
    
    console.log(`[REALTIME STORE] Démarrage de l'affichage automatique des canaux (intervalle: ${intervalMs}ms)`)
    
    // Afficher immédiatement
    debugShowChannels()
    
    // Puis configurer l'intervalle
    autoDisplayInterval.value = setInterval(() => {
      console.log('[REALTIME STORE] Mise à jour automatique des canaux:')
      debugShowChannels()
    }, intervalMs)
    
    return true
  }
  
  // Arrêter l'affichage automatique
  const stopAutoDisplay = () => {
    if (autoDisplayInterval.value) {
      clearInterval(autoDisplayInterval.value)
      autoDisplayInterval.value = null
      console.log('[REALTIME STORE] Arrêt de l\'affichage automatique des canaux')
      return true
    }
    return false
  }

  // Observer les changements d'état de connexion pour afficher les canaux
  watch(connected, (isConnected) => {
    if (isConnected) {
      // Afficher les canaux quand on se connecte
      setTimeout(() => {
        console.log('[REALTIME STORE] Canaux après connexion:')
        debugShowChannels()
      }, 1000)
    }
  })

  // Installation d'une commande globale pour le débogage
  if (typeof window !== 'undefined') {
    // @ts-ignore - Ajouter la commande debug au window
    window.AblyDebug = {
      showChannels: () => debugShowChannels(),
      getStatus: () => ({
        initialized: initialized.value,
        connected: connected.value,
        hasError: error.value !== null,
        error: error.value?.message || null,
        reconnectAttempts: reconnectAttempts.value
      }),
      reconnect: () => retry(),
      testSubscription: () => {
        // Créer un abonnement de test pour démontrer le fonctionnement
        console.log('[REALTIME STORE] Création d\'un abonnement de test')
        
        // S'assurer que le client est initialisé
        if (!initialized.value || !connected.value) {
          console.error('[REALTIME STORE] Client non initialisé ou non connecté')
          return
        }
        
        // Créer des abonnements de test pour les canaux d'administration
        const unsubscribeGlobal = ablyService.subscribeToAdminChannel('test-event', (message) => {
          console.log('[REALTIME STORE] Message global reçu:', message)
        })
        
        // Utiliser ID 0 pour le test
        const adminId = 0
        const unsubscribePrivate = ablyService.subscribeToAdminPrivateChannel(adminId, 'test-event', (message) => {
          console.log(`[REALTIME STORE] Message privé pour admin ${adminId} reçu:`, message)
        })
        
        console.log('[REALTIME STORE] Abonnements de test créés. Utilisez AblyDebug.showChannels() pour vérifier')
        
        // Définir des fonctions pour publier des messages de test
        // @ts-ignore
        window.AblyDebug.testPublishGlobal = (message = 'test global') => {
          console.log('[REALTIME STORE] Envoi d\'un message de test global')
          ablyService.publishToAdminChannel('test-event', { 
            message, 
            timestamp: new Date().toISOString(),
            type: 'global' 
          })
        }
        
        // @ts-ignore
        window.AblyDebug.testPublishPrivate = (message = 'test privé') => {
          console.log(`[REALTIME STORE] Envoi d\'un message de test privé pour admin ${adminId}`)
          ablyService.publishToAdminPrivateChannel(adminId, 'test-event', { 
            message, 
            timestamp: new Date().toISOString(),
            type: 'private'
          })
        }
        
        console.log('[REALTIME STORE] Utilisez ces commandes pour tester:')
        console.log('- AblyDebug.testPublishGlobal("message") : envoyer un message global')
        console.log('- AblyDebug.testPublishPrivate("message") : envoyer un message privé')
        
        // Renvoyer une fonction pour se désabonner des deux canaux
        return () => {
          unsubscribeGlobal()
          unsubscribePrivate()
        }
      },
      diagnosticComplet: () => {
        console.group('[REALTIME STORE] Diagnostic complet du système temps réel')
        
        // 1. État de la connexion
        console.group('1. État de la connexion')
        const status = {
          initialized: initialized.value,
          connected: connected.value,
          hasError: error.value !== null,
          error: error.value?.message || null,
          reconnectAttempts: reconnectAttempts.value
        }
        console.table(status)
        console.groupEnd()
        
        // 2. Client Ably
        console.group('2. Client Ably')
        const client = ablyService.getClient()
        console.log('Client Ably:', client ? 'Initialisé' : 'Non initialisé')
        if (client) {
          console.log('État de la connexion:', client.connection.state)
          console.log('ID de connexion:', client.connection.id)
        }
        console.groupEnd()
        
        // 3. Abonnements et canaux
        console.group('3. Abonnements et canaux')
        console.log('Canaux:')
        const channels = ablyService.logSubscriptions()
        console.groupEnd()
        
        // 4. Vérifications
        console.group('4. Analyse des problèmes potentiels')
        if (!initialized.value) {
          console.error('❌ Le système temps réel n\'est pas initialisé')
        } else if (!connected.value) {
          console.error('❌ Le système temps réel n\'est pas connecté')
        } else if (!client) {
          console.error('❌ Le client Ably n\'est pas initialisé')
        } else if (!channels || channels.length === 0) {
          console.warn('⚠️ Aucun canal n\'est actuellement actif')
          console.log('💡 Solution: Utilisez AblyDebug.testSubscription() pour créer un canal de test')
        } else {
          console.log('✅ Tout semble fonctionner correctement')
        }
        console.groupEnd()
        
        console.groupEnd()
      },
      // Ajouter les commandes pour l'affichage automatique
      startAutoDisplay: (intervalMs = 30000) => startAutoDisplay(intervalMs),
      stopAutoDisplay: () => stopAutoDisplay(),
      isAutoDisplayActive: () => autoDisplayInterval.value !== null
    }
    
    console.log('[REALTIME STORE] Commandes de débogage installées:')
    console.log('- AblyDebug.showChannels() : afficher les canaux actifs')
    console.log('- AblyDebug.startAutoDisplay(30000) : afficher automatiquement les canaux (intervalle en ms)')
    console.log('- AblyDebug.stopAutoDisplay() : arrêter l\'affichage automatique')
    
    // Démarrer l'affichage automatique par défaut 
    // avec un intervalle de 1 minute (60000 ms)
    startAutoDisplay(60000)
  }

  return {
    initialized,
    connected,
    error,
    loading,
    isInitialized,
    isConnected,
    hasError,
    isReconnecting,
    init,
    disconnect,
    resetError,
    retry,
    debugShowChannels,
    startAutoDisplay,
    stopAutoDisplay
  }
}) 