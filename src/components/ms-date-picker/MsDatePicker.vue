<script setup>
import { nextTick, ref } from "vue";
import { DatePicker, Tooltip } from "ant-design-vue";

/**
 * Giá trị của input
 * @property {string} value - Giá trị của input.
 * createdBy: TMHieu (29/01/2026)
 */
const value = defineModel();

const props = defineProps({
    error: {
        type: String,
        default: "",
    },
});

const emit = defineEmits(["blurInput"]);

const datePickerRef = ref(null);

/**
 * Xử lý khi blur hoặc change
 * Sử dụng nextTick để đảm bảo modelValue đã được cập nhật trước khi emit validate
 * createdBy: TMHieu (30/04/2026)
 */
const onBlurOrChange = () => {
    nextTick(() => {
        emit("blurInput");
    });
};

defineExpose({
    focus: () => {
        datePickerRef.value?.$el?.focus();
        // Một số phiên bản Ant Design Vue cần gọi focus trực tiếp trên component instance
        if (datePickerRef.value?.focus) {
            datePickerRef.value.focus();
        }
    },
});
</script>

<template>
    <tooltip placement="bottom" :align="{ offset: [0, -4] }">
        <template v-if="error" #title>
            <span class="tooltip-error">{{ error }}</span>
        </template>
        <DatePicker
            ref="datePickerRef"
            v-bind="$attrs"
            v-model:value="value"
            :status="error ? 'error' : ''"
            class="w-100 ms-date-picker"
            @blur="onBlurOrChange"
            @change="onBlurOrChange"
        ></DatePicker>
    </tooltip>
</template>

<style scoped>
.ms-date-picker :deep(.ant-picker) {
    width: 100%;
    box-sizing: border-box;
}

.ms-date-picker--error {
    border-color: red !important;
}

.tooltip-error {
    display: inline-block;
    max-width: 240px;
    white-space: normal;
    word-break: break-word;
}
</style>
