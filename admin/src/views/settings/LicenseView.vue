<template>
  <div class="view-container">
    <div class="header-box">
      <h1 class="page-title">Gestion de Licence</h1>
      <p class="page-description">
        Gérez votre licence TechCMS pour accéder à toutes les fonctionnalités et mises à jour.
      </p>
    </div>

    <div class="content-box">
      <div v-if="loading" class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i> Chargement...
      </div>
      
      <div v-else class="license-container">
        <div class="license-status">
          <h3>Statut de la Licence</h3>
          
          <div v-if="licenseInfo" class="status-box">
            <div class="status-badge" :class="licenseInfo.is_valid ? 'status-active' : 'status-inactive'">
              {{ licenseInfo.is_valid ? 'Active' : 'Inactive' }}
            </div>
            
            <div class="license-key">
              <strong>Clé de licence:</strong> {{ licenseInfo.key || 'Non définie' }}
            </div>
          </div>
          
          <div v-else class="status-box">
            <div class="status-badge status-inactive">Non configurée</div>
            <p>Aucune licence n'est actuellement configurée.</p>
          </div>
        </div>
        
        <div class="license-form">
          <h3>Mettre à jour la Licence</h3>
          
          <form @submit.prevent="updateLicense">
            <div class="form-group">
              <label for="licenseKey">Clé de Licence</label>
              <input 
                type="text" 
                id="licenseKey" 
                v-model="licenseKey" 
                placeholder="Entrez votre clé de licence" 
                class="form-control"
                required
              />
            </div>
            
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                {{ loading ? 'Mise à jour...' : 'Mettre à jour la licence' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLicenseStore } from '@/stores/license'

const licenseStore = useLicenseStore()
const licenseKey = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const licenseInfo = ref(licenseStore.licenseInfo)

onMounted(async () => {
  loading.value = true
  try {
    await licenseStore.fetchLicenseInfo()
    licenseInfo.value = licenseStore.licenseInfo
  } catch (err) {
    console.error('Erreur lors du chargement des informations de licence', err)
  } finally {
    loading.value = false
  }
})

const updateLicense = async () => {
  if (!licenseKey.value) {
    error.value = 'Veuillez entrer une clé de licence'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const result = await licenseStore.updateLicense(licenseKey.value)
    if (result && result.success) {
      licenseInfo.value = licenseStore.licenseInfo
      licenseKey.value = ''
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
.license-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.license-status, .license-form {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.status-box {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.status-active {
  background-color: #d1e7dd;
  color: #0f5132;
}

.status-inactive {
  background-color: #f8d7da;
  color: #842029;
}

.license-key {
  font-family: monospace;
  margin-top: 0.5rem;
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
}

.error-message {
  color: #dc3545;
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: #f8d7da;
  border-radius: 4px;
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

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 1.25rem;
  color: #6c757d;
}

@media (min-width: 768px) {
  .license-container {
    flex-direction: row;
  }
  
  .license-status, .license-form {
    flex: 1;
  }
}
</style>
