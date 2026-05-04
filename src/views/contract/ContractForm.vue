<script setup>
import { computed, defineEmits, defineModel, defineProps, ref, watch } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsRadioButton from "@/components/ms-radio-button/MsRadioButton.vue";
import { Modal } from "ant-design-vue";
import MsDatePicker from "@/components/ms-date-picker/MsDatePicker.vue";
import MsInputNumber from "@/components/ms-input-number/MsInputNumber.vue";
import { createContract } from "@/common/model/contractModel";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";
import ContractTemplatesAPI from "@/apis/components/contract-templates/contractTemplatesAPI";
import ShiftsAPI from "@/apis/components/shifts/shiftsAPI";
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

const form = ref(createContract());
const templateOptions = ref([]);
const employeeOptions = ref([]);
const representativeOptions = ref([]);
const shiftOptions = ref([]);

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

const fieldOrder = [
    "contractCode",
    "templateId",
    "employeeId",
    "companyRepresentativeId",
    "companySignerTitle",
    "effectiveDate",
    "baseSalary",
    "insuranceSalary",
    "salaryRatio",
];

initValidation(validateField, fieldOrder);

const employeeFilterOptions = computed(() => employeeOptions.value);

const termTypeOptions = [
    { value: "Thử việc", label: "Thử việc" },
    { value: "Có thời hạn", label: "Có thời hạn" },
    { value: "Không thời hạn", label: "Không thời hạn" },
];

