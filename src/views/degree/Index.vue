<script setup>
import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import DegreeForm from "./DegreeForm.vue";
import DegreesAPI from "@/apis/components/degrees/degreesAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { exportSelectedRows } from "@/utils/exportService";

const columns = ref([
    { key: "degreeCode", name: "Mã bằng cấp", typeFilter: "text", width: 180 },
    { key: "degreeName", name: "Tên bằng cấp", typeFilter: "text", width: 260 },
    { key: "description", name: "Mô tả", typeFilter: "text", width: 300 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 140 },
]);

const degreeFormRef = ref(null);
const degreeTableRef = ref(null);

const isFormOpen = ref(false);
const typeForm = ref("add");
const selectedRow = ref(null);
const selectedRows = ref(null);

const isOpenModal = ref(false);
const formText = ref("");

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(DegreesAPI);

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
    formText.value = "Bằng cấp <strong>" + row.degreeCode + "</strong>";
    isOpenModal.value = true;
}

function handleBatchDelete(rows) {
    selectedRows.value = rows;
    formText.value = "Các <strong>bằng cấp</strong>";
    isOpenModal.value = true;
}

async function handleSubmit(data) {
    try {
        if (typeForm.value === "edit" && selectedRow.value?.degreeId) {
            await DegreesAPI.update(selectedRow.value.degreeId, data);
            $toastSuccess("Cập nhật bằng cấp thành công");
        } else {
            await DegreesAPI.create(data);
            $toastSuccess("Thêm bằng cấp thành công");
        }

        isFormOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Lưu bằng cấp thất bại");
        console.error(error);
    }
}

async function deleteDegrees(ids) {
    try {
        await DegreesAPI.delete(ids);
        $toastSuccess("Xóa bằng cấp thành công");

        isOpenModal.value = false;
        selectedRow.value = null;
        selectedRows.value = null;

        degreeTableRef.value?.clearChecked();
        await loadDataForAPI();
    } catch (error) {
        $toastError("Xóa bằng cấp thất bại");
        console.error(error);
    }
}

function handleConfirmDelete() {
    if (selectedRow.value?.degreeId) {
        deleteDegrees([selectedRow.value.degreeId]);
        return;
    }

    if (selectedRows.value?.length) {
        deleteDegrees(selectedRows.value);
    }
}

async function handleBatchExport(rows) {
    try {
        await exportSelectedRows(DegreesAPI, rows, "Degrees");
        $toastSuccess("Xuất excel bằng cấp thành công");
    } catch (error) {
        $toastError("Xuất excel bằng cấp thất bại");
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
            <div class="content__title">Bằng cấp</div>
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
                ref="degreeTableRef"
            />

            <degree-form
                v-model="isFormOpen"
                :typeForm="typeForm"
                :data="selectedRow"
                @submit="handleSubmit"
                ref="degreeFormRef"
            />
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";
</style>
