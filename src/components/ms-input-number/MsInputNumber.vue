<script setup>
import { InputNumber, Tooltip } from "ant-design-vue";

/**
 * Giá trị của input number
 * createdBy: TMHieu
 */
const value = defineModel("value");

const props = defineProps({
    error: {
        type: String,
        default: "",
    },
    min: {
        type: Number,
        default: undefined,
    },
    max: {
        type: Number,
        default: undefined,
    },
});
</script>

<template>
    <tooltip placement="bottom" :align="{ offset: [0, -4] }">
        <template v-if="error" #title>
            <span class="tooltip-error">{{ error }}</span>
        </template>
        <InputNumber
            v-bind="$attrs"
            v-model:value="value"
            :min="min"
            :max="max"
            class="ms-input-number"
            :class="{ 'ms-input-number--error': error }"
        ></InputNumber>
    </tooltip>
</template>

<style scoped>
.ms-input-number {
    width: 100%;
}

.ms-input-number--error {
    border-color: red !important;
}

.tooltip-error {
    display: inline-block;
    max-width: 240px;
    white-space: normal;
    word-break: break-word;
}
</style>
