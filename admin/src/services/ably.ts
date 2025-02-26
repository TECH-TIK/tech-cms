import * as Ably from 'ably'
import { ref } from 'vue'

console.log('[ABLY] Initialisation du service Ably')

let client: Ably.Realtime | null = null
const connected = ref(false)

export const initAbly = async (token: string) => {
  console.log('[ABLY] Connexion au service de temps réel')
  try {
    client = new Ably.Realtime({ token })
    client.connection.on('connected', () => {
      console.log('[ABLY] Connecté au service de temps réel')
      connected.value = true
    })
    client.connection.on('disconnected', () => {
      console.log('[ABLY] Déconnecté du service de temps réel')
      connected.value = false
    })
  } catch (err) {
    console.error('[ABLY] Erreur de connexion:', err)
    throw err
  }
}

export const subscribe = (channel: string, event: string, callback: (message: any) => void) => {
  console.log(`[ABLY] Abonnement au canal ${channel}, événement ${event}`)
  if (!client) {
    console.error('[ABLY] Client non initialisé')
    return
  }
  
  const ablyChannel = client.channels.get(channel)
  ablyChannel.subscribe(event, (message) => {
    console.log(`[ABLY] Message reçu sur ${channel}:${event}`, message)
    callback(message.data)
  })
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

// Hook pour utiliser Ably dans les composants Vue
export const useAbly = () => {
  const getChannel = (channelName: string = 'services') => {
    if (!client) {
      console.error('[ABLY] Client non initialisé, impossible d\'obtenir le canal')
      throw new Error('Ably client not initialized')
    }
    return client.channels.get(channelName)
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
    isConnected: () => connected.value
  }
}

export default {
  initAbly,
  subscribe,
  publish,
  disconnect,
  isConnected,
  useAbly
}
