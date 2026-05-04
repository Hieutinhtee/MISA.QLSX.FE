import { ref, reactive, nextTick } from "vue";

export function useFormValidation() {
    const showConfirm = ref(false);
    const errorMessage = ref("");
    const lastFocusField = ref(null);
    const inputRefs = reactive({});
    const errors = ref({});

    let validateFieldFunction = null;
    let fieldOrderArray = [];
    let onFocusFieldCallback = null;

    /**
     * Khởi tạo các hàm validate và danh sách các trường cần validate
     * @param {Function} validateFn Hàm validate cho từng trường
     * @param {Array} fieldsOrder Mảng thứ tự các trường (dùng để focus khi có nhiều lỗi)
     * @param {Function} onFocusField Hàm callback được gọi trước khi focus vào một trường (có thể dùng để mở collapse/tab chứa trường đó)
     */
    const initValidation = (validateFn, fieldsOrder, onFocusField = null) => {
        validateFieldFunction = validateFn;
        fieldOrderArray = fieldsOrder;
        onFocusFieldCallback = onFocusField;

        fieldsOrder.forEach((field) => {
            errors.value[field] = "";
            if (!(field in inputRefs)) {
                inputRefs[field] = null;
            }
        });
    };

    const showAlert = (message) => {
        errorMessage.value = message;
        showConfirm.value = true;
    };

    const handleBlur = (field) => {
        if (validateFieldFunction) {
            validateFieldFunction(field);
        }
    };

    const validateForm = () => {
        if (!validateFieldFunction) return true;

        fieldOrderArray.forEach((field) => {
            validateFieldFunction(field);
        });

        return !Object.values(errors.value).some(Boolean);
    };

    const focusFirstInvalidInput = async () => {
        await nextTick();
        for (const field of fieldOrderArray) {
            if (errors.value[field]) {
                showAlert(errors.value[field]);
                lastFocusField.value = field;
                if (onFocusFieldCallback) {
                    onFocusFieldCallback(field);
                }
                break;
            }
        }
    };

    const modelClose = () => {
        showConfirm.value = false;
        errorMessage.value = "";

        if (lastFocusField.value) {
            const component = inputRefs[lastFocusField.value];
            if (component) {
                let targetEl = null;

                if (typeof component.focusInput === "function") {
                    component.focusInput();
                    targetEl = component.$el;
                } else if (typeof component.focus === "function") {
                    component.focus();
                    targetEl = component.$el;
                } else if (component.$el && typeof component.$el.focus === "function") {
                    component.$el.focus();
                    targetEl = component.$el;
                } else if (component.focusPicker && typeof component.focusPicker === "function") {
                    component.focusPicker();
                    targetEl = component.$el;
                }

                // Thực hiện scroll nếu tìm thấy phần tử
                if (targetEl) {
                    setTimeout(() => {
                        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 100);
                }
            }
        }
    };

    const resetErrors = () => {
        fieldOrderArray.forEach((field) => {
            errors.value[field] = "";
        });
        showConfirm.value = false;
        errorMessage.value = "";
        lastFocusField.value = null;
    };

    return {
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
        showAlert,
        lastFocusField,
    };
}
