<script setup>
import TheNavbar from "./layout/TheNavbar.vue";
import TheSidebar from "./layout/TheSidebar.vue";
import shiftView from "./views/shift/Index.vue";
import { ConfigProvider } from "ant-design-vue";
import viVN from "ant-design-vue/es/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import MsAlert from "./components/ms-alert/MsAlert.vue";
import { ref } from "vue";
// Dayjs
dayjs.locale("vi");

const themeConfig = {
    token: {
        colorPrimary: "#009b71",
        colorPrimaryHover: "#007b5d",
        colorPrimaryBorder: "#007b5d",
        borderRadius: 4,
        colorTextPlaceholder: "#9e9e9e",
    },
};

const isDevOpen = ref(false);

window.$dev = () => {
    isDevOpen.value = true;
};
</script>

<template>
    <config-provider :theme="themeConfig" :locale="viVN">
        <div class="container d-flex flex-column">
            <!-- Navbar -->
            <the-navbar></the-navbar>

            <!-- Main Content -->
            <div class="main d-flex flex-1">
                <!-- Sidebar -->
                <the-sidebar></the-sidebar>

                <!-- Content -->
                <shift-view></shift-view>
            </div></div
    ></config-provider>

    <ms-alert v-model="isDevOpen" title="Thông báo" @close="showConfirm = false">
        Chức năng hiện chưa khả dụng. Chúng tôi sẽ cập nhật trong thời gian tới.
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
