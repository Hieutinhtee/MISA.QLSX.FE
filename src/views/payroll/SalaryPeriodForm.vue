<script setup>
import { ref, defineModel, watch, onMounted, onBeforeUnmount, computed } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsDatePicker from "@/components/ms-date-picker/MsDatePicker.vue";
import { createSalaryPeriod } from "@/common/model/salaryPeriodModel";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import MsForm from "@/components/ms-form/MsForm.vue";
import { useFormValidation } from "@/composables/useFormValidation";
import { getCurrentUserGuid } from "@/utils/currentUser";

//#region constants
/**
 * Tiêu đề form kỳ lương
 * createdBy: TMHieu (25/04/2026)
 */
const TITLE_SALARY_PERIOD_FORM_ADD = "Thêm Kỳ lương";
const TITLE_SALARY_PERIOD_FORM_EDIT = "Sửa Kỳ lương";

//#endregion constants

//#region Props
/**
 * Props của component SalaryPeriodForm
 * @property {string} typeForm - Kiểu form hiện tại: thêm hoặc sửa. Mặc định là "add"
 * createdBy: TMHieu (25/04/2026)
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
/**
 * Trạng thái mở/đóng form kỳ lương
 * createdBy: TMHieu (25/04/2026)
 */
const isFormOpen = defineModel("open", {
    type: Boolean,
    default: false,
});

const isSubmit = ref(false);

const {
    showConfirm,
    errorMessage,
    errors,
    inputRefs,
    initValidation,
    handleBlur,
    validateForm,
    focusFirstInvalidInput,
    modelClose,
    resetErrors,
} = useFormValidation();

const fieldOrder = ["startDate", "endDate"];

initValidation(validateField, fieldOrder);

/**
 * Dữ liệu kỳ lương trong form
 * createdBy: TMHieu (25/04/2026)
 */
const salaryPeriod = ref(createSalaryPeriod());

const modalOpen = computed({
    get: () => isFormOpen.value,
    set: (value) => {
        isFormOpen.value = value;
    },
});

const modalTitle = computed(() =>
    props.typeForm === "edit" ? TITLE_SALARY_PERIOD_FORM_EDIT : TITLE_SALARY_PERIOD_FORM_ADD,
);
//#endregion State Data

//#region Emit
/**
 * Khai báo emit sự kiện submit, submit-and-add để gửi dữ liệu lên cho component cha xử lý
 * createdBy: TMHieu (25/04/2026)
 */
const emit = defineEmits(["submit", "submit-and-add"]);
// #endregion emit

//#region Watch

/**
 * lắng nghe mở form, xử lí mở form add hoặc edit
 * đổ dữ liệu nếu là edit
 * createdBy: TMHieu (25/04/2026)
 */
watch(
    () => isFormOpen.value,
    (open) => {
        if (!open) return;

        if (props.typeForm === "edit" && props.data) {
            salaryPeriod.value = { ...props.data };
        }

        if (props.typeForm === "add") {
            salaryPeriod.value = createSalaryPeriod();
        }
    },
);

/**
 * Validate ngày kết thúc phải sau ngày bắt đầu
 * createdBy: TMHieu (25/04/2026)
 */
watch(
    () => [salaryPeriod.value.startDate, salaryPeriod.value.endDate],
    ([start, end]) => {
        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            if (endDate <= startDate) {
                errors.value.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
            } else {
                errors.value.endDate = "";
            }
        }
    },
);

//#endregion watch

//#region Methods

function validateField(field) {
    switch (field) {
        case "startDate":
            errors.value.startDate = salaryPeriod.value.startDate
                ? ""
                : "Ngày bắt đầu không được để trống";
            break;

        case "endDate":
            errors.value.endDate = salaryPeriod.value.endDate
                ? ""
                : "Ngày kết thúc không được để trống";
            if (salaryPeriod.value.startDate && salaryPeriod.value.endDate) {
                const startDate = new Date(salaryPeriod.value.startDate);
                const endDate = new Date(salaryPeriod.value.endDate);
                if (endDate <= startDate) {
                    errors.value.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
                }
            }
            break;
    }
}

/**
 * Hàm xử lý sự kiện submit form
 * createdBy: TMHieu (25/04/2026)
 */
const handleSubmit = async (isSubmitAndAdd) => {
    isSubmit.value = true;
    const allValid = validateForm();
    if (!allValid) {
        // Focus vào input lỗi đầu tiên
        await focusFirstInvalidInput();
        return;
    }

    const isUpdate = props.typeForm === "edit";
    const payload = buildPayload(salaryPeriod.value, isUpdate);

    if (isSubmitAndAdd) {
        emit("submit-and-add", payload);
    } else {
        emit("submit", payload);
    }
};

const handleCloseForm = () => {
    isFormOpen.value = false;
    isSubmit.value = false;
    resetErrors();
    salaryPeriod.value = createSalaryPeriod();
};

