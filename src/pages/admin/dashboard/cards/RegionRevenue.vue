<template>
  <VaCard>
    <VaCardTitle class="flex justify-between">
      <h1 class="card-title text-secondary font-bold uppercase">Revenue by Top Regions</h1>
    </VaCardTitle>
    <VaCardContent class="flex flex-col gap-1">
      <VaDataTable
        class="region-revenue-table"
        :columns="[
          { key: 'name', label: 'Region' },
          { key: 'blocks', label: 'Blocks Mined', align: 'right' },
        ]"
        :items="tableData"
      />
    </VaCardContent>
  </VaCard>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface CountryAPI {
  code: string
  label: string
  blocks_mined: number
  pools?: { name: string; blocks_mined: number }[]
}

const apiData = ref<CountryAPI[]>([])

const tableData = computed(() => {
  return apiData.value.map((c) => {
    console.log('Table row:', c.label, c.blocks_mined)
    return {
      name: c.label,
      blocks: c.blocks_mined || 0,
    }
  })
})

onMounted(async () => {
  try {
    const res = await fetch('https://dev-sec.app/api/blocks-by-country')
    if (!res.ok) throw new Error('Failed to fetch blocks by country')
    apiData.value = await res.json()
  } catch (err) {
    console.error('Error fetching blocks by country:', err)
  }
})
</script>

<style lang="scss" scoped>
.region-revenue-table {
  ::v-deep(tbody) {
    tr {
      border-top: 1px solid var(--va-background-border);
    }
  }
}
</style>
