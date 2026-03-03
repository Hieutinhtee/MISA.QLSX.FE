<script setup>
import { ref } from "vue";

const icons = ref([
    { name: "package", badge: 0 },
    { name: "user", badge: 0 },
    { name: "ring", badge: 9 },
    { name: "help", badge: 0 },
    { name: "more", badge: 0 },
    { name: "book", badge: 0 },
    { name: "avatar", badge: 0 },
]);

const openDev = () => {
    window.$dev();
};
</script>

<template>
    <div class="navbar">
        <div class="navbar__left d-flex align-items-center">
            <div class="navbar__app-icon"></div>
            <div class="navbar__logo"></div>
            <div class="navbar__title">Sản xuất</div>
            <div class="navbar__company-name d-flex align-items-center pointer" @click="openDev">
                <div class="navbar__company-title">01. KSX_MISA</div>
                <div class="icon__angle-down-small"></div>
            </div>
        </div>

        <div class="navbar__right d-flex align-items-center">
            <div class="navbar__item navbar__export-icon"></div>
            <div class="navbar__line"></div>
            <div
                v-for="item in icons"
                :key="item"
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
