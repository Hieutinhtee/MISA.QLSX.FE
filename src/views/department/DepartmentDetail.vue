<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import DepartmentForm from "./DepartmentForm.vue";
import TransferMemberForm from "./TransferMemberForm.vue";
import ChangeManagerForm from "./ChangeManagerForm.vue";
import DepartmentsAPI from "@/apis/components/departments/departmentsAPI";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";
import { $toastError, $toastSuccess } from "@/utils/toastService";

const route = useRoute();
const router = useRouter();
const departmentId = computed(() => route.params.id);

const loading = ref(false);
const loadingEmployees = ref(false);
const department = ref(null);
const employees = ref([]);

// Form states
const isFormOpen = ref(false);
const isTransferFormOpen = ref(false);
const isChangeManagerFormOpen = ref(false);
const isDeactivateModalOpen = ref(false);
const deactivateText = ref("");

const employeeColumns = ref([
    { key: "employeeCode", name: "Mã NV", width: 120 },
    { key: "fullName", name: "Họ và tên", width: 200 },
    { key: "positionName", name: "Chức vụ", width: 150 },
    { key: "email", name: "Email", width: 220 },
]);

async function loadDepartmentDetail() {
    if (!departmentId.value) return;

    loading.value = true;
    try {
        const response = await DepartmentsAPI.getById(departmentId.value);
        department.value = response?.data?.data || null;
    } catch (error) {
        $toastError("Lỗi khi tải chi tiết phòng ban");
        console.error(error);
    } finally {
        loading.value = false;
    }
}

async function loadDepartmentEmployees() {
    if (!departmentId.value) return;

    loadingEmployees.value = true;
    try {
        const filter = {
            field: "departmentId",
            operator: "eq",
            value: departmentId.value,
        };
        const response = await EmployeesAPI.paging({
            page: 1,
            pageSize: 100,
            filters: [filter],
        });
        // result.data là body (PagingResponse), result.data.data là List<T>
        employees.value = response?.data?.data || [];
    } catch (error) {
        console.error("Lỗi khi tải danh sách nhân viên:", error);
    } finally {
        loadingEmployees.value = false;
    }
}

// === Actions ===

function handleEdit() {
    isFormOpen.value = true;
}

async function handleFormSubmit(data) {
    try {
        await DepartmentsAPI.update(departmentId.value, data);
        $toastSuccess("Cập nhật phòng ban thành công");
        isFormOpen.value = false;
        await loadDepartmentDetail();
    } catch (error) {
        $toastError("Lưu phòng ban thất bại");
    }
}

function handleToggleActive() {
    if (department.value.isActive) {
        deactivateText.value = `Phòng ban <strong>${department.value.departmentCode}</strong>`;
        isDeactivateModalOpen.value = true;
    } else {
        toggleActive(true);
    }
}

async function handleConfirmDeactivate() {
    await toggleActive(false);
    isDeactivateModalOpen.value = false;
}

async function toggleActive(isActive) {
    try {
        await DepartmentsAPI.update(departmentId.value, {
            ...department.value,
            isActive,
            inactiveEffectiveDate: isActive ? null : new Date().toISOString(),
        });
        $toastSuccess(isActive ? "Đã kích hoạt phòng ban" : "Đã ngừng sử dụng phòng ban");
        await loadDepartmentDetail();
    } catch (error) {
        $toastError("Cập nhật trạng thái thất bại");
    }
}

function handleTransferMember() {
    isTransferFormOpen.value = true;
}

function handleTransferSubmitted() {
    isTransferFormOpen.value = false;
    $toastSuccess("Đã tạo yêu cầu thuyên chuyển, chờ Admin phê duyệt");
}

function handleChangeManager() {
    isChangeManagerFormOpen.value = true;
}

function handleManagerChangeSubmitted() {
    isChangeManagerFormOpen.value = false;
    $toastSuccess("Đã tạo yêu cầu đổi trưởng phòng, chờ Admin phê duyệt");
}

function handleClose() {
    router.push({ name: "departments" });
}

onMounted(() => {
    loadDepartmentDetail();
    loadDepartmentEmployees();
});
</script>

