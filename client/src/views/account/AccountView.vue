<template>
  <div id="client-account">
    <!-- Header Section -->
    <div class="account-header">
      <h1>
        <i class="fas fa-user-cog"></i>
        {{ $t('account.title') }}
      </h1>
      <div class="account-actions">
        <button class="btn btn-outline btn-sm">
          <i class="fas fa-download"></i>
          {{ $t('common.export') }} mes données
        </button>
        <button class="btn btn-primary btn-sm" @click="saveProfile">
          <i class="fas fa-save"></i>
          {{ $t('common.save') }}
        </button>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="success-message">
      <i class="fas fa-check-circle"></i>
      {{ successMessage }}
    </div>
    
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>

    <!-- Account Grid -->
    <div class="account-grid">
      <!-- Profile Information -->
      <div class="account-card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-user"></i>
            {{ $t('account.personal_info') }}
          </h3>
          <button class="btn btn-outline btn-sm" @click="editMode = !editMode">
            <i :class="editMode ? 'fas fa-times' : 'fas fa-edit'"></i>
            {{ editMode ? $t('common.cancel') : $t('common.edit') }}
          </button>
        </div>
        
        <div class="card-body">
          <!-- Profile Avatar -->
          <div class="profile-avatar">
            <div class="avatar-container">
              <div class="avatar-image">
                <i class="fas fa-user"></i>
              </div>
              <div class="avatar-upload" v-if="editMode">
                <i class="fas fa-camera"></i>
              </div>
            </div>
            <div class="profile-info">
              <h3>{{ profile.firstName }} {{ profile.lastName }}</h3>
              <p>{{ $t('account.member_since') }} {{ formatDate(profile.createdAt) }}</p>
            </div>
          </div>

          <!-- Profile Form -->
          <form @submit.prevent="saveProfile">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Prénom</label>
                <input 
                  v-model="profile.firstName" 
                  type="text" 
                  class="form-input"
                  :disabled="!editMode"
                  required
                >
              </div>
              <div class="form-group">
                <label class="form-label">Nom</label>
                <input 
                  v-model="profile.lastName" 
                  type="text" 
                  class="form-input"
                  :disabled="!editMode"
                  required
                >
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Email</label>
              <input 
                v-model="profile.email" 
                type="email" 
                class="form-input"
                :disabled="!editMode"
                required
              >
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Téléphone</label>
                <input 
                  v-model="profile.phone" 
                  type="tel" 
                  class="form-input"
                  :disabled="!editMode"
                >
              </div>
              <div class="form-group">
                <label class="form-label">Société</label>
                <input 
                  v-model="profile.company" 
                  type="text" 
                  class="form-input"
                  :disabled="!editMode"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Adresse</label>
              <input 
                v-model="profile.address" 
                type="text" 
                class="form-input"
                :disabled="!editMode"
              >
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Ville</label>
                <input 
                  v-model="profile.city" 
                  type="text" 
                  class="form-input"
                  :disabled="!editMode"
                >
              </div>
              <div class="form-group">
                <label class="form-label">Code Postal</label>
                <input 
                  v-model="profile.zipCode" 
                  type="text" 
                  class="form-input"
                  :disabled="!editMode"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Pays</label>
              <select
                v-model="profile.country"
                class="form-select"
                :disabled="!editMode"
              >
                <option value="">Sélectionnez un pays</option>
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Suisse">Suisse</option>
                <option value="Canada">Canada</option>
                <option value="États-Unis">États-Unis</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Monaco">Monaco</option>
              </select>
            </div>

            <div v-if="editMode" class="form-actions">
              <button type="button" class="btn btn-outline" @click="cancelEdit">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="account-card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-shield-alt"></i>
            Sécurité
          </h3>
        </div>
        
        <div class="card-body">
          <div class="security-item">
            <div class="security-info">
              <div class="security-icon">
                <i class="fas fa-key"></i>
              </div>
              <div class="security-details">
                <h4>Mot de passe</h4>
                <p>Dernière modification il y a 3 mois</p>
              </div>
            </div>
            <div class="security-status">
              <div class="status-indicator status-warning"></div>
              <button class="btn btn-outline btn-sm" @click="showPasswordModal = true">
                Modifier
              </button>
            </div>
          </div>
          
          <div class="security-item">
            <div class="security-info">
              <div class="security-icon">
                <i class="fas fa-mobile-alt"></i>
              </div>
              <div class="security-details">
                <h4>Authentification à deux facteurs</h4>
                <p>Protection supplémentaire de votre compte</p>
              </div>
            </div>
            <div class="security-status">
              <div class="status-indicator status-inactive"></div>
              <button class="btn btn-primary btn-sm">
                Activer
              </button>
            </div>
          </div>
          
          <div class="security-item">
            <div class="security-info">
              <div class="security-icon">
                <i class="fas fa-history"></i>
              </div>
              <div class="security-details">
                <h4>Historique de connexion</h4>
                <p>Dernière connexion: Aujourd'hui à 14:30</p>
              </div>
            </div>
            <div class="security-status">
              <div class="status-indicator status-active"></div>
              <button class="btn btn-outline btn-sm">
                Voir l'historique
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications Settings -->
    <div class="account-card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fas fa-bell"></i>
          Préférences de Notification
        </h3>
      </div>
      
      <div class="card-body">
        <div class="notification-item">
          <div class="notification-info">
            <div class="notification-title">Notifications par email</div>
            <div class="notification-description">Recevoir les notifications importantes par email</div>
          </div>
          <div class="toggle-switch" :class="{ active: notifications.email }" @click="toggleNotification('email')">
          </div>
        </div>
        
        <div class="notification-item">
          <div class="notification-info">
            <div class="notification-title">Alertes de facturation</div>
            <div class="notification-description">Être notifié des nouvelles factures et échéances</div>
          </div>
          <div class="toggle-switch" :class="{ active: notifications.billing }" @click="toggleNotification('billing')">
          </div>
        </div>
        
        <div class="notification-item">
          <div class="notification-info">
            <div class="notification-title">Mises à jour de services</div>
            <div class="notification-description">Recevoir les informations sur vos services</div>
          </div>
          <div class="toggle-switch" :class="{ active: notifications.services }" @click="toggleNotification('services')">
          </div>
        </div>
        
        <div class="notification-item">
          <div class="notification-info">
            <div class="notification-title">Newsletter marketing</div>
            <div class="notification-description">Recevoir nos offres et actualités</div>
          </div>
          <div class="toggle-switch" :class="{ active: notifications.marketing }" @click="toggleNotification('marketing')">
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="account-card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fas fa-exclamation-triangle"></i>
          Zone de Danger
        </h3>
      </div>
      
      <div class="card-body">
        <p style="color: var(--text-muted); margin-bottom: 1rem;">
          Ces actions sont irréversibles. Procédez avec prudence.
        </p>
        
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" @click="exportData">
            <i class="fas fa-download"></i>
            Exporter toutes mes données
          </button>
          <button class="btn btn-danger btn-sm">
            <i class="fas fa-user-times"></i>
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de changement de mot de passe -->
    <div v-if="showPasswordModal" class="modal show" @click="showPasswordModal = false">
      <div class="modal-backdrop"></div>
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-key"></i>
            Changer le mot de passe
          </h3>
          <button class="modal-close" @click="showPasswordModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label for="current_password">Mot de passe actuel</label>
              <input
                id="current_password"
                v-model="passwordForm.current_password"
                type="password"
                class="form-input"
                required
                autocomplete="current-password"
              />
            </div>

            <div class="form-group">
              <label for="new_password">Nouveau mot de passe</label>
              <input
                id="new_password"
                v-model="passwordForm.new_password"
                type="password"
                class="form-input"
                required
                minlength="8"
                autocomplete="new-password"
              />
              <small class="form-help">Minimum 8 caractères</small>
            </div>

            <div class="form-group">
              <label for="confirm_password">Confirmer le nouveau mot de passe</label>
              <input
                id="confirm_password"
                v-model="passwordForm.confirm_password"
                type="password"
                class="form-input"
                required
                autocomplete="new-password"
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-outline" @click="showPasswordModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{ saving ? 'Sauvegarde...' : 'Changer le mot de passe' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ApiService } from '@/services/api'
import type { Client, ClientProfileForm, PasswordChangeForm } from '@/types/api'
import { formatDateLong } from '@/utils/dateUtils'

