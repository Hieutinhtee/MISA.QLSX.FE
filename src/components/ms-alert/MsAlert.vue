<template>
    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="isOpen"
                class="ms-alert-overlay"
                @click.self="onClose"
                @keydown.esc="onClose"
            >
                <div class="ms-alert-modal" style="width: 432px">
                    <div class="d-flex gap-16">
                        <div class="msg-message">
                            <div class="msg-header">
                                <div class="title d-flex align-items-center justify-content-center">
                                    <div :class="['mr-2', 'ms-alert-icon']"></div>
                                    <div class="msg-title">{{ title }}</div>
                                </div>
                                <div class="form-shift__close-icon pointer" @click="onClose"></div>
                            </div>
                            <div class="msg-item"><slot></slot></div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-end gap-12">
                        <!-- Chế độ confirm: hiển thị 2 button -->
                        <template v-if="showConfirm">
                            <MsButton type="outline" @click="onClose">Hủy</MsButton>
                            <MsButton :type="confirmType" @click="onConfirm">{{ confirmText }}</MsButton>
                        </template>
                        <!-- Chế độ thông báo thường: chỉ 1 button -->
                        <template v-else>
                            <MsButton tyle="primary" @click="onClose">Đóng</MsButton>
                        </template>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import MsButton from "../ms-button/MsButton.vue";
import { defineProps, defineEmits } from "vue";

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: "Lỗi",
    },

    showConfirm: {
        type: Boolean,
        default: false,
    },
    confirmText: {
        type: String,
        default: "Đồng ý",
    },
    confirmType: {
        type: String,
        default: "danger",
    },
});

const emit = defineEmits(["confirm", "close"]);

/** * Trạng thái mở/đóng form ca làm việc
 * createdBy: TMHieu (30/01/2026)
 */
const isOpen = defineModel({
    type: Boolean,
    default: false,
});

const onClose = () => {
    emit("close");
    isOpen.value = false;
};

const onConfirm = () => {
    emit("confirm");
};
</script>

<style scoped>
/* Overlay */
.ms-alert-overlay {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: #0000004d;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Modal */
.ms-alert-modal {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    min-width: 360px;
    max-width: 480px;
    animation: slideIn 0.2s ease-out;
    font-size: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Header */
.ms-alert-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
}

.ms-alert-icon {
    -webkit-mask-image: url(/src/assets/icon/svg/icon-alert.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
    -webkit-mask-size: 20px 20px;

    mask-image: url(/src/assets/icon/svg/icon-alert.svg);
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: 20px 20px;

    background-color: #ea580c;
    width: 20px;
    height: 20px;
}

.ms-alert-title {
    flex: 1;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
}

.ms-alert-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #9ca3af;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
}

.msg-message {
    display: flex;
    flex-direction: column;
    flex: 1;
    row-gap: 16px;
    margin-bottom: 16px;
}

/* Body */
.ms-alert-body {
    padding: 20px;
}

.ms-alert-message {
    margin: 0;
    font-size: 14px;
    color: #4b5563;
    line-height: 1.6;
}

/* Footer */
.ms-alert-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
    border-radius: 0 0 8px 8px;
}

/* Buttons */
.ms-alert-btn {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
}

.ms-alert-btn--primary {
    background-color: #dc2626;
    color: #fff;
}

.ms-alert-btn--primary:hover {
    background-color: #b91c1c;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
.gap-16 {
    gap: 16px;
}
.msg-message .msg-header {
    display: flex;
    align-items: center;
    height: 24px;
    justify-content: space-between;
}
.msg-item {
    font-size: 13px;
    max-height: 400px;
    overflow-y: auto;
    font-weight: 400;
    line-height: 20px;
    max-width: 100%;
    white-space: normal;
    overflow-wrap: break-word;
}
.msg-title {
    font-weight: 600;
    color: #111827;
    font-size: 20px;
}
.mr-2 {
    margin-right: 0.5rem;
}
.icon20.icon-warning {
    background-color: #ea580c;
}
</style>
