<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { handleError } from '@/utils/error-handler'
import Logo from '@/components/common/Logo.vue'
import logger from '@/services/logger'

logger.debug('[LOGIN] Initialisation du composant Login')

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

// État
const email = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const showForgotPassword = ref(false)
const forgotEmail = ref('')
const forgotSuccess = ref(false)

onMounted(() => {
  logger.debug('[LOGIN] Composant Login monté')
})

// Méthodes
const handleLogin = async () => {
  logger.info('[LOGIN] Tentative de connexion')
  if (!email.value || !password.value) {
    logger.warn('[LOGIN] Champs manquants')
    error.value = t('login.errorFields')
    return
  }

  try {
    loading.value = true
    error.value = ''
    logger.debug('[LOGIN] Appel de authStore.login')
    await authStore.login(email.value, password.value, remember.value)
    logger.info('[LOGIN] Connexion réussie')
    router.push('/dashboard')
  } catch (err: any) {
    logger.error('[LOGIN] Erreur de connexion', { error: err })
    error.value = handleError(err)
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = async () => {
  logger.info('[LOGIN] Tentative de réinitialisation du mot de passe')
  if (!forgotEmail.value) {
    logger.warn('[LOGIN] Email manquant')
    error.value = t('login.errorEmail')
    return
  }

  try {
    loading.value = true
    logger.debug('[LOGIN] Appel de authStore.forgotPassword')
    await authStore.forgotPassword(forgotEmail.value)
    logger.info('[LOGIN] Email de réinitialisation envoyé')
    forgotSuccess.value = true
    error.value = ''
  } catch (err: any) {
    logger.error('[LOGIN] Erreur de réinitialisation', { error: err })
    error.value = handleError(err)
  } finally {
    loading.value = false
  }
}

const toggleForgotPassword = () => {
  logger.debug('[LOGIN] Basculement du formulaire de réinitialisation')
  showForgotPassword.value = !showForgotPassword.value
  error.value = ''
  forgotSuccess.value = false
}
</script>

<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-header">
        <Logo class="login-logo" />
        <h1>{{ t('login.welcome') }}</h1>
        <p>{{ t('login.subtitle') }}</p>
      </div>

      <div v-if="!showForgotPassword" class="login-form">
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">{{ t('login.email') }}</label>
            <div class="input-group">
              <i class="fas fa-envelope" />
              <input
                id="email"
                v-model="email"
                type="email"
                :placeholder="t('login.emailPlaceholder')"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">{{ t('login.password') }}</label>
            <div class="input-group">
              <i class="fas fa-lock" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('login.passwordPlaceholder')"
                required
                autocomplete="current-password"
              />
              <button 
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" />
              </button>
            </div>
          </div>

          <div class="form-options">
            <div class="remember-me">
              <input
                id="remember"
                v-model="remember"
                type="checkbox"
              />
              <label for="remember">{{ t('login.rememberMe') }}</label>
            </div>
            <button 
              type="button"
              class="forgot-password"
              @click="toggleForgotPassword"
            >
              {{ t('login.forgotPassword') }}
            </button>
          </div>

          <div v-if="error" class="error-message">
            <i class="fas fa-exclamation-circle" />
            {{ error }}
          </div>

          <button 
            type="submit"
            class="login-button"
            :disabled="loading"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin" />
            <span v-else>{{ t('login.signIn') }}</span>
          </button>
        </form>
      </div>

      <div v-else class="forgot-password-form">
        <h2>{{ t('login.resetTitle') }}</h2>
        <p>{{ t('login.resetDescription') }}</p>

        <form @submit.prevent="handleForgotPassword">
          <div class="form-group">
            <label for="forgot-email">{{ t('login.email') }}</label>
            <div class="input-group">
              <i class="fas fa-envelope" />
              <input
                id="forgot-email"
                v-model="forgotEmail"
                type="email"
                :placeholder="t('login.emailPlaceholder')"
                required
              />
            </div>
          </div>

          <div v-if="error" class="error-message">
            <i class="fas fa-exclamation-circle" />
            {{ error }}
          </div>

          <div v-if="forgotSuccess" class="success-message">
            <i class="fas fa-check-circle" />
            {{ t('login.resetSuccess') }}
          </div>

          <div class="form-actions">
            <button 
              type="button"
              class="back-button"
              @click="toggleForgotPassword"
            >
              <i class="fas fa-arrow-left" />
              {{ t('common.back') }}
            </button>

            <button 
              type="submit"
              class="reset-button"
              :disabled="loading"
            >
              <i v-if="loading" class="fas fa-spinner fa-spin" />
              <span v-else>{{ t('login.sendReset') }}</span>
            </button>
          </div>
        </form>
      </div>

      <div class="login-footer">
        <p>{{ t('login.copyright', { year: new Date().getFullYear() }) }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-gradient);
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 2rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  width: 120px;
  height: auto;
  margin-bottom: 1.5rem;
}

.login-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--text-secondary);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group i {
  position: absolute;
  left: 1rem;
  color: var(--text-secondary);
}

.input-group input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  transition: all 0.2s;
}

.input-group input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-light);
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.forgot-password {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 0;
}

.login-button,
.reset-button {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-blue);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.login-button:hover,
.reset-button:hover {
  background: var(--secondary-blue);
}

.login-button:disabled,
.reset-button:disabled {
  background: var(--primary-light);
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--error-light);
  color: var(--error);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--success-light);
  color: var(--success);
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.forgot-password-form h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.forgot-password-form p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.back-button {
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.back-button:hover {
  background: var(--bg-hover);
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

@media (width <= 480px) {
  .login-view {
    padding: 1rem;
  }

  .login-container {
    padding: 1.5rem;
  }

  .form-options {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
