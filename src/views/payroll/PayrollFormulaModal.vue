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
const expandedRowKeys = ref([]);

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
// childrenMap lưu riêng để không để AntD tự render tree table
const childrenMap = computed(() => {
    const map = {};
    if (!items.value.length) return map;

    map["(2)"] = items.value.filter(i => i.formulaComponent === "allowance");
    map["(3)"] = items.value.filter(i => i.formulaComponent === "bonus" || (i.itemType === "addition" && !["base_salary", "allowance"].includes(i.formulaComponent)));
    map["(4)"] = items.value.filter(i => i.formulaComponent === "penalty" || (i.itemType === "deduction" && !["insurance", "tax"].includes(i.formulaComponent)));
    map["(5)"] = items.value.filter(i => i.formulaComponent === "insurance");
    map["(6)"] = items.value.filter(i => i.formulaComponent === "tax");

    return map;
});

const categorizedItems = computed(() => {
    const list = [];
    if (!items.value.length) return list;

    // 1. Lương theo công (không có children)
    const base = items.value.find(i => i.formulaComponent === "base_salary");
    if (base) list.push({ ...base, indexLabel: "(1)", group: "income", hasChildren: false });

    // 2. Phụ cấp
    const totalAlw = (childrenMap.value["(2)"] || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Tổng phụ cấp (từ hợp đồng)",
        amount: totalAlw,
        indexLabel: "(2)",
        group: "income",
        hasChildren: (childrenMap.value["(2)"] || []).length > 0,
    });

    // 3. Các khoản cộng thêm
    const totalAdd = (childrenMap.value["(3)"] || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Các khoản cộng thêm (thưởng, hỗ trợ...)",
        amount: totalAdd,
        indexLabel: "(3)",
        group: "income",
        hasChildren: (childrenMap.value["(3)"] || []).length > 0,
    });

    // 4. Các khoản trừ
    const totalDed = (childrenMap.value["(4)"] || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Các khoản khấu trừ (phạt, nghỉ...)",
        amount: totalDed,
        indexLabel: "(4)",
        group: "deduction",
        hasChildren: (childrenMap.value["(4)"] || []).length > 0,
    });

    // 5. Bảo hiểm
    const totalIns = (childrenMap.value["(5)"] || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Các khoản bảo hiểm (BHXH, BHYT, BHTN)",
        amount: totalIns,
        indexLabel: "(5)",
        group: "tax-ins",
        hasChildren: (childrenMap.value["(5)"] || []).length > 0,
    });

    // 6. Thuế
    const totalTax = (childrenMap.value["(6)"] || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    list.push({
        itemName: "Thuế thu nhập cá nhân (TNCN)",
        amount: totalTax,
        indexLabel: "(6)",
        group: "tax-ins",
        hasChildren: (childrenMap.value["(6)"] || []).length > 0,
    });

    return list;
});

const dependentCount = computed(() => {
    const taxItem = items.value.find(i => i.formulaComponent === "tax");
    if (taxItem && taxItem.note) {
        const match = taxItem.note.match(/Số NPT: (\d+)/);
        if (match) return parseInt(match[1]);
    }
    return "?";
});

const expandable = computed(() => ({
    expandedRowKeys: expandedRowKeys.value,
    rowExpandable: (record) => record.hasChildren,
    onExpand: (expanded, record) => {
        if (expanded) {
            expandedRowKeys.value = [...expandedRowKeys.value, record.indexLabel];
        } else {
            expandedRowKeys.value = expandedRowKeys.value.filter(k => k !== record.indexLabel);
        }
    },
}));

const columns = [
    { title: "STT", dataIndex: "indexLabel", key: "indexLabel", width: 60, align: "center" },
    { title: "Khoản mục", dataIndex: "itemName", key: "itemName" },
    { title: "Số tiền (VNĐ)", dataIndex: "amount", key: "amount", align: "right", width: 180 },
];

