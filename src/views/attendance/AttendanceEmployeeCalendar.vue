<script setup>
defineOptions({ name: "AttendanceCalendar" });

import { ref, onMounted, computed, watch, inject } from "vue";
import dayjs from "dayjs";
import { Spin } from "ant-design-vue";
import {
    LeftOutlined,
    RightOutlined,
    CalendarOutlined,
    FieldTimeOutlined,
    HistoryOutlined,
    UserDeleteOutlined,
} from "@ant-design/icons-vue";

import attendanceAPI from "@/apis/components/attendance/attendanceAPI";
import AttendanceForm from "./AttendanceForm.vue";

const props = defineProps({
    employeeId: { type: String, required: true },
    employeeName: { type: String, default: "Nhân viên" },
});

const { authState } = inject("auth");
const loading = ref(false);
const month = ref(new Date().getMonth() + 1);
const year = ref(new Date().getFullYear());
const records = ref([]);
const summary = ref({
    totalWorkingDays: 0,
    totalOvertimeHours: 0,
    totalLateTimes: 0,
    totalDaysOff: 0,
});

const showForm = ref(false);
const selectedAttendance = ref(null);

const currentRole = computed(() => {
    let role = authState?.user?.role || null;
    if (role?.startsWith("ROLE_")) {
        role = role.substring(5);
    }
    return role;
});

const canEdit = computed(() => ["ADMIN", "HR"].includes(currentRole.value));

const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

const fetchCalendar = async () => {
    loading.value = true;
    try {
        const res = await attendanceAPI.getEmployeeCalendar(
            props.employeeId,
            month.value,
            year.value,
        );

        if (res.data) {
            records.value = res.data.records || [];
            summary.value = {
                ...summary.value,
                ...(res.data.summary || {}),
            };
        }
    } catch (error) {
        console.error("Lỗi khi tải lịch chấm công:", error);
    } finally {
        loading.value = false;
    }
};

const calendarWeeks = computed(() => {
    const weeks = [];
    const firstDay = new Date(year.value, month.value - 1, 1);

    let current = new Date(firstDay);
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    current.setDate(current.getDate() - diff);

    for (let w = 0; w < 6; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const dateStr = dayjs(current).format("YYYY-MM-DD");
            const record = records.value.find((r) => r.date?.startsWith(dateStr));

            week.push({
                date: new Date(current),
                currentMonth: current.getMonth() === month.value - 1,
                record,
            });

            current.setDate(current.getDate() + 1);
        }

        weeks.push(week);
        if (current.getMonth() !== month.value - 1 && w >= 3) break;
    }

    return weeks;
});

const getStatusClass = (status) => {
    switch (status) {
        case "present":
            return "cal__status--present";
        case "late":
            return "cal__status--late";
        case "absent":
            return "cal__status--absent";
        case "on_leave":
            return "cal__status--leave";
        default:
            return "";
    }
};

const isToday = (date) => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

const prevMonth = () => {
    if (month.value === 1) {
        month.value = 12;
        year.value--;
    } else {
        month.value--;
    }
};

const nextMonth = () => {
    if (month.value === 12) {
        month.value = 1;
        year.value++;
    } else {
        month.value++;
    }
};

const handleCellClick = (day) => {
    if (!canEdit.value || !day.record) return;

    selectedAttendance.value = {
        ...day.record,
        attendanceId: day.record.attendanceId,
        fullName: props.employeeName,
        attendanceDate: dayjs(day.date).format("YYYY-MM-DD"),
    };
    showForm.value = true;
};

const onFormClose = (refresh) => {
    showForm.value = false;
    selectedAttendance.value = null;
    if (refresh) {
        fetchCalendar();
    }
};

watch([month, year], () => {
    fetchCalendar();
});

onMounted(() => {
    fetchCalendar();
});
</script>

