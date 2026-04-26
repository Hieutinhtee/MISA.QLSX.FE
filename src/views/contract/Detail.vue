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
        <div class="content__header d-flex">
            <div class="content__title">Chi tiết hợp đồng</div>
            <ms-button @click="handleClose">Đóng</ms-button>
        </div>

        <div class="content__body d-flex flex-1">
            <div v-if="loading" class="loading-container">
                <div class="loading-spinner">Đang tải...</div>
            </div>

            <div v-else-if="contract" class="contract-detail">
                <div class="detail-section">
                    <div class="section-title">Thông tin chung</div>
                    <div class="detail-row">
                        <div class="detail-label">Mã hợp đồng:</div>
                        <div class="detail-value">{{ contract.contractCode || "-" }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Mã mẫu:</div>
                        <div class="detail-value">{{ contract.templateCode || "-" }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Tên mẫu:</div>
                        <div class="detail-value">{{ contract.templateName || "-" }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Loại hợp đồng:</div>
                        <div class="detail-value">
                            {{ contractTypeLabels[contract.contractType] || contract.contractType || "-" }}
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Trạng thái ký:</div>
                        <div class="detail-value">
                            <span :class="['status-badge', contract.isSigned ? 'status-signed' : 'status-unsigned']">
                                {{ statusLabels[contract.isSigned] || "-" }}
                            </span>
                        </div>
                    </div>
                    <div v-if="contract.isSigned" class="detail-row">
                        <div class="detail-label">Ngày ký:</div>
                        <div class="detail-value">{{ formatDate(contract.signedAt) }}</div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">Thông tin nhân viên</div>
                    <div class="detail-row">
                        <div class="detail-label">Mã nhân viên:</div>
                        <div class="detail-value">{{ contract.employeeCode || "-" }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Họ và tên:</div>
                        <div class="detail-value">{{ contract.employeeName || "-" }}</div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">Thông tin đại diện công ty</div>
                    <div class="detail-row">
                        <div class="detail-label">Mã đại diện:</div>
                        <div class="detail-value">{{ contract.companyRepresentativeCode || "-" }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Họ và tên:</div>
                        <div class="detail-value">{{ contract.companyRepresentativeName || "-" }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Chức danh ký:</div>
                        <div class="detail-value">{{ contract.companySignerTitle || "-" }}</div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">Thông tin lương</div>
                    <div class="detail-row">
                        <div class="detail-label">Lương cơ bản:</div>
                        <div class="detail-value">{{ formatCurrency(contract.baseSalary) }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Lương đóng BH:</div>
                        <div class="detail-value">{{ formatCurrency(contract.insuranceSalary) }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Tỷ lệ lương:</div>
                        <div class="detail-value">{{ contract.salaryRatio || 0 }}%</div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">Thông tin thời hạn</div>
                    <div class="detail-row">
                        <div class="detail-label">Ngày hiệu lực:</div>
                        <div class="detail-value">{{ formatDate(contract.effectiveDate) }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Thời hạn:</div>
                        <div class="detail-value">
                            {{ contract.termMonths ? `${contract.termMonths} tháng` : "Không thời hạn" }}
                        </div>
                    </div>
                </div>

                <div v-if="contract.summary" class="detail-section">
                    <div class="section-title">Trích yếu</div>
                    <div class="detail-row detail-row--full">
                        <div class="detail-value">{{ contract.summary }}</div>
                    </div>
                </div>

                <div v-if="contract.attachmentLink" class="detail-section">
                    <div class="section-title">File đính kèm</div>
                    <div class="detail-row">
                        <div class="detail-value">
                            <a
                                v-if="contract.attachmentLink"
                                :href="contract.attachmentLink"
                                target="_blank"
                                class="attachment-link"
                            >
                                {{ contract.attachmentLink }}
                            </a>
                            <span v-else>-</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="section-title">Thông tin hệ thống</div>
                    <div class="detail-row">
                        <div class="detail-label">Ngày tạo:</div>
                        <div class="detail-value">{{ formatDate(contract.createdAt) }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Người tạo:</div>
                        <div class="detail-value">{{ contract.createdBy || "-" }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Ngày sửa:</div>
                        <div class="detail-value">{{ formatDate(contract.updatedAt) }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Người sửa:</div>
                        <div class="detail-value">{{ contract.updatedBy || "-" }}</div>
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
    max-width: 900px;
    margin: 0 auto;
}

.detail-section {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 16px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #009b71;
}

.detail-row {
    display: flex;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-row--full {
    flex-direction: column;
}

.detail-label {
    width: 200px;
    font-weight: 500;
    color: #666;
    flex-shrink: 0;
}

.detail-value {
    flex: 1;
    color: #333;
    word-break: break-word;
}

.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
}

.status-signed {
    background-color: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
}

.status-unsigned {
    background-color: #fff1f0;
    color: #ff4d4f;
    border: 1px solid #ffa39e;
}

.attachment-link {
    color: #009b71;
    text-decoration: none;
    word-break: break-all;
}

.attachment-link:hover {
    text-decoration: underline;
}
</style>
