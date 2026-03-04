import { createVNode, render } from "vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";

function mountAlert(options) {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const vnode = createVNode(
        MsAlert,
        {
            modelValue: true,
            title: options.title || "Thông báo",
            showConfirm: options.showConfirm || false,

            "onUpdate:modelValue": (val) => {
                if (!val) {
                    render(null, container);
                    container.remove();
                }
            },

            onClose: () => {
                render(null, container);
                container.remove();
            },

            onConfirm: () => {
                options.onConfirm?.();
                render(null, container);
                container.remove();
            },
        },
        {
            default: () => options.message,
        },
    );

    render(vnode, container);
}

export function $alert(message, title = "Thông báo") {
    mountAlert({
        message,
        title,
        showConfirm: false,
    });
}

export function $confirm(message, onConfirm, title = "Xác nhận") {
    mountAlert({
        message,
        title,
        showConfirm: true,
        onConfirm,
    });
}
