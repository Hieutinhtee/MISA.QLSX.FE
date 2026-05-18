<script setup>
import { defineEmits, defineModel, defineProps, ref, watch } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import { createPosition } from "@/common/model/positionModel";
import { getCurrentUserGuid } from "@/utils/currentUser";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import MsForm from "@/components/ms-form/MsForm.vue";
import { useFormValidation } from "@/composables/useFormValidation";

const props = defineProps({
    typeForm: {
        type: String,
        default: "add",
        validator: (value) => ["add", "edit"].includes(value),
    },
    data: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(["submit"]);

const isFormOpen = defineModel({
    type: Boolean,
    default: false,
});

const position = ref(createPosition());

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

const fieldOrder = ["positionCode", "positionName"];

initValidation(validateField, fieldOrder);

function validateField(field) {
    switch (field) {
        case "positionCode":
            errors.value.positionCode = position.value.positionCode?.trim()
                ? ""
                : "Mã chức vụ không được để trống";
            break;
        case "positionName":
            errors.value.positionName = position.value.positionName?.trim()
                ? ""
                : "Tên chức vụ không được để trống";
            break;
    }
}

function buildPayload() {
    const currentUser = getCurrentUserGuid();
    const isUpdate = props.typeForm === "edit";

    const payload = {
        ...position.value,
        positionCode: position.value.positionCode?.trim() || "",
        positionName: position.value.positionName?.trim() || "",
        description: position.value.description?.trim() || "",
        allowance: Number(position.value.allowance) || 0,
    };

    if (!isUpdate) {
        delete payload.positionId;

        return {
            ...payload,
            createdBy: currentUser,
            createdAt: new Date().toISOString(),
            updatedBy: currentUser,
            updatedAt: new Date().toISOString(),
        };
    }

    return {
        ...payload,
        updatedBy: currentUser,
        updatedAt: new Date().toISOString(),
    };
}

async function handleSubmit() {
    if (!validateForm()) {
        await focusFirstInvalidInput();
        return;
    }
    emit("submit", buildPayload());
}

function handleCloseForm() {
    isFormOpen.value = false;
}

watch(
    () => isFormOpen.value,
    (open) => {
        if (!open) return;

        resetErrors();

        if (props.typeForm === "edit" && props.data) {
            position.value = {
                ...createPosition(),
                ...props.data,
            };
            return;
        }

        position.value = createPosition();
    },
);
</script>

<template>
    <ms-form
        v-model:open="isFormOpen"
        :title="props.typeForm === 'edit' ? 'Sửa chức vụ' : 'Thêm chức vụ'"
        width="700px"
        :show-save-and-add="false"
        :show-error-alert="showConfirm"
        :error-message="errorMessage"
        @close-alert="modelClose"
        @submit="handleSubmit"
        @cancel="handleCloseForm"
    >
        <div class="form-position-content d-flex flex-column gap-12">
            <div class="form-row d-flex justify-content-between align-items-center">
                <div class="form-label form-label--required">Mã chức vụ</div>
                <ms-input
                    v-model="position.positionCode"
                    :width="430"
                    :error="errors.positionCode"
                    :ref="(el) => (inputRefs.positionCode = el)"
                    @blurInput="handleBlur('positionCode')"
                />
            </div>

            <div class="form-row d-flex justify-content-between align-items-center">
                <div class="form-label form-label--required">Tên chức vụ</div>
                <ms-input
                    v-model="position.positionName"
                    :width="430"
                    :error="errors.positionName"
                    :ref="(el) => (inputRefs.positionName = el)"
                    @blurInput="handleBlur('positionName')"
                />
            </div>

            <div class="form-row d-flex justify-content-between align-items-center">
                <div class="form-label">Phụ cấp (VNĐ)</div>
                <ms-input v-model="position.allowance" :width="430" type="number" :min="0" />
            </div>

            <div class="form-row d-flex justify-content-between align-items-start">
                <div class="form-label">Mô tả</div>
                <div class="form-textarea w-430">
                    <ms-textarea v-model="position.description" />
                </div>
            </div>
        </div>
    </ms-form>
</template>

<style scoped>
.form-row {
    gap: 12px;
}

.form-label {
    width: 180px;
}

.form-label--required::after {
    content: " *";
    color: #ff4d4f;
}

.w-430 {
    width: 430px;
}

.gap-12 {
    gap: 12px;
}
</style>
