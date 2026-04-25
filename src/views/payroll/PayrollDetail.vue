<script setup>
import { ref, watch, computed } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import PayrollsAPI from "@/apis/components/payrolls/payrollsAPI";
import { $toastError } from "@/utils/toastService";

//#region Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    salaryPeriod: {
        type: Object,
        default: null,
    },
});
//#endregion

//#region State
const isModalOpen = defineModel({
    type: Boolean,
    default: false,
});

const loading = ref(false);
const payrolls = ref([]);
const payload = ref({
    page: 1,
    pageSize: 20,
    search: "",
    filters: [],
    sorts: [],
    totalRows: 0,
});

const columns = ref([
    { key: "payrollCode", name: "Mã bảng lương", width: 150 },
    { key: "grossSalary", name: "Lương gross", type: "number", width: 150 },
    { key: "taxableSalary", name: "Lương chịu thuế", type: "number", width: 150 },
    { key: "pitTaxAmount", name: "Thuế TNCN", type: "number", width: 150 },
    { key: "insuranceDeduction", name: "Khấu trừ BHXH", type: "number", width: 150 },
    { key: "totalAllowance", name: "Tổng phụ cấp", type: "number", width: 150 },
    { key: "totalAddition", name: "Tổng cộng thêm", type: "number", width: 150 },
    { key: "totalDeduction", name: "Tổng trừ đi", type: "number", width: 150 },
    { key: "netSalary", name: "Lương thực nhận", type: "number", width: 150 },
    { key: "workingDaysActual", name: "Ngày công thực tế", type: "number", width: 150 },
    { key: "workingDaysStandard", name: "Ngày công chuẩn", type: "number", width: 150 },
    { key: "status", name: "Trạng thái", typeFilter: "text", width: 120 },
]);
//#endregion

//#region Computed
const periodLabel = computed(() => {
    if (!props.salaryPeriod) return "";
    const startDate = props.salaryPeriod.startDate ? new Date(props.salaryPeriod.startDate) : null;
    if (!startDate || Number.isNaN(startDate.getTime())) {
        return "Không xác định";
    }
    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const year = startDate.getFullYear();
    return `${month}/${year}`;
});

const modalTitle = computed(() => {
    return `Chi tiết bảng lương - Kỳ ${periodLabel.value}`;
});
//#endregion

//#region Methods
const loadPayrolls = async () => {
    if (!props.salaryPeriod?.salaryPeriodId) {
        return;
    }

    loading.value = true;
    try {
        const result = await PayrollsAPI.paging({
            ...payload.value,
            filters: [
                {
                    field: "salaryPeriodId",
                    operator: "equals",
                    value: props.salaryPeriod.salaryPeriodId,
                },
            ],
        });

        payrolls.value = result.data?.data || [];
        payload.value.totalRows = result.data?.meta?.total || 0;
    } catch (error) {
        console.error(error);
        $toastError("Không thể tải dữ liệu bảng lương");
    } finally {
        loading.value = false;
    }
};

const onPaginationUpdate = (newPayload) => {
    Object.assign(payload.value, newPayload);
    loadPayrolls();
};

const onSearchChange = (newPayload) => {
    Object.assign(payload.value, newPayload);
    loadPayrolls();
};

const handleClose = () => {
    isModalOpen.value = false;
    payrolls.value = [];
    payload.value = {
        page: 1,
        pageSize: 20,
        search: "",
        filters: [],
        sorts: [],
        totalRows: 0,
    };
};

const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0";
    return new Intl.NumberFormat("vi-VN").format(value);
};

const getStatusClass = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "draft") return "status-chip status-chip--draft";
    if (normalized === "locked") return "status-chip status-chip--locked";
    if (normalized === "paid") return "status-chip status-chip--paid";

    return "status-chip status-chip--default";
};

const getStatusText = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "draft") return "Nháp";
    if (normalized === "locked") return "Đã khóa";
    if (normalized === "paid") return "Đã chi trả";

    return status || "Không xác định";
};
//#endregion

//#region Watch
watch(
    () => isModalOpen.value,
    (open) => {
        if (open && props.salaryPeriod) {
            loadPayrolls();
        }
    },
);
//#endregion
</script>

<template>
    <div v-if="isModalOpen" class="payroll-detail-modal">
        <div class="payroll-detail__overlay" @click="handleClose"></div>
        <div class="payroll-detail__content d-flex flex-column">
            <div class="payroll-detail__header d-flex justify-content-between align-items-center">
                <div class="payroll-detail__title">{{ modalTitle }}</div>
                <div class="payroll-detail__close-icon pointer" @click="handleClose"></div>
            </div>

            <div class="payroll-detail__body d-flex flex-1">
                <ms-table
                    :columns="columns"
                    :rows="payrolls"
                    :pagination-data="payload"
                    :loading="loading"
                    storage-key="payroll-detail-table"
                    @update:pagination="onPaginationUpdate"
                    @update:search="onSearchChange"
                >
                    <template #grossSalary="{ value }">
                        {{ formatCurrency(value) }}
                    </template>

                    <template #taxableSalary="{ value }">
                        {{ formatCurrency(value) }}
                    </template>

                    <template #pitTaxAmount="{ value }">
                        {{ formatCurrency(value) }}
                    </template>

                    <template #insuranceDeduction="{ value }">
                        {{ formatCurrency(value) }}
                    </template>

                    <template #totalAllowance="{ value }">
                        {{ formatCurrency(value) }}
                    </template>

                    <template #totalAddition="{ value }">
                        {{ formatCurrency(value) }}
                    </template>

                    <template #totalDeduction="{ value }">
                        {{ formatCurrency(value) }}
                    </template>

                    <template #netSalary="{ value }">
                        <strong>{{ formatCurrency(value) }}</strong>
                    </template>

                    <template #status="{ value }">
                        <span :class="getStatusClass(value)">{{ getStatusText(value) }}</span>
                    </template>
                </ms-table>
            </div>

            <div class="payroll-detail__footer d-flex align-items-center justify-content-end">
                <ms-button type="outline" @click="handleClose">Đóng</ms-button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.payroll-detail-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
}

.payroll-detail__overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.45);
    z-index: 10;
}

.payroll-detail__content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 80vh;
    width: 90vw;
    max-width: 1400px;
    background-color: white;
    border-radius: var(--border-radius);
    z-index: 11;
    overflow: hidden;
}

.payroll-detail__header {
    margin: 16px 20px;
}

.payroll-detail__title {
    font-size: 24px;
    font-weight: 700;
}

.payroll-detail__close-icon {
    -webkit-mask-image: url(/src/assets/icon/svg/ICON.svg);
    -webkit-mask-position: -73px -136px;
    background-color: #666666;
    width: 24px;
    height: 24px;
    cursor: pointer;
}

.payroll-detail__body {
    flex: 1;
    padding: 0 20px 20px 20px;
    overflow: hidden;
}

.payroll-detail__footer {
    height: 56px;
    width: 100%;
    border-top: 1px solid #e0e0e0;
    padding: 12px 20px;
}

.payroll-detail__footer-buttons {
    column-gap: 8px;
    flex-direction: row-reverse;
}

.status-chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.status-chip--draft {
    background: #e0f2fe;
    color: #075985;
}

.status-chip--locked {
    background: #fef3c7;
    color: #92400e;
}

.status-chip--paid {
    background: #dcfce7;
    color: #166534;
}

.status-chip--default {
    background: #f3f4f6;
    color: #374151;
}
</style>