<template>
    <!-- Modal xác nhận ngừng sử dụng -->
    <ms-alert
        v-model="isDeactivateModalOpen"
        title="Xác nhận ngừng sử dụng"
        :showConfirm="true"
        @confirm="handleConfirmDeactivate"
    >
        <span v-html="deactivateText"></span>
        sẽ được ngừng sử dụng. Bạn có muốn tiếp tục không?
    </ms-alert>

    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex align-items-center">
            <div class="d-flex align-items-center gap-12">
                <div
                    class="btn-back pointer d-flex align-items-center justify-content-center"
                    @click="handleClose"
                >
                    <div class="icon-back"></div>
                </div>
                <div class="content__title">Chi tiết phòng ban</div>
            </div>
            <div class="action-buttons ms-auto" v-if="department">
                <ms-button type="outline" @click="handleEdit">Sửa</ms-button>
                <ms-button
                    type="outline"
                    :class="{ 'btn-danger-outline': department.isActive }"
                    @click="handleToggleActive"
                >
                    {{ department.isActive ? "Ngừng sử dụng" : "Kích hoạt" }}
                </ms-button>
                <ms-button type="primary-outline" @click="handleTransferMember"
                    >Chuyển nhân viên</ms-button
                >
                <ms-button type="primary" @click="handleChangeManager">Đổi trưởng phòng</ms-button>
            </div>
        </div>

        <div class="content__body d-flex flex-1 flex-column p-20 overflow-hidden">
            <div v-if="loading" class="d-flex flex-1 align-items-center justify-content-center">
                <div class="loading-spinner"></div>
                <span class="ms-12">Đang tải thông tin...</span>
            </div>

            <template v-else-if="department">
                <!-- Header Info -->
                <div class="detail-header-card mb-20">
                    <div class="header-top d-flex justify-content-between align-items-center">
                        <div class="header-info d-flex align-items-center gap-24">
                            <div class="dept-avatar">
                                {{ department.departmentName?.[0]?.toUpperCase() }}
                            </div>
                            <div>
                                <div class="dept-code mb-4">{{ department.departmentCode }}</div>
                                <h2 class="dept-name">{{ department.departmentName }}</h2>
                            </div>
                        </div>
                        <div
                            class="status-badge"
                            :class="
                                department.isActive
                                    ? 'status-badge--active'
                                    : 'status-badge--inactive'
                            "
                        >
                            <div class="status-badge__dot"></div>
                            <div class="status-badge__text">
                                {{ department.isActive ? "Đang sử dụng" : "Ngừng sử dụng" }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Layout Grid 4-8 -->
                <div class="detail-grid flex-1 d-flex gap-20 overflow-hidden">
                    <!-- Left Column (4): General Info -->
                    <div class="info-column-left d-flex flex-column gap-20">
                        <div class="info-section">
                            <div class="section-title mb-16">Thông tin chung</div>
                            <div class="info-list">
                                <div class="info-item">
                                    <div class="info-label">Trưởng phòng</div>
                                    <div class="info-value font-semibold">
                                        {{ department.managerEmployeeName || "Chưa thiết lập" }}
                                    </div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Ngày tạo</div>
                                    <div class="info-value">
                                        {{
                                            new Date(department.createdAt).toLocaleDateString(
                                                "vi-VN",
                                            )
                                        }}
                                    </div>
                                </div>
                                <div class="info-item" v-if="!department.isActive">
                                    <div class="info-label">Ngày ngừng sử dụng</div>
                                    <div class="info-value text-danger">
                                        {{
                                            department.inactiveEffectiveDate
                                                ? new Date(
                                                      department.inactiveEffectiveDate,
                                                  ).toLocaleDateString("vi-VN")
                                                : "-"
                                        }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="info-section flex-1">
                            <div class="section-title mb-16">Mô tả</div>
                            <div class="info-value description-text">
                                {{ department.description || "Không có mô tả cho phòng ban này." }}
                            </div>
                        </div>
                    </div>

                    <!-- Right Column (8): Employee List -->
                    <div
                        class="info-section employee-section flex-8 d-flex flex-column overflow-hidden"
                    >
                        <div class="section-title mb-16">
                            Danh sách thành viên ({{ employees.length }})
                        </div>
                        <div class="member-list flex-1 d-flex flex-column overflow-hidden">
                            <ms-table
                                :columns="employeeColumns"
                                :rows="employees"
                                :loading="loadingEmployees"
                                :show-pagination="false"
                                :show-search="false"
                                :show-selection="false"
                                :show-row-actions="false"
                                :show-reload="false"
                                :show-column-config="false"
                                row-actions-name=""
                                class="border-none"
                            />
                        </div>
                    </div>
                </div>
            </template>

            <div v-else class="d-flex flex-1 align-items-center justify-content-center">
                <div class="empty-state">
                    <div class="icon-empty mb-16"></div>
                    <span>Không tìm thấy thông tin phòng ban</span>
                    <ms-button type="primary" class="mt-16" @click="handleClose"
                        >Quay lại</ms-button
                    >
                </div>
            </div>
        </div>

        <!-- Forms -->
        <department-form
            v-if="department"
            v-model="isFormOpen"
            typeForm="edit"
            :data="department"
            @submit="handleFormSubmit"
        />

        <transfer-member-form
            v-if="department"
            v-model="isTransferFormOpen"
            :department="department"
            @submitted="handleTransferSubmitted"
        />

        <change-manager-form
            v-if="department"
            v-model="isChangeManagerFormOpen"
            :department="department"
            @submitted="handleManagerChangeSubmitted"
        />
    </div>
</template>

<style scoped>
@import "../shift/Index.css";

.ms-auto {
    margin-left: auto;
}

.ms-12 {
    margin-left: 12px;
}

.mt-16 {
    margin-top: 16px;
}

.gap-20 {
    gap: 20px;
}

.gap-24 {
    gap: 24px;
}

.p-20 {
    padding: 20px;
}

.mb-4 {
    margin-bottom: 4px;
}

.mb-16 {
    margin-bottom: 16px;
}

.mb-20 {
    margin-bottom: 20px;
}

.overflow-hidden {
    overflow: hidden;
}

.text-danger {
    color: #ef4444;
}

.font-semibold {
    font-weight: 600;
}

/* Custom Back Button & Icon */
.btn-back {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0;
    background: #fff;
}

.btn-back:hover {
    background-color: #f8fafc;
    border-color: var(--primary-color);
}

.icon-back {
    -webkit-mask-image: url(/src/assets/icon/svg/Icon_QLSX.svg);
    -webkit-mask-position: -48px 0;
    background-color: #4b5563;
    width: 16px;
    height: 16px;
}

.btn-back:hover .icon-back {
    background-color: var(--primary-color);
}

/* Header Action Buttons */
.action-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
}

.btn-danger-outline {
    color: #ef4444;
    border-color: #fee2e2;
}

.btn-danger-outline:hover {
    background-color: #fef2f2;
    border-color: #ef4444;
}

/* Detail Header Card */
.detail-header-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px 32px;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #f1f5f9;
}

