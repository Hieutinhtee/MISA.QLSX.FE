<script setup>
import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import EmployeeForm from "./EmployeeForm.vue";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { exportSelectedRows } from "@/utils/exportService";

const columns = ref([
    { key: "employeeCode", name: "Mã nhân viên", typeFilter: "text", width: 140 },
    { key: "fullName", name: "Họ tên", typeFilter: "text", width: 220 },
    { key: "gender", name: "Giới tính", typeFilter: "text", width: 120 },
    { key: "dateOfBirth", name: "Ngày sinh", type: "date", width: 140 },
    { key: "address", name: "Địa chỉ", typeFilter: "text", width: 260 },
    { key: "phoneNumber", name: "Số điện thoại", typeFilter: "text", width: 160 },
    { key: "email", name: "Email", typeFilter: "text", width: 220 },
    { key: "joinDate", name: "Ngày vào làm", type: "date", width: 140 },
    { key: "nationalId", name: "CCCD/CMND", typeFilter: "text", width: 160 },
    { key: "avatarUrl", name: "Ảnh đại diện", typeFilter: "text", width: 120 },
    { key: "departmentName", name: "Phòng ban", typeFilter: "text", width: 220 },
    { key: "shiftName", name: "Ca làm", typeFilter: "text", width: 180 },
    { key: "degreeName", name: "Bằng cấp", typeFilter: "text", width: 180 },
    { key: "positionName", name: "Chức vụ", typeFilter: "text", width: 180 },
    { key: "accountName", name: "Tài khoản", typeFilter: "text", width: 180 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 140 },
]);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(EmployeesAPI);

const isFormOpen = ref(false);
const typeForm = ref("add");
const selectedRow = ref(null);
const selectedRows = ref(null);
const isOpenModal = ref(false);
const formText = ref("");
const employeeTableRef = ref(null);

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
        if (typeForm.value === "edit" && selectedRow.value?.employeeId) {
            await EmployeesAPI.update(selectedRow.value.employeeId, data);
            $toastSuccess("Cập nhật nhân viên thành công");
        } else {
            await EmployeesAPI.create(data);
            $toastSuccess("Thêm nhân viên thành công");
        }

        isFormOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Lưu nhân viên thất bại");
        console.error(error);
    }
}

function handleDelete(row) {
    selectedRow.value = row;
    selectedRows.value = null;
    formText.value = "Nhân viên <strong>" + row.employeeCode + "</strong>";
    isOpenModal.value = true;
}

function handleBatchDelete(rows) {
    selectedRow.value = null;
    selectedRows.value = rows;
    formText.value = "Các <strong>nhân viên</strong>";
    isOpenModal.value = true;
}

async function deleteEmployees(ids) {
    try {
        await EmployeesAPI.delete(ids);
        $toastSuccess("Xóa nhân viên thành công");

        isOpenModal.value = false;
        selectedRow.value = null;
        selectedRows.value = null;

        employeeTableRef.value?.clearChecked();
        await loadDataForAPI();
    } catch (error) {
        $toastError("Xóa nhân viên thất bại");
        console.error(error);
    }
}

function handleConfirmDelete() {
    if (selectedRow.value?.employeeId) {
        deleteEmployees([selectedRow.value.employeeId]);
        return;
    }

    if (selectedRows.value?.length) {
        deleteEmployees(selectedRows.value);
    }
}

async function handleBatchExport(rows) {
    try {
        await exportSelectedRows(EmployeesAPI, rows, "Employees");
        $toastSuccess("Xuất excel nhân viên thành công");
    } catch (error) {
        $toastError("Xuất excel nhân viên thất bại");
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
            <div class="content__title">Nhân viên</div>
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
                ref="employeeTableRef"
            >
                <!-- Avatar Cell -->
                <template #avatarUrl="{ row }">
                    <div class="d-flex justify-content-center w-100">
                        <img 
                            v-if="row.avatarUrl && row.avatarUrl !== 'profile.jpg'" 
                            :src="`https://localhost:7124/api/v1/Files/${row.avatarUrl}/download`" 
                            alt="Avatar"
                            class="table-avatar"
                            @error="(e) => e.target.src = '/favicon.ico'"
                        />
                        <div v-else class="table-avatar table-avatar--placeholder">
                            👤
                        </div>
                    </div>
                </template>
            </ms-table>

            <employee-form
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

.table-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #e8e8e8;
}

.table-avatar--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    font-size: 16px;
}
</style>
