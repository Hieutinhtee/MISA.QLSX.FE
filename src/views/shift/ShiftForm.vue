<script setup>
import { ref, defineModel, watch } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsRadioButton from "@/components/ms-radio-button/MsRadioButton.vue";
import { createShift } from "@/common/model/shiftModel";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import { formatTime } from "@/utils/common";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import { Tooltip } from "ant-design-vue";

//#region constants
/**
 * Tiêu đề form ca làm việc
 * createdBy: TMHieu (22/01/2026)
 */
const TITLE_SHIFT_FORM_ADD = "Thêm Ca làm việc";
const TITLE_SHIFT_FORM_EDIT = "Sửa Ca làm việc";

//#endregion constants

//#region Props
/**
 * Props của component shiftForm
 * @property {string} typeForm - Kiểu form hiện tại: thêm hoặc sửa. Mặc định là "add"
 * createdBy: TMHieu (29/01/2026)
 */
const props = defineProps({
    typeForm: {
        type: String,
        default: "add",
        validator: (value) => ["add", "edit", "duplicate"].includes(value),
    },
    data: {
        type: Object,
    },
});
//#endregion

//#region State Data
/** * Trạng thái mở/đóng form ca làm việc
 * createdBy: TMHieu (30/01/2026)
 */
const isFormOpen = defineModel({
    type: Boolean,
    default: false,
});

/**
 * Lưu chuỗi lỗi nếu có
 * createdBy: TMHieu (30/01/2026)
 */
const errorMessage = ref("");

/**
 * Trạng thái xóa ca làm việc
 * createdBy: TMHieu (30/01/2026)
 */
const showConfirm = ref(false);

/**
 * Trạng thái hợp lệ của các trường trong form
 * createdBy: TMHieu (30/01/2026)
 */
const fieldValid = ref({
    shiftCode: false,
    shiftName: false,
    shiftBeginTime: false,
    shiftEndTime: false,
});

/**
 * Trạng thái đã submit form
 * createdBy: TMHieu (30/01/2026)
 */
const isSubmit = ref(false);

/**
 * Dữ liệu ca làm việc trong form
 * createdBy: TMHieu (30/01/2026)
 */
const shift = ref(createShift());
//#endregion State Data

//#region Emit
/**
 * Khai báo emit sự kiện submit
 * createdBy: TMHieu (30/01/2026)
 */
const emit = defineEmits(["submit", "submit-and-add"]);
// #endregion emit

//#region Watch

/**
 * lắng nghe mở form, xử lí mở form add hoặc edit, duplicate
 * đổ dữ liệu nếu là edit
 * createdBy: TMHieu (30/01/2026)
 */
watch(
    () => isFormOpen.value,
    (open) => {
        if (!open) return;

        if (props.typeForm === "edit" && props.data) {
            shift.value = { ...props.data };
        }

        if (props.typeForm === "add") {
            shift.value = createShift();
        }

        if (props.typeForm === "duplicate" && props.data) {
            shift.value = {
                ...props.data,
                shiftId: "",
                shiftCode: "",
                workingTime: null,
                breakTime: null,
            };
        }
    },
);

watch(
    () => errorMessage.value,
    (message) => {
        if (message) {
            showConfirm.value = true;
        }
    },
);

/**
 * lắng nghe thời gian tạm tính
 * createdBy: TMHieu (30/01/2026)
 */
