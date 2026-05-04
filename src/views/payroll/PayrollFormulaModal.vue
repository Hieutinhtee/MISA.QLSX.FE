<script setup>
import { ref, watch, computed } from "vue";
import { Descriptions, Table, Divider, Tag, Card, Row, Col, Statistic } from "ant-design-vue";
import {
    DollarOutlined,
    SafetyCertificateOutlined,
    PercentageOutlined,
    WalletOutlined,
} from "@ant-design/icons-vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsForm from "@/components/ms-form/MsForm.vue";
import PayrollItemsAPI from "@/apis/components/payrolls/payrollItemsAPI";
import { $toastError } from "@/utils/toastService";

const props = defineProps({
    open: {
        type: Boolean,
        default: false,
    },
    payroll: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(["update:open"]);

const modalOpen = computed({
    get: () => props.open,
    set: (value) => emit("update:open", value),
});

const loading = ref(false);
const items = ref([]);

const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0";
    return new Intl.NumberFormat("vi-VN").format(value);
};

const loadItems = async () => {
    if (!props.payroll?.payrollId) return;

    loading.value = true;
    try {
        const res = await PayrollItemsAPI.getByPayrollId(props.payroll.payrollId);
        items.value = res.data || [];
    } catch (error) {
        console.error(error);
        $toastError("Không thể tải chi tiết công thức");
    } finally {
        loading.value = false;
    }
};

// Phân loại và gán số thứ tự cho các khoản mục
const categorizedItems = computed(() => {
    const list = [];
    if (!items.value.length) return list;

    // 1. Lương theo công
    const base = items.value.find(i => i.formulaComponent === "base_salary");
    if (base) list.push({ ...base, indexLabel: "(1)", group: "income" });

    // 2. Phụ cấp
    const allowances = items.value.filter(i => i.formulaComponent === "allowance");
    const totalAlw = allowances.reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Tổng phụ cấp (từ hợp đồng)",
        amount: totalAlw,
        indexLabel: "(2)",
        group: "income",
        children: allowances,
    });

    // 3. Các khoản cộng thêm
    const additions = items.value.filter(i => i.formulaComponent === "bonus" || (i.itemType === "addition" && !["base_salary", "allowance"].includes(i.formulaComponent)));
    const totalAdd = additions.reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Các khoản cộng thêm (thưởng, hỗ trợ...)",
        amount: totalAdd,
        indexLabel: "(3)",
        group: "income",
        children: additions,
    });

    // 4. Các khoản trừ
    const deductions = items.value.filter(i => i.formulaComponent === "penalty" || (i.itemType === "deduction" && !["insurance", "tax"].includes(i.formulaComponent)));
    const totalDed = deductions.reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Các khoản khấu trừ (phạt, nghỉ...)",
        amount: totalDed,
        indexLabel: "(4)",
        group: "deduction",
        children: deductions,
    });

    // 5. Bảo hiểm
    const insurances = items.value.filter(i => i.formulaComponent === "insurance");
    const totalIns = insurances.reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Các khoản bảo hiểm (BHXH, BHYT, BHTN)",
        amount: totalIns,
        indexLabel: "(5)",
        group: "tax-ins",
        children: insurances,
    });

    // 6. Thuế
    const taxes = items.value.filter(i => i.formulaComponent === "tax");
    const totalTax = taxes.reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Thuế thu nhập cá nhân (TNCN)",
        amount: totalTax,
        indexLabel: "(6)",
        group: "tax-ins",
        children: taxes,
    });

    return list;
});

const columns = [
    { title: "STT", dataIndex: "indexLabel", key: "indexLabel", width: 60, align: "center" },
    { title: "Khoản mục", dataIndex: "itemName", key: "itemName" },
    { title: "Số tiền (VNĐ)", dataIndex: "amount", key: "amount", align: "right", width: 180 },
];

watch(
    () => modalOpen.value,
    (open) => {
        if (open) {
            loadItems();
        }
    }
);

const handleClose = () => {
    modalOpen.value = false;
};
</script>

