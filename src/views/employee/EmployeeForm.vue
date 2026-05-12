<script setup>
import { defineEmits, defineModel, defineProps, ref, watch, computed } from "vue";
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
import FilesAPI from "@/apis/components/files/filesAPI";

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
const pendingCvFile = ref(null);
const blobUrl = ref("");
const cvZoom = ref(100);
const isUploadingCv = ref(false);
const isImageCv = computed(() => cvFile.value?.type?.startsWith("image/"));
const cvPreviewUrl = computed(() => {
    if (!blobUrl.value) return "";
    if (cvFile.value?.type === "application/pdf") {
        return `${blobUrl.value}#toolbar=1`;
    }
    return blobUrl.value;
});

const cvPreviewBody = ref(null);
const isDraggingCv = ref(false);
const dragStart = { x: 0, y: 0 };
const posX = ref(0);
const posY = ref(0);
const CV_BASE_WIDTH = 850;
const CV_BASE_HEIGHT = 1200;
const degreeOptions = ref([]);
const departmentOptions = ref([]);
const positionOptions = ref([]);
const shiftOptions = ref([]);
const defaultExpandedSections = ["basic", "work", "contact"];
const activeCollapseKeys = ref([...defaultExpandedSections]);

const avatarPreview = ref("");
const isUploadingAvatar = ref(false);
const avatarInput = ref(null);
const pendingAvatarFile = ref(null);

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

// Các hàm liên quan đến parse CV đã được loại bỏ

function handlePickedFile(file) {
    if (!isAllowedFile(file)) {
        $toastError("Chỉ hỗ trợ PDF, DOCX, RTF hoặc ảnh");
        return;
    }

    cvFile.value = file;
    pendingCvFile.value = file;
    if (blobUrl.value) {
        URL.revokeObjectURL(blobUrl.value);
    }
    blobUrl.value = URL.createObjectURL(file);
    cvZoom.value = 100;
    posX.value = 0;
    posY.value = 0;
}

function handleRemoveCv() {
    cvFile.value = null;
    if (blobUrl.value) {
        URL.revokeObjectURL(blobUrl.value);
        blobUrl.value = "";
    }
}

function zoomCv(delta) {
    cvZoom.value = Math.max(10, Math.min(500, cvZoom.value + delta));
}

function handleWheel(e) {
    e.preventDefault();
    const zoomSpeed = 5;
    const delta = e.deltaY > 0 ? -1 : 1;
    cvZoom.value = Math.max(10, Math.min(500, cvZoom.value + delta * zoomSpeed));
}

function startDragging(e) {
    if (!cvPreviewBody.value) return;
    isDraggingCv.value = true;
    dragStart.x = e.clientX - posX.value;
    dragStart.y = e.clientY - posY.value;
    
    window.addEventListener("mousemove", doDragging);
    window.addEventListener("mouseup", stopDragging);
}

function doDragging(e) {
    if (!isDraggingCv.value) return;
    posX.value = e.clientX - dragStart.x;
    posY.value = e.clientY - dragStart.y;
}

function stopDragging() {
    isDraggingCv.value = false;
    window.removeEventListener("mousemove", doDragging);
    window.removeEventListener("mouseup", stopDragging);
}

