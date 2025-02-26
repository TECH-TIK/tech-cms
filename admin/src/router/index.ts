import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import ClientsView from '@/views/ClientsView.vue'
import ServicesView from '@/views/ServicesView.vue'
import ProductsView from '@/views/ProductsView.vue'
import InvoicesView from '@/views/InvoicesView.vue'
import PaymentsView from '@/views/PaymentsView.vue'
import SubscriptionsView from '@/views/SubscriptionsView.vue'
import TicketsView from '@/views/TicketsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LicenseView from '@/views/settings/LicenseView.vue'
import InvalidLicenseView from '@/views/InvalidLicenseView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

// Logs pour vérifier les importations
console.log('[ROUTER] Importation des composants:')
console.log('- DashboardView:', !!DashboardView)
console.log('- LoginView:', !!LoginView)
console.log('- ClientsView:', !!ClientsView)
console.log('- ServicesView:', !!ServicesView)
console.log('- ProductsView:', !!ProductsView)
console.log('- InvoicesView:', !!InvoicesView)
console.log('- PaymentsView:', !!PaymentsView)
console.log('- SubscriptionsView:', !!SubscriptionsView)
console.log('- TicketsView:', !!TicketsView)
console.log('- SettingsView:', !!SettingsView)
console.log('- LicenseView:', !!LicenseView)
console.log('- InvalidLicenseView:', !!InvalidLicenseView)
console.log('- NotFoundView:', !!NotFoundView)

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
      path: '/services',
      name: 'services',
      component: ServicesView,
      meta: {
        public: false,
        requiresAuth: true,
        onlyWhenLoggedOut: false
      }
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
      path: '/settings/license',
      name: 'license',
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
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: {
        public: true,
        requiresAuth: false,
        onlyWhenLoggedOut: false
      }
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
