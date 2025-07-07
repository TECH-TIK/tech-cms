// Déclarations TypeScript pour les composants Vue
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // Utilisation de Record<string, any> au lieu de {} pour éviter les erreurs de lint
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>
  export default component
}

// Déclarations spécifiques pour les composants problématiques
declare module '@/components/common/NotificationsContainer.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>
  export default component
}

declare module '@/views/products/wizard/ProductModuleView.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>
  export default component
}

declare module '@/views/settings/ModulesView.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>
  export default component
}
