<script setup>
import { ref, computed, watch } from "vue";
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

const localStep = ref(1);
const localStatus = ref("");
const localDate = ref(null);

watch(
    () => props.salaryPeriod,
    async (newVal) => {
        if (!newVal) return;
        const status = newVal.status?.toLowerCase() || "";
        localStatus.value = status;
        
        let targetStep = 2; // Khởi tạo kỳ lương (Bước 1) đã xong khi tạo mới. Giờ là lúc tính lương (Bước 2)

        if (status === "paid") {
            targetStep = 5; // Đã xong toàn bộ
        } else if (status === "locked") {
            targetStep = 4; // Đã khóa, chờ chi trả
        } else if (status === "processing") {
            targetStep = 3; // Đã tính lương, chờ khóa
        } else if (status === "draft") {
            targetStep = 2; // Chờ tính lương (gồm cả tạo nháp)
            
            // Gọi API kiểm tra xem đã có payroll nào được tạo chưa
            try {
                if (newVal.salaryPeriodId) {
                    const res = await PayrollsAPI.paging({
                        page: 1,
                        pageSize: 50,
                        filters: [
                            {
                                field: "salaryPeriodId",
                                operator: "eq",
                                value: newVal.salaryPeriodId,
                            },
                        ],
                    });
                    const payrolls = res.data?.data || [];
                    if (payrolls.length > 0) {
                        // Kiểm tra xem đã tính lương chưa (có lương gross > 0 hoặc đã update)
                        const hasCalculated = payrolls.some(p => (p.grossSalary || 0) > 0);
                        if (hasCalculated) {
                            targetStep = 3; // Đã tính lương, chờ khóa
                            localStatus.value = "processing"; // Fake trạng thái processing cho UI
                        }
                    }
                }
            } catch (error) {
                console.error("Lỗi khi kiểm tra trạng thái payroll:", error);
            }
        }
        
        localStep.value = targetStep;

        switch (status) {
            case "draft":
                localDate.value = newVal.draftDate || newVal.updatedAt;
                break;
            case "locked":
                localDate.value = newVal.lockedDate || newVal.updatedAt;
                break;
            case "paid":
                localDate.value = newVal.paidDate || newVal.updatedAt;
                break;
            default:
                localDate.value = newVal.updatedAt;
                break;
        }
    },
    { immediate: true, deep: true }
);

const currentStep = computed(() => localStep.value);

const steps = [
    {
        title: "Tạo kỳ lương",
        description: "Khởi tạo kỳ lương mới",
        icon: FileTextOutlined,
    },
    {
        title: "Tính lương",
        description: "Tạo nháp và tính toán lương",
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
    switch (action) {
        case "calculate":
            return localStep.value === 2;
        case "lock":
            return localStep.value === 3;
        case "pay":
            return localStep.value === 4;
        default:
            return false;
    }
};

const getActionConfirmText = (action) => {
    switch (action) {
        case "calculate":
            return "Tạo bảng lương nháp và tính lương cho kỳ này?";
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
        case "calculate":
            return "Tạo nháp và tính lương thành công";
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
            case "calculate":
                // Gộp: Gọi generate trước (nếu chưa có hoặc để tạo lại nháp mới nhất)
                await PayrollsAPI.generateByPeriod(salaryPeriodId);
                res = await PayrollsAPI.calculateByPeriod(salaryPeriodId);
                localStep.value = 3;
                localStatus.value = "processing";
                localDate.value = new Date().toISOString();
                break;
            case "lock":
                res = await PayrollsAPI.lockByPeriod(salaryPeriodId);
                localStep.value = 4;
                localStatus.value = "locked";
                localDate.value = new Date().toISOString();
                break;
            case "pay":
                res = await PayrollsAPI.payByPeriod(salaryPeriodId);
                localStep.value = 5;
                localStatus.value = "paid";
                localDate.value = new Date().toISOString();
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

const getStatusBadge = () => {
    const status = localStatus.value || "";
    switch (status.toLowerCase()) {
        case "draft":
            return { status: "default", text: "Nháp" };
        case "processing":
            return { status: "processing", text: "Đã tính lương" };
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
    switch (localStep.value) {
        case 2:
        case 3:
            return "Ngày tính lương";
        case 4:
            return "Ngày khóa lương";
        case 5:
            return "Ngày chi trả";
        default:
            return "Ngày cập nhật";
    }
};

const getStatusDateValue = () => {
    return localDate.value;
};

const getStatusDescription = () => {
    switch (localStep.value) {
        case 2:
            return "Kỳ lương đang ở trạng thái nháp. Bạn cần khởi tạo và tính lương.";
        case 3:
            return "Lương đã được tính. Bạn cần khóa lương để chốt số liệu.";
        case 4:
            return "Kỳ lương đã được khóa. Bạn có thể chi trả lương.";
        case 5:
            return "Kỳ lương đã được chi trả. Không còn thao tác nào có thể thực hiện.";
        default:
            return "Trạng thái không xác định.";
    }
};

const getNextAction = () => {
    switch (localStep.value) {
        case 2:
            return "Bước tiếp theo: Tính lương";
        case 3:
            return "Bước tiếp theo: Khóa lương";
        case 4:
            return "Bước tiếp theo: Chi trả";
        case 5:
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
                        <Badge v-bind="getStatusBadge()" />
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
                <template v-if="currentStep < 5">
                    <div class="actions-title">Các thao tác có thể thực hiện:</div>

                    <div class="actions-group">
                        <!-- Tính lương -->
                        <Popconfirm
                            v-if="canRunAction('calculate')"
                            :title="getActionConfirmText('calculate')"
                            ok-text="Thực hiện"
                            cancel-text="Hủy"
                            :disabled="processingAction !== null"
                            @confirm="runAction('calculate')"
                        >
                            <Button
                                type="primary"
                                :loading="processingAction === 'calculate'"
                                size="large"
                                class="action-btn"
                            >
                                <CalculatorOutlined class="action-icon" />
                                Tính lương
                            </Button>
                        </Popconfirm>

                        <!-- Khóa lương -->
                        <Popconfirm
                            v-if="canRunAction('lock')"
                            :title="getActionConfirmText('lock')"
                            ok-text="Thực hiện"
                            cancel-text="Hủy"
                            :disabled="processingAction !== null"
                            @confirm="runAction('lock')"
                        >
                            <Button
                                type="primary"
                                danger
                                :loading="processingAction === 'lock'"
                                size="large"
                                class="action-btn"
                            >
                                <LockOutlined class="action-icon" />
                                Khóa lương
                            </Button>
                        </Popconfirm>

                        <!-- Chi trả -->
                        <Popconfirm
                            v-if="canRunAction('pay')"
                            :title="getActionConfirmText('pay')"
                            ok-text="Thực hiện"
                            cancel-text="Hủy"
                            :disabled="processingAction !== null"
                            @confirm="runAction('pay')"
                        >
                            <Button
                                type="primary"
                                :loading="processingAction === 'pay'"
                                size="large"
                                class="action-btn"
                            >
                                <PayCircleOutlined class="action-icon" />
                                Chi trả
                            </Button>
                        </Popconfirm>
                    </div>
                </template>

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

.actions-group {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
}

.action-btn {
    min-width: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
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
