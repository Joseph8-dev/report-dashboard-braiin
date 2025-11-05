<template>
  <canvas ref="canvas" style="max-width: 100%" />
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  ChartOptions,
  ChartData,
  ScriptableContext,
} from 'chart.js'
import { ChoroplethController, ProjectionScale, ColorScale, GeoFeature } from 'chartjs-chart-geo'

ChartJS.register(Title, Tooltip, Legend, CategoryScale, ChoroplethController, ProjectionScale, ColorScale, GeoFeature)

const canvas = ref<HTMLCanvasElement | null>(null)

interface FeatureValue {
  feature: any
  value: number
}

const props = defineProps<{
  options?: ChartOptions<'choropleth'>
  data: ChartData<'choropleth', FeatureValue[], string>
}>()

watchEffect(() => {
  if (!canvas.value || !props.data.datasets.length) return

  const ctx = canvas.value.getContext('2d')!
  const existing = ChartJS.getChart(ctx)
  if (existing) existing.destroy()

  const dataset = props.data.datasets[0]
  const values = dataset.data.map((d) => d.value)
  const maxValue = Math.max(...values, 1)

  // Assign base colors directly to each feature
  dataset.data.forEach((item) => {
    const value = item.value

    if (value === 0) {
      item.feature.properties.backgroundColor = '#dbe6f7' // very pale blue
    } else if (value < 500) {
      item.feature.properties.backgroundColor = '#99c2ff' // pale blue
    } else if (value < 1000) {
      item.feature.properties.backgroundColor = '#99c2ff' // medium-light blue
    } else if (value < 2000) {
      item.feature.properties.backgroundColor = '#4d94ff' // medium blue
    } else {
      item.feature.properties.backgroundColor = '#0066ff' // vibrant blue
    }
  })

  new ChartJS(ctx, {
    type: 'choropleth',
    data: props.data,
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (tooltipCtx) => {
              // safely cast tooltipCtx.raw
              const raw = tooltipCtx.raw as FeatureValue
              const name = raw.feature.properties.name
              const value = raw.value
              return `${name}: ${value} blocks`
            },
          },
        },
      },
      scales: {
        projection: {
          axis: 'x',
          projection: 'mercator',
          projectionScale: 1.6,
        },
        color: {
          axis: 'x',
          display: false,
          quantize: 5,
          interpolate: (val: number) => {
            const normalized = val / maxValue
            const blue = Math.floor(200 - normalized * 120)
            return `rgb(${blue}, ${blue + 20}, 255)`
          },
        },
      },
      elements: {
        geoFeature: {
          backgroundColor: (ctx: ScriptableContext<'choropleth'>) => {
            const raw = ctx.raw as FeatureValue
            return raw?.feature?.properties?.backgroundColor || '#dbe6f7'
          },
          borderColor: '#ffffff',
          borderWidth: 0.5,
        },
      },
      animation: false,
    },
  })
})
</script>
