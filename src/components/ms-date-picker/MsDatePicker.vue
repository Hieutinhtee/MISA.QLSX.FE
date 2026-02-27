<script setup>
import { DatePicker } from "ant-design-vue";

/**
 * Giá trị của input
 * @property {string} value - Giá trị của input.
 * createdBy: TMHieu (29/01/2026)
 */
const value = defineModel();
</script>

<template>
    <DatePicker v-model:value="value" class="w-100"></DatePicker>
</template>

<style></style>
