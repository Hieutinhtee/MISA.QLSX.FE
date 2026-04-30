<script setup>
import { defineEmits, defineModel, defineProps, ref, watch } from "vue";
import { Modal } from "ant-design-vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import { createDegree } from "@/common/model/degreeModel";
import { getCurrentUserGuid } from "@/utils/currentUser";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
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

const degree = ref(createDegree());

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

const fieldOrder = ["degreeCode", "degreeName"];

initValidation(validateField, fieldOrder);

function validateField(field) {
    switch (field) {
        case "degreeCode":
            errors.value.degreeCode = degree.value.degreeCode?.trim()
                ? ""
                : "Mã bằng cấp không được để trống";
            break;
        case "degreeName":
            errors.value.degreeName = degree.value.degreeName?.trim()
                ? ""
                : "Tên bằng cấp không được để trống";
            break;
    }
}

function buildPayload() {
    const currentUser = getCurrentUserGuid();
    const isUpdate = props.typeForm === "edit";

    const payload = {
        ...degree.value,
        degreeCode: degree.value.degreeCode?.trim() || "",
        degreeName: degree.value.degreeName?.trim() || "",
        description: degree.value.description?.trim() || "",
    };

    if (!isUpdate) {
        delete payload.degreeId;

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
            degree.value = {
                ...createDegree(),
                ...props.data,
            };
            return;
        }

        degree.value = createDegree();
    },
);
</script>

<template>
    <ms-alert v-model="showConfirm" title="Cảnh báo" @close="modelClose">
        {{ errorMessage }}
    </ms-alert>

    <Modal
        v-model:open="isFormOpen"
        :title="props.typeForm === 'edit' ? 'Sửa bằng cấp' : 'Thêm bằng cấp'"
        width="700px"
        centered
        :footer="null"
        :mask-closable="false"
        :destroy-on-close="true"
        @cancel="handleCloseForm"
    >
        <div class="form-modal d-flex flex-column">
            <div class="form-modal__body d-flex flex-column gap-12">
                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Mã bằng cấp</div>
                    <ms-input
                        v-model="degree.degreeCode"
                        :width="430"
                        :error="errors.degreeCode"
                        :ref="(el) => (inputRefs.degreeCode = el)"
                        @blurInput="handleBlur('degreeCode')"
                    />
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Tên bằng cấp</div>
                    <ms-input
                        v-model="degree.degreeName"
                        :width="430"
                        :error="errors.degreeName"
                        :ref="(el) => (inputRefs.degreeName = el)"
                        @blurInput="handleBlur('degreeName')"
                    />
                </div>

                <div class="form-row d-flex justify-content-between align-items-start">
                    <div class="form-label">Mô tả</div>
                    <div class="form-textarea w-430">
                        <ms-textarea v-model="degree.description" />
                    </div>
                </div>
            </div>

            <div class="form-modal__footer d-flex justify-content-end gap-12">
                <ms-button @click="handleSubmit">Lưu</ms-button>
                <ms-button :type="'outline'" @click="handleCloseForm">Hủy</ms-button>
            </div>
        </div>
    </Modal>
</template>

<style scoped>
.form-modal {
    width: 100%;
}

.form-modal__footer {
    padding: 16px 20px;
}

.form-modal__body {
    padding: 0 20px 16px;
}

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
