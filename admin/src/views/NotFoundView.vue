<template>
  <div class="view-container not-found-container">
    <div class="header-box">
      <h1 class="page-title">{{ $t('notFound.title') }}</h1>
      <p class="page-description">
        {{ $t('notFound.description') }}
      </p>
    </div>

    <div class="not-found-content">
      <div class="not-found-illustration">
        <i class="fas fa-search fa-4x"></i>
        <div class="error-code">404</div>
      </div>

      <div class="not-found-message">
        <div class="alert-box alert-info">
          <i class="fas fa-info-circle"></i>
          <div>
            <h3>{{ $t('notFound.whatHappened') }}</h3>
            <p>{{ $t('notFound.urlNotFound') }}</p>
          </div>
        </div>

        <div class="suggestions">
          <h3>{{ $t('notFound.suggestions') }}</h3>
          <ul>
            <li>{{ $t('notFound.checkUrl') }}</li>
            <li>{{ $t('notFound.goBack') }}</li>
            <li>{{ $t('notFound.goToDashboard') }}</li>
          </ul>
        </div>

        <div class="action-buttons">
          <button class="btn btn-secondary" @click="goBack">
            <i class="fas fa-arrow-left"></i> {{ $t('notFound.backButton') }}
          </button>
          <router-link to="/dashboard" class="btn btn-primary">
            <i class="fas fa-home"></i> {{ $t('notFound.dashboardButton') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'


const router = useRouter()


const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
}

.header-box {
  text-align: center;
  margin-bottom: 2rem;
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

.not-found-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.not-found-illustration {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.not-found-illustration i {
  color: #6c757d;
  margin-bottom: 1rem;
}

.error-code {
  font-size: 8rem;
  font-weight: 700;
  color: #f8f9fa;
  text-shadow: 2px 2px 4px rgb(0 0 0 / 10%);
  background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.not-found-message {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.alert-box {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  border-radius: 8px;
  gap: 1rem;
}

.alert-info {
  background-color: #cff4fc;
  border-left: 4px solid #0dcaf0;
}

.alert-box i {
  font-size: 1.5rem;
  color: #0dcaf0;
}

.alert-box h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #055160;
}

.suggestions {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgb(0 0 0 / 5%);
}

.suggestions h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.suggestions ul {
  margin: 0;
  padding-left: 1.5rem;
}

.suggestions li {
  margin-bottom: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-primary {
  background-color: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background-color: #0b5ed7;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5c636a;
}

@media (width >= 768px) {
  .not-found-content {
    flex-direction: row;
  }
  
  .not-found-illustration {
    flex: 1;
  }
  
  .not-found-message {
    flex: 2;
  }
}
</style>
