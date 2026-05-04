<script setup>
import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import PositionForm from "./PositionForm.vue";
import PositionsAPI from "@/apis/components/positions/positionsAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { exportSelectedRows } from "@/utils/exportService";

const columns = ref([
    { key: "positionCode", name: "Mã chức vụ", typeFilter: "text", width: 180 },
    { key: "positionName", name: "Tên chức vụ", typeFilter: "text", width: 260 },
    { key: "allowance", name: "Phụ cấp (VNĐ)", type: "number", width: 160 },
    { key: "description", name: "Mô tả", typeFilter: "text", width: 280 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 140 },
]);

const positionFormRef = ref(null);
const positionTableRef = ref(null);

const isFormOpen = ref(false);
const typeForm = ref("add");
const selectedRow = ref(null);
const selectedRows = ref(null);

const isOpenModal = ref(false);
const formText = ref("");

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(PositionsAPI);

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

function handleDelete(row) {
    selectedRow.value = row;
    formText.value = "Chức vụ <strong>" + row.positionCode + "</strong>";
    isOpenModal.value = true;
}

function handleBatchDelete(rows) {
    selectedRows.value = rows;
    formText.value = "Các <strong>chức vụ</strong>";
    isOpenModal.value = true;
}

async function handleSubmit(data) {
    try {
        if (typeForm.value === "edit" && selectedRow.value?.positionId) {
            await PositionsAPI.update(selectedRow.value.positionId, data);
            $toastSuccess("Cập nhật chức vụ thành công");
        } else {
            await PositionsAPI.create(data);
            $toastSuccess("Thêm chức vụ thành công");
        }

        isFormOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Lưu chức vụ thất bại");
        console.error(error);
    }
}

async function deletePositions(ids) {
    try {
        await PositionsAPI.delete(ids);
        $toastSuccess("Xóa chức vụ thành công");

        isOpenModal.value = false;
        selectedRow.value = null;
        selectedRows.value = null;

        positionTableRef.value?.clearChecked();
        await loadDataForAPI();
    } catch (error) {
        $toastError("Xóa chức vụ thất bại");
        console.error(error);
    }
}

function handleConfirmDelete() {
    if (selectedRow.value?.positionId) {
        deletePositions([selectedRow.value.positionId]);
        return;
    }

    if (selectedRows.value?.length) {
        deletePositions(selectedRows.value);
    }
}

async function handleBatchExport(rows) {
    try {
        await exportSelectedRows(PositionsAPI, rows, "Positions");
        $toastSuccess("Xuất excel chức vụ thành công");
    } catch (error) {
        $toastError("Xuất excel chức vụ thất bại");
        console.error(error);
    }
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <ms-alert
        v-model="isOpenModal"
        title="Xác nhận xóa"
        :showConfirm="true"
        @confirm="handleConfirmDelete"
    >
        <span v-html="formText"></span>
        sau khi bị xóa sẽ không thể khôi phục. Bạn có muốn tiếp tục xóa không?
    </ms-alert>

    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex">
            <div class="content__title">Chức vụ</div>
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
                @delete-row="handleDelete"
                @batch-delete="handleBatchDelete"
                @batch-export="handleBatchExport"
                row-actions-name="Thao tác"
                ref="positionTableRef"
            />

            <position-form
                v-model="isFormOpen"
                :typeForm="typeForm"
                :data="selectedRow"
                @submit="handleSubmit"
                ref="positionFormRef"
            />
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";
</style>
