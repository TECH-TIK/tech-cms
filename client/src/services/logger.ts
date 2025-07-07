// Fichier: /client/src/services/logger.ts

import { ApiService } from './api';

/**
 * Envoie un log au backend via l'ApiService centralisé.
 * @param level Le niveau de log (info, warning, error, debug).
 * @param message Le message à journaliser.
 * @param context Données de contexte supplémentaires.
 */
async function sendLog(level: string, message: string, context: object = {}) {
  try {
    // Utiliser l'ApiService centralisé au lieu de fetch() direct
    await ApiService.routes.client.logging.log(level, message, {
      ...context,
      url: window.location.href,
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
