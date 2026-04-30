<script setup>
import { inject, ref } from "vue";
import { useRouter } from "vue-router";
import ShiftsAPI from "@/apis/components/shifts/shiftsAPI";
import { Tooltip } from "ant-design-vue";
import { $toastError } from "@/utils/toastService";

const router = useRouter();
const { authState, logout } = inject("auth");

const icons = ref([
    { name: "package", badge: 0, tooltip: "Tra cứu tồn kho" },
    { name: "user", badge: 0, tooltip: "Giới thiệu bạn mới" },
    { name: "ring", badge: 9, tooltip: "Thông báo" },
    { name: "help", badge: 0, tooltip: "Hướng dẫn" },
    { name: "more", badge: 0, tooltip: "Tính năng khác" },
    { name: "book", badge: 0, tooltip: "Kiến thức hữu ích" },
    { name: "avatar", badge: 0 },
]);

function handleExportExcel() {
    ShiftsAPI.exportExcel()
        .then((res) => {
            const blob = new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            link.download = `Shift-${timestamp}.xlsx`;
            link.click();

            window.URL.revokeObjectURL(url);
        })
        .catch(() => {
            $toastError("Xuất Excel thất bại");
        });
}
const openDev = () => {
    window.$dev();
};

async function handleLogout() {
    await logout();
    router.push("/login");
}
</script>

<template>
    <div class="navbar">
        <div class="navbar__left d-flex align-items-center">
            <div class="navbar__app-icon"></div>
            <div class="navbar__logo"></div>
            <div class="navbar__title">Quản lí nhân sự</div>
            <div class="navbar__company-name d-flex align-items-center pointer" @click="openDev">
                <div class="navbar__company-title">Công ty MISEM</div>
                <div class="icon__angle-down-small"></div>
            </div>
        </div>

        <div class="navbar__right d-flex align-items-center">
            <div class="navbar__user" v-if="authState?.user">
                {{ authState.user.name || "Người dùng" }}
            </div>
            <button class="navbar__logout" @click="handleLogout">Đăng xuất</button>

            <tooltip placement="bottom" :align="{ offset: [0, -2] }">
                <template #title>
                    <span>Xuất khẩu Excel</span>
                </template>
                <div class="navbar__item navbar__export-icon" @click="handleExportExcel"></div>
            </tooltip>

            <div class="navbar__line"></div>
            <div v-for="item in icons" :key="item">
                <tooltip placement="bottom" :align="{ offset: [0, -2] }">
                    <template v-if="item.tooltip" #title>
                        <span>{{ item.tooltip }}</span>
                    </template>
                    <div
                        class="navbar__item"
                        :class="['navbar__' + item.name + '-icon']"
                        @click="openDev"
                    >
                        <div
                            v-if="item.badge != 0"
                            class="navbar__item-badge d-flex justify-content-center align-items-center"
                        >
                            {{ item.badge }}
                        </div>
                    </div></tooltip
                >
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Style thanh header */
.navbar {
    border-bottom: 1px solid #d1d5db;
    overflow: hidden;
    height: 48px;
}

.navbar__left {
    padding-left: 16px;
    background-repeat: no-repeat;
}

.navbar__title {
    font-weight: 700;
    font-size: 18px;
    margin-right: 60px;
}

.navbar__company-title {
    font-size: 13px;
    font-weight: 700;
    margin-right: 5px;
}

.navbar__line {
    width: 1px;
    height: 16px;
    background-color: #d1d5db;
    margin-right: 14px;
}

.navbar__user {
    font-weight: 600;
    margin-right: 8px;
}

.navbar__logout {
    border: 1px solid #cbd5e1;
    background: #fff;
    border-radius: 6px;
    padding: 6px 10px;
    margin-right: 12px;
    cursor: pointer;
    font-weight: 600;
}

.navbar__item {
    margin-right: 14px;
    cursor: pointer;
    position: relative;
}

.navbar__item-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    border-radius: 50px;
    width: max-content;
    height: 16px;
    background-color: red;
    color: white;
    font-size: 10px;
    z-index: 1;
    font-weight: 600;
    padding: 6px;
}

/* hình tròn nền hover*/
.navbar__item::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.09); /* xám rất nhẹ */
    border-radius: 50%;
    opacity: 0;
    width: 32px;
    height: 32px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

/* hover */
.navbar__item:not(.navbar__website):hover::before {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}
/* Kết thúc Style thanh header */
</style>
