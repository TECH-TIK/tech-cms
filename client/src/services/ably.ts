import * as Ably from 'ably'
import { ref } from 'vue'
import logger from '@/services/logger'
import { ApiService } from '@/services/api'

// Types manuels pour remplacer Ably.Types qui n'est pas exporté correctement
interface ClientOptions {
  authCallback?: (tokenParams: any, callback: (error: any, tokenOrTokenRequest: any) => void) => void;
  token?: string;
  echoMessages?: boolean;
  closeOnUnload?: boolean;
  recover?: string;
}

interface ErrorInfo {
  code: number;
  statusCode: number;
  message: string;
  name: string;
}

interface ConnectionStateChange {
  current: string;
  previous: string;
  reason?: ErrorInfo;
  retryIn?: number;
}

logger.debug('[ABLY] Initialisation du service Ably')

let client: Ably.Realtime | null = null
const connected = ref(false)

// Suivi des abonnements actifs
const subscriptions = ref<{
  channel: string;
  event: string;
  callback: (message: any) => void;
}[]>([])

// Obtenir le nom de domaine actuel pour le préfixe des canaux
const getDomainPrefix = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'default';
}



// Fonction pour obtenir un nouveau token Ably depuis l'API client via le service API centralisé
const fetchToken = async (): Promise<string> => {
  logger.debug('[ABLY] Récupération d\'un nouveau token client')
  try {
    // Utiliser l'endpoint client pour le token Ably
    const response = await ApiService.routes.client.getRealtimeToken()
    if (!response.data?.token) {
      throw new Error('Token Ably client non trouvé dans la réponse')
    }
    logger.debug('[ABLY] Nouveau token client obtenu avec succès', {
      client_id: response.data.client_id
    })
    return response.data.token
  } catch (err) {
    logger.error('[ABLY] Erreur lors de la récupération du token client', { error: err })
    throw err
  }
}

export const initAbly = async (initialToken: string) => {
  logger.info('[ABLY] Connexion au service de temps réel')
  try {
    // Nous ne spécifions plus de clientId car cela entre en conflit avec le token
    logger.debug('[ABLY] Initialisation sans clientId spécifique');
    
    const options: ClientOptions = {
      authCallback: async (_tokenParams: any, callback: (error: any, tokenOrTokenRequest: any) => void) => {
        logger.debug('[ABLY] authCallback appelé pour renouveler le token')
        try {
          const token = await fetchToken()
          callback(null, token)
        } catch (err) {
          logger.error('[ABLY] Erreur dans authCallback', { error: err })
          // Créer une ErrorInfo compatible avec l'API Ably
          const errorInfo: ErrorInfo = {
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
      logger.info('[ABLY] Connecté au service de temps réel')
      connected.value = true
    })

    client.connection.on('disconnected', () => {
      logger.info('[ABLY] Déconnecté du service de temps réel')
      connected.value = false
    })

    // Ajout d'écouteurs pour les événements liés au token
    client.connection.on('failed', (stateChange: ConnectionStateChange) => {
      logger.error('[ABLY] Échec de connexion', { reason: stateChange.reason })
    })

    client.connection.on('suspended', () => {
      console.warn('[ABLY] Connexion suspendue, tentative de reconnexion...')
    })
    
    // Forcer la reconnexion après 1s en cas d'erreur
    setTimeout(() => {
      if (!connected.value) {
        logger.debug('[ABLY] Tentative de connexion forcée après délai d\'initialisation');
        client?.connect();
      }
    }, 1000);
  } catch (err) {
    logger.error('[ABLY] Erreur de connexion', { error: err })
    throw err
  }
}

export const subscribe = (channel: string, event: string, callback: (message: any) => void) => {
  logger.debug(`[ABLY] Abonnement au canal ${channel}, événement ${event}`)
  if (!client) {
    logger.error('[ABLY] Client non initialisé')
    return () => {}; // Fonction de désabonnement vide
  }
  
  try {
    // Créer le canal Ably et s'abonner à l'événement
    const ablyChannel = client.channels.get(channel)
    ablyChannel.subscribe(event, (message) => {
      logger.debug(`[ABLY] Message reçu sur ${channel}:${event}`, { message })
      callback(message.data)
    })
    
    // S'assurer que nous n'avons pas de doublon dans les abonnements
    const existingSubscriptionIndex = subscriptions.value.findIndex(
      sub => sub.channel === channel && sub.event === event
    );
    
    if (existingSubscriptionIndex === -1) {
      // Ajouter le nouvel abonnement à notre liste
      subscriptions.value.push({ channel, event, callback });
      logger.debug(`[ABLY] Abonnement ajouté: ${channel}:${event}`);
    } else {
      logger.debug(`[ABLY] Abonnement déjà existant: ${channel}:${event}`);
    }
    
    // Afficher les souscriptions mises à jour (uniquement en développement)
    if (process.env.NODE_ENV !== 'production') {
      logSubscriptions();
    }
    
    // Renvoyer une fonction pour se désabonner
    return () => unsubscribe(channel, event);
  } catch (err) {
    logger.error(`[ABLY] Erreur lors de l'abonnement au canal`, { channel, error: err });
    return () => {}; // Fonction de désabonnement vide en cas d'erreur
  }
}

export const unsubscribe = (channel: string, event?: string) => {
  logger.debug(`[ABLY] Désabonnement du canal ${channel}${event ? `, événement ${event}` : ''}`)
  if (!client) {
    logger.error('[ABLY] Client non initialisé')
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
    logger.error(`[ABLY] Erreur lors du désabonnement du canal`, { channel, error: err })
  }
}

export const publish = async (channel: string, event: string, data: any) => {
  logger.debug(`[ABLY] Publication sur le canal ${channel}, événement ${event}`)
  if (!client) {
    logger.error('[ABLY] Client non initialisé')
    return
  }
  
  try {
    const ablyChannel = client.channels.get(channel)
    await ablyChannel.publish(event, data)
    logger.debug(`[ABLY] Message publié avec succès sur ${channel}:${event}`)
  } catch (err) {
    logger.error('[ABLY] Erreur de publication', { error: err })
    throw err
  }
}

export const disconnect = () => {
  logger.info('[ABLY] Déconnexion du service de temps réel')
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
    logger.error('[ABLY] Client non initialisé')
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
  logger.debug(`[ABLY] Nombre total d'abonnements enregistrés: ${subscriptions.value.length}`)
  
  // Affichage différent selon qu'il y a des canaux ou non
  if (channels.length === 0) {
    logger.debug('[ABLY] Aucun canal actif')
    // Pour le débogage, afficher les abonnements bruts s'il y en a
    if (subscriptions.value.length > 0) {
      logger.debug('[ABLY] Abonnements enregistrés mais aucun canal trouvé:', 
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
        logger.debug('Événements:', { events: channel.events.join(', ') })
      } else {
        logger.debug('Aucun événement spécifique')
      }
      console.groupEnd()
    })
    console.groupEnd()
  }
  
  // Vérifier si l'affichage automatique est actif (si disponible)
  if (typeof window !== 'undefined' && (window as any).AblyDebug?.isAutoDisplayActive) {
    const isAutoActive = (window as any).AblyDebug.isAutoDisplayActive()
    
    if (isAutoActive) {
      logger.debug('[ABLY] Mode d\'affichage: Automatique')
    } else {
      logger.debug('[ABLY] Mode d\'affichage: Manuel')
      logger.debug('[ABLY] Astuce: utilisez AblyDebug.startAutoDisplay() pour activer l\'affichage automatique')
    }
  }
  
  return channels
}

// Méthodes spécifiques pour les canaux client

/**
 * S'abonner au canal global client
 * Format: domaine:private-client
 */
export const subscribeToClientChannel = (event: string, callback: (message: any) => void) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:private-client`;
  logger.debug(`[ABLY] Abonnement au canal global client: ${channelName}, événement: ${event}`);
  return subscribe(channelName, event, callback);
}

/**
 * S'abonner au canal privé d'un client spécifique
 * Format: domaine:private-client-{clientId}
 */
export const subscribeToClientPrivateChannel = (clientId: number | string, event: string, callback: (message: any) => void) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:private-client-${clientId}`;
  logger.info(`[ABLY] 🔔 ABONNEMENT CANAL PRIVÉ CLIENT: ${channelName}, événement: ${event}`);

  // Wrapper pour ajouter des logs détaillés
  const wrappedCallback = (message: any) => {
    logger.info(`[ABLY] 🎯 MESSAGE REÇU sur ${channelName}:${event}`, {
      message,
      timestamp: new Date().toISOString(),
      channelName,
      event
    });
    callback(message);
  };

  return subscribe(channelName, event, wrappedCallback);
}