.dept-avatar {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--primary-color) 0%, #059669 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 700;
    border-radius: 16px;
    box-shadow: 0 10px 15px -3px rgba(0, 155, 113, 0.2);
}

.dept-code {
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.025em;
}

.dept-name {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
}

/* Main Layout Grid */
.detail-grid {
    min-height: 0;
}

.info-column-left {
    flex: 4;
    min-width: 0;
}

.flex-8 {
    flex: 8;
}

.info-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    display: flex;
    align-items: center;
    border-left: 4px solid var(--primary-color);
    padding-left: 12px;
    margin-left: -24px;
}

.info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.info-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.info-value {
    color: #334155;
    font-size: 15px;
    word-break: break-word;
}

.description-text {
    line-height: 1.6;
    color: #475569;
}

/* Status Badge */
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 700;
}

.status-badge__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-badge--active {
    background-color: #ecfdf5;
    color: #059669;
    border: 1px solid #10b981;
}

.status-badge--active .status-badge__dot {
    background-color: #10b981;
    box-shadow: 0 0 8px #10b981;
}

.status-badge--inactive {
    background-color: #f8fafc;
    color: #64748b;
    border: 1px solid #cbd5e1;
}

.status-badge--inactive .status-badge__dot {
    background-color: #94a3b8;
}

/* Member List Section */
.employee-section {
    min-width: 0;
}

.member-list :deep(.content__table) {
    width: 100%;
}

.border-none {
    border: none !important;
}

/* Loading & Empty states */
.loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #e2e8f0;
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.empty-state {
    text-align: center;
    color: #64748b;
}

.icon-empty {
    width: 80px;
    height: 80px;
    margin: 0 auto;
    background: #f1f5f9;
    border-radius: 50%;
    position: relative;
}

.icon-empty::after {
    content: "!";
    font-size: 40px;
    font-weight: 700;
    color: #94a3b8;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

/* Responsive */
@media (max-width: 1200px) {
    .detail-grid {
        flex-direction: column;
    }

    .info-column-left {
        flex: none;
        width: 100%;
        flex-direction: row;
        gap: 20px;
    }

    .info-column-left > div {
        flex: 1;
    }
}

@media (max-width: 768px) {
    .content__header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .action-buttons {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
    }

    .detail-header-card {
        padding: 16px;
    }

    .info-column-left {
        flex-direction: column;
    }
}
</style>
