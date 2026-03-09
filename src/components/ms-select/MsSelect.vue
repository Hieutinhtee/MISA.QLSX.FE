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
                :placeholder="placeholder"
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

//#region Props & Emits
/**
 * Khai báo props nhận từ component cha
 * createdBy: TMHieu
 */
const props = defineProps({
    modelValue: [String, Number],
    options: {
        type: Array,
        default: () => [],
    },
    /**
     * Kiểu dữ liệu filter
     * dùng để lọc option theo type
     * ví dụ: text | number | boolean | date
     */
    type: {
        type: String,
        default: "text",
    },
    /**
     * Vị trí hiển thị dropdown
     * bottom | top
     */
    dropdownPosition: {
        type: String,
        default: "bottom",
    },
    /**
     * Placeholder hiển thị trong input
     */
    placeholder: {
        type: String,
        default: "Chọn giá trị",
    },
});

/**
 * Emit cập nhật giá trị cho v-model
 * createdBy: TMHieu
 */
const emit = defineEmits(["update:modelValue"]);
//#endregion

//#region State
/**
 * Cờ xác định người dùng đang gõ để search
 */
const isTyping = ref(false);

/**
 * ref tới input để thao tác DOM (select text)
 */
const inputRef = ref(null);

/**
 * Giá trị hiển thị trong input
 */
const searchValue = ref("");

/**
 * Trạng thái mở dropdown
 */
const isOpen = ref(false);

/**
 * Trạng thái focus của input
 */
const isFocus = ref(false);

/**
 * Trạng thái dữ liệu nhập không hợp lệ
 */
const isInvalid = ref(false);

/**
 * Trạng thái hiển thị tooltip lỗi
 */
const showTooltip = ref(false);
//#endregion

//#region Computed

/**
 * Lọc option theo type được truyền từ props
 * Ví dụ:
 * type = text → chỉ hiển thị option text
 * type = number → chỉ hiển thị option number
 *
 * createdBy: TMHieu
 */
const optionsByType = computed(() => {
    if (!props.type) return props.options;

    return props.options.filter((o) => {
        if (!o.type) return true;
        return o.type.includes(props.type);
    });
});

/**
 * Danh sách option hiển thị trong dropdown
 * - Nếu không search → hiển thị toàn bộ options theo type
 * - Nếu đang search → lọc theo label
 *
 * createdBy: TMHieu
 */
const filteredOptions = computed(() => {
    const options = optionsByType.value;

    if (!isTyping.value) return options;

    if (!searchValue.value) return options;

    return options.filter((o) => o.label.toLowerCase().includes(searchValue.value.toLowerCase()));
});

/**
 * Giá trị option đang được chọn
 */
const selectedValue = ref();
//#endregion

//#region Watchers

/**
 * Theo dõi modelValue từ component cha
 * để đồng bộ label hiển thị trong input
 *
 * createdBy: TMHieu
 */
watch(
    () => props.modelValue,
    (val) => {
        const found = optionsByType.value.find((o) => o.value === val);
        if (found) searchValue.value = found.label;
    },
    { immediate: true },
);

/**
 * Theo dõi trạng thái mở dropdown
 * khi mở dropdown thì reset trạng thái search
 *
 * createdBy: TMHieu
 */
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
//#endregion

//#region Methods

/**
 * Hiển thị tooltip khi hover nếu dữ liệu không hợp lệ
 *
 * createdBy: TMHieu
 */
function handleHover() {
    if (isInvalid.value) {
        showTooltip.value = true;
    }
}

/**
 * Xử lý khi focus vào input
 * mở dropdown và reset trạng thái search
 *
 * createdBy: TMHieu
 */
function handleFocus() {
    isFocus.value = true;
    isOpen.value = true;
    isTyping.value = false;
}

/**
 * Xử lý khi blur input
 * kiểm tra dữ liệu nhập có tồn tại trong options hay không
 *
 * createdBy: TMHieu
 */
function handleBlur() {
    isFocus.value = false;
    isOpen.value = false;

    const found = optionsByType.value.find(
        (o) => o.label.toLowerCase() === searchValue.value.toLowerCase(),
    );

    if (!found) {
        isInvalid.value = true;

        // reset lại option đã chọn trước đó
        const selected = optionsByType.value.find((o) => o.value === props.modelValue);

        if (selected) {
            searchValue.value = selected.label;
        } else {
            searchValue.value = "";
        }
    } else {
        isInvalid.value = false;
    }
}

/**
 * Xử lý khi người dùng nhập để search option
 *
 * createdBy: TMHieu
 */
function handleInput() {
    isTyping.value = true;
    isOpen.value = true;

    const found = filteredOptions.value.length > 0;

    isInvalid.value = !found;
}

/**
 * Chọn option từ dropdown
 * emit giá trị lên component cha
 *
 * @param {object} item - option được chọn
 * createdBy: TMHieu
 */
function selectOption(item) {
    emit("update:modelValue", item.value);
    selectedValue.value = item.value;
    searchValue.value = item.label;

    isInvalid.value = false;
    isOpen.value = false;
    isTyping.value = false;
}

/**
 * Select toàn bộ text khi click input
 *
 * createdBy: TMHieu
 */
function selectAll() {
    if (inputRef.value) {
        inputRef.value.select();
    }

    isOpen.value = true;
    isTyping.value = false;
}

/**
 * Toggle mở / đóng dropdown
 *
 * createdBy: TMHieu
 */
function toggleDropdown() {
    isOpen.value = !isOpen.value;

    if (isOpen.value) {
        inputRef.value?.focus();
    }
}
//#endregion
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
