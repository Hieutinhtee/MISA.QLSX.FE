<script setup>
import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import AllowanceForm from "./AllowanceForm.vue";
import AllowancesAPI from "@/apis/components/allowances/allowancesAPI";
import { $toastSuccess, $toastError } from "@/utils/toastService";
import { usePagingTable } from "@/composables/usePagingTable";
import { exportSelectedRows } from "@/utils/exportService";

const columns = ref([
    { key: "allowanceCode", name: "Mã phụ cấp", typeFilter: "text", width: 150 },
    { key: "allowanceName", name: "Tên phụ cấp", typeFilter: "text", width: 200 },
    { key: "calculationType", name: "Kiểu tính", typeFilter: "text", width: 120 },
    { key: "amount", name: "Số tiền", typeFilter: "number", width: 150 },
    { key: "percent", name: "Phần trăm", typeFilter: "number", width: 120 },
    { key: "createdAt", name: "Ngày tạo", width: 150, type: "date" },
    { key: "updatedAt", name: "Ngày sửa", width: 150, type: "date" },
]);

const allowanceFormRef = ref(null);
const allowanceTableRef = ref(null);
const isOpenModal = ref(false);
const formText = ref("");
const typeForm = ref("add");
const isFormOpen = ref(false);
const selectedRow = ref(null);
const selectedRows = ref(null);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(AllowancesAPI);

const handleSubmit = (allowance) => {
    if (typeForm.value === "add" || typeForm.value === "duplicate") {
        try {
            addAllowance(allowance);
        } catch (error) {
            $toastError("Có lỗi xảy ra khi thêm phụ cấp");
            console.log(error);
        }
    }
    if (typeForm.value === "edit") {
        try {
            updateAllowance(allowance);
        } catch (error) {
            $toastError("Có lỗi xảy ra khi cập nhật phụ cấp");
            console.log(error);
        }
    }
};

const handleSubmitAndAdd = (allowance) => {
    try {
        addAllowance(allowance, true);
    } catch (error) {
        $toastError("Có lỗi xảy ra khi thêm phụ cấp");
        console.log(error);
    }
};

function addAllowance(allowance, isSaveAndAdd = false) {
    AllowancesAPI.create(allowance).then((res) => {
        if (res.status === 201 || res.status === 200) {
            const newAllowance = res.data.data || allowance;
            newAllowance.allowanceId = res.data.id;
            newAllowance.createdAt = new Date().toISOString();
            newAllowance.updatedAt = new Date().toISOString();
            rows.value.unshift(newAllowance);

            if (rows.value.length > payload.pageSize) {
                rows.value.pop();
            }

            payload.totalRows++;
            $toastSuccess("Thêm phụ cấp thành công");
            allowanceFormRef.value?.handleCloseForm();
            if (isSaveAndAdd) {
                typeForm.value = "add";
                isFormOpen.value = true;
            }
        }
    });
}

function updateAllowance(allowance) {
    AllowancesAPI.update(allowance.allowanceId, allowance)
        .then((res) => {
            if (res.status === 201 || res.status === 200) {
                const index = rows.value.findIndex((x) => x.allowanceId === allowance.allowanceId);
                if (index !== -1) {
                    rows.value[index] = { ...allowance };
                }
                $toastSuccess("Cập nhật phụ cấp thành công");
                allowanceFormRef.value?.handleCloseForm();
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

function deleteAllowance(allowance) {
    let ids = allowance;
    if (!Array.isArray(allowance)) {
        ids = [allowance];
    }

    AllowancesAPI.delete(ids).then((res) => {
        if (res.status === 201 || res.status === 200) {
            rows.value = rows.value.filter((row) => !ids.includes(row.allowanceId));
            payload.totalRows -= ids.length;
            isOpenModal.value = false;
            selectedRow.value = null;
            selectedRows.value = null;
            $toastSuccess("Xóa phụ cấp thành công");
        }
    });
}

function handleDelete(row) {
    formText.value = "Phụ cấp <strong>" + row.allowanceCode + "</strong>";
    selectedRow.value = row;
    isOpenModal.value = true;
}

function handleBatchDelete(rows) {
    formText.value = "Các <strong>Phụ cấp</strong>";
    isOpenModal.value = true;
    selectedRows.value = rows;
}

const handleConfirmDelete = () => {
    if (selectedRow.value) {
        deleteAllowance(selectedRow.value.allowanceId);
        allowanceTableRef.value?.clearChecked();
    }
    if (selectedRows.value) {
        deleteAllowance(selectedRows.value);
        allowanceTableRef.value?.clearChecked();
    }
};

function handleEdit(row) {
    typeForm.value = "edit";
    isFormOpen.value = true;
    selectedRow.value = row;
}

function handleFormAddOpen() {
    typeForm.value = "add";
    isFormOpen.value = true;
}

function handleDuplicate(row) {
    typeForm.value = "duplicate";
    selectedRow.value = row;
    isFormOpen.value = true;
}

async function handleBatchExport(rows) {
    try {
        await exportSelectedRows(AllowancesAPI, rows, "Allowances");
        $toastSuccess("Xuất excel phụ cấp thành công");
    } catch (error) {
        $toastError("Xuất excel phụ cấp thất bại");
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
            <div class="content__title">Phụ cấp</div>
            <ms-button icon-left="icon-add" @click="handleFormAddOpen">Thêm</ms-button>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
                @delete-row="handleDelete"
                @edit-row="handleEdit"
                @batch-delete="handleBatchDelete"
                @batch-export="handleBatchExport"
                @duplicate="handleDuplicate"
                row-actions-name="Thao tác"
                :loading="loading"
                ref="allowanceTableRef"
            >
                <template #calculationType="{ value }">
                    <span v-if="value === 'FIXED'">Cố định</span>
                    <span v-else-if="value === 'PERCENT'">Phần trăm</span>
                    <span v-else>{{ value }}</span>
                </template>
            </ms-table>

            <allowance-form
                v-model="isFormOpen"
                :typeForm="typeForm"
                @submit="handleSubmit"
                @submit-and-add="handleSubmitAndAdd"
                ref="allowanceFormRef"
                :data="selectedRow"
            ></allowance-form>
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";
</style>