watch(
    () => [
        shift.value.shiftBeginTime,
        shift.value.shiftEndTime,
        shift.value.beginBreakTime,
        shift.value.endBreakTime,
    ],
    ([begin, end, breakBegin, breakEnd]) => {
        if (!begin || !end) {
            resetTime();
            return;
        }

        const shiftRange = normalizeShift(begin, end);
        if (!shiftRange) {
            resetTime();
            return;
        }

        const { shiftBegin, shiftEnd } = shiftRange;
        const shiftDuration = shiftEnd - shiftBegin;

        let breakDuration = 0;

        if (breakBegin && breakEnd) {
            const breakRange = normalizeBreak(breakBegin, breakEnd, shiftBegin);

            if (!breakRange) {
                resetTime();
                return;
            }

            const { breakBeginMin, breakEndMin } = breakRange;

            breakDuration = breakEndMin - breakBeginMin;

            // break phải nằm trong ca
            if (
                breakBeginMin < shiftBegin ||
                breakEndMin > shiftEnd ||
                breakDuration <= 0 ||
                breakDuration >= shiftDuration
            ) {
                resetTime();
                return;
            }
        }

        shift.value.breakTime = round2(breakDuration / 60);

        shift.value.workingTime = round2((shiftDuration - breakDuration) / 60);
    },
);

//#endregion watch

//#region Methods

function validateTime(begin, end, breakBegin, breakEnd) {
    if (begin === end) {
        errorMessage.value = "Giờ hết ca không được bằng giờ vào ca.";
        resetTime();
        return false;
    }

    if (breakBegin && !breakEnd) {
        errorMessage.value =
            "Bạn đã nhập thời gian bắt đầu nghỉ giữa ca nhưng chưa nhập thời gian kết thúc nghỉ giữa ca. Vui lòng kiểm tra lại";
        resetTime();
        return false;
    }

    if (!breakBegin && breakEnd) {
        errorMessage.value =
            "Bạn đã nhập thời gian kết thúc nghỉ giữa ca nhưng chưa nhập thời gian bắt đầu nghỉ giữa ca. Vui lòng kiểm tra lại";
        resetTime();
        return false;
    }

    if (breakBegin && breakEnd) {
        if (breakBegin == breakEnd) {
            errorMessage.value = "Giờ kết thúc nghỉ giữa ca không được bằng giờ nghỉ giữa ca";
            resetTime();
            return false;
        }

        // break phải nằm trong ca
        const shiftRange = normalizeShift(begin, end);
        const { shiftBegin, shiftEnd } = shiftRange;
        const shiftDuration = shiftEnd - shiftBegin;

        let breakDuration = 0;

        if (breakBegin && breakEnd) {
            const breakRange = normalizeBreak(breakBegin, breakEnd, shiftBegin);

            if (!breakRange) {
                resetTime();
                return;
            }

            const { breakBeginMin, breakEndMin } = breakRange;

            breakDuration = breakEndMin - breakBeginMin;

            // break phải nằm trong ca
            if (
                breakBeginMin < shiftBegin ||
                breakEndMin > shiftEnd ||
                breakDuration <= 0 ||
                breakDuration >= shiftDuration
            ) {
                errorMessage.value =
                    "Khoảng giờ nghỉ giữa ca phải nằm trong khoảng thời gian làm việc";
                resetTime();
                return;
            }
        }
    }

    return true;
}

/**
 * Hàm reset thời gian tạm tính
 * createdBy: TMHieu (30/01/2026)
 */
function resetTime() {
    shift.value.workingTime = null;
    shift.value.breakTime = null;
}

/**
 * Hàm chuyển đổi thời gian tạm tính
 * createdBy: TMHieu (30/01/2026)
 */
function toMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        return null;
    }
    return h * 60 + m;
}

/**
 * Hàm chuyển đổi thời gian về cùng mốc 48h
 * createdBy: TMHieu (30/01/2026)
 */
function normalizeShift(begin, end) {
    let shiftBegin = toMinutes(begin);
    let shiftEnd = toMinutes(end);

    if (shiftBegin == null || shiftEnd == null) return null;

    if (shiftEnd <= shiftBegin) {
        shiftEnd += 24 * 60;
    }

    return { shiftBegin, shiftEnd };
}

// Chuẩn hóa nghỉ (nâng lên cùng timeline ca)
function normalizeBreak(breakBegin, breakEnd, shiftBegin) {
    let breakBeginMin = toMinutes(breakBegin);
    let breakEndMin = toMinutes(breakEnd);

    if (breakBeginMin == null || breakEndMin == null) return null;

    // nếu break nhỏ hơn shiftBegin → nghĩa là hôm sau
    if (breakBeginMin < shiftBegin) {
        breakBeginMin += 24 * 60;
    }

    if (breakEndMin <= breakBeginMin) {
        breakEndMin += 24 * 60;
    }

    return { breakBeginMin, breakEndMin };
}

