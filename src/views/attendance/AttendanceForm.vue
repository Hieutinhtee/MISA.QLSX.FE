<script setup>
import { ref, onMounted, reactive, watch, computed } from "vue";
import { Modal, Form, Input, Select, TimePicker, InputNumber, Spin } from "ant-design-vue";
import { SaveOutlined, FieldTimeOutlined } from "@ant-design/icons-vue";
import dayjs from "dayjs";
import MsButton from "@/components/ms-button/MsButton.vue";
import attendanceAPI from "@/apis/components/attendance/attendanceAPI";
import shiftsAPI from "@/apis/components/shifts/shiftsAPI";
import employeesAPI from "@/apis/components/employees/employeesAPI";

const props = defineProps({
    attendance: { type: Object, required: true },
});

const emit = defineEmits(["close"]);

const loading = ref(false);
const formRef = ref(null);

const formData = reactive({
    attendanceId: null,
    employeeId: null,
    fullName: "",
    attendanceDate: null,
    checkIn: null,
    checkOut: null,
    status: "present",
    overtimeHours: 0,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    penaltyAmount: 0,
    bonusAmount: 0,
    shiftId: null,
});

const shifts = ref([]);

onMounted(async () => {
    if (props.attendance) {
        Object.assign(formData, props.attendance);

        if (formData.checkIn === "00:00:00" || formData.checkIn === "00:00") formData.checkIn = null;
        if (formData.checkOut === "00:00:00" || formData.checkOut === "00:00")
            formData.checkOut = null;
        if (formData.attendanceDate) {
            formData.attendanceDate = dayjs(formData.attendanceDate);
        }
    }

    // Tải danh sách ca làm việc và thông tin nhân viên (nếu chưa có ca)
    try {
        const [shiftsRes, employeeRes] = await Promise.all([
            shiftsAPI.getAll(),
            !formData.shiftId && formData.employeeId
                ? employeesAPI.getById(formData.employeeId)
                : Promise.resolve(null),
        ]);

        if (shiftsRes.data?.data) {
            shifts.value = shiftsRes.data.data;
        }

        // Nếu bản ghi chấm công chưa có ca, lấy ca mặc định từ nhân viên
        if (!formData.shiftId && employeeRes?.data?.data?.shiftId) {
            formData.shiftId = employeeRes.data.data.shiftId;
        }
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu khởi tạo:", error);
    }
});

// Tự động tính số phút đi muộn
const calculateLateMinutes = () => {
    if (!formData.checkIn || !formData.shiftId) return;

    const selectedShift = shifts.value.find((s) => s.shiftId === formData.shiftId);
    if (!selectedShift || !selectedShift.startTime) return;

    const [checkInH, checkInM] = formData.checkIn.split(":").map(Number);
    // Xử lý startTime có thể là HH:mm hoặc HH:mm:ss
    const [shiftH, shiftM] = selectedShift.startTime.split(":").map(Number);

    const checkInTotal = checkInH * 60 + checkInM;
    const shiftTotal = shiftH * 60 + shiftM;

    if (checkInTotal > shiftTotal) {
        formData.lateMinutes = checkInTotal - shiftTotal;
        formData.status = "late";
    } else {
        formData.lateMinutes = 0;
        if (formData.status === "late") formData.status = "present";
    }
};

watch(() => [formData.checkIn, formData.shiftId], calculateLateMinutes);

const currentShift = computed(() => {
    return shifts.value.find((s) => s.shiftId === formData.shiftId);
});

