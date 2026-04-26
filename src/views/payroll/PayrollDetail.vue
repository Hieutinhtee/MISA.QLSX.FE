<script setup>
import { ref, watch, computed } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import PayrollsAPI from "@/apis/components/payrolls/payrollsAPI";
import { $toastError } from "@/utils/toastService";
import { Modal } from "ant-design-vue";

//#region Props
const props = defineProps({
    open: {
        type: Boolean,
        default: false,
    },
    salaryPeriod: {
        type: Object,
        default: null,
    },
});
//#endregion

const emit = defineEmits(["update:open"]);

//#region State
const modalOpen = computed({
    get: () => props.open,
    set: (value) => emit("update:open", value),
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
    modalOpen.value = false;
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
    () => modalOpen.value,
    (open) => {
        if (open && props.salaryPeriod) {
            loadPayrolls();
        }
    },
);
//#endregion
</script>

<template>
    <Modal
        v-model:open="modalOpen"
        :title="modalTitle"
        width="80vw"
        centered
        :footer="null"
        :destroy-on-close="true"
        :mask-closable="true"
        @cancel="handleClose"
    >
        <div class="payroll-detail__content d-flex flex-1 flex-column">
            <div class="payroll-detail__body flex-1">
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
    </Modal>
</template>

<style scoped>
.payroll-detail__content {
    height: 100%;
    overflow: hidden;
}

.payroll-detail__body {
    padding: 0 10px 0 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-radius: var(--border-radius);
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
