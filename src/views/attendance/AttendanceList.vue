<script setup>
defineOptions({ name: "AttendanceList" });

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { 
    CalendarOutlined, 
    SearchOutlined,
    UserOutlined
} from "@ant-design/icons-vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import employeesAPI from "@/apis/components/employees/employeesAPI";
import { usePagingTable } from "@/composables/usePagingTable";

const router = useRouter();
const employeeTableRef = ref(null);

const columns = ref([
    {
        name: "Mã nhân viên",
        key: "employeeCode",
        typeFilter: "text",
        width: 140,
    },
    {
        name: "Họ và tên",
        key: "fullName",
        typeFilter: "text",
        width: 250,
    },
    {
        name: "Phòng ban",
        key: "departmentName",
        typeFilter: "text",
        width: 220,
    },
    {
        name: "Chức vụ",
        key: "positionName",
        typeFilter: "text",
        width: 200,
    },
    {
        name: "Số điện thoại",
        key: "phoneNumber",
        typeFilter: "text",
        width: 150,
    }
]);

const { 
    loading, 
    rows, 
    payload, 
    loadDataForAPI, 
    reloadData,
    onPaginationUpdate, 
    onSearchChange 
} = usePagingTable(employeesAPI);

function handleViewCalendar(row) {
    router.push({ 
        name: "my-calendar", 
        query: { 
            employeeId: row.employeeId, 
            employeeName: row.fullName 
        } 
    });
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <div class="content d-flex flex-1 flex-column">
        <!-- content header  -->
        <div class="content__header d-flex">
            <div class="content__title">Bảng chấm công nhân viên</div>
        </div>
        <!-- content body -->
        <div class="content__body d-flex flex-1">
            <MsTable
                ref="employeeTableRef"
                :columns="columns"
                :rows="rows"
                :loading="loading"
                :pagination-data="payload"
                row-actions-name="Thao tác"
                :row-column-width="150"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
                @row-click="handleViewCalendar"
            >
                <template #row-actions="{ row }">
                    <div class="d-flex gap-8">
                        <button 
                            class="action-btn action-btn--view" 
                            title="Xem chi tiết chấm công"
                            @click.stop="handleViewCalendar(row)"
                        >
                            <calendar-outlined />
                            <span class="ml-4">Xem chấm công</span>
                        </button>
                    </div>
                </template>
            </MsTable>
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";

.action-btn {
    height: 32px;
    padding: 0 12px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: #009b71;
    font-size: 13px;
    font-weight: 500;
}

.action-btn:hover {
    border-color: #009b71;
    background-color: #ecfdf5;
}

.ml-4 {
    margin-left: 4px;
}
</style>
