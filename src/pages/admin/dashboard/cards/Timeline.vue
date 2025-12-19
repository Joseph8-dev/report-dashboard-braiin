<template>
  <VaCard class="w-full">
    <VaCardTitle class="flex justify-between items-center">
      <h1 class="card-title text-secondary font-bold uppercase">
        Retiros
      </h1>

      <div class="flex items-center gap-2 w-[500px] justify-end">
        <VaSelect
          v-model="searchMonth"
          class="!w-32"
          :options="monthOptions"
          value-by="value"
          track-by="value"
          preset="large"
          teleported
        />
      
        <VaButton color="primary" @click="exportAsExcel" size="medium" preset="primary" class="w-32">
          Exportar
        </VaButton>
      </div>
    </VaCardTitle>

    <VaCardContent>
      <VaDataTable
        :items="pagedEntries"
        :columns="columns"
        :disable-client-side-sorting="true"
        hoverable
      >
        <template #cell(wallet)="{ value }">
          <span class="font-mono">{{ value }}</span>
        </template>

        <template #cell(txid)="{ rowData, value }">
          <span class="font-mono">
            {{ value || rowData?.txid || 'N/A' }}
          </span>
        </template>

        <template #cell(acciones)="{ rowData }">
          <VaButton
            preset="plain"
            icon="delete"
            color="danger"
            size="small"
            @click="deleteEntry(rowData as Entry)"
            title="Eliminar registro"
          />
        </template>

        <template #cell(monto_usdt)="{ value }">
          <span>
            {{ Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 }) }}
          </span>
        </template>
      </VaDataTable>

      <div v-if="entries.length > pageSize" class="flex justify-center mt-4">
        <VaSelect
          v-model="currentPage"
          label="Página"
          class="w-44"
          :options="pageOptions"
        />
      </div>
    </VaCardContent>

    <VaModal v-model="showAddModal" title="Agregar" hide-default-actions>
      <form @submit.prevent="addEntry" class="form-grid">

        <VaInput
          v-model="formData.proveedor"
          label="Proveedor"
          placeholder="Introduzca el proveedor"
          required
        />

        <VaInput
          v-model="formData.wallet"
          label="Wallet"
          placeholder="Dirección de la wallet"
          required
        />

        <VaSelect
          v-model="formData.red"
          label="Red"
          placeholder="Selecciona una red"
          :options="redOptions"
          track-by="value"
          value-by="value"
          required
        />

        <VaInput
          v-model="formData.txid"
          label="TxID"
          placeholder="ID de transacción"
          required
        />

        <VaInput
          v-model.number="formData.monto"
          label="Monto (BTC)"
          type="number"
          step="0.00000001"
          required
        />

        <div class="flex justify-end gap-2 pt-3">
          <VaButton preset="secondary" @click="showAddModal = false">
            Cancelar
          </VaButton>

          <VaButton type="submit">
            Guardar
          </VaButton>
        </div>
      </form>
    </VaModal>
  </VaCard>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from "vue";
import {
  VaCard,
  VaCardTitle,
  VaCardContent,
  VaDataTable,
  VaModal,
  VaInput,
  VaButton,
  VaSelect,
} from "vuestic-ui";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface Entry {
  id: number;
  proveedor: string;
  wallet: string;
  red: string;
  monto: number;
  monto_usdt?: number;
  txid: string;
  timestamp: string;
  concepto: string;
}

const entries = ref<Entry[]>([]);
const currentPage = ref(1);
const pageSize = 30;
const showAddModal = ref(false);

const searchMonth = ref(new Date().getMonth() + 1);
const searchYear = ref(new Date().getFullYear());

const columns = [
  { key: "proveedor", label: "Proveedor" },
  { key: "wallet", label: "Wallet" },
  { key: "red", label: "Red" },
  { key: "monto", label: "Monto (BTC)" },
  { key: "monto_usdt", label: "Monto (USDT)" },
  { key: "txid", label: "TxID" }, 
  { key: "concepto", label: "Concepto" },
  { key: "timestamp", label: "Fecha" },
  { key: "acciones", label: "" },
];

