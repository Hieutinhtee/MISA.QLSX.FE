<script setup>
import { defineProps, defineEmits, onMounted, onBeforeUnmount } from "vue";
import { Modal } from "ant-design-vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";

const props = defineProps({
    title: {
        type: String,
        default: "Tiêu đề form",
    },
    width: {
        type: [String, Number],
        default: "760px",
    },
    showSaveAndAdd: {
        type: Boolean,
        default: true,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    // Trạng thái mở/đóng (v-model)
    open: {
        type: Boolean,
        default: false,
    },
    // Props cho validation (từ useFormValidation)
    showErrorAlert: {
        type: Boolean,
        default: false,
    },
    errorMessage: {
        type: String,
        default: "",
    },
});

const emit = defineEmits([
    "update:open",
    "submit",
    "submitAndAdd",
    "cancel",
    "closeAlert"
]);

/**
 * Xử lý đóng form
 */
const handleCancel = () => {
    emit("update:open", false);
    emit("cancel");
};

/**
 * Xử lý phím tắt
 */
const handleKeydown = (e) => {
    if (!props.open) return;

    // Ctrl + Shift + S: Lưu và thêm
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        if (props.showSaveAndAdd) {
            e.preventDefault();
            emit("submitAndAdd");
        }
        return;
    }

    // Ctrl + S: Lưu
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        emit("submit");
        return;
    }

    // Esc: Đóng
    if (e.key === "Escape") {
        handleCancel();
    }
};

onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
    <ms-alert 
        :model-value="props.showErrorAlert" 
        title="Cảnh báo" 
        @update:model-value="val => !val && emit('closeAlert')"
        @close="emit('closeAlert')"
    >
        {{ props.errorMessage }}
    </ms-alert>

    <Modal
        :open="props.open"
        :title="props.title"
        :width="props.width"
        centered
        :footer="null"
        :mask-closable="false"
        :destroy-on-close="true"
        @cancel="handleCancel"
    >
        <div class="ms-form form-modal d-flex flex-column">
            <div class="form-modal__body d-flex flex-column">
                <slot></slot>
            </div>

            <div class="form-modal__footer">
                <slot name="footer">
                    <ms-button 
                        @click="emit('submit')" 
                        :loading="props.loading"
                        tooltip="Ctrl + S"
                    >
                        Lưu
                    </ms-button>
                    <ms-button 
                        v-if="props.showSaveAndAdd"
                        type="outline" 
                        @click="emit('submitAndAdd')" 
                        :loading="props.loading"
                        tooltip="Ctrl + Shift + S"
                    >
                        Lưu và thêm
                    </ms-button>
                    <ms-button 
                        type="outline" 
                        @click="handleCancel"
                    >
                        Hủy
                    </ms-button>
                </slot>
            </div>
        </div>
    </Modal>
</template>

<style scoped>
.ms-form {
    width: 100%;
}
/* Các class form-modal__body và form-modal__footer đã được định nghĩa global trong common.css */
</style>
