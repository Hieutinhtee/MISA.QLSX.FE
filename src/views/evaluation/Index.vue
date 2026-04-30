<script setup>
import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import EvaluationForm from "./EvaluationForm.vue";
import EvaluationsAPI from "@/apis/components/evaluations/evaluationsAPI";
import { $toastSuccess, $toastError } from "@/utils/toastService";
import { usePagingTable } from "@/composables/usePagingTable";
import { exportSelectedRows } from "@/utils/exportService";

const columns = ref([
    { key: "evaluationCode", name: "Mã đánh giá", typeFilter: "text", width: 150 },
    { key: "employeeCode", name: "Mã nhân viên", typeFilter: "text", width: 120 },
    { key: "employeeName", name: "Tên nhân viên", typeFilter: "text", width: 200 },
    { key: "evaluationType", name: "Loại đánh giá", typeFilter: "text", width: 150 },
    { key: "reason", name: "Lý do", typeFilter: "text", width: 250 },
    { key: "amount", name: "Số tiền", typeFilter: "number", width: 150 },
    { key: "evaluationDate", name: "Ngày áp dụng", width: 150, type: "date" },
    { key: "createdAt", name: "Ngày tạo", width: 150, type: "date" },
    { key: "updatedAt", name: "Ngày sửa", width: 150, type: "date" },
]);

const evaluationFormRef = ref(null);
const evaluationTableRef = ref(null);
const isOpenModal = ref(false);
const formText = ref("");
const typeForm = ref("add");
const isFormOpen = ref(false);
const selectedRow = ref(null);
const selectedRows = ref(null);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(EvaluationsAPI);

const handleSubmit = (evaluation) => {
    if (typeForm.value === "add" || typeForm.value === "duplicate") {
        try {
            addEvaluation(evaluation);
        } catch (error) {
            $toastError("Có lỗi xảy ra khi thêm đánh giá");
            console.log(error);
        }
    }
    if (typeForm.value === "edit") {
        try {
            updateEvaluation(evaluation);
        } catch (error) {
            $toastError("Có lỗi xảy ra khi cập nhật đánh giá");
            console.log(error);
        }
    }
};

const handleSubmitAndAdd = (evaluation) => {
    try {
        addEvaluation(evaluation, true);
    } catch (error) {
        $toastError("Có lỗi xảy ra khi thêm đánh giá");
        console.log(error);
    }
};

function addEvaluation(evaluation, isSaveAndAdd = false) {
    EvaluationsAPI.create(evaluation).then((res) => {
        if (res.status === 201 || res.status === 200) {
            const newEvaluation = res.data.data || evaluation;
            newEvaluation.evaluationId = res.data.id;
            newEvaluation.createdAt = new Date().toISOString();
            newEvaluation.updatedAt = new Date().toISOString();
            rows.value.unshift(newEvaluation);

            if (rows.value.length > payload.pageSize) {
                rows.value.pop();
            }

            payload.totalRows++;
            $toastSuccess("Thêm đánh giá thành công");
            evaluationFormRef.value?.handleCloseForm();
            if (isSaveAndAdd) {
                typeForm.value = "add";
                isFormOpen.value = true;
            }
        }
    });
}

function updateEvaluation(evaluation) {
    EvaluationsAPI.update(evaluation.evaluationId, evaluation)
        .then((res) => {
            if (res.status === 201 || res.status === 200) {
                const index = rows.value.findIndex(
                    (x) => x.evaluationId === evaluation.evaluationId,
                );
                if (index !== -1) {
                    rows.value[index] = { ...evaluation };
                }
                $toastSuccess("Cập nhật đánh giá thành công");
                evaluationFormRef.value?.handleCloseForm();
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

function deleteEvaluation(evaluation) {
    let ids = evaluation;
    if (!Array.isArray(evaluation)) {
        ids = [evaluation];
    }

    EvaluationsAPI.delete(ids).then((res) => {
        if (res.status === 201 || res.status === 200) {
            rows.value = rows.value.filter((row) => !ids.includes(row.evaluationId));
            payload.totalRows -= ids.length;
            isOpenModal.value = false;
            selectedRow.value = null;
            selectedRows.value = null;
            $toastSuccess("Xóa đánh giá thành công");
        }
    });
}

function handleDelete(row) {
    formText.value = "Đánh giá <strong>" + row.evaluationCode + "</strong>";
    selectedRow.value = row;
    isOpenModal.value = true;
}

function handleBatchDelete(rows) {
    formText.value = "Các <strong>Đánh giá</strong>";
    isOpenModal.value = true;
    selectedRows.value = rows;
}

const handleConfirmDelete = () => {
    if (selectedRow.value) {
        deleteEvaluation(selectedRow.value.evaluationId);
        evaluationTableRef.value?.clearChecked();
    }
    if (selectedRows.value) {
        deleteEvaluation(selectedRows.value);
        evaluationTableRef.value?.clearChecked();
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
        await exportSelectedRows(EvaluationsAPI, rows, "Evaluations");
        $toastSuccess("Xuất excel đánh giá thành công");
    } catch (error) {
        $toastError("Xuất excel đánh giá thất bại");
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
            <div class="content__title">Đánh giá thưởng phạt</div>
            <ms-button icon-left="icon-add" @click="handleFormAddOpen">Thêm</ms-button>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                row-actions-name="Thao tác"
                :pagination-data="payload"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
                @delete-row="handleDelete"
                @edit-row="handleEdit"
                @batch-delete="handleBatchDelete"
                @batch-export="handleBatchExport"
                @duplicate="handleDuplicate"
                :loading="loading"
                ref="evaluationTableRef"
            >
                <template #evaluationType="{ value }">
                    <span v-if="value === 'Khen thưởng'" class="text-success">{{ value }}</span>
                    <span v-else-if="value === 'Vi phạm'" class="text-danger">{{ value }}</span>
                    <span v-else>{{ value }}</span>
                </template>
            </ms-table>

            <evaluation-form
                v-model="isFormOpen"
                :typeForm="typeForm"
                @submit="handleSubmit"
                @submit-and-add="handleSubmitAndAdd"
                ref="evaluationFormRef"
                :data="selectedRow"
            ></evaluation-form>
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";

.text-success {
    color: #28a745;
}

.text-danger {
    color: #dc3545;
}
</style>