function handleBeforeUpload(file) {
    handlePickedFile(file);
    return false;
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        $toastError("Vui lòng chọn file hình ảnh hợp lệ");
        return;
    }

    pendingAvatarFile.value = file;
    avatarPreview.value = URL.createObjectURL(file);
    if (avatarInput.value) {
        avatarInput.value.value = "";
    }
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
        cvUrl: form.value.cvUrl || "",
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

    if (pendingAvatarFile.value) {
        isUploadingAvatar.value = true;
        try {
            const meta = {
                moduleName: "HR",
                entityName: "Employee",
                entityId: form.value.employeeId || null,
                purpose: "avatar",
            };
            const resp = await FilesAPI.upload(pendingAvatarFile.value, meta);
            const result = resp.data?.data || resp.data;
            if (result && (result.fileId || result.FileId)) {
                form.value.avatarUrl = result.fileId || result.FileId;
            } else {
                throw new Error("Invalid response");
            }
        } catch (e) {
            console.error(e);
            $toastError("Lỗi khi tải ảnh lên, không thể lưu nhân viên");
            isUploadingAvatar.value = false;
            return;
        }
        isUploadingAvatar.value = false;
    }

    // Upload CV if pending
    if (pendingCvFile.value) {
        isUploadingCv.value = true;
        try {
            const meta = {
                moduleName: "HR",
                entityName: "Employee",
                entityId: form.value.employeeId || null,
                purpose: "cv",
            };
            const resp = await FilesAPI.upload(pendingCvFile.value, meta);
            const result = resp.data?.data || resp.data;
            if (result && (result.fileId || result.FileId)) {
                form.value.cvUrl = result.fileId || result.FileId;
            } else {
                throw new Error("Invalid response");
            }
        } catch (e) {
            console.error(e);
            $toastError("Lỗi khi tải CV lên, không thể lưu nhân viên");
            isUploadingCv.value = false;
            return;
        }
        isUploadingCv.value = false;
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
        if (blobUrl.value) {
            URL.revokeObjectURL(blobUrl.value);
            blobUrl.value = "";
        }
        cvZoom.value = 100;
        posX.value = 0;
        posY.value = 0;
        avatarPreview.value = "";
        pendingAvatarFile.value = null;
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

            // Load avatar if exists and not default
            if (form.value.avatarUrl && form.value.avatarUrl !== "profile.jpg") {
                try {
                    const resp = await FilesAPI.download(form.value.avatarUrl);
                    avatarPreview.value = URL.createObjectURL(resp.data);
                } catch (e) {
                    console.error("Failed to load avatar", e);
                }
            }

            // Load CV if exists
            if (form.value.cvUrl) {
                try {
                    const resp = await FilesAPI.download(form.value.cvUrl);
                    const blob = resp.data;
                    cvFile.value = { 
                        type: blob.type, 
                        name: "CV_DinhKem" // Tên giả định khi load từ server
                    };
                    blobUrl.value = URL.createObjectURL(blob);
                    pendingCvFile.value = null;
                } catch (e) {
                    console.error("Failed to load CV", e);
                }
            }
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
        width="1500px"
        :show-save-and-add="false"
        :show-error-alert="showConfirm"
        :error-message="errorMessage"
        @close-alert="modelClose"
        @submit="handleSubmit"
        @cancel="handleCloseForm"
    >
        <div class="form-employee-content d-flex gap-24" style="height: calc(100vh - 230px); min-height: 640px; max-height: 850px; overflow: hidden; align-items: stretch; column-gap: 20px;">
            <!-- Cột trái: Upload CV -->
            <div class="form-employee-left d-flex flex-column gap-12" style="width: 650px; flex-shrink: 0; height: 100%;">
                <div class="form-section__title d-flex align-items-center justify-content-between">
                    <span>Hồ sơ / CV</span>
                    <ms-button v-if="cvFile" @click="handleRemoveCv" type="secondary" style="height: 24px; padding: 0 8px; font-size: 12px;">Xóa CV</ms-button>
                </div>
                
                <upload-dragger
                    v-if="!cvFile"
                    :multiple="false"
                    :show-upload-list="false"
                    accept=".pdf,.docx,.rtf,image/*"
                    :before-upload="handleBeforeUpload"
                    class="cv-drop-zone"
                >
                    <div class="cv-drop-zone__title p-20 d-flex flex-column align-items-center">
                        <span style="font-size: 32px; color: #1890ff; margin-bottom: 8px;">📄</span>
                        <span style="text-align: center;">Kéo thả CV vào đây hoặc bấm để chọn</span>
                    </div>
                </upload-dragger>

                <div v-else class="cv-preview-container flex-1 d-flex flex-column" style="border: 1px solid #d9d9d9; border-radius: 6px; overflow: hidden; background: #fafafa;">
                    <div class="p-8 d-flex align-items-center gap-8" style="border-bottom: 1px solid #d9d9d9; background: #fff; position: relative; z-index: 2;">
                        <span style="font-size: 16px; color: #1890ff;">📄</span>
                        <div class="text-ellipsis flex-1" :title="cvFile.name" style="font-weight: 500; font-size: 13px;">{{ cvFile.name }}</div>
                        
                        <div class="d-flex align-items-center gap-4 ml-8">
                            <ms-button size="small" @click="zoomCv(-10)" type="secondary" style="height: 24px; padding: 0 8px;">-</ms-button>
                            <span style="font-size: 11px; min-width: 35px; text-align: center;">{{ cvZoom }}%</span>
                            <ms-button size="small" @click="zoomCv(10)" type="secondary" style="height: 24px; padding: 0 8px;">+</ms-button>
                        </div>
                    </div>
                    
                    <div 
                        ref="cvPreviewBody"
                        class="flex-1 overflow-hidden bg-gray-600" 
                        style="background: #525659; position: relative; user-select: none; cursor: grab;"
                        :style="{ cursor: isDraggingCv ? 'grabbing' : 'grab' }"
                        @mousedown.prevent="startDragging"
                        @wheel="handleWheel"
                    >
                        <div :style="{ 
                            transform: `translate(${posX}px, ${posY}px) scale(${cvZoom / 100})`, 
                            transformOrigin: 'top left',
                            width: `${CV_BASE_WIDTH}px`,
                            height: `${CV_BASE_HEIGHT}px`,
                            position: 'absolute',
                            top: '40px',
                            left: '50%',
                            marginLeft: `-${CV_BASE_WIDTH / 2}px`,
                            pointerEvents: 'none'
                        }">
                            <img v-if="isImageCv" :src="cvPreviewUrl" draggable="false" @dragstart.prevent style="width: 100%; height: 100%; display: block; box-shadow: 0 0 10px rgba(0,0,0,0.5); object-fit: contain; background: white;" />
                            <iframe v-else :src="cvPreviewUrl" draggable="false" @dragstart.prevent style="width: 100%; height: 100%; border: none; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></iframe>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cột phải: Employee Info Sections -->
            <div class="form-employee-right flex-1" style="min-width: 0; height: 100%; overflow-y: auto; padding-right: 8px;">
                <collapse v-model:activeKey="activeCollapseKeys" class="employee-collapse">
                <collapse-panel key="basic" header="Thông tin cơ bản">
                    <div class="d-flex gap-20">
                        <!-- Avatar -->
                        <div class="avatar-section d-flex flex-column align-items-center">
                            <div class="avatar-preview" @click="avatarInput?.click()">
                                <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar" />
                                <div v-else class="avatar-placeholder d-flex align-items-center justify-content-center">
                                    <span v-if="isUploadingAvatar">Đang tải...</span>
                                    <span v-else>Chọn ảnh</span>
                                </div>
                                <div class="avatar-overlay">
                                    <span class="icon-camera">📷</span>
                                </div>
                            </div>
                            <input type="file" ref="avatarInput" accept="image/*" class="d-none" @change="handleAvatarUpload" />
                        </div>

                        <!-- Form Grid -->
                        <div class="form-grid flex-1">
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
                            <ms-input v-model="form.accountName" disabled />
                        </div>
                        <div class="form-item">
                            <div class="form-label">Hợp đồng</div>
                            <ms-input v-model="form.contractCode" disabled />
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

.gap-20 {
    gap: 20px;
}

.avatar-section {
    width: 140px;
    flex-shrink: 0;
    margin-top: 8px;
}

.avatar-preview {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 2px dashed #d9d9d9;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    background-color: #fafafa;
    transition: border-color 0.3s;
}

.avatar-preview:hover {
    border-color: #1890ff;
}

.avatar-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    color: #999;
    font-size: 13px;
    text-align: center;
}

.avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
}

.avatar-preview:hover .avatar-overlay {
    opacity: 1;
}

.icon-camera {
    font-size: 24px;
    color: white;
}

.d-none {
    display: none;
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
