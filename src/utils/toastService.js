import { createVNode, render } from "vue";
import MsToast from "@/components/ms-toast/MsToast.vue";

function showToast(message, type = "success") {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const vnode = createVNode(
        MsToast,
        {
            modelValue: true,
            type,
            duration: 3500,
            "onUpdate:modelValue": (val) => {
                if (!val) {
                    render(null, container);
                    container.remove();
                }
            },
        },
        {
            default: () => message,
        },
    );

    render(vnode, container);
}

export const $toastSuccess = (msg) => showToast(msg, "success");
export const $toastError = (msg) => showToast(msg, "error");
