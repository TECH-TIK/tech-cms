// Fichier: /admin/src/services/logger.ts

const API_ENDPOINT = '/api/v1/admin/log';

/**
 * Envoie un log au backend.
 * @param level Le niveau de log (info, warning, error, debug).
 * @param message Le message à journaliser.
 * @param context Données de contexte supplémentaires.
 */
async function sendLog(level: string, message: string, context: object = {}) {
  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        level,
        message,
        context: {
          ...context,
          url: window.location.href,
        }
      }),
    });
  } catch (error) {
    // ULTIME RECOURS : Si le service de journalisation centralisé est indisponible,
    // nous écrivons l'erreur dans la console du navigateur.
    // C'est une mesure de sécurité pour ne jamais perdre un log critique,
    // même si le système de logging lui-même est en panne.
    // Cet appel ne peut pas utiliser `logger.error` car cela créerait une boucle infinie.
    console.error('Logger Service Unreachable. Log entry lost:', { level, message, context, error });
  }
}

const logger = {
  info: (message: string, context?: object) => {
    sendLog('info', message, context);
  },

  debug: (message: string, context?: object) => {
    if (import.meta.env.DEV) {
      // Les logs de débogage ne sont affichés qu'en mode développement
      // et ne sont pas envoyés au backend pour éviter le bruit.
      console.debug(`[DEBUG] ${message}`, context ?? '');
    }
  },

  warn: (message: string, context?: object) => {
    sendLog('warning', message, context);
  },

  error: (message: string, context?: object) => {
    sendLog('error', message, context);
  },
};

export default logger;
