<script setup>
import { defineModel, defineProps, defineEmits, ref, watch } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsRadioButton from "@/components/ms-radio-button/MsRadioButton.vue";
import { InputNumber, Modal } from "ant-design-vue";
import { createContractTemplate } from "@/common/model/contractTemplateModel";

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

const form = ref(createContractTemplate());
const errors = ref({
    templateCode: "",
    templateName: "",
    contractType: "",
});

const currentUser = "b8373a59-3be2-11f1-97ac-d0c5d346d1a4";

const contractTypeOptions = [
    { value: "Thử việc", label: "Thử việc" },
    { value: "Có thời hạn", label: "Có thời hạn" },
    { value: "Không thời hạn", label: "Không thời hạn" },
];

watch(
    () => isFormOpen.value,
    (open) => {
        if (!open) return;

        errors.value = {
            templateCode: "",
            templateName: "",
            contractType: "",
        };

        if (props.typeForm === "edit" && props.data) {
            form.value = {
                ...createContractTemplate(),
                ...props.data,
            };
            return;
        }

        form.value = createContractTemplate();
    },
);

function validateForm() {
    const nextErrors = {
        templateCode: "",
        templateName: "",
        contractType: "",
    };

    if (!form.value.templateCode?.trim()) {
        nextErrors.templateCode = "Mã mẫu hợp đồng không được để trống";
    }

    if (!form.value.templateName?.trim()) {
        nextErrors.templateName = "Tên mẫu hợp đồng không được để trống";
    }

    if (!form.value.contractType) {
        nextErrors.contractType = "Loại hợp đồng không được để trống";
    }

    errors.value = nextErrors;
    return !Object.values(nextErrors).some(Boolean);
}

function handleCloseForm() {
    isFormOpen.value = false;
    form.value = createContractTemplate();
}

function buildPayload() {
    const isEdit = props.typeForm === "edit";
    const now = new Date().toISOString();

    const payload = {
        ...form.value,
        templateCode: form.value.templateCode?.trim() || "",
        templateName: form.value.templateName?.trim() || "",
        content: form.value.content || "",
        version: Number(form.value.version || 1),
        isActive: !!form.value.isActive,
    };

    if (!isEdit) {
        delete payload.templateId;
        return {
            ...payload,
            createdBy: currentUser,
            createdAt: now,
            updatedBy: currentUser,
            updatedAt: now,
        };
    }

    return {
        ...payload,
        updatedBy: currentUser,
        updatedAt: now,
    };
}

function handleSubmit() {
    if (!validateForm()) return;
    emit("submit", buildPayload());
}
</script>

<template>
    <Modal
        v-model:open="isFormOpen"
        :title="props.typeForm === 'edit' ? 'Sửa mẫu hợp đồng' : 'Thêm mẫu hợp đồng'"
        width="640px"
        centered
        :footer="null"
        :mask-closable="false"
        :destroy-on-close="true"
        @cancel="handleCloseForm"
    >
        <div class="form-modal d-flex flex-column">
            <div class="form-modal__body d-flex flex-column gap-16">
                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Mã mẫu</div>
                    <ms-input
                        v-model="form.templateCode"
                        :width="420"
                        :error="errors.templateCode"
                    />
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Tên mẫu</div>
                    <ms-input
                        v-model="form.templateName"
                        :width="420"
                        :error="errors.templateName"
                    />
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Loại hợp đồng</div>
                    <div class="form-field w-420">
                        <ms-select
                            v-model="form.contractType"
                            :options="contractTypeOptions"
                            placeholder="Chọn loại hợp đồng"
                            :max-height="180"
                        />
                        <div v-if="errors.contractType" class="form-error">
                            {{ errors.contractType }}
                        </div>
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label">Phiên bản</div>
                    <input-number v-model:value="form.version" :min="1" class="ant-control" />
                </div>

                <div class="form-row d-flex align-items-center">
                    <div class="form-label">Trạng thái</div>
                    <ms-radio-button v-model="form.isActive" :value="true" name="template-status"
                        >Đang sử dụng</ms-radio-button
                    >
                    <ms-radio-button v-model="form.isActive" :value="false" name="template-status"
                        >Ngừng sử dụng</ms-radio-button
                    >
                </div>

                <div class="form-row d-flex justify-content-between align-items-start">
                    <div class="form-label">Nội dung</div>
                    <div class="w-420 form-textarea">
                        <ms-textarea v-model="form.content" />
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
    overflow-y: auto;
}

.form-row {
    gap: 16px;
}

.form-label {
    width: 160px;
}

.form-label--required::after {
    content: " *";
    color: #ff4d4f;
}

.w-420 {
    width: 420px;
}

.ant-control {
    width: 420px;
}

.ant-control:deep(.ant-input-number) {
    width: 100%;
}

.ant-control:deep(.ant-input-number-input) {
    height: 27px;
}

.form-textarea :deep(textarea) {
    width: 100%;
}

.form-error {
    margin-top: 4px;
    color: #ff4d4f;
    font-size: 12px;
}

.gap-12 {
    gap: 12px;
}

.gap-16 {
    gap: 16px;
}
</style>
