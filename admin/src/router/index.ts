import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logger from '@/services/logger'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import ClientsView from '@/views/client/ClientsView.vue'
import ProductsView from '@/views/products/ProductsView.vue'
import CreateProductView from '@/views/products/CreateProductView.vue'
import ProductTypeView from '@/views/products/wizard/ProductTypeView.vue'
import ProductDetailsView from '@/views/products/wizard/ProductDetailsView.vue'
import ProductPricingView from '@/views/products/wizard/ProductPricingView.vue'
import ProductModuleView from '@/views/products/wizard/ProductModuleView.vue'
import ProductCustomFieldsView from '@/views/products/wizard/ProductCustomFieldsView.vue'
import ProductConfigurableOptionsView from '@/views/products/wizard/ProductConfigurableOptionsView.vue'
import ProductUpgradesView from '@/views/products/wizard/ProductUpgradesView.vue'
import ProductFreeDomainView from '@/views/products/wizard/ProductFreeDomainView.vue'
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
import ModulesView from '@/views/settings/ModulesView.vue'
import AutomationView from '@/views/settings/AutomationView.vue'
import UpdatesView from '@/views/system/UpdatesView.vue'
import InvalidLicenseView from '@/views/license/InvalidLicenseView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import NotificationsView from '@/views/notifications/NotificationsView.vue'
import ServicesView from '@/views/services/ServicesView.vue'
import ServiceFormView from '@/views/services/ServiceFormView.vue'
import ServiceDetailView from '@/views/services/ServiceDetailView.vue'
import ClientFormView from '@/views/client/ClientFormView.vue'
import ClientDetailView from '@/views/client/ClientDetailView.vue'

// Nouvelles pages de formulaires et détails
import PaymentFormView from '@/views/payments/PaymentFormView.vue'
import PaymentDetailsView from '@/views/payments/PaymentDetailsView.vue'
import InvoiceFormView from '@/views/billing/InvoiceFormView.vue'
import InvoiceDetailsView from '@/views/billing/InvoiceDetailsView.vue'
import SubscriptionFormView from '@/views/billing/SubscriptionFormView.vue'
import SubscriptionDetailsView from '@/views/billing/SubscriptionDetailsView.vue'
import TicketFormView from '@/views/support/TicketFormView.vue'
import TicketDetailsView from '@/views/support/TicketDetailsView.vue'
import TicketDepartmentsView from '@/views/support/TicketDepartmentsView.vue'

