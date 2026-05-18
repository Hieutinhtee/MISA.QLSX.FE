<script setup>
import { onMounted, ref, computed, inject } from "vue";
import {
    CloseOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    MessageOutlined,
} from "@ant-design/icons-vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import ApprovalRequestsAPI from "@/apis/components/approval-requests/approvalRequestsAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { REQUEST_TYPE_LABELS, STATUS_CONFIG } from "@/common/model/approvalRequestModel";

const { authState } = inject("auth");

const currentRole = computed(() => {
    let role = authState?.user?.role || null;
    if (role?.startsWith("ROLE_")) role = role.substring(5);
    return role;
});

const currentEmployeeId = computed(() => authState?.user?.employeeId || null);

const columns = ref([
    { key: "requestCode", name: "Mã yêu cầu", typeFilter: "text", width: 140 },
    {
        key: "requestType",
        name: "Loại yêu cầu",
        typeFilter: "status",
        width: 220,
        options: [
            { value: "department_member_transfer", label: "Thuyên chuyển thành viên phòng ban" },
            { value: "department_manager_change", label: "Đổi trưởng phòng" },
            { value: "contract_change", label: "Thay đổi hợp đồng" },
            { value: "leave_request", label: "Đơn nghỉ phép" },
        ],
    },
    { key: "title", name: "Tiêu đề", typeFilter: "text", width: 280 },
    { key: "createdByName", name: "Người tạo", typeFilter: "text", width: 180 },
    {
        key: "status",
        name: "Trạng thái",
        typeFilter: "status",
        width: 130,
        options: [
            { value: "pending", label: "Chờ duyệt" },
            { value: "approved", label: "Đã duyệt" },
            { value: "rejected", label: "Từ chối" },
            { value: "cancelled", label: "Đã hủy" },
        ],
    },
    { key: "effectiveDate", name: "Ngày hiệu lực", type: "date", width: 140 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
]);

const approvalTableRef = ref(null);
const isOpenModal = ref(false);
const isOpenApproveModal = ref(false);
const isOpenRejectModal = ref(false);
const selectedRow = ref(null);
const selectedSteps = ref([]);
const currentStepForAction = ref(null);
const rejectComment = ref("");

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(ApprovalRequestsAPI);

// === Helpers ===

function getTypeLabel(type) {
    return REQUEST_TYPE_LABELS[type] || type;
}

function getStatusConfig(status) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

const parsedPayload = computed(() => {
    if (!selectedRow.value?.payload) return null;
    try {
        return JSON.parse(selectedRow.value.payload);
    } catch (e) {
        return null;
    }
});

// === Load steps cho 1 request ===

async function loadSteps(requestId) {
    try {
        const res = await ApprovalRequestsAPI.getSteps(requestId);
        selectedSteps.value = res.data?.data || [];
    } catch (error) {
        console.error(error);
        selectedSteps.value = [];
    }
}

// === Approve / Reject ===

async function handleViewDetail(row) {
    selectedRow.value = row;
    await loadSteps(row.approvalRequestId);
    isOpenModal.value = true;
}

function findCurrentPendingStep() {
    return selectedSteps.value.find(
        (s) => s.status === "pending" && s.stepOrder === selectedRow.value?.currentStep,
    );
}

function canApproveCurrentStep() {
    const step = findCurrentPendingStep();
    if (!step || selectedRow.value?.status !== "pending") return false;

    // Nếu bước duyệt có quy định đích danh ID người duyệt
    if (step.approverId) {
        return step.approverId === currentEmployeeId.value;
    }

    // Nếu không thì kiểm tra theo Role
    return step.approverRole === currentRole.value;
}

function openApproveModal() {
    currentStepForAction.value = findCurrentPendingStep();
    if (!currentStepForAction.value) return;
    isOpenApproveModal.value = true;
}

function openRejectModal() {
    currentStepForAction.value = findCurrentPendingStep();
    if (!currentStepForAction.value) return;
    rejectComment.value = "";
    isOpenRejectModal.value = true;
}

async function handleConfirmApprove() {
    try {
        await ApprovalRequestsAPI.approveStep(
            selectedRow.value.approvalRequestId,
            currentStepForAction.value.approvalStepId,
            "",
        );
        $toastSuccess("Phê duyệt thành công");
        isOpenApproveModal.value = false;
        isOpenModal.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Phê duyệt thất bại");
        console.error(error);
    }
}

async function handleConfirmReject() {
    try {
        await ApprovalRequestsAPI.rejectStep(
            selectedRow.value.approvalRequestId,
            currentStepForAction.value.approvalStepId,
            rejectComment.value,
        );
        $toastSuccess("Từ chối thành công");
        isOpenRejectModal.value = false;
        isOpenModal.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Từ chối thất bại");
        console.error(error);
    }
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <!-- Modal xác nhận phê duyệt -->
    <ms-alert
        v-model="isOpenApproveModal"
        title="Xác nhận phê duyệt"
        :showConfirm="true"
        confirmText="Phê duyệt"
        confirmType="primary"
        @confirm="handleConfirmApprove"
    >
        Bạn có chắc chắn muốn <strong>phê duyệt</strong> yêu cầu
        <strong>{{ selectedRow?.requestCode }}</strong> không?
    </ms-alert>

    <!-- Modal từ chối -->
    <ms-alert
        v-model="isOpenRejectModal"
        title="Từ chối yêu cầu"
        :showConfirm="true"
        confirmText="Từ chối"
        confirmType="danger"
        @confirm="handleConfirmReject"
    >
        <div class="d-flex flex-column gap-8">
            <div>
                Bạn có chắc chắn muốn <strong>từ chối</strong> yêu cầu
                <strong>{{ selectedRow?.requestCode }}</strong
                >?
            </div>
            <textarea
                v-model="rejectComment"
                class="reject-comment"
                placeholder="Nhập lý do từ chối (tùy chọn)..."
                rows="3"
            ></textarea>
        </div>
    </ms-alert>

    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex">
            <div class="content__title">Phê duyệt</div>
        </div>

        <div class="content__body d-flex flex-1 flex-column">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                :loading="loading"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
                @edit-row="handleViewDetail"
                row-actions-name="Thao tác"
                :row-column-width="120"
                ref="approvalTableRef"
            >
                <!-- Custom cell: requestType -->
                <template #requestType="{ row }">
                    <span class="type-badge">{{ getTypeLabel(row.requestType) }}</span>
                </template>

                <!-- Custom cell: status -->
                <template #status="{ row }">
                    <span
                        class="status-badge"
                        :style="{
                            color: getStatusConfig(row.status).color,
                            backgroundColor: getStatusConfig(row.status).bg,
                        }"
                    >
                        {{ getStatusConfig(row.status).label }}
                    </span>
                </template>

                <!-- Custom row actions -->
                <template #row-actions="{ row }">
                    <div class="d-flex align-items-center gap-8">
                        <ms-button
                            size="small"
                            type="primary-outline"
                            @click.stop="handleViewDetail(row)"
                        >
                            Chi tiết
                        </ms-button>
                    </div>
                </template>
            </ms-table>
        </div>
    </div>

    <!-- Detail Modal -->
    <teleport to="body">
        <div v-if="isOpenModal" class="detail-overlay" @click.self="isOpenModal = false">
            <div class="detail-modal">
                <div class="detail-modal__header d-flex justify-content-between align-items-center">
                    <h3>Chi tiết yêu cầu {{ selectedRow?.requestCode }}</h3>
                    <div class="detail-modal__close" @click="isOpenModal = false">
                        <close-outlined />
                    </div>
                </div>

                <div class="detail-modal__body">
                    <div class="detail-section">
                        <div class="detail-row">
                            <span class="detail-label">Loại yêu cầu:</span>
                            <span>{{ getTypeLabel(selectedRow?.requestType) }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Tiêu đề:</span>
                            <span>{{ selectedRow?.title }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Trạng thái:</span>
                            <span
                                class="status-badge"
                                :style="{
                                    color: getStatusConfig(selectedRow?.status).color,
                                    backgroundColor: getStatusConfig(selectedRow?.status).bg,
                                }"
                            >
                                {{ getStatusConfig(selectedRow?.status).label }}
                            </span>
                        </div>
                        <div v-if="selectedRow?.description" class="detail-row">
                            <span class="detail-label">Mô tả:</span>
                            <span>{{ selectedRow?.description }}</span>
                        </div>
                        <div v-if="selectedRow?.effectiveDate" class="detail-row">
                            <span class="detail-label">Ngày hiệu lực:</span>
                            <span>{{
                                new Date(selectedRow.effectiveDate).toLocaleDateString("vi-VN")
                            }}</span>
                        </div>

                        <!-- Chi tiết dữ liệu thay đổi (Payload) -->
                        <div
                            v-if="parsedPayload && selectedRow?.requestType !== 'leave_request'"
                            class="payload-details"
                        >
                            <h5>Nội dung thay đổi chi tiết:</h5>
                            <div class="payload-box">
                                <template
                                    v-if="selectedRow.requestType === 'department_member_transfer'"
                                >
                                    <div class="payload-item">
                                        <strong>Nhân viên:</strong> {{ parsedPayload.employeeId }}
                                    </div>
                                    <div class="payload-item">
                                        <strong>Từ phòng ban:</strong>
                                        {{ parsedPayload.fromDepartmentId || "(Chưa có)" }}
                                    </div>
                                    <div class="payload-item">
                                        <strong>Đến phòng ban:</strong>
                                        {{ parsedPayload.toDepartmentId }}
                                    </div>
                                </template>

                                <template
                                    v-else-if="
                                        selectedRow.requestType === 'department_manager_change'
                                    "
                                >
                                    <div class="payload-item">
                                        <strong>Phòng ban:</strong> {{ parsedPayload.departmentId }}
                                    </div>
                                    <div class="payload-item">
                                        <strong>Trưởng phòng mới:</strong>
                                        {{ parsedPayload.newManagerId }}
                                    </div>
                                </template>

                                <template v-else>
                                    <pre class="json-payload">{{
                                        JSON.stringify(parsedPayload, null, 2)
                                    }}</pre>
                                </template>
                            </div>
                        </div>
                    </div>

                    <!-- Các bước phê duyệt -->
                    <div class="steps-section">
                        <h4>Quy trình phê duyệt</h4>
                        <div class="steps-timeline">
                            <div
                                v-for="step in selectedSteps"
                                :key="step.approvalStepId"
                                class="step-item"
                                :class="{
                                    'step-item--approved': step.status === 'approved',
                                    'step-item--rejected': step.status === 'rejected',
                                    'step-item--pending': step.status === 'pending',
                                    'step-item--current':
                                        step.stepOrder === selectedRow?.currentStep &&
                                        selectedRow?.status === 'pending',
                                }"
                            >
                                <div class="step-dot"></div>
                                <div class="step-content">
                                    <div class="step-title">
                                        Bước {{ step.stepOrder }}: {{ step.approverRole }}
                                    </div>
                                    <div class="step-status">
                                        <template v-if="step.status === 'approved'">
                                            <check-circle-outlined
                                                style="color: #52c41a; margin-right: 4px"
                                            />
                                            <span>Đã duyệt</span>
                                        </template>
                                        <template v-else-if="step.status === 'rejected'">
                                            <close-circle-outlined
                                                style="color: #ff4d4f; margin-right: 4px"
                                            />
                                            <span>Từ chối</span>
                                        </template>
                                        <template v-else>
                                            <clock-circle-outlined
                                                style="color: #faad14; margin-right: 4px"
                                            />
                                            <span>Chờ duyệt</span>
                                        </template>
                                    </div>
                                    <div v-if="step.comment" class="step-comment">
                                        <message-outlined
                                            style="color: #1890ff; margin-right: 4px"
                                        />
                                        <span>{{ step.comment }}</span>
                                    </div>
                                    <div v-if="step.actedAt" class="step-date">
                                        {{ new Date(step.actedAt).toLocaleString("vi-VN") }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div
                    v-if="canApproveCurrentStep()"
                    class="detail-modal__footer d-flex justify-content-end gap-8"
                >
                    <ms-button type="danger" @click="openRejectModal">Từ chối</ms-button>
                    <ms-button @click="openApproveModal">Phê duyệt</ms-button>
                </div>
            </div>
        </div>
    </teleport>
</template>

<style scoped>
@import "../shift/Index.css";

.gap-8 {
    gap: 8px;
}

.type-badge {
    font-size: 13px;
}

.status-badge {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
}

.reject-comment {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 14px;
    resize: vertical;
    font-family: inherit;
}

/* Detail Modal */
.detail-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.detail-modal {
    background: #fff;
    border-radius: 12px;
    width: 640px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.detail-modal__header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f0f0f0;
}

.detail-modal__header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.detail-modal__close {
    cursor: pointer;
    font-size: 18px;
    color: #999;
    padding: 4px 8px;
    border-radius: 4px;
}

.detail-modal__close:hover {
    background: #f5f5f5;
    color: #333;
}

.detail-modal__body {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
}

.detail-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid #f0f0f0;
}

.detail-section {
    margin-bottom: 24px;
}

.detail-row {
    display: flex;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #fafafa;
}

.detail-label {
    font-weight: 500;
    color: #666;
    min-width: 130px;
}

/* Payload styles */
.payload-details {
    margin-top: 20px;
    padding: 16px;
    background: #f9f9f9;
    border-radius: 8px;
    border-left: 4px solid #1890ff;
}

.payload-details h5 {
    margin: 0 0 12px;
    font-size: 14px;
    color: #333;
}

.payload-box {
    font-size: 13px;
    line-height: 1.6;
}

.payload-item {
    margin-bottom: 4px;
}

.json-payload {
    background: #282c34;
    color: #abb2bf;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
}

/* Steps timeline */
.steps-section h4 {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
}

.steps-timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.step-item {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    position: relative;
}

.step-item:not(:last-child)::after {
    content: "";
    position: absolute;
    left: 7px;
    top: 32px;
    bottom: -2px;
    width: 2px;
    background: #e0e0e0;
}

.step-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #e0e0e0;
    flex-shrink: 0;
    margin-top: 2px;
}

.step-item--approved .step-dot {
    background: #52c41a;
}

.step-item--rejected .step-dot {
    background: #ff4d4f;
}

.step-item--current .step-dot {
    background: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
}

.step-content {
    flex: 1;
}

.step-title {
    font-weight: 500;
    font-size: 14px;
}

.step-status {
    font-size: 13px;
    color: #666;
    margin-top: 2px;
}

.step-comment {
    font-size: 13px;
    color: #888;
    margin-top: 4px;
    font-style: italic;
}

.step-date {
    font-size: 12px;
    color: #aaa;
    margin-top: 2px;
}
</style>
