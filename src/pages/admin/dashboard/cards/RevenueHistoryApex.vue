<template>
  <VaCard class="flex flex-col">
    <VaCardTitle class="flex items-start justify-between">
      <h1 class="card-title text-secondary font-bold uppercase">Informe de Ingresos Minería (Apex)</h1>
      <div class="flex gap-2 w-[400px] justify-end">
        <!-- Selector de Periodo -->
        <VaSelect 
          v-model="selectedFilter" 
          :options="periodOptions" 
          preset="large" 
          class="!w-32" 
          teleported 
          :class="selectedFilter === 'Semanal' ? '!w-62' : '!w-32'" 

        />
        <!-- Month selector (only visible for Mensual) -->
          <VaSelect
    v-if="selectedFilter === 'Mensual'"
    v-model="selectedMonth"
    :options="monthOptions"
    value-by="value"
    preset="large"
    class="!w-32"
    teleported
    placeholder="Selecciona mes"
  />

        <VaButton size="medium" preset="primary" @click="exportAsExcel" class="w-32">Exportar</VaButton>
      </div>
    </VaCardTitle>

    <VaCardContent class="flex flex-col md:flex-row md:items-center justify-between gap-5 h-full">
      <section class="flex flex-col items-start w-full sm:w-1/3 md:w-2/5 lg:w-1/4 gap-4 md:gap-8 pl-4">
        <div>
          <p class="text-xl font-semibold">{{ formatMoney(totalEarningsUSD) }}</p>
          <p class="whitespace-nowrap mt-2">Ingresos totales (USDT)</p>
          <p v-if="averagePhs > 0" class="text-sm text-secondary mt-1">
            Promedio PH/s este período: <b>{{ averagePhs.toFixed(2) }}</b>
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
  dailyBtcPrice: number
  active_workers: number | null
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

// ----- Month Selector for Mensual -----
// Show month names as labels but keep numeric values for backend
const monthNames = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]
const monthOptions = ref(
  monthNames.map((name, i) => ({
    label: name,
    title: name, // some components use `title`
    text: name,  // some variants use `text`
    value: i + 1 // numeric value instead of string
  }))
)

const selectedMonth = ref<number>(currentMonth) // default as number

// ----- Filtros: Mensual / Semanal -----
const periodOptions = ['Mensual', 'Semanal']
const selectedFilter = ref('Mensual')

// ----- Chart Data -----
const chartData = ref<RevenueData[]>([])
const totalEarningsUSD = ref(0)
const totalEarningsBTC = ref(0)
const averagePhs = ref(0)
const btcPriceNow = ref(0)


// add a ref to the ApexChart component
const apexRef = ref<any>(null)


