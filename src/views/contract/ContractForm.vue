<script setup>
import { computed, defineEmits, defineModel, defineProps, ref, watch } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsRadioButton from "@/components/ms-radio-button/MsRadioButton.vue";
import { DatePicker, InputNumber } from "ant-design-vue";
import { createContract } from "@/common/model/contractModel";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";
import ContractTemplatesAPI from "@/apis/components/contract-templates/contractTemplatesAPI";

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

const currentUser = "b8373a59-3be2-11f1-97ac-d0c5d346d1a4";

const form = ref(createContract());
const templateOptions = ref([]);
const employeeOptions = ref([]);

const errors = ref({
    contractCode: "",
    templateId: "",
    companyRepresentativeId: "",
    companySignerTitle: "",
    employeeId: "",
    effectiveDate: "",
    baseSalary: "",
    insuranceSalary: "",
    salaryRatio: "",
});

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
    const [employeeRes, templateRes] = await Promise.all([
        EmployeesAPI.getAll(),
        ContractTemplatesAPI.getAll(),
    ]);

    const employees = employeeRes?.data?.data || [];
    const templates = templateRes?.data?.data || [];

    employeeOptions.value = employees.map((item) => ({
        value: item.employeeId,
        label: `${item.employeeCode || ""} - ${item.fullName || ""}`.trim(),
    }));

    templateOptions.value = templates
        .filter((item) => item.isActive !== false)
        .map((item) => ({
            value: item.templateId,
            label: `${item.templateCode || ""} - ${item.templateName || ""}`.trim(),
            contractType: item.contractType,
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
    () => isFormOpen.value,
    async (open) => {
        if (!open) return;

        errors.value = {
            contractCode: "",
            templateId: "",
            companyRepresentativeId: "",
            companySignerTitle: "",
            employeeId: "",
            effectiveDate: "",
            baseSalary: "",
            insuranceSalary: "",
            salaryRatio: "",
        };

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
        };
    },
);

function handleCloseForm() {
    isFormOpen.value = false;
    form.value = createContract();
}

function validateForm() {
    const nextErrors = {
        contractCode: "",
        templateId: "",
        companyRepresentativeId: "",
        companySignerTitle: "",
        employeeId: "",
        effectiveDate: "",
        baseSalary: "",
        insuranceSalary: "",
        salaryRatio: "",
    };

    if (!form.value.contractCode?.trim())
        nextErrors.contractCode = "Mã hợp đồng không được để trống";
    if (!form.value.templateId) nextErrors.templateId = "Mẫu hợp đồng không được để trống";
    if (!form.value.employeeId) nextErrors.employeeId = "Nhân viên không được để trống";
    if (!form.value.companyRepresentativeId) {
        nextErrors.companyRepresentativeId = "Đại diện công ty không được để trống";
    }
    if (!form.value.companySignerTitle?.trim()) {
        nextErrors.companySignerTitle = "Chức danh người ký không được để trống";
    }
    if (!form.value.effectiveDate) nextErrors.effectiveDate = "Ngày hiệu lực không được để trống";

    if (!form.value.baseSalary || Number(form.value.baseSalary) <= 0) {
        nextErrors.baseSalary = "Lương cơ bản phải lớn hơn 0";
    }

    if (!form.value.insuranceSalary || Number(form.value.insuranceSalary) <= 0) {
        nextErrors.insuranceSalary = "Lương đóng BH phải lớn hơn 0";
    }

    if (!form.value.salaryRatio || Number(form.value.salaryRatio) <= 0) {
        nextErrors.salaryRatio = "Tỷ lệ lương phải lớn hơn 0";
    }

    if (
        form.value.employeeId &&
        form.value.companyRepresentativeId &&
        form.value.employeeId === form.value.companyRepresentativeId
    ) {
        nextErrors.companyRepresentativeId = "Đại diện công ty không được trùng nhân viên";
    }

    errors.value = nextErrors;
    return !Object.values(nextErrors).some(Boolean);
}

function buildPayload() {
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

function handleSubmit() {
    if (!validateForm()) return;
    emit("submit", buildPayload());
}
</script>

<template>
    <div v-if="isFormOpen" class="form-modal">
        <div class="form-modal__overlay"></div>

        <div class="form-modal__content d-flex flex-column">
            <div class="form-modal__header d-flex align-items-center justify-content-between">
                <div class="form-modal__title">
                    {{ props.typeForm === "edit" ? "Sửa hợp đồng" : "Thêm hợp đồng" }}
                </div>
                <div class="form-modal__close pointer" @click="handleCloseForm">×</div>
            </div>

            <div class="form-modal__body d-flex flex-column gap-12">
                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Mã hợp đồng</div>
                    <ms-input
                        v-model="form.contractCode"
                        :width="430"
                        :error="errors.contractCode"
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
                        />
                        <div v-if="errors.templateId" class="form-error">
                            {{ errors.templateId }}
                        </div>
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
                        />
                        <div v-if="errors.employeeId" class="form-error">
                            {{ errors.employeeId }}
                        </div>
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Đại diện công ty</div>
                    <div class="w-430">
                        <ms-select
                            v-model="form.companyRepresentativeId"
                            :options="employeeFilterOptions"
                            placeholder="Chọn đại diện công ty"
                            :max-height="260"
                        />
                        <div v-if="errors.companyRepresentativeId" class="form-error">
                            {{ errors.companyRepresentativeId }}
                        </div>
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Chức danh người ký</div>
                    <ms-input
                        v-model="form.companySignerTitle"
                        :width="430"
                        :error="errors.companySignerTitle"
                    />
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Ngày hiệu lực</div>
                    <div class="w-430">
                        <date-picker
                            v-model:value="form.effectiveDate"
                            value-format="YYYY-MM-DD"
                            format="DD/MM/YYYY"
                            class="ant-control"
                        />
                        <div v-if="errors.effectiveDate" class="form-error">
                            {{ errors.effectiveDate }}
                        </div>
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label">Thời hạn (tháng)</div>
                    <div class="w-430">
                        <input-number
                            v-model:value="form.termMonths"
                            :min="0"
                            class="ant-control"
                        />
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Lương cơ bản</div>
                    <div class="w-430">
                        <input-number
                            v-model:value="form.baseSalary"
                            :min="0"
                            class="ant-control"
                        />
                        <div v-if="errors.baseSalary" class="form-error">
                            {{ errors.baseSalary }}
                        </div>
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Lương đóng BH</div>
                    <div class="w-430">
                        <input-number
                            v-model:value="form.insuranceSalary"
                            :min="0"
                            class="ant-control"
                        />
                        <div v-if="errors.insuranceSalary" class="form-error">
                            {{ errors.insuranceSalary }}
                        </div>
                    </div>
                </div>

                <div class="form-row d-flex justify-content-between align-items-center">
                    <div class="form-label form-label--required">Tỷ lệ lương</div>
                    <div class="w-430">
                        <input-number
                            v-model:value="form.salaryRatio"
                            :min="0"
                            class="ant-control"
                        />
                        <div v-if="errors.salaryRatio" class="form-error">
                            {{ errors.salaryRatio }}
                        </div>
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
                        <date-picker
                            v-model:value="form.signedAt"
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
    </div>
</template>

<style scoped>
.form-modal__overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.45);
    z-index: 20;
}

.form-modal__content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 700px;
    max-height: 92vh;
    background: #fff;
    border-radius: 4px;
    z-index: 21;
}

.form-modal__header,
.form-modal__footer {
    padding: 16px 20px;
}

.form-modal__title {
    font-size: 22px;
    font-weight: 700;
}

.form-modal__close {
    font-size: 24px;
    line-height: 1;
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

.ant-control:deep(.ant-input-number) {
    width: 100%;
}

.ant-control:deep(.ant-input-number-input) {
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
