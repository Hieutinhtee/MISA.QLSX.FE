<script setup>
import { computed, inject, ref, onMounted, watch } from "vue";
import {
    DashboardOutlined,
    TeamOutlined,
    FileTextOutlined,
    DollarOutlined,
    GiftOutlined,
    GlobalOutlined,
    SolutionOutlined,
    ScheduleOutlined,
    SettingOutlined,
    AuditOutlined,
    DownOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    EnterOutlined,
} from "@ant-design/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { markRaw } from "vue";

const route = useRoute();
const router = useRouter();
const { authState } = inject("auth");

const currentRole = computed(() => {
    let role = authState?.user?.role || null;
    // Normalize: remove "ROLE_" prefix if present
    if (role?.startsWith("ROLE_")) {
        role = role.substring(5);
    }
    return role;
});

const canAccessRoles = (roles) => {
    if (!roles || roles.length === 0) {
        return true;
    }

    return roles.includes(currentRole.value);
};

// Dữ liệu menu sidebar
const menu = ref([
    {
        name: "home",
        title: "Tổng quan",
        icon: markRaw(DashboardOutlined),
        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    },
    // { name: "order", title: "Đơn đặt hàng", active: false },
    // {
    //     name: "plan",
    //     title: "Kế hoạch sản xuất",
    //     active: false,
    //     children: [
    //         { title: "Kế hoạch tổng thể" },
    //         { title: "Kế hoạch chi tiết" },
    //         { title: "Kế hoạch nguyên vật liệu" },
    //         { title: "Yêu cầu mua NVL" },
    //     ],
    // },
    // {
    //     name: "coordinate",
    //     title: "Điều phối và thực thi",
    //     active: false,
    //     children: [
    //         { title: "Kế hoạch tổng thể" },
    //         { title: "Kế hoạch chi tiết" },
    //         { title: "Kế hoạch nguyên vật liệu" },
    //         { title: "Yêu cầu mua NVL" },
    //     ],
    // },
    // {
    //     name: "quality",
    //     title: "Kiểm tra chát lượng",
    //     active: false,
    //     children: [{ title: "Kế hoạch tổng thể" }, { title: "Kế hoạch chi tiết" }],
    // },
    // {
    //     name: "material",
    //     title: "Kho vật  tư",
    //     active: false,
    //     children: [{ title: "Kế hoạch nguyên vật liệu" }, { title: "Yêu cầu mua NVL" }],
    // },
    // {
    //     name: "cost",
    //     title: "Giá thành kế hoạch",
    //     active: false,
    //     children: [
    //         { title: "Kế hoạch tổng thể" },
    //         { title: "Kế hoạch chi tiết" },
    //         { title: "Kế hoạch nguyên vật liệu" },
    //         { title: "Yêu cầu mua NVL" },
    //     ],
    // },
    // { line: true },
    // { name: "report", title: "Báo cáo", active: false },
    // { line: true },
    // {
    //     name: "product",
    //     title: "Sản phẩm, NVL",
    //     active: false,
    //     children: [
    //         { title: "Kế hoạch tổng thể" },
    //         { title: "Kế hoạch chi tiết" },
    //         { title: "Kế hoạch nguyên vật liệu" },
    //         { title: "Yêu cầu mua NVL" },
    //     ],
    // },
    // {
    //     name: "process",
    //     title: "Quy trình sản xuất",
    //     active: false,
    //     children: [
    //         { title: "Kế hoạch tổng thể" },
    //         { title: "Kế hoạch chi tiết" },
    //         { title: "Kế hoạch nguyên vật liệu" },
    //         { title: "Yêu cầu mua NVL" },
    //     ],
    // },
    {
        name: "production",
        title: "Nhân viên",
        icon: markRaw(TeamOutlined),
        active: false,
        roles: ["ADMIN", "HR", "MANAGER"],
        children: [
            {
                title: "Danh sách nhân viên",
                path: "/employees",
                roles: ["ADMIN", "HR", "MANAGER"],
            },
            {
                title: "Danh mục bằng cấp",
                path: "/degrees",
                roles: ["ADMIN", "HR"],
            },
            {
                title: "Phòng ban",
                path: "/departments",
                roles: ["ADMIN", "HR"],
            },
            {
                title: "Chức vụ",
                path: "/positions",
                roles: ["ADMIN", "HR"],
            },
            {
                title: "Nhân viên chưa có HĐ",
                path: "/employees-without-contract",
                roles: ["ADMIN", "HR"],
            },
        ],
    },
    {
        name: "contract",
        title: "Hợp đồng",
        icon: markRaw(FileTextOutlined),
        active: false,
        roles: ["ADMIN", "HR", "MANAGER"],
        children: [
            {
                title: "Danh sách hợp đồng",
                path: "/contracts",
                roles: ["ADMIN", "HR", "MANAGER"],
            },
            {
                title: "Mẫu hợp đồng",
                path: "/contract-templates",
                roles: ["ADMIN", "HR"],
            },
        ],
    },
    {
        name: "payroll",
        title: "Bảng lương",
        icon: markRaw(DollarOutlined),
        active: false,
        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    },
    {
        name: "allowance",
        title: "Phụ cấp",
        icon: markRaw(GiftOutlined),
        active: false,
        roles: ["ADMIN", "HR"],
    },
    {
        name: "businessTrip",
        title: "Công tác",
        icon: markRaw(GlobalOutlined),
        active: false,
        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    },
    {
        name: "evaluation",
        title: "Đánh giá",
        icon: markRaw(SolutionOutlined),
        active: false,
        roles: ["ADMIN", "HR", "MANAGER"],
    },
    {
        name: "attendance",
        title: "Chấm công",
        icon: markRaw(ScheduleOutlined),
        active: false,
        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
        children: [
            {
                title: "Tổng quan",
                path: "/attendance/dashboard",
                roles: ["ADMIN", "HR", "MANAGER"],
            },
            {
                title: "Lịch sử của tôi",
                path: "/attendance/my-calendar",
                roles: ["EMPLOYEE", "ADMIN", "HR", "MANAGER"],
            },
            {
                title: "Bảng chấm công",
                path: "/attendances",
                roles: ["ADMIN", "HR", "MANAGER"],
            },
        ],
    },
    {
        name: "category",
        title: "Ca làm việc",
        icon: markRaw(ScheduleOutlined),
        active: true,
        roles: ["ADMIN", "HR", "MANAGER"],
    },
    {
        name: "approval",
        title: "Phê duyệt",
        icon: markRaw(AuditOutlined),
        active: false,
        roles: ["ADMIN", "HR", "MANAGER"],
    },
    { name: "system", title: "Thiết lập", icon: markRaw(SettingOutlined), active: false },
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

const currentEmployeeSubmenu = computed(() => {
    if (route.path.startsWith("/employees-without-contract")) {
        return "/employees-without-contract";
    }

    if (route.path.startsWith("/degrees")) {
        return "/degrees";
    }

    if (route.path.startsWith("/departments")) {
        return "/departments";
    }

    if (route.path.startsWith("/positions")) {
        return "/positions";
    }

    if (route.path.startsWith("/employees")) {
        return "/employees";
    }

    return "";
});

const currentContractSubmenu = computed(() => {
    if (route.path.startsWith("/contract-templates")) {
        return "/contract-templates";
    }

    if (route.path.startsWith("/contracts")) {
        return "/contracts";
    }

    return "";
});

const currentAttendanceSubmenu = computed(() => {
    if (route.path.startsWith("/attendance/dashboard")) {
        return "/attendance/dashboard";
    }

    if (route.path.startsWith("/attendance/my-calendar")) {
        return "/attendance/my-calendar";
    }

    if (route.path.startsWith("/attendances")) {
        return "/attendances";
    }

    return "";
});

watch(
    () => route.path,
    (path) => {
        // Chỉ set activeMenu khi path thay đổi, không reset
        if (path.startsWith("/employees") || path.startsWith("/degrees")
            || path.startsWith("/departments") || path.startsWith("/positions")) {
            activeMenu.value = "production";
        } else if (path.startsWith("/contracts") || path.startsWith("/contract-templates")) {
            activeMenu.value = "contract";
        } else if (path.startsWith("/attendance") || path.startsWith("/attendances")) {
            activeMenu.value = "attendance";
        } else {
            // Khi navigate đến trang không thuộc nhóm nào, đóng submenu
            activeMenu.value = null;
        }
    },
    { immediate: true },
);

const openDev = (nameItem) => {
    if (nameItem === "home") {
        router.push("/dashboard");
        return;
    }

    if (nameItem === "category") {
        router.push("/shifts");
        return;
    }

    if (nameItem === "payroll") {
        router.push("/payrolls");
        return;
    }

    if (nameItem === "allowance") {
        router.push("/allowances");
        return;
    }

    if (nameItem === "businessTrip") {
        router.push("/business-trips");
        return;
    }

    if (nameItem === "evaluation") {
        router.push("/evaluations");
        return;
    }

    if (nameItem === "approval") {
        router.push("/approvals");
        return;
    }

    window.$dev();
};

const currentMenu = computed(() => {
    if (route.path.startsWith("/dashboard")) return "home";
    if (
        route.path.startsWith("/employees") ||
        route.path.startsWith("/degrees") ||
        route.path.startsWith("/departments") ||
        route.path.startsWith("/positions")
    ) {
        return "production";
    }
    if (route.path.startsWith("/shifts")) return "category";
    if (route.path.startsWith("/contracts") || route.path.startsWith("/contract-templates")) {
        return "contract";
    }
    if (route.path.startsWith("/payrolls")) return "payroll";
    if (route.path.startsWith("/allowances")) return "allowance";
    if (route.path.startsWith("/business-trips")) return "businessTrip";
    if (route.path.startsWith("/evaluations")) return "evaluation";
    if (route.path.startsWith("/approvals")) return "approval";
    if (route.path.startsWith("/attendance") || route.path.startsWith("/attendances")) return "attendance";
    return "";
});

const handleMenuClick = (item) => {
    // Menu không có con - navigate trực tiếp
    if (!item.children) {
        openDev(item.name);
        return;
    }

    // Menu có con - toggle submenu
    if (activeMenu.value === item.name) {
        // Đang mở → đóng
        activeMenu.value = null;
    } else {
        // Đang đóng → mở + navigate đến trang đầu tiên CÓ QUYỀN TRUY CẬP
        activeMenu.value = item.name;
        if (item.children) {
            const accessibleChild = item.children.find(child => canAccessRoles(child.roles));
            if (accessibleChild?.path) {
                router.push(accessibleChild.path);
            }
        }
    }
};
</script>

<template>
    <div class="sidebar d-flex flex-column">
        <!-- Sidebar menu -->
        <div class="sidebar__menu flex-1 d-flex flex-column">
            <template v-for="item in menu" :key="item.name || item.title">
                <div v-if="canAccessRoles(item.roles)">
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
                        <div class="sidebar__icon d-flex align-items-center justify-content-center">
                            <component :is="item.icon" :style="{ fontSize: '16px' }" />
                        </div>
                        <div
                            :class="['sidebar__title', toggleState === 'collapsed' ? 'hidden' : '']"
                        >
                            {{ item.title }}
                        </div>
                        <div v-if="item.children" class="sidebar__icon sidebar__down-icon"></div>
                    </div>

                    <div v-else class="sidebar__menu-line"></div>
                    <transition name="submenu-fade">
                        <div
                            v-if="
                                item.children &&
                                activeMenu === item.name &&
                                toggleState !== 'collapsed'
                            "
                            class="sidebar__submenu"
                        >
                            <div
                                v-for="child in item.children?.filter((subItem) =>
                                    canAccessRoles(subItem.roles),
                                )"
                                :key="child.title"
                                :class="[
                                    'sidebar__menu-item',
                                    'sidebar__submenu-item',
                                    'd-flex',
                                    'align-items-center',
                                    currentEmployeeSubmenu === child.path ||
                                    currentContractSubmenu === child.path ||
                                    currentAttendanceSubmenu === child.path
                                         ? 'sidebar__submenu-item--active'
                                         : '',
                                ]"
                            >
                                <RouterLink
                                    v-if="child.path"
                                    :to="child.path"
                                    class="sidebar__submenu-link d-flex align-items-center"
                                    @click.stop
                                >
                                    <div class="sidebar__icon sidebar__enter-icon"></div>
                                    <div :class="['sidebar__title']">
                                        {{ child.title }}
                                    </div>
                                </RouterLink>
                                <template v-else>
                                    <div class="sidebar__icon sidebar__enter-icon"></div>
                                    <div :class="['sidebar__title']">
                                        {{ child.title }}
                                    </div>
                                </template>
                            </div>
                        </div>
                    </transition>
                </div>
            </template>
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

.sidebar__submenu-link {
    text-decoration: none;
    width: 100%;
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

.sidebar__submenu-item--active {
    background-color: #252c3b;
}

.sidebar__submenu-item--active .sidebar__enter-icon {
    opacity: 1;
}

.sidebar__submenu-item--active .sidebar__title {
    color: white;
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
    color: white;
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
    color: white;
}

.sidebar__icon {
    background-color: #9ca3af; /* Khôi phục lại màu nền cho các icon mask */
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Riêng các icon Ant Design thì không dùng background-color */
.sidebar__icon:has(span) {
    background-color: transparent !important;
}

.sidebar__menu-item--active .sidebar__icon {
    color: white !important;
    background-color: white !important;
}

.sidebar__menu-item--active .sidebar__icon:has(span) {
    background-color: transparent !important;
}

.sidebar__menu-item:hover .sidebar__icon {
    color: white !important;
    background-color: white !important;
}

.sidebar__menu-item:hover .sidebar__icon:has(span) {
    background-color: transparent !important;
}

.sidebar__title {
    color: #9ca3af;
    margin-left: 4px;
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
