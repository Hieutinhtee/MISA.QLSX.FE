<script setup>
import axios from "axios";
import TheNavbar from "./layout/TheNavbar.vue";
import TheSidebar from "./layout/TheSidebar.vue";
import { ConfigProvider } from "ant-design-vue";
import viVN from "ant-design-vue/es/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import MsAlert from "./components/ms-alert/MsAlert.vue";
import { computed, provide, reactive, ref } from "vue";
import { useRoute } from "vue-router";
// Dayjs
dayjs.locale("vi");

const themeConfig = {
    token: {
        colorPrimary: "#009b71",
        colorPrimaryHover: "#007b5d",
        colorPrimaryBorder: "#007b5d",
        borderRadius: 4,
        colorTextPlaceholder: "#9e9e9e",
        fontFamily: "Inter",
    },
};

const isDevOpen = ref(false);
const route = useRoute();

const authState = reactive({
    user: JSON.parse(localStorage.getItem("user") || "null"),
});

const authApi = axios.create({
    baseURL: "https://localhost:7124",
    withCredentials: true,
});

async function login(username, password) {
    const response = await authApi.post("/api/auth/login", { username, password });
    authState.user = response.data;
    localStorage.setItem("user", JSON.stringify(response.data));
    return response.data;
}

async function logout() {
    try {
        await authApi.post("/api/auth/logout");
    } finally {
        authState.user = null;
        localStorage.removeItem("user");
    }
}

provide("auth", { authState, login, logout });

const showAppShell = computed(() => route.path !== "/login" && route.path !== "/403");

window.$dev = () => {
    isDevOpen.value = true;
};


</script>

<template>
    <config-provider :theme="themeConfig" :locale="viVN">
        <div v-if="showAppShell" class="container d-flex flex-column">
            <!-- Navbar -->
            <the-navbar></the-navbar>

            <!-- Main Content -->
            <div class="main d-flex flex-1">
                <!-- Sidebar -->
                <the-sidebar></the-sidebar>

                <!-- Content -->
                <router-view></router-view>
            </div>
        </div>
        <router-view v-else></router-view>
    </config-provider>

    <ms-alert v-model="isDevOpen" title="Thông báo">
        Chức năng hiện chưa khả dụng. Chúng tôi sẽ cập nhật trong thời gian sớm nhất.
    </ms-alert>
</template>

<style>
.container {
    height: 100vh;
    width: 100%;
}

.navbar {
    display: flex;
    justify-content: space-between;
    height: 48px;
    z-index: 3;
}

.content__body {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.content__datagrid {
    flex: 1;
    overflow-x: auto;
}
</style>
