<script setup>
defineOptions({ name: "PayrollIndex" });

import { onMounted, ref, computed, inject, watch } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import { usePagingTable } from "@/composables/usePagingTable";
import SalaryPeriodsAPI from "@/apis/components/salary-periods/salaryPeriodsAPI";
import { $toastSuccess, $toastError } from "@/utils/toastService";
import SalaryPeriodForm from "./SalaryPeriodForm.vue";
import PayrollDetail from "./PayrollDetail.vue";
import PayrollWorkflowModal from "./PayrollWorkflowModal.vue";
import PayrollFormulaModal from "./PayrollFormulaModal.vue";
import { Segmented as ASegmented } from "ant-design-vue";
import PayrollsAPI from "@/apis/components/payrolls/payrollsAPI";
import { exportSelectedRows } from "@/utils/exportService";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons-vue";

const { authState } = inject("auth");

const currentRole = computed(() => {
    const role = authState?.user?.role || authState?.user?.Role || "";
    if (typeof role !== "string") {
        return "";
    }
    return role
        .trim()
        .toUpperCase()
        .replace(/^ROLE_/, "");
});

const isHRorAdmin = computed(() => {
    return ["ADMIN", "HR"].includes(currentRole.value);
});

const currentEmployeeId = computed(() => {
    const user = authState?.user || {};
    return user.employee_id || user.employeeId || user.EmployeeId || user.id || null;
});

// State for Employee view
const salaryPeriods = ref([]);
const selectedPeriodId = ref(null);
const currentPayroll = ref(null);
const loadingPayroll = ref(false);
const formulaModalOpen = ref(false);

const currentViewMode = ref("admin");
const isShowingAdminView = computed(() => isHRorAdmin.value && currentViewMode.value === "admin");

const handleViewFormula = () => {
    formulaModalOpen.value = true;
};

const loadPeriodsForEmployee = async () => {
    try {
        const response = await SalaryPeriodsAPI.getAll();
        const responseData = response?.data;
        const rawList = Array.isArray(responseData) ? responseData : responseData?.data || [];

        // Sort periods newest first
        rawList.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

        salaryPeriods.value = rawList.map((item) => ({
            value: item.salaryPeriodId,
            label: getPeriodLabel(item),
        }));

        if (salaryPeriods.value.length > 0) {
            selectedPeriodId.value = salaryPeriods.value[0].value;
        }
    } catch (error) {
        console.error("Error loading salary periods:", error);
    }
};

const loadEmployeePayrollDetail = async () => {
    if (!selectedPeriodId.value || !currentEmployeeId.value) {
        currentPayroll.value = null;
        return;
    }

    loadingPayroll.value = true;
    try {
        const result = await PayrollsAPI.paging({
            page: 1,
            pageSize: 1,
            filters: [
                {
                    field: "salaryPeriodId",
                    operator: "eq",
                    value: selectedPeriodId.value,
                },
                {
                    field: "employeeId",
                    operator: "eq",
                    value: currentEmployeeId.value,
                },
            ],
        });
        currentPayroll.value = result.data?.data?.[0] || null;
    } catch (error) {
        console.error("Error loading payroll details:", error);
        currentPayroll.value = null;
    } finally {
        loadingPayroll.value = false;
    }
};

watch(
    [selectedPeriodId, currentEmployeeId, currentViewMode],
    () => {
        if (!isHRorAdmin.value || currentViewMode.value === "personal") {
            loadEmployeePayrollDetail();
        }
    },
    { immediate: true },
);

const columns = ref([
    { key: "periodLabel", name: "Kỳ lương", width: 150 },
    { key: "startDate", name: "Từ ngày", type: "date", width: 150 },
    { key: "endDate", name: "Đến ngày", type: "date", width: 150 },
    {
        key: "status",
        name: "Trạng thái",
        typeFilter: "status",
        width: 170,
        options: [
            { value: "draft", label: "Nháp" },
            { value: "processing", label: "Đã tính lương" },
            { value: "locked", label: "Đã khóa" },
            { value: "paid", label: "Đã chi trả" },
        ],
    },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 150 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 150 },
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
    if (normalized === "processing") return "status-chip status-chip--processing";
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
    if (normalized === "processing") return "Đã tính lương";
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
        const res = await SalaryPeriodsAPI.create(payload);
        const newId = res.data?.id;

        $toastSuccess("Thêm kỳ lương thành công. Đang tự động tính lương...");

        if (newId) {
            // Tự động tạo nháp và tính lương ngay khi tạo kỳ
            await PayrollsAPI.generateByPeriod(newId);
            await PayrollsAPI.calculateByPeriod(newId);
            $toastSuccess("Đã tính xong lương cho kỳ mới");
        }

        showAddPeriodForm.value = false;
        loadDataForAPI();
    } catch (error) {
        console.error(error);
        $toastError("Thêm hoặc tính kỳ lương thất bại");
    }
};