/**
 * Hàm xử lý trước khi sự kiện submit form
 * createdBy: TMHieu (25/04/2026)
 * @param periodData dữ liệu cơ bản trên form
 * @param isUpdate có phải update hay không
 * @returns dữ liệu cơ bản trên form
 */
function buildPayload(periodData, isUpdate = false) {
    const currentUser = getCurrentUserGuid();
    const { ...rest } = periodData;

    const basePayload = {
        ...rest,
        startDate: rest.startDate ? new Date(rest.startDate).toISOString() : null,
        endDate: rest.endDate ? new Date(rest.endDate).toISOString() : null,
    };

    if (!isUpdate) {
        // Khi thêm mới → xóa id
        delete basePayload.salaryPeriodId;

        return {
            ...basePayload,
            createdBy: currentUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser,
        };
    }

    // Khi update → giữ id
    return {
        ...basePayload,
        updatedBy: currentUser,
        updatedAt: new Date().toISOString(),
    };
}

// Đẩy lên cho phép cha gọi đến để đóng và reset form
defineExpose({
    handleCloseForm,
});
//#endregion Methods

/**
 * Trả về class hiển thị trạng thái kỳ lương theo badge.
 * @param {string|null|undefined} status
 * @returns {string}
 */
const getStatusClass = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "draft") return "status-chip status-chip--draft";
    if (normalized === "locked") return "status-chip status-chip--locked";
    if (normalized === "paid") return "status-chip status-chip--paid";

    return "status-chip status-chip--default";
};

/**
 * Chuẩn hóa text hiển thị trạng thái kỳ lương.
 * @param {string|null|undefined} status
 * @returns {string}
 */
const getStatusText = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "draft") return "Nháp";
    if (normalized === "locked") return "Đã khóa";
    if (normalized === "paid") return "Đã chi trả";

    return status || "Không xác định";
};
</script>

<template>
    <ms-form
        v-model:open="isFormOpen"
        :title="modalTitle"
        width="560px"
        :show-error-alert="showConfirm"
        :error-message="errorMessage"
        @close-alert="modelClose"
        @submit="handleSubmit(false)"
        @submit-and-add="handleSubmit(true)"
        @cancel="handleCloseForm"
    >
        <div class="form-salary-period-content d-flex flex-column gap-16">
            <div class="form-salary-period__item d-flex justify-content-between">
                <div class="form-salary-period__label form-salary-period__label--required">
                    Ngày bắt đầu
                </div>
                <ms-date-picker
                    :ref="(el) => (inputRefs.startDate = el)"
                    v-model="salaryPeriod.startDate"
                    value-format="YYYY-MM-DD"
                    format="DD/MM/YYYY"
                    placeholder="DD/MM/YYYY"
                    :width="300"
                    :error="errors.startDate"
                    @blurInput="handleBlur('startDate')"
                    required
                ></ms-date-picker>
            </div>

            <div class="form-salary-period__item d-flex justify-content-between">
                <div class="form-salary-period__label form-salary-period__label--required">
                    Ngày kết thúc
                </div>
                <ms-date-picker
                    :ref="(el) => (inputRefs.endDate = el)"
                    v-model="salaryPeriod.endDate"
                    value-format="YYYY-MM-DD"
                    format="DD/MM/YYYY"
                    placeholder="DD/MM/YYYY"
                    :width="300"
                    :error="errors.endDate"
                    @blurInput="handleBlur('endDate')"
                    required
                ></ms-date-picker>
            </div>

            <div v-if="props.typeForm === 'edit'" class="form-salary-period__item">
                <div class="form-salary-period__label">Trạng thái</div>
                <div class="form-salary-period__status">
                    <span :class="getStatusClass(salaryPeriod.status)">
                        {{ getStatusText(salaryPeriod.status) }}
                    </span>
                </div>
            </div>
        </div>
    </ms-form>
</template>
<style scoped>
/* Style phần form thêm kỳ lương  */
.form-salary-period {
    width: 100%;
}

.form-salary-period__body {
    flex: 1;
    padding: 20px 0 16px;
    min-height: 0;
    row-gap: 16px;
}

.form-salary-period__footer {
    height: 56px;
    width: 100%;
    border-top: 1px solid #e0e0e0;
    padding: 12px 0 0;
}

.form-salary-period__label {
    width: 150px;
    font-weight: 500;
    line-height: 27px;
    margin-right: 16px;
}

.form-salary-period__label--required::after {
    content: "*";
    color: red;
    margin-left: 3px;
}

.form-salary-period__status {
    padding: 8px 16px;
}

.form-salary-period__footer-buttons {
    column-gap: 8px;
    flex-direction: row-reverse;
}

.status-chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.status-chip--draft {
    background: #e0f2fe;
    color: #075985;
}

.status-chip--locked {
    background: #fef3c7;
    color: #92400e;
}

.status-chip--paid {
    background: #dcfce7;
    color: #166534;
}

.status-chip--default {
    background: #f3f4f6;
    color: #374151;
}
/* Kết thúc Style phần form thêm kỳ lương  */
</style>