const handleSave = async () => {
    loading.value = true;
    try {
        const payload = { ...formData };
        const attendanceId = payload.attendanceId || props.attendance?.attendanceId;

        if (!attendanceId) {
            window.$toastError("Thiếu mã bản ghi chấm công để cập nhật");
            return;
        }

        if (payload.attendanceDate && dayjs.isDayjs(payload.attendanceDate))
            payload.attendanceDate = payload.attendanceDate.format("YYYY-MM-DD");

        const res = await attendanceAPI.update(attendanceId, payload);
        if (res.data) {
            window.$toastSuccess("Cập nhật chấm công thành công");
            emit("close", true);
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật chấm công:", error);
        window.$toastError("Cập nhật chấm công thất bại");
    } finally {
        loading.value = false;
    }
};

const handleCancel = () => {
    emit("close", false);
};
</script>

<template>
    <Modal
        :visible="true"
        :title="'Sửa chấm công - ' + formData.fullName"
        @cancel="handleCancel"
        :width="600"
        :footer="null"
        centered
    >
        <Form ref="formRef" :model="formData" layout="vertical" class="attendance-form">
            <div class="row">
                <div class="col-6">
                    <Form.Item label="Ngày chấm công" name="attendanceDate">
                        <Input :value="formData.attendanceDate?.format('DD/MM/YYYY')" disabled />
                    </Form.Item>
                </div>
                <div class="col-6">
                    <Form.Item label="Ca làm việc áp dụng" name="shiftId">
                        <div class="shift-applied">
                            <div class="shift-applied__icon">
                                <field-time-outlined />
                            </div>
                            <div class="shift-applied__details">
                                <div class="shift-applied__name">
                                    {{ currentShift?.shiftName || "Đang xác định..." }}
                                </div>
                                <div class="shift-applied__time" v-if="currentShift">
                                    {{ currentShift.startTime?.substring(0, 5) }} -
                                    {{ currentShift.endTime?.substring(0, 5) }}
                                </div>
                            </div>
                            <Select
                                v-model:value="formData.shiftId"
                                class="shift-applied__select"
                                :bordered="false"
                                placeholder="Đổi ca"
                            >
                                <Select.Option
                                    v-for="shift in shifts"
                                    :key="shift.shiftId"
                                    :value="shift.shiftId"
                                >
                                    {{ shift.shiftName }} ({{ shift.startTime?.substring(0, 5) }} -
                                    {{ shift.endTime?.substring(0, 5) }})
                                </Select.Option>
                            </Select>
                        </div>
                    </Form.Item>
                </div>
            </div>

            <div class="row">
                <div class="col-6">
                    <Form.Item label="Trạng thái" name="status">
                        <Select v-model:value="formData.status">
                            <Select.Option value="present">Có mặt</Select.Option>
                            <Select.Option value="late">Đi muộn</Select.Option>
                            <Select.Option value="absent">Vắng mặt</Select.Option>
                            <Select.Option value="on_leave">Nghỉ phép</Select.Option>
                        </Select>
                    </Form.Item>
                </div>
            </div>

            <div class="row">
                <div class="col-6">
                    <Form.Item label="Giờ vào" name="checkIn">
                        <TimePicker
                            v-model:value="formData.checkIn"
                            format="HH:mm"
                            value-format="HH:mm"
                            placeholder="Giờ:Phút"
                            class="w-100"
                        />
                    </Form.Item>
                </div>
                <div class="col-6">
                    <Form.Item label="Giờ ra" name="checkOut">
                        <TimePicker
                            v-model:value="formData.checkOut"
                            format="HH:mm"
                            value-format="HH:mm"
                            placeholder="Giờ:Phút"
                            class="w-100"
                        />
                    </Form.Item>
                </div>
            </div>

            <div class="row">
                <div class="col-6">
                    <Form.Item label="Tăng ca (giờ)" name="overtimeHours">
                        <InputNumber
                            v-model:value="formData.overtimeHours"
                            :min="0"
                            :step="0.5"
                            class="w-100"
                        />
                    </Form.Item>
                </div>
                <div class="col-6">
                    <Form.Item label="Đi muộn (phút)" name="lateMinutes">
                        <InputNumber v-model:value="formData.lateMinutes" :min="0" class="w-100" />
                    </Form.Item>
                </div>
            </div>

            <div class="row">
                <div class="col-6">
                    <Form.Item label="Tiền thưởng" name="bonusAmount">
                        <InputNumber
                            v-model:value="formData.bonusAmount"
                            :min="0"
                            :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                            :parser="(value) => value.replace(/\$\s?|(,*)/g, '')"
                            class="w-100"
                        />
                    </Form.Item>
                </div>
                <div class="col-6">
                    <Form.Item label="Tiền phạt" name="penaltyAmount">
                        <InputNumber
                            v-model:value="formData.penaltyAmount"
                            :min="0"
                            :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                            :parser="(value) => value.replace(/\$\s?|(,*)/g, '')"
                            class="w-100"
                        />
                    </Form.Item>
                </div>
            </div>

            <div class="form-footer d-flex justify-content-end gap-12 mt-24">
                <ms-button type="outline" @click="handleCancel"> Hủy </ms-button>
                <ms-button
                    type="primary"
                    class="d-flex align-items-center gap-8"
                    @click="handleSave"
                    :disabled="loading"
                >
                    <save-outlined v-if="!loading" />
                    <Spin v-else size="small" />
                    Lưu thay đổi
                </ms-button>
            </div>
        </Form>
    </Modal>
</template>

<style scoped>
.attendance-form {
    padding: 8px 0;
}

.row {
    display: flex;
    margin: 0 -8px;
}

.col-6 {
    flex: 0 0 50%;
    max-width: 50%;
    padding: 0 8px;
}

.w-100 {
    width: 100%;
}

.form-footer {
    border-top: 1px solid #f0f0f0;
    padding-top: 20px;
    margin-top: 10px;
}

.shift-applied {
    display: flex;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    position: relative;
    height: 56px;
    transition: all 0.2s ease;
}

.shift-applied:hover {
    border-color: #009b71;
    background: #f0fdfa;
}

.shift-applied__icon {
    width: 32px;
    height: 32px;
    background: #ecfdf5;
    color: #009b71;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-size: 18px;
}

.shift-applied__details {
    flex: 1;
}

.shift-applied__name {
    font-weight: 600;
    font-size: 13px;
    color: #1e293b;
    line-height: 1.2;
}

.shift-applied__time {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
}

.shift-applied__select {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}
</style>