// Types locaux
interface Profile {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  address: string
  city: string
  zipCode: string
  country: string
  createdAt: string
}

interface Notifications {
  email: boolean
  billing: boolean
  services: boolean
  marketing: boolean
}

// État
const loading = ref(true)
const editMode = ref(false)
const saving = ref(false)
const showPasswordModal = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Données de changement de mot de passe
const passwordForm = ref<PasswordChangeForm>({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// États des modals déjà déclarés plus haut

const profile = reactive<Profile>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  zipCode: '',
  country: '',
  createdAt: ''
})

const originalProfile = ref<Profile>({ ...profile })

// Fonctions pour charger les données
const loadProfile = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const response = await ApiService.routes.client.profile.get()
    const clientData: Client = response.data

    // Mapper les données du client vers le profil local
    profile.firstName = clientData.firstname
    profile.lastName = clientData.lastname
    profile.email = clientData.email
    profile.phone = clientData.phone || ''
    profile.company = clientData.company || ''
    profile.address = clientData.address || ''
    profile.city = clientData.city || ''
    profile.zipCode = clientData.postal_code || ''
    profile.country = convertCountryCode(clientData.country || '')
    profile.createdAt = clientData.created_at

    // Sauvegarder l'original
    originalProfile.value = { ...profile }

    console.log('[ACCOUNT] Profil chargé:', profile)
  } catch (err: any) {
    console.error('[ACCOUNT] Erreur lors du chargement du profil:', err)
    errorMessage.value = err.response?.data?.message || 'Erreur lors du chargement du profil'
  } finally {
    loading.value = false
  }
}

