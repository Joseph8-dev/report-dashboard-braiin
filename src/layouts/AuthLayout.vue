<template>
  <VaLayout class="h-screen bg-[var(--va-background-secondary)]">
    <template #content>
      <main class="h-full flex items-center justify-center mx-auto max-w-[420px] p-4">
        <RouterView />
      </main>
    </template>
  </VaLayout>
</template>

<script lang="ts" setup>
import { useBreakpoint } from 'vuestic-ui'

const breakpoint = useBreakpoint()
</script>

<style scoped>
/* Optional: ensure full height and background color */
html, body {
  height: 100%;
  margin: 0;
}

body {
  background-color: var(--va-background-secondary);
}
</style>