<template>
    <ms-form
        v-model:open="modalOpen"
        title="Bảng chi tiết & Công thức tính lương"
        width="1000px"
        :show-save-and-add="false"
        @cancel="handleClose"
    >
        <div v-if="props.payroll" class="formula-container">
            <!-- Header Summary -->
            <Row :gutter="16" class="mb-24">
                <Col :span="6">
                    <Card size="small" class="summary-card">
                        <Statistic
                            title="Lương Gross"
                            :value="props.payroll.grossSalary"
                            :precision="0"
                            suffix="₫"
                            :value-style="{ color: '#1e293b' }"
                        >
                            <template #prefix><DollarOutlined /></template>
                        </Statistic>
                    </Card>
                </Col>
                <Col :span="6">
                    <Card size="small" class="summary-card">
                        <Statistic
                            title="Bảo hiểm (5)"
                            :value="props.payroll.insuranceDeduction"
                            :precision="0"
                            suffix="₫"
                            :value-style="{ color: '#f59e0b' }"
                        >
                            <template #prefix><SafetyCertificateOutlined /></template>
                        </Statistic>
                    </Card>
                </Col>
                <Col :span="6">
                    <Card size="small" class="summary-card">
                        <Statistic
                            title="Thuế TNCN (6)"
                            :value="props.payroll.pitTaxAmount"
                            :precision="0"
                            suffix="₫"
                            :value-style="{ color: '#ef4444' }"
                        >
                            <template #prefix><PercentageOutlined /></template>
                        </Statistic>
                    </Card>
                </Col>
                <Col :span="6">
                    <Card size="small" class="summary-card highlight">
                        <Statistic
                            title="Thực nhận"
                            :value="props.payroll.netSalary"
                            :precision="0"
                            suffix="₫"
                            :value-style="{ color: '#059669', fontWeight: 'bold' }"
                        >
                            <template #prefix><WalletOutlined /></template>
                        </Statistic>
                    </Card>
                </Col>
            </Row>

            <Descriptions bordered :column="2" size="small" class="mb-24">
                <Descriptions.Item label="Mã bảng lương">
                    <span class="font-bold">{{ props.payroll.payrollCode }}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                    <Tag :color="props.payroll.status === 'paid' ? 'green' : 'blue'">
                        {{ props.payroll.status?.toUpperCase() }}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Công chuẩn">{{ props.payroll.workingDaysStandard }} ngày</Descriptions.Item>
                <Descriptions.Item label="Công thực tế">{{ props.payroll.workingDaysActual }} ngày</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Diễn giải chi tiết các mục tính toán</Divider>
            <Table
                :columns="columns"
                :data-source="categorizedItems"
                :pagination="false"
                :loading="loading"
                size="middle"
                row-key="indexLabel"
                class="formula-table"
                :expand-column-width="30"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'indexLabel'">
                        <span class="index-label">{{ record.indexLabel }}</span>
                    </template>
                    <template v-if="column.key === 'itemName'">
                        <span :class="record.children ? 'font-bold' : ''">{{ record.itemName }}</span>
                    </template>
                    <template v-if="column.key === 'amount'">
                        <span :class="record.group === 'deduction' || record.group === 'tax-ins' ? 'text-danger' : 'text-success'">
                            {{ record.group === 'deduction' || record.group === 'tax-ins' ? '-' : '+' }} {{ formatCurrency(record.amount) }}
                        </span>
                    </template>
                </template>
                
                <!-- Hiển thị con nếu có -->
                <template #expandedRowRender="{ record }">
                    <div v-if="record.children && record.children.length" class="expanded-items">
                        <div v-for="child in record.children" :key="child.payrollItemId" class="expanded-item d-flex justify-content-between">
                            <span>• {{ child.itemName }} <small v-if="child.note">({{ child.note }})</small></span>
                            <span>{{ formatCurrency(child.amount) }}</span>
                        </div>
                    </div>
                    <div v-else class="text-muted text-center italic">Không có dữ liệu chi tiết</div>
                </template>
            </Table>

            <div class="formula-explanation mt-24">
                <div class="explanation-title">Quy trình tính toán hệ thống:</div>
                <div class="explanation-step">
                    <div class="step-label">Bước 1: Tính lương Gross</div>
                    <div class="step-desc">
                        Lương Gross = <span class="ref">(1)</span> + <span class="ref">(2)</span> + <span class="ref">(3)</span> - <span class="ref">(4)</span>
                    </div>
                    <div class="step-calc">
                        = {{ formatCurrency(items.find(i => i.formulaComponent === 'base_salary')?.amount || 0) }} + {{ formatCurrency(props.payroll.totalAllowance) }} + {{ formatCurrency(props.payroll.totalAddition) }} - {{ formatCurrency(props.payroll.totalDeduction) }} 
                        = <span class="font-bold">{{ formatCurrency(props.payroll.grossSalary) }} VNĐ</span>
                    </div>
                </div>
                
                <div class="explanation-step mt-16">
                    <div class="step-label">Bước 2: Tính lương Thực nhận (Net)</div>
                    <div class="step-desc">
                        Thực nhận = Lương Gross - <span class="ref">(5)</span> - <span class="ref">(6)</span>
                    </div>
                    <div class="step-calc">
                        = {{ formatCurrency(props.payroll.grossSalary) }} - {{ formatCurrency(props.payroll.insuranceDeduction) }} - {{ formatCurrency(props.payroll.pitTaxAmount) }}
                        = <span class="font-bold text-success" style="font-size: 1.1rem">{{ formatCurrency(props.payroll.netSalary) }} VNĐ</span>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="d-flex justify-content-end w-100">
                <ms-button type="primary" @click="handleClose">Đóng</ms-button>
            </div>
        </template>
    </ms-form>
</template>

<style scoped>
.mb-24 { margin-bottom: 24px; }
.mt-16 { margin-top: 16px; }
.mt-24 { margin-top: 24px; }
.font-bold { font-weight: 600; }
.italic { font-style: italic; }

.summary-card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.summary-card.highlight {
    background-color: #ecfdf5;
    border: 1px solid #10b981;
}

.index-label {
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    color: #475569;
    font-size: 12px;
}

.formula-table :deep(.ant-table-thead > tr > th) {
    background: #f8fafc;
    font-weight: 700;
}

.expanded-items {
    padding: 8px 40px;
    background: #fafafa;
}

.expanded-item {
    padding: 4px 0;
    border-bottom: 1px dashed #eee;
    font-size: 13px;
    color: #64748b;
}

.expanded-item:last-child {
    border-bottom: none;
}

.formula-explanation {
    background: #f8fafc;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.explanation-title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 16px;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.explanation-step {
    border-left: 3px solid #cbd5e1;
    padding-left: 16px;
}

.step-label {
    font-weight: 600;
    color: #475569;
}

.step-desc {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #1e293b;
    margin: 4px 0;
}

.ref {
    color: #2563eb;
    font-weight: 700;
}

.step-calc {
    font-family: 'Courier New', Courier, monospace;
    background: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    margin-top: 4px;
}

.text-success { color: #16a34a; }
.text-danger { color: #dc2626; }

.formula-container {
    max-height: 80vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 8px;
}
</style>
