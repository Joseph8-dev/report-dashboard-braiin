<template>
  <div class="flex justify-center w-full h-full overflow-hidden relative">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface MergedData {
  date: string
  revenueUSD: number
  hashratePH: number
}

const props = defineProps<{
  revenues: MergedData[]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

onMounted(() => {
  if (canvas.value) drawChart()
})

watch(
  () => props.revenues,
  () => {
    drawChart()
  },
)

function drawChart() {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  // Destroy previous chart instance if it exists
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const revenueValues = props.revenues.map((r) => r.revenueUSD)
  const hashrateValues = props.revenues.map((r) => r.hashratePH)

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.revenues.map((r) => r.date),
      datasets: [
        {
          label: 'Revenue (USDT)',
          type: 'bar',
          data: revenueValues,
          yAxisID: 'y1',
          backgroundColor: 'rgba(59,130,246,1)', // solid blue
          borderColor: 'rgba(59,130,246,1)', // same as fill to avoid outline contrasts
          borderWidth: 0, // remove border (prevents lighter edges)
          hoverBackgroundColor: 'rgba(59,130,246,1)', // same on hover (no lighter overlay)
          hoverBorderColor: 'rgba(59,130,246,1)',
          hoverBorderWidth: 0,
          barPercentage: 0.4, // narrower bars
          categoryPercentage: 0.5, // spacing between bars
          maxBarThickness: 30,
          borderRadius: 4,
          order: 1, // draw first
        },
        {
          label: 'Hashrate (PH/s)',
          type: 'line',
          data: hashrateValues,
          yAxisID: 'y2',
          borderColor: '#10b981',
          backgroundColor: 'transparent', // remove fill
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          order: 2, // draw on top
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 30, bottom: 10 } }, // top padding for titles
      interaction: { mode: 'index', intersect: false },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || ''
              const value = context.parsed.y ?? 0
              return label.includes('Revenue')
                ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                : `${value.toFixed(2)} PH/s`
            },
          },
        },
        legend: { position: 'top' },
      },
      scales: {
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Revenue (USDT)', padding: { top: 20, bottom: 0 } },
          beginAtZero: true,
          stacked: false,
        },
        y2: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Hashrate (PH/s)', padding: { top: 20, bottom: 0 } },
          grid: { drawOnChartArea: false },
          beginAtZero: true,
          stacked: false,
        },
        x: {
          title: { display: true, text: 'Date', padding: { top: 10 } },
          ticks: { maxRotation: 45, minRotation: 0, autoSkip: true },
          stacked: false,
        },
      },
    },
  })
}
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
}
</style>
