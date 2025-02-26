<template>
  <div class="datatable">
    <div class="datatable-inner">
      <table>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{ 
                sortable: column.sortable,
                sorted: sortBy === column.key,
                'sort-desc': sortDesc && sortBy === column.key
              }"
              @click="handleSort(column)"
            >
              {{ column.label }}
              <i v-if="column.sortable" class="fas fa-sort"></i>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr class="loading-row">
              <td :colspan="columns.length">
                <div class="loading-spinner">
                  <i class="fas fa-spinner fa-spin"></i>
                  Chargement...
                </div>
              </td>
            </tr>
          </template>
          <template v-else-if="sortedData.length === 0">
            <tr class="empty-row">
              <td :colspan="columns.length">
                Aucune donnée disponible
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="(row, index) in sortedData"
              :key="index"
              @click="emit('row-click', row)"
            >
              <td v-for="column in columns" :key="column.key">
                {{ column.formatter ? column.formatter(row[column.key]) : row[column.key] }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  formatter?: (value: any) => string;
}

interface Props {
  columns: Column[];
  data: any[];
  loading?: boolean;
  sortBy?: string;
  sortDesc?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortBy: '',
  sortDesc: false
});

const emit = defineEmits(['sort', 'row-click']);

const sortedData = computed(() => {
  if (!props.sortBy) return props.data;
  
  return [...props.data].sort((a, b) => {
    const aVal = a[props.sortBy];
    const bVal = b[props.sortBy];
    
    if (props.sortDesc) {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
  });
});

const handleSort = (column: Column) => {
  if (!column.sortable) return;
  
  const newSortDesc = props.sortBy === column.key ? !props.sortDesc : false;
  emit('sort', column.key, newSortDesc);
};
</script>

<style scoped>
.datatable {
  width: 100%;
  overflow: hidden;
  background: var(--bg-primary, white);
  border: 1px solid var(--border-color, #eee);
  border-radius: var(--radius-lg, 8px);
}

.datatable-inner {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary, #333);
  border-bottom: 1px solid var(--border-color, #eee);
  background: var(--bg-secondary, #f9f9f9);
}

th.sortable {
  cursor: pointer;
  user-select: none;
}

th.sortable:hover {
  background: var(--hover-bg, #f5f5f5);
}

th i {
  margin-left: 0.5rem;
  opacity: 0.5;
}

th.sorted i {
  opacity: 1;
}

th.sort-desc i {
  transform: rotate(180deg);
}

td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #eee);
  color: var(--text-secondary, #666);
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background: var(--hover-bg, #f5f5f5);
}

.loading-row td,
.empty-row td {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted, #999);
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.loading-spinner i {
  color: var(--primary-blue, #4a8cff);
  font-size: 1.5rem;
}
</style>
