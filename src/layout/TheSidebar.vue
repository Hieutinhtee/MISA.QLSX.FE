<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// Dữ liệu menu sidebar
const menu = ref([
    { name: "home", title: "Tổng quan" },
    { name: "order", title: "Đơn đặt hàng", active: false },
    {
        name: "plan",
        title: "Kế hoạch sản xuất",
        active: false,
        children: [
            { title: "Kế hoạch tổng thể" },
            { title: "Kế hoạch chi tiết" },
            { title: "Kế hoạch nguyên vật liệu" },
            { title: "Yêu cầu mua NVL" },
        ],
    },
    {
        name: "coordinate",
        title: "Điều phối và thực thi",
        active: false,
        children: [
            { title: "Kế hoạch tổng thể" },
            { title: "Kế hoạch chi tiết" },
            { title: "Kế hoạch nguyên vật liệu" },
            { title: "Yêu cầu mua NVL" },
        ],
    },
    {
        name: "quality",
        title: "Kiểm tra chát lượng",
        active: false,
        children: [{ title: "Kế hoạch tổng thể" }, { title: "Kế hoạch chi tiết" }],
    },
    {
        name: "material",
        title: "Kho vật  tư",
        active: false,
        children: [{ title: "Kế hoạch nguyên vật liệu" }, { title: "Yêu cầu mua NVL" }],
    },
    {
        name: "cost",
        title: "Giá thành kế hoạch",
        active: false,
        children: [
            { title: "Kế hoạch tổng thể" },
            { title: "Kế hoạch chi tiết" },
            { title: "Kế hoạch nguyên vật liệu" },
            { title: "Yêu cầu mua NVL" },
        ],
    },
    { line: true },
    { name: "report", title: "Báo cáo", active: false },
    { line: true },
    {
        name: "product",
        title: "Sản phẩm, NVL",
        active: false,
        children: [
            { title: "Kế hoạch tổng thể" },
            { title: "Kế hoạch chi tiết" },
            { title: "Kế hoạch nguyên vật liệu" },
            { title: "Yêu cầu mua NVL" },
        ],
    },
    {
        name: "process",
        title: "Quy trình sản xuất",
        active: false,
        children: [
            { title: "Kế hoạch tổng thể" },
            { title: "Kế hoạch chi tiết" },
            { title: "Kế hoạch nguyên vật liệu" },
            { title: "Yêu cầu mua NVL" },
        ],
    },
    {
        name: "production",
        title: "Nhân viên",
        active: false,
        children: [
            { title: "Kế hoạch tổng thể" },
            { title: "Kế hoạch chi tiết" },
            { title: "Kế hoạch nguyên vật liệu" },
            { title: "Yêu cầu mua NVL" },
        ],
    },
    { name: "contractTemplate", title: "Mẫu hợp đồng", active: false },
    { name: "contract", title: "Hợp đồng", active: false },
    { name: "category", title: "Ca làm việc", active: true },
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

const activeMenu = ref(null);

const toggleMenu = (name) => {
    if (activeMenu.value === name) {
        activeMenu.value = null;
    } else {
        activeMenu.value = name;
    }
};

const openDev = (nameItem) => {
    if (nameItem === "category") {
        router.push("/shifts");
        return;
    }

    if (nameItem === "production") {
        router.push("/employees");
        return;
    }

    if (nameItem === "contractTemplate") {
        router.push("/contract-templates");
        return;
    }

    if (nameItem === "contract") {
        router.push("/contracts");
        return;
    }

    window.$dev();
};

const currentMenu = computed(() => {
    if (route.path.startsWith("/employees")) return "production";
    if (route.path.startsWith("/shifts")) return "category";
    if (route.path.startsWith("/contract-templates")) return "contractTemplate";
    if (route.path.startsWith("/contracts")) return "contract";
    return "";
});

const handleMenuClick = (item) => {
    if (
        item.name === "category" ||
        item.name === "production" ||
        item.name === "contractTemplate" ||
        item.name === "contract"
    ) {
        openDev(item.name);
        return;
    }

    if (item.children) {
        toggleMenu(item.name);
        return;
    }

    openDev(item.name);
};
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
                        currentMenu === item.name ? 'sidebar__menu-item--active' : '',
                        'd-flex',
                        'align-items-center',
                        toggleState === 'collapsed' ? 'sidebar__menu-item--collapsed' : '',
                    ]"
                    @click="handleMenuClick(item)"
                >
                    <div :class="['sidebar__' + item.name + '-icon', 'sidebar__icon']"></div>
                    <div :class="['sidebar__title', toggleState === 'collapsed' ? 'hidden' : '']">
                        {{ item.title }}
                    </div>
                    <div v-if="item.children" class="sidebar__icon sidebar__down-icon"></div>
                </div>

                <div v-else class="sidebar__menu-line"></div>
                <transition name="submenu-fade">
                    <div
                        v-if="
                            item.children && activeMenu === item.name && toggleState !== 'collapsed'
                        "
                        class="sidebar__submenu"
                    >
                        <div
                            v-for="child in item.children"
                            :key="child.title"
                            class="sidebar__menu-item sidebar__submenu-item d-flex align-items-center"
                            @click="openDev()"
                        >
                            <div :class="['sidebar__enter-icon', 'sidebar__icon']"></div>
                            <div :class="['sidebar__title']">
                                {{ child.title }}
                            </div>
                        </div>
                    </div>
                </transition>
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
.sidebar__submenu {
    display: flex;
    flex-direction: column;
    row-gap: 4px;
    overflow: hidden; /* quan trọng để cắt nội dung khi thu chiều cao */
}

/* Transition submenu: mở bằng tăng chiều cao, đóng bằng giảm chiều cao */
.submenu-fade-enter-active,
.submenu-fade-leave-active {
    transition:
        max-height 0.5s ease-in-out,
        opacity 0.2s ease-in-out;
}

/* Bắt đầu: thu nhỏ + mờ */
.submenu-fade-enter-from,
.submenu-fade-leave-to {
    max-height: 0;
    opacity: 0;
}

/* Kết thúc: mở rộng + hiện rõ
   500px là giá trị đủ lớn cho mọi submenu (có thể chỉnh cao/thấp hơn nếu cần) */
.submenu-fade-enter-to,
.submenu-fade-leave-from {
    max-height: 300px;
    opacity: 1;
}

.sidebar__enter-icon {
    opacity: 0;
}

.sidebar__submenu-item:hover .sidebar__enter-icon {
    opacity: 1;
}
/* Style thanh sidebar */
.sidebar {
    background-color: #111827;
    height: 100%;
}

.sidebar__menu {
    border-bottom: 1px solid #4b515d;
    padding: 12px 12px 0 12px;
    row-gap: 4px;
    overflow: hidden;
}

.sidebar__menu-item {
    position: relative;
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
