<template>
  <div id="clientForm" class="view-container">
    <!-- En-tête -->
    <div class="header-box">
      <div>
        <h1 class="page-title">
          {{ isEditMode ? t('clients.edit.title') : t('clients.add.title') }}
        </h1>
        <span class="page-description">
          {{ isEditMode ? t('clients.edit.description') : t('clients.add.description') }}
        </span>
      </div>
      <div class="action-buttons">
        <button class="btn btn-outline" @click="goToClients">
          <i class="fas fa-arrow-left"></i>
          {{ t('common.back') }}
        </button>
      </div>
    </div>

    <!-- Formulaire -->
    <div class="form-container box">
      <form @submit.prevent="handleSubmit">
        <div class="form-section">
          <h2 class="section-title">{{ t('clients.form.personal_info') }}</h2>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="firstname" class="form-label">{{ t('clients.form.firstname') }}</label>
              <input 
                id="firstname" 
                v-model="form.firstname" 
                type="text" 
                class="form-control" 
                :placeholder="t('clients.form.firstname_placeholder')"
                required
              >
              <div v-if="errors.firstname" class="form-error">{{ errors.firstname }}</div>
            </div>
            
            <div class="form-group">
              <label for="lastname" class="form-label">{{ t('clients.form.lastname') }}</label>
              <input 
                id="lastname" 
                v-model="form.lastname" 
                type="text" 
                class="form-control" 
                :placeholder="t('clients.form.lastname_placeholder')"
                required
              >
              <div v-if="errors.lastname" class="form-error">{{ errors.lastname }}</div>
            </div>
            
            <div class="form-group">
              <label for="email" class="form-label">{{ t('clients.form.email') }}</label>
              <input 
                id="email" 
                v-model="form.email" 
                type="email" 
                class="form-control" 
                :placeholder="t('clients.form.email_placeholder')"
                required
              >
              <div v-if="errors.email" class="form-error">{{ errors.email }}</div>
            </div>
            
            <div class="form-group">
              <label for="phone" class="form-label">{{ t('clients.form.phone') }}</label>
              <input 
                id="phone" 
                v-model="form.phone" 
                type="tel" 
                class="form-control" 
                :placeholder="t('clients.form.phone_placeholder')"
              >
              <div v-if="errors.phone" class="form-error">{{ errors.phone }}</div>
            </div>
            
            <div class="form-group">
              <label for="company" class="form-label">{{ t('clients.form.company') }}</label>
              <input 
                id="company" 
                v-model="form.company" 
                type="text" 
                class="form-control" 
                :placeholder="t('clients.form.company_placeholder')"
              >
              <div v-if="errors.company" class="form-error">{{ errors.company }}</div>
            </div>
            
            <div class="form-group">
              <label for="status" class="form-label">{{ t('clients.form.status') }}</label>
              <select id="status" v-model="form.status" class="form-control">
                <option value="active">{{ t('clients.status.active') }}</option>
                <option value="inactive">{{ t('clients.status.inactive') }}</option>
                <option value="pending">{{ t('clients.status.pending') }}</option>
              </select>
              <div v-if="errors.status" class="form-error">{{ errors.status }}</div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h2 class="section-title">{{ t('clients.form.password') }}</h2>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="password" class="form-label">
                {{ t('clients.form.password') }}
                <span v-if="isEditMode" class="optional-text">{{ t('clients.form.password_optional') }}</span>
              </label>
              <input 
                id="password" 
                v-model="form.password" 
                type="password" 
                class="form-control" 
                :placeholder="t('clients.form.password_placeholder')"
                :required="!isEditMode"
              >
              <div v-if="errors.password" class="form-error">{{ errors.password }}</div>
              <small v-if="isEditMode" class="form-text text-muted">
                {{ t('clients.form.password_leave_empty') }}
              </small>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h2 class="section-title">{{ t('clients.form.address_title') }}</h2>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="address" class="form-label">{{ t('clients.form.address') }}</label>
              <input 
                id="address" 
                v-model="form.address" 
                type="text" 
                class="form-control" 
                :placeholder="t('clients.form.address_placeholder')"
              >
              <div v-if="errors.address" class="form-error">{{ errors.address }}</div>
            </div>
            
            <div class="form-group">
              <label for="postal_code" class="form-label">{{ t('clients.form.postal_code') }}</label>
              <input 
                id="postal_code" 
                v-model="form.postal_code" 
                type="text" 
                class="form-control" 
                :placeholder="t('clients.form.postal_code_placeholder')"
              >
              <div v-if="errors.postal_code" class="form-error">{{ errors.postal_code }}</div>
            </div>
            
            <div class="form-group">
              <label for="city" class="form-label">{{ t('clients.form.city') }}</label>
              <input 
                id="city" 
                v-model="form.city" 
                type="text" 
                class="form-control" 
                :placeholder="t('clients.form.city_placeholder')"
              >
              <div v-if="errors.city" class="form-error">{{ errors.city }}</div>
            </div>
            
            <div class="form-group">
              <label for="country" class="form-label">{{ t('clients.form.country') }}</label>
              <input 
                id="country" 
                v-model="form.country" 
                type="text" 
                class="form-control" 
                :placeholder="t('clients.form.country_placeholder')"
              >
              <div v-if="errors.country" class="form-error">{{ errors.country }}</div>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="goToClients">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            <span v-if="isSubmitting">
              <span class="spinner-border spinner-border-sm mr-2"></span>
              {{ t('common.saving') }}
            </span>
            <span v-else>
              {{ isEditMode ? t('common.save') : t('common.create') }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useClientsStore } from '@/stores/clients'
