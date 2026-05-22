<script setup>
import { onMounted, ref, computed } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import EmployeeForm from "./EmployeeForm.vue";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { exportSelectedRows } from "@/utils/exportService";
import MsAlert from "@/components/ms-alert/MsAlert.vue";

const columns = ref([
    { key: "employeeCode", name: "Mã nhân viên", typeFilter: "text", width: 140 },
    { key: "fullName", name: "Họ tên", typeFilter: "text", width: 220 },
    {
        key: "gender",
        name: "Giới tính",
        typeFilter: "status",
        width: 120,
        options: [
            { value: "Nam", label: "Nam" },
            { value: "Nữ", label: "Nữ" },
            { value: "Khác", label: "Khác" },
        ],
    },
    { key: "dateOfBirth", name: "Ngày sinh", type: "date", width: 140 },
    { key: "address", name: "Địa chỉ", typeFilter: "text", width: 260 },
    { key: "phoneNumber", name: "Số điện thoại", typeFilter: "text", width: 160 },
    { key: "email", name: "Email", typeFilter: "text", width: 220 },
    { key: "nationalId", name: "CCCD/CMND", typeFilter: "text", width: 160 },
    { key: "departmentName", name: "Phòng ban", typeFilter: "text", width: 220 },
    { key: "positionName", name: "Chức vụ", typeFilter: "text", width: 180 },
    { key: "updatedAt", name: "Ngày nghỉ việc", type: "date", width: 160 },
]);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable((body) => EmployeesAPI.getPagingResigned(body));

// ---- Tab ----
const activeTab = ref("all"); // "all" | "needsCleanup"

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

// Tab "Cần xóa dữ liệu": nghỉ quá 6 tháng VÀ chưa được xóa thông tin cá nhân
const needsCleanupRows = computed(() => {
    const cutoff = Date.now() - SIX_MONTHS_MS;
    return rows.value.filter((r) => {
        const isAnonymized = r.fullName?.startsWith("Cựu NV");
        if (isAnonymized) return false;
        const resignedAt = r.updatedAt ? new Date(r.updatedAt).getTime() : null;
        return resignedAt !== null && resignedAt < cutoff;
    });
});

const displayedRows = computed(() =>
    activeTab.value === "needsCleanup" ? needsCleanupRows.value : rows.value,
);

const isFormOpen = ref(false);
const selectedRow = ref(null);
const employeeTableRef = ref(null);

// Alert xóa thông tin cá nhân
const isAnonymizeAlertOpen = ref(false);
const anonymizeTargetRow = ref(null);

// Tái tuyển dụng
function handleRehire(row) {
    const prefillData = {
        ...row,
        employeeId: null,
        accountId: null,
        employeeCode: null,
        joinDate: null,
        contractId: null,
        departmentId: null,
        positionId: null,
    };

    selectedRow.value = prefillData;
    isFormOpen.value = true;
}

async function handleSubmitRehire(data) {
    try {
        await EmployeesAPI.create(data);
        $toastSuccess("Tái tuyển dụng nhân viên thành công");
        isFormOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Lưu nhân viên thất bại");
        console.error(error);
    }
}

// Xóa thông tin cá nhân (Anonymize)
function handleAnonymize(row) {
    if (row.fullName?.startsWith("Cựu NV")) {
        $toastError("Dữ liệu của nhân viên này đã bị xóa thông tin cá nhân trước đó.");
        return;
    }
    anonymizeTargetRow.value = row;
    isAnonymizeAlertOpen.value = true;
}

async function confirmAnonymize() {
    isAnonymizeAlertOpen.value = false;
    if (!anonymizeTargetRow.value) return;
    try {
        await EmployeesAPI.anonymize(anonymizeTargetRow.value.employeeId);
        $toastSuccess("Đã xóa thông tin cá nhân thành công");
        await loadDataForAPI();
    } catch (error) {
        $toastError("Xóa thông tin cá nhân thất bại");
        console.error(error);
    } finally {
        anonymizeTargetRow.value = null;
    }
}

