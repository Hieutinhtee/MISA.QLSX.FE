<template>
    <div class="ms-select" :class="{ 'ms-select--error': isInvalid, 'ms-select--focus': isFocus }">
        <tooltip placement="top" :align="{ offset: [0, 4] }" :trigger="['hover', 'focus']">
            <template v-if="showTooltip" #title>
                <span>dữ liệu không có trong danh sách</span>
            </template>
            <input
                ref="inputRef"
                v-model="searchValue"
                class="ms-select__input"
                @focus="handleFocus"
                @blur="handleBlur"
                @input="handleInput"
                @click="selectAll"
                @mouseenter="handleHover"
            />
        </tooltip>

        <div class="ms-select__icon" @mousedown.prevent="toggleDropdown"></div>

        <div
            v-if="isOpen"
            class="ms-select__dropdown"
            :class="{
                'ms-select__dropdown--bottom': dropdownPosition !== 'top',
                'ms-select__dropdown--top': dropdownPosition === 'top',
            }"
        >
            <template v-if="filteredOptions.length">
                <div
                    v-for="item in filteredOptions"
                    :key="item.value"
                    class="ms-select__option"
                    :class="{ 'ms-select__option--selected': item.value === selectedValue }"
                    @mousedown.prevent="selectOption(item)"
                >
                    {{ item.label }}
                    <div v-if="item.value === selectedValue" class="ms-select__check"></div>
                </div>
            </template>

            <div v-else class="ms-select__empty">Không có dữ liệu hiển thị</div>
        </div>
    </div>
</template>

<script setup>
import { Tooltip } from "ant-design-vue";
import { ref, computed, watch } from "vue";

const props = defineProps({
    modelValue: [String, Number],
    options: {
        type: Array,
        default: () => [],
    },
    dropdownPosition: {
        type: String,
        default: "bottom", // bottom | top | auto
    },
});

const emit = defineEmits(["update:modelValue"]);

const isTyping = ref(false);
const inputRef = ref(null);
const searchValue = ref("");
const isOpen = ref(false);
const isFocus = ref(false);
const isInvalid = ref(false);
const showTooltip = ref(false);

const filteredOptions = computed(() => {
    if (!isTyping.value) return props.options;

    if (!searchValue.value) return props.options;

    return props.options.filter((o) =>
        o.label.toLowerCase().includes(searchValue.value.toLowerCase()),
    );
});

const selectedValue = ref();

watch(
    () => props.modelValue,
    (val) => {
        const found = props.options.find((o) => o.value === val);
        if (found) searchValue.value = found.label;
    },
    { immediate: true },
);

function handleHover() {
    if (isInvalid.value) {
        showTooltip.value = true;
    }
}

function handleFocus() {
    isFocus.value = true;
    isOpen.value = true;
    isTyping.value = false;
}

function handleBlur() {
    isFocus.value = false;
    isOpen.value = false;

    const found = props.options.find(
        (o) => o.label.toLowerCase() === searchValue.value.toLowerCase(),
    );

    if (!found) {
        isInvalid.value = true;

        // reset lại option đã chọn
        const selected = props.options.find((o) => o.value === props.modelValue);
        if (selected) {
            searchValue.value = selected.label;
        } else {
            searchValue.value = "";
        }
    } else {
        isInvalid.value = false;
    }
}

function handleInput() {
    isTyping.value = true;
    isOpen.value = true;

    const found = filteredOptions.value.length > 0;

    isInvalid.value = !found;
}

function selectOption(item) {
    emit("update:modelValue", item.value);
    selectedValue.value = item.value;
    searchValue.value = item.label;

    isInvalid.value = false;
    isOpen.value = false;
    isTyping.value = false;
}

function selectAll() {
    if (inputRef.value) {
        inputRef.value.select();
    }

    isOpen.value = true;
    isTyping.value = false;
}

watch(isOpen, (val) => {
    if (val) {
        isTyping.value = false;
        showTooltip.value = false;

        const selected = props.options.find((o) => o.value === props.modelValue);
        if (selected) {
            searchValue.value = selected.label;
        }
    }
});
function toggleDropdown() {
    isOpen.value = !isOpen.value;

    if (isOpen.value) {
        inputRef.value?.focus();
    }
}
</script>

<style scoped>
.ms-select {
    position: relative;
}

.ms-select__input {
    width: 100%;
    height: 28px;
    padding: 5px 8px 5px 12px;
    border: 1px solid #c8c8c8;
    border-radius: 4px;
    outline: none;
}

.ms-select--focus .ms-select__input {
    border-color: #22a06b;
}

.ms-select--error .ms-select__input {
    border-color: red;
}

.ms-select__icon {
    position: absolute;
    right: 8px;
    top: 20%;
    -webkit-mask-image: url(/src/assets/icon/svg/Icon_QLSX.svg);
    mask-position: -202px -18px;
    background-color: #4b5563;
    width: 16px;
    height: 16px;
}

.ms-select__dropdown {
    position: absolute;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    /* max-height: 200px; */
    overflow: auto;
}

.ms-select__dropdown--top {
    bottom: 36px;
}

.ms-select__dropdown--bottom {
    top: 36px;
}

.ms-select__option {
    padding: 7px 12px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    font-weight: 400 !important;
}

.ms-select__option:not(.ms-select__option--selected):hover {
    background: #f3f4f6;
}

.ms-select__option--selected {
    background: #d0fbe7;
    color: var(--primary-color);
}

.ms-select__check {
    width: 10px;
    height: 5.67px;
    border-width: 0 0 1px 1px;
    border-style: solid;
    border-color: #009b71;
    transform: translateY(4px) rotate(-45deg);
}

.ms-select__empty {
    padding: 8px;
    color: #888;
}
</style>
