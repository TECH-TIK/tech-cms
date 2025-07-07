import './assets/css/main.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
// FormKit a été retiré car nous utilisons maintenant des composants standard
import logger from './services/logger';

logger.info("Démarrage de l'application");

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';
import { i18n } from './i18n';
// FormKit a été retiré car nous utilisons maintenant des composants standard

logger.info("Création de l'application Vue");
const app = createApp(App);

// Gestionnaire d'erreurs global pour Vue
app.config.errorHandler = (err, instance, info) => {
  const componentName = instance ? instance.$.type.name : 'UnknownComponent';
  logger.error(`Erreur non capturée dans le composant: ${componentName}`, {
    error: (err as Error).toString(),
    stack: (err as Error).stack,
    info: info,
  });


};

logger.info('Initialisation de Pinia');
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

logger.info('Initialisation du Router');
app.use(router);

logger.info('Initialisation de i18n');
app.use(i18n);

logger.info('FormKit a été retiré car nous utilisons maintenant des composants standard');

logger.info("Montage de l'application");
app.mount('#vue-app');

logger.info('Application montée avec succès');
