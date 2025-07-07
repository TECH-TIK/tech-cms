<template>
  <div class="view-container license-invalid-container">
    <div class="header-box">
      <h1 class="page-title">Licence Invalide</h1>
      <p class="page-description">
        Votre licence TechCMS est invalide ou a expiré. Veuillez entrer une clé de licence valide pour continuer.
      </p>
    </div>

    <div class="alert-box alert-warning">
      <i class="fas fa-exclamation-triangle"></i>
      <div>
        <h3>Attention</h3>
        <p>L'accès au panneau d'administration est limité jusqu'à ce qu'une licence valide soit fournie.</p>
      </div>
    </div>

    <div class="license-form-container">
      <div class="license-form">
        <h3>Activer votre licence</h3>
        
        <div class="license-format-hint">
          <i class="fas fa-info-circle"></i>
          <span>Format: XXXX-XXXX-XXXX-XXXX</span>
        </div>
        
        <form @submit.prevent="updateLicense">
          <div class="form-group">
            <label for="licenseKey">Clé de Licence</label>
            <input 
              id="licenseKey" 
              v-model="licenseKey" 
              type="text" 
              placeholder="Entrez votre clé de licence" 
              class="form-control"
              required
            />
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div v-if="success" class="success-message">
            <i class="fas fa-check-circle"></i>
            {{ success }}
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <i v-if="loading" class="fas fa-spinner fa-spin"></i>
              {{ loading ? 'Activation...' : 'Activer la licence' }}
            </button>
          </div>
        </form>
      </div>
      
      <div class="license-help">
        <h3>Besoin d'aide ?</h3>
        <p>Si vous avez perdu votre clé de licence ou si vous rencontrez des problèmes, veuillez contacter notre support :</p>
        <a href="mailto:support@tech-cms.com" class="support-link">
          <i class="fas fa-envelope"></i> support@tech-cms.com
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLicenseStore } from '@/stores/license'
import { useRouter } from 'vue-router'

const licenseStore = useLicenseStore()
const router = useRouter()
const licenseKey = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const updateLicense = async () => {
  if (!licenseKey.value) {
    error.value = 'Veuillez entrer une clé de licence'
    return
  }
  
  loading.value = true
  error.value = null
  success.value = null
  
  try {
    const result = await licenseStore.updateLicense(licenseKey.value)
    if (result && result.success) {
      success.value = 'Licence activée avec succès ! Redirection vers le panneau d\'administration...'
      
      // Redirection après un court délai pour montrer le message de succès
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } else {
      error.value = result?.message || 'Erreur lors de la mise à jour de la licence'
    }
  } catch (err: any) {
    error.value = err.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.license-invalid-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
}

.header-box {
  margin-bottom: 2rem;
  text-align: center;
}

.page-title {
  color: #333;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.page-description {
  color: #666;
  font-size: 1.1rem;
}

.alert-box {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  gap: 1rem;
}

.alert-warning {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
}

.alert-box i {
  font-size: 1.5rem;
  color: #ffc107;
}

.alert-box h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #856404;
}

.license-form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.license-form, .license-help {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgb(0 0 0 / 5%);
}

.license-format-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #e9ecef;
  border-radius: 4px;
  font-family: monospace;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgb(0 123 255 / 25%);
}

.error-message {
  color: #dc3545;
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: #f8d7da;
  border-radius: 4px;
}

.success-message {
  color: #28a745;
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: #d4edda;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: fadeIn 0.5s;
}

.form-actions {
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background-color: #0b5ed7;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.license-help {
  margin-top: 1rem;
}

.support-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #0d6efd;
  text-decoration: none;
  margin-top: 0.5rem;
}

.support-link:hover {
  text-decoration: underline;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (width >= 768px) {
  .license-form-container {
    flex-direction: row;
  }
  
  .license-form {
    flex: 2;
  }
  
  .license-help {
    flex: 1;
  }
}
</style>
