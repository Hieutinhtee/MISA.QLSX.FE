<script setup>
import { ref, onMounted } from "vue";

// Dữ liệu menu sidebar
const menu = ref([
    { name: "home", title: "Tổng quan" },
    { name: "order", title: "Đơn đặt hàng", active: false },
    { name: "plan", title: "Kế hoạch sản xuất", active: false },
    { name: "coordinate", title: "Điều phối và thực thi", active: false },
    { name: "quality", title: "Kiểm tra chát lượng", active: false },
    { name: "material", title: "Kho vật  tư", active: false },
    { name: "cost", title: "Giá thành kế hoạch", active: false },
    { line: true },
    { name: "report", title: "Báo cáo", active: false },
    { line: true },
    { name: "product", title: "Sản phẩm, NVL", active: false },
    { name: "process", title: "Quy trình sản xuất", active: false },
    { name: "production", title: "Năng lực sản xuất", active: false },
    { name: "category", title: "Danh mục khác", active: true },
    { name: "system", title: "Thiết lập", active: false },
]);

// Trạng thái toggle sidebar
let toggleState = ref("expanded");

onMounted(() => {
    initSidebarToggle();
});

/**
 * Xử lý sự kiện khởi tạo toggle sidebar
 * created by: TMHieu (28/01/2026)
 */
function initSidebarToggle() {
    toggleState.value = localStorage.getItem("sidebarToggleState");
    if (!toggleState.value) {
        localStorage.setItem("sidebarToggleState", "expanded");
    }
}

/**
 * Xử lý sự kiện toggle sidebar
 * created by: TMHieu (28/01/2026)
 */
function toggleSidebar() {
    if (toggleState.value === "expanded") {
        localStorage.setItem("sidebarToggleState", "collapsed");
        toggleState.value = "collapsed";
    } else {
        localStorage.setItem("sidebarToggleState", "expanded");
        toggleState.value = "expanded";
    }
}
</script>

<template>
    <div class="sidebar d-flex flex-column">
        <!-- Sidebar menu -->
        <div class="sidebar__menu flex-1 d-flex flex-column">
            <div v-for="item in menu" :key="item">
                <div
                    v-if="item.title"
                    :class="[
                        'sidebar__menu-item',
                        item.active ? 'sidebar__menu-item--active' : '',
                        'd-flex',
                        'align-items-center',
                        toggleState === 'collapsed' ? 'sidebar__menu-item--collapsed' : '',
                    ]"
                >
                    <div :class="['sidebar__' + item.name + '-icon', 'sidebar__icon']"></div>
                    <div :class="['sidebar__title', toggleState === 'collapsed' ? 'hidden' : '']">
                        {{ item.title }}
                    </div>
                </div>
                <div v-else class="sidebar__menu-line"></div>
            </div>
        </div>

        <!-- sidebar toggle -->
        <div
            @click="toggleSidebar()"
            class="sidebar__toggle sidebar__menu-item d-flex align-items-center justify-content-center"
            :class="[toggleState === 'collapsed' ? 'sidebar__menu-item--collapsed' : '']"
        >
            <div
                :class="[
                    'sidebar__toggle-icon sidebar__icon',
                    toggleState === 'collapsed' ? 'sidebar__toggle-icon--rotated' : '',
                ]"
            ></div>
            <div
                :class="[
                    'sidebar__toggle-title',
                    'sidebar__title',
                    toggleState === 'collapsed' ? 'hidden' : '',
                ]"
            >
                Thu gọn
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Style thanh sidebar */
.sidebar {
    background-color: #111827;
    height: 100%;
}

.sidebar__menu {
    border-bottom: 1px solid #4b515d;
    padding: 12px 12px 0 12px;
    row-gap: 4px;
}

.sidebar__menu-item {
    padding: 8px 0;
    border-radius: var(--border-radius);
    z-index: 2;
    cursor: pointer;
    width: 210px;
}

.sidebar__menu-item--collapsed {
    width: 36px;
}

.sidebar__menu-item--active {
    background-color: #009b71;
}

.sidebar__menu-item--active .sidebar__icon {
    background-color: white;
}

.sidebar__menu-item--active .sidebar__title {
    color: white;
}

.sidebar__menu-item:not(.sidebar__menu-item--active):hover {
    background-color: #252c3b;
}

.sidebar__menu-item:not(.sidebar__menu-item--active):hover .sidebar__title {
    color: white;
}

.sidebar__menu-item:not(.sidebar__menu-item--active):hover .sidebar__icon {
    background-color: white;
}

.sidebar__title {
    color: #9ca3af;
}

.sidebar__menu-line {
    height: 1px;
    margin: 8px;
    border-bottom: 1px solid rgba(209, 213, 219, 0.3);
}

.sidebar__toggle {
    cursor: pointer;
    height: 36px;
    margin: 10px;
}

.sidebar__toggle-title {
    color: #9ca3af;
    font-size: 13px;
    padding-right: 12px;
}
/* Kết thúc Style thanh sidebar */
</style>
