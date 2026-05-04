<script setup>
import { defineEmits, defineModel, defineProps, ref, watch } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import { createDepartment } from "@/common/model/departmentModel";
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

const department = ref(createDepartment());

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

const fieldOrder = ["departmentCode", "departmentName"];

initValidation(validateField, fieldOrder);

function validateField(field) {
    switch (field) {
        case "departmentCode":
            errors.value.departmentCode = department.value.departmentCode?.trim()
                ? ""
                : "Mã phòng ban không được để trống";
            break;
        case "departmentName":
            errors.value.departmentName = department.value.departmentName?.trim()
                ? ""
                : "Tên phòng ban không được để trống";
            break;
    }
}

function buildPayload() {
    const currentUser = getCurrentUserGuid();
    const isUpdate = props.typeForm === "edit";

    const payload = {
        ...department.value,
        departmentCode: department.value.departmentCode?.trim() || "",
        departmentName: department.value.departmentName?.trim() || "",
        description: department.value.description?.trim() || "",
    };

    if (!isUpdate) {
        delete payload.departmentId;

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
            department.value = {
                ...createDepartment(),
                ...props.data,
            };
            return;
        }

        department.value = createDepartment();
    },
);
</script>

<template>
    <ms-form
        v-model:open="isFormOpen"
        :title="props.typeForm === 'edit' ? 'Sửa phòng ban' : 'Thêm phòng ban'"
        width="700px"
        :show-save-and-add="false"
        :show-error-alert="showConfirm"
        :error-message="errorMessage"
        @close-alert="modelClose"
        @submit="handleSubmit"
        @cancel="handleCloseForm"
    >
        <div class="form-department-content d-flex flex-column gap-12">
            <div class="form-row d-flex justify-content-between align-items-center">
                <div class="form-label form-label--required">Mã phòng ban</div>
                <ms-input
                    v-model="department.departmentCode"
                    :width="430"
                    :error="errors.departmentCode"
                    :ref="(el) => (inputRefs.departmentCode = el)"
                    @blurInput="handleBlur('departmentCode')"
                />
            </div>

            <div class="form-row d-flex justify-content-between align-items-center">
                <div class="form-label form-label--required">Tên phòng ban</div>
                <ms-input
                    v-model="department.departmentName"
                    :width="430"
                    :error="errors.departmentName"
                    :ref="(el) => (inputRefs.departmentName = el)"
                    @blurInput="handleBlur('departmentName')"
                />
            </div>

            <div class="form-row d-flex justify-content-between align-items-start">
                <div class="form-label">Mô tả</div>
                <div class="form-textarea w-430">
                    <ms-textarea v-model="department.description" />
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
