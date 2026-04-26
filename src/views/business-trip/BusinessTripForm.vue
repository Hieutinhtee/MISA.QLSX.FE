<script setup>
import { ref, defineModel, watch, nextTick, reactive, onMounted, onBeforeUnmount } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import { createBusinessTrip } from "@/common/model/businessTripModel";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import { Tooltip, DatePicker, InputNumber, Modal } from "ant-design-vue";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";

const TITLE_BUSINESS_TRIP_FORM_ADD = "Thêm Công tác";
const TITLE_BUSINESS_TRIP_FORM_EDIT = "Sửa Công tác";

const props = defineProps({
    typeForm: {
        type: String,
        default: "add",
        validator: (value) => ["add", "edit", "duplicate"].includes(value),
    },
    data: {
        type: Object,
    },
});

const isFormOpen = defineModel({
    type: Boolean,
    default: false,
});

const errorMessage = ref("");
const inputRefs = reactive({
    businessTripCode: null,
    employeeId: null,
    startDate: null,
    endDate: null,
    location: null,
    purpose: null,
    supportAmount: null,
});
const showConfirm = ref(false);
const fieldValid = reactive({
    businessTripCode: "",
    employeeId: "",
    startDate: "",
    endDate: "",
    location: "",
    purpose: "",
});
const lastFocusField = ref(null);
const isSubmit = ref(false);
const businessTrip = ref(createBusinessTrip());
const employees = ref([]);

const emit = defineEmits(["submit", "submit-and-add"]);

watch(
    () => isFormOpen.value,
    (open) => {
        if (!open) return;

        if (props.typeForm === "edit" && props.data) {
            businessTrip.value = { ...props.data };
        }

        if (props.typeForm === "add") {
            businessTrip.value = createBusinessTrip();
        }

        if (props.typeForm === "duplicate" && props.data) {
            businessTrip.value = {
                ...props.data,
                businessTripId: "",
                businessTripCode: "",
            };
        }

        loadEmployees();
    },
);

async function loadEmployees() {
    try {
        const res = await EmployeesAPI.getAll();
        employees.value = (res.data?.data || []).map((emp) => ({
            value: emp.employeeId,
            label: `${emp.employeeCode} - ${emp.fullName}`,
        }));
    } catch (error) {
        console.error("Failed to load employees:", error);
    }
}

function showAlert(message) {
    errorMessage.value = message;
    showConfirm.value = true;
}

const focusFirstInvalidInput = async () => {
    await nextTick();

    const fieldOrder = [
        "businessTripCode",
        "employeeId",
        "startDate",
        "endDate",
        "location",
        "purpose",
    ];

    for (const field of fieldOrder) {
        if (fieldValid[field] && inputRefs[field]) {
            showAlert(fieldValid[field]);
            lastFocusField.value = field;
            break;
        }
    }
};

function validateField(field) {
    switch (field) {
        case "businessTripCode":
            fieldValid.businessTripCode = businessTrip.value.businessTripCode
                ? ""
                : "Mã công tác không được để trống";
            break;

        case "employeeId":
            fieldValid.employeeId = businessTrip.value.employeeId
                ? ""
                : "Nhân viên không được để trống";
            break;

        case "startDate":
            fieldValid.startDate = businessTrip.value.startDate
                ? ""
                : "Ngày bắt đầu không được để trống";
            break;

        case "endDate":
            fieldValid.endDate = businessTrip.value.endDate
                ? ""
                : "Ngày kết thúc không được để trống";
            if (businessTrip.value.startDate && businessTrip.value.endDate) {
                const start = new Date(businessTrip.value.startDate);
                const end = new Date(businessTrip.value.endDate);
                if (end < start) {
                    fieldValid.endDate = "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu";
                }
            }
            break;

        case "location":
            fieldValid.location = businessTrip.value.location ? "" : "Địa điểm không được để trống";
            break;

        case "purpose":
            fieldValid.purpose = businessTrip.value.purpose ? "" : "Mục đích không được để trống";
            break;
    }
}

