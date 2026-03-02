<script setup>
/**
 * Giá trị của input
 * @property {string} value - Giá trị của input.
 * createdBy: TMHieu (29/01/2026)
 */
const modelValue = defineModel();
</script>

<template>
    <textarea v-model="modelValue" type="textarea"></textarea>
</template>

<style scoped>
textarea {
    height: 68px;
    width: 474px;
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
</style>