/**
 * Xử lý khi submit và thêm tiếp kỳ lương
 * @param {object} payload - Dữ liệu kỳ lương
 */
const handlePeriodSubmitAndAdd = async (payload) => {
    try {
        const res = await SalaryPeriodsAPI.create(payload);
        const newId = res.data?.id;

        $toastSuccess("Thêm kỳ lương thành công. Đang tự động tính lương...");

        if (newId) {
            // Tự động tạo nháp và tính lương ngay khi tạo kỳ
            await PayrollsAPI.generateByPeriod(newId);
            await PayrollsAPI.calculateByPeriod(newId);
            $toastSuccess("Đã tính xong lương cho kỳ mới");
        }

        loadDataForAPI();
    } catch (error) {
        console.error(error);
        $toastError("Thêm hoặc tính kỳ lương thất bại");
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

const handleBatchExport = async (rows) => {
    try {
        await exportSelectedRows(SalaryPeriodsAPI, rows, "SalaryPeriods");
        $toastSuccess("Xuất excel kỳ lương thành công");
    } catch (error) {
        console.error(error);
        $toastError("Xuất excel kỳ lương thất bại");
    }
};

const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0";
    return new Intl.NumberFormat("vi-VN").format(value);
};

const isSalaryHidden = ref(true);

const formatSalaryValue = (value, prefix = "") => {
    if (isSalaryHidden.value) return "••••••";
    if (value === null || value === undefined) return prefix + "0 đ";
    return prefix + formatCurrency(value) + " đ";
};

onMounted(async () => {
    if (isHRorAdmin.value) {
        loadDataForAPI();
        await loadPeriodsForEmployee();
    } else {
        currentViewMode.value = "personal";
        await loadPeriodsForEmployee();
    }
});
</script>

<template>
    <div class="content d-flex flex-1 flex-column">
        <!-- Unified Content Header -->
        <div class="content__header d-flex justify-content-between align-items-center">
            <div class="d-flex flex-column align-items-start gap-16">
                <div class="content__title">
                    {{ currentViewMode === "admin" ? "Bảng lương theo kỳ" : "Phiếu lương của tôi" }}
                </div>
                <a-segmented
                    v-if="isHRorAdmin"
                    v-model:value="currentViewMode"
                    :options="[
                        { label: 'Quản lý kỳ lương', value: 'admin' },
                        { label: 'Phiếu lương của tôi', value: 'personal' },
                    ]"
                    size="middle"
                />
            </div>

            <!-- Header actions based on active view mode -->
            <div class="d-flex align-items-center gap-8">
                <template v-if="currentViewMode === 'admin'">
                    <ms-button type="primary" @click="showAddPeriodForm = true">
                        + Thêm kỳ lương
                    </ms-button>
                </template>
                <template v-else>
                    <span style="font-weight: 500; font-size: 14px; color: #4b5563">
                        Chọn kỳ lương:
                    </span>
                    <ms-select
                        v-model="selectedPeriodId"
                        :options="salaryPeriods"
                        placeholder="Chọn kỳ lương"
                        style="width: 180px"
                    />
                </template>
            </div>
        </div>

        <!-- HR / ADMIN VIEW BODY -->
        <template v-if="isShowingAdminView">
            <div class="content__body d-flex flex-1">
                <ms-table
                    :columns="columns"
                    :rows="rows"
                    :pagination-data="payload"
                    :loading="loading"
                    storage-key="payroll-period-table"
                    row-actions-name="Thao tác"
                    :row-column-width="280"
                    @update:pagination="onPaginationUpdate"
                    @update:search="onSearchChange"
                    @reload="reloadData"
                    @batch-export="handleBatchExport"
                >
                    <template #periodLabel="{ row }">
                        <strong>{{ getPeriodLabel(row) }}</strong>
                    </template>

                    <template #status="{ value }">
                        <span :class="getStatusClass(value)">{{ getStatusText(value) }}</span>
                    </template>

                    <template #row-actions="{ row }">
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
            <payroll-detail
                v-model:open="showPayrollDetail"
                :salary-period="selectedSalaryPeriod"
            />

            <!-- Modal quy trình xử lý lương -->
            <payroll-workflow-modal
                v-model:open="showWorkflowModal"
                :salary-period="selectedSalaryPeriod"
                @refresh="handleWorkflowRefresh"
                @view-detail="handleWorkflowViewDetail"
            />
        </template>

        <!-- NON-HR/ADMIN (EMPLOYEE, MANAGER) OR PERSONAL VIEW BODY -->
        <template v-else>
            <div
                class="employee-payroll-body flex-1 d-flex flex-column gap-16"
                style="margin-top: 16px"
            >
                <div
                    v-if="loadingPayroll"
                    class="loading-state d-flex align-items-center justify-content-center flex-1"
                >
                    <span class="loading-spinner">Đang tải dữ liệu...</span>
                </div>

                <template v-else-if="currentPayroll">
                    <!-- Premium Payslip card -->
                    <div class="payslip-card">
                        <div
                            class="payslip-card__header d-flex justify-content-between align-items-center"
                        >
                            <div class="d-flex flex-column">
                                <span class="payslip-card__title"
                                    >PHIẾU LƯƠNG CHI TIẾT
                                    <span :class="getStatusClass(currentPayroll.status)">
                                        {{ getStatusText(currentPayroll.status) }}
                                    </span></span
                                >

                                <span class="payslip-card__subtitle">
                                    Kỳ lương:
                                    {{
                                        salaryPeriods.find((p) => p.value === selectedPeriodId)
                                            ?.label
                                    }}
                                </span>
                            </div>
                            <div class="d-flex align-items-center gap-8">
                                <!-- Eye button to toggle show/hide salary details -->
                                <ms-button
                                    type="outline"
                                    @click="isSalaryHidden = !isSalaryHidden"
                                    style="padding: 0 12px; height: 32px"
                                >
                                    <div class="d-flex align-items-center">
                                        <component
                                            :is="
                                                isSalaryHidden ? EyeOutlined : EyeInvisibleOutlined
                                            "
                                        />
                                        <span
                                            style="
                                                font-weight: 500;
                                                font-size: 14px;
                                                color: #4b5563;
                                                margin-left: 6px;
                                            "
                                        >
                                            {{ isSalaryHidden ? "Hiện số tiền" : "Ẩn số tiền" }}
                                        </span>
                                    </div>
                                </ms-button>
                                <ms-button type="outline" @click="handleViewFormula">
                                    Xem công thức
                                </ms-button>
                            </div>
                        </div>

                        <div class="payslip-card__divider"></div>

                        <div class="payslip-card__info-grid">
                            <div class="info-item">
                                <span class="info-label">Mã nhân viên:</span>
                                <span class="info-value">{{ currentPayroll.employeeCode }}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Họ tên nhân viên:</span>
                                <span class="info-value" style="font-weight: 600">
                                    {{ currentPayroll.fullName }}
                                </span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Ngày công chuẩn:</span>
                                <span class="info-value">
                                    {{ currentPayroll.workingDaysStandard }} ngày
                                </span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Ngày công thực tế:</span>
                                <span class="info-value" style="color: #009b71; font-weight: 600">
                                    {{ currentPayroll.workingDaysActual }} ngày
                                </span>
                            </div>
                        </div>

                        <div class="payslip-card__divider"></div>

                        <div class="payslip-card__amounts-grid">
                            <div class="amount-column">
                                <h4 class="column-title income-title">Khoản thu nhập (+)</h4>
                                <div class="amount-row">
                                    <span>Lương gross thỏa thuận:</span>
                                    <span>{{ formatSalaryValue(currentPayroll.grossSalary) }}</span>
                                </div>
                                <div class="amount-row">
                                    <span>Tổng phụ cấp:</span>
                                    <span>
                                        {{ formatSalaryValue(currentPayroll.totalAllowance) }}
                                    </span>
                                </div>
                                <div class="amount-row">
                                    <span>Tổng cộng thêm khác:</span>
                                    <span>
                                        {{ formatSalaryValue(currentPayroll.totalAddition) }}
                                    </span>
                                </div>
                                <div class="amount-row highlight-row">
                                    <span>Lương chịu thuế:</span>
                                    <span>
                                        {{ formatSalaryValue(currentPayroll.taxableSalary) }}
                                    </span>
                                </div>
                            </div>

                            <div class="amount-column">
                                <h4 class="column-title deduction-title">Khoản khấu trừ (-)</h4>
                                <div class="amount-row">
                                    <span>Khấu trừ bảo hiểm xã hội:</span>
                                    <span>
                                        {{
                                            formatSalaryValue(
                                                currentPayroll.insuranceDeduction,
                                                "- ",
                                            )
                                        }}
                                    </span>
                                </div>
                                <div class="amount-row">
                                    <span>Thuế TNCN tạm khấu trừ:</span>
                                    <span>
                                        {{ formatSalaryValue(currentPayroll.pitTaxAmount, "- ") }}
                                    </span>
                                </div>
                                <div class="amount-row">
                                    <span>Khấu trừ khác:</span>
                                    <span>
                                        {{
                                            formatSalaryValue(
                                                currentPayroll.totalDeduction -
                                                    currentPayroll.insuranceDeduction -
                                                    currentPayroll.pitTaxAmount,
                                            )
                                        }}
                                    </span>
                                </div>
                                <div class="amount-row highlight-row total-deductions-row">
                                    <span>Tổng khấu trừ:</span>
                                    <span>
                                        {{ formatSalaryValue(currentPayroll.totalDeduction, "- ") }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="payslip-card__divider"></div>

                        <div
                            class="payslip-card__footer d-flex justify-content-between align-items-center"
                        >
                            <div class="net-salary-label">LƯƠNG THỰC NHẬN (NET):</div>
                            <div class="net-salary-value">
                                {{ formatSalaryValue(currentPayroll.netSalary) }}
                            </div>
                        </div>
                    </div>
                </template>

                <div
                    v-else
                    class="empty-state d-flex flex-column align-items-center justify-content-center flex-1"
                >
                    <div class="empty-icon"></div>
                    <span class="empty-text">
                        Chưa có thông tin bảng lương cho kỳ này hoặc bảng lương đang trong quá trình
                        tính toán.
                    </span>
                </div>
            </div>

            <!-- Modal xem công thức tính lương của nhân viên -->
            <payroll-formula-modal v-model:open="formulaModalOpen" :payroll="currentPayroll" />
        </template>
    </div>
</template>

<style scoped>
@import "./Index.css";

.content__header {
    overflow: visible !important;
}

.payslip-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    padding: 28px 36px;
    width: 100%;
    box-sizing: border-box;
}