const notifications = reactive<Notifications>({
  email: true,
  billing: true,
  services: true,
  marketing: false
})

// Méthodes
const formatDate = formatDateLong

// Conversion des codes pays vers noms complets
const convertCountryCode = (countryValue: string): string => {
  const countryMap: Record<string, string> = {
    'FR': 'France',
    'BE': 'Belgique',
    'CH': 'Suisse',
    'CA': 'Canada',
    'US': 'États-Unis',
    'LU': 'Luxembourg',
    'MC': 'Monaco'
  }

  // Si c'est un code pays, le convertir
  if (countryMap[countryValue]) {
    return countryMap[countryValue]
  }

  // Sinon retourner la valeur telle quelle
  return countryValue
}

const saveProfile = async () => {
  if (!editMode.value) return

  saving.value = true
  errorMessage.value = ''

  try {
    // Mapper les données du profil local vers le format API
    const profileData: ClientProfileForm = {
      firstname: profile.firstName,
      lastname: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      company: profile.company,
      address: profile.address,
      city: profile.city,
      postal_code: profile.zipCode,
      country: profile.country
    }

    console.log('[ACCOUNT] Sauvegarde du profil:', profileData)

    await ApiService.routes.client.profile.update(profileData)

    // Sauvegarder les nouvelles données
    originalProfile.value = { ...profile }
    editMode.value = false

    successMessage.value = 'Profil mis à jour avec succès !'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

  } catch (err: any) {
    console.error('[ACCOUNT] Erreur lors de la sauvegarde:', err)
    errorMessage.value = err.response?.data?.message || 'Erreur lors de la sauvegarde. Veuillez réessayer.'
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  } finally {
    saving.value = false
  }
}

const cancelEdit = () => {
  // Restaurer les données originales
  Object.assign(profile, originalProfile.value)
  editMode.value = false
  errorMessage.value = ''
}

const changePassword = async () => {
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    errorMessage.value = 'Les mots de passe ne correspondent pas'
    return
  }

  if (passwordForm.value.new_password.length < 8) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 8 caractères'
    return
  }

  saving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    console.log('[ACCOUNT] Changement de mot de passe')

    await ApiService.routes.client.profile.changePassword({
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password
    })

    successMessage.value = 'Mot de passe changé avec succès'
    showPasswordModal.value = false

    // Réinitialiser le formulaire
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }

    // Masquer le message après 3 secondes
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

  } catch (err: any) {
    console.error('[ACCOUNT] Erreur lors du changement de mot de passe:', err)
    errorMessage.value = err.response?.data?.message || 'Erreur lors du changement de mot de passe'
  } finally {
    saving.value = false
  }
}

const toggleNotification = (type: keyof Notifications) => {
  notifications[type] = !notifications[type]

  // Simuler la sauvegarde automatique
  successMessage.value = 'Préférences de notification mises à jour'
  setTimeout(() => {
    successMessage.value = ''
  }, 2000)
}

const exportData = () => {
  // Export des données du profil
  const data = JSON.stringify(profile, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mon-profil.json'
  a.click()
  URL.revokeObjectURL(url)
}

// Chargement des données
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
@import '@/assets/css/pages/account.css';
</style>
