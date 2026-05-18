<script setup>
defineOptions({ name: "AttendanceDashboard" });

import { ref, onMounted } from "vue";
import { Spin, Empty } from "ant-design-vue";
import {
    UserDeleteOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons-vue";
import attendanceAPI from "@/apis/components/attendance/attendanceAPI";

const loading = ref(false);
const dashboardData = ref({
    totalAbsentToday: 0,
    totalLateThisMonth: 0,
    absentsToday: [],
    lateRankings: [],
});

const fetchDashboard = async () => {
    loading.value = true;
    try {
        const res = await attendanceAPI.getDashboard();
        if (res.data) {
            dashboardData.value = {
                ...dashboardData.value,
                ...res.data,
            };
        }
    } catch (error) {
        console.error("Lỗi khi tải dashboard chấm công:", error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchDashboard();
});
</script>

<template>
    <div class="att-dashboard">
        <!-- Header -->
        <div class="att-dashboard__header">
            <h1 class="att-dashboard__title">Tổng quan chấm công</h1>
        </div>

        <Spin :spinning="loading" size="large">
            <!-- Stats Cards -->
            <div class="att-dashboard__stats">
                <div class="att-dashboard__card att-dashboard__card--absent">
                    <div class="att-dashboard__card-icon">
                        <user-delete-outlined style="font-size: 28px" />
                    </div>
                    <div class="att-dashboard__card-body">
                        <div class="att-dashboard__card-value">
                            {{ dashboardData?.totalAbsentToday || 0 }}
                        </div>
                        <div class="att-dashboard__card-label">Hôm nay nghỉ</div>
                    </div>
                </div>

                <div class="att-dashboard__card att-dashboard__card--late">
                    <div class="att-dashboard__card-icon">
                        <clock-circle-outlined style="font-size: 28px" />
                    </div>
                    <div class="att-dashboard__card-body">
                        <div class="att-dashboard__card-value">
                            {{ dashboardData?.totalLateThisMonth || 0 }}
                        </div>
                        <div class="att-dashboard__card-label">Đi muộn tháng này</div>
                    </div>
                </div>

                <div class="att-dashboard__card att-dashboard__card--ontime">
                    <div class="att-dashboard__card-icon">
                        <check-circle-outlined style="font-size: 28px" />
                    </div>
                    <div class="att-dashboard__card-body">
                        <div class="att-dashboard__card-value">94.5%</div>
                        <div class="att-dashboard__card-label">Tỷ lệ đúng giờ</div>
                    </div>
                </div>
            </div>

            <!-- Detail Boards -->
            <div class="att-dashboard__boards">
                <!-- Absent Today -->
                <div class="att-dashboard__board">
                    <div class="att-dashboard__board-header">
                        Nhân viên nghỉ hôm nay
                        <span class="att-dashboard__board-count">{{
                            dashboardData?.absentsToday?.length || 0
                        }}</span>
                    </div>
                    <div class="att-dashboard__board-body">
                        <Empty
                            v-if="!dashboardData?.absentsToday?.length"
                            description="Mọi người đều có mặt đầy đủ!"
                        />
                        <div v-else class="att-dashboard__list">
                            <div
                                v-for="emp in dashboardData.absentsToday"
                                :key="emp.employeeId"
                                class="att-dashboard__list-item"
                            >
                                <div class="att-dashboard__avatar">
                                    {{ (emp.fullName || "?")[0] }}
                                </div>
                                <div class="att-dashboard__list-info">
                                    <div class="att-dashboard__list-name">{{ emp.fullName }}</div>
                                    <div class="att-dashboard__list-sub">
                                        {{ emp.departmentName }}
                                    </div>
                                </div>
                                <span class="att-dashboard__badge att-dashboard__badge--danger"
                                    >Vắng mặt</span
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Late Ranking -->
                <div class="att-dashboard__board">
                    <div class="att-dashboard__board-header">
                        Xếp hạng đi muộn (Tháng này)
                        <span class="att-dashboard__board-count">{{
                            dashboardData?.lateRankings?.length || 0
                        }}</span>
                    </div>
                    <div class="att-dashboard__board-body">
                        <Empty
                            v-if="!dashboardData?.lateRankings?.length"
                            description="Chưa có dữ liệu đi muộn"
                        />
                        <div v-else class="att-dashboard__list">
                            <div
                                v-for="(rank, index) in dashboardData.lateRankings"
                                :key="rank.employeeId"
                                class="att-dashboard__list-item"
                            >
                                <div
                                    class="att-dashboard__rank"
                                    :class="'att-dashboard__rank--' + (index + 1)"
                                >
                                    {{ index + 1 }}
                                </div>
                                <div class="att-dashboard__avatar">
                                    {{ (rank.fullName || "?")[0] }}
                                </div>
                                <div class="att-dashboard__list-info">
                                    <div class="att-dashboard__list-name">{{ rank.fullName }}</div>
                                    <div class="att-dashboard__list-sub">
                                        {{ rank.employeeCode }}
                                    </div>
                                </div>
                                <span class="att-dashboard__badge att-dashboard__badge--warn">
                                    {{ rank.lateCount }} lần
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Spin>
    </div>
</template>

<style scoped>
.att-dashboard {
    background-color: #f0f2f5;
    padding: 20px 24px;
    flex: 1;
    overflow-y: auto;
    font-family: "Inter", sans-serif;
}

/* Header */
.att-dashboard__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.att-dashboard__title {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
}

/* Stats Cards */
.att-dashboard__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.att-dashboard__card {
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

.att-dashboard__card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.att-dashboard__card::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
}

.att-dashboard__card--absent::after {
    background: linear-gradient(180deg, #ef4444, #f87171);
}
.att-dashboard__card--late::after {
    background: linear-gradient(180deg, #f59e0b, #fbbf24);
}
.att-dashboard__card--ontime::after {
    background: linear-gradient(180deg, #009b71, #00c896);
}

.att-dashboard__card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.att-dashboard__card--absent .att-dashboard__card-icon {
    background: #fef2f2;
    color: #ef4444;
}
.att-dashboard__card--late .att-dashboard__card-icon {
    background: #fffbeb;
    color: #f59e0b;
}
.att-dashboard__card--ontime .att-dashboard__card-icon {
    background: #ecfdf5;
    color: #009b71;
}

.att-dashboard__card-body {
    flex: 1;
    min-width: 0;
}

.att-dashboard__card-value {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
}

.att-dashboard__card-label {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
}

/* Boards */
.att-dashboard__boards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.att-dashboard__board {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    max-height: 500px;
}

.att-dashboard__board-header {
    padding: 16px 20px;
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 8px;
}

.att-dashboard__board-count {
    background: #f3f4f6;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
}

.att-dashboard__board-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

/* List */
.att-dashboard__list-item {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    gap: 12px;
    transition: background 0.15s ease;
}

.att-dashboard__list-item:hover {
    background: #f9fafb;
}

.att-dashboard__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #374151;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.att-dashboard__list-info {
    flex: 1;
    min-width: 0;
}

.att-dashboard__list-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.att-dashboard__list-sub {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 2px;
}

/* Rank */
.att-dashboard__rank {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    background: #f3f4f6;
    color: #6b7280;
    flex-shrink: 0;
}

.att-dashboard__rank--1 {
    background: #ffd700;
    color: #fff;
    box-shadow: 0 2px 4px rgba(255, 215, 0, 0.4);
}
.att-dashboard__rank--2 {
    background: #c0c0c0;
    color: #fff;
}
.att-dashboard__rank--3 {
    background: #cd7f32;
    color: #fff;
}

/* Badges */
.att-dashboard__badge {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
}

.att-dashboard__badge--danger {
    background: #fef2f2;
    color: #dc2626;
}

.att-dashboard__badge--warn {
    background: #fffbeb;
    color: #d97706;
}
</style>
