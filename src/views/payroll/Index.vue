<script setup>
defineOptions({ name: "PayrollIndex" });

import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import { usePagingTable } from "@/composables/usePagingTable";
import SalaryPeriodsAPI from "@/apis/components/salary-periods/salaryPeriodsAPI";
import { $toastSuccess, $toastError } from "@/utils/toastService";
import SalaryPeriodForm from "./SalaryPeriodForm.vue";
import PayrollDetail from "./PayrollDetail.vue";
import PayrollWorkflowModal from "./PayrollWorkflowModal.vue";

const columns = ref([
    { key: "periodLabel", name: "Kỳ lương", width: 150 },
    { key: "startDate", name: "Từ ngày", type: "date", width: 150 },
    { key: "endDate", name: "Đến ngày", type: "date", width: 150 },
    { key: "status", name: "Trạng thái", typeFilter: "text", width: 170 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 150 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 150 },
    { key: "actions", name: "Thao tác", width: 280 },
]);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(SalaryPeriodsAPI);

const showAddPeriodForm = ref(false);
const showPayrollDetail = ref(false);
const showWorkflowModal = ref(false);
const selectedSalaryPeriod = ref(null);

/**
 * Chuẩn hóa tên hiển thị kỳ lương theo tháng/năm từ ngày bắt đầu kỳ.
 * @param {object} row
 * @returns {string}
 */
const getPeriodLabel = (row) => {
    const startDate = row?.startDate ? new Date(row.startDate) : null;
    if (!startDate || Number.isNaN(startDate.getTime())) {
        return "Không xác định";
    }

    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const year = startDate.getFullYear();

    return `${month}/${year}`;
};

/**
 * Trả về class hiển thị trạng thái kỳ lương theo badge.
 * @param {string|null|undefined} status
 * @returns {string}
 */
const getStatusClass = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "draft") return "status-chip status-chip--draft";
    if (normalized === "locked") return "status-chip status-chip--locked";
    if (normalized === "paid") return "status-chip status-chip--paid";

    return "status-chip status-chip--default";
};

/**
 * Chuẩn hóa text hiển thị trạng thái kỳ lương.
 * @param {string|null|undefined} status
 * @returns {string}
 */
const getStatusText = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "draft") return "Nháp";
    if (normalized === "locked") return "Đã khóa";
    if (normalized === "paid") return "Đã chi trả";

    return status || "Không xác định";
};

/**
 * Xử lý khi submit form thêm kỳ lương
 * @param {object} payload - Dữ liệu kỳ lương
 */
const handlePeriodSubmit = async (payload) => {
    try {
        await SalaryPeriodsAPI.create(payload);
        $toastSuccess("Thêm kỳ lương thành công");
        showAddPeriodForm.value = false;
        loadDataForAPI();
    } catch (error) {
        console.error(error);
        $toastError("Thêm kỳ lương thất bại");
    }
};

/**
 * Xử lý khi submit và thêm tiếp kỳ lương
 * @param {object} payload - Dữ liệu kỳ lương
 */
const handlePeriodSubmitAndAdd = async (payload) => {
    try {
        await SalaryPeriodsAPI.create(payload);
        $toastSuccess("Thêm kỳ lương thành công");
        loadDataForAPI();
    } catch (error) {
        console.error(error);
        $toastError("Thêm kỳ lương thất bại");
    }
};

/**
 * Mở modal xem chi tiết bảng lương theo kỳ
 * @param {object} row - Dữ liệu kỳ lương
 */
const handleViewPayroll = (row) => {
    selectedSalaryPeriod.value = row;
    showPayrollDetail.value = true;
};

/**
 * Mở modal quy trình xử lý lương
 * @param {object} row - Dữ liệu kỳ lương
 */
const handleOpenWorkflow = (row) => {
    selectedSalaryPeriod.value = row;
    showWorkflowModal.value = true;
};

/**
 * Xử lý khi workflow modal yêu cầu refresh dữ liệu
 */
const handleWorkflowRefresh = () => {
    loadDataForAPI();
};

/**
 * Xử lý khi workflow modal yêu cầu xem chi tiết
 * @param {object} row - Dữ liệu kỳ lương
 */
const handleWorkflowViewDetail = (row) => {
    showWorkflowModal.value = false;
    handleViewPayroll(row);
};

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex justify-content-between align-items-center">
            <div class="content__title">Bảng lương theo kỳ</div>
            <ms-button type="primary" @click="showAddPeriodForm = true">
                + Thêm kỳ lương
            </ms-button>
        </div>

        <div class="workflow-guide">
            Quy trình chuẩn: <strong>1. Tạo nháp</strong> -> <strong>2. Tính lương</strong> ->
            <strong>3. Khóa lương</strong> -> <strong>4. Chi trả</strong>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                :loading="loading"
                storage-key="payroll-period-table"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
            >
                <template #periodLabel="{ row }">
                    <strong>{{ getPeriodLabel(row) }}</strong>
                </template>

                <template #status="{ value }">
                    <span :class="getStatusClass(value)">{{ getStatusText(value) }}</span>
                </template>

                <template #actions="{ row }">
                    <div class="action-cell">
                        <ms-button type="primary-outline" @click="handleOpenWorkflow(row)">
                            Xử lý lương
                        </ms-button>

                        <ms-button type="outline" @click="handleViewPayroll(row)">
                            Xem chi tiết
                        </ms-button>
                    </div>
                </template>
            </ms-table>
        </div>

        <!-- Form thêm kỳ lương -->
        <salary-period-form
            v-model:open="showAddPeriodForm"
            type-form="add"
            @submit="handlePeriodSubmit"
            @submit-and-add="handlePeriodSubmitAndAdd"
        />

        <!-- Modal xem chi tiết bảng lương -->
        <payroll-detail v-model:open="showPayrollDetail" :salary-period="selectedSalaryPeriod" />

        <!-- Modal quy trình xử lý lương -->
        <payroll-workflow-modal
            v-model:open="showWorkflowModal"
            :salary-period="selectedSalaryPeriod"
            @refresh="handleWorkflowRefresh"
            @view-detail="handleWorkflowViewDetail"
        />
    </div>
</template>

<style scoped>
@import "./Index.css";
</style>