/**
 * Hàm chuyển đổi thời gian tạm tính
 * createdBy: TMHieu (30/01/2026)
 */
function round2(num) {
    return Math.round(num * 100) / 100;
}

/**
 * Hàm xử lý sự kiện submit form
 * createdBy: TMHieu (29/01/2026)
 */
const handleSubmit = (isSubmitAndAdd) => {
    isSubmit.value = true;

    const allValid = Object.values(fieldValid.value).every(Boolean);
    if (!allValid) {
        return;
    }

    if (
        !validateTime(
            shift.value.shiftBeginTime,
            shift.value.shiftEndTime,
            shift.value.beginBreakTime,
            shift.value.endBreakTime,
        )
    )
        return;

    const isUpdate = props.typeForm === "edit";
    const payload = buildPayload(shift.value, isUpdate);

    if (isSubmitAndAdd) {
        emit("submit-and-add", payload);
    } else {
        emit("submit", payload);
    }
};

const handleCloseForm = () => {
    isFormOpen.value = false;
    isSubmit.value = false;
    shift.value = createShift();
    resetTime();
};

const currentUser = "Thái Minh Hiếu";

/**
 * Hàm xử lý trước khi sự kiện submit form
 * createdBy: TMHieu (29/01/2026)
 * @param shiftData dữ liệu cơ bản trên form
 * @param isUpdate có phải update hay không
 * @returns dữ liệu cơ bản trên form
 */
function buildPayload(shiftData, isUpdate = false) {
    const { ...rest } = shiftData;

    const basePayload = {
        ...rest,
        shiftBeginTime: formatTime(rest.shiftBeginTime),
        shiftEndTime: formatTime(rest.shiftEndTime),
        beginBreakTime: formatTime(rest.beginBreakTime),
        endBreakTime: formatTime(rest.endBreakTime),
    };

    if (!isUpdate) {
        // Khi thêm mới → xóa id
        delete basePayload.shiftId;

        return {
            ...basePayload,
            createdBy: currentUser,
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString(),
            modifiedBy: currentUser,
        };
    }

    // Khi update → giữ id
    return {
        ...basePayload,
        modifiedBy: currentUser,
        modifiedDate: new Date().toISOString(),
    };
}

// Đẩy lên cho phép cha gọi đến để đóng và reset form
defineExpose({
    handleCloseForm,
});
//#endregion Methods

const handleShowError = (message) => {
    errorMessage.value = message;
};

const modelClose = () => {
    showConfirm.value = false;
    isSubmit.value = false;
    errorMessage.value = "";
};
</script>

