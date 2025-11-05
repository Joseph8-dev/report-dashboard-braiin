<template>
  <VaCard>
    <VaCardTitle>
      <h1 class="card-title text-tag text-secondary font-bold uppercase">
        Latest Blocks Mined
      </h1>
    </VaCardTitle>

    <VaCardContent>
      <div class="p-1 bg-black rounded absolute right-4 top-4">
        <VaIcon name="mso-grid_view" color="#fff" size="large" />
      </div>

      <!-- Table of blocks -->
      <div v-if="blocks.length">
        <table class="w-full text-xs border-collapse">
          <thead class="text-secondary uppercase text-left bg-gray-50">
            <tr>
              <th class="p-2">Height</th>
              <th class="p-2">Timestamp</th>
              <th class="p-2">Pool</th>
              <th class="p-2">BTC</th>
              <th class="p-2">USD</th>
              <th class="p-2">Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="block in blocks"
              :key="block.height"
              class="border-t border-gray-200 hover:bg-gray-100 transition"
            >
              <td class="p-2 font-bold">{{ block.height }}</td>
              <td class="p-2">{{ formatRelative(block.timestamp) }}</td>
              <td class="p-2">{{ block.pool }}</td>
              <td class="p-2">{{ block.block_value_btc?.toFixed(2) ?? '—' }}</td>
              <td class="p-2">${{ block.block_value_usd?.toLocaleString() ?? '—' }}</td>
              <td class="p-2 w-24">
                <VaChart
                  :data="getSparklineData(block)"
                  type="line"
                  class="h-6"
                  :options="sparklineOptions"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading state -->
      <div
        v-else
        class="flex justify-center items-center h-24 text-secondary text-xs"
      >
        Loading latest blocks...
      </div>
    </VaCardContent>
  </VaCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VaCard, VaCardTitle, VaCardContent, VaIcon } from 'vuestic-ui'
import VaChart from '../../../../components/va-charts/VaChart.vue'
import { ChartOptions } from 'chart.js'

interface MinedBlock {
  height: number
  timestamp: string
  pool: string
  block_value_btc: number
  block_value_usd: number
  last_usd_values: number[]
}

const blocks = ref<MinedBlock[]>([])

// ✅ Format time as “x minutes ago”
const formatRelative = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs} hr ago`
  return new Date(iso).toLocaleString()
}

const getSparklineData = (block: MinedBlock) => ({
  labels: block.last_usd_values.map((_, i) => i + 1),
  datasets: [
    {
      data: block.last_usd_values,
      borderColor: '#00E396',
      backgroundColor: 'rgba(0, 227, 150, 0.2)',
      tension: 0.3,
      pointRadius: 0,
      fill: true,
    },
  ],
})

const sparklineOptions: ChartOptions<'line'> = {
  scales: { x: { display: false }, y: { display: false } },
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  interaction: { intersect: false, mode: 'index' },
}

// 🚀 Fetch from backend or fallback
onMounted(async () => {
  try {
    const res = await fetch('https://dev-sec.app/api/latest-blocks')
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    blocks.value = (Array.isArray(data) ? data : []).map(b => ({
      ...b,
      last_usd_values: [
        b.block_value_usd * 0.98,
        b.block_value_usd * 0.99,
        b.block_value_usd * 1.01,
        b.block_value_usd,
      ],
    }))
  } catch (error) {
    console.warn('⚠️ Using dummy data due to fetch error:', error)
    blocks.value = [
      {
        height: 921312,
        timestamp: '2025-10-28T14:12:00Z',
        pool: 'AntPool',
        block_value_btc: 6.25,
        block_value_usd: 220_000,
        last_usd_values: [210_000, 215_000, 218_000, 220_000],
      },
      {
        height: 921311,
        timestamp: '2025-10-28T13:58:00Z',
        pool: 'F2Pool',
        block_value_btc: 6.25,
        block_value_usd: 219_000,
        last_usd_values: [214_000, 216_500, 218_000, 219_000],
      },
      {
        height: 921310,
        timestamp: '2025-10-28T13:45:00Z',
        pool: 'ViaBTC',
        block_value_btc: 6.25,
        block_value_usd: 218_500,
        last_usd_values: [213_000, 215_000, 217_500, 218_500],
      },
    ]
  }
})
</script>