function validateForm() {
    fieldValid.businessTripCode = "";
    fieldValid.employeeId = "";
    fieldValid.startDate = "";
    fieldValid.endDate = "";
    fieldValid.location = "";
    fieldValid.purpose = "";

    validateField("businessTripCode");
    validateField("employeeId");
    validateField("startDate");
    validateField("endDate");
    validateField("location");
    validateField("purpose");

    return !Object.values(fieldValid).some(Boolean);
}

const handleBlur = (field) => {
    validateField(field);
};

const handleSubmit = (isSubmitAndAdd) => {
    isSubmit.value = true;
    const allValid = validateForm();
    if (!allValid) {
        focusFirstInvalidInput();
        return;
    }

    const isUpdate = props.typeForm === "edit";
    const payload = buildPayload(businessTrip.value, isUpdate);

    if (isSubmitAndAdd) {
        emit("submit-and-add", payload);
    } else {
        emit("submit", payload);
    }
};

const handleCloseForm = () => {
    isFormOpen.value = false;
    isSubmit.value = false;
    fieldValid.businessTripCode = "";
    fieldValid.employeeId = "";
    fieldValid.startDate = "";
    fieldValid.endDate = "";
    fieldValid.location = "";
    fieldValid.purpose = "";
    businessTrip.value = createBusinessTrip();
};

const currentUser = "b8373a59-3be2-11f1-97ac-d0c5d346d1a4";

function buildPayload(businessTripData, isUpdate = false) {
    const { ...rest } = businessTripData;

    if (!isUpdate) {
        delete rest.businessTripId;
        return {
            ...rest,
            createdBy: currentUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser,
        };
    }

    return {
        ...rest,
        updatedBy: currentUser,
        updatedAt: new Date().toISOString(),
    };
}

defineExpose({
    handleCloseForm,
});

const modelClose = () => {
    showConfirm.value = false;
    isSubmit.value = false;
    errorMessage.value = "";
    inputRefs[lastFocusField.value]?.focusInput();
};

const handleKeydown = (e) => {
    if (!isFormOpen.value) return;

    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit(true);
        return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit(false);
        return;
    }

    if (e.key === "Escape") {
        handleCloseForm();
    }
};

onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
    <ms-alert v-model="showConfirm" title="Cảnh báo" @close="modelClose">
        {{ errorMessage }}
    </ms-alert>

    <Modal
        v-model:open="isFormOpen"
        :title="
            props.typeForm === 'edit' ? TITLE_BUSINESS_TRIP_FORM_EDIT : TITLE_BUSINESS_TRIP_FORM_ADD
        "
        width="680px"
        centered
        :footer="null"
        :mask-closable="false"
        :destroy-on-close="true"
        @cancel="handleCloseForm"
    >
        <div class="form-business-trip d-flex flex-column">
            <div class="form-business-trip__body d-flex flex-column">
                <div class="form-business-trip__item d-flex justify-content-between">
                    <div class="form-business-trip__label form-business-trip__label--required">
                        Mã công tác
                    </div>
                    <ms-input
                        :label="'Mã công tác'"
                        :ref="(el) => (inputRefs.businessTripCode = el)"
                        v-model="businessTrip.businessTripCode"
                        :width="474"
                        :maxLength="20"
                        :firstFocus="true"
                        :error="fieldValid.businessTripCode"
                        @blurInput="handleBlur('businessTripCode')"
                        required
                    ></ms-input>
                </div>

                <div class="form-business-trip__item d-flex justify-content-between">
                    <div class="form-business-trip__label form-business-trip__label--required">
                        Nhân viên
                    </div>
                    <ms-select
                        v-model="businessTrip.employeeId"
                        :options="employees"
                        placeholder="Chọn nhân viên"
                        :max-height="260"
                    ></ms-select>
                </div>

                <div class="form-business-trip__wrapper-item d-flex justify-content-between">
                    <div class="form-business-trip__item d-flex flex-1">
                        <div class="form-business-trip__label form-business-trip__label--required">
                            Ngày bắt đầu
                        </div>
                        <date-picker
                            v-model:value="businessTrip.startDate"
                            value-format="YYYY-MM-DD"
                            format="DD/MM/YYYY"
                            placeholder="DD/MM/YYYY"
                            style="width: 122px"
                        ></date-picker>
                    </div>
                    <div class="form-business-trip__item d-flex flex-1 justify-content-between">
                        <div
                            class="form-business-trip__label flex-1 form-business-trip__label--required"
                        >
                            Ngày kết thúc
                        </div>
                        <date-picker
                            v-model:value="businessTrip.endDate"
                            value-format="YYYY-MM-DD"
                            format="DD/MM/YYYY"
                            placeholder="DD/MM/YYYY"
                            style="width: 122px"
                        ></date-picker>
                    </div>
                </div>

                <div class="form-business-trip__item d-flex justify-content-between">
                    <div class="form-business-trip__label form-business-trip__label--required">
                        Địa điểm
                    </div>
                    <ms-input
                        v-model="businessTrip.location"
                        :ref="(el) => (inputRefs.location = el)"
                        :label="'Địa điểm'"
                        :width="474"
                        :maxLength="200"
                        :error="fieldValid.location"
                        @blurInput="handleBlur('location')"
                        required
                    ></ms-input>
                </div>

                <div class="form-business-trip__item d-flex justify-content-between">
                    <div class="form-business-trip__label form-business-trip__label--required">
                        Mục đích
                    </div>
                    <ms-textarea v-model="businessTrip.purpose"></ms-textarea>
                </div>

                <div class="form-business-trip__item d-flex justify-content-between">
                    <div class="form-business-trip__label">Mức hỗ trợ</div>
                    <input-number
                        v-model:value="businessTrip.supportAmount"
                        :min="0"
                        style="width: 474px"
                    ></input-number>
                </div>
            </div>

            <div class="form-business-trip__footer d-flex align-items-center justify-content-end">
                <div class="form-business-trip__footer-buttons d-flex align-items-center">
                    <ms-button :tooltip="'Crtl + S'" @click="handleSubmit(false)" tabindex="0"
                        >Lưu</ms-button
                    >
                    <ms-button
                        :tooltip="'Crtl + Shift + S'"
                        :type="'outline'"
                        tabindex="0"
                        @click="handleSubmit(true)"
                    >
                        Lưu và thêm
                    </ms-button>
                    <ms-button :type="'outline'" @click="handleCloseForm" tabindex="0"
                        >Hủy</ms-button
                    >
                </div>
            </div>
        </div>
    </Modal>
</template>

<style scoped>
.form-business-trip {
    width: 100%;
}

.form-business-trip__body {
    flex: 1;
    padding: 20px 0 16px;
    min-height: 0;
    row-gap: 16px;
}

.form-business-trip__footer {
    height: 56px;
    width: 100%;
    border-top: 1px solid #e0e0e0;
    padding: 12px 0 0;
}

.form-business-trip__label {
    width: 150px;
    font-weight: 500;
    line-height: 27px;
    margin-right: 16px;
}

.form-business-trip__label--required::after {
    content: "*";
    color: red;
    margin-left: 3px;
}

.form-business-trip__footer-buttons {
    column-gap: 8px;
    flex-direction: row-reverse;
}

.form-business-trip__wrapper-item {
    column-gap: 16px;
}

.ant-control:deep(.ant-input-number) {
    width: 100%;
}

.ant-control:deep(.ant-input-number-input) {
    height: 27px;
}

.ant-control:deep(.ant-picker) {
    width: 100%;
}
</style>
