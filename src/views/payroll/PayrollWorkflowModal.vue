<script setup>
import { ref, computed } from "vue";
import {
    Modal,
    Steps,
    Button,
    Badge,
    Popconfirm,
    Spin,
    Alert,
    Descriptions,
    DescriptionsItem,
} from "ant-design-vue";
import {
    FileTextOutlined,
    CalculatorOutlined,
    LockOutlined,
    PayCircleOutlined,
    CheckCircleOutlined,
    RightCircleOutlined,
} from "@ant-design/icons-vue";
import PayrollsAPI from "@/apis/components/payrolls/payrollsAPI";
import { $toastSuccess, $toastError } from "@/utils/toastService";

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

const emit = defineEmits(["update:open", "refresh", "view-detail"]);

const processingAction = ref(null);
const actionResult = ref(null);

const modalOpen = computed({
    get: () => props.open,
    set: (value) => emit("update:open", value),
});

const currentStep = computed(() => {
    const status = props.salaryPeriod?.status?.toLowerCase() || "";
    if (status === "paid") return 5;
    if (status === "locked") return 4;
    if (status === "draft") return 2;
    return 1;
});

const steps = [
    {
        title: "Tạo kỳ lương",
        description: "Khởi tạo kỳ lương mới",
        icon: FileTextOutlined,
    },
    {
        title: "Tạo nháp",
        description: "Tạo bảng lương nháp từ dữ liệu đầu vào",
        icon: FileTextOutlined,
    },
    {
        title: "Tính lương",
        description: "Tính toán lương dựa trên công thức",
        icon: CalculatorOutlined,
    },
    {
        title: "Khóa lương",
        description: "Khóa dữ liệu để không thể chỉnh sửa",
        icon: LockOutlined,
    },
    {
        title: "Chi trả",
        description: "Đánh dấu đã chi trả lương",
        icon: PayCircleOutlined,
    },
];

const getStepStatus = (index) => {
    const step = index + 1;
    if (step < currentStep.value) return "finish";
    if (step === currentStep.value) return "process";
    return "wait";
};

const getStepIcon = (index) => {
    const step = index + 1;
    if (step < currentStep.value) return CheckCircleOutlined;
    if (step === currentStep.value) return steps[index].icon;
    return null;
};

const canRunAction = (action) => {
    const status = props.salaryPeriod?.status?.toLowerCase() || "";
    switch (action) {
        case "generate":
            return status === "draft";
        case "calculate":
            return status === "draft";
        case "lock":
            return status === "draft";
        case "pay":
            return status === "locked";
        default:
            return false;
    }
};

const getActionConfirmText = (action) => {
    switch (action) {
        case "generate":
            return "Tạo bảng lương nháp cho kỳ này?";
        case "calculate":
            return "Tính lương cho kỳ này?";
        case "lock":
            return "Khóa kỳ lương này? Sau khi khóa sẽ không thể chỉnh sửa dữ liệu đầu vào.";
        case "pay":
            return "Đánh dấu đã chi trả kỳ lương này?";
        default:
            return "";
    }
};

const getActionSuccessMessage = (action) => {
    switch (action) {
        case "generate":
            return "Tạo bảng lương nháp thành công";
        case "calculate":
            return "Tính lương kỳ thành công";
        case "lock":
            return "Khóa lương kỳ thành công";
        case "pay":
            return "Đánh dấu chi trả thành công";
        default:
            return "";
    }
};

const getActionErrorMessage = (action) => {
    switch (action) {
        case "generate":
            return "Tạo bảng lương nháp thất bại";
        case "calculate":
            return "Tính lương kỳ thất bại";
        case "lock":
            return "Khóa lương kỳ thất bại";
        case "pay":
            return "Đánh dấu chi trả thất bại";
        default:
            return "";
    }
};

const runAction = async (action) => {
    const salaryPeriodId = props.salaryPeriod?.salaryPeriodId;
    if (!salaryPeriodId) {
        $toastError("Không tìm thấy kỳ lương hợp lệ.");
        return;
    }

    processingAction.value = action;
    actionResult.value = null;

    try {
        let res;
        switch (action) {
            case "generate":
                res = await PayrollsAPI.generateByPeriod(salaryPeriodId);
                break;
            case "calculate":
                res = await PayrollsAPI.calculateByPeriod(salaryPeriodId);
                break;
            case "lock":
                res = await PayrollsAPI.lockByPeriod(salaryPeriodId);
                break;
            case "pay":
                res = await PayrollsAPI.payByPeriod(salaryPeriodId);
                break;
        }

        actionResult.value = {
            success: true,
            message: res?.data?.message || getActionSuccessMessage(action),
        };

        $toastSuccess(res?.data?.message || getActionSuccessMessage(action));

        emit("refresh");
    } catch (error) {
        console.error(error);
        actionResult.value = {
            success: false,
            message: getActionErrorMessage(action),
        };
        $toastError(getActionErrorMessage(action));
    } finally {
        processingAction.value = null;
    }
};

