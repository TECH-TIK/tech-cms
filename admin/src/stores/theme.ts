import { defineStore } from 'pinia'
import logger from '@/services/logger'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // État
  logger.debug('[THEME STORE] Initialisation du store de thème')
  const darkMode = ref(localStorage.getItem('darkMode') === 'true')

  // Actions
  const toggleDarkMode = () => {
    logger.info('[THEME STORE] Basculement du mode sombre')
    darkMode.value = !darkMode.value
    localStorage.setItem('darkMode', darkMode.value.toString())
  }

  // Observateur pour appliquer le thème
  watch(darkMode, (newValue) => {
    logger.info(`[THEME STORE] Application du thème: ${newValue ? 'sombre' : 'clair'}`)
    if (newValue) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }, { immediate: true })

  return {
    darkMode,
    toggleDarkMode
  }
})
