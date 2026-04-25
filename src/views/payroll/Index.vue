<script setup>
import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import { usePagingTable } from "@/composables/usePagingTable";
import SalaryPeriodsAPI from "@/apis/components/salary-periods/salaryPeriodsAPI";
import PayrollsAPI from "@/apis/components/payrolls/payrollsAPI";
import { $toastSuccess, $toastError } from "@/utils/toastService";
import SalaryPeriodForm from "./SalaryPeriodForm.vue";
import PayrollDetail from "./PayrollDetail.vue";

const columns = ref([
    { key: "periodLabel", name: "Kỳ lương", width: 150 },
    { key: "startDate", name: "Từ ngày", type: "date", width: 150 },
    { key: "endDate", name: "Đến ngày", type: "date", width: 150 },
    { key: "status", name: "Trạng thái", typeFilter: "text", width: 170 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 150 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 150 },
    { key: "actions", name: "Thao tác", width: 120 },
    { key: "workflowActions", name: "Xử lý kỳ lương", width: 460 },
]);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(SalaryPeriodsAPI);

const processingAction = ref({
    salaryPeriodId: null,
    action: null,
});

const showAddPeriodForm = ref(false);
const showPayrollDetail = ref(false);
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
 * Kiểm tra một kỳ lương có đang được xử lý action hay không.
 * @param {object} row
 * @returns {boolean}
 */
const isRowProcessing = (row) => {
    return processingAction.value.salaryPeriodId === row?.salaryPeriodId;
};

/**
 * Trả về text nút theo action và trạng thái xử lý hiện tại.
 * @param {object} row
 * @param {'generate'|'calculate'|'lock'|'pay'} action
 * @returns {string}
 */
const getActionText = (row, action) => {
    if (isRowProcessing(row) && processingAction.value.action === action) {
        return "Đang xử lý...";
    }

    if (action === "generate") return "1. Tạo nháp";
    if (action === "calculate") return "2. Tính lương";
    if (action === "lock") return "3. Khóa lương";
    return "4. Chi trả";
};

/**
 * Hiển thị hộp thoại xác nhận cho các bước nghiệp vụ nhạy cảm.
 * @param {'generate'|'calculate'|'lock'|'pay'} action
 * @returns {boolean}
 */
const confirmAction = (action) => {
    if (action === "lock") {
        return window.confirm(
            "Xác nhận khóa kỳ lương này? Sau khi khóa sẽ không thể chỉnh sửa dữ liệu đầu vào.",
        );
    }

    if (action === "pay") {
        return window.confirm("Xác nhận đánh dấu đã chi trả kỳ lương này?");
    }

    return true;
};

/**
 * Trả về nội dung thông báo thành công mặc định theo action.
 * @param {'generate'|'calculate'|'lock'|'pay'} action
 * @returns {string}
 */
const getSuccessMessage = (action) => {
    if (action === "generate") return "Tạo bảng lương nháp thành công";
    if (action === "calculate") return "Tính lương kỳ thành công";
    if (action === "lock") return "Khóa lương kỳ thành công";
    return "Đánh dấu chi trả thành công";
};

/**
 * Trả về nội dung thông báo lỗi mặc định theo action.
 * @param {'generate'|'calculate'|'lock'|'pay'} action
 * @returns {string}
 */
const getErrorMessage = (action) => {
    if (action === "generate") return "Tạo bảng lương nháp thất bại";
    if (action === "calculate") return "Tính lương kỳ thất bại";
    if (action === "lock") return "Khóa lương kỳ thất bại";
    return "Đánh dấu chi trả thất bại";
};

/**
 * Chạy action workflow payroll theo salary period.
 * @param {object} row
 * @param {'generate'|'calculate'|'lock'|'pay'} action
 */
const runAction = async (row, action) => {
    const salaryPeriodId = row?.salaryPeriodId;
    if (!salaryPeriodId) {
        $toastError("Không tìm thấy kỳ lương hợp lệ.");
        return;
    }

    if (!confirmAction(action)) {
        return;
    }

    processingAction.value = {
        salaryPeriodId,
        action,
    };

    try {
        if (action === "generate") {
            const res = await PayrollsAPI.generateByPeriod(salaryPeriodId);
            $toastSuccess(res?.data?.message || getSuccessMessage(action));
        }

        if (action === "calculate") {
            const res = await PayrollsAPI.calculateByPeriod(salaryPeriodId);
            $toastSuccess(res?.data?.message || getSuccessMessage(action));
        }

        if (action === "lock") {
            const res = await PayrollsAPI.lockByPeriod(salaryPeriodId);
            $toastSuccess(res?.data?.message || getSuccessMessage(action));
        }

        if (action === "pay") {
            const res = await PayrollsAPI.payByPeriod(salaryPeriodId);
            $toastSuccess(res?.data?.message || getSuccessMessage(action));
        }

        loadDataForAPI();
    } catch (error) {
        console.error(error);
        $toastError(getErrorMessage(action));
    } finally {
        processingAction.value = {
            salaryPeriodId: null,
            action: null,
        };
    }
};

/**
 * Xác định nút action được phép thao tác theo trạng thái kỳ lương.
 * @param {object} row
 * @returns {{canGenerate: boolean, canCalculate: boolean, canLock: boolean, canPay: boolean}}
 */
const getActionState = (row) => {
    const status = (row?.status || "").toLowerCase();

    return {
        canGenerate: status === "draft",
        canCalculate: status === "draft",
        canLock: status === "draft",
        canPay: status === "locked",
    };
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
                    <ms-button
                        type="primary-outline"
                        @click="handleViewPayroll(row)"
                    >
                        Xem chi tiết
                    </ms-button>
                </template>

                <template #workflowActions="{ row }">
                    <div class="action-cell">
                        <ms-button
                            type="outline"
                            :disabled="!getActionState(row).canGenerate || isRowProcessing(row)"
                            @click="runAction(row, 'generate')"
                        >
                            {{ getActionText(row, "generate") }}
                        </ms-button>

                        <ms-button
                            type="primary-outline"
                            :disabled="!getActionState(row).canCalculate || isRowProcessing(row)"
                            @click="runAction(row, 'calculate')"
                        >
                            {{ getActionText(row, "calculate") }}
                        </ms-button>

                        <ms-button
                            type="danger-outline"
                            :disabled="!getActionState(row).canLock || isRowProcessing(row)"
                            @click="runAction(row, 'lock')"
                        >
                            {{ getActionText(row, "lock") }}
                        </ms-button>

                        <ms-button
                            type="primary"
                            :disabled="!getActionState(row).canPay || isRowProcessing(row)"
                            @click="runAction(row, 'pay')"
                        >
                            {{ getActionText(row, "pay") }}
                        </ms-button>
                    </div>
                </template>
            </ms-table>
        </div>

        <!-- Form thêm kỳ lương -->
        <salary-period-form
            v-model="showAddPeriodForm"
            type-form="add"
            @submit="handlePeriodSubmit"
            @submit-and-add="handlePeriodSubmitAndAdd"
        />

        <!-- Modal xem chi tiết bảng lương -->
        <payroll-detail
            v-model="showPayrollDetail"
            :salary-period="selectedSalaryPeriod"
        />
    </div>
</template>

<style scoped>
@import "./Index.css";
</style>
