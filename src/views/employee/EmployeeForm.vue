<script setup>
import { defineEmits, defineModel, defineProps, ref, watch } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import { Collapse, Modal, Spin, Upload } from "ant-design-vue";
import MsDatePicker from "@/components/ms-date-picker/MsDatePicker.vue";
import { createEmployee } from "@/common/model/employeeModel";
import DegreesAPI from "@/apis/components/degrees/degreesAPI";
import DepartmentsAPI from "@/apis/components/departments/departmentsAPI";
import PositionsAPI from "@/apis/components/positions/positionsAPI";
import ShiftsAPI from "@/apis/components/shifts/shiftsAPI";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { getCurrentUserGuid } from "@/utils/currentUser";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import MsForm from "@/components/ms-form/MsForm.vue";
import { useFormValidation } from "@/composables/useFormValidation";

const UploadDragger = Upload.Dragger;
const CollapsePanel = Collapse.Panel;

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

const form = ref(createEmployee());
const cvFile = ref(null);
const isParsingCv = ref(false);
const cvParseStatus = ref("");
const cvParseApiKey = ref("");
const degreeOptions = ref([]);
const departmentOptions = ref([]);
const positionOptions = ref([]);
const shiftOptions = ref([]);
const defaultExpandedSections = ["basic", "work", "contact"];
const activeCollapseKeys = ref([...defaultExpandedSections]);

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 40;

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

function validateField(field) {
    switch (field) {
        case "employeeCode":
            errors.value.employeeCode = form.value.employeeCode?.trim()
                ? ""
                : "Mã nhân viên không được để trống";
            break;
        case "fullName":
            errors.value.fullName = form.value.fullName?.trim() ? "" : "Họ tên không được để trống";
            break;
        case "gender":
            errors.value.gender = form.value.gender?.trim() ? "" : "Giới tính không được để trống";
            break;
        case "dateOfBirth":
            errors.value.dateOfBirth = form.value.dateOfBirth
                ? ""
                : "Ngày sinh không được để trống";
            break;
        case "nationalId":
            errors.value.nationalId = form.value.nationalId?.trim()
                ? ""
                : "CCCD/CMND không được để trống";
            break;
        case "degreeId":
            errors.value.degreeId = form.value.degreeId ? "" : "Bằng cấp không được để trống";
            break;
        case "email":
            if (form.value.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
                errors.value.email = "Email không đúng định dạng";
            } else {
                errors.value.email = "";
            }
            break;
        case "personalEmail":
            if (
                form.value.personalEmail?.trim() &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.personalEmail)
            ) {
                errors.value.personalEmail = "Email cá nhân không đúng định dạng";
            } else {
                errors.value.personalEmail = "";
            }
            break;
    }
}

const fieldOrder = [
    "employeeCode",
    "fullName",
    "gender",
    "dateOfBirth",
    "nationalId",
    "degreeId",
    "email",
    "personalEmail",
];

const ensureCollapseExpanded = (field) => {
    const fieldToCollapseMap = {
        employeeCode: "basic",
        fullName: "basic",
        gender: "basic",
        dateOfBirth: "basic",
        nationalId: "basic",
        degreeId: "basic",
        email: "contact",
        personalEmail: "contact",
    };
    const key = fieldToCollapseMap[field];
    if (key && !activeCollapseKeys.value.includes(key)) {
        activeCollapseKeys.value.push(key);
    }
};

initValidation(validateField, fieldOrder, ensureCollapseExpanded);

const genderOptions = [
    { value: "Nam", label: "Nam" },
    { value: "Nữ", label: "Nữ" },
    { value: "Khác", label: "Khác" },
];

const allowedMimeTypes = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/rtf",
    "text/rtf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
]);

const allowedExtensions = new Set([
    "pdf",
    "docx",
    "rtf",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "tif",
    "tiff",
]);

