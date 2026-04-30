<script setup>
import { ref, defineModel, watch, nextTick, reactive, onMounted, onBeforeUnmount } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsRadioButton from "@/components/ms-radio-button/MsRadioButton.vue";
import { createAllowance } from "@/common/model/allowanceModel";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import { Modal } from "ant-design-vue";
import MsInputNumber from "@/components/ms-input-number/MsInputNumber.vue";
import { getCurrentUserGuid } from "@/utils/currentUser";
import { useFormValidation } from "@/composables/useFormValidation";

const TITLE_ALLOWANCE_FORM_ADD = "Thêm Phụ cấp";
const TITLE_ALLOWANCE_FORM_EDIT = "Sửa Phụ cấp";

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

const isFormOpen = defineModel({
    type: Boolean,
    default: false,
});

const isSubmit = ref(false);
const allowance = ref(createAllowance());

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

const fieldOrder = ["allowanceCode", "allowanceName", "calculationType", "amount", "percent"];

initValidation(validateField, fieldOrder);

const emit = defineEmits(["submit", "submit-and-add"]);

watch(
    () => isFormOpen.value,
    (open) => {
        if (!open) return;

        if (props.typeForm === "edit" && props.data) {
            allowance.value = { ...props.data };
        }

        if (props.typeForm === "add") {
            allowance.value = createAllowance();
        }

        if (props.typeForm === "duplicate" && props.data) {
            allowance.value = {
                ...props.data,
                allowanceId: "",
                allowanceCode: "",
            };
        }
    },
);

watch(
    () => allowance.value.calculationType,
    (type) => {
        if (type === "FIXED") {
            allowance.value.percent = null;
        } else if (type === "PERCENT") {
            allowance.value.amount = null;
        }
    },
);

function validateField(field) {
    switch (field) {
        case "allowanceCode":
            errors.value.allowanceCode = allowance.value.allowanceCode
                ? ""
                : "Mã phụ cấp không được để trống";
            break;

        case "allowanceName":
            errors.value.allowanceName = allowance.value.allowanceName
                ? ""
                : "Tên phụ cấp không được để trống";
            break;

        case "calculationType":
            errors.value.calculationType = allowance.value.calculationType
                ? ""
                : "Kiểu tính không được để trống";
            break;

        case "amount":
            if (allowance.value.calculationType === "FIXED") {
                errors.value.amount =
                    allowance.value.amount && allowance.value.amount > 0
                        ? ""
                        : "Số tiền phải lớn hơn 0";
            } else {
                errors.value.amount = "";
            }
            break;

        case "percent":
            if (allowance.value.calculationType === "PERCENT") {
                errors.value.percent =
                    allowance.value.percent && allowance.value.percent > 0
                        ? ""
                        : "Phần trăm phải lớn hơn 0";
            } else {
                errors.value.percent = "";
            }
            break;
    }
}

const handleSubmit = async (isSubmitAndAdd) => {
    isSubmit.value = true;
    const allValid = validateForm();
    if (!allValid) {
        await focusFirstInvalidInput();
        return;
    }

    const isUpdate = props.typeForm === "edit";
    const payload = buildPayload(allowance.value, isUpdate);

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
    allowance.value = createAllowance();
};

function buildPayload(allowanceData, isUpdate = false) {
    const currentUser = getCurrentUserGuid();
    const { ...rest } = allowanceData;

    if (!isUpdate) {
        delete rest.allowanceId;
        return {
            ...rest,
            createdBy: currentUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser,
        };
    }

    return {
        ...rest,
        updatedBy: currentUser,
        updatedAt: new Date().toISOString(),
    };
}

defineExpose({
    handleCloseForm,
});

const handleKeydown = (e) => {
    if (!isFormOpen.value) return;

    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit(true);
        return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit(false);
        return;
    }

    if (e.key === "Escape") {
        handleCloseForm();
    }
};

onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
    <ms-alert v-model="showConfirm" title="Cảnh báo" @close="modelClose">
        {{ errorMessage }}
    </ms-alert>

    <Modal
        v-model:open="isFormOpen"
        :title="props.typeForm === 'edit' ? TITLE_ALLOWANCE_FORM_EDIT : TITLE_ALLOWANCE_FORM_ADD"
        width="680px"
        centered
        :footer="null"
        :mask-closable="false"
        :destroy-on-close="true"
        @cancel="handleCloseForm"
    >
        <div class="form-allowance d-flex flex-column">
            <div class="form-allowance__body d-flex flex-column">
                <div class="form-allowance__item d-flex justify-content-between">
                    <div class="form-allowance__label form-allowance__label--required">
                        Mã phụ cấp
                    </div>
                    <ms-input
                        :label="'Mã phụ cấp'"
                        :ref="(el) => (inputRefs.allowanceCode = el)"
                        v-model="allowance.allowanceCode"
                        :width="474"
                        :maxLength="50"
                        :firstFocus="true"
                        :error="errors.allowanceCode"
                        @blurInput="handleBlur('allowanceCode')"
                        required
                    ></ms-input>
                </div>

                <div class="form-allowance__item d-flex justify-content-between">
                    <div class="form-allowance__label form-allowance__label--required">
                        Tên phụ cấp
                    </div>
                    <ms-input
                        v-model="allowance.allowanceName"
                        :ref="(el) => (inputRefs.allowanceName = el)"
                        :label="'Tên phụ cấp'"
                        :width="474"
                        :maxLength="255"
                        :error="errors.allowanceName"
                        @blurInput="handleBlur('allowanceName')"
                        required
                    ></ms-input>
                </div>

                <div class="form-allowance__item d-flex justify-content-between">
                    <div class="form-allowance__label form-allowance__label--required">
                        Kiểu tính
                    </div>
                    <div class="form-allowance__radio-group">
                        <ms-radio-button
                            v-model="allowance.calculationType"
                            :value="'FIXED'"
                            name="calculationType"
                        >
                            Cố định
                        </ms-radio-button>
                        <ms-radio-button
                            v-model="allowance.calculationType"
                            :value="'PERCENT'"
                            name="calculationType"
                        >
                            Phần trăm
                        </ms-radio-button>
                    </div>
                </div>

                <div
                    v-if="allowance.calculationType === 'FIXED'"
                    class="form-allowance__item d-flex justify-content-between"
                >
                    <div class="form-allowance__label form-allowance__label--required">Số tiền</div>
                    <ms-input-number
                        v-model:value="allowance.amount"
                        :min="0"
                        style="width: 474px"
                        :ref="(el) => (inputRefs.amount = el)"
                        :error="errors.amount"
                        @blur="handleBlur('amount')"
                    ></ms-input-number>
                </div>

                <div
                    v-if="allowance.calculationType === 'PERCENT'"
                    class="form-allowance__item d-flex justify-content-between"
                >
                    <div class="form-allowance__label form-allowance__label--required">
                        Phần trăm (%)
                    </div>
                    <ms-input-number
                        v-model:value="allowance.percent"
                        :min="0"
                        :max="100"
                        style="width: 474px"
                        :ref="(el) => (inputRefs.percent = el)"
                        :error="errors.percent"
                        @blur="handleBlur('percent')"
                    ></ms-input-number>
                </div>

                <div class="form-allowance__item d-flex justify-content-between">
                    <div class="form-allowance__label">Phiên bản</div>
                    <ms-input-number
                        v-model:value="allowance.version"
                        :min="1"
                        style="width: 474px"
                    ></ms-input-number>
                </div>
            </div>

            <div class="form-allowance__footer d-flex align-items-center justify-content-end">
                <div class="form-allowance__footer-buttons d-flex align-items-center">
                    <ms-button :tooltip="'Crtl + S'" @click="handleSubmit(false)" tabindex="0"
                        >Lưu</ms-button
                    >
                    <ms-button
                        :tooltip="'Crtl + Shift + S'"
                        :type="'outline'"
                        tabindex="0"
                        @click="handleSubmit(true)"
                    >
                        Lưu và thêm
                    </ms-button>
                    <ms-button :type="'outline'" @click="handleCloseForm" tabindex="0"
                        >Hủy</ms-button
                    >
                </div>
            </div>
        </div>
    </Modal>
</template>

<style scoped>
.form-allowance {
    width: 100%;
}

.form-allowance__body {
    flex: 1;
    padding: 20px 0 16px;
    min-height: 0;
    row-gap: 16px;
}

.form-allowance__footer {
    height: 56px;
    width: 100%;
    border-top: 1px solid #e0e0e0;
    padding: 12px 0 0;
}

.form-allowance__label {
    width: 150px;
    font-weight: 500;
    line-height: 27px;
    margin-right: 16px;
}

.form-allowance__label--required::after {
    content: "*";
    color: red;
    margin-left: 3px;
}

.form-allowance__footer-buttons {
    column-gap: 8px;
    flex-direction: row-reverse;
}

.form-allowance__radio-group {
    display: flex;
    gap: 16px;
}

.ant-control:deep(.ms-input-number) {
    width: 100%;
}

.ant-control:deep(.ant-input-number-input) {
    height: 27px;
}
</style>
