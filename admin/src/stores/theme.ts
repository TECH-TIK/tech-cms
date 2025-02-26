import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // État
  console.log('[THEME STORE] Initialisation du store de thème')
  const darkMode = ref(localStorage.getItem('darkMode') === 'true')

  // Actions
  const toggleDarkMode = () => {
    console.log('[THEME STORE] Basculement du mode sombre')
    darkMode.value = !darkMode.value
    localStorage.setItem('darkMode', darkMode.value.toString())
  }

  // Observateur pour appliquer le thème
  watch(darkMode, (newValue) => {
    console.log('[THEME STORE] Application du thème:', newValue ? 'sombre' : 'clair')
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
