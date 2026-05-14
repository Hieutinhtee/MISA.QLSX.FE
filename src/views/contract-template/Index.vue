<script setup>
import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import ContractTemplatesAPI from "@/apis/components/contract-templates/contractTemplatesAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import ContractTemplateForm from "./ContractTemplateForm.vue";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { exportSelectedRows } from "@/utils/exportService";

const columns = ref([
    { key: "templateCode", name: "Mã mẫu", typeFilter: "text", width: 160 },
    { key: "templateName", name: "Tên mẫu hợp đồng", typeFilter: "text", width: 260 },
    { key: "contractType", name: "Loại hợp đồng", typeFilter: "text", width: 180 },
    { key: "isActive", name: "Hoạt động", typeFilter: "status", width: 120 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 140 },
]);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(ContractTemplatesAPI);

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

async function handleSubmit(data) {
    try {
        if (typeForm.value === "edit" && selectedRow.value?.templateId) {
            await ContractTemplatesAPI.update(selectedRow.value.templateId, data);
            $toastSuccess("Cập nhật mẫu hợp đồng thành công");
        } else {
            await ContractTemplatesAPI.create(data);
            $toastSuccess("Thêm mẫu hợp đồng thành công");
        }

        isFormOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Lưu mẫu hợp đồng thất bại");
        console.error(error);
    }
}

async function handleBatchExport(rows) {
    try {
        await exportSelectedRows(ContractTemplatesAPI, rows, "ContractTemplates");
        $toastSuccess("Xuất excel mẫu hợp đồng thành công");
    } catch (error) {
        $toastError("Xuất excel mẫu hợp đồng thất bại");
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
            <div class="content__title">Mẫu hợp đồng</div>
            <ms-button icon-left="icon-add" @click="handleFormAddOpen">Thêm</ms-button>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                :loading="loading"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
                @edit-row="handleEdit"
                @batch-export="handleBatchExport"
                row-actions-name="Thao tác"
                :showActionMore="false"
            >
                <!-- Custom cell: isActive -->
                <template #isActive="{ row }">
                    <div class="d-flex justify-content-center w-100">
                        <span
                            class="status-badge"
                            :class="row.isActive ? 'status-badge--active' : 'status-badge--inactive'"
                        >
                            {{ row.isActive ? "Đang sử dụng" : "Ngừng sử dụng" }}
                        </span>
                    </div>
                </template>
            </ms-table>

            <contract-template-form
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

.status-badge {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    display: inline-block;
    text-align: center;
    min-width: 110px;
}

.status-badge--active {
    color: #09851a;
    background-color: #f6ffed;
    border: 1px solid #b7eb8f;
}

.status-badge--inactive {
    color: #ff4d4f;
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
}
</style>
