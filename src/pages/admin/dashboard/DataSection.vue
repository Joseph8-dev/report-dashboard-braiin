<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <DataSectionItem
      v-for="metric in dashboardMetrics"
      :key="metric.id"
      :title="metric.title"
      :value="metric.value"
      :change-text="metric.changeText"
      :up="metric.changeDirection === 'up'"
      :icon-background="metric.iconBackground"
      :icon-color="metric.iconColor"
    >
      <template #icon>
        <VaIcon :name="metric.icon" size="large" />
      </template>
    </DataSectionItem>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useColors, VaIcon } from 'vuestic-ui'
import DataSectionItem from './DataSectionItem.vue'

interface DashboardMetric {
  id: string
  title: string
  value: string
  icon: string
  changeText: string
  changeDirection: 'up' | 'down'
  iconBackground: string
  iconColor: string
}

const { getColor } = useColors()

// ==================== METRICS ====================
const dailyRevenueMetric = ref<DashboardMetric>({
  id: 'dailyRevenue',
  title: 'Ingresos diarios',
  value: 'Cargando...',
  icon: 'mso-attach_money',
  changeText: '',
  changeDirection: 'up',
  iconBackground: getColor('success'),
  iconColor: getColor('on-success'),
})

const priceStatsMetric = ref<DashboardMetric>({
  id: 'priceStats',
  title: 'Precio BTC de hoy',
  value: 'Cargando...',
  icon: 'mso-currency_bitcoin',
  changeText: '',
  changeDirection: 'up',
  iconBackground: getColor('info'),
  iconColor: getColor('on-info'),
})

const transactionStatsMetric = ref<DashboardMetric>({
  id: 'transactionStats',
  title: 'Prom. comisión por transacción (1 año)',
  value: 'Cargando...',
  icon: 'mso-trending_up',
  changeText: '',
  changeDirection: 'up',
  iconBackground: getColor('danger'),
  iconColor: getColor('on-danger'),
})

// ==================== FETCH FUNCTIONS ====================

// Fetch BTC price once and reuse
async function fetchBTCPrice(): Promise<number> {
  try {
    const res = await fetch('https://dev-sec.app/api/price-stats')
    const { data } = await res.json()
    if (!data?.price) throw new Error('Invalid BTC price data')
    return Number(data.price)
  } catch (err) {
    console.error('❌ Error fetching BTC price:', err)
    priceStatsMetric.value.value = 'Error'
    priceStatsMetric.value.changeDirection = 'down'
    return 0
  }
}

// Daily Revenue
async function fetchDailyRevenueHistory(btcPrice: number, timeframe = '1m') {
  try {
    const res = await fetch(`https://dev-sec.app/api/daily-revenue-history?timeframe=${timeframe}`)
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid daily revenue data')

    const latest = data[data.length - 1]
    const latestBTC = Number(latest.revenue_sat) / 1e8
    dailyRevenueMetric.value.value = btcPrice
      ? `${latestBTC.toFixed(3)} BTC / $${(latestBTC * btcPrice).toLocaleString()}`
      : `${latestBTC.toFixed(3)} BTC`

    if (data.length > 1) {
      const prevBTC = Number(data[data.length - 2].revenue_sat) / 1e8
      const changePercent = ((latestBTC - prevBTC) / prevBTC) * 100
      dailyRevenueMetric.value.changeText = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
      dailyRevenueMetric.value.changeDirection = changePercent >= 0 ? 'up' : 'down'
    } else {
      dailyRevenueMetric.value.changeText = ''
    }
  } catch (err) {
    console.error('❌ Error fetching daily revenue:', err)
    dailyRevenueMetric.value.value = 'Error'
    dailyRevenueMetric.value.changeText = ''
    dailyRevenueMetric.value.changeDirection = 'down'
  }
}

// Transaction Stats
async function fetchTransactionStats(btcPrice: number) {
  try {
    const res = await fetch('https://dev-sec.app/api/transaction-stats')
    const data = await res.json()
    if (!data.average_transaction_fees_1_year) throw new Error('Invalid transaction stats')

    const avgFeeBTC = Number(data.average_transaction_fees_1_year) / 1e8
    transactionStatsMetric.value.value = btcPrice
      ? `${avgFeeBTC.toFixed(4)} BTC / $${(avgFeeBTC * btcPrice).toLocaleString()}`
      : `${avgFeeBTC.toFixed(4)} BTC`
    transactionStatsMetric.value.changeText = ''
    transactionStatsMetric.value.changeDirection = 'up'
  } catch (err) {
    console.error('❌ Error fetching transaction stats:', err)
    transactionStatsMetric.value.value = 'Error'
    transactionStatsMetric.value.changeText = ''
    transactionStatsMetric.value.changeDirection = 'down'
  }
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
  const btcPrice = await fetchBTCPrice()

  if (btcPrice) {
    priceStatsMetric.value.value = `1 BTC = $${btcPrice.toLocaleString()}`
    priceStatsMetric.value.changeText = ''
    priceStatsMetric.value.changeDirection = 'up'
  }

  await Promise.all([fetchDailyRevenueHistory(btcPrice), fetchTransactionStats(btcPrice)])
})

// ==================== COMPUTED METRICS ====================
const dashboardMetrics = computed<DashboardMetric[]>(() => [
  dailyRevenueMetric.value,
  priceStatsMetric.value,
  transactionStatsMetric.value,
])
</script>
