<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">
          <i class="fas fa-user-plus"></i>
        </div>
        <h1 class="auth-title">Créer un compte</h1>
        <p class="auth-subtitle">Rejoignez TechCMS et accédez à nos services</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-row">
          <div class="form-group" :class="{ error: errors.firstname, valid: !errors.firstname && form.firstname }">
            <label for="firstname" class="form-label">
              <i class="fas fa-user"></i>
              Prénom
            </label>
            <input
              id="firstname"
              v-model="form.firstname"
              type="text"
              class="form-input"
              :class="{ error: errors.firstname }"
              placeholder="Votre prénom"
              required
              autocomplete="given-name"
              @blur="validateFirstname"
              @input="clearError('firstname')"
            />
            <div v-if="errors.firstname" class="form-error">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.firstname }}
            </div>
          </div>

          <div class="form-group" :class="{ error: errors.lastname, valid: !errors.lastname && form.lastname }">
            <label for="lastname" class="form-label">
              <i class="fas fa-user"></i>
              Nom
            </label>
            <input
              id="lastname"
              v-model="form.lastname"
              type="text"
              class="form-input"
              :class="{ error: errors.lastname }"
              placeholder="Votre nom"
              required
              autocomplete="family-name"
              @blur="validateLastname"
              @input="clearError('lastname')"
            />
            <div v-if="errors.lastname" class="form-error">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.lastname }}
            </div>
          </div>
        </div>

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

        <div class="form-row">
          <div class="form-group" :class="{ error: errors.phone, valid: !errors.phone && form.phone }">
            <label for="phone" class="form-label">
              <i class="fas fa-phone"></i>
              Téléphone
            </label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="form-input"
              :class="{ error: errors.phone }"
              placeholder="+33 1 23 45 67 89"
              required
              autocomplete="tel"
              @blur="validatePhone"
              @input="clearError('phone')"
            />
            <div v-if="errors.phone" class="form-error">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.phone }}
            </div>
          </div>

          <div class="form-group" :class="{ error: errors.company }">
            <label for="company" class="form-label">
              <i class="fas fa-building"></i>
              Entreprise (optionnel)
            </label>
            <input
              id="company"
              v-model="form.company"
              type="text"
              class="form-input"
              placeholder="Nom de votre entreprise"
              autocomplete="organization"
            />
          </div>
        </div>

        <div class="form-group" :class="{ error: errors.address, valid: !errors.address && form.address }">
          <label for="address" class="form-label">
            <i class="fas fa-map-marker-alt"></i>
            Adresse
          </label>
          <input
            id="address"
            v-model="form.address"
            type="text"
            class="form-input"
            :class="{ error: errors.address }"
            placeholder="123 Rue de la Paix"
            required
            autocomplete="street-address"
            @blur="validateAddress"
            @input="clearError('address')"
          />
          <div v-if="errors.address" class="form-error">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.address }}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" :class="{ error: errors.postal_code, valid: !errors.postal_code && form.postal_code }">
            <label for="postal_code" class="form-label">
              <i class="fas fa-mail-bulk"></i>
              Code postal
            </label>
            <input
              id="postal_code"
              v-model="form.postal_code"
              type="text"
              class="form-input"
              :class="{ error: errors.postal_code }"
              placeholder="75001"
              required
              autocomplete="postal-code"
              @blur="validatePostalCode"
              @input="clearError('postal_code')"
            />
            <div v-if="errors.postal_code" class="form-error">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.postal_code }}
            </div>
          </div>

          <div class="form-group" :class="{ error: errors.city, valid: !errors.city && form.city }">
            <label for="city" class="form-label">
              <i class="fas fa-city"></i>
              Ville
            </label>
            <input
              id="city"
              v-model="form.city"
              type="text"
              class="form-input"
              :class="{ error: errors.city }"
              placeholder="Paris"
              required
              autocomplete="address-level2"
              @blur="validateCity"
              @input="clearError('city')"
            />
            <div v-if="errors.city" class="form-error">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.city }}
            </div>
          </div>
        </div>

        <div class="form-group" :class="{ error: errors.country, valid: !errors.country && form.country }">
          <label for="country" class="form-label">
            <i class="fas fa-globe"></i>
            Pays
          </label>
          <select
            id="country"
            v-model="form.country"
            class="form-input"
            :class="{ error: errors.country }"
            required
            autocomplete="country"
            @blur="validateCountry"
            @change="clearError('country')"
          >
            <option value="">Sélectionnez un pays</option>
            <option value="FR">France</option>
            <option value="BE">Belgique</option>
            <option value="CH">Suisse</option>
            <option value="CA">Canada</option>
            <option value="US">États-Unis</option>
            <option value="GB">Royaume-Uni</option>
            <option value="DE">Allemagne</option>
            <option value="ES">Espagne</option>
            <option value="IT">Italie</option>
            <option value="NL">Pays-Bas</option>
          </select>
          <div v-if="errors.country" class="form-error">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.country }}
          </div>
        </div>

        <div class="form-row">
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
              placeholder="Choisissez un mot de passe sécurisé"
              required
              autocomplete="new-password"
              @blur="validatePassword"
              @input="clearError('password')"
            />
            <div v-if="errors.password" class="form-error">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.password }}
            </div>
          </div>

          <div class="form-group" :class="{ error: errors.passwordConfirmation, valid: !errors.passwordConfirmation && form.passwordConfirmation }">
            <label for="passwordConfirmation" class="form-label">
              <i class="fas fa-lock"></i>
              Confirmer le mot de passe
            </label>
            <input
              id="passwordConfirmation"
              v-model="form.passwordConfirmation"
              type="password"
              class="form-input"
              :class="{ error: errors.passwordConfirmation }"
              placeholder="Confirmez votre mot de passe"
              required
              autocomplete="new-password"
              @blur="validatePasswordConfirmation"
              @input="clearError('passwordConfirmation')"
            />
            <div v-if="errors.passwordConfirmation" class="form-error">
              <i class="fas fa-exclamation-circle"></i>
              {{ errors.passwordConfirmation }}
            </div>
          </div>
        </div>

        <div class="form-group" :class="{ error: errors.terms }">
          <label class="remember-me">
            <input v-model="form.acceptTerms" type="checkbox" required />
            J'accepte les 
            <a href="/terms" target="_blank" class="auth-link">conditions d'utilisation</a>
            et la 
            <a href="/privacy" target="_blank" class="auth-link">politique de confidentialité</a>
          </label>
          <div v-if="errors.terms" class="form-error">
            <i class="fas fa-exclamation-circle"></i>
            {{ errors.terms }}
          </div>
        </div>

        <div v-if="errors.general" class="form-error">
          <i class="fas fa-exclamation-triangle"></i>
          {{ errors.general }}
        </div>

        <div v-if="successMessage" class="form-success">
          <i class="fas fa-check-circle"></i>
          {{ successMessage }}
        </div>

        <button
          type="submit"
          class="auth-button"
          :class="{ loading: loading }"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Création...' : 'Créer mon compte' }}
        </button>
      </form>

      <div class="auth-links">
        <p>
          Déjà un compte ?
          <router-link to="/auth/login" class="auth-link">
            Se connecter
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import logger from '@/services/logger'

