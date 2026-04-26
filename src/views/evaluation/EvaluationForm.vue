<script setup>
import { ref, defineModel, watch, nextTick, reactive, onMounted, onBeforeUnmount } from "vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsRadioButton from "@/components/ms-radio-button/MsRadioButton.vue";
import { createEvaluation } from "@/common/model/evaluationModel";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import { Tooltip, DatePicker, InputNumber, Modal } from "ant-design-vue";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";

const TITLE_EVALUATION_FORM_ADD = "Thêm Đánh giá";
const TITLE_EVALUATION_FORM_EDIT = "Sửa Đánh giá";

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
    evaluationCode: null,
    employeeId: null,
    evaluationType: null,
    reason: null,
    amount: null,
    evaluationDate: null,
});
const showConfirm = ref(false);
const fieldValid = reactive({
    evaluationCode: "",
    employeeId: "",
    evaluationType: "",
    reason: "",
    amount: "",
    evaluationDate: "",
});
const lastFocusField = ref(null);
const isSubmit = ref(false);
const evaluation = ref(createEvaluation());
const employees = ref([]);

const emit = defineEmits(["submit", "submit-and-add"]);

watch(
    () => isFormOpen.value,
    (open) => {
        if (!open) return;

        if (props.typeForm === "edit" && props.data) {
            evaluation.value = { ...props.data };
        }

        if (props.typeForm === "add") {
            evaluation.value = createEvaluation();
        }

        if (props.typeForm === "duplicate" && props.data) {
            evaluation.value = {
                ...props.data,
                evaluationId: "",
                evaluationCode: "",
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
        "evaluationCode",
        "employeeId",
        "evaluationType",
        "reason",
        "amount",
        "evaluationDate",
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
        case "evaluationCode":
            fieldValid.evaluationCode = evaluation.value.evaluationCode
                ? ""
                : "Mã đánh giá không được để trống";
            break;

        case "employeeId":
            fieldValid.employeeId = evaluation.value.employeeId
                ? ""
                : "Nhân viên không được để trống";
            break;

        case "evaluationType":
            fieldValid.evaluationType = evaluation.value.evaluationType
                ? ""
                : "Loại đánh giá không được để trống";
            break;

        case "reason":
            fieldValid.reason = evaluation.value.reason ? "" : "Lý do không được để trống";
            break;

        case "amount":
            fieldValid.amount =
                evaluation.value.amount && evaluation.value.amount > 0
                    ? ""
                    : "Số tiền phải lớn hơn 0";
            break;

        case "evaluationDate":
            fieldValid.evaluationDate = evaluation.value.evaluationDate
                ? ""
                : "Ngày áp dụng không được để trống";
            break;
    }
}

function validateForm() {
    fieldValid.evaluationCode = "";
    fieldValid.employeeId = "";
    fieldValid.evaluationType = "";
    fieldValid.reason = "";
    fieldValid.amount = "";
    fieldValid.evaluationDate = "";

    validateField("evaluationCode");
    validateField("employeeId");
    validateField("evaluationType");
    validateField("reason");
    validateField("amount");
    validateField("evaluationDate");

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
    const payload = buildPayload(evaluation.value, isUpdate);

    if (isSubmitAndAdd) {
        emit("submit-and-add", payload);
    } else {
        emit("submit", payload);
    }
};

const handleCloseForm = () => {
    isFormOpen.value = false;
    isSubmit.value = false;
    fieldValid.evaluationCode = "";
    fieldValid.employeeId = "";
    fieldValid.evaluationType = "";
    fieldValid.reason = "";
    fieldValid.amount = "";
    fieldValid.evaluationDate = "";
    evaluation.value = createEvaluation();
};

const currentUser = "b8373a59-3be2-11f1-97ac-d0c5d346d1a4";

function buildPayload(evaluationData, isUpdate = false) {
    const { ...rest } = evaluationData;

    if (!isUpdate) {
        delete rest.evaluationId;
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
        :title="props.typeForm === 'edit' ? TITLE_EVALUATION_FORM_EDIT : TITLE_EVALUATION_FORM_ADD"
        width="700px"
        centered
        :footer="null"
        :mask-closable="false"
        :destroy-on-close="true"
        @cancel="handleCloseForm"
    >
        <div class="form-evaluation d-flex flex-column">
            <div class="form-evaluation__body d-flex flex-column">
                <div class="form-evaluation__item d-flex justify-content-between">
                    <div class="form-evaluation__label form-evaluation__label--required">
                        Mã đánh giá
                    </div>
                    <ms-input
                        :label="'Mã đánh giá'"
                        :ref="(el) => (inputRefs.evaluationCode = el)"
                        v-model="evaluation.evaluationCode"
                        :width="474"
                        :maxLength="20"
                        :firstFocus="true"
                        :error="fieldValid.evaluationCode"
                        @blurInput="handleBlur('evaluationCode')"
                        required
                    ></ms-input>
                </div>

                <div class="form-evaluation__item d-flex justify-content-between">
                    <div class="form-evaluation__label form-evaluation__label--required">
                        Nhân viên
                    </div>
                    <ms-select
                        v-model="evaluation.employeeId"
                        :options="employees"
                        placeholder="Chọn nhân viên"
                        :max-height="260"
                    ></ms-select>
                </div>

                <div class="form-evaluation__item d-flex justify-content-between">
                    <div class="form-evaluation__label form-evaluation__label--required">
                        Loại đánh giá
                    </div>
                    <div class="form-evaluation__radio-group">
                        <ms-radio-button
                            v-model="evaluation.evaluationType"
                            :value="'Khen thưởng'"
                            name="evaluationType"
                        >
                            Khen thưởng
                        </ms-radio-button>
                        <ms-radio-button
                            v-model="evaluation.evaluationType"
                            :value="'Vi phạm'"
                            name="evaluationType"
                        >
                            Vi phạm
                        </ms-radio-button>
                    </div>
                </div>

                <div class="form-evaluation__item d-flex justify-content-between">
                    <div class="form-evaluation__label form-evaluation__label--required">Lý do</div>
                    <ms-textarea v-model="evaluation.reason"></ms-textarea>
                </div>

                <div class="form-evaluation__item d-flex justify-content-between">
                    <div class="form-evaluation__label form-evaluation__label--required">
                        Số tiền
                    </div>
                    <input-number
                        v-model:value="evaluation.amount"
                        :min="0"
                        style="width: 474px"
                    ></input-number>
                </div>

                <div class="form-evaluation__item d-flex justify-content-between">
                    <div class="form-evaluation__label form-evaluation__label--required">
                        Ngày áp dụng
                    </div>
                    <date-picker
                        v-model:value="evaluation.evaluationDate"
                        value-format="YYYY-MM-DD"
                        format="DD/MM/YYYY"
                        placeholder="DD/MM/YYYY"
                        style="width: 474px"
                    ></date-picker>
                </div>
            </div>

            <div class="form-evaluation__footer d-flex align-items-center justify-content-end">
                <div class="form-evaluation__footer-buttons d-flex align-items-center">
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
.form-evaluation {
    width: 100%;
}

.form-evaluation__body {
    flex: 1;
    padding: 20px 0 16px;
    min-height: 0;
    row-gap: 16px;
}

.form-evaluation__footer {
    height: 56px;
    width: 100%;
    border-top: 1px solid #e0e0e0;
    padding: 12px 0 0;
}

.form-evaluation__label {
    width: 150px;
    font-weight: 500;
    line-height: 27px;
    margin-right: 16px;
}

.form-evaluation__label--required::after {
    content: "*";
    color: red;
    margin-left: 3px;
}

.form-evaluation__footer-buttons {
    column-gap: 8px;
    flex-direction: row-reverse;
}

.form-evaluation__radio-group {
    display: flex;
    gap: 16px;
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
