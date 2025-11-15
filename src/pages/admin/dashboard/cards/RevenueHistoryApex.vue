<template>
  <VaCard class="flex flex-col">
    <VaCardTitle class="flex items-start justify-between">
      <h1 class="card-title text-secondary font-bold uppercase">Informe de Ingresos Minería (Apex)</h1>
      <div class="flex gap-2">
        <VaSelect v-model="selectedPeriod" :options="monthYearOptions" preset="small" class="w-52" teleported />
        <VaButton size="small" preset="primary" @click="exportAsExcel"class ="w-32">Exportar</VaButton>
      </div>
    </VaCardTitle>

    <VaCardContent class="flex flex-col md:flex-row md:items-center justify-between gap-5 h-full">
      <section class="flex flex-col items-start w-full sm:w-1/3 md:w-2/5 lg:w-1/4 gap-4 md:gap-8 pl-4">
        <div>
          <p class="text-xl font-semibold">{{ formatMoney(totalEarningsUSD) }}</p>
          <p class="whitespace-nowrap mt-2">Ingresos totales (USDT)</p>
          <p v-if="averagePhs > 0" class="text-sm text-secondary mt-1">
            Promedio PH/s este mes: <b>{{ averagePhs.toFixed(2) }}</b>
          </p>
        </div>
      </section>

      <section class="flex flex-col w-full md:w-3/5 lg:w-3/4">
        <ApexChart ref="apexRef" id="apexChart" type="bar" height="300" :options="chartOptions" :series="chartSeries" />
        <div class="flex justify-between mt-4 text-sm text-secondary px-4">
          <span>Total USDT: <b>{{ formatMoney(totalEarningsUSD) }}</b></span>
          <span>Equivalente en BTC: <b>{{ totalEarningsBTC.toFixed(5) }} BTC</b></span>
        </div>
      </section>
    </VaCardContent>
  </VaCard>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { VaCard, VaSelect, VaButton } from 'vuestic-ui'
import ApexChart from 'vue3-apexcharts'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
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

// add a ref to the ApexChart component
const apexRef = ref<any>(null)

// ----- Export to Excel -----
const exportAsExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Revenue Report')

    // Add headers
    sheet.addRow(['Fecha', 'Ingresos (USDT)', 'Promedio de PH/s', 'Lecturas Activas'])

    // Add data
    chartData.value.forEach((d) => {
      sheet.addRow([d.date, d.revenueUSD, d.avg_phs, d.active_readings])
    })

    // Export chart as image via the ApexCharts instance exposed on the component ref
    const chartComp = apexRef.value
    if (chartComp?.chart?.dataURI) {
      const data = await chartComp.chart.dataURI()
      // data.imgURI is like "data:image/png;base64,...."
      const imgURI = data.imgURI || data
      const base64 = imgURI.split(',')[1]
      if (base64) {
        const imageId = workbook.addImage({
          base64,
          extension: 'png',
        })
        // Position image in Excel (adjust columns/rows to taste)
        sheet.addImage(imageId, {
          tl: { col: 5, row: 10 } as any,
          br: { col: 20, row: 25 } as any,
          editAs: 'oneCell',
        })
      }
    }

    // Save file
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'braiins-revenue-report.xlsx')
  } catch (err) {
    console.error('❌ Failed to export Excel:', err)
  }
}

// ----- Helper -----
function normalizeDate(dt: string): string {
  // Safe normalize: return YYYY-MM-DD without creating a Date object (avoids TZ shifts)
  return (dt || '').slice(0, 10)
}

function normalizeUTCDate(dt: string): string {
  // Just keep the YYYY-MM-DD part of the string
  if (!dt) return ''
  return dt.slice(0, 10) // Works whether dt is '2025-11-03' or '2025-11-03T00:00:00Z'
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
      fetch(`https://dev-sec.app/api/daily-phs-history?month=${month}&year=${year}`),
    ])

    const btcPriceData = await priceRes.json()
    const btcPrice = Number(btcPriceData.data?.price || 0)

    const revenueRaw: any[] = await revenueRes.json()
    const phsRaw: { day: string; avg_phs: number; active_readings: number }[] = await phsRes.json()

    // --- LOG API RESPONSES ---
    console.log('=== Revenue Endpoint ===')
    console.log(revenueRaw)
    console.log('=== PH/s Endpoint ===')
    console.log(phsRaw)

    // Only keep rows that belong to the selected year-month to avoid the "previous-day" UTC artifact.
    const selectedPrefix = `${year}-${String(month).padStart(2, '0')}` // e.g. "2025-11"

    const mapped = revenueRaw.map((item: any) => {
  const date = normalizeUTCDate(item.day || item.timestamp); // revenue date in YYYY-MM-DD
  const matchPhs = phsRaw.find((p) => normalizeUTCDate(p.day) === date); // normalize PH/s day
  return {
    date,
    revenueUSD: (Number(item.revenue_sat) / 1e8) * btcPrice,
    avg_phs: matchPhs?.avg_phs ?? 0,
    active_readings: matchPhs?.active_readings ?? 0,
  };
});



    // Filter out rows that don't belong to the selected month (removes 2025-10-31 when selecting 2025-11)
    chartData.value = mapped.filter((r) => r.date.startsWith(selectedPrefix))


    totalEarningsUSD.value = chartData.value.reduce((sum, d) => sum + d.revenueUSD, 0)
    totalEarningsBTC.value = chartData.value.reduce((sum, d) => sum + d.revenueUSD / (btcPrice || 1), 0)

    const nonZeroPhs = chartData.value.filter((d) => d.avg_phs > 0).map((d) => d.avg_phs)
    averagePhs.value = nonZeroPhs.length > 0 ? nonZeroPhs.reduce((a, b) => a + b, 0) / nonZeroPhs.length : 0
  } catch (err) {
    console.error('❌ Failed to load Braiins data:', err)
  }
}

// ----- Chart Options -----
const chartSeries = computed(() => [
  {
    name: 'Ingresos (USDT)',
    data: chartData.value.map((d) => d.revenueUSD),
  },
])

const chartOptions = computed(() => {
  const maxRevenue = chartData.value.length ? Math.max(...chartData.value.map((d) => d.revenueUSD)) * 1.1 : 1

  return {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, foreColor: '#6b7280' },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartData.value.map((d) => d.date),
      labels: { rotate: -45, style: { fontSize: '12px' } },
      title: { text: 'Fecha' },
    },
    yaxis: {
      title: { text: 'Ingresos (USDT)' },
      min: 0,
      max: maxRevenue,
      labels: {
        formatter: (val: number) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      },
    },
    tooltip: {
      custom: function ({ dataPointIndex }: any) {
        const d = chartData.value[dataPointIndex]
        if (!d) return ''
        return `
          <div style="padding:8px;">
            <b>${d.date}</b><br>
            Ingresos: <b>$${d.revenueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b><br>
            Promedio de PH/s: <b>${d.avg_phs?.toFixed(2) ?? 0}</b><br>
            
          </div>
        `
        //REMOVED: Lecturas activas: <b>${d.active_readings ?? 0}</b>
      },
    },
    colors: ['#3b82f6'],
    legend: { show: false },
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
  { immediate: true },
)
</script>
