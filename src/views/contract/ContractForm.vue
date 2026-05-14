<script setup>
import { computed, defineEmits, defineModel, defineProps, ref, watch } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsRadioButton from "@/components/ms-radio-button/MsRadioButton.vue";
import { Modal as AModal, Upload as AUpload, Button as AButton, Tag as ATag, Select as ASelect, Tabs as ATabs, TabPane as ATabPane } from "ant-design-vue";
import { PaperClipOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons-vue";
import MsDatePicker from "@/components/ms-date-picker/MsDatePicker.vue";
import MsInputNumber from "@/components/ms-input-number/MsInputNumber.vue";
import { createContract } from "@/common/model/contractModel";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";
import ContractTemplatesAPI from "@/apis/components/contract-templates/contractTemplatesAPI";
import ShiftsAPI from "@/apis/components/shifts/shiftsAPI";
import AllowancesAPI from "@/apis/components/allowances/allowancesAPI";
import ContractsAPI from "@/apis/components/contracts/contractsAPI";
import { getCurrentUserGuid } from "@/utils/currentUser";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import { useFormValidation } from "@/composables/useFormValidation";
import FilesAPI from "@/apis/components/files/filesAPI";
import { $toastError, $toastSuccess } from "@/utils/toastService";

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
const allowanceOptions = ref([]);

const attachmentFile = ref(null);
const isUploading = ref(false);
const pendingNewId = ref(null); // UUID sinh sẵn cho thêm mới

// File list hiển thị trong a-upload
const fileList = ref([]);

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

const activeTab = ref("1");

const handleFocusField = (field) => {
    const tab1Fields = ["contractCode", "employeeId", "templateId", "effectiveDate", "termMonths", "shiftId", "summary"];
    const tab2Fields = ["baseSalary", "insuranceSalary", "salaryRatio", "allowanceIds"];
    const tab3Fields = ["companyRepresentativeId", "companySignerTitle", "isSigned", "signedAt", "attachmentLink"];

    if (tab1Fields.includes(field)) {
        activeTab.value = "1";
    } else if (tab2Fields.includes(field)) {
        activeTab.value = "2";
    } else if (tab3Fields.includes(field)) {
        activeTab.value = "3";
    }
};

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

initValidation(validateField, fieldOrder, handleFocusField);

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
    const [employeeRes, templateRes, shiftRes, repRes, allowanceRes] = await Promise.all([
        EmployeesAPI.getAll(),
        ContractTemplatesAPI.getAll(),
        ShiftsAPI.getAll(),
        EmployeesAPI.getRepresentatives(),
        AllowancesAPI.getAll(),
    ]);

    const employees = employeeRes?.data?.data || [];
    const templates = templateRes?.data?.data || [];
    const shifts = shiftRes?.data?.data || [];
    const allowances = allowanceRes?.data?.data || [];

    allowanceOptions.value = allowances.map((item) => ({
        value: item.allowanceId,
        label: `${item.allowanceName} (${item.calculationType === 'FIXED' ? (item.amount?.toLocaleString() + 'đ') : (item.percent + '%')})`,
    }));

    templateOptions.value = templates.map((item) => ({
        value: item.templateId,
        label: `${item.templateCode} - ${item.templateName}`,
        contractType: item.contractType,
    }));

    employeeOptions.value = employees.map((item) => ({
        value: item.employeeId,
        label: `${item.employeeCode || ""} - ${item.fullName || ""}`.trim(),
        positionName: item.positionName,
        departmentCode: item.departmentCode,
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
    async (templateId) => {
        const selected = templateOptions.value.find((item) => item.value === templateId);
        if (selected) {
            form.value.contractType = selected.contractType;
            
            // Lấy thông tin chi tiết mẫu để có default allowances
            try {
                const resp = await ContractTemplatesAPI.getById(templateId);
                const detail = resp.data?.data || resp.data;
                if (detail && detail.defaultAllowanceIds) {
                    try {
                        const ids = JSON.parse(detail.defaultAllowanceIds);
                        if (Array.isArray(ids)) {
                            form.value.allowanceIds = ids;
                        }
                    } catch (e) {
                        // Nếu không phải JSON, có thể là string phân tách bằng dấu phẩy
                        if (typeof detail.defaultAllowanceIds === 'string') {
                            form.value.allowanceIds = detail.defaultAllowanceIds.split(',').filter(x => x);
                        }
                    }
                }
            } catch (e) {
                console.error("Lỗi lấy chi tiết mẫu hợp đồng:", e);
            }
        }
    },
);

// Tự động tính ngày kết thúc
watch(
    [() => form.value.effectiveDate, () => form.value.termMonths],
    ([effDate, months]) => {
        if (!effDate || !months || months <= 0) {
            form.value.endDate = null;
            return;
        }
        
        try {
            const date = new Date(effDate);
            date.setMonth(date.getMonth() + parseInt(months));
            form.value.endDate = date.toISOString().split('T')[0];
        } catch (e) {
            form.value.endDate = null;
        }
    }
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

        activeTab.value = "1";
        resetErrors();

        await loadSelectData();

        if (props.typeForm === "edit" && props.data) {
            pendingNewId.value = null;
            form.value = {
                ...createContract(),
                ...props.data,
                effectiveDate: toDateInputValue(props.data.effectiveDate),
                signedAt: toDateInputValue(props.data.signedAt),
                endDate: toDateInputValue(props.data.endDate),
            };
            
            // Load danh sách phụ cấp của hợp đồng hiện tại
            try {
                const resp = await ContractsAPI.getAllowances(props.data.contractId);
                const allowances = resp.data?.data || [];
                form.value.allowanceIds = allowances.map(a => a.allowanceId);
            } catch (e) {
                console.error("Lỗi tải phụ cấp:", e);
            }
            return;
        }

        // Thêm mới: sinh sẵn UUID
        pendingNewId.value = crypto.randomUUID();
        form.value = {
            ...createContract(),
            contractId: pendingNewId.value,
            salaryRatio: 100,
            isSigned: false,
            employeeId: props.data?.employeeId || null,
        };
        attachmentFile.value = null;
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

function handleBeforeUpload(file) {
    attachmentFile.value = file;
    fileList.value = [{ uid: file.uid || '-1', name: file.name, status: 'done' }];
    return false; // ngăn upload tự động
}

function removeFile() {
    attachmentFile.value = null;
    fileList.value = [];
    form.value.attachmentLink = "";
}

async function downloadFile() {
    const fileId = form.value.attachmentLink;
    if (!fileId) return;

    // Kiểm tra xem có phải là GUID không
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (guidRegex.test(fileId)) {
        try {
            const resp = await FilesAPI.download(fileId);
            const blob = resp.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = form.value.contractCode + "_dinh_kem";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            $toastError("Không thể tải xuống tệp đính kèm");
        }
    } else {
        window.open(fileId, "_blank");
    }
}

async function handleSubmit() {
    if (!validateForm()) {
        await focusFirstInvalidInput();
        return;
    }

    if (attachmentFile.value) {
        isUploading.value = true;
        try {
            const entityId = form.value.contractId || pendingNewId.value;
            const meta = {
                moduleName: "contract",
                entityName: "contract",
                entityId,
                purpose: "attachment",
            };
            const resp = await FilesAPI.upload(attachmentFile.value, meta);
            const result = resp.data?.data || resp.data;
            if (result && (result.fileId || result.FileId)) {
                form.value.attachmentLink = result.fileId || result.FileId;
            }
        } catch (e) {
            console.error(e);
            $toastError("Lỗi khi tải tệp lên");
            isUploading.value = false;
            return;
        } finally {
            isUploading.value = false;
        }
    }

    emit("submit", buildPayload());
}
</script>

<template>
    <ms-alert v-model="showConfirm" title="Cảnh báo" @close="modelClose">
        {{ errorMessage }}
    </ms-alert>

    <a-modal
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
            <div class="form-modal__body">
                <a-tabs v-model:activeKey="activeTab">
                    <a-tab-pane key="1" tab="Thông tin chung">
                        <div class="tab-content d-flex flex-column gap-12 pt-16">
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
                                <div class="form-label">Ngày kết thúc</div>
                                <div class="w-430">
                                    <ms-date-picker
                                        v-model="form.endDate"
                                        value-format="YYYY-MM-DD"
                                        format="DD/MM/YYYY"
                                        class="ant-control"
                                        disabled
                                        placeholder="Tự động tính theo thời hạn"
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

                            <div class="form-row d-flex justify-content-between align-items-start">
                                <div class="form-label">Trích yếu</div>
                                <div class="w-430 form-textarea">
                                    <ms-textarea v-model="form.summary" placeholder="Tóm tắt nội dung hợp đồng..." />
                                </div>
                            </div>
                        </div>
                    </a-tab-pane>

                    <a-tab-pane key="2" tab="Lương & Phụ cấp">
                        <div class="tab-content d-flex flex-column gap-12 pt-16">
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

                            <div class="form-row d-flex justify-content-between align-items-start">
                                <div class="form-label">Phụ cấp</div>
                                <div class="w-430">
                                    <a-select
                                        v-model:value="form.allowanceIds"
                                        mode="multiple"
                                        placeholder="Chọn các khoản phụ cấp"
                                        style="width: 100%"
                                        :options="allowanceOptions"
                                        :max-tag-count="3"
                                    />
                                </div>
                            </div>
                        </div>
                    </a-tab-pane>

                    <a-tab-pane key="3" tab="Ký kết & Tài liệu">
                        <div class="tab-content d-flex flex-column gap-12 pt-16">
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

                            <div class="form-row d-flex align-items-center justify-content-between">
                                <div class="form-label">Trạng thái ký</div>
                                <div class="w-430 d-flex gap-24">
                                    <ms-radio-button v-model="form.isSigned" :value="true" name="is-signed"
                                    >Đã ký</ms-radio-button
                                >
                                <ms-radio-button v-model="form.isSigned" :value="false" name="is-signed"
                                    >Chưa ký</ms-radio-button
                                >
                                </div>
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
                                <div class="form-label">
                                    Tài liệu đính kèm
                                </div>
                                <div class="w-430">
                                    <a-upload
                                        v-model:file-list="fileList"
                                        :before-upload="handleBeforeUpload"
                                        :on-remove="removeFile"
                                        :max-count="1"
                                        accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
                                        class="contract-upload"
                                    >
                                        <a-button v-if="!attachmentFile && !form.attachmentLink">
                                            <upload-outlined />
                                            Chọn tệp đính kèm
                                        </a-button>
                                        <div v-else-if="form.attachmentLink && !attachmentFile" class="existing-file-tag">
                                            <paper-clip-outlined style="color: #1677ff; margin-right: 4px" />
                                            <span
                                                class="file-name clickable-link"
                                                :title="'Nhấn để xem: ' + form.attachmentLink"
                                                @click="downloadFile"
                                            >
                                                Tệp đính kèm cũ
                                            </span>
                                            <delete-outlined class="remove-icon" @click.stop="removeFile" />
                                        </div>
                                    </a-upload>
                                </div>
                            </div>
                        </div>
                    </a-tab-pane>
                </a-tabs>
            </div>

            <div class="form-modal__footer d-flex justify-content-end gap-12">
                <ms-button @click="handleSubmit">Lưu</ms-button>
                <ms-button :type="'outline'" @click="handleCloseForm">Hủy</ms-button>
            </div>
        </div>
    </a-modal>
</template>

<style scoped>
.form-modal {
    width: 100%;
}

.form-modal__footer {
    padding: 16px 20px;
}

.form-modal__body {
    padding: 0 20px;
}

.tab-content {
    height: 450px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 4px;
}

.pt-16 {
    padding-top: 16px;
}

.gap-24 {
    gap: 24px;
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

/* ── Attachment Upload ── */
.contract-upload {
    width: 100%;
}

.contract-upload :deep(.ant-upload) {
    width: 100%;
}

.contract-upload :deep(.ant-btn) {
    width: 100%;
    height: 32px;
    border-style: dashed;
    color: #555;
    justify-content: center;
    gap: 6px;
}

.contract-upload :deep(.ant-btn):hover {
    color: #1677ff;
    border-color: #1677ff;
}

/* File item hiển thị trong upload list */
.contract-upload :deep(.ant-upload-list-item) {
    margin-top: 6px;
    border-radius: 6px;
    background: #f0f7ff;
    border: 1px solid #bae0ff;
    padding: 4px 10px;
}

.contract-upload :deep(.ant-upload-list-item-name) {
    color: #1677ff;
    font-size: 13px;
}

.contract-upload :deep(.ant-upload-list-item-actions .anticon) {
    color: #ff4d4f;
}

/* Hiển thị khi đã có file cũ từ server */
.existing-file-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 6px;
    background: #f0f7ff;
    border: 1px solid #bae0ff;
    font-size: 13px;
    color: #1677ff;
    cursor: default;
}

.existing-file-tag .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 320px;
}

.existing-file-tag .clickable-link {
    cursor: pointer;
    text-decoration: underline;
    color: #1677ff;
}

.existing-file-tag .clickable-link:hover {
    color: #4096ff;
}

.existing-file-tag .remove-icon {
    color: #ff4d4f;
    cursor: pointer;
    flex-shrink: 0;
}

.existing-file-tag .remove-icon:hover {
    color: #d9363e;
}
</style>
