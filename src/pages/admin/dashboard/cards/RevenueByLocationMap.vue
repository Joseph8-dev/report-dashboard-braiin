<template>
  <VaCard class="flex flex-col relative">
    <VaCardTitle class="flex items-center justify-between">
      <h1 class="card-title text-secondary font-bold uppercase">Revenue by location</h1>
    </VaCardTitle>
    <VaCardContent class="flex-1 flex overflow-hidden relative">
      <VaAspectRatio class="w-full md:min-h-72 overflow-hidden relative flex items-center">
        <!-- Only show map when geoJson AND apiData are loaded -->
        <Map
          v-if="geoJson && apiData.length"
          :data="data"
          class="dashboard-map flex-1 h-full"
        />
        <VaProgressCircle
          v-else
          indeterminate
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />

        <!-- Overlay Unknown notation -->
        <div
          v-if="unknownBlocks > 0"
          class="absolute bottom-2 left-2 bg-white/80 text-xs text-gray-800 px-2 py-1 rounded shadow"
        >
          Unknown: {{ unknownBlocks }} blocks
        </div>
      </VaAspectRatio>
    </VaCardContent>
  </VaCard>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { VaCard, VaProgressCircle } from 'vuestic-ui'
import type countriesGeoJSON from '../../../../data/geo.json'
import Map from '../../../../components/va-charts/chart-types/Map.vue'
import type { ChartData } from 'chart.js'

interface CountryAPI {
  code: string
  label: string
  blocks_mined: number
}

const geoJson = ref<typeof countriesGeoJSON | null>(null)
const apiData = ref<CountryAPI[]>([])

// Optional mapping if API codes differ from geoJSON iso_a2
const codeMapping: Record<string, string> = {
  cn: 'CN',
  us: 'US',
  jp: 'JP',
  cz: 'CZ',
  sg: 'SG',
  lt: 'LT',
  // add more if needed
}

onMounted(async () => {
  geoJson.value = (await import('../../../../data/geo.json')).default
  console.log('✅ GeoJSON loaded:', geoJson.value.features.length, 'features')

  try {
    const res = await fetch('https://dev-sec.app/api/blocks-by-country')
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`)
    apiData.value = await res.json()
    console.log('📊 API data stored:', apiData.value.length, 'countries')
  } catch (err) {
    console.error('❌ Error fetching blocks by country:', err)
  }
})

// Map geoJSON feature to blocks mined
const getBlocks = (feature: any) => {
  const iso = feature.properties.iso_a2?.toUpperCase()
  if (!iso) return 0

  const country = apiData.value.find(c => {
    const mappedCode = codeMapping[c.code.toLowerCase()] || c.code.toUpperCase()
    return mappedCode === iso
  })

  if (!country) return 0
  return country.blocks_mined || 0
}

// Compute total Unknown blocks
const unknownBlocks = computed(() => {
  return apiData.value
    .filter(c => c.code.toLowerCase() === 'unknown')
    .reduce((sum, c) => sum + (c.blocks_mined || 0), 0)
})

// Prepare chart data
const data = computed<ChartData<'choropleth', { feature: any; value: number }[], string>>(() => {
  if (!geoJson.value || !apiData.value.length) return { labels: [], datasets: [] }

  const values = geoJson.value.features.map(f => getBlocks(f))
  const maxValue = Math.max(...values, 1) // avoid divide by zero

  return {
    labels: geoJson.value.features.map(f => f.properties.name),
    datasets: [
      {
        label: 'Countries',
        data: geoJson.value.features.map(f => {
          const value = getBlocks(f)
          const intensity = value / maxValue
          const color = `rgba(0, 0, 255, ${Math.max(0.2, intensity)})`
          return { feature: f, value, backgroundColor: color }
        }),
      },
    ],
  }
})
</script>

<style scoped lang="scss">
.va-card--flex {
  display: flex;
  flex-direction: column;
}
</style>
