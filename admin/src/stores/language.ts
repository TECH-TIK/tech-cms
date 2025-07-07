import { defineStore } from 'pinia'
import logger from '@/services/logger'

export const useLanguageStore = defineStore('language', {
  state: () => ({
    currentLanguage: localStorage.getItem('language') || 'fr'
  }),
  
  actions: {
    setLanguage(lang: string) {
      logger.info(`[LANGUAGE STORE] Changement de langue vers: ${lang}`)
      this.currentLanguage = lang
      localStorage.setItem('language', lang)
      return true
    }
  },
  
  persist: {
    key: 'language-state',
    storage: localStorage
  }
})
