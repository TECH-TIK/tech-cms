/**
 * Types pour le routeur Vue
 */

import 'vue-router';

// Étendre les types de Vue Router pour inclure nos métadonnées personnalisées
declare module 'vue-router' {
  interface RouteMeta {
    // Protection d'authentification
    requiresAuth?: boolean;
    
    // Page accessible uniquement quand déconnecté
    onlyWhenLoggedOut?: boolean;
    
    // Autres métadonnées possibles
    title?: string;
    description?: string;
    icon?: string;
  }
}
