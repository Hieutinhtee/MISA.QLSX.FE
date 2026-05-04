<script setup>
import { useRouter } from "vue-router";
import { onMounted, ref, inject, computed } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import DepartmentForm from "./DepartmentForm.vue";
import TransferMemberForm from "./TransferMemberForm.vue";
import ChangeManagerForm from "./ChangeManagerForm.vue";
import DepartmentsAPI from "@/apis/components/departments/departmentsAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { exportSelectedRows } from "@/utils/exportService";

const router = useRouter();

const columns = ref([
    { key: "departmentCode", name: "Mã phòng ban", typeFilter: "text", width: 150 },
    { key: "departmentName", name: "Tên phòng ban", typeFilter: "text", width: 220 },
    { key: "managerEmployeeName", name: "Trưởng phòng", typeFilter: "text", width: 180 },
    { key: "isActive", name: "Trạng thái", width: 140 },
    { key: "description", name: "Mô tả", typeFilter: "text", width: 390 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
]);

const departmentFormRef = ref(null);
const departmentTableRef = ref(null);

const isFormOpen = ref(false);
const typeForm = ref("add");
const selectedRow = ref(null);

// Modal ngừng sử dụng
const isDeactivateModalOpen = ref(false);
const deactivateText = ref("");

// Form thuyên chuyển thành viên
const isTransferFormOpen = ref(false);

// Form đổi trưởng phòng
const isChangeManagerFormOpen = ref(false);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(DepartmentsAPI);

function handleFormAddOpen() {
    typeForm.value = "add";
    selectedRow.value = null;
    isFormOpen.value = true;
}

async function handleSubmit(data) {
    try {
        await DepartmentsAPI.create(data);
        $toastSuccess("Thêm phòng ban thành công");
        isFormOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Thêm phòng ban thất bại");
        console.error(error);
    }
}

async function handleBatchExport(rows) {
    try {
        await exportSelectedRows(DepartmentsAPI, rows, "Departments");
        $toastSuccess("Xuất excel phòng ban thành công");
    } catch (error) {
        $toastError("Xuất excel phòng ban thất bại");
        console.error(error);
    }
}

function handleViewDetail(row) {
    router.push({ name: "department-detail", params: { id: row.departmentId } });
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex">
            <div class="content__title">Phòng ban</div>
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
                @batch-export="handleBatchExport"
                @edit-row="handleViewDetail"
                row-actions-name="Thao tác"
                :row-column-width="100"
                ref="departmentTableRef"
                :show-selection="false"
            >
                <!-- Custom cell: isActive badge -->
                <template #isActive="{ row }">
                    <div
                        class="status-badge"
                        :class="row.isActive ? 'status-badge--active' : 'status-badge--inactive'"
                    >
                        <!-- <div class="status-badge__dot"></div> -->
                        <div class="status-badge__text">
                            {{ row.isActive ? "Đang sử dụng" : "Ngừng sử dụng" }}
                        </div>
                    </div>
                </template>

                <!-- Custom row actions -->
                <template #row-actions="{ row }">
                    <div class="d-flex align-items-center justify-content-center w-100">
                        <ms-button type="primary" @click.stop="handleViewDetail(row)"
                            >Xem</ms-button
                        >
                    </div>
                </template>
            </ms-table>

            <department-form
                v-model="isFormOpen"
                typeForm="add"
                @submit="handleSubmit"
                ref="departmentFormRef"
            />
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";

.gap-6 {
    gap: 6px;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
}

.status-badge__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-badge--active {
    background-color: #ebfef6;
    color: #009b71;
}

.status-badge--active .status-badge__dot {
    background-color: #009b71;
}

.status-badge--inactive {
    background-color: #f3f4f6;
    color: #6b7280;
}

.status-badge--inactive .status-badge__dot {
    background-color: #6b7280;
}

.icon-transfer::before {
    content: "\e900"; /* Replace with actual icon code if available */
    font-family: "icomoon";
}

.icon-manager::before {
    content: "\e901"; /* Replace with actual icon code if available */
    font-family: "icomoon";
}
</style>