watch(
    () => modalOpen.value,
    (open) => {
        if (open) {
            expandedRowKeys.value = [];
            loadItems();
        } else {
            expandedRowKeys.value = [];
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
                :expandable="expandable"
                size="middle"
                row-key="indexLabel"
                class="formula-table"
                :expand-column-width="36"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'indexLabel'">
                        <span class="index-label">{{ record.indexLabel }}</span>
                    </template>
                    <template v-if="column.key === 'itemName'">
                        <span :class="record.hasChildren ? 'font-bold' : ''">{{ record.itemName }}</span>
                    </template>
                    <template v-if="column.key === 'amount'">
                        <span :class="record.group === 'deduction' || record.group === 'tax-ins' ? 'text-danger' : 'text-success'">
                            {{ record.group === 'deduction' || record.group === 'tax-ins' ? '-' : '+' }} {{ formatCurrency(record.amount) }}
                        </span>
                    </template>
                </template>

                <!-- Expand: chỉ render khi record.hasChildren = true -->
                <template #expandedRowRender="{ record }">
                    <div class="expanded-items">
                        <template v-if="childrenMap[record.indexLabel] && childrenMap[record.indexLabel].length">
                            <div
                                v-for="child in childrenMap[record.indexLabel]"
                                :key="child.payrollItemId"
                                class="expanded-item d-flex justify-content-between"
                            >
                                <span>• {{ child.itemName }} <small v-if="child.note">({{ child.note }})</small></span>
                                <span :class="record.group === 'deduction' || record.group === 'tax-ins' ? 'text-danger' : ''">
                                    {{ formatCurrency(child.amount) }}
                                </span>
                            </div>
                        </template>
                        <div v-else class="text-muted text-center italic">Không có dữ liệu chi tiết</div>
                    </div>
                </template>
            </Table>

            <div class="formula-explanation mt-24">
                <div class="explanation-title">Quy trình tính toán hệ thống:</div>

                <div class="explanation-step">
                    <div class="step-label">Bước 1: Tính lương Gross</div>
                    <div class="step-desc">
                        Lương Gross = <span class="ref">(1)</span> Lương cơ bản + <span class="ref">(2)</span> Phụ cấp + <span class="ref">(3)</span> Cộng thêm - <span class="ref">(4)</span> Khấu trừ
                    </div>
                    <div class="step-calc">
                        = {{ formatCurrency(items.find(i => i.formulaComponent === 'base_salary')?.amount || 0) }}
                        + {{ formatCurrency(props.payroll.totalAllowance) }}
                        + {{ formatCurrency(props.payroll.totalAddition) }}
                        - {{ formatCurrency(props.payroll.totalDeduction) }}
                        = <span class="font-bold">{{ formatCurrency(props.payroll.grossSalary) }} ₫</span>
                    </div>
                    <div class="step-note">
                        Lương cơ bản tính pro-rate theo số ngày công thực tế trong hợp đồng. Phụ cấp từ hợp đồng (cố định hoặc % lương). Cộng thêm/trừ từ chấm công (bonus, OT, phạt).
                    </div>
                </div>

                <div class="explanation-step mt-16">
                    <div class="step-label">Bước 2: Khấu trừ bảo hiểm <span class="ref">(5)</span></div>
                    <div class="step-desc">
                        Bảo hiểm = Lương đóng BH (hợp đồng) × (BHXH 8% + BHYT 1.5% + BHTN 1%) = Lương đóng BH × 10.5%
                    </div>
                    <div class="step-calc">
                        Lương đóng BH ≈ {{ formatCurrency(Math.round(props.payroll.insuranceDeduction / 0.105)) }} ₫<br/>
                        Bảo hiểm = {{ formatCurrency(Math.round(props.payroll.insuranceDeduction / 0.105)) }} × 10.5%
                        = <span class="font-bold text-danger">{{ formatCurrency(props.payroll.insuranceDeduction) }} ₫</span>
                    </div>
                    <div class="step-note">
                        Tỷ lệ theo <em>Chính sách giảm trừ</em> hiệu lực tại đầu kỳ. Căn cứ là lương BH trong hợp đồng, không phải lương Gross.
                    </div>
                </div>

                <div class="explanation-step mt-16">
                    <div class="step-label">Bước 3: Giảm trừ gia cảnh</div>
                    <div class="step-desc">
                        Tổng giảm trừ = Giảm trừ bản thân + (Số người phụ thuộc × Mức giảm trừ/người)
                    </div>
                    <div class="step-calc">
                        Giảm trừ bản thân: <strong>11.000.000 ₫/tháng</strong><br/>
                        Giảm trừ gia cảnh: <strong>{{ dependentCount }}</strong> người × <strong>4.400.000 ₫/người</strong>
                    </div>
                    <div class="step-note">
                        Số người phụ thuộc lấy từ <em>Hồ sơ thuế nhân viên</em> hiệu lực tại cuối kỳ.
                    </div>
                </div>

                <div class="explanation-step mt-16">
                    <div class="step-label">Bước 4: Thu nhập chịu thuế</div>
                    <div class="step-desc">
                        Thu nhập chịu thuế = Gross - Bảo hiểm - Giảm trừ bản thân - Giảm trừ gia cảnh (≥ 0)
                    </div>
                    <div class="step-calc">
                        = {{ formatCurrency(props.payroll.grossSalary) }}
                        - {{ formatCurrency(props.payroll.insuranceDeduction) }}
                        - Giảm trừ
                        = <span class="font-bold">{{ formatCurrency(props.payroll.taxableSalary) }} ₫</span>
                    </div>
                </div>

                <div class="explanation-step mt-16">
                    <div class="step-label">Bước 5: Thuế TNCN lũy tiến <span class="ref">(6)</span></div>
                    <div class="step-desc">
                        Công thức: Thuế = (Thu nhập chịu thuế - Cận dưới bậc) × Thuế suất + Giảm trừ nhanh
                    </div>
                    <div class="tax-bracket-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Bậc</th>
                                    <th>Thu nhập chịu thuế/tháng</th>
                                    <th>Thuế suất</th>
                                    <th>Giảm trừ nhanh</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr :class="props.payroll.taxableSalary > 0 && props.payroll.taxableSalary <= 5000000 ? 'active-bracket' : ''">
                                    <td>1</td><td>≤ 5.000.000 ₫</td><td>5%</td><td>0 ₫</td>
                                </tr>
                                <tr :class="props.payroll.taxableSalary > 5000000 && props.payroll.taxableSalary <= 10000000 ? 'active-bracket' : ''">
                                    <td>2</td><td>5 – 10 triệu</td><td>10%</td><td>250.000 ₫</td>
                                </tr>
                                <tr :class="props.payroll.taxableSalary > 10000000 && props.payroll.taxableSalary <= 18000000 ? 'active-bracket' : ''">
                                    <td>3</td><td>10 – 18 triệu</td><td>15%</td><td>750.000 ₫</td>
                                </tr>
                                <tr :class="props.payroll.taxableSalary > 18000000 && props.payroll.taxableSalary <= 32000000 ? 'active-bracket' : ''">
                                    <td>4</td><td>18 – 32 triệu</td><td>20%</td><td>1.650.000 ₫</td>
                                </tr>
                                <tr :class="props.payroll.taxableSalary > 32000000 && props.payroll.taxableSalary <= 52000000 ? 'active-bracket' : ''">
                                    <td>5</td><td>32 – 52 triệu</td><td>25%</td><td>3.250.000 ₫</td>
                                </tr>
                                <tr :class="props.payroll.taxableSalary > 52000000 && props.payroll.taxableSalary <= 80000000 ? 'active-bracket' : ''">
                                    <td>6</td><td>52 – 80 triệu</td><td>30%</td><td>5.850.000 ₫</td>
                                </tr>
                                <tr :class="props.payroll.taxableSalary > 80000000 ? 'active-bracket' : ''">
                                    <td>7</td><td>> 80 triệu</td><td>35%</td><td>9.850.000 ₫</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="step-calc mt-8">
                        Thu nhập chịu thuế: <strong>{{ formatCurrency(props.payroll.taxableSalary) }} ₫</strong><br/>
                        Thuế TNCN = <span class="font-bold text-danger">{{ formatCurrency(props.payroll.pitTaxAmount) }} ₫</span>
                    </div>
                </div>

                <div class="explanation-step mt-16">
                    <div class="step-label">Bước 6: Lương thực nhận (Net)</div>
                    <div class="step-desc">
                        Thực nhận = Lương Gross - Bảo hiểm <span class="ref">(5)</span> - Thuế TNCN <span class="ref">(6)</span>
                    </div>
                    <div class="step-calc">
                        = {{ formatCurrency(props.payroll.grossSalary) }}
                        - {{ formatCurrency(props.payroll.insuranceDeduction) }}
                        - {{ formatCurrency(props.payroll.pitTaxAmount) }}
                        = <span class="font-bold text-success" style="font-size: 1.1rem">{{ formatCurrency(props.payroll.netSalary) }} ₫</span>
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

.step-note {
    margin-top: 6px;
    font-size: 12px;
    color: #94a3b8;
    font-style: italic;
}

.mt-8 { margin-top: 8px; }

.tax-bracket-table {
    margin-top: 10px;
    overflow-x: auto;
}

.tax-bracket-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
}

.tax-bracket-table th,
.tax-bracket-table td {
    border: 1px solid #e2e8f0;
    padding: 5px 10px;
    text-align: center;
}

.tax-bracket-table thead tr {
    background: #f1f5f9;
    font-weight: 600;
    color: #475569;
}

.tax-bracket-table tbody tr:hover {
    background: #f8fafc;
}

.tax-bracket-table tbody tr.active-bracket {
    background: #fef9c3;
    font-weight: 700;
    color: #92400e;
    border-left: 3px solid #f59e0b;
}

.formula-container {
    max-height: 80vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 8px;
}
</style>