function toDateInputValue(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

async function loadDegrees() {
    try {
        const response = await DegreesAPI.getAll();
        const degrees = response?.data?.data || [];

        degreeOptions.value = degrees.map((item) => ({
            value: item.degreeId,
            label: `${item.degreeCode || ""} - ${item.degreeName || ""}`.trim(),
        }));
    } catch (error) {
        console.error(error);
        $toastError("Không thể tải danh mục bằng cấp");
    }
}

async function loadSelectData() {
    try {
        const [degreeRes, departmentRes, positionRes, shiftRes] = await Promise.all([
            DegreesAPI.getAll(),
            DepartmentsAPI.getAll(),
            PositionsAPI.getAll(),
            ShiftsAPI.getAll(),
        ]);

        const degrees = degreeRes?.data?.data || [];
        const departments = departmentRes?.data?.data || [];
        const positions = positionRes?.data?.data || [];
        const shifts = shiftRes?.data?.data || [];

        degreeOptions.value = degrees.map((item) => ({
            value: item.degreeId,
            label: `${item.degreeCode || ""} - ${item.degreeName || ""}`.trim(),
        }));

        departmentOptions.value = departments.map((item) => ({
            value: item.departmentId,
            label: `${item.departmentCode || ""} - ${item.departmentName || ""}`.trim(),
        }));

        positionOptions.value = positions.map((item) => ({
            value: item.positionId,
            label: `${item.positionCode || ""} - ${item.positionName || ""}`.trim(),
        }));

        shiftOptions.value = shifts.map((item) => ({
            value: item.shiftId,
            label: `${item.shiftCode || ""} - ${item.shiftName || ""}`.trim(),
        }));
    } catch (error) {
        console.error(error);
        $toastError("Không thể tải danh mục nhân viên");
    }
}

function mapGender(value) {
    const text = String(value || "")
        .trim()
        .toLowerCase();

    if (!text) return "";
    if (text.includes("male") || text.includes("nam") || text === "m") return "Nam";
    if (text.includes("female") || text.includes("nữ") || text.includes("nu") || text === "f") {
        return "Nữ";
    }

    return "Khác";
}

function isAllowedFile(file) {
    if (!file) return false;

    const fileName = file.name || "";
    const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";
    const isImageMime = String(file.type || "").startsWith("image/");

    return (
        isImageMime ||
        allowedMimeTypes.has(file.type) ||
        (extension && allowedExtensions.has(extension))
    );
}

function flattenEntries(data, parentPath = "", output = []) {
    if (data === null || data === undefined) return output;

    if (Array.isArray(data)) {
        data.forEach((item, index) => {
            const nextPath = parentPath ? `${parentPath}[${index}]` : `[${index}]`;
            flattenEntries(item, nextPath, output);
        });
        return output;
    }

    if (typeof data === "object") {
        Object.entries(data).forEach(([key, value]) => {
            const nextPath = parentPath ? `${parentPath}.${key}` : key;
            flattenEntries(value, nextPath, output);
        });
        return output;
    }

    if (typeof data === "string" || typeof data === "number") {
        output.push({ path: parentPath.toLowerCase(), value: String(data).trim() });
    }

    return output;
}

function pickByPath(entries, patterns) {
    const found = entries.find(
        (item) => item.value && patterns.some((pattern) => pattern.test(item.path)),
    );
    return found?.value || "";
}

function applyCvResultToForm(payload) {
    const sourceData = payload?.data || payload?.result || payload;
    const entries = flattenEntries(sourceData);

    const parsedFullName = pickByPath(entries, [
        /full.?name/,
        /candidate.?name/,
        /basics\.name/,
        /name/,
    ]);
    const parsedEmail = pickByPath(entries, [/email/, /mail/]);
    const parsedPhone = pickByPath(entries, [/phone/, /mobile/, /tel/]);
    const parsedAddress = pickByPath(entries, [/address/, /location/, /city/, /residence/]);
    const parsedGender = pickByPath(entries, [/gender/, /sex/]);
    const parsedDob = pickByPath(entries, [/date.?of.?birth/, /dob/, /birth/]);
    const parsedNationalId = pickByPath(entries, [
        /national.?id/,
        /id.?number/,
        /citizen/,
        /cccd/,
        /cmnd/,
    ]);

    const parsedJoinDate = pickByPath(entries, [
        /join.?date/,
        /employment.?date/,
        /work.?start/,
        /start.?date/,
    ]);

    if (parsedFullName) form.value.fullName = parsedFullName;
    if (parsedEmail) form.value.email = parsedEmail;
    if (parsedPhone) form.value.phoneNumber = parsedPhone;
    if (parsedAddress) form.value.address = parsedAddress;
    if (parsedNationalId) form.value.nationalId = parsedNationalId;

    const normalizedGender = mapGender(parsedGender);
    if (normalizedGender) form.value.gender = normalizedGender;

    const normalizedDob = toDateInputValue(parsedDob);
    if (normalizedDob) form.value.dateOfBirth = normalizedDob;

    const normalizedJoinDate = toDateInputValue(parsedJoinDate);
    if (normalizedJoinDate) form.value.joinDate = normalizedJoinDate;
}

async function parseCvFile(file) {
    const apiKey = cvParseApiKey.value?.trim() || import.meta.env.VITE_CV_PARSE_API_KEY?.trim();
    if (!apiKey) {
        $toastError("Thiếu API key parse CV. Nhập tại form hoặc cấu hình VITE_CV_PARSE_API_KEY.");
        return;
    }

    isParsingCv.value = true;
    cvParseStatus.value = "Đang tải file CV lên hệ thống parse...";
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/cvparse/api/v1/parse", {
            method: "POST",
            headers: {
                "X-API-Key": apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage || "Parse CV thất bại");
        }

        const parseJob = await response.json();
        const status = String(parseJob?.status || "").toLowerCase();
        const jobId = parseJob?.job_id || parseJob?.jobId;

        let result = parseJob?.result || null;

        if (!result && status !== "completed") {
            if (!jobId) {
                throw new Error("Không nhận được job_id từ API parse CV");
            }

            cvParseStatus.value = "Đang phân tích CV, vui lòng chờ...";
            result = await pollCvParseResult(jobId, apiKey);
        }

        if (!result) {
            throw new Error("Không nhận được dữ liệu parsed result");
        }

        applyCvResultToForm(result);
        $toastSuccess("Đã parse CV và tự động điền dữ liệu");
    } catch (error) {
        console.error(error);
        $toastError("Không thể parse CV. Vui lòng kiểm tra file, API key hoặc CORS.");
    } finally {
        isParsingCv.value = false;
        cvParseStatus.value = "";
    }
}

