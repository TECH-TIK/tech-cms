import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import ClientsView from '@/views/client/ClientsView.vue'
import ProductsView from '@/views/products/ProductsView.vue'
import CreateProductView from '@/views/products/CreateProductView.vue'
import ProductDetailsView from '@/views/products/wizard/ProductDetailsView.vue'
import ProductPricingView from '@/views/products/wizard/ProductPricingView.vue'
import ProductModuleView from '@/views/products/wizard/ProductModuleView.vue'
import ProductCustomFieldsView from '@/views/products/wizard/ProductCustomFieldsView.vue'
import ProductConfigurableOptionsView from '@/views/products/wizard/ProductConfigurableOptionsView.vue'
import ProductUpgradesView from '@/views/products/wizard/ProductUpgradesView.vue'
import ProductFreedomainView from '@/views/products/wizard/ProductFreedomainView.vue'
import ProductCrossSellsView from '@/views/products/wizard/ProductCrossSellsView.vue'
import ProductOtherView from '@/views/products/wizard/ProductOtherView.vue'
import ProductLinksView from '@/views/products/wizard/ProductLinksView.vue'
import InvoicesView from '@/views/billing/InvoicesView.vue'
import PaymentsView from '@/views/payments/PaymentsView.vue'
import SubscriptionsView from '@/views/billing/SubscriptionsView.vue'
import TicketsView from '@/views/support/TicketsView.vue'
import SettingsView from '@/views/settings/SettingsView.vue'
import ServersView from '@/views/settings/ServersView.vue'
import GeneralView from '@/views/settings/GeneralView.vue'
import SecurityView from '@/views/settings/SecurityView.vue'
import NotificationsSettingsView from '@/views/settings/NotificationsView.vue'
import BillingView from '@/views/settings/BillingView.vue'
import IntegrationsView from '@/views/settings/IntegrationsView.vue'
import LicenseView from '@/views/settings/LicenseView.vue'
import InvalidLicenseView from '@/views/license/InvalidLicenseView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import NotificationsView from '@/views/notifications/NotificationsView.vue'
import ServicesView from '@/views/services/ServicesView.vue'
import ServiceFormView from '@/views/services/ServiceFormView.vue'
import ServiceDetailView from '@/views/services/ServiceDetailView.vue'
import ClientFormView from '@/views/client/ClientFormView.vue'
import ClientDetailView from '@/views/client/ClientDetailView.vue'

// Logs pour vérifier les importations
console.log('[ROUTER] Importation des composants:')
console.log('- DashboardView:', !!DashboardView)
console.log('- LoginView:', !!LoginView)
console.log('- ClientsView:', !!ClientsView)
console.log('- ProductsView:', !!ProductsView)
console.log('- CreateProductView:', !!CreateProductView)
console.log('- InvoicesView:', !!InvoicesView)
console.log('- PaymentsView:', !!PaymentsView)
console.log('- SubscriptionsView:', !!SubscriptionsView)
console.log('- TicketsView:', !!TicketsView)
console.log('- SettingsView:', !!SettingsView)
console.log('- ServersView:', !!ServersView)
console.log('- GeneralView:', !!GeneralView)
console.log('- SecurityView:', !!SecurityView)
console.log('- LicenseView:', !!LicenseView)
console.log('- InvalidLicenseView:', !!InvalidLicenseView)
console.log('- NotFoundView:', !!NotFoundView)
console.log('- NotificationsView:', !!NotificationsView)
console.log('- NotificationsSettingsView:', !!NotificationsSettingsView)
console.log('- BillingView:', !!BillingView)
console.log('- IntegrationsView:', !!IntegrationsView)
console.log('- ProductDetailsView:', !!ProductDetailsView)
console.log('- ProductPricingView:', !!ProductPricingView)
console.log('- ProductModuleView:', !!ProductModuleView)
console.log('- ProductCustomFieldsView:', !!ProductCustomFieldsView)
console.log('- ProductConfigurableOptionsView:', !!ProductConfigurableOptionsView)
console.log('- ProductUpgradesView:', !!ProductUpgradesView)
console.log('- ProductFreedomainView:', !!ProductFreedomainView)
console.log('- ProductCrossSellsView:', !!ProductCrossSellsView)
console.log('- ProductOtherView:', !!ProductOtherView)
console.log('- ProductLinksView:', !!ProductLinksView)
console.log('- ServicesView:', !!ServicesView)
console.log('- ServiceFormView:', !!ServiceFormView)
console.log('- ServiceDetailView:', !!ServiceDetailView)
console.log('- ClientFormView:', !!ClientFormView)
console.log('- ClientDetailView:', !!ClientDetailView)

// Récupérer le chemin de base depuis l'URL actuelle
const baseUrl = '/admin'

