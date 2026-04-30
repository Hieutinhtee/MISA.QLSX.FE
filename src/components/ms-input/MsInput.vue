<script setup>
import { ref, defineModel, computed, watch, onMounted, nextTick } from "vue";
import { Tooltip } from "ant-design-vue";

//#region Props

/**
 * Giá trị của input
 * @property {string} value - Giá trị của input.
 * createdBy: TMHieu (29/01/2026)
 */
const modelValue = defineModel();

/**
 * Khai báo props truyền vào
 * @property {string} type - Loại input. Giá trị hợp lệ: 'text', 'name', 'phone'.
 * @property {boolean} required - Trường bắt buộc hay không. Giá trị hợp lệ: true, false.
 * @property {string} placeholder - Giá trị hợp lệ: 'text', 'name', 'phone'.
 * @property {boolean} disabled - Disable input hay không. Giá trị hợp lệ: true, false.
 * @property {string} error - Lỗi nghiệp vụ riêng gửi xuống từ form.
 * @property {string} label - Tieu de cua input
 * @property {number} maxLength - Giới hạn số ký tự trên input
 * @property {boolean} firstFocus - Focus về input năm đầu tiên khi mở form
 * createdBy: TMHieu (29/01/2026)
 */
const props = defineProps({
    type: {
        type: String,
        default: "text",
        validator: (value) => ["text", "name", "email", "phone", "HH:MM"].includes(value),
    },
    width: {
        type: [String, Number],
        default: "100%",
    },
    required: {
        type: Boolean,
        default: false,
    },
    placeholder: {
        type: String,
        default: "",
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    error: {
        type: String,
        default: "",
    },
    label: {
        type: String,
        default: "",
    },
    maxLength: {
        type: Number,
        default: null,
    },
    firstFocus: {
        type: Boolean,
        default: false,
    },
});

//#endregion Props

/**
 * Định nghĩa sự kiện emit ra ngoài
 * @event blur - Sự kiện blur của input
 * @event focus - Sự kiện focus của input
 * createdBy: TMHieu (29/01/2026)
 */
const emit = defineEmits(["blurInput", "focus"]);

//#region State Data

/**
 * ref của input
 * createdBy: TMHieu (29/01/2026)
 */
const inputRef = ref(null);

//#endregion State Data

//#region Computed
/**
 * Style input, ở đây là width theo px
 * createdBy: TMHieu (29/01/2026)
 */
const inputStyle = computed(() => {
    if (typeof props.width === "number") {
        return { width: `${props.width}px` };
    }
    return { width: props.width };
});

//#endregion Computed

//#region Watchers

const displayError = computed(() => props.error);

/**
 * Chặn paste vượt quá maxLength
 * createdBy: TMHieu (29/01/2026)
 * @param e - Sự kiện thay đổi ô input
 */
const handleInput = (e) => {
    if (props.maxLength && e.target.value.length > props.maxLength) {
        modelValue.value = e.target.value.slice(0, props.maxLength);
    }
};

/**
 * Watcher để tự động cắt chuỗi về đúng định dạng HH:MM nếu type là HH:MM
 * ví dụ khi người dùng nhập 123456 thì sẽ tự động cắt thành 12:34
 * hoăc khi modelValue được set từ bên ngoài là 12:34:56 thì cũng sẽ tự động cắt thành 12:34
 * createdBy: TMHieu (29/01/2026)
 */
watch(
    () => modelValue.value,
    (val) => {
        if (props.type === "HH:MM" && typeof val === "string") {
            // Nếu là dạng HH:mm:ss thì cắt còn HH:mm
            if (/^\d{2}:\d{2}:\d{2}$/.test(val)) {
                modelValue.value = val.slice(0, 5);
            }
        }
    },
    { immediate: true },
);
//#endregion Watchers

//#region Time Picker
/**
 * Trạng thái mở time picker
 * createdBy: TMHieu (29/01/2026)
 */
const isOpenTimeOption = ref(false);

// Tạo danh sách 00:00 → 23:30 mỗi 30 phút
const timeOptions = computed(() => {
    const result = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hh = String(h).padStart(2, "0");
            const mm = String(m).padStart(2, "0");
            result.push(`${hh}:${mm}`);
        }
    }
    return result;
});

/**
 * Xử lý sự kiện nhập liệu cho time picker
 * - Tự động thêm dấu ":" sau khi nhập 2 số đầu tiên
 * - Giới hạn giờ từ 00 đến 23 và phút chỉ cho phép max 59
 *
 * createdBy: TMHieu (29/01/2026)
 * @param e - Sự kiện thay đổi ô input
 */
