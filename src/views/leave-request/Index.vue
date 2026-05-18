<script setup>
defineOptions({ name: "LeaveRequests" });

import { computed, inject, onMounted, ref } from "vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsForm from "@/components/ms-form/MsForm.vue";
import MsDatePicker from "@/components/ms-date-picker/MsDatePicker.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import LeaveRequestsAPI from "@/apis/components/leave-requests/leaveRequestsAPI";
import ApprovalRequestsAPI from "@/apis/components/approval-requests/approvalRequestsAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import { $toastError, $toastSuccess } from "@/utils/toastService";

const { authState } = inject("auth");

const currentRole = computed(() => {
    let role = authState?.user?.role || authState?.user?.Role || null;
    if (typeof role === "string" && role.startsWith("ROLE_")) {
        role = role.substring(5);
    }
    return typeof role === "string" ? role.trim().toUpperCase() : "";
});

const currentEmployeeId = computed(() => {
    const user = authState?.user || {};
    return user.employee_id || user.employeeId || user.EmployeeId || user.id || "";
});

const columns = ref([
    { key: "leaveRequestCode", name: "Mã đơn", typeFilter: "text", width: 140 },
    { key: "employeeName", name: "Nhân viên", typeFilter: "text", width: 220 },
    { key: "startDate", name: "Ngày bắt đầu", type: "date", width: 140 },
    { key: "returnDate", name: "Ngày đi làm lại", type: "date", width: 140 },
    {
        key: "approvalStatus",
        name: "Trạng thái",
        typeFilter: "status",
        width: 140,
        options: [
            { value: 0, label: "Chờ duyệt" },
            { value: 1, label: "Đã duyệt" },
            { value: 2, label: "Từ chối" },
            { value: 3, label: "Đã hủy" },
        ],
    },
    { key: "reason", name: "Lý do", typeFilter: "text", width: 320 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
]);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(LeaveRequestsAPI);

const isCreateOpen = ref(false);
const isDetailOpen = ref(false);
const isWithdrawOpen = ref(false);
const submitting = ref(false);
const withdrawing = ref(false);
const selectedRow = ref(null);
const selectedDetail = ref(null);
const form = ref({
    startDate: null,
    returnDate: null,
    reason: "",
});

const statusConfig = {
    0: { label: "Chờ duyệt", color: "#faad14", bg: "#fffbe6" },
    1: { label: "Đã duyệt", color: "#52c41a", bg: "#f6ffed" },
    2: { label: "Từ chối", color: "#ff4d4f", bg: "#fff2f0" },
    3: { label: "Đã hủy", color: "#8c8c8c", bg: "#fafafa" },
};

function getStatusConfig(status) {
    return statusConfig[status] || statusConfig[0];
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("vi-VN");
}

function normalizeDateValue(value) {
    if (!value) return null;
    if (typeof value.format === "function") {
        return value.format("YYYY-MM-DD");
    }
    return value;
}

function resetForm() {
    form.value = {
        startDate: null,
        returnDate: null,
        reason: "",
    };
}

function openCreateModal() {
    resetForm();
    isCreateOpen.value = true;
}

async function handleSubmit() {
    if (!currentEmployeeId.value) {
        $toastError("Không xác định được nhân viên hiện tại");
        return;
    }

    const startDate = normalizeDateValue(form.value.startDate);
    const returnDate = normalizeDateValue(form.value.returnDate);

    if (!startDate || !returnDate || !form.value.reason.trim()) {
        $toastError("Vui lòng nhập đầy đủ ngày nghỉ và lý do");
        return;
    }

    if (returnDate < startDate) {
        $toastError("Ngày đi làm lại phải lớn hơn hoặc bằng ngày bắt đầu nghỉ");
        return;
    }

    submitting.value = true;
    try {
        await LeaveRequestsAPI.create({
            startDate,
            returnDate,
            reason: form.value.reason.trim(),
        });
        $toastSuccess("Tạo đơn nghỉ phép thành công");
        isCreateOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Tạo đơn nghỉ phép thất bại");
        console.error(error);
    } finally {
        submitting.value = false;
    }
}

async function handleViewDetail(row) {
    selectedRow.value = row;
    isDetailOpen.value = true;
    selectedDetail.value = null;

    try {
        const res = await LeaveRequestsAPI.getById(row.leaveRequestId);
        selectedDetail.value = res.data?.data || null;
    } catch (error) {
        console.error(error);
        selectedDetail.value = null;
    }
}

function canWithdraw() {
    const leaveRequest = selectedDetail.value?.leaveRequest;
    const approvalRequest = selectedDetail.value?.approvalRequest;

    if (!leaveRequest || !approvalRequest) return false;
    if (leaveRequest.approvalStatus !== 0) return false;
    if (!leaveRequest.employeeId || !currentEmployeeId.value) return false;

    return (
        leaveRequest.employeeId === currentEmployeeId.value && approvalRequest.status === "pending"
    );
}

function openWithdrawConfirm(row) {
    selectedRow.value = row;
    isWithdrawOpen.value = true;
}

async function confirmWithdraw() {
    if (!selectedRow.value) return;

    withdrawing.value = true;
    try {
        await LeaveRequestsAPI.withdraw(selectedRow.value.leaveRequestId);
        $toastSuccess("Thu hồi đơn nghỉ phép thành công");
        isWithdrawOpen.value = false;
        isDetailOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Thu hồi đơn nghỉ phép thất bại");
        console.error(error);
    } finally {
        withdrawing.value = false;
    }
}

async function loadSelectedDetail(row) {
    await handleViewDetail(row);
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <ms-form
        v-model:open="isCreateOpen"
        title="Tạo đơn nghỉ phép"
        width="720px"
        :show-save-and-add="false"
        :loading="submitting"
        @submit="handleSubmit"
        @cancel="isCreateOpen = false"
    >
        <div class="leave-form">
            <div class="leave-form__row">
                <div class="leave-form__label leave-form__label--required">Ngày bắt đầu</div>
                <ms-date-picker v-model="form.startDate" class="leave-form__field" />
            </div>

            <div class="leave-form__row">
                <div class="leave-form__label leave-form__label--required">Ngày đi làm lại</div>
                <ms-date-picker v-model="form.returnDate" class="leave-form__field" />
            </div>

            <div class="leave-form__row leave-form__row--top">
                <div class="leave-form__label leave-form__label--required">Lý do</div>
                <div class="leave-form__field">
                    <ms-textarea v-model="form.reason" />
                </div>
            </div>
        </div>
    </ms-form>

    <ms-alert
        v-model="isWithdrawOpen"
        title="Xác nhận thu hồi"
        :showConfirm="true"
        confirmText="Thu hồi"
        confirmType="danger"
        @confirm="confirmWithdraw"
    >
        Bạn có chắc muốn thu hồi đơn <strong>{{ selectedRow?.leaveRequestCode }}</strong> không?
    </ms-alert>

    <div class="content d-flex flex-1 flex-column leave-page">
        <div class="content__header d-flex leave-page__header">
            <div>
                <div class="content__title">Đơn nghỉ phép</div>
                <div class="leave-page__subtitle">
                    Theo dõi tạo, thu hồi và trạng thái phê duyệt
                </div>
            </div>
            <ms-button icon-left="icon-add" @click="openCreateModal">Tạo đơn</ms-button>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                :loading="loading"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
                @edit-row="loadSelectedDetail"
                row-actions-name="Thao tác"
                :row-column-width="170"
                :show-selection="false"
            >
                <template #approvalStatus="{ row }">
                    <span
                        class="leave-status"
                        :style="{
                            color: getStatusConfig(row.approvalStatus).color,
                            backgroundColor: getStatusConfig(row.approvalStatus).bg,
                        }"
                    >
                        {{ getStatusConfig(row.approvalStatus).label }}
                    </span>
                </template>

                <template #row-actions="{ row }">
                    <div class="leave-actions">
                        <ms-button
                            size="small"
                            type="primary-outline"
                            @click.stop="loadSelectedDetail(row)"
                        >
                            Chi tiết
                        </ms-button>
                        <ms-button
                            v-if="row.approvalStatus === 0 && row.employeeId === currentEmployeeId"
                            size="small"
                            type="danger-outline"
                            @click.stop="openWithdrawConfirm(row)"
                        >
                            Thu hồi
                        </ms-button>
                    </div>
                </template>
            </ms-table>
        </div>
    </div>

    <teleport to="body">
        <div v-if="isDetailOpen" class="leave-detail__overlay" @click.self="isDetailOpen = false">
            <div class="leave-detail">
                <div class="leave-detail__header">
                    <div>
                        <h3>
                            Chi tiết đơn
                            {{
                                selectedDetail?.leaveRequest?.leaveRequestCode ||
                                selectedRow?.leaveRequestCode
                            }}
                        </h3>
                        <div class="leave-detail__meta">
                            {{ selectedDetail?.approvalRequest?.requestCode || "" }}
                        </div>
                    </div>
                    <button class="leave-detail__close" @click="isDetailOpen = false">
                        <close-outlined />
                    </button>
                </div>

                <div class="leave-detail__body">
                    <div class="leave-detail__grid">
                        <div class="leave-card">
                            <div class="leave-card__title">Thông tin đơn</div>
                            <div class="leave-detail__row">
                                <span>Mã đơn</span>
                                <strong>{{
                                    selectedDetail?.leaveRequest?.leaveRequestCode ||
                                    selectedRow?.leaveRequestCode
                                }}</strong>
                            </div>
                            <div class="leave-detail__row">
                                <span>Nhân viên</span>
                                <strong>{{
                                    selectedDetail?.leaveRequest?.employeeName ||
                                    selectedRow?.employeeName ||
                                    "-"
                                }}</strong>
                            </div>
                            <div class="leave-detail__row">
                                <span>Ngày bắt đầu</span>
                                <strong>{{
                                    formatDate(
                                        selectedDetail?.leaveRequest?.startDate ||
                                            selectedRow?.startDate,
                                    )
                                }}</strong>
                            </div>
                            <div class="leave-detail__row">
                                <span>Ngày đi làm lại</span>
                                <strong>{{
                                    formatDate(
                                        selectedDetail?.leaveRequest?.returnDate ||
                                            selectedRow?.returnDate,
                                    )
                                }}</strong>
                            </div>
                            <div class="leave-detail__row">
                                <span>Trạng thái</span>
                                <span
                                    class="leave-status"
                                    :style="{
                                        color: getStatusConfig(
                                            selectedDetail?.leaveRequest?.approvalStatus ??
                                                selectedRow?.approvalStatus,
                                        ).color,
                                        backgroundColor: getStatusConfig(
                                            selectedDetail?.leaveRequest?.approvalStatus ??
                                                selectedRow?.approvalStatus,
                                        ).bg,
                                    }"
                                >
                                    {{
                                        getStatusConfig(
                                            selectedDetail?.leaveRequest?.approvalStatus ??
                                                selectedRow?.approvalStatus,
                                        ).label
                                    }}
                                </span>
                            </div>
                            <div class="leave-detail__reason">
                                <span>Lý do</span>
                                <p>
                                    {{
                                        selectedDetail?.leaveRequest?.reason ||
                                        selectedRow?.reason ||
                                        "-"
                                    }}
                                </p>
                            </div>
                        </div>

                        <div class="leave-card">
                            <div class="leave-card__title">Quy trình phê duyệt</div>
                            <template v-if="selectedDetail?.steps?.length">
                                <div class="leave-timeline">
                                    <div
                                        v-for="step in selectedDetail.steps"
                                        :key="step.approvalStepId"
                                        class="leave-timeline__item"
                                        :class="{
                                            'leave-timeline__item--approved':
                                                step.status === 'approved',
                                            'leave-timeline__item--rejected':
                                                step.status === 'rejected',
                                            'leave-timeline__item--pending':
                                                step.status === 'pending',
                                        }"
                                    >
                                        <div class="leave-timeline__dot"></div>
                                        <div class="leave-timeline__content">
                                            <div class="leave-timeline__title">
                                                Bước {{ step.stepOrder }} - {{ step.approverRole }}
                                            </div>
                                            <div class="leave-timeline__status">
                                                {{
                                                    step.status === "approved"
                                                        ? "Đã duyệt"
                                                        : step.status === "rejected"
                                                          ? "Từ chối"
                                                          : "Chờ duyệt"
                                                }}
                                            </div>
                                            <div
                                                v-if="step.comment"
                                                class="leave-timeline__comment"
                                            >
                                                {{ step.comment }}
                                            </div>
                                            <div v-if="step.actedAt" class="leave-timeline__date">
                                                {{ formatDate(step.actedAt) }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <div v-else class="leave-detail__empty">Chưa có bước phê duyệt.</div>
                        </div>
                    </div>

                    <div v-if="selectedDetail?.approvalRequest" class="leave-card leave-card--full">
                        <div class="leave-card__title">Thông tin yêu cầu phê duyệt</div>
                        <div class="leave-detail__row">
                            <span>Loại yêu cầu</span>
                            <strong>{{ selectedDetail.approvalRequest.requestType }}</strong>
                        </div>
                        <div class="leave-detail__row">
                            <span>Trạng thái</span>
                            <strong>{{ selectedDetail.approvalRequest.status }}</strong>
                        </div>
                        <div class="leave-detail__row">
                            <span>Tiêu đề</span>
                            <strong>{{ selectedDetail.approvalRequest.title }}</strong>
                        </div>
                    </div>
                </div>

                <div class="leave-detail__footer">
                    <ms-button
                        v-if="canWithdraw()"
                        type="danger"
                        @click="openWithdrawConfirm(selectedDetail.leaveRequest)"
                    >
                        Thu hồi đơn
                    </ms-button>
                    <ms-button type="outline" @click="isDetailOpen = false">Đóng</ms-button>
                </div>
            </div>
        </div>
    </teleport>
</template>

<style scoped>
@import "../shift/Index.css";

.leave-page__header {
    align-items: flex-start;
}

.leave-page__subtitle {
    margin-top: 4px;
    color: #6b7280;
    font-size: 13px;
}

.leave-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.leave-form__row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.leave-form__row--top {
    align-items: flex-start;
}

.leave-form__label {
    width: 160px;
    font-weight: 500;
}

.leave-form__label--required::after {
    content: " *";
    color: #ff4d4f;
}

.leave-form__field {
    flex: 1;
}

.leave-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.leave-status {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
}

.leave-detail__overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.leave-detail {
    width: min(1040px, 100%);
    max-height: 88vh;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.leave-detail__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #eef2f7;
}

.leave-detail__header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
}

