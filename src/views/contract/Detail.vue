<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import MsButton from "@/components/ms-button/MsButton.vue";
import ContractsAPI from "@/apis/components/contracts/contractsAPI";
import { $toastError, $toastSuccess } from "@/utils/toastService";

const route = useRoute();
const contractId = computed(() => route.params.id);

const loading = ref(false);
const contract = ref(null);

const contractTypeLabels = {
    "Thử việc": "Thử việc",
    "Có thời hạn": "Có thời hạn",
    "Không thời hạn": "Không thời hạn",
};

const statusLabels = {
    true: "Đã ký",
    false: "Chưa ký",
};

async function loadContractDetail() {
    if (!contractId.value) return;

    loading.value = true;
    try {
        const response = await ContractsAPI.getById(contractId.value);
        contract.value = response?.data?.data || null;
    } catch (error) {
        $toastError("Lỗi khi tải chi tiết hợp đồng");
        console.error(error);
    } finally {
        loading.value = false;
    }
}

function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN");
}

function formatCurrency(value) {
    if (!value) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
}

function handleClose() {
    window.history.back();
}

onMounted(() => {
    loadContractDetail();
});
</script>

<template>
    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex justify-content-between align-items-center">
            <div class="content__title">Chi tiết hợp đồng</div>
            <ms-button type="outline" @click="handleClose">Đóng</ms-button>
        </div>

        <div class="content__body d-flex flex-1">
            <div v-if="loading" class="loading-container">
                <div class="loading-spinner">Đang tải...</div>
            </div>

            <div v-else-if="contract" class="contract-detail">
                <!-- Header Card -->
                <div class="detail-card detail-card--primary">
                    <div class="card-header">
                        <div class="header-main">
                            <h2 class="contract-name">
                                {{ contract.templateName || "Hợp đồng nhân sự" }}
                            </h2>
                            <span
                                :class="[
                                    'status-badge',
                                    contract.isSigned ? 'status-signed' : 'status-unsigned',
                                ]"
                            >
                                {{ statusLabels[contract.isSigned] || "-" }}
                            </span>
                        </div>
                        <div class="header-sub">
                            <span class="code-label">Mã HĐ:</span>
                            <span class="code-value">{{ contract.contractCode || "-" }}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-grid">
                    <!-- Column 1 -->
                    <div class="grid-column">
                        <div class="detail-section">
                            <div class="section-title">
                                <i class="icon-info"></i> Thông tin chung
                            </div>
                            <div class="section-content">
                                <div class="detail-item">
                                    <div class="detail-label">Loại hợp đồng:</div>
                                    <div class="detail-value font-medium">
                                        {{
                                            contractTypeLabels[contract.contractType] ||
                                            contract.contractType ||
                                            "-"
                                        }}
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Mã mẫu:</div>
                                    <div class="detail-value">
                                        {{ contract.templateCode || "-" }}
                                    </div>
                                </div>
                                <div class="detail-item" v-if="contract.isSigned">
                                    <div class="detail-label">Ngày ký:</div>
                                    <div class="detail-value text-success font-medium">
                                        {{ formatDate(contract.signedAt) }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <div class="section-title">
                                <i class="icon-user"></i> Thông tin nhân viên
                            </div>
                            <div class="section-content bg-light-gray rounded-sm">
                                <div class="detail-item">
                                    <div class="detail-label">Mã nhân viên:</div>
                                    <div class="detail-value font-semibold text-primary">
                                        {{ contract.employeeCode || "-" }}
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Họ và tên:</div>
                                    <div class="detail-value font-semibold">
                                        {{ contract.employeeName || "-" }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <div class="section-title">
                                <i class="icon-building"></i> Đại diện công ty
                            </div>
                            <div class="section-content">
                                <div class="detail-item">
                                    <div class="detail-label">Mã đại diện:</div>
                                    <div class="detail-value">
                                        {{ contract.companyRepresentativeCode || "-" }}
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Họ và tên:</div>
                                    <div class="detail-value font-medium">
                                        {{ contract.companyRepresentativeName || "-" }}
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Chức danh ký:</div>
                                    <div class="detail-value text-gray">
                                        {{ contract.companySignerTitle || "-" }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Column 2 -->
                    <div class="grid-column">
                        <div class="detail-section">
                            <div class="section-title">
                                <i class="icon-time"></i> Thời hạn hợp đồng
                            </div>
                            <div class="section-content flex-row">
                                <div class="time-box">
                                    <div class="time-label">Ngày hiệu lực</div>
                                    <div class="time-value text-primary font-semibold">
                                        {{ formatDate(contract.effectiveDate) }}
                                    </div>
                                </div>
                                <div class="time-divider">
                                    <i class="icon-arrow-right"></i>
                                </div>
                                <div class="time-box">
                                    <div class="time-label">Thời hạn</div>
                                    <div class="time-value font-semibold">
                                        {{
                                            contract.termMonths
                                                ? `${contract.termMonths} tháng`
                                                : "Không thời hạn"
                                        }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section highlight-section">
                            <div class="section-title">
                                <i class="icon-money"></i> Thông tin lương
                            </div>
                            <div class="section-content">
                                <div class="detail-item align-center">
                                    <div class="detail-label">Lương cơ bản:</div>
                                    <div class="detail-value text-xl font-bold text-primary">
                                        {{ formatCurrency(contract.baseSalary) }}
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Lương đóng BH:</div>
                                    <div class="detail-value font-medium">
                                        {{ formatCurrency(contract.insuranceSalary) }}
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Tỷ lệ hưởng lương:</div>
                                    <div class="detail-value">
                                        <div class="progress-bar-container">
                                            <div
                                                class="progress-bar"
                                                :style="{ width: `${contract.salaryRatio || 0}%` }"
                                            ></div>
                                        </div>
                                        <span class="ml-2 font-medium"
                                            >{{ contract.salaryRatio || 0 }}%</span
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="contract.summary || contract.attachmentLink"
                            class="detail-section"
                        >
                            <div class="section-title">
                                <i class="icon-document"></i> Tài liệu & Ghi chú
                            </div>
                            <div class="section-content">
                                <div v-if="contract.summary" class="summary-box mb-3">
                                    <div class="summary-label text-sm text-gray mb-1">
                                        Trích yếu:
                                    </div>
                                    <div class="summary-text">{{ contract.summary }}</div>
                                </div>
                                <div v-if="contract.attachmentLink" class="attachment-box">
                                    <div class="attachment-icon">📎</div>
                                    <a
                                        :href="contract.attachmentLink"
                                        target="_blank"
                                        class="attachment-link text-truncate"
                                        :title="contract.attachmentLink"
                                    >
                                        Xem tài liệu đính kèm
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer System Info -->
                <div class="system-info-bar">
                    <div class="sys-item">
                        <span class="sys-label">Tạo lúc:</span> {{ formatDate(contract.createdAt) }}
                        <span v-if="contract.createdBy" class="sys-by"
                            >bởi {{ contract.createdBy }}</span
                        >
                    </div>
                    <div class="sys-item" v-if="contract.updatedAt">
                        <span class="sys-label">Cập nhật:</span>
                        {{ formatDate(contract.updatedAt) }}
                        <span v-if="contract.updatedBy" class="sys-by"
                            >bởi {{ contract.updatedBy }}</span
                        >
                    </div>
                </div>
            </div>

            <div v-else class="empty-container">
                <div class="empty-message">Không tìm thấy hợp đồng</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";

.content__body {
    padding: 20px;
    overflow-y: auto;
}

.loading-container,
.empty-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.loading-spinner,
.empty-message {
    font-size: 16px;
    color: #666;
}

.contract-detail {
    max-width: 1000px;
    margin: 0 auto;
    width: 100%;
}

/* Header Card */
.detail-card--primary {
    background: linear-gradient(to right, #009b71, #007b5d);
    color: white;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0, 155, 113, 0.2);
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.contract-name {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: white;
}

.header-sub {
    font-size: 14px;
    opacity: 0.9;
}

.code-value {
    font-weight: 600;
    font-size: 16px;
}

.status-badge {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-signed {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.4);
}

.status-unsigned {
    background-color: rgba(255, 255, 255, 0.9);
    color: #ff4d4f;
    border: 1px solid #ff4d4f;
}

/* Grid Layout */
.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
}

@media (max-width: 768px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }
}

.grid-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* Sections */
.detail-section {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    height: 100%;
}

.highlight-section {
    border-top: 3px solid #009b71;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Items */
.section-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.align-center {
    align-items: center;
}

.detail-label {
    color: #6b7280;
    font-size: 14px;
    min-width: 130px;
}

.detail-value {
    color: #111827;
    font-size: 14px;
    text-align: right;
    word-break: break-word;
    display: flex;
    align-items: center;
}

/* Typography Utilities */
.font-medium {
    font-weight: 500;
}
.font-semibold {
    font-weight: 600;
}
.font-bold {
    font-weight: 700;
}
.text-primary {
    color: #009b71;
}
.text-success {
    color: #10b981;
}
.text-gray {
    color: #6b7280;
}
.text-xl {
    font-size: 20px;
}
.text-sm {
    font-size: 13px;
}
.mb-1 {
    margin-bottom: 4px;
}
.mb-3 {
    margin-bottom: 12px;
}
.ml-2 {
    margin-left: 8px;
}

/* Custom Components */
.bg-light-gray {
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 6px;
}

.flex-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
    padding: 16px;
    border-radius: 8px;
}

.time-box {
    text-align: center;
}

.time-label {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.time-value {
    font-size: 16px;
}

.progress-bar-container {
    width: 100px;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background-color: #009b71;
    border-radius: 4px;
}

.summary-text {
    font-size: 14px;
    line-height: 1.5;
    color: #374151;
    background: #f9fafb;
    padding: 12px;
    border-radius: 6px;
    border-left: 3px solid #d1d5db;
}

.attachment-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #f0fdf4;
    border: 1px dashed #86efac;
    border-radius: 6px;
}

.attachment-link {
    color: #009b71;
    font-weight: 500;
    text-decoration: none;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.attachment-link:hover {
    text-decoration: underline;
}

/* System Info Footer */
.system-info-bar {
    display: flex;
    justify-content: space-between;
    padding: 16px 24px;
    background: #f3f4f6;
    border-radius: 8px;
    color: #6b7280;
    font-size: 13px;
}

.sys-label {
    font-weight: 500;
    color: #4b5563;
}

.sys-by {
    font-style: italic;
    opacity: 0.8;
}
</style>
