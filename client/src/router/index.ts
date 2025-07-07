import { createRouter, createWebHistory } from 'vue-router'
import logger from '@/services/logger'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import ServicesView from '@/views/services/ServicesView.vue'
import BillingView from '@/views/billing/BillingView.vue'
import SupportView from '@/views/support/SupportView.vue'
import AccountView from '@/views/account/AccountView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'

// Logs pour vérifier les importations
logger.debug('[ROUTER] Composants importés', {
  DashboardView: !!DashboardView,
  ServicesView: !!ServicesView,
  BillingView: !!BillingView,
  SupportView: !!SupportView,
  AccountView: !!AccountView,
  LoginView: !!LoginView,
  RegisterView: !!RegisterView
});

// Récupérer le chemin de base depuis l'URL actuelle
const baseUrl = '/client'

const router = createRouter({
  history: createWebHistory(baseUrl),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    // Routes d'authentification (publiques)
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        public: true,
        requiresAuth: false,
        hideForAuthenticated: true,
        hideLayout: true
      }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        public: true,
        requiresAuth: false,
        hideForAuthenticated: true,
        hideLayout: true
      }
    },
    // Routes protégées (nécessitent une authentification)
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
      path: '/services',
      name: 'services',
      component: ServicesView,
      meta: {
        public: false,
        requiresAuth: true
      }
    },
    {
      path: '/billing',
      name: 'billing',
      component: BillingView,
      meta: {
        public: false,
        requiresAuth: true
      }
    },
    {
      path: '/support',
      name: 'support',
      component: SupportView,
      meta: {
        public: false,
        requiresAuth: true
      }
    },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
      meta: {
        public: false,
        requiresAuth: true
      }
    },
    // Routes de détail
    {
      path: '/services/:id',
      name: 'service-detail',
      component: () => import('@/views/services/ServiceDetailView.vue'),
      meta: {
        public: false,
        requiresAuth: true
      }
    },
    {
      path: '/billing/invoice/:id',
      name: 'invoice-detail',
      component: () => import('@/views/billing/InvoiceDetailView.vue'),
      meta: {
        public: false,
        requiresAuth: true
      }
    },
    {
      path: '/support/ticket/:id',
      name: 'ticket-detail',
      component: () => import('@/views/support/TicketDetailView.vue'),
      meta: {
        public: false,
        requiresAuth: true
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/dashboard'
    }
  ]
})

// Navigation guards avec authentification
router.beforeEach(async (to, from, next) => {
  logger.debug('[ROUTER] Navigation', { from: from.path, to: to.path, name: to.name })

  const authStore = useAuthStore()

  // Initialiser le store d'authentification si ce n'est pas déjà fait
  if (!authStore.initialized) {
    logger.debug('[ROUTER] Initialisation du store d\'authentification')
    await authStore.initialize()
  }

  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.meta.requiresAuth
  const hideForAuthenticated = to.meta.hideForAuthenticated

  logger.debug('[ROUTER] État d\'authentification', {
    isAuthenticated,
    requiresAuth,
    hideForAuthenticated,
    path: to.path
  })

  // Si la route nécessite une authentification et que l'utilisateur n'est pas connecté
  if (requiresAuth && !isAuthenticated) {
    logger.debug('[ROUTER] Redirection vers login - authentification requise')
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // Si l'utilisateur est connecté et tente d'accéder aux pages d'auth
  if (isAuthenticated && hideForAuthenticated) {
    logger.debug('[ROUTER] Redirection vers dashboard - utilisateur déjà connecté')
    next({ name: 'dashboard' })
    return
  }

  // Autoriser la navigation
  logger.debug('[ROUTER] Navigation autorisée vers', { path: to.path })
  next()
})

export default router
