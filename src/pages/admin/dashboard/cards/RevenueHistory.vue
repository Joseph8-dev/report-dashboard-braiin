<template>
  <VaCard class="flex flex-col">
    <VaCardTitle class="flex items-start justify-between">
      <h1 class="card-title text-secondary font-bold uppercase">Mining Revenue Report</h1>
      <div class="flex gap-2">
        <VaSelect v-model="selectedMonth" preset="small" :options="monthsWithCurrentYear" class="w-28" />
        <VaButton class="h-2" size="small" preset="primary" @click="exportAsCSV">Export</VaButton>
      </div>
    </VaCardTitle>

    <VaCardContent class="flex flex-col md:flex-row md:items-center justify-between gap-5 h-full">
      <section class="flex flex-col items-start w-full sm:w-1/3 md:w-2/5 lg:w-1/4 gap-4 md:gap-8 pl-4">
        <div>
          <p class="text-xl font-semibold">{{ formatMoney(totalEarningsUSD) }}</p>
          <p class="whitespace-nowrap mt-2">Total earnings (USDT)</p>
        </div>

        <div class="flex flex-col gap-4 md:gap-8 w-full">
          <div>
            <div class="flex items-center">
              <span class="inline-block w-2 h-2 mr-2 -ml-4" :style="{ backgroundColor: barColor }"></span>
              <span class="text-secondary">Average Hashrate</span>
            </div>
            <div class="mt-2 text-xl font-semibold">{{ averageHashratePH.toFixed(2) }} PH/s</div>
          </div>
        </div>
      </section>

      <section class="flex flex-col w-full md:w-3/5 lg:w-3/4">
        <RevenueHistoryChart class="h-56 min-h-56 pt-4" :revenues="chartData" />
        <div class="flex justify-between mt-4 text-sm text-secondary px-4">
          <span
            >Total USDT: <b>{{ formatMoney(totalEarningsUSD) }}</b></span
          >
          <span
            >Equivalent BTC: <b>{{ totalEarningsBTC.toFixed(5) }} BTC</b></span
          >
        </div>
      </section>
    </VaCardContent>
  </VaCard>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { VaCard, VaSelect, VaButton } from 'vuestic-ui'
import RevenueHistoryChart from './RevenueHistoryChart.vue'
import { downloadAsCSV } from '../../../../services/toCSV'
import { formatMoney } from '../../../../data/charts/revenueChartData'

interface MergedData {
  date: string
  revenueUSD: number
  hashratePH: number
}

const barColor = '#3b82f6'
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const currentYear = new Date().getFullYear()
const monthsWithCurrentYear = months.map((m) => `${m} ${currentYear}`)
const selectedMonth = ref(monthsWithCurrentYear[new Date().getMonth()])

const chartData = ref<MergedData[]>([])
const totalEarningsUSD = ref(0)
const totalEarningsBTC = ref(0)
const averageHashratePH = ref(0)

const exportAsCSV = () => {
  downloadAsCSV(chartData.value, 'braiins-revenue-report')
}

function normalizeDate(dt: string) {
  return new Date(dt).toISOString().split('T')[0]
}

async function loadBraiinsData() {
  try {
    console.log('➡️ Starting to load Braiins data...')

    const [priceRes, revenueRes, poolRes] = await Promise.all([
      fetch('https://dev-sec.app/api/price-stats-old'),
      fetch('https://dev-sec.app/api/daily-revenue-history?timeframe=1m'),
      fetch('https://dev-sec.app/api/pool-stats'),
    ])

    const btcPriceData = await priceRes.json()
    const btcPrice = btcPriceData.price_usd || btcPriceData.price || 0

    const revenueData = await revenueRes.json()
    const poolData = await poolRes.json()

    console.log('BTC price:', btcPrice)
    console.log('Revenue sample:', revenueData?.miners_revenue_sat?.slice(0, 3))
    console.log('Pool stats sample:', poolData?.[0])

    const hashrates = poolData[0]?.hashrate_past_week || []

    const merged: MergedData[] = revenueData.miners_revenue_sat.map((item: any) => {
      const date = normalizeDate(item.x)
      const revenueBTC = item.y / 1e8
      const poolEntry = hashrates.find((h: any) => normalizeDate(h.x) === date)
      const hashratePH = poolEntry ? poolEntry.y : 0
      if (!poolEntry) console.warn('No hashrate match for date:', date, 'RevenueBTC:', revenueBTC)
      return { date, revenueUSD: revenueBTC * btcPrice, hashratePH }
    })

    chartData.value = merged.reverse()

    totalEarningsUSD.value = merged.reduce((sum, d) => sum + d.revenueUSD, 0)
    totalEarningsBTC.value = merged.reduce((sum, d) => sum + d.revenueUSD / btcPrice, 0)
    averageHashratePH.value = merged.reduce((sum, d) => sum + d.hashratePH, 0) / merged.length

    console.log('✅ Finished loading Braiins data')
    console.log('Total earnings USD:', totalEarningsUSD.value)
    console.log('Total earnings BTC:', totalEarningsBTC.value)
    console.log('Average hashrate PH/s:', averageHashratePH.value)
  } catch (err) {
    console.error('❌ Failed to load Braiins data:', err)
  }
}

onMounted(loadBraiinsData)
</script>
