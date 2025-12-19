<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { VaCard, VaCardContent, VaInput, VaSelect, VaButton } from 'vuestic-ui'
import { useToast } from 'vuestic-ui'

const { init: notify } = useToast()

// ==================== FORM DATA ====================
const formData = reactive({
  proveedor: "",
  wallet: "",
  red: "",
  monto: "",       // BTC as string
  txid: "",
  concepto: "",
})

const redOptions = [
  { text: "TRC20", value: "TRC20" },
  { text: "ERC20", value: "ERC20" },
]

// ==================== BTC PRICE ====================
const btcPriceToday = ref<number>(0)

async function fetchBTCPrice(): Promise<number> {
  try {
    const res = await fetch('https://dev-sec.app/api/price-stats-old')
    const { data } = await res.json()
    if (!data?.price) throw new Error('Invalid BTC price data')
    return Number(data.price)
  } catch (err) {
    console.error('❌ Error fetching BTC price:', err)
    return 0
  }
}

onMounted(async () => {
  btcPriceToday.value = await fetchBTCPrice()
})

// ==================== PARSED BTC ====================
const parsedBTC = computed(() => {
  if (!formData.monto) return 0
  const value = Number(formData.monto.replace(',', '.'))
  return isNaN(value) ? 0 : value
})

// ==================== LIVE BTC → USDT ====================
const usdtConverted = computed(() => {
  if (!btcPriceToday.value || !parsedBTC.value) return 0
  return parsedBTC.value * btcPriceToday.value
})

// ==================== SAVE FORM ====================
const saveForm = async () => {
  const btcRegex = /^[0-9]*[.,]?[0-9]+$/

  if (!btcRegex.test(formData.monto)) {
    notify({
      message: "El monto BTC solo puede contener números y decimales",
      color: "danger",
    })
    return
  }

  if (!parsedBTC.value || parsedBTC.value <= 0) {
    notify({
      message: "El monto BTC debe ser mayor que 0",
      color: "danger",
    })
    return
  }

  const monto_usdt = Number(usdtConverted.value.toFixed(2))

  try {
    const payload = {
      proveedor: formData.proveedor,
      wallet: formData.wallet,
      red: formData.red,
      monto: parsedBTC.value,
      monto_usdt,
      txid: formData.txid,
      concepto: formData.concepto,
    }

    const res = await fetch("https://dev-sec.app/api/report-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!data.success) {
      notify({
        message: "Error al guardar el registro",
        color: "danger",
      })
      return
    }

    // Reset form
    formData.proveedor = ""
    formData.wallet = ""
    formData.red = ""
    formData.monto = ""
    formData.txid = ""
    formData.concepto = ""

    notify({
      message: "Registro guardado correctamente",
      color: "success",
    })
  } catch (e) {
    console.error("Error adding entry:", e)
    notify({
      message: "Ocurrió un error al guardar",
      color: "danger",
    })
  }
}
</script>

<template>
  <h1 class="page-title">Agregar Registro</h1>

  <!-- ==================== BTC PRICE & CONVERSION ==================== -->
  <VaCard class="mb-4">
    <VaCardContent class="flex flex-col gap-1">
      <p class="text-sm text-secondary font-semibold">
        Precio BTC de hoy
      </p>

      <p class="text-lg font-bold">
        1 BTC =
        <span v-if="btcPriceToday">
          {{ btcPriceToday.toLocaleString() }} USDT
        </span>
        <span v-else>
          Cargando...
        </span>
      </p>

      <p v-if="parsedBTC > 0" class="text-sm mt-2">
        <b>{{ parsedBTC }}</b> BTC =
        <b>
          {{ usdtConverted.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}
        </b> USDT
      </p>
    </VaCardContent>
  </VaCard>

  <!-- ==================== FORM ==================== -->
  <VaCard>
    <VaCardContent>
      <form @submit.prevent="saveForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <VaInput
          v-model="formData.proveedor"
          label="Proveedor"
          placeholder="Introduzca el proveedor"
          required
        />

        <VaInput
          v-model="formData.wallet"
          label="Wallet"
          placeholder="Dirección de wallet"
          required
        />

        <VaSelect
          v-model="formData.red"
          label="Red"
          :options="redOptions"
          track-by="value"
          value-by="value"
          required
        />

        <VaInput
          v-model="formData.monto"
          label="Monto (BTC)"
          type="text"
          inputmode="decimal"
          placeholder="0.00000000"
          required
        />

        <VaInput
          v-model="formData.txid"
          label="TxID"
          placeholder="ID de transacción"
          required
        />

        <VaInput
          v-model="formData.concepto"
          label="Concepto"
          placeholder="Introduzca el concepto"
          required
        />

        <div class="flex justify-end gap-2 col-span-2 pt-3">
          <VaButton type="submit" color="primary">
            Guardar
          </VaButton>
        </div>

      </form>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
