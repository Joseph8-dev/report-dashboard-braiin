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
  monto: 0,      // BTC amount
  txid: "",
  concepto: "",
})

const redOptions = [
  { text: "TRC20", value: "TRC20" },
  { text: "ERC20", value: "ERC20" },
]

// ==================== BTC PRICE (REUSED FROM DASHBOARD) ====================
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

// ==================== LIVE CONVERSION BTC → USDT ====================
const usdtConverted = computed(() => {
  if (!btcPriceToday.value || !formData.monto) return 0
  return formData.monto * btcPriceToday.value
})

// ==================== SAVE FORM ====================
const saveForm = async () => {

  // 🔹 Freeze USDT value at submit time
    const monto_usdt = Number(
      usdtConverted.value.toFixed(2)
    )

    
  try {
    const payload = {
      proveedor: formData.proveedor,
      wallet: formData.wallet,
      red: formData.red,
      monto: formData.monto,
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
      console.error("Error saving entry:", data)
      return
    }

    // Reset form
    formData.proveedor = ""
    formData.wallet = ""
    formData.red = ""
    formData.monto = 0
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

  <!-- ==================== BTC PRICE & CONVERSION CARD ==================== -->
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
        <span v-else> Cargando... </span>
      </p>

      <p v-if="formData.monto > 0" class="text-sm mt-2">
        <b>{{ formData.monto }}</b> BTC =
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
          v-model.number="formData.monto"
          label="Monto (BTC)"
          type="number"
          step="0.00000001"
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