// Logs pour vérifier les importations
logger.debug('[ROUTER] Composants importés', {
  DashboardView: !!DashboardView,
  LoginView: !!LoginView,
  ClientsView: !!ClientsView,
  ProductsView: !!ProductsView,
  CreateProductView: !!CreateProductView,
  InvoicesView: !!InvoicesView,
  PaymentsView: !!PaymentsView,
  SubscriptionsView: !!SubscriptionsView,
  TicketsView: !!TicketsView,
  SettingsView: !!SettingsView,
  ServersView: !!ServersView,
  GeneralView: !!GeneralView,
  SecurityView: !!SecurityView,
  LicenseView: !!LicenseView,
  InvalidLicenseView: !!InvalidLicenseView,
  NotFoundView: !!NotFoundView,
  NotificationsView: !!NotificationsView,
  NotificationsSettingsView: !!NotificationsSettingsView,
  BillingView: !!BillingView,
  IntegrationsView: !!IntegrationsView,
  ProductDetailsView: !!ProductDetailsView,
  ProductPricingView: !!ProductPricingView,
  ProductModuleView: !!ProductModuleView,
  ProductCustomFieldsView: !!ProductCustomFieldsView,
  ProductConfigurableOptionsView: !!ProductConfigurableOptionsView,
  ProductUpgradesView: !!ProductUpgradesView,
  ProductFreeDomainView: !!ProductFreeDomainView,
  ProductCrossSellsView: !!ProductCrossSellsView,
  ProductOtherView: !!ProductOtherView,
  ProductLinksView: !!ProductLinksView,
  ServicesView: !!ServicesView,
  ServiceFormView: !!ServiceFormView,
  ServiceDetailView: !!ServiceDetailView,
  ClientFormView: !!ClientFormView,
  ClientDetailView: !!ClientDetailView,
  PaymentFormView: !!PaymentFormView,
  PaymentDetailsView: !!PaymentDetailsView,
  InvoiceFormView: !!InvoiceFormView,
  InvoiceDetailsView: !!InvoiceDetailsView,
  SubscriptionFormView: !!SubscriptionFormView,
  SubscriptionDetailsView: !!SubscriptionDetailsView,
  TicketFormView: !!TicketFormView,
  TicketDetailsView: !!TicketDetailsView,
  UpdatesView: !!UpdatesView,
});

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
      redirect: '/products/create/type'
    },
    // Route principale pour les produits avec paramètre idOrAction
    {
      path: '/products/:idOrAction',
      component: CreateProductView,
      props: route => ({
        productId: route.params.idOrAction !== 'create' ? parseInt(route.params.idOrAction as string) : null,
        productType: route.query.type || 'shared_hosting'
      }),
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      },
      children: [
        {
          path: '',
          redirect: to => {
            // Vérifier si nous avons un ID (édition) ou un type (création)
            if (to.params.idOrAction && to.params.idOrAction !== 'create') {
              // Mode édition avec ID numérique
              if (!isNaN(Number(to.params.idOrAction))) {
                return { name: 'product-details', params: { idOrAction: to.params.idOrAction } }
              }
            }
            // Mode création
            return { name: 'product-type', params: { idOrAction: to.params.idOrAction } }
          }
        },
        {
          path: 'details',
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
          component: ProductTypeView,
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
          component: ProductFreeDomainView,
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
      path: '/invoices/create',
      name: 'create-invoice',
      component: InvoiceFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/invoices/:id/edit',
      name: 'edit-invoice',
      component: InvoiceFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/invoices/:id',
      name: 'invoice-details',
      component: InvoiceDetailsView,
      meta: { requiresAuth: true }
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
      path: '/payments/create',
      name: 'create-payment',
      component: PaymentFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/payments/:id/edit',
      name: 'edit-payment',
      component: PaymentFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/payments/:id',
      name: 'payment-details',
      component: PaymentDetailsView,
      meta: { requiresAuth: true }
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
      path: '/subscriptions/create',
      name: 'create-subscription',
      component: SubscriptionFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/subscriptions/:id/edit',
      name: 'edit-subscription',
      component: SubscriptionFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/subscriptions/:id',
      name: 'subscription-details',
      component: SubscriptionDetailsView,
      meta: { requiresAuth: true }
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
      path: '/tickets/create',
      name: 'create-ticket',
      component: TicketFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/tickets/:id/edit',
      name: 'edit-ticket',
      component: TicketFormView,
      meta: { requiresAuth: true }
    },
    {
      path: '/tickets/:id',
      name: 'ticket-details',
      component: TicketDetailsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/ticket-departments',
      name: 'ticket-departments',
      component: TicketDepartmentsView,
      meta: { requiresAuth: true }
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
      path: '/settings/modules',
      name: 'settings-modules',
      component: ModulesView,
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
      path: '/settings/automation',
      name: 'settings-automation',
      component: AutomationView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
    },
    {
      path: '/system/updates',
      name: 'system-updates',
      component: UpdatesView,
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
      redirect: _to => '/products/create'
    },
    {
      path: '/products/:id/edit',
      redirect: to => `/products/${to.params.id}`
    },
    // Routes pour les détails par type - rediriger vers la nouvelle structure
    {
      path: '/products/details/:type',
      redirect: _to => '/products/create'
    },
    {
      path: '/products/pricing/:type',
      redirect: _to => '/products/create/pricing'
    },
    {
      path: '/products/module/:type',
      redirect: _to => '/products/create/module'
    },
    {
      path: '/products/custom-fields/:type',
      redirect: _to => '/products/create/custom-fields'
    },
    {
      path: '/products/configurable-options/:type',
      redirect: _to => '/products/create/configurable-options'
    },
    {
      path: '/products/upgrades/:type',
      redirect: _to => '/products/create/upgrades'
    },
    {
      path: '/products/freedomain/:type',
      redirect: _to => '/products/create/freedomain'
    },
    {
      path: '/products/cross-sells/:type',
      redirect: _to => '/products/create/cross-sells'
    },
    {
      path: '/products/other/:type',
      redirect: _to => '/products/create/other'
    },
    {
      path: '/products/links/:type',
      redirect: _to => '/products/create/links'
    }
  ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
    logger.debug('[ROUTER] Navigation', { from: from.path, to: to.path, name: to.name })
  
  // Initialiser le store d'authentification si nécessaire
  if (!authStore.initialized) {
    logger.debug('[ROUTER] Initialisation du store d\'authentification')
    await authStore.init()
  }

  // Si la route nécessite une authentification
  if (to.meta.requiresAuth) {
    logger.debug('[ROUTER] Route protégée, vérification auth', { isAuthenticated: authStore.isAuthenticated })
    
    // Vérifier explicitement l'authentification avec le serveur
    if (!authStore.isAuthenticated) {
      try {
        logger.debug('[ROUTER] Vérification de l\'authentification avec le serveur')
        const isAuthenticated = await authStore.checkAuth()
        
        if (!isAuthenticated) {
          logger.info('[ROUTER] Redirection vers login - Authentification requise')
          return next({ 
            name: 'login',
            query: { redirect: to.fullPath }
          })
        }
        
        logger.debug('[ROUTER] Authentification confirmée par le serveur')
      } catch (error) {
        logger.error('[ROUTER] Erreur lors de la vérification de l\'authentification', { error })
        return next({ 
          name: 'login',
          query: { redirect: to.fullPath }
        })
      }
    }
  }
  
  // Si l'utilisateur est sur login mais déjà authentifié
  if (to.meta.onlyWhenLoggedOut && authStore.isAuthenticated) {
    logger.info('[ROUTER] Redirection vers dashboard - Déjà authentifié')
    return next({ name: 'dashboard' })
  }

  // Vérifier si la route existe
  if (to.matched.length === 0) {
    logger.warn('[ROUTER] Route non trouvée, redirection vers dashboard', { path: to.path })
    return next({ name: 'dashboard' })
  }

  logger.debug('[ROUTER] Navigation autorisée vers', { path: to.path })
  next()
})

export default router
