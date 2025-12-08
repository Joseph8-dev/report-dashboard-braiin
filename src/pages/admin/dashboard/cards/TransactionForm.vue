<template>
  <VaCard>
    <VaCardTitle class="flex justify-between">
      <h1 class="card-title text-secondary font-bold uppercase">
        Registro de Transacciones
      </h1>
    </VaCardTitle>

    <VaCardContent>
      <form @submit.prevent="addEntry" class="form-grid">

        <!-- PROVEEDOR -->
        <VaInput
          v-model="formData.proveedor"
          label="Proveedor"
          placeholder="Ej: Binance, KuCoin, OKX"
          required
        />

        <!-- WALLET (NEW FIELD) -->
        <VaInput
          v-model="formData.wallet"
          label="Wallet"
          placeholder="Ej: 0x123..."
          required
        />

        <!-- RED (RENAMED FROM OLD WALLET FIELD) -->
        <VaSelect
          v-model="formData.red"
          label="Red"
          placeholder="Selecciona la red"
          :options="redOptions"
          track-by="value"
          required
        />

        <!-- TXID (NEW FIELD) -->
        <VaInput
          v-model="formData.txid"
          label="Txid"
          placeholder="Transaction Hash"
          required
        />

        <!-- MONTO USDT -->
        <VaInput
          v-model.number="formData.monto"
          label="Monto (USDT)"
          type="number"
          :rules="montoRules"
          step="0.01"
          required
        />

        <div class="flex justify-end pt-2">
          <VaButton type="submit" icon="add" :disabled="!isFormValid">
            Agregar Entrada
          </VaButton>
        </div>
      </form>

      <VaDivider class="my-4" />

      <h2 class="text-lg font-semibold mb-3">Entradas Registradas</h2>
      <p class="va-text-secondary text-center py-4">
        Las transacciones aparecerán en el Timeline.
      </p>
    </VaCardContent>
  </VaCard>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import {
  VaCard,
  VaCardTitle,
  VaCardContent,
  VaInput,
  VaSelect,
  VaButton,
  VaDivider
} from 'vuestic-ui'

const emit = defineEmits(['new-entry'])

interface Entry {
  proveedor: string
  wallet: string
  red: string
  txid: string
  monto: number
}

// Redes blockchain
const redOptions = [
  { text: 'TRC20', value: 'TRC20' },
  { text: 'ERC20', value: 'ERC20' },
]

// Initial values
const initialFormData: Entry = {
  proveedor: '',
  wallet: '',
  red: '',
  txid: '',
  monto: 0,
}

const formData = reactive<Entry>({ ...initialFormData })

// Validation
const montoRules = [
  (v: any): true | string => {
    if (!v || Number(v) <= 0) return 'El monto debe ser mayor a 0'
    return true
  },
]

const isFormValid = computed(() => {
  return (
    formData.proveedor.trim() !== '' &&
    formData.wallet.trim() !== '' &&
    formData.red !== '' &&
    formData.txid.trim() !== '' &&
    formData.monto > 0
  )
})

const addEntry = () => {
  if (!isFormValid.value) return

  emit('new-entry', { ...formData })

  Object.assign(formData, initialFormData)
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  align-items: end;
}
</style>
