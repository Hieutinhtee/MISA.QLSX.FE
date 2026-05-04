<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { Spin, Empty } from "ant-design-vue";
import DashboardAPI from "@/apis/components/dashboard/dashboardAPI";

// #region State
const loading = ref(false);
const period = ref("month");
const dashboard = ref(null);

const periodOptions = [
    { label: "Tuần này", value: "week" },
    { label: "Tháng này", value: "month" },
    { label: "Năm nay", value: "year" },
];

// Tab đang mở trong phần danh sách
const activeTab = ref("expiringContracts");
// Current user (from localStorage) and role check
const currentUser = ref(null);
const isEmployee = computed(() => {
    if (!currentUser.value) return false;
    let role = currentUser.value.Role || currentUser.value.role || null;
    if (typeof role === "string" && role.startsWith("ROLE_")) role = role.substring(5);
    return role === "EMPLOYEE";
});
// #endregion State

// #region Methods
async function fetchDashboard() {
    loading.value = true;
    try {
        const res = await DashboardAPI.getDashboard(period.value);
        dashboard.value = res.data?.data || null;
    } catch (err) {
        console.error("Lỗi tải dashboard:", err);
    } finally {
        loading.value = false;
    }
}

function formatCurrency(value) {
    if (value == null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
// #endregion Methods

// #region Watchers
watch(period, () => {
    fetchDashboard();
});
// #endregion Watchers

// #region Lifecycle
onMounted(() => {
    // load user and dashboard
    try {
        currentUser.value = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        currentUser.value = null;
    }
    fetchDashboard();
});
// #endregion Lifecycle
</script>

<template>
    <div class="dashboard">
        <!-- Header -->
        <div class="dashboard__header">
            <h1 class="dashboard__title">{{ isEmployee ? "Tổng quan của tôi" : "Tổng quan" }}</h1>
            <div class="dashboard__period-selector">
                <button
                    v-for="opt in periodOptions"
                    :key="opt.value"
                    :class="[
                        'dashboard__period-btn',
                        period === opt.value ? 'dashboard__period-btn--active' : '',
                    ]"
                    @click="period = opt.value"
                >
                    {{ opt.label }}
                </button>
            </div>
        </div>

        <Spin :spinning="loading" size="large">
            <template v-if="!isEmployee && dashboard">
                <!-- Stats Cards -->
                <div class="dashboard__stats">
                    <div class="dashboard__card dashboard__card--employees">
                        <div class="dashboard__card-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="28"
                                height="28"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div class="dashboard__card-body">
                            <div class="dashboard__card-value">{{ dashboard.totalEmployees }}</div>
                            <div class="dashboard__card-label">Tổng nhân sự</div>
                        </div>
                        <div class="dashboard__card-badge dashboard__card-badge--green">
                            +{{ dashboard.newEmployees }} mới
                        </div>
                    </div>

                    <div class="dashboard__card dashboard__card--salary">
                        <div class="dashboard__card-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="28"
                                height="28"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <div class="dashboard__card-body">
                            <div class="dashboard__card-value dashboard__card-value--small">
                                {{ formatCurrency(dashboard.totalSalaryExpense) }}
                            </div>
                            <div class="dashboard__card-label">Tổng chi lương</div>
                        </div>
                    </div>

                    <div class="dashboard__card dashboard__card--trip">
                        <div class="dashboard__card-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="28"
                                height="28"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                        </div>
                        <div class="dashboard__card-body">
                            <div class="dashboard__card-value">
                                {{ dashboard.employeesOnBusinessTrip }}
                            </div>
                            <div class="dashboard__card-label">Đang công tác</div>
                        </div>
                    </div>

                    <div class="dashboard__card dashboard__card--expiring">
                        <div class="dashboard__card-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="28"
                                height="28"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div class="dashboard__card-body">
                            <div class="dashboard__card-value">
                                {{ dashboard.contractsExpiringSoon }}
                            </div>
                            <div class="dashboard__card-label">HĐ sắp hết hạn</div>
                        </div>
                    </div>
                </div>

                <!-- Secondary Stats -->
                <div class="dashboard__stats dashboard__stats--secondary">
                    <div class="dashboard__card dashboard__card--warning">
                        <div class="dashboard__card-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="28"
                                height="28"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div class="dashboard__card-body">
                            <div class="dashboard__card-value">{{ dashboard.employeesAtRisk }}</div>
                            <div class="dashboard__card-label">Nguy cơ nghỉ việc</div>
                        </div>
                    </div>

                    <div class="dashboard__card dashboard__card--nocontract">
                        <div class="dashboard__card-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="28"
                                height="28"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                        </div>
                        <div class="dashboard__card-body">
                            <div class="dashboard__card-value">
                                {{ dashboard.employeesWithoutContract }}
                            </div>
                            <div class="dashboard__card-label">Chưa có hợp đồng</div>
                        </div>
                    </div>

                    <div class="dashboard__card dashboard__card--unsigned">
                        <div class="dashboard__card-icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="28"
                                height="28"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </div>
                        <div class="dashboard__card-body">
                            <div class="dashboard__card-value">
                                {{ dashboard.unsignedContracts }}
                            </div>
                            <div class="dashboard__card-label">HĐ chưa ký</div>
                        </div>
                    </div>
                </div>

                <!-- Detail Tables -->
                <div class="dashboard__details">
                    <div class="dashboard__tabs">
                        <button
                            :class="[
                                'dashboard__tab',
                                activeTab === 'expiringContracts' ? 'dashboard__tab--active' : '',
                            ]"
                            @click="activeTab = 'expiringContracts'"
                        >
                            HĐ sắp hết hạn
                            <span class="dashboard__tab-count">{{
                                dashboard.contractsExpiringSoon
                            }}</span>
                        </button>
                        <button
                            :class="[
                                'dashboard__tab',
                                activeTab === 'noContract' ? 'dashboard__tab--active' : '',
                            ]"
                            @click="activeTab = 'noContract'"
                        >
                            Chưa có HĐ
                            <span class="dashboard__tab-count">{{
                                dashboard.employeesWithoutContract
                            }}</span>
                        </button>
                        <button
                            :class="[
                                'dashboard__tab',
                                activeTab === 'unsigned' ? 'dashboard__tab--active' : '',
                            ]"
                            @click="activeTab = 'unsigned'"
                        >
                            HĐ chưa ký
                            <span class="dashboard__tab-count">{{
                                dashboard.unsignedContracts
                            }}</span>
                        </button>
                        <button
                            :class="[
                                'dashboard__tab',
                                activeTab === 'atRisk' ? 'dashboard__tab--active' : '',
                            ]"
                            @click="activeTab = 'atRisk'"
                        >
                            Nguy cơ nghỉ việc
                            <span class="dashboard__tab-count">{{
                                dashboard.employeesAtRisk
                            }}</span>
                        </button>
                        <button
                            :class="[
                                'dashboard__tab',
                                activeTab === 'businessTrips' ? 'dashboard__tab--active' : '',
                            ]"
                            @click="activeTab = 'businessTrips'"
                        >
                            Đang công tác
                            <span class="dashboard__tab-count">{{
                                dashboard.employeesOnBusinessTrip
                            }}</span>
                        </button>
                    </div>

                    <!-- Tab: HĐ sắp hết hạn -->
                    <div v-if="activeTab === 'expiringContracts'" class="dashboard__table-wrap">
                        <table
                            v-if="
                                dashboard.expiringContracts &&
                                dashboard.expiringContracts.length > 0
                            "
                            class="dashboard__table"
                        >
                            <thead>
                                <tr>
                                    <th>Mã HĐ</th>
                                    <th>Mã NV</th>
                                    <th>Nhân viên</th>
                                    <th>Ngày hết hạn</th>
                                    <th>Còn lại</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="item in dashboard.expiringContracts"
                                    :key="item.contractId"
                                >
                                    <td>{{ item.contractCode }}</td>
                                    <td>{{ item.employeeCode }}</td>
                                    <td>{{ item.employeeName }}</td>
                                    <td>{{ formatDate(item.endDate) }}</td>
                                    <td>
                                        <span
                                            :class="[
                                                'dashboard__badge',
                                                item.daysRemaining <= 7
                                                    ? 'dashboard__badge--danger'
                                                    : 'dashboard__badge--warn',
                                            ]"
                                        >
                                            {{ item.daysRemaining }} ngày
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <Empty v-else description="Không có hợp đồng sắp hết hạn" />
                    </div>

                    <!-- Tab: Chưa có HĐ -->
                    <div v-if="activeTab === 'noContract'" class="dashboard__table-wrap">
                        <table
                            v-if="
                                dashboard.employeesWithoutContractList &&
                                dashboard.employeesWithoutContractList.length > 0
                            "
                            class="dashboard__table"
                        >
                            <thead>
                                <tr>
                                    <th>Mã NV</th>
                                    <th>Họ tên</th>
                                    <th>Ngày vào làm</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="item in dashboard.employeesWithoutContractList"
                                    :key="item.employeeId"
                                >
                                    <td>{{ item.employeeCode }}</td>
                                    <td>{{ item.fullName }}</td>
                                    <td>{{ formatDate(item.joinDate) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <Empty v-else description="Tất cả nhân viên đều có hợp đồng" />
                    </div>

                    <!-- Tab: HĐ chưa ký -->
                    <div v-if="activeTab === 'unsigned'" class="dashboard__table-wrap">
                        <table
                            v-if="
                                dashboard.unsignedContractsList &&
                                dashboard.unsignedContractsList.length > 0
                            "
                            class="dashboard__table"
                        >
                            <thead>
                                <tr>
                                    <th>Mã HĐ</th>
                                    <th>Mã NV</th>
                                    <th>Nhân viên</th>
                                    <th>Ngày hiệu lực</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="item in dashboard.unsignedContractsList"
                                    :key="item.contractId"
                                >
                                    <td>{{ item.contractCode }}</td>
                                    <td>{{ item.employeeCode }}</td>
                                    <td>{{ item.employeeName }}</td>
                                    <td>{{ formatDate(item.effectiveDate) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <Empty v-else description="Tất cả hợp đồng đã được ký" />
                    </div>

                    <!-- Tab: Nguy cơ nghỉ việc -->
                    <div v-if="activeTab === 'atRisk'" class="dashboard__table-wrap">
                        <table
                            v-if="
                                dashboard.atRiskEmployeesList &&
                                dashboard.atRiskEmployeesList.length > 0
                            "
                            class="dashboard__table"
                        >
                            <thead>
                                <tr>
                                    <th>Mã NV</th>
                                    <th>Họ tên</th>
                                    <th>Lý do</th>
                                    <th>Mức phạt</th>
                                    <th>Ngày đánh giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="item in dashboard.atRiskEmployeesList"
                                    :key="item.employeeId"
                                >
                                    <td>{{ item.employeeCode }}</td>
                                    <td>{{ item.fullName }}</td>
                                    <td>{{ item.reason || "—" }}</td>
                                    <td>{{ formatCurrency(item.amount) }}</td>
                                    <td>{{ formatDate(item.evaluationDate) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <Empty v-else description="Không có nhân viên có nguy cơ nghỉ việc" />
                    </div>

                    <!-- Tab: Đang công tác -->
                    <div v-if="activeTab === 'businessTrips'" class="dashboard__table-wrap">
                        <table
                            v-if="
                                dashboard.businessTripsList &&
                                dashboard.businessTripsList.length > 0
                            "
                            class="dashboard__table"
                        >
                            <thead>
                                <tr>
                                    <th>Mã NV</th>
                                    <th>Nhân viên</th>
                                    <th>Địa điểm</th>
                                    <th>Từ ngày</th>
                                    <th>Đến ngày</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="item in dashboard.businessTripsList"
                                    :key="item.businessTripId"
                                >
                                    <td>{{ item.employeeCode }}</td>
                                    <td>{{ item.employeeName }}</td>
                                    <td>{{ item.location }}</td>
                                    <td>{{ formatDate(item.startDate) }}</td>
                                    <td>{{ formatDate(item.endDate) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <Empty v-else description="Không có nhân viên đang đi công tác" />
                    </div>
                </div>
            </template>

            <!-- Employee-specific overview: show personal summaries and quick links -->
            <template v-else>
                <div class="dashboard__employee">
                    <div class="dashboard__stats">
                        <div class="dashboard__card dashboard__card--employees">
                            <div class="dashboard__card-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="28"
                                    height="28"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <circle cx="12" cy="8" r="3" />
                                    <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
                                </svg>
                            </div>
                            <div class="dashboard__card-body">
                                <div class="dashboard__card-value">
                                    {{
                                        (currentUser &&
                                            (currentUser.full_name || currentUser.FullName)) ||
                                        "Tôi"
                                    }}
                                </div>
                                <div class="dashboard__card-label">Nhân viên</div>
                            </div>
                            <div class="dashboard__card-badge dashboard__card-badge--green">
                                <RouterLink to="/attendance/my-calendar">Xem lịch</RouterLink>
                            </div>
                        </div>

                        <div class="dashboard__card dashboard__card--salary">
                            <div class="dashboard__card-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="28"
                                    height="28"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                </svg>
                            </div>
                            <div class="dashboard__card-body">
                                <div class="dashboard__card-value dashboard__card-value--small">
                                    —
                                </div>
                                <div class="dashboard__card-label">Lương gần nhất</div>
                            </div>
                            <div class="dashboard__card-badge">
                                <RouterLink to="/payrolls">Xem bảng lương</RouterLink>
                            </div>
                        </div>

                        <div class="dashboard__card dashboard__card--trip">
                            <div class="dashboard__card-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="28"
                                    height="28"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                </svg>
                            </div>
                            <div class="dashboard__card-body">
                                <div class="dashboard__card-value">—</div>
                                <div class="dashboard__card-label">Lịch công tác</div>
                            </div>
                            <div class="dashboard__card-badge">
                                <RouterLink to="/business-trips">Chi tiết</RouterLink>
                            </div>
                        </div>

                        <div class="dashboard__card dashboard__card--expiring">
                            <div class="dashboard__card-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="28"
                                    height="28"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                            </div>
                            <div class="dashboard__card-body">
                                <div class="dashboard__card-value">—</div>
                                <div class="dashboard__card-label">Hợp đồng</div>
                            </div>
                            <div class="dashboard__card-badge">
                                <RouterLink to="/payrolls">Xem</RouterLink>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard__details">
                        <div class="dashboard__table-wrap">
                            <p style="padding: 16px">
                                Các thông tin chi tiết cá nhân hiển thị ở đây. Nhấn vào các liên kết
                                để xem chi tiết.
                            </p>
                        </div>
                    </div>
                </div>
            </template>
        </Spin>
    </div>
</template>

<style scoped>
:deep(.ant-collapse) {
    background: transparent;
    border: none;
}
.dashboard {
    background-color: #f0f2f5;
    padding: 20px 24px;
    flex: 1;
    overflow-y: auto;
    font-family: "Inter", sans-serif;
}

/* === Header === */
.dashboard__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.dashboard__title {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
}

.dashboard__period-selector {
    display: flex;
    background: white;
    border-radius: 8px;
    padding: 3px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.dashboard__period-btn {
    padding: 6px 16px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    transition: all 0.2s ease;
}

.dashboard__period-btn:hover {
    color: #009b71;
}

.dashboard__period-btn--active {
    background: #009b71;
    color: white;
    box-shadow: 0 2px 6px rgba(0, 155, 113, 0.3);
}

.dashboard__period-btn--active:hover {
    color: white;
}

/* === Stats Cards === */
.dashboard__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}

.dashboard__stats--secondary {
    grid-template-columns: repeat(3, 1fr);
}

.dashboard__card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.dashboard__card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dashboard__card::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
}

.dashboard__card--employees::after {
    background: linear-gradient(180deg, #009b71, #00c896);
}
.dashboard__card--salary::after {
    background: linear-gradient(180deg, #3b82f6, #60a5fa);
}
.dashboard__card--trip::after {
    background: linear-gradient(180deg, #8b5cf6, #a78bfa);
}
.dashboard__card--expiring::after {
    background: linear-gradient(180deg, #f59e0b, #fbbf24);
}
.dashboard__card--warning::after {
    background: linear-gradient(180deg, #ef4444, #f87171);
}
.dashboard__card--nocontract::after {
    background: linear-gradient(180deg, #f97316, #fb923c);
}
.dashboard__card--unsigned::after {
    background: linear-gradient(180deg, #6366f1, #818cf8);
}

.dashboard__card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.dashboard__card--employees .dashboard__card-icon {
    background: #ecfdf5;
    color: #009b71;
}
.dashboard__card--salary .dashboard__card-icon {
    background: #eff6ff;
    color: #3b82f6;
}
.dashboard__card--trip .dashboard__card-icon {
    background: #f5f3ff;
    color: #8b5cf6;
}
.dashboard__card--expiring .dashboard__card-icon {
    background: #fffbeb;
    color: #f59e0b;
}
.dashboard__card--warning .dashboard__card-icon {
    background: #fef2f2;
    color: #ef4444;
}
.dashboard__card--nocontract .dashboard__card-icon {
    background: #fff7ed;
    color: #f97316;
}
.dashboard__card--unsigned .dashboard__card-icon {
    background: #eef2ff;
    color: #6366f1;
}

.dashboard__card-body {
    flex: 1;
    min-width: 0;
}

.dashboard__card-value {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
}

.dashboard__card-value--small {
    font-size: 20px;
}

.dashboard__card-label {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
}

.dashboard__card-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
}

.dashboard__card-badge--green {
    background: #ecfdf5;
    color: #059669;
}

/* === Detail Section === */
.dashboard__details {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.dashboard__tabs {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 8px;
    overflow-x: auto;
}

.dashboard__tab {
    padding: 14px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
}

.dashboard__tab:hover {
    color: #009b71;
}

.dashboard__tab--active {
    color: #009b71;
    border-bottom-color: #009b71;
}

.dashboard__tab-count {
    background: #f3f4f6;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
}

.dashboard__tab--active .dashboard__tab-count {
    background: #ecfdf5;
    color: #009b71;
}

/* === Tables === */
.dashboard__table-wrap {
    padding: 16px;
    min-height: 200px;
}

.dashboard__table {
    width: 100%;
    border-collapse: collapse;
}

.dashboard__table thead th {
    text-align: left;
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

.dashboard__table tbody td {
    padding: 12px 16px;
    font-size: 14px;
    color: #374151;
    border-bottom: 1px solid #f3f4f6;
}

.dashboard__table tbody tr {
    transition: background 0.15s ease;
}

.dashboard__table tbody tr:hover {
    background: #f9fafb;
}

.dashboard__table tbody tr:last-child td {
    border-bottom: none;
}

/* Badges */
.dashboard__badge {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
}

.dashboard__badge--danger {
    background: #fef2f2;
    color: #dc2626;
}

.dashboard__badge--warn {
    background: #fffbeb;
    color: #d97706;
}

/* === Responsive === */
@media (max-width: 1200px) {
    .dashboard__stats {
        grid-template-columns: repeat(2, 1fr);
    }
    .dashboard__stats--secondary {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .dashboard__stats,
    .dashboard__stats--secondary {
        grid-template-columns: 1fr;
    }
    .dashboard__header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
}
</style>
