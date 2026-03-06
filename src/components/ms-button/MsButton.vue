<template>
    <tooltip placement="top" :align="{ offset: [0, 4] }" :trigger="['hover', 'focus']">
        <template v-if="tooltip" #title>
            <span>{{ tooltip }}</span> </template
        ><button
            class="ms-button d-flex align-items-center"
            :class="[`ms-button--${type}`, { 'ms-button--disabled': disabled }]"
            :disabled="disabled"
        >
            <div v-if="iconLeft" :class="[`${iconLeft}`]" class="ms-button__icon"></div>
            <span v-if="$slots.default" class="ms-button__text">
                <slot></slot>
            </span>
        </button>
    </tooltip>
</template>

<script setup>
import { Tooltip } from "ant-design-vue";

defineProps({
    type: {
        type: String,
        default: "primary",
    },
    /** Class icon bên trái */
    iconLeft: {
        type: Array,
        default: null,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    tooltip: {
        type: String,
        default: null,
    },
});
</script>

<style scoped>
.ms-button {
    height: 28px;
    padding: 6px 12px;
    border: none;
    cursor: pointer;
}

.ms-button__icon {
    width: 16px;
    height: 16px;
    margin-right: 4px;
}

.ms-button__text {
    font-weight: 500;
}
/* ============================================ */
/* PRIMARY BUTTON (Main button)                 */
/* ============================================ */

.ms-button--primary {
    background-color: var(--primary-color);
    color: #ffffff;
    border-radius: 4px;
}

.ms-button--primary:hover:not(:disabled) {
    background-color: #007b5d;
}

/* ============================================ */
/* OUTLINE BUTTON                               */
/* ============================================ */

.ms-button--outline {
    background-color: #ffffff;
    color: #111827;
    border: 1px solid #d1d5db;
    border-radius: var(--border-radius);
}

.ms-button--outline:hover:not(:disabled) {
    background-color: #f3f4f6;
}

/* ============================================ */
/* DANGER BUTTON                               */
/* ============================================ */

.ms-button--danger {
    background-color: #dc2626;
    color: white;
    border-radius: var(--border-radius);
}

.ms-button--danger:hover:not(:disabled) {
    background-color: #b91c1c;
}

/* ============================================ */
/* DANGER OUTLINE BUTTON                               */
/* ============================================ */

.ms-button--danger-outline {
    border: 1px solid #dc2626;
    color: #dc2626;
    border-radius: var(--border-radius);
    background-color: white;
}

.ms-button--danger-outline .ms-button__icon {
    background-color: #dc2626 !important;
}

.ms-button--danger-outline:hover:not(:disabled) {
    background-color: #fee2e2;
}

/* ============================================ */
/* PRIMARY OUTLINE BUTTON               */
/* ============================================ */

.ms-button--primary-outline {
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    border-radius: 4px;
    background-color: white;
}

.ms-button--primary-outline .ms-button__icon {
    background-color: var(--primary-color) !important;
}

.ms-button--primary-outline:hover:not(:disabled) {
    background-color: #dcfce7;
}

/* ============================================ */
/* PRIMARY TEXT ONLY BUTTON               */
/* ============================================ */

.ms-button--text {
    border: none;
    color: var(--primary-color);
    border-radius: 4px;
    background-color: white;
    padding: 6px;
}

.ms-button--text:hover:not(:disabled) {
    text-decoration: underline;
}

/* ============================================ */
/* GHOST BUTTON               */
/* ============================================ */

.ms-button--ghost {
    border-radius: 4px;
    background-color: #f3f4f6;
}

.ms-button--ghost:hover:not(:disabled) {
    background-color: #e5e7eb;
}
</style>
