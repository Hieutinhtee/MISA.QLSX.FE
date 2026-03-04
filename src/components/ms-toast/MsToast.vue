<template>
    <Teleport to="body">
        <Transition name="toast-slide">
            <div v-if="isOpen" class="ms-toast-wrapper">
                <div :class="['ms-toast', typeClass]">
                    <div class="ms-toast-left">
                        <div :class="['ms-toast-icon', typeClass]"></div>
                        <div class="ms-toast-message">
                            <slot />
                        </div>
                    </div>

                    <div class="ms-toast-close" @click="close">✕</div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { defineProps, defineEmits, onMounted } from "vue";

const props = defineProps({
    modelValue: Boolean,
    type: {
        type: String,
        default: "success", // success | error
    },
    duration: {
        type: Number,
        default: 3000,
    },
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = defineModel({ type: Boolean });

const close = () => {
    emit("update:modelValue", false);
};

onMounted(() => {
    if (props.duration > 0) {
        setTimeout(close, props.duration);
    }
});

const typeClass = props.type === "error" ? "ms-toast-error" : "ms-toast-success";
</script>

<style>
/* Wrapper */
.ms-toast-wrapper {
    position: fixed;
    top: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 999999;
}

/* Toast */
.ms-toast {
    min-width: 320px;
    max-width: 480px;
    background: white;
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    font-size: 14px;
}

/* Left */
.ms-toast-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

/* Icon */
.ms-toast-icon {
    -webkit-mask-image: url(/src/assets/icon/svg/Icon_QLSX.svg);
    mask-position: -192px 0;
    background-color: var(--primary-color);
    width: 16px;
    height: 16px;
}

.ms-toast-success {
    border-left: 4px solid var(--primary-color);
}

.ms-toast-error {
    border-left: 4px solid #ef4444;
}

.ms-toast-success .ms-toast-icon {
    background-color: var(--primary-color);
}

.ms-toast-error .ms-toast-icon {
    background-color: #ef4444;
}

/* Close */
.ms-toast-close {
    cursor: pointer;
    opacity: 0.6;
}

.ms-toast-close:hover {
    opacity: 1;
}

/* Animation */
.toast-slide-enter-active,
.toast-slide-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>
