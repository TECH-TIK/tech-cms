<template>
  <div class="update-history-table">
    <!-- Filtres -->
    <div class="table-filters">
      <div class="filter-group">
        <label>{{ $t('updates.filter_status') }}</label>
        <select v-model="filters.status" @change="applyFilters">
          <option value="">{{ $t('common.all') }}</option>
          <option value="pending">{{ $t('updates.status.pending') }}</option>
          <option value="downloading">{{ $t('updates.status.downloading') }}</option>
          <option value="installing">{{ $t('updates.status.installing') }}</option>
          <option value="completed">{{ $t('updates.status.completed') }}</option>
          <option value="failed">{{ $t('updates.status.failed') }}</option>
          <option value="rolled_back">{{ $t('updates.status.rolled_back') }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>{{ $t('updates.filter_version') }}</label>
        <input 
          v-model="filters.version" 
          type="text" 
          :placeholder="$t('updates.filter_version_placeholder')"
          @input="applyFilters"
        >
      </div>

      <div class="filter-group">
        <label>{{ $t('updates.filter_date_from') }}</label>
        <input 
          v-model="filters.date_from" 
          type="date"
          @change="applyFilters"
        >
      </div>

      <div class="filter-group">
        <label>{{ $t('updates.filter_date_to') }}</label>
        <input 
          v-model="filters.date_to" 
          type="date"
          @change="applyFilters"
        >
      </div>

      <button class="btn btn-secondary btn-sm" @click="clearFilters">
        <i class="icon-x"></i>
        {{ $t('common.clear_filters') }}
      </button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              :class="{ 
                'sortable': column.sortable,
                'sorted': sortField === column.key,
                [`sorted-${sortDirection}`]: sortField === column.key
              }"
              :style="{ width: column.width }"
              @click="column.sortable && handleSort(column.key)"
            >
              {{ column.label }}
              <i 
                v-if="column.sortable" 
                class="sort-icon"
                :class="{
                  'icon-chevron-up': sortField === column.key && sortDirection === 'asc',
                  'icon-chevron-down': sortField === column.key && sortDirection === 'desc',
                  'icon-chevrons-up-down': sortField !== column.key
                }"
              ></i>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="loading-row">
              <div class="loading-content">
                <i class="icon-loader spinning"></i>
                <span>{{ $t('common.loading') }}</span>
              </div>
            </td>
          </tr>
          
          <tr v-else-if="filteredData.length === 0">
            <td :colspan="columns.length" class="empty-row">
              <div class="empty-content">
                <i class="icon-inbox"></i>
                <span>{{ $t('updates.no_history') }}</span>
              </div>
            </td>
          </tr>
          
          <tr 
            v-for="update in paginatedData"
            v-else 
            :key="update.id"
            class="data-row"
            :class="`status-${update.status.replace('_', '-')}`"
          >
            <td class="version-cell">
              <div class="version-info">
                <span class="version-from">{{ update.version_from }}</span>
                <i class="icon-arrow-right"></i>
                <span class="version-to">{{ update.version_to }}</span>
              </div>
            </td>
            
            <td class="status-cell">
              <span class="status-badge" :class="`status-${update.status.replace('_', '-')}`">
                <i :class="getStatusIcon(update.status)"></i>
                {{ $t(`updates.status.${update.status}`) }}
              </span>
            </td>
            
            <td class="date-cell">
              {{ formatDate(update.created_at) }}
            </td>
            
            <td class="duration-cell">
              {{ calculateDuration(update) }}
            </td>
            
            <td class="size-cell">
              {{ update.file_size ? formatFileSize(update.file_size) : '-' }}
            </td>
            
            <td class="actions-cell">
              <div class="action-buttons">
                <button 
                  v-if="update.changelog"
                  class="btn btn-sm btn-secondary"
                  :title="$t('updates.view_changelog')"
                  @click="showChangelog(update)"
                >
                  <i class="icon-file-text"></i>
                </button>
                
                <button 
                  v-if="update.error_message"
                  class="btn btn-sm btn-danger"
                  :title="$t('updates.view_error')"
                  @click="showError(update)"
                >
                  <i class="icon-alert-triangle"></i>
                </button>
                
                <button 
                  v-if="update.status === 'failed'"
                  class="btn btn-sm btn-warning"
                  :title="$t('updates.retry')"
                  @click="retryUpdate(update)"
                >
                  <i class="icon-refresh"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="table-pagination">
      <div class="pagination-info">
        {{ $t('common.showing_results', { 
          from: (pagination.current_page - 1) * pagination.per_page + 1,
          to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
          total: pagination.total
        }) }}
      </div>
      
      <div class="pagination-controls">
        <button 
          class="btn btn-sm btn-secondary"
          :disabled="pagination.current_page === 1"
          @click="changePage(pagination.current_page - 1)"
        >
          <i class="icon-chevron-left"></i>
        </button>
        
        <span class="page-numbers">
          <button 
            v-for="page in visiblePages"
            :key="page"
            class="btn btn-sm"
            :class="{ 'btn-primary': page === pagination.current_page, 'btn-secondary': page !== pagination.current_page }"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </span>
        
        <button 
          class="btn btn-sm btn-secondary"
          :disabled="pagination.current_page === totalPages"
          @click="changePage(pagination.current_page + 1)"
        >
          <i class="icon-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal de changelog -->
    <div v-if="changelogModal.show" class="modal-overlay" @click.self="changelogModal.show = false">
      <div class="modal-container changelog-modal">
        <div class="modal-header">
          <h3>{{ $t('updates.changelog_title', { version: changelogModal.version }) }}</h3>
          <button class="modal-close" @click="changelogModal.show = false">
            <i class="icon-x"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="changelog-content">{{ changelogModal.content }}</div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="changelogModal.show = false">
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'erreur -->
    <div v-if="errorModal.show" class="modal-overlay" @click.self="errorModal.show = false">
      <div class="modal-container error-modal">
        <div class="modal-header">
          <h3>{{ $t('updates.error_details') }}</h3>
          <button class="modal-close" @click="errorModal.show = false">
            <i class="icon-x"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="error-content">
            <div class="error-message">{{ errorModal.message }}</div>
            <div v-if="errorModal.update" class="error-context">
              <h4>{{ $t('updates.update_context') }}</h4>
              <p><strong>{{ $t('updates.version') }}:</strong> {{ errorModal.update.version_to }}</p>
              <p><strong>{{ $t('updates.started_at') }}:</strong> {{ errorModal.update.started_at ? formatDate(errorModal.update.started_at) : 'N/A' }}</p>
              <p v-if="errorModal.update.completed_at"><strong>{{ $t('updates.failed_at') }}:</strong> {{ formatDate(errorModal.update.completed_at) }}</p>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="errorModal.show = false">
            {{ $t('common.close') }}
          </button>
          <button 
            v-if="errorModal.update"
            class="btn btn-warning" 
            @click="retryUpdate(errorModal.update)"
          >
            {{ $t('updates.retry') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { 
  SystemUpdate, 
  UpdateTableColumn, 
  UpdateTablePagination,
  UpdateFilters,
  UpdateSortOptions
} from '@/types/update'

interface Props {
  data: SystemUpdate[]
  loading?: boolean
  pagination: UpdateTablePagination
}

interface Emits {
  (e: 'page-change', page: number): void
  (e: 'sort-change', sort: UpdateSortOptions): void
  (e: 'filter-change', filters: UpdateFilters): void
  (e: 'retry-update', update: SystemUpdate): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// État local
const sortField = ref('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')

const filters = reactive<UpdateFilters>({
  status: '',
  version: '',
  date_from: '',
  date_to: ''
})

const changelogModal = reactive({
  show: false,
  version: '',
  content: ''
})

const errorModal = reactive({
  show: false,
  message: '',
  update: null as SystemUpdate | null
})

// Configuration des colonnes
const columns: UpdateTableColumn[] = [
  { key: 'version', label: t('updates.version'), sortable: true, width: '200px' },
  { key: 'status', label: t('updates.status'), sortable: true, width: '150px' },
  { key: 'created_at', label: t('updates.date'), sortable: true, width: '150px' },
  { key: 'duration', label: t('updates.duration'), sortable: false, width: '120px' },
  { key: 'file_size', label: t('updates.size'), sortable: true, width: '100px' },
  { key: 'actions', label: t('common.actions'), sortable: false, width: '120px' }
]

// Données calculées
const filteredData = computed(() => {
  let result = [...props.data]

  if (filters.status) {
    result = result.filter(item => item.status === filters.status)
  }

  if (filters.version) {
    result = result.filter(item => 
      item.version_to.toLowerCase().includes(filters.version?.toLowerCase() || '') ||
      item.version_from.toLowerCase().includes(filters.version?.toLowerCase() || '')
    )
  }

  if (filters.date_from) {
    result = result.filter(item => 
      new Date(item.created_at) >= new Date(filters.date_from!)
    )
  }

  if (filters.date_to) {
    result = result.filter(item => 
      new Date(item.created_at) <= new Date(filters.date_to!)
    )
  }

  return result
})

const paginatedData = computed(() => {
  const start = (props.pagination.current_page - 1) * props.pagination.per_page
  const end = start + props.pagination.per_page
  return filteredData.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / props.pagination.per_page)
})

const visiblePages = computed(() => {
  const current = props.pagination.current_page
  const total = totalPages.value
  const delta = 2
  
  let start = Math.max(1, current - delta)
  let end = Math.min(total, current + delta)
  
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4)
    } else {
      start = Math.max(1, end - 4)
    }
  }
  
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Méthodes
const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  
  emit('sort-change', { field: sortField.value, direction: sortDirection.value })
}

