<script setup>
import { Tooltip } from "ant-design-vue";

/**
 * Giá trị của input
 * @property {string} value - Giá trị của input.
 * createdBy: TMHieu (29/01/2026)
 */
const modelValue = defineModel();

const props = defineProps({
    error: {
        type: String,
        default: "",
    },
});

const emit = defineEmits(["blurInput", "update:modelValue"]);
</script>

<template>
    <tooltip placement="bottom" :align="{ offset: [0, -4] }">
        <template v-if="error" #title>
            <span class="tooltip-error">{{ error }}</span>
        </template>
        <textarea 
            v-model="modelValue" 
            type="textarea"
            :class="{ 'ms-textarea--error': error }"
            @blur="emit('blurInput')"
        ></textarea>
    </tooltip>
</template>

<style scoped>
textarea {
    height: 68px;
    width: 100%;
    min-width: 0;
    padding: 6px 10px;
    border-radius: var(--border-radius);
    outline: none;
    border: 1px solid #dcdce3;
}

textarea::placeholder {
    color: #9e9e9e;
    font-size: 14px;
}

textarea:focus {
    border-color: var(--primary-color);
}

textarea:hover {
    border-color: var(--primary-color);
}

.ms-textarea--error {
    border-color: red !important;
}

.tooltip-error {
    display: inline-block;
    max-width: 240px;
    white-space: normal;
    word-break: break-word;
}
</style>