const handleInputTime = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4); // chỉ 4 số

    if (raw.length < 4) {
        modelValue.value = raw;
        return;
    }

    let hh = parseInt(raw.slice(0, 2));
    let mm = parseInt(raw.slice(2, 4));

    // Giới hạn giờ
    if (hh > 23) hh = 23;

    // Chỉ cho tối đa 59
    if (mm > 59) {
        mm = 59;
    }

    const formatted = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");

    modelValue.value = formatted;
};

/**
 * Xử lý khi click vào icon đồng hồ để mở dropdown và focus vào input
 * createdBy: TMHieu (29/01/2026)
 */
const selectTime = (time) => {
    modelValue.value = time;
    isOpenTimeOption.value = false;
};
//#endregion Time Picker

//#region Lifecycle Hooks
/**
 * Focus với input khi component mount
 * createdBy: TMHieu (29/01/2026)
 */
onMounted(() => {
    if (props.firstFocus && inputRef.value) {
        inputRef.value.focus();
    }
});
//#endregion Lifecycle Hooks

/**
 * Expose hàm focus để component cha gọi
 * createdBy: TMHieu
 */
defineExpose({
    focusInput: () => {
        inputRef.value?.focus();
    },
});
</script>

<template>
    <div v-if="type === 'HH:MM'" class="time-wrapper" :style="inputStyle">
        <tooltip placement="bottom" :align="{ offset: [0, -4] }">
            <template v-if="displayError" #title>
                <span class="tooltip-error">{{ displayError }}</span>
            </template>
            <input
                ref="inputRef"
                class="time-input"
                :class="{ 'input--error': displayError }"
                :disabled="disabled"
                :value="modelValue"
                @input="handleInputTime"
                @blur="$emit('blurInput')"
                @focus="$emit('focus')"
                placeholder="HH:MM"
                maxlength="5"
            />
        </tooltip>
        <!-- Icon -->
        <div class="time-icon" @click="isOpenTimeOption = !isOpenTimeOption"></div>

        <!-- Dropdown -->
        <div v-if="isOpenTimeOption" class="time-dropdown">
            <div
                v-for="time in timeOptions"
                :key="time"
                class="time-option"
                @click="selectTime(time)"
            >
                {{ time }}
            </div>
        </div>
    </div>
    <tooltip placement="bottom" :align="{ offset: [0, -4] }">
        <template v-if="displayError" #title>
            <span class="tooltip-error">{{ displayError }}</span>
        </template>
        <input
            v-if="type != 'HH:MM'"
            ref="inputRef"
            :class="{ 'input--error': displayError }"
            :style="inputStyle"
            v-model="modelValue"
            :disabled="disabled"
            :placeholder="placeholder"
            :maxlength="maxLength || undefined"
            @input="handleInput"
            @blur="$emit('blurInput')"
            @focus="$emit('focus')"
        />
    </tooltip>
</template>

<style scoped>
input {
    height: 32px;
    width: 100%;
    min-width: 0;
    padding: 0 12px;
    box-sizing: border-box;
    border-radius: var(--border-radius);
    outline: none;
    border: 0.5px solid #d1d5db;
}

input::placeholder {
    color: #9e9e9e;
    font-size: 14px;
}

input:focus {
    border-color: var(--primary-color);
}

input:hover {
    border-color: var(--primary-color);
}

.form-candidate__text-error {
    color: red;
    font-size: 12px;
    margin-top: 5px;
}
</style>
<style scoped>
.time-wrapper {
    position: relative;
    display: inline-block;
}

.time-input {
    height: 32px;
    width: 100%;
    padding: 0 28px 0 12px;
    box-sizing: border-box;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    outline: none;
}

.time-input:focus {
    border-color: #00a896;
}

.time-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    font-size: 14px;
    height: 16px;
    width: 16px;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url(/src/assets/icon/svg/time-icon.svg);
}

.time-dropdown {
    position: absolute;
    top: 110%;
    left: 0;
    width: 100%;
    height: 180px;
    overflow-y: auto;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    z-index: 999999999;
}

.time-option {
    padding: 6px 10px;
    cursor: pointer;
    text-align: center;
}

.time-option:hover {
    background-color: #f3f4f6;
}

.tooltip-error {
    display: inline-block;
    max-width: 240px;
    white-space: normal;
    word-break: break-word;
}
</style>
