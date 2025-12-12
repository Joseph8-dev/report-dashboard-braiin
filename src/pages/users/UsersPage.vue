<script setup lang="ts">
import { reactive } from 'vue'
import { VaCard, VaCardContent, VaInput, VaSelect, VaButton } from 'vuestic-ui'
import { useToast } from 'vuestic-ui'

const { init: notify } = useToast()

/* The form copies exactly the modal fields you had */
const formData = reactive({
  proveedor: "",
  wallet: "",
  red: "",
  monto: 0,
  txid: "",
  concepto: "",
})

const redOptions = [
  { text: "TRC20", value: "TRC20" },
  { text: "ERC20", value: "ERC20" },
]

/* Save function */
const saveForm2 = async () => {
  try {
    const payload = { ...formData }
    console.log("Saving:", payload)

    // Reset after Save
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
  } catch (err) {
    console.error(err)
    notify({
      message: "Ocurrió un error al guardar",
      color: "danger",
    })
  }
}


/* ADD ENTRY MANUALLY */
const saveForm = async () => {
  try {
    const payload = {
      proveedor: formData.proveedor,
      wallet: formData.wallet,
      red: formData.red,
      monto: formData.monto,
      txid: formData.txid,
      concepto: formData.concepto,
    };

    const res = await fetch("https://dev-sec.app/api/report-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success) return console.error("Error saving entry:", data);

    // Reset form
    formData.proveedor = "";
    formData.wallet = "";
    formData.red = "";
    formData.monto = 0;
    formData.txid = "";
    formData.concepto = "";
    notify({
      message: "Registro guardado correctamente",
      color: "success",
    });

  } catch (e) {
    console.error("Error adding entry:", e);
  }
};

</script>

<template>
  <h1 class="page-title">Agregar Registro</h1>

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
          label="Monto (USDT)"
          type="number"
          step="0.01"
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
          placeholder="Ingrese el concepto"
          required
        />


        <div class="flex justify-end gap-2 col-span-2 pt-3">
          <VaButton type="submit" color="primary">Guardar</VaButton>
        </div>
      </form>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
