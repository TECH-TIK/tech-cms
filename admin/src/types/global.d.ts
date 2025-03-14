interface Window {
  /**
   * Objet de débogage pour Ably
   */
  AblyDebug: {
    /**
     * Affiche les canaux actifs dans la console
     */
    showChannels: () => any;
    
    /**
     * Récupère le statut actuel de la connexion
     */
    getStatus: () => {
      initialized: boolean;
      connected: boolean;
      hasError: boolean;
      error: string | null;
      reconnectAttempts: number;
    };
    
    /**
     * Force une reconnexion au service temps réel
     */
    reconnect: () => Promise<void>;
    
    /**
     * Crée un abonnement de test pour vérifier le fonctionnement
     */
    testSubscription: () => (() => void) | undefined;
    
    /**
     * Publie un message de test sur le canal de test (obsolète)
     * @deprecated Utiliser testPublishGlobal ou testPublishPrivate à la place
     */
    testPublish?: (message?: string) => void;
    
    /**
     * Publie un message de test sur le canal global d'administration
     */
    testPublishGlobal?: (message?: string) => void;
    
    /**
     * Publie un message de test sur le canal privé d'administration
     */
    testPublishPrivate?: (message?: string) => void;
    
    /**
     * Affiche un diagnostic complet du système temps réel
     */
    diagnosticComplet: () => void;
    
    /**
     * Démarre l'affichage automatique des canaux à intervalles réguliers
     * @param intervalMs Intervalle en millisecondes entre chaque affichage (défaut: 30000ms)
     */
    startAutoDisplay: (intervalMs?: number) => boolean;
    
    /**
     * Arrête l'affichage automatique des canaux
     */
    stopAutoDisplay: () => boolean;
    
    /**
     * Indique si l'affichage automatique est actif
     */
    isAutoDisplayActive: () => boolean;
  }
} 