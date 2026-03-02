<script setup>
import { Select } from "ant-design-vue";
import { ref } from "vue";

/**
 * Props của component MsSelect
 * @property {Array} options - Mảng các tùy chọn để hiển thị trong Select. {value: string, label: string}
 * createdBy: TMHieu (28/01/2026)
 */
const props = defineProps({
    options: {
        type: Array,
        default: () => [],
    },
});

//#region State Data

/**
 * Giá trị được chọn trong Select
 * createdBy: TMHieu (28/01/2026)
 */
const value = defineModel({
    type: [String, Number, Array, Object],
    default: undefined,
});
//#endregion State Data

//#region Methods

/**
 * Hàm lọc các tùy chọn trong Select dựa trên giá trị nhập vào
 * createdBy: TMHieu (28/01/2026)
 * @param {string} input - Giá trị nhập vào trong ô tìm kiếm
 * @param {Object} option - Tùy chọn hiện tại để so sánh
 * @returns {boolean} - Trả về true nếu tùy chọn phù hợp với giá trị nhập, ngược lại false
 */
const filterOption = (input, option) => {
    return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};
//#endregion Methods
</script>

<template>
    <Select
        v-model:value="value"
        show-search
        :options="options"
        class="w-100 ms-select"
        height="12"
    >
        <template #suffixIcon> <slot></slot> </template>
    </Select>
</template>

<style>
.ant-select .ant-select-selector {
    height: 28px !important;
    font-size: 13px !important;
    line-height: 28px !important;
    align-items: center !important;
}
</style>