import logger from '@/services/logger'

// Route et router
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// Stores
const clientsStore = useClientsStore()

// État
const form = ref({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  phone: '',
  company: '',
  address: '',
  postal_code: '',
  city: '',
  country: '',
  status: 'active'
})

const errors = ref({
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  phone: '',
  company: '',
  address: '',
  postal_code: '',
  city: '',
  country: '',
  status: ''
})

const isSubmitting = ref(false)
const clientId = computed(() => route.params.id ? parseInt(route.params.id as string) : null)
const isEditMode = computed(() => !!clientId.value)

// Méthodes
const fetchClient = async () => {
  if (!isEditMode.value || clientId.value === null) return
  
  try {
    // S'assurer que la liste des clients est chargée
    if (clientsStore.clients.length === 0) {
      logger.debug('Chargement de la liste des clients...')
      await clientsStore.fetchClients()
    }
    
    logger.debug('Récupération du client', { clientId: clientId.value })
    const id = clientId.value as number;
    const client = await clientsStore.getClient(id)
    logger.debug('Client récupéré', { client })
    
    if (client) {
      logger.debug('Préremplissage du formulaire avec les données du client')
      // Remplir le formulaire avec les données du client
      form.value = {
        ...form.value,
        firstname: client.firstname || '',
        lastname: client.lastname || '',
        email: client.email || '',
        password: '', // On ne récupère jamais le mot de passe
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || '',
        postal_code: client.postal_code || '',
        city: client.city || '',
        country: client.country || '',
        status: client.status || 'active'
      }
      logger.debug('Formulaire mis à jour', { form: form.value })
    } else {
      logger.warn('Aucun client retourné par getClient')
      
      // Essayons d'obtenir le client depuis le store s'il existe déjà
      const existingClient = clientsStore.clients.find(c => c.id === clientId.value)
      if (existingClient) {
        logger.debug('Client trouvé dans le store', { existingClient })
        form.value = {
          ...form.value,
          firstname: existingClient.firstname || '',
          lastname: existingClient.lastname || '',
          email: existingClient.email || '',
          password: '',
          phone: existingClient.phone || '',
          company: existingClient.company || '',
          address: existingClient.address || '',
          postal_code: existingClient.postal_code || '',
          city: existingClient.city || '',
          country: existingClient.country || '',
          status: existingClient.status || 'active'
        }
      }
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération du client', { error })
  }
}

const validateForm = () => {
  let isValid = true
  errors.value = {
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    address: '',
    postal_code: '',
    city: '',
    country: '',
    status: ''
  }
  
  // Validation du prénom
  if (!form.value.firstname) {
    errors.value.firstname = t('clients.validation.firstname_required')
    isValid = false
  }
  
  // Validation du nom
  if (!form.value.lastname) {
    errors.value.lastname = t('clients.validation.lastname_required')
    isValid = false
  }
  
  // Validation de l'email
  if (!form.value.email) {
    errors.value.email = t('clients.validation.email_required')
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = t('clients.validation.email_invalid')
    isValid = false
  }
  
  // Validation du mot de passe (seulement en mode création)
  if (!isEditMode.value && !form.value.password) {
    errors.value.password = t('clients.validation.password_required')
    isValid = false
  }
  
  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    if (isEditMode.value && clientId.value !== null) {
      // Mode édition
      await clientsStore.updateClient(clientId.value, form.value)
      router.push({ name: 'client-details', params: { id: clientId.value.toString() } })
    } else {
      // Mode création
      const newClient = await clientsStore.createClient(form.value)
      logger.debug('Nouveau client créé', { newClient })
      
      if (newClient && newClient.id) {
        logger.debug('Redirection vers la page de détails du client', { clientId: newClient.id })
        router.push({ name: 'client-details', params: { id: newClient.id.toString() } })
      } else {
        logger.error('Impossible de rediriger: ID du client non disponible', { newClient })
        // Rediriger vers la liste des clients si l'ID n'est pas disponible
        router.push({ name: 'clients' })
      }
    }
  } catch (error) {
    logger.error('Erreur lors de la soumission du formulaire', { error })
    // Note: Les messages d'erreur dans la console restent en français pour le debug
  } finally {
    isSubmitting.value = false
  }
}

const goToClients = () => {
  router.push({ name: 'clients' })
}

// Cycle de vie
onMounted(fetchClient)
</script>

<style scoped>
/* Utiliser les styles existants du fichier CSS commun */
@import '@/assets/css/components/common-layout.css';

.form-container {
  padding: 1.5rem;
  margin-top: 1rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgb(var(--primary-color-rgb), 0.25);
}

.form-text {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-error {
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.optional-text {
  font-size: 0.75rem;
  font-weight: normal;
  color: var(--text-muted);
  margin-left: 0.5rem;
}
</style> 