<template>
    <!-- Alert error -->
    <ms-alert v-model="showConfirm" title="Cảnh báo" @close="modelClose">
        {{ errorMessage }}
    </ms-alert>

    <!-- Form thêm ca làm việc  -->
    <div
        v-if="isFormOpen"
        class="form-shift-modal"
        @keydown.ctrl.s.prevent="handleSubmit"
        @keydown.esc="handleCloseForm"
    >
        <div class="form-shift__overlay"></div>
        <div class="form-shift__content d-flex flex-column">
            <div class="form-shift__header d-flex justify-content-between align-items-center">
                <div class="form-shift__title">
                    {{ props.typeForm === "edit" ? TITLE_SHIFT_FORM_EDIT : TITLE_SHIFT_FORM_ADD }}
                </div>
                <div class="d-flex gap-12">
                    <tooltip placement="top" :align="{ offset: [0, 4] }">
                        <template #title>
                            <span>Trợ giúp</span>
                        </template>
                        <div class="form-shift__help-icon pointer"></div>
                    </tooltip>
                    <tooltip placement="top" :align="{ offset: [0, 4] }">
                        <template #title>
                            <span>Đóng (Ecs)</span>
                        </template>
                        <div class="form-shift__close-icon pointer" @click="handleCloseForm"></div>
                    </tooltip>
                </div>
            </div>
            <!-- {{ props.data }} -->
            <div class="form-shift__body d-flex flex-column">
                <div class="form-shift__item d-flex justify-content-between">
                    <div class="form-shift__label form-shift__label--required">Mã ca</div>
                    <ms-input
                        :label="'Mã ca'"
                        v-model="shift.shiftCode"
                        :width="474"
                        v-model:isValid="fieldValid.shiftCode"
                        v-model:isSubmit="isSubmit"
                        :maxLength="20"
                        :firstFocus="true"
                        @error="handleShowError"
                        required
                    ></ms-input>
                </div>
                <div class="form-shift__item d-flex justify-content-between">
                    <div class="form-shift__label form-shift__label--required">Tên ca</div>
                    <ms-input
                        v-model="shift.shiftName"
                        :label="'Tên ca'"
                        :width="474"
                        v-model:isValid="fieldValid.shiftName"
                        v-model:isSubmit="isSubmit"
                        :maxLength="50"
                        @error="handleShowError"
                        required
                    ></ms-input>
                </div>
                <div class="form-shift__wrapper-item d-flex justify-content-between">
                    <div class="form-shift__item d-flex flex-1">
                        <div class="form-shift__label form-shift__label--required">Giờ vào ca</div>
                        <ms-input
                            :label="'Giờ vào ca'"
                            v-model="shift.shiftBeginTime"
                            :width="122"
                            v-model:isValid="fieldValid.shiftBeginTime"
                            v-model:isSubmit="isSubmit"
                            :type="'HH:MM'"
                            @error="handleShowError"
                            required
                        ></ms-input>
                    </div>
                    <div class="form-shift__item d-flex flex-1 justify-content-between">
                        <div class="form-shift__label flex-1 form-shift__label--required">
                            Giờ hết ca
                        </div>

                        <ms-input
                            :label="'Giờ hết ca'"
                            v-model="shift.shiftEndTime"
                            :width="122"
                            v-model:isValid="fieldValid.shiftEndTime"
                            v-model:isSubmit="isSubmit"
                            :type="'HH:MM'"
                            @error="handleShowError"
                            required
                        ></ms-input>
                    </div>
                </div>
                <div class="form-shift__wrapper-item d-flex justify-content-between">
                    <div class="form-shift__item d-flex flex-1">
                        <div class="form-shift__label">Bắt đầu nghỉ giữa ca</div>
                        <ms-input
                            :type="'HH:MM'"
                            v-model="shift.beginBreakTime"
                            :placeholder="'HH:MM'"
                            :width="122"
                        ></ms-input>
                    </div>

                    <div class="form-shift__item d-flex justify-content-between flex-1">
                        <div class="form-shift__label flex-1">Kết thúc nghỉ giữa ca</div>
                        <ms-input
                            :type="'HH:MM'"
                            v-model="shift.endBreakTime"
                            :placeholder="'HH:MM'"
                            :width="122"
                        ></ms-input>
                    </div>
                </div>

                <div class="form-shift__wrapper-item d-flex justify-content-between">
                    <div class="form-shift__item d-flex flex-1">
                        <div class="form-shift__label">Thời gian làm việc (giờ)</div>
                        <ms-input v-model="shift.workingTime" :width="122" disabled></ms-input>
                    </div>

                    <div class="form-shift__item d-flex justify-content-between flex-1">
                        <div class="form-shift__label">Thời gian nghỉ giữa ca (giờ)</div>
                        <ms-input v-model="shift.breakTime" :width="122" disabled></ms-input>
                    </div>
                </div>

                <div class="form-shift__item d-flex justify-content-between">
                    <div class="form-shift__label">Mô tả</div>
                    <ms-textarea v-model="shift.shiftDescription"></ms-textarea>
                </div>
                <div v-if="props.typeForm === 'edit'" class="form-shift__item">
                    <div class="form-shift__item d-flex">
                        <div class="form-shift__label">Trạng thái</div>
                        <ms-radio-button v-model="shift.isActive" :value="true" name="status"
                            >Đang sử dụng</ms-radio-button
                        >
                        <ms-radio-button v-model="shift.isActive" :value="false" name="status"
                            >Ngưng sử dụng</ms-radio-button
                        >
                    </div>
                </div>
            </div>

            <div class="form-shift__footer d-flex align-items-center justify-content-end">
                <div class="form-shift__footer-buttons d-flex align-items-center">
                    <ms-button :tooltip="'Crtl + S'" @click="handleSubmit(false)" tabindex="0"
                        >Lưu</ms-button
                    >
                    <ms-button
                        :tooltip="'Crtl + Shift + S'"
                        :type="'outline'"
                        tabindex="0"
                        @click="handleSubmit(true)"
                        >Lưu và thêm</ms-button
                    >
                    <ms-button :type="'outline'" @click="handleCloseForm" tabindex="0"
                        >Hủy</ms-button
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Style phần form thêm ca làm việc  */
.form-shift__overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.45);
    z-index: 10;
}

