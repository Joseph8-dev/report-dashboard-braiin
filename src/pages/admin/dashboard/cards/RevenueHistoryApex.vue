<template>
  <VaCard class="flex flex-col">
    <VaCardTitle class="flex items-start justify-between">
      <h1 class="card-title text-secondary font-bold uppercase">Mining Revenue Report (Apex)</h1>
      <div class="flex gap-2">
        <VaSelect
          v-model="selectedPeriod"
          :options="monthYearOptions"
          preset="small"
          class="w-52"
          teleported
        />
        <VaButton size="small" preset="primary" @click="exportAsCSV">Export</VaButton>
      </div>
    </VaCardTitle>

    <VaCardContent class="flex flex-col md:flex-row md:items-center justify-between gap-5 h-full">
      <section class="flex flex-col items-start w-full sm:w-1/3 md:w-2/5 lg:w-1/4 gap-4 md:gap-8 pl-4">
        <div>
          <p class="text-xl font-semibold">{{ formatMoney(totalEarningsUSD) }}</p>
          <p class="whitespace-nowrap mt-2">Total earnings (USDT)</p>
          <p v-if="averagePhs > 0" class="text-sm text-secondary mt-1">
            Avg PH/s this month: <b>{{ averagePhs.toFixed(2) }}</b>
          </p>
        </div>
      </section>

      <section class="flex flex-col w-full md:w-3/5 lg:w-3/4">
        <ApexChart
          type="bar"
          height="300"
          :options="chartOptions"
          :series="chartSeries"
        />
        <div class="flex justify-between mt-4 text-sm text-secondary px-4">
          <span>Total USDT: <b>{{ formatMoney(totalEarningsUSD) }}</b></span>
          <span>Equivalent BTC: <b>{{ totalEarningsBTC.toFixed(5) }} BTC</b></span>
        </div>
      </section>
    </VaCardContent>
  </VaCard>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { VaCard, VaSelect, VaButton } from 'vuestic-ui'
import ApexChart from 'vue3-apexcharts'
import { downloadAsCSV } from '../../../../services/toCSV'
import { formatMoney } from '../../../../data/charts/revenueChartData'

interface RevenueData {
  date: string
  revenueUSD: number
  avg_phs: number
  active_readings: number
}

// ----- Month/Year Selector -----
const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()

const monthYearOptions = Array.from({ length: 12 }, (_, i) => {
  const monthNumber = String(i + 1).padStart(2, '0')
  return `${currentYear}-${monthNumber}`
})

const selectedPeriod = ref<string>(monthYearOptions[currentMonth - 1])

// ----- Chart Data -----
const chartData = ref<RevenueData[]>([])
const totalEarningsUSD = ref(0)
const totalEarningsBTC = ref(0)
const averagePhs = ref(0)

// ----- CSV Export -----
const exportAsCSV = () => {
  downloadAsCSV(chartData.value, 'braiins-revenue-report')
}

// ----- Helper -----
function normalizeDate(dt: string): string {
  const d = new Date(dt)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ----- Data Fetch -----
async function loadBraiinsData() {
  try {
    if (!selectedPeriod.value) return

    const [yearStr, monthStr] = selectedPeriod.value.split('-')
    const month = Number(monthStr)
    const year = Number(yearStr)

    const [priceRes, revenueRes, phsRes] = await Promise.all([
      fetch('https://dev-sec.app/api/price-stats'),
      fetch(`https://dev-sec.app/api/daily-revenue-history?month=${month}&year=${year}`),
      fetch(`https://dev-sec.app/api/daily-phs-history?month=${month}&year=${year}`)
    ])

    const btcPriceData = await priceRes.json()
    const btcPrice = Number(btcPriceData.data?.price || 0)

    const revenueRaw: any[] = await revenueRes.json()
    const phsRaw: { day: string; avg_phs: number; active_readings: number }[] = await phsRes.json()

    chartData.value = revenueRaw.map((item: any) => {
      const date = normalizeDate(item.timestamp)
      const revenueUSD = Number(item.revenue_sat) / 1e8 * btcPrice
      const matchPhs = phsRaw.find((p) => p.day === date)
      return {
        date,
        revenueUSD,
        avg_phs: matchPhs ? matchPhs.avg_phs : 0,
        active_readings: matchPhs ? matchPhs.active_readings : 0
      }
    })

    totalEarningsUSD.value = chartData.value.reduce((sum, d) => sum + d.revenueUSD, 0)
    totalEarningsBTC.value = chartData.value.reduce((sum, d) => sum + d.revenueUSD / (btcPrice || 1), 0)

    // ✅ Skip 0 PH/s in monthly average, but keep them in the tooltip
    const nonZeroPhs = chartData.value
      .filter((d) => d.avg_phs > 0)
      .map((d) => d.avg_phs)

    averagePhs.value =
      nonZeroPhs.length > 0
        ? nonZeroPhs.reduce((a, b) => a + b, 0) / nonZeroPhs.length
        : 0
  } catch (err) {
    console.error('❌ Failed to load Braiins data:', err)
  }
}

// ----- Chart Options -----
const chartSeries = computed(() => [
  {
    name: 'Revenue (USDT)',
    data: chartData.value.map((d) => d.revenueUSD)
  }
])

const chartOptions = computed(() => {
  const maxRevenue = chartData.value.length
    ? Math.max(...chartData.value.map((d) => d.revenueUSD)) * 1.1
    : 1

  return {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, foreColor: '#6b7280' },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartData.value.map((d) => d.date),
      labels: { rotate: -45, style: { fontSize: '12px' } },
      title: { text: 'Date' }
    },
    yaxis: {
      title: { text: 'Revenue (USDT)' },
      min: 0,
      max: maxRevenue,
      labels: {
        formatter: (val: number) =>
          `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      }
    },
    tooltip: {
      custom: function ({ dataPointIndex }: any) {
        const d = chartData.value[dataPointIndex]
        if (!d) return ''
        return `
          <div style="padding:8px;">
            <b>${d.date}</b><br>
            Revenue: <b>$${d.revenueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b><br>
            Avg PH/s: <b>${d.avg_phs?.toFixed(2) ?? 0}</b><br>
            Active Readings: <b>${d.active_readings ?? 0}</b>
          </div>
        `
      }
    },
    colors: ['#3b82f6'],
    legend: { show: false }
  }
})

// ----- Watcher -----
watch(
  selectedPeriod,
  (newValue) => {
    const isValidOption = monthYearOptions.includes(newValue)
    if (!isValidOption) {
      console.warn(`Selected period "${newValue}" is not valid. Resetting to current month.`)
      selectedPeriod.value = monthYearOptions[currentMonth - 1]
    } else {
      loadBraiinsData()
    }
  },
  { immediate: true }
)
</script>
