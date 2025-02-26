import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useLanguageStore = defineStore('language', {
  state: () => ({
    currentLanguage: localStorage.getItem('language') || 'fr'
  }),
  
  actions: {
    setLanguage(lang: string) {
      console.log(`[LANGUAGE STORE] Changement de langue vers: ${lang}`)
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
