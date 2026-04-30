import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "@/views/dashboard/Index.vue";
import ShiftView from "@/views/shift/Index.vue";
import EmployeeView from "@/views/employee/Index.vue";
import ContractTemplateView from "@/views/contract-template/Index.vue";
import ContractView from "@/views/contract/Index.vue";
import ContractDetailView from "@/views/contract/Detail.vue";
import PayrollView from "@/views/payroll/Index.vue";
import EmployeeWithoutContractView from "@/views/employee-without-contract/Index.vue";
import AllowanceView from "@/views/allowance/Index.vue";
import BusinessTripView from "@/views/business-trip/Index.vue";
import EvaluationView from "@/views/evaluation/Index.vue";
import DegreeView from "@/views/degree/Index.vue";
import LoginView from "@/views/login/LoginView.vue";
import ForbiddenView from "@/views/forbidden/Index.vue";

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
            path: "/contract-templates",
            name: "contract-templates",
            component: ContractTemplateView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR"] },
        },
        {
            path: "/contracts",
            name: "contracts",
            component: ContractView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER"] },
        },
        {
            path: "/contracts/:id",
            name: "contract-detail",
            component: ContractDetailView,
            meta: { requiresAuth: true, roles: ["ADMIN", "HR", "MANAGER"] },
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
    ],
});

router.beforeEach((to, from, next) => {
    const userRaw = localStorage.getItem("user");
    let user = null;

    try {
        user = userRaw ? JSON.parse(userRaw) : null;
    } catch {
        localStorage.removeItem("user");
    }

    // Normalize role: remove "ROLE_" prefix if present
    let role = user?.role;
    if (role?.startsWith("ROLE_")) {
        role = role.substring(5); // Remove "ROLE_" prefix
    }

    const requiresAuth = to.meta.requiresAuth !== false;
    const allowedRoles = to.meta.roles || [];

    if (to.path === "/login" && user) {
        next("/dashboard");
        return;
    }

    if (requiresAuth && !user) {
        next("/login");
        return;
    }

    if (requiresAuth && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        next("/403");
        return;
    }

    next();
});

export default router;
