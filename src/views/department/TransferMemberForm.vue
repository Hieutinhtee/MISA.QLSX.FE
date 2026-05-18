<script setup>
import { ref, watch, defineModel, defineProps, defineEmits } from "vue";
import MsForm from "@/components/ms-form/MsForm.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsDatePicker from "@/components/ms-date-picker/MsDatePicker.vue";
import ApprovalRequestsAPI from "@/apis/components/approval-requests/approvalRequestsAPI";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";
import DepartmentsAPI from "@/apis/components/departments/departmentsAPI";
import { getCurrentUserGuid } from "@/utils/currentUser";
import { $toastError } from "@/utils/toastService";
import { useFormValidation } from "@/composables/useFormValidation";

const props = defineProps({
    department: { type: Object, default: null },
});

const emit = defineEmits(["submitted"]);

const isOpen = defineModel({ type: Boolean, default: false });

const form = ref({
    employeeId: "",
    employeeName: "",
    toDepartmentId: "",
    toDepartmentName: "",
    effectiveDate: null,
    description: "",
});

// Danh sách nhân viên thuộc phòng ban hiện tại
const employees = ref([]);
const departments = ref([]);

const {
    showConfirm,
    errorMessage,
    errors,
    initValidation,
    validateForm,
    focusFirstInvalidInput,
    modelClose,
    resetErrors,
} = useFormValidation();

const fieldOrder = ["employeeId", "toDepartmentId", "effectiveDate"];
initValidation(validateField, fieldOrder);

function validateField(field) {
    switch (field) {
        case "employeeId":
            errors.value.employeeId = form.value.employeeId ? "" : "Vui lòng chọn nhân viên";
            break;
        case "toDepartmentId":
            errors.value.toDepartmentId = form.value.toDepartmentId
                ? ""
                : "Vui lòng chọn phòng ban đích";
            break;
        case "effectiveDate":
            errors.value.effectiveDate = form.value.effectiveDate
                ? ""
                : "Vui lòng chọn ngày có hiệu lực";
            break;
    }
}

async function loadEmployees() {
    try {
        const res = await EmployeesAPI.getAll();
        const allEmployees = res.data?.data || res.data || [];
        // Filter nhân viên thuộc phòng ban hiện tại
        employees.value = allEmployees.filter(
            (e) => e.departmentId === props.department?.departmentId,
        );
    } catch (error) {
        console.error(error);
    }
}

async function loadDepartments() {
    try {
        const res = await DepartmentsAPI.getAll();
        const allDepts = res.data?.data || res.data || [];
        // Bỏ phòng ban hiện tại khỏi danh sách đích
        departments.value = allDepts.filter(
            (d) => d.departmentId !== props.department?.departmentId && d.isActive !== false,
        );
    } catch (error) {
        console.error(error);
    }
}

async function handleSubmit() {
    if (!validateForm()) {
        await focusFirstInvalidInput();
        return;
    }

    try {
        const payload = {
            employeeId: form.value.employeeId,
            fromDepartmentId: props.department?.departmentId,
            toDepartmentId: form.value.toDepartmentId,
        };

        await ApprovalRequestsAPI.create({
            requestType: "department_member_transfer",
            title: `Thuyên chuyển NV đến phòng ban khác`,
            description: form.value.description || "",
            payload: JSON.stringify(payload),
            effectiveDate: form.value.effectiveDate,
            createdBy: getCurrentUserGuid(),
        });

        emit("submitted");
    } catch (error) {
        $toastError("Tạo yêu cầu thất bại");
        console.error(error);
    }
}

watch(
    () => isOpen.value,
    (open) => {
        if (!open) return;
        resetErrors();
        form.value = {
            employeeId: "",
            employeeName: "",
            toDepartmentId: "",
            toDepartmentName: "",
            effectiveDate: null,
            description: "",
        };
        loadEmployees();
        loadDepartments();
    },
);
</script>

<template>
    <ms-form
        v-model:open="isOpen"
        title="Thuyên chuyển nhân viên"
        width="700px"
        :show-save-and-add="false"
        :show-error-alert="showConfirm"
        :error-message="errorMessage"
        @close-alert="modelClose"
        @submit="handleSubmit"
        @cancel="isOpen = false"
    >
        <div class="d-flex flex-column gap-12">
            <div class="form-row d-flex justify-content-between align-items-center">
                <div class="form-label">Phòng ban hiện tại</div>
                <ms-input :width="430" :modelValue="department?.departmentName" disabled />
            </div>

            <div class="form-row d-flex justify-content-between align-items-center">
                <div class="form-label form-label--required">Nhân viên</div>
                <select v-model="form.employeeId" class="form-select" style="width: 430px">
                    <option value="" disabled>-- Chọn nhân viên --</option>
                    <option v-for="e in employees" :key="e.employeeId" :value="e.employeeId">
                        {{ e.employeeCode }} - {{ e.fullName }}
                    </option>
                </select>
            </div>

            <div class="form-row d-flex justify-content-between align-items-center">
                <div class="form-label form-label--required">Phòng ban đích</div>
                <select v-model="form.toDepartmentId" class="form-select" style="width: 430px">
                    <option value="" disabled>-- Chọn phòng ban --</option>
                    <option v-for="d in departments" :key="d.departmentId" :value="d.departmentId">
                        {{ d.departmentCode }} - {{ d.departmentName }}
                    </option>
                </select>
            </div>

            <div class="form-row d-flex justify-content-between align-items-center">
                <div class="form-label form-label--required">Ngày hiệu lực</div>
                <ms-date-picker v-model="form.effectiveDate" :width="430" />
            </div>

            <div class="form-row d-flex justify-content-between align-items-start">
                <div class="form-label">Lý do</div>
                <div style="width: 430px">
                    <ms-textarea v-model="form.description" />
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
.gap-12 {
    gap: 12px;
}
.form-select {
    height: 36px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    padding: 0 8px;
    font-size: 14px;
    font-family: inherit;
}
</style>
