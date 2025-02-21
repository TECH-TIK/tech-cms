/**
 * Gestionnaire du temps réel avec Ably
 */
class RealTimeManager {
    constructor() {
        if (window.realtimeInstance) {
            return window.realtimeInstance;
        }
        
        this.init();
        window.realtimeInstance = this;
    }

    /**
     * Initialisation de la connexion Ably
     */
    init() {
        try {
            if (!window.ABLY_CONFIG || !window.ABLY_CONFIG.key) {
                console.error('[Ably] Configuration manquante');
                return;
            }

            // Initialisation du client Ably
            this.ably = new Ably.Realtime({
                key: window.ABLY_CONFIG.key,
                clientId: window.ABLY_CONFIG.clientId,
                echoMessages: false
            });

            // Gestion des états de connexion
            this.ably.connection.on('connected', () => {
                this.subscribeToChannels();
            });

            this.ably.connection.on('failed', (error) => {
                console.error('[Ably] Erreur de connexion:', error);
            });

        } catch (error) {
            console.error('[Ably] Erreur d\'initialisation:', error);
            console.error('[Ably] Configuration:', window.ABLY_CONFIG);
        }
    }

    /**
     * Souscription aux canaux
     */
    subscribeToChannels() {
        try {
            // Liste des canaux à écouter
            const channels = [
                'private-admin',                            // Canal privé pour tous les admins
                `private-admin-${window.ABLY_CONFIG.userId}` // Canal privé spécifique à l'admin
            ];

            channels.forEach(channelName => {
                const channel = this.ably.channels.get(channelName);
                
                // Écouter les événements de notification
                channel.subscribe('notification', (message) => {
                    console.log(`[Ably] Notification reçue sur ${channelName}:`, message);
                    
                    // Afficher la notification via le gestionnaire de notifications
                    if (window.notifications) {
                        window.notifications.show(message.data);
                        
                        // Mettre à jour le compteur de notifications
                        const badge = document.querySelector('.notification-badge');
                        if (badge) {
                            const count = parseInt(badge.textContent || '0') + 1;
                            badge.textContent = count;
                            badge.style.display = count > 0 ? 'block' : 'none';
                        }
                    } else {
                        console.error('[Ably] Gestionnaire de notifications non disponible');
                    }
                });

                // Écouter les autres événements (sauf notifications)
                channel.subscribe((message) => {
                    if (message.name !== 'notification') {
                        console.log(`[Ably] Message reçu sur ${channelName}:`, message);
                    }
                });

                // Gestion des erreurs
                channel.on('error', (error) => {
                    console.error(`[Ably] Erreur sur le canal ${channelName}:`, error);
                });
            });

        } catch (error) {
            console.error('[Ably] Erreur de souscription:', error);
        }
    }
}

// Initialisation lors du chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    if (window.ABLY_CONFIG && window.ABLY_CONFIG.key) {
        window.realtime = new RealTimeManager();
    }
});