.payslip-card__header {
    margin-bottom: 20px;
}

.payslip-card__title {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    letter-spacing: 0.05em;
}

.payslip-card__subtitle {
    font-size: 14px;
    color: #6b7280;
    margin-top: 6px;
}

.payslip-card__divider {
    height: 1px;
    background-color: #e5e7eb;
    margin: 20px 0;
}

.payslip-card__info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
}

.info-label {
    color: #6b7280;
}

.info-value {
    color: #1f2937;
    font-weight: 500;
}

.payslip-card__amounts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
}

.amount-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.column-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 2px solid;
}

.income-title {
    color: #059669;
    border-bottom-color: #d1fae5;
}

.deduction-title {
    color: #dc2626;
    border-bottom-color: #fee2e2;
}

.amount-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #4b5563;
}

.highlight-row {
    font-weight: 600;
    color: #111827;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #e5e7eb;
}

.total-deductions-row {
    color: #dc2626;
}

.payslip-card__footer {
    background-color: #f0fdf4;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #bbf7d0;
}

.net-salary-label {
    font-size: 16px;
    font-weight: 700;
    color: #065f46;
}

.net-salary-value {
    font-size: 24px;
    font-weight: 800;
    color: #047857;
}

.empty-state {
    text-align: center;
    padding: 48px;
    background: #f9fafb;
    border-radius: 12px;
    border: 1px dashed #d1d5db;
    width: 100%;
    box-sizing: border-box;
    margin: 20px 0;
}

.empty-text {
    font-size: 14px;
    color: #6b7280;
    margin-top: 12px;
}

.loading-state {
    font-size: 16px;
    color: #4b5563;
    padding: 48px;
}
</style>