.leave-detail__meta {
    margin-top: 4px;
    color: #6b7280;
    font-size: 13px;
}

.leave-detail__close {
    border: none;
    background: #f3f4f6;
    border-radius: 8px;
    width: 34px;
    height: 34px;
    cursor: pointer;
}

.leave-detail__body {
    flex: 1;
    overflow: auto;
    padding: 24px;
    background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.leave-detail__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.leave-card {
    background: #fff;
    border: 1px solid #e8edf4;
    border-radius: 16px;
    padding: 18px;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.leave-card--full {
    margin-top: 16px;
}

.leave-card__title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 14px;
}

.leave-detail__row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f3f6fa;
}

.leave-detail__row span {
    color: #6b7280;
}

.leave-detail__reason {
    margin-top: 14px;
}

.leave-detail__reason span {
    display: inline-block;
    margin-bottom: 8px;
    color: #6b7280;
}

.leave-detail__reason p {
    margin: 0;
    line-height: 1.7;
    color: #111827;
    white-space: pre-wrap;
}

.leave-timeline {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.leave-timeline__item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.leave-timeline__dot {
    width: 12px;
    height: 12px;
    margin-top: 4px;
    border-radius: 50%;
    background: #cbd5e1;
    flex: 0 0 auto;
}

.leave-timeline__item--approved .leave-timeline__dot {
    background: #22c55e;
}

.leave-timeline__item--rejected .leave-timeline__dot {
    background: #ef4444;
}

.leave-timeline__item--pending .leave-timeline__dot {
    background: #f59e0b;
}

.leave-timeline__content {
    flex: 1;
    padding-bottom: 10px;
    border-bottom: 1px dashed #eef2f7;
}

.leave-timeline__title {
    font-weight: 600;
    margin-bottom: 4px;
}

.leave-timeline__status,
.leave-timeline__comment,
.leave-timeline__date {
    color: #6b7280;
    font-size: 13px;
    margin-top: 2px;
}

.leave-detail__empty {
    color: #6b7280;
    font-size: 14px;
}

.leave-detail__footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px 20px;
    border-top: 1px solid #eef2f7;
    background: #fff;
}

@media (max-width: 900px) {
    .leave-detail__grid {
        grid-template-columns: 1fr;
    }

    .leave-form__row {
        flex-direction: column;
        align-items: stretch;
    }

    .leave-form__label {
        width: auto;
    }
}
</style>