const handleViewPayrollDetail = () => {
    emit("view-detail", props.salaryPeriod);
};

const getStatusBadge = (status) => {
    const normalized = (status || "").toLowerCase();
    switch (normalized) {
        case "draft":
            return { status: "default", text: "Nháp" };
        case "locked":
            return { status: "warning", text: "Đã khóa" };
        case "paid":
            return { status: "success", text: "Đã chi trả" };
        default:
            return { status: "default", text: status || "Không xác định" };
    }
};

const formatPeriodLabel = () => {
    const startDate = props.salaryPeriod?.startDate ? new Date(props.salaryPeriod.startDate) : null;
    if (!startDate || Number.isNaN(startDate.getTime())) {
        return "Không xác định";
    }
    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const year = startDate.getFullYear();
    return `${month}/${year}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
};

const getStatusDateLabel = () => {
    const status = props.salaryPeriod?.status?.toLowerCase() || "";
    switch (status) {
        case "draft":
            return "Ngày tạo nháp";
        case "locked":
            return "Ngày khóa lương";
        case "paid":
            return "Ngày chi trả";
        default:
            return "Ngày cập nhật";
    }
};

const getStatusDateValue = () => {
    const status = props.salaryPeriod?.status?.toLowerCase() || "";
    // Ưu tiên dùng các field cụ thể nếu có, nếu không thì dùng updatedAt
    switch (status) {
        case "draft":
            return props.salaryPeriod?.draftDate || props.salaryPeriod?.updatedAt;
        case "locked":
            return props.salaryPeriod?.lockedDate || props.salaryPeriod?.updatedAt;
        case "paid":
            return props.salaryPeriod?.paidDate || props.salaryPeriod?.updatedAt;
        default:
            return props.salaryPeriod?.updatedAt;
    }
};

const getStatusDescription = () => {
    const status = props.salaryPeriod?.status?.toLowerCase() || "";
    switch (status) {
        case "draft":
            return "Kỳ lương đang ở trạng thái nháp. Bạn có thể tạo nháp, tính lương hoặc khóa lương.";
        case "locked":
            return "Kỳ lương đã được khóa. Bạn có thể chi trả lương.";
        case "paid":
            return "Kỳ lương đã được chi trả. Không còn thao tác nào có thể thực hiện.";
        default:
            return "Trạng thái không xác định.";
    }
};

const getNextAction = () => {
    const status = props.salaryPeriod?.status?.toLowerCase() || "";
    switch (status) {
        case "draft":
            return "Bước tiếp theo: Tính lương hoặc Khóa lương";
        case "locked":
            return "Bước tiếp theo: Chi trả";
        case "paid":
            return "Đã hoàn thành";
        default:
            return "";
    }
};
</script>

<template>
    <Modal
        v-model:open="modalOpen"
        :title="`Quy trình xử lý lương - Kỳ ${formatPeriodLabel()}`"
        width="900px"
        :footer="null"
        centered
        :closable="true"
        :mask-closable="true"
    >
        <div v-if="salaryPeriod" class="workflow-modal">
            <!-- Thông tin kỳ lương -->
            <div class="period-info">
                <Descriptions bordered size="small" :column="2">
                    <DescriptionsItem label="Kỳ lương">
                        <strong>{{ formatPeriodLabel() }}</strong>
                    </DescriptionsItem>
                    <DescriptionsItem label="Trạng thái">
                        <Badge v-bind="getStatusBadge(salaryPeriod.status)" />
                    </DescriptionsItem>
                    <DescriptionsItem label="Từ ngày">
                        {{ formatDate(salaryPeriod.startDate) }}
                    </DescriptionsItem>
                    <DescriptionsItem label="Đến ngày">
                        {{ formatDate(salaryPeriod.endDate) }}
                    </DescriptionsItem>
                    <DescriptionsItem label="Ngày tạo">
                        {{ formatDate(salaryPeriod.createdAt) }}
                    </DescriptionsItem>
                    <DescriptionsItem :label="getStatusDateLabel()">
                        {{ formatDate(getStatusDateValue()) }}
                    </DescriptionsItem>
                </Descriptions>
            </div>

            <!-- Steps hiển thị tiến trình -->
            <div class="steps-container">
                <Steps :current="currentStep - 1" size="small">
                    <Steps.Step
                        v-for="(step, index) in steps"
                        :key="index"
                        :title="step.title"
                        :description="step.description"
                        :status="getStepStatus(index)"
                    >
                        <template #icon>
                            <component :is="getStepIcon(index)" v-if="getStepIcon(index)" />
                        </template>
                    </Steps.Step>
                </Steps>
            </div>

            <!-- Thông tin trạng thái -->
            <div class="status-info">
                <Alert :message="getStatusDescription()" type="info" show-icon />
                <div v-if="getNextAction()" class="next-action">
                    <strong>{{ getNextAction() }}</strong>
                </div>
            </div>

            <!-- Kết quả action gần nhất -->
            <Alert
                v-if="actionResult"
                :type="actionResult.success ? 'success' : 'error'"
                :message="actionResult.message"
                show-icon
                closable
                class="action-result"
                @close="actionResult = null"
            />

            <!-- Các action có thể thực hiện -->
            <div class="actions-container">
                <div class="actions-title">Các thao tác có thể thực hiện:</div>

                <div class="actions-grid">
                    <!-- Tạo nháp -->
                    <Popconfirm
                        :title="getActionConfirmText('generate')"
                        ok-text="Thực hiện"
                        cancel-text="Hủy"
                        :disabled="!canRunAction('generate') || processingAction !== null"
                        @confirm="runAction('generate')"
                    >
                        <Button
                            type="default"
                            :loading="processingAction === 'generate'"
                            :disabled="!canRunAction('generate')"
                            block
                            size="large"
                        >
                            <FileTextOutlined class="action-icon" />
                            Tạo nháp
                        </Button>
                    </Popconfirm>

                    <!-- Tính lương -->
                    <Popconfirm
                        :title="getActionConfirmText('calculate')"
                        ok-text="Thực hiện"
                        cancel-text="Hủy"
                        :disabled="!canRunAction('calculate') || processingAction !== null"
                        @confirm="runAction('calculate')"
                    >
                        <Button
                            type="primary"
                            :loading="processingAction === 'calculate'"
                            :disabled="!canRunAction('calculate')"
                            block
                            size="large"
                        >
                            <CalculatorOutlined class="action-icon" />
                            Tính lương
                        </Button>
                    </Popconfirm>

                    <!-- Khóa lương -->
                    <Popconfirm
                        :title="getActionConfirmText('lock')"
                        ok-text="Thực hiện"
                        cancel-text="Hủy"
                        :disabled="!canRunAction('lock') || processingAction !== null"
                        @confirm="runAction('lock')"
                    >
                        <Button
                            type="primary"
                            danger
                            :loading="processingAction === 'lock'"
                            :disabled="!canRunAction('lock')"
                            block
                            size="large"
                        >
                            <LockOutlined class="action-icon" />
                            Khóa lương
                        </Button>
                    </Popconfirm>

                    <!-- Chi trả -->
                    <Popconfirm
                        :title="getActionConfirmText('pay')"
                        ok-text="Thực hiện"
                        cancel-text="Hủy"
                        :disabled="!canRunAction('pay') || processingAction !== null"
                        @confirm="runAction('pay')"
                    >
                        <Button
                            type="primary"
                            :loading="processingAction === 'pay'"
                            :disabled="!canRunAction('pay')"
                            block
                            size="large"
                        >
                            <PayCircleOutlined class="action-icon" />
                            Chi trả
                        </Button>
                    </Popconfirm>
                </div>

                <!-- Nút xem chi tiết bảng lương -->
                <div class="detail-action">
                    <Button type="link" @click="handleViewPayrollDetail">
                        <RightCircleOutlined />
                        Xem chi tiết bảng lương
                    </Button>
                </div>
            </div>
        </div>

        <div v-else class="loading-container">
            <Spin size="large" />
        </div>
    </Modal>
</template>

<style scoped>
.workflow-modal {
    padding: 8px 0;
}

.period-info {
    margin-bottom: 24px;
}

.steps-container {
    margin-bottom: 24px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
}

.status-info {
    margin-bottom: 16px;
}

.next-action {
    margin-top: 8px;
    padding: 8px 12px;
    background: #e0f2fe;
    border-radius: 6px;
    color: #075985;
    font-size: 14px;
}

.action-result {
    margin-bottom: 16px;
}

.actions-container {
    border-top: 1px solid #e5e7eb;
    padding-top: 20px;
}

.actions-title {
    font-weight: 600;
    margin-bottom: 16px;
    color: #374151;
}

.actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
}

.action-icon {
    margin-right: 8px;
    font-size: 16px;
}

.detail-action {
    text-align: center;
    padding-top: 8px;
}

.modal-footer {
    margin: 10px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
}
</style>