<template>
    <div class="cal">
        <div class="cal__header">
            <h1 class="cal__title">Bảng chấm công - {{ employeeName }}</h1>
            <div class="cal__nav">
                <button class="cal__nav-btn" @click="prevMonth">
                    <left-outlined />
                </button>
                <div class="cal__nav-label">Tháng {{ month }}/{{ year }}</div>
                <button class="cal__nav-btn" @click="nextMonth">
                    <right-outlined />
                </button>
            </div>
        </div>

        <Spin :spinning="loading" size="large">
            <div class="cal__stats">
                <div class="cal__stat-card cal__stat-card--green">
                    <div class="cal__stat-icon"><calendar-outlined style="font-size: 22px" /></div>
                    <div class="cal__stat-body">
                        <div class="cal__stat-value">
                            {{ (summary?.totalWorkingDays || 0).toFixed(1) }}
                        </div>
                        <div class="cal__stat-label">Ngày công</div>
                    </div>
                </div>
                <div class="cal__stat-card cal__stat-card--blue">
                    <div class="cal__stat-icon">
                        <field-time-outlined style="font-size: 22px" />
                    </div>
                    <div class="cal__stat-body">
                        <div class="cal__stat-value">
                            {{ (summary?.totalOvertimeHours || 0).toFixed(1) }}h
                        </div>
                        <div class="cal__stat-label">Tăng ca</div>
                    </div>
                </div>
                <div class="cal__stat-card cal__stat-card--yellow">
                    <div class="cal__stat-icon"><history-outlined style="font-size: 22px" /></div>
                    <div class="cal__stat-body">
                        <div class="cal__stat-value">{{ summary?.totalLateTimes || 0 }}</div>
                        <div class="cal__stat-label">Đi muộn</div>
                    </div>
                </div>
                <div class="cal__stat-card cal__stat-card--red">
                    <div class="cal__stat-icon">
                        <user-delete-outlined style="font-size: 22px" />
                    </div>
                    <div class="cal__stat-body">
                        <div class="cal__stat-value">{{ summary?.totalDaysOff || 0 }}</div>
                        <div class="cal__stat-label">Ngày nghỉ</div>
                    </div>
                </div>
            </div>

            <div class="cal__grid">
                <div class="cal__grid-header">
                    <div
                        v-for="day in dayNames"
                        :key="day"
                        class="cal__grid-dayname"
                        :class="{ 'cal__grid-dayname--weekend': day === 'Thứ 7' || day === 'CN' }"
                    >
                        {{ day }}
                    </div>
                </div>

                <div class="cal__grid-body">
                    <div
                        v-for="(week, wIndex) in calendarWeeks"
                        :key="wIndex"
                        class="cal__grid-week"
                    >
                        <div
                            v-for="(day, dIndex) in week"
                            :key="dIndex"
                            class="cal__grid-cell"
                            :class="{
                                'cal__grid-cell--other': !day.currentMonth,
                                'cal__grid-cell--today': isToday(day.date),
                                'cal__grid-cell--clickable': canEdit && day.record,
                            }"
                            @click="handleCellClick(day)"
                        >
                            <div class="cal__cell-top">
                                <span v-if="isToday(day.date)" class="cal__today-tag">Nay</span>
                                <span
                                    class="cal__cell-day"
                                    :class="{ 'cal__cell-day--muted': !day.currentMonth }"
                                >
                                    {{ day.date.getDate() }}
                                </span>
                            </div>

                            <div
                                v-if="day.record && day.currentMonth"
                                class="cal__cell-content"
                                :class="getStatusClass(day.record.status)"
                            >
                                <div class="cal__cell-shift">HC</div>
                                <div class="cal__cell-time">
                                    {{ day.record.checkIn || "--:--" }}
                                </div>
                                <div class="cal__cell-time">
                                    {{ day.record.checkOut || "--:--" }}
                                </div>
                                <div v-if="day.record.overtimeHours > 0" class="cal__cell-ot">
                                    +{{ day.record.overtimeHours }}h
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="cal__legend">
                <div class="cal__legend-item">
                    <div class="cal__legend-dot cal__legend-dot--present"></div>
                    <span>Đầy đủ</span>
                </div>
                <div class="cal__legend-item">
                    <div class="cal__legend-dot cal__legend-dot--late"></div>
                    <span>Đi muộn</span>
                </div>
                <div class="cal__legend-item">
                    <div class="cal__legend-dot cal__legend-dot--absent"></div>
                    <span>Vắng</span>
                </div>
                <div class="cal__legend-item">
                    <div class="cal__legend-dot cal__legend-dot--leave"></div>
                    <span>Nghỉ phép</span>
                </div>
            </div>
        </Spin>

        <AttendanceForm v-if="showForm" :attendance="selectedAttendance" @close="onFormClose" />
    </div>