function toDateInputValue(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

async function loadSelectData() {
    const [employeeRes, templateRes, shiftRes, repRes] = await Promise.all([
        EmployeesAPI.getAll(),
        ContractTemplatesAPI.getAll(),
        ShiftsAPI.getAll(),
        EmployeesAPI.getRepresentatives(),
    ]);

    const employees = employeeRes?.data?.data || [];
    const templates = templateRes?.data?.data || [];
    const shifts = shiftRes?.data?.data || [];

    employeeOptions.value = employees.map((item) => ({
        value: item.employeeId,
        label: `${item.employeeCode || ""} - ${item.fullName || ""}`.trim(),
        positionName: item.positionName,
        departmentCode: item.departmentCode,
    }));

    templateOptions.value = templates
        .filter((item) => item.isActive !== false)
        .map((item) => ({
            value: item.templateId,
            label: `${item.templateCode || ""} - ${item.templateName || ""}`.trim(),
            contractType: item.contractType,
        }));

    shiftOptions.value = shifts.map((item) => ({
        value: item.shiftId,
        label: `${item.shiftName} (${item.startTime?.substring(0, 5)} - ${item.endTime?.substring(0, 5)})`,
    }));

    const representatives = repRes?.data?.data || [];
    representativeOptions.value = representatives.map((item) => ({
        value: item.employeeId,
        label: `${item.employeeCode || ""} - ${item.fullName || ""}`.trim(),
        positionName: item.positionName,
    }));
}

watch(
    () => form.value.templateId,
    (templateId) => {
        const selected = templateOptions.value.find((item) => item.value === templateId);
        if (selected) {
            form.value.contractType = selected.contractType;
        }
    },
);

watch(
    () => form.value.companyRepresentativeId,
    (repId) => {
        const selected = representativeOptions.value.find((item) => item.value === repId);
        if (selected && selected.positionName) {
            form.value.companySignerTitle = selected.positionName;
        }
    },
);

watch(
    () => isFormOpen.value,
    async (open) => {
        if (!open) return;

        resetErrors();

        await loadSelectData();

        if (props.typeForm === "edit" && props.data) {
            form.value = {
                ...createContract(),
                ...props.data,
                effectiveDate: toDateInputValue(props.data.effectiveDate),
                signedAt: toDateInputValue(props.data.signedAt),
            };
            return;
        }

        form.value = {
            ...createContract(),
            salaryRatio: 100,
            isSigned: false,
            employeeId: props.data?.employeeId || null,
        };
    },
);

function handleCloseForm() {
    isFormOpen.value = false;
    form.value = createContract();
}

function validateField(field) {
    switch (field) {
        case "contractCode":
            errors.value.contractCode = form.value.contractCode?.trim()
                ? ""
                : "Mã hợp đồng không được để trống";
            break;
        case "templateId":
            errors.value.templateId = form.value.templateId
                ? ""
                : "Mẫu hợp đồng không được để trống";
            break;
        case "employeeId":
            errors.value.employeeId = form.value.employeeId ? "" : "Nhân viên không được để trống";
            if (
                form.value.employeeId &&
                form.value.companyRepresentativeId &&
                form.value.employeeId === form.value.companyRepresentativeId
            ) {
                errors.value.companyRepresentativeId =
                    "Đại diện công ty không được trùng nhân viên";
            }
            break;
        case "companyRepresentativeId":
            errors.value.companyRepresentativeId = form.value.companyRepresentativeId
                ? ""
                : "Đại diện công ty không được để trống";
            if (
                form.value.employeeId &&
                form.value.companyRepresentativeId &&
                form.value.employeeId === form.value.companyRepresentativeId
            ) {
                errors.value.companyRepresentativeId =
                    "Đại diện công ty không được trùng nhân viên";
            }
            break;
        case "companySignerTitle":
            errors.value.companySignerTitle = form.value.companySignerTitle?.trim()
                ? ""
                : "Chức danh người ký không được để trống";
            break;
        case "effectiveDate":
            errors.value.effectiveDate = form.value.effectiveDate
                ? ""
                : "Ngày hiệu lực không được để trống";
            break;
        case "baseSalary":
            errors.value.baseSalary =
                form.value.baseSalary && Number(form.value.baseSalary) > 0
                    ? ""
                    : "Lương cơ bản phải lớn hơn 0";
            break;
        case "insuranceSalary":
            errors.value.insuranceSalary =
                form.value.insuranceSalary && Number(form.value.insuranceSalary) > 0
                    ? ""
                    : "Lương đóng BH phải lớn hơn 0";
            break;
        case "salaryRatio":
            errors.value.salaryRatio =
                form.value.salaryRatio && Number(form.value.salaryRatio) > 0
                    ? ""
                    : "Tỷ lệ lương phải lớn hơn 0";
            break;
    }
}

function buildPayload() {
    const currentUser = getCurrentUserGuid();
    const isEdit = props.typeForm === "edit";
    const now = new Date().toISOString();

    const payload = {
        ...form.value,
        contractCode: form.value.contractCode?.trim() || "",
        companySignerTitle: form.value.companySignerTitle?.trim() || "",
        summary: form.value.summary || "",
        attachmentLink: form.value.attachmentLink || "",
        effectiveDate: form.value.effectiveDate || null,
        termMonths: form.value.termMonths ? Number(form.value.termMonths) : null,
        baseSalary: Number(form.value.baseSalary || 0),
        insuranceSalary: Number(form.value.insuranceSalary || 0),
        salaryRatio: Number(form.value.salaryRatio || 0),
        isSigned: !!form.value.isSigned,
        signedAt: form.value.isSigned ? form.value.signedAt || null : null,
    };

    if (!isEdit) {
        delete payload.contractId;
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
        :title="props.typeForm === 'edit' ? 'Sửa hợp đồng' : 'Thêm hợp đồng'"
        width="860px"
        centered
        :footer="null"
        :mask-closable="false"
        :destroy-on-close="true"
        @cancel="handleCloseForm"
    >
        <div class="form-modal d-flex flex-column">
            <div class="form-modal__body d-flex flex-column gap-12">
                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Mã hợp đồng</div>
                    <ms-input
                        v-model="form.contractCode"
                        :width="430"
                        :error="errors.contractCode"
                        :ref="(el) => (inputRefs.contractCode = el)"
                        @blurInput="handleBlur('contractCode')"
                    />
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Mẫu hợp đồng</div>
                    <div class="w-430">
                        <ms-select
                            v-model="form.templateId"
                            :options="templateOptions"
                            placeholder="Chọn mẫu hợp đồng"
                            :max-height="220"
                            :ref="(el) => (inputRefs.templateId = el)"
                            :error="errors.templateId"
                            @blurInput="handleBlur('templateId')"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label">Loại hợp đồng</div>
                    <div class="w-430">
                        <ms-select
                            v-model="form.contractType"
                            :options="termTypeOptions"
                            placeholder="Loại hợp đồng"
                            :max-height="180"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Nhân viên</div>
                    <div class="w-430">
                        <ms-select
                            v-model="form.employeeId"
                            :options="employeeFilterOptions"
                            placeholder="Chọn nhân viên"
                            :max-height="260"
                            :ref="(el) => (inputRefs.employeeId = el)"
                            :error="errors.employeeId"
                            @blurInput="handleBlur('employeeId')"
                            :disabled="!!props.data?.employeeId"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Đại diện công ty</div>
                    <div class="w-430">
                        <ms-select
                            v-model="form.companyRepresentativeId"
                            :options="representativeOptions"
                            placeholder="Chọn đại diện công ty"
                            :max-height="260"
                            :ref="(el) => (inputRefs.companyRepresentativeId = el)"
                            :error="errors.companyRepresentativeId"
                            @blurInput="handleBlur('companyRepresentativeId')"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Chức danh người ký</div>
                    <ms-input
                        v-model="form.companySignerTitle"
                        :width="430"
                        :error="errors.companySignerTitle"
                        :ref="(el) => (inputRefs.companySignerTitle = el)"
                        @blurInput="handleBlur('companySignerTitle')"
                        disabled
                    />
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Ngày hiệu lực</div>
                    <div class="w-430">
                        <ms-date-picker
                            v-model="form.effectiveDate"
                            value-format="YYYY-MM-DD"
                            format="DD/MM/YYYY"
                            class="ant-control"
                            :ref="(el) => (inputRefs.effectiveDate = el)"
                            :error="errors.effectiveDate"
                            @blurInput="handleBlur('effectiveDate')"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label">Thời hạn (tháng)</div>
                    <div class="w-430">
                        <ms-input-number
                            v-model:value="form.termMonths"
                            :min="0"
                            class="ant-control"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label">Ca làm việc</div>
                    <div class="w-430">
                        <ms-select
                            v-model="form.shiftId"
                            :options="shiftOptions"
                            placeholder="Chọn ca làm việc"
                            :max-height="200"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Lương cơ bản</div>
                    <div class="w-430">
                        <ms-input-number
                            v-model:value="form.baseSalary"
                            :min="0"
                            class="ant-control"
                            :ref="(el) => (inputRefs.baseSalary = el)"
                            :error="errors.baseSalary"
                            @blur="handleBlur('baseSalary')"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Lương đóng BH</div>
                    <div class="w-430">
                        <ms-input-number
                            v-model:value="form.insuranceSalary"
                            :min="0"
                            class="ant-control"
                            :ref="(el) => (inputRefs.insuranceSalary = el)"
                            :error="errors.insuranceSalary"
                            @blur="handleBlur('insuranceSalary')"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Tỷ lệ lương</div>
                    <div class="w-430">
                        <ms-input-number
                            v-model:value="form.salaryRatio"
                            :min="0"
                            class="ant-control"
                            :ref="(el) => (inputRefs.salaryRatio = el)"
                            :error="errors.salaryRatio"
                            @blur="handleBlur('salaryRatio')"
                        />
                    </div>
                </div>

                <div class="form-row d-flex align-items-center">
                    <div class="form-label">Trạng thái ký</div>
                    <ms-radio-button v-model="form.isSigned" :value="true" name="is-signed"
                        >Đã ký</ms-radio-button
                    >
                    <ms-radio-button v-model="form.isSigned" :value="false" name="is-signed"
                        >Chưa ký</ms-radio-button
                    >
                </div>

                <div
                    v-if="form.isSigned"
                    class="form-row d-flex justify-content-between align-items-center"
                >
                    <div class="form-label">Ngày ký</div>
                    <div class="w-430">
                        <ms-date-picker
                            v-model="form.signedAt"
                            value-format="YYYY-MM-DD"
                            format="DD/MM/YYYY"
                            class="ant-control"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-start">
                    <div class="form-label">Trích yếu</div>
                    <div class="w-430 form-textarea">
                        <ms-textarea v-model="form.summary" />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label">Link đính kèm</div>
                    <ms-input v-model="form.attachmentLink" :width="430" />
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

.ant-control {
    width: 100%;
}

.ant-control:deep(.ms-input-number) {
    width: 100%;
}

.ant-control:deep(.ms-input-number-input) {
    height: 27px;
}

.ant-control:deep(.ant-picker) {
    width: 100%;
    height: 27px;
}

.form-error {
    margin-top: 4px;
    color: #ff4d4f;
    font-size: 12px;
}

.gap-12 {
    gap: 12px;
}

.form-textarea :deep(textarea) {
    width: 100%;
}
</style>
