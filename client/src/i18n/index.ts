import { createI18n } from 'vue-i18n'
import fr from './fr.json'
import en from './en.json'

// Récupérer la langue sauvegardée ou utiliser le français par défaut
const savedLanguage = localStorage.getItem('language') || 'fr'

// Créer l'instance i18n
export const i18n = createI18n({
  legacy: false,
  locale: savedLanguage,
  fallbackLocale: 'en',
  messages: {
    fr,
    en
  }
})
