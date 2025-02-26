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

// Données du graphique
const chartData = computed(() => ({
  labels: ['Aujourd\'hui', '7 Jours', '30 Jours', 'Cette année'],
  datasets: [
    {
      label: 'Revenus',
      data: [props.data.today, props.data.week, props.data.month, props.data.year],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }
  ]
}))

// Options du graphique
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    },
    title: {
      display: true,
      text: 'Évolution des revenus'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: number) => {
          return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
          }).format(value)
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