.form-shift__content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: max-content;
    width: 680px;
    background-color: white;
    border-radius: var(--border-radius);
    z-index: 11;
    overflow: hidden;
}

.form-shift__header {
    margin: 16px 20px;
}

.form-shift__title {
    font-size: 24px;
    font-weight: 700;
}

.form-shift__body {
    flex: 1;
    padding: 20px;
    min-height: 0;
    row-gap: 16px;
}

.form-shift__input-file-note {
    margin-top: 10px;
    font-size: 13px;
    color: #6a727d;
}

.form-shift__input-file-title {
    color: #2970f6;
    font-size: 13px;
}

.form-shift__file {
    padding: 30px 0;
    border-radius: var(--border-radius);
    border: 1px dashed #e0e0e0;
}

.form-shift__infor {
    margin-top: 24px;
    margin-right: 8px;
}

.form-shift__footer {
    height: 56px;
    width: 100%;
    border-top: 1px solid #e0e0e0;
    padding: 12px 20px;
}

.form-shift__label {
    width: 150px;
    font-weight: 500;
    line-height: 27px;
    margin-right: 16px;
}

.form-shift__label--required::after {
    content: "*";
    color: red;
    margin-left: 3px;
}

.form-shift__icon-wrapper {
    width: 34px;
    height: 34px;
    background-color: #f5f5f5;
    border: 1px solid #dcdce3;
    border-radius: var(--border-radius);
}

.form-shift__icon-dropdown-wrapper {
    width: 34px;
    height: 34px;
    border: 1px solid #dcdce3;
    border-radius: var(--border-radius);
}

.form-shift__input-add {
    position: relative;
}

.form-shift__icon-add-wrapper {
    position: absolute;
    top: 50%;
    right: 40px;
    transform: translateY(-50%);
}

.form-shift__label-edu {
    min-width: 130px;
}

.dot {
    width: 5px;
    height: 5px;
    background-color: #9e9e9e;
    border-radius: 50%;
    margin-right: 5px;
}

.form-shift__education {
    border-bottom: 1px solid #dee2e6 !important;
    margin-bottom: 16px;
    padding-bottom: 6px;
}

.form-shift__add-education-btn-text {
    color: #2970f6;
    margin-left: 3px;
}

.form-shift__quick-reference-input {
    margin-right: 10px;
}

.form-shift__address-work {
    border-bottom: 1px solid #dee2e6 !important;
    margin-bottom: 16px;
    padding-bottom: 16px;
}

.line-v {
    width: 10px;
    height: 1px;
    background-color: black;
}

.form-shift__work-detail-input {
    height: 100px;
}

.modal--hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}

.form-shift__footer-buttons {
    column-gap: 8px;
    flex-direction: row-reverse;
}

.form-shift__wrapper-item {
    column-gap: 16px;
}
/* Kết thúc Style phần form thêm ca làm việc  */
</style>
