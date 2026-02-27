import { createApp } from "vue";
import App from "./App.vue";

import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import "@/assets/css/main.css";

const app = createApp(App);

app.use(Toast, {
    position: "bottom-right",
    timeout: 3000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    hideProgressBar: true,
});

app.mount("#app");