/**
 * S'abonner au canal d'un ticket spécifique (partagé admin/client)
 * Format: domaine:ticket-{ticketId}
 */
export const subscribeToTicketChannel = (ticketId: number | string, event: string, callback: (message: any) => void) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:ticket-${ticketId}`;
  logger.debug(`[ABLY] Abonnement au canal ticket: ${channelName}, événement: ${event}`);
  return subscribe(channelName, event, callback);
}

/**
 * Publier un message sur le canal global client
 */
export const publishToClientChannel = async (event: string, data: any) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:private-client`;
  return publish(channelName, event, data);
}

/**
 * Publier un message sur le canal privé d'un client spécifique
 */
export const publishToClientPrivateChannel = async (clientId: number | string, event: string, data: any) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:private-client-${clientId}`;
  return publish(channelName, event, data);
}

/**
 * Publier un message sur le canal d'un ticket spécifique
 */
export const publishToTicketChannel = async (ticketId: number | string, event: string, data: any) => {
  const domain = getDomainPrefix();
  const channelName = `${domain}:ticket-${ticketId}`;
  return publish(channelName, event, data);
}

// Hook pour utiliser Ably dans les composants Vue
export const useAbly = () => {
  // Obtenir un canal avec contexte de domaine
  const getChannel = (channelName: string = 'services', withDomainPrefix: boolean = true) => {
    if (!client) {
      logger.error('[ABLY] Client non initialisé, impossible d\'obtenir le canal')
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
    // Ajout des méthodes spécifiques pour le client
    subscribeToClientChannel: (event: string, callback: (message: any) => void) => {
      return subscribeToClientChannel(event, callback);
    },
    subscribeToClientPrivateChannel: (clientId: number | string, event: string, callback: (message: any) => void) => {
      return subscribeToClientPrivateChannel(clientId, event, callback);
    },
    subscribeToTicketChannel: (ticketId: number | string, event: string, callback: (message: any) => void) => {
      return subscribeToTicketChannel(ticketId, event, callback);
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
  // Exporter les méthodes client
  subscribeToClientChannel,
  subscribeToClientPrivateChannel,
  subscribeToTicketChannel,
  publishToClientChannel,
  publishToClientPrivateChannel,
  publishToTicketChannel
}
