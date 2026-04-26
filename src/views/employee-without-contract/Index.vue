<script setup>
import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import EmployeesAPI from "@/apis/components/employees/employeesAPI";
import ContractsAPI from "@/apis/components/contracts/contractsAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import ContractForm from "../contract/ContractForm.vue";

defineOptions({
    name: "EmployeeWithoutContractIndex",
});

const columns = ref([
    { key: "employeeCode", name: "Mã nhân viên", typeFilter: "text", width: 160 },
    { key: "fullName", name: "Họ và tên", typeFilter: "text", width: 220 },
    { key: "gender", name: "Giới tính", typeFilter: "text", width: 100 },
    { key: "dateOfBirth", name: "Ngày sinh", type: "date", width: 140 },
    { key: "phoneNumber", name: "Số điện thoại", typeFilter: "text", width: 150 },
    { key: "email", name: "Email", typeFilter: "text", width: 220 },
    { key: "departmentName", name: "Phòng ban", typeFilter: "text", width: 180 },
    { key: "positionName", name: "Vị trí", typeFilter: "text", width: 180 },
    { key: "status", name: "Trạng thái", typeFilter: "status", width: 120 },
    { key: "actions", name: "Thao tác", type: "custom", width: 120, fixed: true },
]);

const getEmployeesWithoutContractPaging = async () => {
    const response = await EmployeesAPI.getEmployeesWithoutContract();
    const data = response?.data?.data || [];

    return {
        data: {
            data,
            meta: {
                total: data.length,
            },
        },
    };
};

const { loading, rows, payload, loadDataForAPI, reloadData } = usePagingTable(
    getEmployeesWithoutContractPaging,
);

const isFormOpen = ref(false);
const selectedEmployee = ref(null);

function handleAddContract(employee) {
    selectedEmployee.value = employee;
    isFormOpen.value = true;
}

async function handleSubmitContract(data) {
    try {
        await ContractsAPI.create(data);
        $toastSuccess("Thêm hợp đồng thành công");
        isFormOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Lưu hợp đồng thất bại");
        console.error(error);
    }
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex">
            <div class="content__title">Nhân viên chưa có hợp đồng</div>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                :loading="loading"
                :show-selection="false"
                :show-row-actions="false"
                @reload="reloadData"
            >
                <template #actions="{ row }">
                    <ms-button type="primary" size="small" @click="handleAddContract(row)">
                        Thêm hợp đồng
                    </ms-button>
                </template>
            </ms-table>

            <contract-form
                v-model="isFormOpen"
                :typeForm="'add'"
                :data="selectedEmployee"
                @submit="handleSubmitContract"
            />
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";
</style>