function exportExcel() {
    exportSelectedRows(employeeTableRef.value, "employees-resigned");
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex">
            <div class="content__title">Hồ sơ lưu trữ (Đã nghỉ việc)</div>
        </div>

        <!-- Tabs -->
        <div class="resigned-tabs">
            <button
                :class="['resigned-tab', activeTab === 'all' && 'resigned-tab--active']"
                @click="activeTab = 'all'"
            >
                Tất cả
                <span class="resigned-tab__badge">{{ rows.length }}</span>
            </button>
            <button
                :class="[
                    'resigned-tab',
                    'resigned-tab--warning',
                    activeTab === 'needsCleanup' && 'resigned-tab--active',
                ]"
                @click="activeTab = 'needsCleanup'"
            >
                ⚠️ Cần xóa dữ liệu (NĐ13)
                <span class="resigned-tab__badge resigned-tab__badge--warning">{{
                    needsCleanupRows.length
                }}</span>
            </button>
        </div>

        <div v-if="activeTab === 'needsCleanup'" class="resigned-cleanup-notice">
            Danh sách nhân viên đã nghỉ việc <strong>hơn 6 tháng</strong> và chưa được xóa thông tin
            cá nhân. Theo <strong>NĐ13/2023/NĐ-CP</strong>, cần thực hiện xóa thông tin nhạy cảm cho
            các hồ sơ này.
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                ref="employeeTableRef"
                :columns="columns"
                :rows="displayedRows"
                :loading="loading"
                :pagination-data="payload"
                row-actions-name="Thao tác"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
            >
                <template #toolbar-right>
                    <MsButton type="secondary" icon-left="icon-export" @click="exportExcel"
                        >Xuất Excel</MsButton
                    >
                </template>
                <template #row-actions="{ row }">
                    <div class="d-flex align-items-center justify-content-center" style="gap: 8px">
                        <MsButton class="action-button" @click="handleRehire(row)">
                            Tái tuyển dụng
                        </MsButton>
                        <MsButton
                            v-if="!row.fullName?.startsWith('Cựu NV')"
                            class="action-button action-button--danger"
                            @click="handleAnonymize(row)"
                        >
                            Xóa dữ liệu
                        </MsButton>
                    </div>
                </template>
            </ms-table>

            <EmployeeForm
                v-model="isFormOpen"
                typeForm="add"
                :data="selectedRow"
                @submit="handleSubmitRehire"
            />

            <MsAlert
                v-model="isAnonymizeAlertOpen"
                title="Xóa thông tin cá nhân"
                :show-confirm="true"
                confirm-text="Xóa vĩnh viễn"
                confirm-type="danger"
                @confirm="confirmAnonymize"
                @close="isAnonymizeAlertOpen = false"
            >
                Hành động này sẽ <strong>ghi đè tên</strong> thành "Cựu NV" và
                <strong>xóa vĩnh viễn</strong> các thông tin nhạy cảm (CCCD, SĐT, STK, Email...) của
                <strong
                    >{{ anonymizeTargetRow?.fullName }} -
                    {{ anonymizeTargetRow?.employeeCode }}</strong
                >. <br /><br />
                Thao tác <strong>không thể hoàn tác</strong>. Bạn có chắc chắn?
            </MsAlert>
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";
.action-button {
    height: 32px;
    padding: 0 12px;
    border-radius: 4px;
    border: 1px solid #d9d9d9;
    background: #fff;
    cursor: pointer;
    white-space: nowrap;
}
.action-button:hover {
    border-color: #50b83c;
    color: #50b83c;
}
.action-button--danger {
    color: #ff4d4f;
}
.action-button--danger:hover {
    border-color: #ff4d4f;
    color: #ff4d4f;
}

/* ---- Tabs ---- */
.resigned-tabs {
    display: flex;
    gap: 4px;
    padding: 8px 16px 0;
    border-bottom: 2px solid #e5e7eb;
    background: #fff;
}
.resigned-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition:
        color 0.15s,
        border-color 0.15s;
}
.resigned-tab:hover {
    color: #111827;
}
.resigned-tab--active {
    color: #16a34a;
    border-bottom-color: #16a34a;
}
.resigned-tab--warning.resigned-tab--active {
    color: #d97706;
    border-bottom-color: #d97706;
}
.resigned-tab__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: #e5e7eb;
    color: #374151;
    font-size: 11px;
    font-weight: 600;
}
.resigned-tab__badge--warning {
    background: #fef3c7;
    color: #92400e;
}
.resigned-tab--active .resigned-tab__badge {
    background: #dcfce7;
    color: #15803d;
}
.resigned-tab--warning.resigned-tab--active .resigned-tab__badge--warning {
    background: #fde68a;
    color: #78350f;
}

/* Notice banner */
.resigned-cleanup-notice {
    margin: 16px 8px;
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    font-size: 13px;
    color: #78350f;
    line-height: 1.6;
}
</style>