// Composables
const router = useRouter()
const authStore = useAuthStore()

// État réactif
const loading = ref(false)
const successMessage = ref('')

const form = ref({
  firstname: '',
  lastname: '',
  email: '',
  company: '',
  phone: '',
  address: '',
  postal_code: '',
  city: '',
  country: '',
  password: '',
  passwordConfirmation: '',
  acceptTerms: false
})

const errors = ref({
  firstname: '',
  lastname: '',
  email: '',
  company: '',
  phone: '',
  address: '',
  postal_code: '',
  city: '',
  country: '',
  password: '',
  passwordConfirmation: '',
  terms: '',
  general: ''
})

// Computed
const isFormValid = computed(() => {
  return form.value.firstname &&
         form.value.lastname &&
         form.value.email &&
         form.value.phone &&
         form.value.address &&
         form.value.postal_code &&
         form.value.city &&
         form.value.country &&
         form.value.password &&
         form.value.passwordConfirmation &&
         form.value.acceptTerms &&
         !Object.values(errors.value).some(error => error !== '')
})

// Méthodes de validation
const validateFirstname = () => {
  if (!form.value.firstname.trim()) {
    errors.value.firstname = 'Le prénom est requis'
  } else if (form.value.firstname.trim().length < 2) {
    errors.value.firstname = 'Le prénom doit contenir au moins 2 caractères'
  } else {
    errors.value.firstname = ''
  }
}

