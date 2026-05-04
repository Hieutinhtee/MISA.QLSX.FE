<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import ContractsAPI from "@/apis/components/contracts/contractsAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import ContractForm from "./ContractForm.vue";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { exportSelectedRows } from "@/utils/exportService";

const router = useRouter();

const columns = ref([
    { key: "contractCode", name: "Mã hợp đồng", typeFilter: "text", width: 160 },
    { key: "templateCode", name: "Mã mẫu", typeFilter: "text", width: 140 },
    { key: "templateName", name: "Tên mẫu", typeFilter: "text", width: 220 },
    { key: "contractType", name: "Loại hợp đồng", typeFilter: "text", width: 170 },
    { key: "employeeCode", name: "Mã nhân viên", typeFilter: "text", width: 160 },
    { key: "employeeName", name: "Nhân viên", typeFilter: "text", width: 220 },
    { key: "companyRepresentativeName", name: "Đại diện công ty", typeFilter: "text", width: 220 },
    { key: "companySignerTitle", name: "Chức danh ký", typeFilter: "text", width: 180 },
    { key: "effectiveDate", name: "Ngày hiệu lực", type: "date", width: 140 },
    { key: "termMonths", name: "Thời hạn (tháng)", typeFilter: "number", width: 150 },
    { key: "baseSalary", name: "Lương cơ bản", typeFilter: "number", width: 150 },
    { key: "insuranceSalary", name: "Lương BH", typeFilter: "number", width: 150 },
    { key: "salaryRatio", name: "Tỷ lệ lương", typeFilter: "number", width: 140 },
    { key: "isSigned", name: "Đã ký", typeFilter: "status", width: 110 },
    { key: "signedAt", name: "Thời điểm ký", type: "date", width: 150 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 140 },
]);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(ContractsAPI);

const isFormOpen = ref(false);
const typeForm = ref("add");
const selectedRow = ref(null);

function handleFormAddOpen() {
    typeForm.value = "add";
    selectedRow.value = null;
    isFormOpen.value = true;
}

function handleEdit(row) {
    typeForm.value = "edit";
    selectedRow.value = row;
    isFormOpen.value = true;
}

function handleViewDetail(row) {
    router.push(`/contracts/${row.contractId}`);
}

async function handleSubmit(data) {
    try {
        if (typeForm.value === "edit" && selectedRow.value?.contractId) {
            await ContractsAPI.update(selectedRow.value.contractId, data);
            $toastSuccess("Cập nhật hợp đồng thành công");
        } else {
            await ContractsAPI.create(data);
            $toastSuccess("Thêm hợp đồng thành công");
        }

        isFormOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Lưu hợp đồng thất bại");
        console.error(error);
    }
}

async function handleBatchExport(rows) {
    try {
        await exportSelectedRows(ContractsAPI, rows, "Contracts");
        $toastSuccess("Xuất excel hợp đồng thành công");
    } catch (error) {
        $toastError("Xuất excel hợp đồng thất bại");
        console.error(error);
    }
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex">
            <div class="content__title">Hợp đồng nhân viên</div>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                :loading="loading"
                row-actions-name="Thao tác"
                :row-column-width="100"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
                @edit-row="handleEdit"
                @batch-export="handleBatchExport"
            >
                <template #row-actions="{ row }">
                    <ms-button type="primary" size="small" @click="handleViewDetail(row)">
                        Xem
                    </ms-button>
                </template>
            </ms-table>

            <contract-form
                v-model="isFormOpen"
                :typeForm="typeForm"
                :data="selectedRow"
                @submit="handleSubmit"
            />
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";
</style>