const router = createRouter({
  history: createWebHistory(baseUrl),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { 
        public: true,
        onlyWhenLoggedOut: true,
        requiresAuth: false
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { 
        public: false,
        requiresAuth: true
      }
    },
    {
      path: '/clients',
      name: 'clients',
      component: ClientsView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/clients/create',
      name: 'create-client',
      component: ClientFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/clients/:id/edit',
      name: 'edit-client',
      component: ClientFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/clients/:id',
      name: 'client-details',
      component: ClientDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/products/create',
      name: 'create-product',
      component: CreateProductView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/products/:idOrAction',
      component: CreateProductView,
      props: true,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      },
      children: [
        {
          path: '',
          name: 'product-details',
          component: ProductDetailsView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'type',
          name: 'product-type',
          component: CreateProductView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'pricing',
          name: 'product-pricing',
          component: ProductPricingView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'module',
          name: 'product-module',
          component: ProductModuleView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'custom-fields',
          name: 'product-custom-fields',
          component: ProductCustomFieldsView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'configurable-options',
          name: 'product-configurable-options',
          component: ProductConfigurableOptionsView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'upgrades',
          name: 'product-upgrades',
          component: ProductUpgradesView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'freedomain',
          name: 'product-freedomain',
          component: ProductFreedomainView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'cross-sells',
          name: 'product-cross-sells',
          component: ProductCrossSellsView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'other',
          name: 'product-other',
          component: ProductOtherView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        },
        {
          path: 'links',
          name: 'product-links',
          component: ProductLinksView,
          meta: {
            public: false,
            requiresAuth: true,
            onlyWhenLoggedOut: false
          }
        }
      ]
    },
    {
      path: '/invoices',
      name: 'invoices',
      component: InvoicesView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/payments',
      name: 'payments',
      component: PaymentsView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      component: SubscriptionsView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/tickets',
      name: 'tickets',
      component: TicketsView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/settings/servers',
      name: 'settings-servers',
      component: ServersView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/settings/general',
      name: 'settings-general',
      component: GeneralView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/settings/security',
      name: 'settings-security',
      component: SecurityView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/settings/notifications',
      name: 'settings-notifications',
      component: NotificationsSettingsView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/settings/billing',
      name: 'settings-billing',
      component: BillingView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/settings/integrations',
      name: 'settings-integrations',
      component: IntegrationsView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/settings/license',
      name: 'settings-license',
      component: LicenseView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/license',
      name: 'invalid-license',
      component: InvalidLicenseView,
      meta: {
        public: true,
        requiresAuth: false,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/services',
      name: 'services',
      component: ServicesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/services/create',
      name: 'create-service',
      component: ServiceFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/services/:id/edit',
      name: 'edit-service',
      component: ServiceFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/services/:id',
      name: 'service-details',
      component: ServiceDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: {
        public: true,
        requiresAuth: false,
        onlyWhenLoggedOut: false
      }
    },
    // Routes anciennes à conserver temporairement pour compatibilité
    {
      path: '/products/create',
      redirect: to => '/products/create'
    },
    {
      path: '/products/:id/edit',
      redirect: to => `/products/${to.params.id}`
    },
    // Routes pour les détails par type - rediriger vers la nouvelle structure
    {
      path: '/products/details/:type',
      redirect: to => '/products/create'
    },
    {
      path: '/products/pricing/:type',
      redirect: to => '/products/create/pricing'
    },
    {
      path: '/products/module/:type',
      redirect: to => '/products/create/module'
    },
    {
      path: '/products/custom-fields/:type',
      redirect: to => '/products/create/custom-fields'
    },
    {
      path: '/products/configurable-options/:type',
      redirect: to => '/products/create/configurable-options'
    },
    {
      path: '/products/upgrades/:type',
      redirect: to => '/products/create/upgrades'
    },
    {
      path: '/products/freedomain/:type',
      redirect: to => '/products/create/freedomain'
    },
    {
      path: '/products/cross-sells/:type',
      redirect: to => '/products/create/cross-sells'
    },
    {
      path: '/products/other/:type',
      redirect: to => '/products/create/other'
    },
    {
      path: '/products/links/:type',
      redirect: to => '/products/create/links'
    }
  ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  console.log('[ROUTER] Navigation de', from.path, 'vers', to.path, 'Route:', to.name)
  
  // Initialiser le store d'authentification si nécessaire
  if (!authStore.initialized) {
    console.log('[ROUTER] Initialisation du store d\'authentification')
    await authStore.init()
  }

  // Si la route nécessite une authentification
  if (to.meta.requiresAuth) {
    console.log('[ROUTER] Route protégée, vérification auth:', authStore.isAuthenticated)
    
    // Vérifier explicitement l'authentification avec le serveur
    if (!authStore.isAuthenticated) {
      try {
        console.log('[ROUTER] Vérification de l\'authentification avec le serveur')
        const isAuthenticated = await authStore.checkAuth()
        
        if (!isAuthenticated) {
          console.log('[ROUTER] Redirection vers login - Authentification requise')
          return next({ 
            name: 'login',
            query: { redirect: to.fullPath }
          })
        }
        
        console.log('[ROUTER] Authentification confirmée par le serveur')
      } catch (error) {
        console.error('[ROUTER] Erreur lors de la vérification de l\'authentification:', error)
        return next({ 
          name: 'login',
          query: { redirect: to.fullPath }
        })
      }
    }
  }
  
  // Si l'utilisateur est sur login mais déjà authentifié
  if (to.meta.onlyWhenLoggedOut && authStore.isAuthenticated) {
    console.log('[ROUTER] Redirection vers dashboard - Déjà authentifié')
    return next({ name: 'dashboard' })
  }

  // Vérifier si la route existe
  if (to.matched.length === 0) {
    console.log('[ROUTER] Route non trouvée, redirection vers dashboard')
    return next({ name: 'dashboard' })
  }

  console.log('[ROUTER] Navigation autorisée vers', to.path)
  next()
})

export default router
