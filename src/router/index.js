import { createRouter, createWebHistory } from "vue-router";
import ShiftView from "@/views/shift/Index.vue";
import EmployeeView from "@/views/employee/Index.vue";

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
    ],
});

export default router;