const changePage = (page: number) => {
  emit('page-change', page)
}

const applyFilters = () => {
  emit('filter-change', { ...filters })
}

const clearFilters = () => {
  filters.status = ''
  filters.version = ''
  filters.date_from = ''
  filters.date_to = ''
  applyFilters()
}

const getStatusIcon = (status: string) => {
  const icons = {
    pending: 'icon-clock',
    downloading: 'icon-download',
    installing: 'icon-settings',
    completed: 'icon-check-circle',
    failed: 'icon-x-circle',
    rolled_back: 'icon-rotate-ccw'
  }
  return icons[status as keyof typeof icons] || 'icon-help-circle'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const calculateDuration = (update: SystemUpdate) => {
  if (!update.started_at) return '-'
  
  const start = new Date(update.started_at)
  const end = update.completed_at ? new Date(update.completed_at) : new Date()
  const diffMs = end.getTime() - start.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) return '< 1 min'
  if (diffMinutes < 60) return `${diffMinutes} min`
  
  const diffHours = Math.floor(diffMinutes / 60)
  const remainingMinutes = diffMinutes % 60
  
  return `${diffHours}h ${remainingMinutes}min`
}

const showChangelog = (update: SystemUpdate) => {
  changelogModal.version = update.version_to
  changelogModal.content = update.changelog || t('updates.no_changelog')
  changelogModal.show = true
}

const showError = (update: SystemUpdate) => {
  errorModal.message = update.error_message || t('updates.unknown_error')
  errorModal.update = update
  errorModal.show = true
}

const retryUpdate = (update: SystemUpdate) => {
  emit('retry-update', update)
  errorModal.show = false
}

// Watchers
watch(filters, () => {
  applyFilters()
}, { deep: true })
</script>
