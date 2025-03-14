import * as Ably from 'ably'
import { ref } from 'vue'
import axios from '@/utils/axios'

console.log('[ABLY] Initialisation du service Ably')

let client: Ably.Realtime | null = null
const connected = ref(false)

// Suivi des abonnements actifs
const subscriptions = ref<{
  channel: string;
  event: string;
  callback: Function;
}[]>([])

// Obtenir le nom de domaine actuel pour le préfixe des canaux
const getDomainPrefix = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'default';
}

// Générer un ID client stable pour l'utilisateur actuel
const generateClientId = (): string => {
  // Récupérer les informations utilisateur du localStorage
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const auth = JSON.parse(authData);
      
      // Si un ID utilisateur est disponible, l'utiliser
      if (auth.user && auth.user.id) {
        return `user-${auth.user.id}`;
      }
    }
  } catch (err) {
    console.error('[ABLY] Erreur lors de la récupération de l\'ID utilisateur:', err);
  }
  
  // Fallback: générer un ID stable basé sur le domaine et la session
  const sessionId = localStorage.getItem('ably_session_id');
  if (!sessionId) {
    const newSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ably_session_id', newSessionId);
    return `anonymous-${newSessionId}`;
  }
  
  return `anonymous-${sessionId}`;
};

// Fonction pour obtenir un nouveau token Ably depuis l'API
const fetchToken = async (): Promise<string> => {
  console.log('[ABLY] Récupération d\'un nouveau token')
  try {
    const response = await axios.get('/api/v1/realtime/token')
    if (!response.data?.token) {
      throw new Error('Token Ably non trouvé dans la réponse')
    }
    console.log('[ABLY] Nouveau token obtenu avec succès')
    return response.data.token
  } catch (err) {
    console.error('[ABLY] Erreur lors de la récupération du token:', err)
    throw err
  }
}

export const initAbly = async (initialToken: string) => {
  console.log('[ABLY] Connexion au service de temps réel')
  try {
    // Nous ne spécifions plus de clientId car cela entre en conflit avec le token
    console.log('[ABLY] Initialisation sans clientId spécifique');
    
    const options: Ably.Types.ClientOptions = {
      authCallback: async (tokenParams, callback) => {
        console.log('[ABLY] authCallback appelé pour renouveler le token')
        try {
          const token = await fetchToken()
          callback(null, token)
        } catch (err) {
          console.error('[ABLY] Erreur dans authCallback:', err)
          // Créer une ErrorInfo compatible avec l'API Ably
          const errorInfo: Ably.Types.ErrorInfo = {
            code: 40170,
            statusCode: 401,
            message: err instanceof Error ? err.message : 'Erreur de récupération du token',
            name: 'TokenError'
          }
          callback(errorInfo, null)
        }
      },
      token: initialToken,
      // Ne pas déconnecter en cas d'erreur 80023
      echoMessages: false,
      // Activer le fallback depuis l'API
      closeOnUnload: false,
      // Forcer l'utilisation de nouveaux canaux de communication
      recover: ''
    };
    
    client = new Ably.Realtime(options);

    client.connection.on('connected', () => {
      console.log('[ABLY] Connecté au service de temps réel')
      connected.value = true
    })

    client.connection.on('disconnected', () => {
      console.log('[ABLY] Déconnecté du service de temps réel')
      connected.value = false
    })

    // Ajout d'écouteurs pour les événements liés au token
    client.connection.on('failed', (stateChange: Ably.Types.ConnectionStateChange) => {
      console.error('[ABLY] Échec de connexion:', stateChange.reason)
    })

    client.connection.on('suspended', () => {
      console.warn('[ABLY] Connexion suspendue, tentative de reconnexion...')
    })
    
    // Forcer la reconnexion après 1s en cas d'erreur
    setTimeout(() => {
      if (!connected.value) {
        console.log('[ABLY] Tentative de connexion forcée après délai d\'initialisation');
        client?.connect();
      }
    }, 1000);
  } catch (err) {
    console.error('[ABLY] Erreur de connexion:', err)
    throw err
  }
}

