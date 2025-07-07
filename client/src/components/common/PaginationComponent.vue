<template>
  <div v-if="totalPages > 1" class="pagination-container">
    <div class="pagination-info">
      <span class="page-indicator">
        Page {{ currentPage }} sur {{ totalPages }}
      </span>
      <span class="total-items">
        {{ total }} {{ total > 1 ? 'éléments' : 'élément' }} au total
      </span>
    </div>
    
    <div class="pagination-controls">
      <button 
        class="btn btn-outline btn-sm pagination-btn"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        <i class="fas fa-chevron-left"></i>
        Précédent
      </button>
      
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="['btn', 'btn-sm', 'page-btn', { 'btn-primary': page === currentPage, 'btn-outline': page !== currentPage }]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>
      
      <button 
        class="btn btn-outline btn-sm pagination-btn"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
      >
        Suivant
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface PaginationProps {
  currentPage: number
  totalPages: number
  total: number
  perPage?: number
}

const props = withDefaults(defineProps<PaginationProps>(), {
  perPage: 7
})

// Emits
const emit = defineEmits<{
  pageChange: [page: number]
}>()

// Computed
const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  
  if (props.totalPages <= maxVisible) {
    // Afficher toutes les pages si peu de pages
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Logique pour afficher les pages autour de la page courante
    let start = Math.max(1, props.currentPage - 2)
    let end = Math.min(props.totalPages, props.currentPage + 2)
    
    // Ajuster si on est près du début ou de la fin
    if (props.currentPage <= 3) {
      end = Math.min(props.totalPages, 5)
    }
    if (props.currentPage >= props.totalPages - 2) {
      start = Math.max(1, props.totalPages - 4)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }
  
  return pages
})

// Methods
const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('pageChange', page)
  }
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.pagination-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}

.page-indicator {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.total-items {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
  justify-content: center;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-btn {
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.page-btn.btn-primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn.btn-outline {
  background: transparent;
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.2);
}

.page-btn.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .pagination-container {
    gap: 0.75rem;
  }
  
  .pagination-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .pagination-btn {
    min-width: 120px;
  }
  
  .page-numbers {
    order: -1;
  }
}

@media (max-width: 480px) {
  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .pagination-info {
    font-size: 0.9rem;
  }
}
</style>
