<template>
    <button
        class="ms-button d-flex align-items-center"
        :class="[`ms-button--${type}`, { 'ms-button--disabled': disabled }]"
        :disabled="disabled"
        @click="$emit('click', $event)"
    >
        <div v-if="iconLeft" :class="[`icon-${iconLeft}`]" class="ms-button__icon"></div>
        <span v-if="$slots.default" class="ms-button__text">
            <slot></slot>
        </span>
    </button>
</template>

<script setup>
defineProps({
    type: {
        type: String,
        default: "primary",
    },
    /** Class icon bên trái */
    iconLeft: {
        type: String,
        default: null,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

defineEmits(["click"]);
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
</style>
