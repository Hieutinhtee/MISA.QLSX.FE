import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "@/views/dashboard/Index.vue";
import ShiftView from "@/views/shift/Index.vue";
import EmployeeView from "@/views/employee/Index.vue";
import ResignedEmployeeView from "@/views/employee/ResignedIndex.vue";
import ContractTemplateView from "@/views/contract-template/Index.vue";
import ContractView from "@/views/contract/Index.vue";
import ContractDetailView from "@/views/contract/Detail.vue";
import PayrollView from "@/views/payroll/Index.vue";
import EmployeeWithoutContractView from "@/views/employee-without-contract/Index.vue";
import AllowanceView from "@/views/allowance/Index.vue";
import BusinessTripView from "@/views/business-trip/Index.vue";
import EvaluationView from "@/views/evaluation/Index.vue";
import DegreeView from "@/views/degree/Index.vue";
import DepartmentView from "@/views/department/Index.vue";
import DepartmentDetailView from "@/views/department/DepartmentDetail.vue";
import PositionView from "@/views/position/Index.vue";
import ApprovalView from "@/views/approval/Index.vue";
import LeaveRequestView from "@/views/leave-request/Index.vue";
import LoginView from "@/views/login/LoginView.vue";
import ForbiddenView from "@/views/forbidden/Index.vue";

function getStoredUser() {
    const rawUser = localStorage.getItem("user");

    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser);
    } catch {
        localStorage.removeItem("user");
        return null;
    }
}

function normalizeRole(user) {
    const role = user?.role || user?.Role || "";

    if (typeof role !== "string") {
        return "";
    }

    return role
        .trim()
        .toUpperCase()
        .replace(/^ROLE_/, "");
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: "/dashboard",
        },
        {
            path: "/dashboard",
            name: "dashboard",
            component: DashboardView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
        },
        {
            path: "/login",
            name: "login",
            component: LoginView,
            meta: { requiresAuth: false },
        },
        {
            path: "/403",
            name: "forbidden",
            component: ForbiddenView,
            meta: { requiresAuth: false },
        },
        {
            path: "/shifts",
            name: "shifts",
            component: ShiftView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
        },
        {
            path: "/employees",
            name: "employees",
            component: EmployeeView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER"] },
        },
        {
            path: "/resigned-employees",
            name: "resigned-employees",
            component: ResignedEmployeeView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/contract-templates",
            name: "contract-templates",
            component: ContractTemplateView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/contracts",
            name: "contracts",
            component: ContractView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/contracts/:id",
            name: "contract-detail",
            component: ContractDetailView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/employees-without-contract",
            name: "employees-without-contract",
            component: EmployeeWithoutContractView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/payrolls",
            name: "payrolls",
            component: PayrollView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
        },
        {
            path: "/allowances",
            name: "allowances",
            component: AllowanceView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/business-trips",
            name: "business-trips",
            component: BusinessTripView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
        },
        {
            path: "/evaluations",
            name: "evaluations",
            component: EvaluationView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER"] },
        },
        {
            path: "/degrees",
            name: "degrees",
            component: DegreeView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/departments",
            name: "departments",
            component: DepartmentView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/departments/:id",
            name: "department-detail",
            component: DepartmentDetailView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/positions",
            name: "positions",
            component: PositionView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/approvals",
            name: "approvals",
            component: ApprovalView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
        },
        {
            path: "/leave-requests",
            name: "leave-requests",
            component: LeaveRequestView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
        },
        {
            path: "/attendance/dashboard",
            name: "attendance-dashboard",
            component: () => import("@/views/attendance/AttendanceDashboard.vue"),
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER"] },
        },
        {
            path: "/attendance/my-calendar",
            name: "my-calendar",
            component: () => import("@/views/attendance/AttendanceEmployeeCalendar.vue"),
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
            props: (route) => {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                return {
                    employeeId: route.query.employeeId || user.employee_id || user.EmployeeId,
                    employeeName:
                        route.query.employeeName || user.full_name || user.FullName || "Của tôi",
                };
            },
        },
        {
            path: "/attendances",
            name: "attendances",
            component: () => import("@/views/attendance/AttendanceList.vue"),
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER"] },
        },
    ],
});

router.beforeEach((to, from, next) => {
    const user = getStoredUser();
    const role = normalizeRole(user);

    const requiresAuth = to.meta.requiresAuth !== false;
    const allowedRoles = to.meta.roles || [];

    // Nếu cố vào trang login khi đã đăng nhập
    if (to.path === "/login" && user) {
        // Kiểm tra xem có quyền vào dashboard không, nếu không thì cứ để ở dashboard
        // nhưng logic bên dưới sẽ đẩy về 403 nếu dashboard cấm.
        // Để tránh loop, ta chỉ chuyển hướng nếu trang đích không phải là nơi ta vừa bị đẩy ra.
        next("/dashboard");
        return;
    }

    if (requiresAuth && !user) {
        next("/login");
        return;
    }

    if (requiresAuth && allowedRoles.length > 0) {
        if (!role || !allowedRoles.includes(role)) {
            next("/403");
            return;
        }
    }

    next();
});

export default router;
