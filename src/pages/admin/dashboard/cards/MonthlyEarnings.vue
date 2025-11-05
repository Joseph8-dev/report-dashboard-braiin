<template>
  <VaCard>
    <VaCardTitle>
      <h1 class="card-title text-tag text-secondary font-bold uppercase">
        Adjustment Tracker
      </h1>
    </VaCardTitle>

    <VaCardContent>
      <!-- Icon -->
      <div class="p-1 bg-black rounded absolute right-4 top-4">
        <VaIcon name="mso-trending_up" color="#fff" size="large" />
      </div>

      <!-- When data is loaded -->
      <section v-if="!loading && !error && epoch && simplifiedPoints.length">
        <div class="text-xl font-bold mb-2">
          Epoch #{{ epoch }}
        </div>
        <p class="text-xs text-success">
          <VaIcon name="arrow_upward" />
          {{ latestChange }}%
          <span class="text-secondary"> recent adjustment</span>
        </p>

        <div class="w-full flex items-center mt-3">
          <VaChart :data="chartData" class="h-24" type="line" :options="options" />
        </div>
      </section>

      <!-- Loading state -->
      <div
        v-else-if="loading"
        class="flex justify-center items-center h-24 text-secondary text-xs"
      >
        Loading data...
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="flex justify-center items-center h-24 text-danger text-xs"
      >
        ⚠️ Failed to load Adjustment Tracker.
      </div>
    </VaCardContent>
  </VaCard>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { VaCard, VaCardTitle, VaCardContent, VaIcon } from 'vuestic-ui'
import VaChart from '../../../../components/va-charts/VaChart.vue'
import { ChartOptions } from 'chart.js'

// Reactive state
const epoch = ref<number | null>(null)
const points = ref<{ x: number; y: number }[]>([])
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    console.log('🔍 Fetching Adjustment Tracker from backend...')
    const res = await fetch('https://dev-sec.app/api/adjustment-tracker') // 👈 Fetch from your Node backend
    console.log('✅ Response received:', res)

    if (!res.ok) throw new Error(`Failed to fetch Adjustment Tracker: ${res.statusText}`)

    const data = await res.json()
    console.log('📦 Parsed data:', data)

    epoch.value = data.epoch
    // Filter every 20th point to reduce chart load
    points.value = data.points?.filter((_: any, i: number) => i % 20 === 0) || []
  } catch (err) {
    console.error('❌ Error fetching Adjustment Tracker:', err)
    error.value = true
  } finally {
    loading.value = false
  }
})

// Downsampled points for chart
const simplifiedPoints = computed(() => points.value ?? [])

// Compute last percentage change
const latestChange = computed(() => {
  if (simplifiedPoints.value.length < 2) return '0.00'
  const last = simplifiedPoints.value.at(-1)?.y ?? 0
  const prev = simplifiedPoints.value.at(-2)?.y ?? 0
  const diff = ((last - prev) / Math.abs(prev || 1)) * 100
  return diff.toFixed(2)
})

// Chart data
const chartData = computed(() => ({
  labels: simplifiedPoints.value.map(p => p.x),
  datasets: [
    {
      label: 'Adjustment Value',
      data: simplifiedPoints.value.map(p => p.y),
      borderColor: '#00E396',
      backgroundColor: 'rgba(0, 227, 150, 0.2)',
      tension: 0.3,
      pointRadius: 0,
      fill: true,
    },
  ],
}))

// Chart options
const options: ChartOptions<'line'> = {
  scales: {
    x: { display: false, grid: { display: false } },
    y: { display: false, grid: { display: false }, ticks: { display: false } },
  },
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  interaction: { intersect: false, mode: 'index' },
}
</script>
