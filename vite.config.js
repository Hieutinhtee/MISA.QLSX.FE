import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), vueDevTools()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        proxy: {
            "/api/cvparse": {
                target: "https://api.cvparse.io",
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/api\/cvparse/, ""),
            },
        },
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
                modifyVars: {
                    // màu
                    "primary-color": "#ff4d4f",

                    "input-border-radius": "18px",

                    // fallback chung
                    "border-radius-base": "18px",
                },
            },
        },
    },
});