export const subscribe = (channel: string, event: string, callback: (message: any) => void) => {
  console.log(`[ABLY] Abonnement au canal ${channel}, événement ${event}`)
  if (!client) {
    console.error('[ABLY] Client non initialisé')
    return () => {}; // Fonction de désabonnement vide
  }
  
  try {
    // Créer le canal Ably et s'abonner à l'événement
    const ablyChannel = client.channels.get(channel)
    ablyChannel.subscribe(event, (message) => {
      console.log(`[ABLY] Message reçu sur ${channel}:${event}`, message)
      callback(message.data)
    })
    
    // S'assurer que nous n'avons pas de doublon dans les abonnements
    const existingSubscriptionIndex = subscriptions.value.findIndex(
      sub => sub.channel === channel && sub.event === event
    );
    
    if (existingSubscriptionIndex === -1) {
      // Ajouter le nouvel abonnement à notre liste
      subscriptions.value.push({ channel, event, callback });
      console.log(`[ABLY] Abonnement ajouté: ${channel}:${event}`);
    } else {
      console.log(`[ABLY] Abonnement déjà existant: ${channel}:${event}`);
    }
    
    // Afficher les souscriptions mises à jour (uniquement en développement)
    if (process.env.NODE_ENV !== 'production') {
      logSubscriptions();
    }
    
    // Renvoyer une fonction pour se désabonner
    return () => unsubscribe(channel, event);
  } catch (err) {
    console.error(`[ABLY] Erreur lors de l'abonnement au canal ${channel}:`, err);
    return () => {}; // Fonction de désabonnement vide en cas d'erreur
  }
}

export const unsubscribe = (channel: string, event?: string) => {
  console.log(`[ABLY] Désabonnement du canal ${channel}${event ? `, événement ${event}` : ''}`)
  if (!client) {
    console.error('[ABLY] Client non initialisé')
    return
  }
  
  try {
    const ablyChannel = client.channels.get(channel)
    
    if (event) {
      // Désabonner d'un événement spécifique
      ablyChannel.unsubscribe(event)
      // Supprimer cet abonnement spécifique de notre liste
      subscriptions.value = subscriptions.value.filter(s => !(s.channel === channel && s.event === event))
    } else {
      // Désabonner de tous les événements sur ce canal
      ablyChannel.unsubscribe()
      // Supprimer tous les abonnements pour ce canal
      subscriptions.value = subscriptions.value.filter(s => s.channel !== channel)
    }
    
    // Afficher les souscriptions mises à jour
    logSubscriptions()
  } catch (err) {
    console.error(`[ABLY] Erreur lors du désabonnement du canal ${channel}:`, err)
  }
}

export const publish = async (channel: string, event: string, data: any) => {
  console.log(`[ABLY] Publication sur le canal ${channel}, événement ${event}`)
  if (!client) {
    console.error('[ABLY] Client non initialisé')
    return
  }
  
  try {
    const ablyChannel = client.channels.get(channel)
    await ablyChannel.publish(event, data)
    console.log(`[ABLY] Message publié avec succès sur ${channel}:${event}`)
  } catch (err) {
    console.error('[ABLY] Erreur de publication:', err)
    throw err
  }
}

export const disconnect = () => {
  console.log('[ABLY] Déconnexion du service de temps réel')
  if (client) {
    client.close()
    client = null
    connected.value = false
  }
}

export const isConnected = () => connected.value

// Obtenir l'instance du client Ably (pour les écouteurs d'événements)
export const getClient = (): Ably.Realtime | null => client

// Récupérer la liste des canaux actifs
export const getActiveChannels = () => {
  if (!client) {
    console.error('[ABLY] Client non initialisé')
    return []
  }
  
  // Approche simplifiée: utiliser directement notre registre d'abonnements
  // et regrouper par nom de canal
  const channelMap = new Map<string, string[]>();
  
  // Regrouper les événements par canal
  subscriptions.value.forEach(sub => {
    if (!channelMap.has(sub.channel)) {
      channelMap.set(sub.channel, []);
    }
    if (!channelMap.get(sub.channel)?.includes(sub.event)) {
      channelMap.get(sub.channel)?.push(sub.event);
    }
  });
  
  // Transformer la map en tableau
  const channels = Array.from(channelMap.entries()).map(([name, events]) => {
    // Essayer d'obtenir l'état du canal si possible
    let state = 'unknown';
    try {
      if (client && client.channels) {
        const ablyChannel = client.channels.get(name);
        state = ablyChannel.state || 'attached';
      }
    } catch (err) {
      console.warn(`[ABLY] Impossible d'obtenir l'état du canal ${name}:`, err);
    }
    
    return {
      name,
      state,
      events
    };
  });
  
  // Tri alphabétique pour plus de clarté
  return channels.sort((a, b) => a.name.localeCompare(b.name));
}

