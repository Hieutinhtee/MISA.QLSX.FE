import { createRouter, createWebHistory } from "vue-router";
import ShiftView from "@/views/shift/Index.vue";
import EmployeeView from "@/views/employee/Index.vue";
import ContractTemplateView from "@/views/contract-template/Index.vue";
import ContractView from "@/views/contract/Index.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: "/shifts",
        },
        {
            path: "/shifts",
            name: "shifts",
            component: ShiftView,
        },
        {
            path: "/employees",
            name: "employees",
            component: EmployeeView,
        },
        {
            path: "/contract-templates",
            name: "contract-templates",
            component: ContractTemplateView,
        },
        {
            path: "/contracts",
            name: "contracts",
            component: ContractView,
        },
    ],
});

export default router;
