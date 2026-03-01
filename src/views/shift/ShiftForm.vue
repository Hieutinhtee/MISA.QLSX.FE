<script setup>
import { ref, defineModel, watch } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import { createShift } from "@/common/model/shiftModel";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";

//#region constants
/**
 * Tiêu đề form ca làm việc
 * createdBy: TMHieu (22/01/2026)
 */
const TITLE_shift_FORM_ADD = "Thêm Ca làm việc";
const TITLE_shift_FORM_EDIT = "Sửa Ca làm việc";

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
        validator: (value) => ["add", "edit"].includes(value),
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
 * Thông báo lỗi của các trường trong
 * form nếu có valaidate liên quan nghiệp vụ
 * ví dụ trùng tên hoặc số điện thoại
 * createdBy: TMHieu (30/01/2026)
 */
// const errorMessage = ref({
//     fullName: "",
//     phone: "",
// });

/**
 * Trạng thái hợp lệ của các trường trong form
 * createdBy: TMHieu (30/01/2026)
 */
const fieldValid = ref({
    productionShiftCode: false,
    productionShiftName: false,
    productionShiftBeginTime: false,
    productionShiftEndTime: false,
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
const emit = defineEmits(["submit"]);
// #endregion emit

//#region Watch

/**
 * lắng nghe mở form, xử lí mở form add hoặc edit
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
    },
);

//#endregion watch

//#region Methods

/**
 * Hàm xử lý sự kiện submit form
 * createdBy: TMHieu (29/01/2026)
 */
const handleSubmit = () => {
    isSubmit.value = true;

    const allValid = Object.values(fieldValid.value).every(Boolean);
    if (allValid) {
        emit("submit", { ...shift.value });
    }
};

const handleCloseForm = () => {
    isFormOpen.value = false;
    isSubmit.value = false;
    shift.value = createShift();
};

// Đẩy lên cho phép cha gọi đến để đóng và reset form
defineExpose({
    handleCloseForm,
});
//#endregion Methods
</script>

<template>
    <!-- Form thêm ca làm việc  -->
    <div v-if="isFormOpen" class="form-shift-modal">
        <div class="form-shift__overlay"></div>
        <div class="form-shift__content d-flex flex-column">
            <div class="form-shift__header d-flex justify-content-between align-items-center">
                <div class="form-shift__title">
                    {{ props.typeForm === "add" ? TITLE_shift_FORM_ADD : TITLE_shift_FORM_EDIT }}
                </div>
                <div class="form-shift__close-icon pointer" @click="handleCloseForm"></div>
            </div>
            <div class="form-shift__body d-flex flex-column">
                <div class="form-shift__item d-flex justify-content-between">
                    <div class="form-shift__label form-shift__label--required">Mã ca</div>
                    <ms-input
                        v-model="shift.productionShiftCode"
                        :width="474"
                        v-model:isValid="fieldValid.productionShiftCode"
                        v-model:isSubmit="isSubmit"
                        :maxLength="20"
                        :firstFocus="true"
                        required
                    ></ms-input>
                </div>
                <div class="form-shift__item d-flex justify-content-between">
                    <div class="form-shift__label form-shift__label--required">Tên ca</div>
                    <ms-input
                        v-model="shift.productionShiftName"
                        :width="474"
                        v-model:isValid="fieldValid.productionShiftName"
                        v-model:isSubmit="isSubmit"
                        :maxLength="50"
                        required
                    ></ms-input>
                </div>
                <div class="form-shift__wrapper-item d-flex justify-content-between">
                    <div class="form-shift__item d-flex flex-1">
                        <div class="form-shift__label form-shift__label--required">Giờ vào ca</div>
                        <ms-input
                            v-model="shift.productionShiftBeginTime"
                            :width="122"
                            v-model:isValid="fieldValid.productionShiftBeginTime"
                            v-model:isSubmit="isSubmit"
                            required
                        ></ms-input>
                    </div>
                    <div class="form-shift__item d-flex flex-1 justify-content-between">
                        <div class="form-shift__label form-shift__label--required">Giờ hết ca</div>
                        <ms-input
                            v-model="shift.productionShiftEndTime"
                            :width="122"
                            v-model:isValid="fieldValid.productionShiftEndTime"
                            v-model:isSubmit="isSubmit"
                            required
                        ></ms-input>
                    </div>
                </div>
                <div class="form-shift__wrapper-item d-flex justify-content-between">
                    <div class="form-shift__item d-flex flex-1">
                        <div class="form-shift__label">Bắt đầu nghỉ giữa ca</div>
                        <ms-input
                            v-model="shift.productionShiftBeginBreakTime"
                            :width="122"
                        ></ms-input>
                    </div>

                    <div class="form-shift__item d-flex justify-content-between flex-1">
                        <div class="form-shift__label">Kết thúc nghỉ giữa ca</div>
                        <ms-input
                            v-model="shift.productionShiftEndBreakTime"
                            :width="122"
                        ></ms-input>
                    </div>
                </div>

                <div class="form-shift__wrapper-item d-flex justify-content-between">
                    <div class="form-shift__item d-flex flex-1">
                        <div class="form-shift__label">Thời gian làm việc (giờ)</div>
                        <ms-input :width="122" disabled></ms-input>
                    </div>

                    <div class="form-shift__item d-flex justify-content-between flex-1">
                        <div class="form-shift__label">Thời gian nghỉ giữa ca (giờ)</div>
                        <ms-input :width="122" disabled></ms-input>
                    </div>
                </div>

                <div class="form-shift__item d-flex justify-content-between">
                    <div class="form-shift__label">Mô tả</div>
                    <ms-textarea v-model="shift.productionShiftDescription"></ms-textarea>
                </div>
                <div v-if="props.typeForm === 'edit'" class="form-shift__item">
                    <div class="form-shift__item d-flex justify-content-between">
                        <div class="form-shift__label">Trạng thái</div>
                    </div>
                </div>
            </div>

            <div class="form-shift__footer d-flex align-items-center justify-content-end">
                <div class="form-shift__footer-buttons d-flex align-items-center">
                    <ms-button :type="'outline'" @click="handleCloseForm">Hủy</ms-button>
                    <ms-button :type="'outline'">Lưu và thêm</ms-button>
                    <ms-button @click="handleSubmit">Lưu</ms-button>
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
    overflow-y: auto;
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
}

.form-shift__wrapper-item {
    column-gap: 16px;
}
/* Kết thúc Style phần form thêm ca làm việc  */
</style>
