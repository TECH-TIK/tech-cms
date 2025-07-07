<template>
  <div class="revenue-chart">
    <Line
      v-if="chartData"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'vue-chartjs'

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// Props
interface Props {
  data: {
    today: number
    week: number
    month: number
    year: number
  }
}

const props = defineProps<Props>()
const { t } = useI18n()

// Données du graphique
const chartData = computed(() => ({
  labels: [t('dashboard.chart.today'), t('dashboard.chart.week'), t('dashboard.chart.month'), t('dashboard.chart.year')],
  datasets: [
    {
      label: t('dashboard.chart.revenue'),
      data: [props.data.today, props.data.week, props.data.month, props.data.year],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }
  ]
}))

// Options du graphique
// Import explicite du type ChartOptions requis
import type { ChartOptions } from 'chart.js'

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    },
    title: {
      display: true,
      text: t('dashboard.chart.evolution')
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        // Le callback doit prendre un type générique pour satisfaire l'interface
        callback: (value: number | string, _index: number, _ticks: any) => {
          // Conversion du paramètre en nombre si c'est une chaîne
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          
          // Vérifier que c'est bien un nombre avant le formatage
          if (isNaN(numValue)) return '';
          
          return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
          }).format(numValue)
        }
      }
    }
  }
}
</script>

<style scoped>
.revenue-chart {
  height: 300px;
}
</style>
