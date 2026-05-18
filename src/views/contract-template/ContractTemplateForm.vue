<script setup>
import { defineModel, defineProps, defineEmits, ref, watch, onMounted } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsRadioButton from "@/components/ms-radio-button/MsRadioButton.vue";
import { Modal, Select } from "ant-design-vue";
import MsInputNumber from "@/components/ms-input-number/MsInputNumber.vue";
import { createContractTemplate } from "@/common/model/contractTemplateModel";
import { getCurrentUserGuid } from "@/utils/currentUser";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import { useFormValidation } from "@/composables/useFormValidation";
import allowancesAPI from "@/apis/components/allowances/allowancesAPI";

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

const fieldOrder = ["templateCode", "templateName", "contractType"];

initValidation(validateField, fieldOrder);

const contractTypeOptions = [
    { value: "Thử việc", label: "Thử việc" },
    { value: "Có thời hạn", label: "Có thời hạn" },
    { value: "Không thời hạn", label: "Không thời hạn" },
];

const allowanceOptions = ref([]);

onMounted(async () => {
    try {
        const res = await allowancesAPI.getAll();
        const data = res.data?.data || res.data || [];
        allowanceOptions.value = data.map((item) => {
            let label = item.allowanceName;
            if (item.calculationType === "PERCENT") {
                label += ` - ${item.percent}% Lương cơ bản`;
            } else {
                label += ` - ${new Intl.NumberFormat("vi-VN").format(item.amount)}đ`;
            }
            return {
                label: label,
                value: item.allowanceId,
            };
        });
    } catch (error) {
        console.error("Failed to fetch allowances", error);
    }
});

watch(
    () => isFormOpen.value,
    (open) => {
        if (!open) return;

        resetErrors();

        if (props.typeForm === "edit" && props.data) {
            let parsedIds = [];
            if (
                props.data.defaultAllowanceIds &&
                typeof props.data.defaultAllowanceIds === "string"
            ) {
                try {
                    parsedIds = JSON.parse(props.data.defaultAllowanceIds);
                } catch (e) {
                    parsedIds = [];
                }
            } else if (Array.isArray(props.data.defaultAllowanceIds)) {
                parsedIds = props.data.defaultAllowanceIds;
            }

            form.value = {
                ...createContractTemplate(),
                ...props.data,
                defaultAllowanceIds: parsedIds,
            };
            return;
        }

        form.value = createContractTemplate();
    },
);

const filterAllowanceOption = (input, option) => {
    return option.label.toLowerCase().includes(input.toLowerCase());
};

function validateField(field) {
    switch (field) {
        case "templateCode":
            errors.value.templateCode = form.value.templateCode?.trim()
                ? ""
                : "Mã mẫu hợp đồng không được để trống";
            break;
        case "templateName":
            errors.value.templateName = form.value.templateName?.trim()
                ? ""
                : "Tên mẫu hợp đồng không được để trống";
            break;
        case "contractType":
            errors.value.contractType = form.value.contractType
                ? ""
                : "Loại hợp đồng không được để trống";
            break;
    }
}

function handleCloseForm() {
    isFormOpen.value = false;
    form.value = createContractTemplate();
}

function buildPayload() {
    const currentUser = getCurrentUserGuid();
    const isEdit = props.typeForm === "edit";
    const now = new Date().toISOString();

    const payload = {
        ...form.value,
        templateCode: form.value.templateCode?.trim() || "",
        templateName: form.value.templateName?.trim() || "",
        content: form.value.content || "",
        version: Number(form.value.version || 1),
        isActive: !!form.value.isActive,
        defaultAllowanceIds: JSON.stringify(form.value.defaultAllowanceIds || []),
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

async function handleSubmit() {
    if (!validateForm()) {
        await focusFirstInvalidInput();
        return;
    }
    emit("submit", buildPayload());
}
</script>

<template>
    <ms-alert v-model="showConfirm" title="Cảnh báo" @close="modelClose">
        {{ errorMessage }}
    </ms-alert>

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
                        :ref="(el) => (inputRefs.templateCode = el)"
                        @blurInput="handleBlur('templateCode')"
                    />
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Tên mẫu</div>
                    <ms-input
                        v-model="form.templateName"
                        :width="420"
                        :error="errors.templateName"
                        :ref="(el) => (inputRefs.templateName = el)"
                        @blurInput="handleBlur('templateName')"
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
                            :ref="(el) => (inputRefs.contractType = el)"
                            :error="errors.contractType"
                            @blurInput="handleBlur('contractType')"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label">Phụ cấp mặc định</div>
                    <div class="w-420">
                        <Select
                            v-model:value="form.defaultAllowanceIds"
                            :options="allowanceOptions"
                            mode="multiple"
                            show-search
                            :filter-option="filterAllowanceOption"
                            placeholder="Chọn phụ cấp mặc định"
                            style="width: 100%"
                        ></Select>
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-start">
                    <div class="form-label">Nội dung</div>
                    <div class="w-420 form-textarea">
                        <ms-textarea v-model="form.content" />
                    </div>
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

.ant-control:deep(.ms-input-number) {
    width: 100%;
}

.ant-control:deep(.ms-input-number-input) {
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
