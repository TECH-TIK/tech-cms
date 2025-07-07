<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">
          <i class="fas fa-user-circle"></i>
        </div>
        <h1 class="auth-title">Connexion Client</h1>
        <p class="auth-subtitle">Accédez à votre espace client TechCMS</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group" :class="{ error: errors.email, valid: !errors.email && form.email }">
          <label for="email" class="form-label">
            <i class="fas fa-envelope"></i>
            Adresse email
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            :class="{ error: errors.email }"
            placeholder="votre@email.com"
            required
            autocomplete="email"
            @blur="validateEmail"
            @input="clearError('email')"
          />
          <div v-if="errors.email" class="form-error">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.email }}
          </div>
        </div>

        <div class="form-group" :class="{ error: errors.password, valid: !errors.password && form.password }">
          <label for="password" class="form-label">
            <i class="fas fa-lock"></i>
            Mot de passe
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            :class="{ error: errors.password }"
            placeholder="Votre mot de passe"
            required
            autocomplete="current-password"
            @blur="validatePassword"
            @input="clearError('password')"
          />
          <div v-if="errors.password" class="form-error">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.password }}
          </div>
        </div>

        <div class="auth-options">
          <label class="remember-me">
            <input v-model="form.remember" type="checkbox" />
            Se souvenir de moi
          </label>
          <router-link to="/forgot-password" class="forgot-password">
            Mot de passe oublié ?
          </router-link>
        </div>

        <div v-if="errors.general" class="form-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ errors.general }}
        </div>

        <button
          type="submit"
          class="auth-button"
          :class="{ loading: loading }"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>

      <div class="auth-links">
        <p>
          Pas encore de compte ?
          <router-link to="/register" class="auth-link">
            Créer un compte
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import logger from '@/services/logger'

// Composables
const router = useRouter()
const authStore = useAuthStore()

// État réactif
const loading = ref(false)
const form = ref({
  email: '',
  password: '',
  remember: false
})

const errors = ref({
  email: '',
  password: '',
  general: ''
})

// Computed
const isFormValid = computed(() => {
  return form.value.email && 
         form.value.password && 
         !errors.value.email && 
         !errors.value.password
})

// Méthodes de validation
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.value.email) {
    errors.value.email = 'L\'adresse email est requise'
  } else if (!emailRegex.test(form.value.email)) {
    errors.value.email = 'Format d\'email invalide'
  } else {
    errors.value.email = ''
  }
}

const validatePassword = () => {
  if (!form.value.password) {
    errors.value.password = 'Le mot de passe est requis'
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Le mot de passe doit contenir au moins 6 caractères'
  } else {
    errors.value.password = ''
  }
}

const clearError = (field: string) => {
  if (errors.value[field as keyof typeof errors.value]) {
    errors.value[field as keyof typeof errors.value] = ''
  }
  if (errors.value.general) {
    errors.value.general = ''
  }
}

// Gestion de la connexion
const handleLogin = async () => {
  // Validation complète
  validateEmail()
  validatePassword()
  
  if (!isFormValid.value) {
    return
  }

  loading.value = true
  errors.value.general = ''

  try {
    await authStore.login(form.value.email, form.value.password, form.value.remember)
    
    // Redirection après connexion réussie
    const redirectTo = router.currentRoute.value.query.redirect as string || '/dashboard'
    await router.push(redirectTo)
  } catch (error: any) {
    logger.error('[AUTH] Erreur de connexion', { error, email: form.value.email })
    
    // Gestion des erreurs spécifiques
    if (error.response?.status === 401) {
      errors.value.general = 'Email ou mot de passe incorrect'
    } else if (error.response?.status === 403) {
      errors.value.general = 'Compte suspendu ou inactif'
    } else if (error.response?.status >= 500) {
      errors.value.general = 'Erreur serveur. Veuillez réessayer plus tard.'
    } else {
      errors.value.general = error.message || 'Une erreur est survenue lors de la connexion'
    }
  } finally {
    loading.value = false
  }
}

// Vérification de l'authentification au montage
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await router.push('/dashboard')
  }
})
</script>
