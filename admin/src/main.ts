import './assets/css/main.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

console.log('[MAIN] Démarrage de l\'application')

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'

console.log('[MAIN] Création de l\'application Vue')
const app = createApp(App)

console.log('[MAIN] Initialisation de Pinia')
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

console.log('[MAIN] Initialisation du Router')
app.use(router)

console.log('[MAIN] Initialisation de i18n')
app.use(i18n)

console.log('[MAIN] Montage de l\'application')
app.mount('#vue-app')

console.log('[MAIN] Application montée avec succès')
