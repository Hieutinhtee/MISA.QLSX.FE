<script setup>
import { ref, defineModel, computed, watch, onMounted } from "vue";
import { Tooltip } from "ant-design-vue";

//#region Props
/**
 * Giá trị của input
 * @property {string} value - Giá trị của input.
 * createdBy: TMHieu (29/01/2026)
 */
const modelValue = defineModel();

/**
 * Trạng thái hợp lệ
 * createdBy: TMHieu (29/01/2026)
 */
const isValid = defineModel("isValid");

/**
 * Trạng thái submit của form gửi xuống
 * nếu submit thì validate giá trị trên tất cả input
 * createdBy: TMHieu (29/01/2026)
 */
const isSubmit = defineModel("isSubmit");

/**
 * Khai báo props truyền vào
 * @property {string} type - Loại input. Giá trị hợp lệ: 'text', 'name', 'phone'.
 * @property {boolean} required - Trường bắt buộc hay không. Giá trị hợp lệ: true, false.
 * @property {string} placeholder - Giá trị hợp lệ: 'text', 'name', 'phone'.
 * @property {boolean} disabled - Disable input hay không. Giá trị hợp lệ: true, false.
 * @property {string} error - Lỗi nghiệp vụ riêng gửi xuống từ form.
 * @property {string} label - Tieu de cua input
 * @property {number} maxLength - Giới hạn số ký tự trên input
 * @property {boolean} firstFocus - Focus về input năm đầu tiên khi mở form
 * createdBy: TMHieu (29/01/2026)
 */
const props = defineProps({
    type: {
        type: String,
        default: "text",
        validator: (value) => ["text", "name", "email", "phone"].includes(value),
    },
    width: {
        type: [String, Number],
        default: "100%",
    },
    required: {
        type: Boolean,
        default: false,
    },
    placeholder: {
        type: String,
        default: "",
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    error: {
        type: String,
        default: "",
    },
    label: {
        type: String,
        default: "",
    },
    maxLength: {
        type: Number,
        default: null,
    },
    firstFocus: {
        type: Boolean,
        default: false,
    },
});

//#endregion Props

//#region Emits

//#endregion Emits

//#region State Data

/**
 * ref của input
 * createdBy: TMHieu (29/01/2026)
 */
const inputRef = ref(null);

/**
 * Trạng thái đã chạm vào ô input
 * createdBy: TMHieu (29/01/2026)
 */
const touched = ref(false);
//#endregion State Data

//#region Computed
/**
 * Style input, ở đây là width theo px
 * createdBy: TMHieu (29/01/2026)
 */
const inputStyle = computed(() => {
    if (typeof props.width === "number") {
        return { width: `${props.width}px` };
    }
    return { width: props.width };
});

/**
 * Thông báo lỗi nội bộ chung
 * createdBy: TMHieu (29/01/2026)
 */
const internalError = computed(() => {
    if (props.required && !modelValue.value) {
        return ` không được để trống`;
    }

    if (props.type === "phone" && modelValue.value) {
        if (!/^\d{10}$/.test(modelValue.value)) {
            return "Số điện thoại không hợp lệ";
        }
    }

    if (props.type === "email" && modelValue.value) {
        if (!/^\S+@\S+\.\S+$/.test(modelValue.value)) {
            return "Email không hợp lệ";
        }
    }

    return "";
});

/**
 * Thông báo lỗi hiển thị nếu có lỗi nghiệp vụ riêng gửi xuống từ form
 * hoặc lỗi nội bộ
 * createdBy: TMHieu (29/01/2026)
 */
const displayError = computed(() => {
    if (isSubmit.value) {
        if (props.error) return props.error;
        return internalError.value;
    }
    if (!touched.value) return "";
    if (props.error) return props.error;
    return internalError.value;
});

//#endregion Computed

//#region Watchers
/**
 * Reset trạng thái đã chạm khi giá trị thay đổi
 * createdBy: TMHieu (29/01/2026)
 */
watch(modelValue, () => {
    if (touched.value) {
        touched.value = false;
        isSubmit.value = false;
    }
});

/**
 * Reset trạng thái chạm với input trong form khi submit
 * createdBy: TMHieu (29/01/2026)
 */
watch(isSubmit, () => {
    if (isSubmit.value) {
        touched.value = true;
    }
    if (!isValid.value) {
        inputRef.value.focus();
    }
});

/**
 * Cập nhật trạng thái hợp lệ của input
 * thông báo cho form
 * createdBy: TMHieu (29/01/2026)
 */
watch(
    [() => props.error, internalError],
    ([externalError, internalErr]) => {
        isValid.value = !externalError && !internalErr;
    },
    { immediate: true },
);

/**
 * Chặn paste vượt quá maxLength
 * createdBy: TMHieu (29/01/2026)
 * @param e - Sự kiện thay đổi ô input
 */
const handleInput = (e) => {
    if (props.maxLength && e.target.value.length > props.maxLength) {
        modelValue.value = e.target.value.slice(0, props.maxLength);
    }
};
//#endregion Watchers

//#region Lifecycle Hooks
/**
 * Focus với input khi component mount
 * createdBy: TMHieu (29/01/2026)
 */
onMounted(() => {
    if (props.firstFocus && inputRef.value) {
        inputRef.value.focus();
    }
});

//#endregion Lifecycle Hooks
</script>

<template>
    <tooltip placement="bottom" :align="{ offset: [0, -4] }">
        <template v-if="displayError" #title>
            <span>{{ displayError }}</span>
        </template>
        <input
            ref="inputRef"
            :class="{ 'input--error': displayError }"
            :style="inputStyle"
            v-model="modelValue"
            :disabled="disabled"
            :placeholder="placeholder"
            :maxlength="maxLength || undefined"
            @blur="touched = true"
            @input="handleInput"
        />
    </tooltip>
</template>

<style scoped>
input {
    height: 27px;
    width: 100%;
    min-width: 0;
    padding: 5px 12px;
    border-radius: var(--border-radius);
    outline: none;
    border: 0.5px solid #d1d5db;
}

input::placeholder {
    color: #9e9e9e;
    font-size: 14px;
}

input:focus {
    border-color: var(--primary-color);
}

input:hover {
    border-color: var(--primary-color);
}

.form-candidate__text-error {
    color: red;
    font-size: 12px;
    margin-top: 5px;
}
</style>