</template>

<style scoped>
.cal__grid-cell--clickable {
    cursor: pointer;
}

.cal__grid-cell--clickable:hover {
    background: #ecfdf5 !important;
}

.cal {
    background-color: #f0f2f5;
    padding: 20px 24px;
    flex: 1;
    overflow-y: auto;
    font-family: "Inter", sans-serif;
}

.cal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.cal__title {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
}

.cal__nav {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 8px;
    padding: 3px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    gap: 4px;
}

.cal__nav-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: all 0.2s ease;
}

.cal__nav-btn:hover {
    background: #f3f4f6;
    color: #009b71;
}

.cal__nav-label {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    min-width: 110px;
    text-align: center;
}

.cal__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.cal__stat-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
}

.cal__stat-card::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
}

.cal__stat-card--green::after {
    background: #009b71;
}
.cal__stat-card--blue::after {
    background: #3b82f6;
}
.cal__stat-card--yellow::after {
    background: #f59e0b;
}
.cal__stat-card--red::after {
    background: #ef4444;
}

.cal__stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.cal__stat-card--green .cal__stat-icon {
    background: #ecfdf5;
    color: #009b71;
}
.cal__stat-card--blue .cal__stat-icon {
    background: #eff6ff;
    color: #3b82f6;
}
.cal__stat-card--yellow .cal__stat-icon {
    background: #fffbeb;
    color: #f59e0b;
}
.cal__stat-card--red .cal__stat-icon {
    background: #fef2f2;
    color: #ef4444;
}

.cal__stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.2;
}

.cal__stat-label {
    font-size: 12px;
    color: #9ca3af;
}

.cal__grid {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.cal__grid-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

.cal__grid-dayname {
    padding: 12px 8px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.cal__grid-dayname--weekend {
    color: #ef4444;
}

.cal__grid-week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid #f3f4f6;
}

.cal__grid-week:last-child {
    border-bottom: none;
}

.cal__grid-cell {
    min-height: 100px;
    padding: 6px;
    border-right: 1px solid #f3f4f6;
    transition: background 0.15s ease;
}

.cal__grid-cell:last-child {
    border-right: none;
}

.cal__grid-cell:hover {
    background: #f0f9ff;
}

.cal__grid-cell--other {
    background: #fafafa;
}

.cal__grid-cell--today {
    background: #f0f9ff !important;
}

.cal__cell-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.cal__cell-day {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    margin-left: auto;
}

.cal__cell-day--muted {
    color: #d1d5db;
}

.cal__today-tag {
    background: #009b71;
    color: #fff;
    font-size: 9px;
    padding: 0 4px;
    border-radius: 3px;
    font-weight: 600;
    line-height: 16px;
}

.cal__cell-content {
    padding: 4px 6px;
    border-radius: 6px;
    border: 1px solid transparent;
    font-size: 11px;
    line-height: 1.5;
}

.cal__status--present {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #15803d;
}
.cal__status--late {
    background: #fffbeb;
    border-color: #fde68a;
    color: #a16207;
}
.cal__status--absent {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
}
.cal__status--leave {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
}

.cal__cell-shift {
    font-weight: 700;
    font-size: 10px;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 2px;
}

.cal__cell-time {
    font-weight: 500;
}

.cal__cell-ot {
    font-size: 10px;
    font-weight: 600;
    color: #3b82f6;
    margin-top: 2px;
}

.cal__legend {
    margin-top: 16px;
    display: flex;
    gap: 20px;
    background: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.cal__legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6b7280;
}

.cal__legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px solid transparent;
}

.cal__legend-dot--present {
    background: #f0fdf4;
    border-color: #bbf7d0;
}
.cal__legend-dot--late {
    background: #fffbeb;
    border-color: #fde68a;
}
.cal__legend-dot--absent {
    background: #fef2f2;
    border-color: #fecaca;
}
.cal__legend-dot--leave {
    background: #eff6ff;
    border-color: #bfdbfe;
}
</style>