const monthOptions = [
  { text: "Enero", value: 1 },
  { text: "Febrero", value: 2 },
  { text: "Marzo", value: 3 },
  { text: "Abril", value: 4 },
  { text: "Mayo", value: 5 },
  { text: "Junio", value: 6 },
  { text: "Julio", value: 7 },
  { text: "Agosto", value: 8 },
  { text: "Septiembre", value: 9 },
  { text: "Octubre", value: 10 },
  { text: "Noviembre", value: 11 },
  { text: "Diciembre", value: 12 },
];

const redOptions = [
  { text: "TRC20", value: "TRC20" },
  { text: "ERC20", value: "ERC20" },
];

const formData = reactive({
  proveedor: "",
  wallet: "",
  red: "",
  monto: 0,
  txid: "",
  concepto: "",
});

const fetchTransactions = async () => {
  const url = `https://dev-sec.app/api/report-transactions-history?month=${searchMonth.value}&year=${searchYear.value}`;
  const res = await fetch(url);
  const data = await res.json();

  entries.value = data.map((item: any) => ({
    id: item.id,
    proveedor: item.name_prov,
    wallet: item.wallet,
    red: item.red,
    monto: Number(item.monto),
    monto_usdt: Number(item.monto_usdt ?? 0),
    txid: item.tx_id || item.txid || "N/A",
    concepto: item.concepto,
    timestamp: item.date ?? "",
  }));

  currentPage.value = 1;
};

onMounted(fetchTransactions);
watch(searchMonth, fetchTransactions);

const addEntry = async () => {
  const payload = {
    proveedor: formData.proveedor,
    wallet: formData.wallet,
    red: formData.red,
    monto: formData.monto,
    txid: formData.txid,
  };

  await fetch("https://dev-sec.app/api/report-transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await fetchTransactions();
  Object.assign(formData, { proveedor: "", wallet: "", red: "", monto: 0, txid: "" });
  showAddModal.value = false;
};

const deleteEntry = async (entry: Entry) => {
  if (!confirm(`¿Eliminar retiro ID ${entry.id}?`)) return;

  await fetch(`https://dev-sec.app/api/report-transactions/${entry.id}`, {
    method: "DELETE",
  });

  entries.value = entries.value.filter(e => e.id !== entry.id);
};

const totalPages = computed(() => Math.ceil(entries.value.length / pageSize));

const pageOptions = computed(() =>
  Array.from({ length: totalPages.value }, (_, i) => ({
    text: `Página ${i + 1} de ${totalPages.value}`,
    value: i + 1,
  }))
);

const pagedEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return entries.value.slice(start, start + pageSize);
});

/* EXPORT TO EXCEL */
const exportAsExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Retiros");

  sheet.addRow([
    "Fecha",
    "Proveedor",
    "Wallet",
    "Red",
    "Monto (BTC)",
    "Monto (USDT)",
    "TxID",
    "Concepto",
  ]);

  entries.value.forEach(d => {
    sheet.addRow([
      d.timestamp,
      d.proveedor,
      d.wallet,
      d.red,
      d.monto,
      d.monto_usdt,
      d.txid,
      d.concepto,
    ]);
  });

  const totalBTC = entries.value.reduce((s, d) => s + Number(d.monto || 0), 0);
  const totalUSDT = entries.value.reduce((s, d) => s + Number(d.monto_usdt || 0), 0);

  const totalRow = sheet.addRow([
    "TOTALES",
    "",
    "",
    "",
    totalBTC,
    totalUSDT.toFixed(2),
  ]);
  totalRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Reporte-retiros-${new Date().toISOString().slice(0, 10)}.xlsx`);
};
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
}
.va-data-table td:nth-child(2),
.va-data-table td:nth-child(6) {
  white-space: nowrap;
}
</style>