// ----- Export to Excel -----
const exportAsExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Revenue Report')

    // Add headers (include "Máquinas activas")
    sheet.addRow(['Fecha', 'Ingresos (USDT)', 'Promedio de PH/s', 'Precio BTC (USD)', 'Máquinas activas'])

    // Add data
    chartData.value.forEach((d) => {
      sheet.addRow([
        d.date,
        d.revenueUSD,
        d.avg_phs,
        d.dailyBtcPrice, // daily BTC price
        d.active_workers ?? 0 // <-- new column
      ])
    })

    // Export chart as image
    const chartComp = apexRef.value
    if (chartComp?.chart?.dataURI) {
      const data = await chartComp.chart.dataURI()
      const imgURI = data.imgURI || data
      const base64 = imgURI.split(',')[1]
      if (base64) {
        const imageId = workbook.addImage({
          base64,
          extension: 'png',
        })
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
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function normalizeUTCDate(dt: string): string {
  // Keep only YYYY-MM-DD, avoid Date objects
  return (dt || '').slice(0, 10)
}

// New helpers: produce local YYYY-MM-DD and compute Monday of current week
function localYMD(d?: Date) {
  const dt = d ? new Date(d.getTime()) : new Date()
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWeekStartMonday(date: Date) {
  // getDay: 0 (Sun) .. 6 (Sat). We want Monday as start.
  const day = date.getDay()
  const diff = (day + 6) % 7 // days since Monday
  const monday = new Date(date.getTime())
  monday.setDate(date.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}


// ----- Load Data (updated) -----
const loadBraiinsData = async () => {
  try {
    const today = new Date()
    const month = selectedMonth.value // now a number
    const year = today.getFullYear() // optionally, add year selector later

    const todayStr = localYMD(today)

    const priceRes = await fetch('https://dev-sec.app/api/price-stats')
    const btcPriceData = await priceRes.json()
    const btcPrice = Number(btcPriceData.data?.price || 0)
    btcPriceNow.value = btcPrice

    const [monthRes, phsRes, priceMonthRes, activeWorkersRes] = await Promise.all([
      fetch(`https://dev-sec.app/api/daily-revenue-history?month=${month}&year=${year}`),
      fetch(`https://dev-sec.app/api/daily-phs-history?month=${month}&year=${year}`),
      fetch(`https://dev-sec.app/api/price-stats/month?month=${month}&year=${year}`),
      fetch(`https://dev-sec.app/api/daily-active-workers?month=${month}&year=${year}`)
    ])

    const revenueRaw: any[] = await monthRes.json()
    const phsRaw: { day: string; avg_phs: number; active_readings: number }[] = await phsRes.json()
    const priceMonthData = await priceMonthRes.json()
    const activeWorkersRaw: { day: string; active_workers: number }[] = await activeWorkersRes.json()

    // map data as before...
    let mapped = revenueRaw.map(item => {
      const date = (item.day || item.timestamp).slice(0,10)
      const matchPhs = phsRaw.find(p => (p.day || '').slice(0,10) === date)
      const matchPrice = priceMonthData.days.find((p: any) => (p.day || '').slice(0,10) === date)
      const matchWorkers = activeWorkersRaw.find(w => (w.day || '').slice(0,10) === date)
    
      return {
        date,
        revenueUSD: (Number(item.revenue_sat)/1e8) * (matchPrice?.price ?? btcPriceNow.value),
        avg_phs: matchPhs?.avg_phs ?? 0,
        active_readings: matchPhs?.active_readings ?? 0,
        dailyBtcPrice: matchPrice?.price ?? btcPriceNow.value,
        active_workers: matchWorkers?.active_workers ?? null
      }
    })

    mapped.sort((a,b) => a.date.localeCompare(b.date))

    // Forward-fill active_workers
    let nextKnownValue: number | null = null
    for (let i = mapped.length - 1; i >= 0; i--) {
      if (mapped[i].active_workers != null) nextKnownValue = mapped[i].active_workers
      else if (nextKnownValue != null) mapped[i].active_workers = nextKnownValue
      else mapped[i].active_workers = 0
    }

    let filtered: RevenueData[] = []

    if (selectedFilter.value === 'Mensual') {
      filtered = mapped.filter(d => {
        const monthNum = parseLocalDate(d.date).getMonth() + 1
        return monthNum === month
      })
    } else {
      const weekStart = getWeekStartMonday(today)
      const weekStartStr = localYMD(weekStart)
      filtered = mapped.filter(d => d.date >= weekStartStr && d.date < todayStr)
    }

    chartData.value = filtered

    totalEarningsUSD.value = filtered.reduce((sum,d)=>sum+d.revenueUSD,0)
    totalEarningsBTC.value = Number(
      filtered.reduce(
        (sum, d) => sum + (d.revenueUSD / d.dailyBtcPrice),
        0
      ).toFixed(8)
    )

    const nonZeroPhs = filtered.filter(d=>d.avg_phs>0).map(d=>d.avg_phs)
    averagePhs.value = nonZeroPhs.length ? nonZeroPhs.reduce((a,b)=>a+b,0)/nonZeroPhs.length : 0

  } catch(err) {
    console.error('❌ Failed to load Braiins data:', err)
  }
}


const chartSeries = computed(() => [
  {
    name: 'Ingresos (USDT)',
    data: chartData.value.map(d => d.revenueUSD)
  }
])


// ----- Chart Options (tooltip updated) -----
const chartOptions = computed(() => {
  const maxRevenue = chartData.value.length ? Math.max(...chartData.value.map(d=>d.revenueUSD))*1.1 : 1
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const categories = chartData.value.map(d => {
    const dt = parseLocalDate(d.date)
    return selectedFilter.value === 'Semanal' ? diasSemana[dt.getDay()] : d.date
  })

  return {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, foreColor: '#6b7280' },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: { categories, labels:{rotate:-45, style:{fontSize:'12px'}}, title:{text:selectedFilter.value==='Semanal'?'Día de la semana':'Fecha'} },
    yaxis: { title:{text:'Ingresos (USDT)'}, min:0, max:maxRevenue, labels:{formatter:(val:number)=>`$${val.toLocaleString(undefined,{maximumFractionDigits:0})}`} },
    tooltip: {
      custom: ({dataPointIndex}:any) => {
        const d = chartData.value[dataPointIndex]
        if(!d) return ''
        return `<div style="padding:8px;">
          <b>${d.date}</b><br>
          Ingresos: <b>$${d.revenueUSD.toLocaleString(undefined,{maximumFractionDigits:2})}</b><br>
          Promedio de PH/s: <b>${d.avg_phs?.toFixed(2)||0}</b><br>
          Máquinas activas: <b>${d.active_workers ?? 0}</b><br>
          Precio BTC: <b>$${d.dailyBtcPrice.toLocaleString(undefined,{minimumFractionDigits:3, maximumFractionDigits:3})}</b><br>
        </div>`
      }
    },
    colors:['#3CB371'], legend:{show:false}
  }
})


// ----- Watchers -----
watch(selectedFilter, (newVal) => {
  if (newVal === 'Semanal') {
    // reset month to current (number)
    const now = new Date()
    selectedMonth.value = now.getMonth() + 1
  }
  loadBraiinsData()
}, { immediate: true })
watch(selectedMonth, () => loadBraiinsData())

</script>