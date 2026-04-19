<script setup>
import { onMounted, reactive, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";

const columns = ref([
    { key: "employeeCode", name: "Mã nhân viên", typeFilter: "text", width: 140 },
    { key: "fullName", name: "Họ tên", typeFilter: "text", width: 220 },
    { key: "gender", name: "Giới tính", typeFilter: "text", width: 120 },
    { key: "dateOfBirth", name: "Ngày sinh", type: "date", width: 140 },
    { key: "address", name: "Địa chỉ", typeFilter: "text", width: 260 },
    { key: "phoneNumber", name: "Số điện thoại", typeFilter: "text", width: 160 },
    { key: "email", name: "Email", typeFilter: "text", width: 220 },
    { key: "joinDate", name: "Ngày vào làm", type: "date", width: 140 },
    { key: "nationalId", name: "CCCD/CMND", typeFilter: "text", width: 160 },
    // { key: "avatarUrl", name: "Ảnh đại diện", typeFilter: "text", width: 200 },
    { key: "departmentName", name: "Phòng ban", typeFilter: "text", width: 220 },
    { key: "shiftName", name: "Ca làm", typeFilter: "text", width: 180 },
    { key: "degreeName", name: "Bằng cấp", typeFilter: "text", width: 180 },
    { key: "positionName", name: "Chức vụ", typeFilter: "text", width: 180 },
    { key: "accountName", name: "Tài khoản", typeFilter: "text", width: 180 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 140 },
]);

const loading = ref(false);
const rows = ref([]);

const payload = reactive({
    page: 1,
    pageSize: 20,
    search: "",
    filters: [],
    sorts: [],
    totalRows: 0,
});

function reloadData() {
    payload.page = 1;
    payload.pageSize = 20;
    payload.search = "";
    payload.filters = [];
    payload.sorts = [];
    loadDataForAPI();
}

function onPaginationUpdate(newPayload) {
    Object.assign(payload, newPayload);
    loadDataForAPI();
}

const onSearchChange = (newPayload) => {
    Object.assign(payload, newPayload);
    loadDataForAPI();
};

async function loadDataForAPI() {
    loading.value = true;
    try {
        const result = await EmployeesAPI.paging(JSON.parse(JSON.stringify(payload)));
        rows.value.splice(0, rows.value.length, ...result.data.data);
        payload.totalRows = result.data.meta.total;
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex">
            <div class="content__title">Nhân viên</div>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                :loading="loading"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
            />
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";
</style>