async function pollCvParseResult(jobId, apiKey) {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const response = await fetch(`/api/cvparse/api/v1/jobs/${jobId}`, {
            method: "GET",
            headers: {
                "X-API-Key": apiKey,
            },
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage || "Không lấy được trạng thái parse CV");
        }

        const jobData = await response.json();
        const status = String(jobData?.status || "").toLowerCase();

        if (status === "completed") {
            return jobData?.result || null;
        }

        if (status === "failed" || status === "error" || status === "cancelled") {
            throw new Error(jobData?.message || "Parse CV thất bại");
        }

        await wait(POLL_INTERVAL_MS);
    }

    throw new Error("Hết thời gian chờ parse CV");
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function handlePickedFile(file) {
    if (!isAllowedFile(file)) {
        $toastError("Chỉ hỗ trợ PDF, DOCX, RTF hoặc ảnh");
        return;
    }

    cvFile.value = file;
    parseCvFile(file);
}

function handleBeforeUpload(file) {
    handlePickedFile(file);
    return false;
}

function normalizeGuid(value) {
    const text = String(value || "").trim();
    if (!text) return null;

    // Chỉ cho phép GUID hợp lệ để tránh lỗi FK khi backend lưu dữ liệu.
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(text) ? text : null;
}

function buildPayload() {
    const currentUser = getCurrentUserGuid();
    const now = new Date().toISOString();

    const payload = {
        ...form.value,
        employeeCode: form.value.employeeCode?.trim() || "",
        fullName: form.value.fullName?.trim() || "",
        gender: form.value.gender?.trim() || "",
        dateOfBirth: form.value.dateOfBirth || null,
        address: form.value.address?.trim() || "",
        phoneNumber: form.value.phoneNumber?.trim() || "",
        email: form.value.email?.trim() || "",
        joinDate: form.value.joinDate || null,
        nationalId: form.value.nationalId?.trim() || "",
        avatarUrl: form.value.avatarUrl || "profile.jpg",
        degreeId: form.value.degreeId || null,
        departmentId: normalizeGuid(form.value.departmentId),
        shiftId: normalizeGuid(form.value.shiftId),
        positionId: normalizeGuid(form.value.positionId),
        accountId: normalizeGuid(form.value.accountId),
        contractId: normalizeGuid(form.value.contractId),
    };

    if (props.typeForm === "add") {
        delete payload.employeeId;

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

function handleCloseForm() {
    isFormOpen.value = false;
}

watch(
    () => isFormOpen.value,
    async (open) => {
        if (!open) return;

        resetErrors();
        activeCollapseKeys.value = [...defaultExpandedSections];
        cvFile.value = null;
        cvParseStatus.value = "";
        await loadSelectData();

        if (props.typeForm === "edit" && props.data) {
            form.value = {
                ...createEmployee(),
                ...props.data,
                dateOfBirth: toDateInputValue(props.data.dateOfBirth),
                joinDate: toDateInputValue(props.data.joinDate),
                degreeId: props.data.degreeId || null,
                departmentId: props.data.departmentId || null,
                shiftId: props.data.shiftId || null,
                positionId: props.data.positionId || null,
                accountId: props.data.accountId || null,
                contractId: props.data.contractId || null,
            };
            return;
        }

        form.value = {
            ...createEmployee(),
            gender: "Nam",
        };
    },
);
</script>

<template>
    <ms-form
        v-model:open="isFormOpen"
        :title="props.typeForm === 'edit' ? 'Sửa nhân viên' : 'Thêm nhân viên'"
        width="960px"
        :show-save-and-add="false"
        :show-error-alert="showConfirm"
        :error-message="errorMessage"
        @close-alert="modelClose"
        @submit="handleSubmit"
        @cancel="handleCloseForm"
    >
        <div class="form-employee-content d-flex flex-column gap-12">
            <!-- CV Parser (Chỉ hiện khi thêm mới) -->
            <div v-if="props.typeForm === 'add'" class="cv-parser d-flex flex-column">
                <div class="form-section__title">Tự động điền từ CV</div>
                <upload-dragger
                    :multiple="false"
                    :show-upload-list="false"
                    :disabled="isParsingCv"
                    accept=".pdf,.docx,.rtf,image/*"
                    :before-upload="handleBeforeUpload"
                    class="cv-drop-zone"
                >
                    <div class="cv-drop-zone__title">
                        Kéo thả CV vào đây (PDF, DOCX, RTF, ảnh) hoặc bấm để chọn file
                    </div>
                    <div v-if="cvFile" class="cv-drop-zone__file">File: {{ cvFile.name }}</div>
                    <div v-if="isParsingCv" class="cv-drop-zone__status d-flex align-items-center">
                        <spin size="small" />
                        <span>{{ cvParseStatus }}</span>
                    </div>
                </upload-dragger>
            </div>

            <!-- Employee Info Sections -->
            <collapse v-model:activeKey="activeCollapseKeys" class="employee-collapse">
                <collapse-panel key="basic" header="Thông tin cơ bản">
                    <div class="form-grid">
                        <div class="form-item">
                            <div class="form-label form-label--required">Mã nhân viên</div>
                            <ms-input v-model="form.employeeCode" :error="errors.employeeCode" :ref="(el) => (inputRefs.employeeCode = el)" @blurInput="handleBlur('employeeCode')" />
                        </div>
                        <div class="form-item">
                            <div class="form-label form-label--required">Họ tên</div>
                            <ms-input v-model="form.fullName" :error="errors.fullName" :ref="(el) => (inputRefs.fullName = el)" @blurInput="handleBlur('fullName')" />
                        </div>
                        <div class="form-item">
                            <div class="form-label form-label--required">Giới tính</div>
                            <ms-select v-model="form.gender" :options="genderOptions" placeholder="Chọn giới tính" :ref="(el) => (inputRefs.gender = el)" :error="errors.gender" @blurInput="handleBlur('gender')" />
                        </div>
                        <div class="form-item">
                            <div class="form-label form-label--required">Ngày sinh</div>
                            <ms-date-picker v-model="form.dateOfBirth" value-format="YYYY-MM-DD" format="DD/MM/YYYY" class="ant-control" :ref="(el) => (inputRefs.dateOfBirth = el)" :error="errors.dateOfBirth" @blurInput="handleBlur('dateOfBirth')" />
                        </div>
                        <div class="form-item">
                            <div class="form-label form-label--required">CCCD/CMND</div>
                            <ms-input v-model="form.nationalId" :error="errors.nationalId" :ref="(el) => (inputRefs.nationalId = el)" @blurInput="handleBlur('nationalId')" />
                        </div>
                        <div class="form-item">
                            <div class="form-label form-label--required">Bằng cấp</div>
                            <ms-select v-model="form.degreeId" :options="degreeOptions" placeholder="Chọn bằng cấp" dropdown-position="top" :max-height="220" :ref="(el) => (inputRefs.degreeId = el)" :error="errors.degreeId" @blurInput="handleBlur('degreeId')" />
                        </div>
                    </div>
                </collapse-panel>

                <collapse-panel key="work" header="Thông tin công việc">
                    <div class="form-grid">
                        <div class="form-item">
                            <div class="form-label">Ngày vào làm</div>
                            <ms-date-picker v-model="form.joinDate" value-format="YYYY-MM-DD" format="DD/MM/YYYY" class="ant-control" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Phòng ban</div>
                            <ms-select v-model="form.departmentId" :options="departmentOptions" placeholder="Chọn phòng ban" dropdown-position="top" :max-height="220" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Vị trí</div>
                            <ms-select v-model="form.positionId" :options="positionOptions" placeholder="Chọn vị trí" dropdown-position="top" :max-height="220" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Ca làm</div>
                            <ms-select v-model="form.shiftId" :options="shiftOptions" placeholder="Chọn ca làm" dropdown-position="top" :max-height="220" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Tài khoản</div>
                            <ms-input v-model="form.accountId" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Hợp đồng</div>
                            <ms-input v-model="form.contractId" />
                        </div>
                    </div>
                </collapse-panel>

                <collapse-panel key="contact" header="Thông tin liên lạc">
                    <div class="form-grid">
                        <div class="form-item form-item--full">
                            <div class="form-label">Địa chỉ</div>
                            <ms-input v-model="form.address" />
                        </div>
                        <div class="form-item form-item--full">
                            <div class="form-label">Địa chỉ tạm trú</div>
                            <ms-input v-model="form.temporaryAddress" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Số điện thoại</div>
                            <ms-input v-model="form.phoneNumber" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Email công việc</div>
                            <ms-input v-model="form.email" :error="errors.email" :ref="(el) => (inputRefs.email = el)" @blurInput="handleBlur('email')" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Email cá nhân</div>
                            <ms-input v-model="form.personalEmail" :error="errors.personalEmail" :ref="(el) => (inputRefs.personalEmail = el)" @blurInput="handleBlur('personalEmail')" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Zalo</div>
                            <ms-input v-model="form.zaloNumber" />
                        </div>
                        <div class="form-item form-item--full">
                            <div class="form-label">Facebook URL</div>
                            <ms-input v-model="form.facebookUrl" />
                        </div>
                    </div>
                </collapse-panel>

                <collapse-panel key="personal" header="Thông tin cá nhân mở rộng">
                    <div class="form-grid">
                        <div class="form-item">
                            <div class="form-label">Nơi sinh</div>
                            <ms-input v-model="form.placeOfBirth" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Quê quán</div>
                            <ms-input v-model="form.hometown" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Dân tộc</div>
                            <ms-input v-model="form.ethnic" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Tôn giáo</div>
                            <ms-input v-model="form.religion" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Quốc tịch</div>
                            <ms-input v-model="form.nationality" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Tình trạng hôn nhân</div>
                            <ms-input v-model="form.maritalStatus" />
                        </div>
                    </div>
                </collapse-panel>

                <collapse-panel key="bank" header="Ngân hàng">
                    <div class="form-grid">
                        <div class="form-item">
                            <div class="form-label">Số tài khoản</div>
                            <ms-input v-model="form.bankAccountNumber" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Tên ngân hàng</div>
                            <ms-input v-model="form.bankName" />
                        </div>
                        <div class="form-item form-item--full">
                            <div class="form-label">Chi nhánh</div>
                            <ms-input v-model="form.bankBranch" />
                        </div>
                    </div>
                </collapse-panel>

                <collapse-panel key="emergency" header="Liên hệ khẩn cấp">
                    <div class="form-grid">
                        <div class="form-item">
                            <div class="form-label">Họ tên người liên hệ</div>
                            <ms-input v-model="form.emergencyContactName" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Số điện thoại</div>
                            <ms-input v-model="form.emergencyContactPhone" />
                        </div>
                        <div class="form-item form-item--full">
                            <div class="form-label">Mối quan hệ</div>
                            <ms-input v-model="form.emergencyContactRelationship" />
                        </div>
                    </div>
                </collapse-panel>

                <collapse-panel key="health" header="Sức khỏe & Bảo hiểm">
                    <div class="form-grid">
                        <div class="form-item">
                            <div class="form-label">Chiều cao</div>
                            <ms-input v-model="form.height" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Cân nặng</div>
                            <ms-input v-model="form.weight" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Nhóm máu</div>
                            <ms-input v-model="form.bloodGroup" />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Tình trạng sức khỏe</div>
                            <ms-input v-model="form.healthStatus" />
                        </div>
                        <div class="form-item form-item--full">
                            <div class="form-label">Số BHXH</div>
                            <ms-input v-model="form.socialInsuranceNumber" />
                        </div>
                    </div>
                </collapse-panel>
            </collapse>
        </div>
    </ms-form>
</template>

<style scoped>
:deep(.ant-collapse) {
    background: transparent;
    border: none;
}
.form-modal {
    width: 100%;
}

.form-modal__body {
    padding: 0 20px 16px;
    overflow-y: auto;
}

.form-modal__footer {
    padding: 16px 20px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 16px;
}

.form-section__title {
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-item--full {
    grid-column: 1 / -1;
}

.form-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
}

.form-label--required::after {
    content: " *";
    color: #ff4d4f;
}

.ant-control {
    width: 100%;
}

.ant-control:deep(.ant-picker) {
    width: 100%;
    height: 27px;
}

.gap-12 {
    gap: 12px;
}

.form-error {
    margin-top: 4px;
    color: #ff4d4f;
    font-size: 12px;
}

.employee-collapse {
    background: transparent;
}

.employee-collapse:deep(.ant-collapse-item) {
    border: 1px solid #e7edf3;
    border-radius: 5px;
    margin-bottom: 10px;
    background: #ffffff;
}

.employee-collapse:deep(.ant-collapse-item-active),
.employee-collapse:deep(.ant-collapse-item-active > .ant-collapse-content) {
    overflow: visible !important;
}

.employee-collapse:deep(.ant-collapse-header) {
    font-weight: 600;
    color: #1f2937;
    background-color: #b7ede1; /* Màu lục nhạt */
    border-radius: 4px 4px 0 0 !important;
}

.employee-collapse:deep(.ant-collapse-content-box) {
    padding-top: 6px;
}

.cv-parser {
    gap: 10px;
    margin-bottom: 8px;
    border: 1px solid #e7edf3;
    border-radius: 10px;
    padding: 16px;
    background: #ffffff;
}

.cv-drop-zone {
    width: 100%;
}

.cv-drop-zone:deep(.ant-upload) {
    background: #f6fbff;
    border-color: #0f6db2;
}

.cv-drop-zone:deep(.ant-upload.ant-upload-disabled) {
    cursor: wait;
}

.cv-drop-zone__title {
    font-size: 14px;
    color: #1f2937;
}

.cv-drop-zone__file {
    margin-top: 8px;
    font-size: 13px;
    color: #0f6db2;
}

.cv-drop-zone__status {
    margin-top: 6px;
    font-size: 13px;
    color: #15a14a;
    gap: 8px;
}

@media (max-width: 960px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>