const validateLastname = () => {
  if (!form.value.lastname.trim()) {
    errors.value.lastname = 'Le nom est requis'
  } else if (form.value.lastname.trim().length < 2) {
    errors.value.lastname = 'Le nom doit contenir au moins 2 caractères'
  } else {
    errors.value.lastname = ''
  }
}

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

const validatePhone = () => {
  if (!form.value.phone.trim()) {
    errors.value.phone = 'Le numéro de téléphone est requis'
  } else {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/
    if (!phoneRegex.test(form.value.phone)) {
      errors.value.phone = 'Format de téléphone invalide'
    } else {
      errors.value.phone = ''
    }
  }
}

const validateAddress = () => {
  if (!form.value.address.trim()) {
    errors.value.address = 'L\'adresse est requise'
  } else if (form.value.address.trim().length < 5) {
    errors.value.address = 'L\'adresse doit contenir au moins 5 caractères'
  } else {
    errors.value.address = ''
  }
}

const validatePostalCode = () => {
  if (!form.value.postal_code.trim()) {
    errors.value.postal_code = 'Le code postal est requis'
  } else if (!/^[0-9]{5}$/.test(form.value.postal_code.trim())) {
    errors.value.postal_code = 'Le code postal doit contenir 5 chiffres'
  } else {
    errors.value.postal_code = ''
  }
}

const validateCity = () => {
  if (!form.value.city.trim()) {
    errors.value.city = 'La ville est requise'
  } else if (form.value.city.trim().length < 2) {
    errors.value.city = 'La ville doit contenir au moins 2 caractères'
  } else {
    errors.value.city = ''
  }
}

const validateCountry = () => {
  if (!form.value.country) {
    errors.value.country = 'Le pays est requis'
  } else {
    errors.value.country = ''
  }
}

const validatePassword = () => {
  if (!form.value.password) {
    errors.value.password = 'Le mot de passe est requis'
  } else if (form.value.password.length < 8) {
    errors.value.password = 'Le mot de passe doit contenir au moins 8 caractères'
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.value.password)) {
    errors.value.password = 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
  } else {
    errors.value.password = ''
  }
  
  // Re-valider la confirmation si elle existe
  if (form.value.passwordConfirmation) {
    validatePasswordConfirmation()
  }
}

const validatePasswordConfirmation = () => {
  if (!form.value.passwordConfirmation) {
    errors.value.passwordConfirmation = 'La confirmation du mot de passe est requise'
  } else if (form.value.password !== form.value.passwordConfirmation) {
    errors.value.passwordConfirmation = 'Les mots de passe ne correspondent pas'
  } else {
    errors.value.passwordConfirmation = ''
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

// Gestion de l'inscription
const handleRegister = async () => {
  // Validation complète
  validateFirstname()
  validateLastname()
  validateEmail()
  validatePhone()
  validateAddress()
  validatePostalCode()
  validateCity()
  validateCountry()
  validatePassword()
  validatePasswordConfirmation()
  
  if (!form.value.acceptTerms) {
    errors.value.terms = 'Vous devez accepter les conditions d\'utilisation'
  } else {
    errors.value.terms = ''
  }
  
  if (!isFormValid.value) {
    return
  }

  loading.value = true
  errors.value.general = ''
  successMessage.value = ''

  try {
    logger.info('[AUTH] Début inscription', { email: form.value.email, firstName: form.value.firstName })

    // Appel API d'inscription
    await authStore.register(form.value)

    logger.info('[AUTH] Inscription réussie', { email: form.value.email })
    successMessage.value = 'Compte créé avec succès ! Redirection vers la connexion...'

    // Redirection après succès
    setTimeout(() => {
      router.push('/client/login')
    }, 2000)
    
  } catch (error: any) {
    logger.error('[AUTH] Erreur inscription', { error, email: form.value.email })
    
    // Gestion des erreurs spécifiques
    if (error.response?.status === 409) {
      errors.value.email = 'Cette adresse email est déjà utilisée'
    } else if (error.response?.status >= 500) {
      errors.value.general = 'Erreur serveur. Veuillez réessayer plus tard.'
    } else {
      errors.value.general = error.message || 'Une erreur est survenue lors de l\'inscription'
    }
  } finally {
    loading.value = false
  }
}
</script>