// Afficher les souscriptions dans la console
export const logSubscriptions = () => {
  const channels = getActiveChannels()
  
  // Pour le débogage, affichez toujours le nombre total d'abonnements
  console.log(`[ABLY] Nombre total d'abonnements enregistrés: ${subscriptions.value.length}`)
  
  // Affichage différent selon qu'il y a des canaux ou non
  if (channels.length === 0) {
    console.log('[ABLY] Aucun canal actif')
    // Pour le débogage, afficher les abonnements bruts s'il y en a
    if (subscriptions.value.length > 0) {
      console.log('[ABLY] Abonnements enregistrés mais aucun canal trouvé:', 
        subscriptions.value.map(s => `${s.channel}:${s.event}`))
    }
  } else {
    console.group('[ABLY] Canaux actifs:')
    channels.forEach(channel => {
      // Utiliser un style différent pour les canaux d'administration
      const isAdmin = channel.name.includes('private-admin')
      const style = isAdmin 
        ? 'color: #4CAF50; font-weight: bold;' 
        : 'color: #2196F3;'
      
      console.group(`%c${channel.name} (${channel.state})`, style)
      if (channel.events.length > 0) {
        console.log('Événements:', channel.events.join(', '))
      } else {
        console.log('Aucun événement spécifique')
      }
      console.groupEnd()
    })
    console.groupEnd()
  }
  
  // Vérifier si l'affichage automatique est actif (si disponible)
  if (typeof window !== 'undefined' && (window as any).AblyDebug?.isAutoDisplayActive) {
    const isAutoActive = (window as any).AblyDebug.isAutoDisplayActive()
    
    if (isAutoActive) {
      console.log('[ABLY] Mode d\'affichage: %cAutomatique', 'color: green; font-weight: bold;')
    } else {
      console.log('[ABLY] Mode d\'affichage: %cManuel', 'color: orange;')
      console.log('[ABLY] Astuce: utilisez AblyDebug.startAutoDisplay() pour activer l\'affichage automatique')
    }
  }
  
  return channels
}

// Méthodes spécifiques pour les canaux d'administration

/**
 * S'abonner au canal global d'administration
 * Format: domaine:private-admin
 */
export const subscribeToAdminChannel = (event: string, callback: (message: any) => void) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:private-admin`;
  console.log(`[ABLY] Abonnement au canal global d'administration: ${channelName}, événement: ${event}`);
  return subscribe(channelName, event, callback);
}

/**
 * S'abonner au canal privé d'un administrateur spécifique
 * Format: domaine:private-admin-{adminId}
 */
export const subscribeToAdminPrivateChannel = (adminId: number | string, event: string, callback: (message: any) => void) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:private-admin-${adminId}`;
  console.log(`[ABLY] Abonnement au canal privé d'administrateur: ${channelName}, événement: ${event}`);
  return subscribe(channelName, event, callback);
}

/**
 * Publier un message sur le canal global d'administration
 */
export const publishToAdminChannel = async (event: string, data: any) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:private-admin`;
  return publish(channelName, event, data);
}

/**
 * Publier un message sur le canal privé d'un administrateur spécifique
 */
export const publishToAdminPrivateChannel = async (adminId: number | string, event: string, data: any) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:private-admin-${adminId}`;
  return publish(channelName, event, data);
}

// Hook pour utiliser Ably dans les composants Vue
export const useAbly = () => {
  // Obtenir un canal avec contexte de domaine
  const getChannel = (channelName: string = 'services', withDomainPrefix: boolean = true) => {
    if (!client) {
      console.error('[ABLY] Client non initialisé, impossible d\'obtenir le canal')
      throw new Error('Ably client not initialized')
    }
    
    // Ajouter automatiquement le préfixe de domaine si demandé
    const fullChannelName = withDomainPrefix && !channelName.includes(':') 
      ? `${getDomainPrefix()}:${channelName}` 
      : channelName;
      
    return client.channels.get(fullChannelName)
  }

  return {
    channel: {
      subscribe: (event: string, callback: (message: any) => void) => {
        const channel = getChannel()
        channel.subscribe(event, (message) => {
          callback(message.data)
        })
      },
      publish: async (event: string, data: any) => {
        const channel = getChannel()
        await channel.publish(event, data)
      }
    },
    isConnected: () => connected.value,
    // Ajout des méthodes spécifiques pour l'administration
    subscribeToAdminChannel: (event: string, callback: (message: any) => void) => {
      return subscribeToAdminChannel(event, callback);
    },
    subscribeToAdminPrivateChannel: (adminId: number | string, event: string, callback: (message: any) => void) => {
      return subscribeToAdminPrivateChannel(adminId, event, callback);
    }
  }
}

export default {
  initAbly,
  subscribe,
  unsubscribe,
  publish,
  disconnect,
  isConnected,
  useAbly,
  getClient,
  getActiveChannels,
  logSubscriptions,
  // Exporter les nouvelles méthodes
  subscribeToAdminChannel,
  subscribeToAdminPrivateChannel,
  publishToAdminChannel,
  publishToAdminPrivateChannel
}
