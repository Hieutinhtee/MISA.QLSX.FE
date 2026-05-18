<script setup>
import { onMounted, ref, computed } from "vue";
import { Tag as ATag, Tooltip as ATooltip } from "ant-design-vue";
import { useRouter } from "vue-router";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import ContractsAPI from "@/apis/components/contracts/contractsAPI";
import { usePagingTable } from "@/composables/usePagingTable";
import ContractForm from "./ContractForm.vue";
import { $toastError, $toastSuccess } from "@/utils/toastService";
import { exportSelectedRows } from "@/utils/exportService";

const router = useRouter();

const columns = ref([
    { key: "employeeName", name: "Nhân viên", typeFilter: "text", width: 220, pinned: true },
    { key: "contractType", name: "Loại hợp đồng", typeFilter: "text", width: 170, pinned: true },
    { key: "contractCode", name: "Mã hợp đồng", typeFilter: "text", width: 160 },
    { key: "templateCode", name: "Mã mẫu", typeFilter: "text", width: 140 },
    { key: "templateName", name: "Tên mẫu", typeFilter: "text", width: 220 },

    { key: "employeeCode", name: "Mã nhân viên", typeFilter: "text", width: 160 },

    { key: "companyRepresentativeName", name: "Đại diện công ty", typeFilter: "text", width: 220 },
    { key: "companySignerTitle", name: "Chức danh ký", typeFilter: "text", width: 180 },
    {
        key: "contractStatus",
        name: "Trạng thái",
        type: "custom",
        typeFilter: "status",
        width: 150,
        pinned: true,
        options: [
            { value: "draft", label: "Bản nháp" },
            { value: "signed", label: "Đã ký" },
            { value: "active", label: "Đang hiệu lực" },
            { value: "expired", label: "Hết hạn" },
            { value: "terminated", label: "Đã chấm dứt" },
        ],
    },
    { key: "effectiveDate", name: "Ngày hiệu lực", type: "date", width: 140 },
    { key: "termMonths", name: "Thời hạn (tháng)", typeFilter: "number", width: 150 },
    { key: "baseSalary", name: "Lương cơ bản", typeFilter: "number", width: 150 },
    { key: "insuranceSalary", name: "Lương BH", typeFilter: "number", width: 150 },
    { key: "salaryRatio", name: "Tỷ lệ lương", typeFilter: "number", width: 140 },
    {
        key: "isSigned",
        name: "Đã ký",
        typeFilter: "status",
        width: 110,
        options: [
            { value: true, label: "Đã ký" },
            { value: false, label: "Chưa ký" },
        ],
    },
    { key: "signedAt", name: "Thời điểm ký", type: "date", width: 150 },
    { key: "createdAt", name: "Ngày tạo", type: "date", width: 140 },
    { key: "updatedAt", name: "Ngày sửa", type: "date", width: 140 },
]);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(ContractsAPI);

const isFormOpen = ref(false);
const typeForm = ref("add");
const selectedRow = ref(null);
const showTerminateConfirm = ref(false);
const contractToTerminate = ref(null);

function handleFormAddOpen() {
    typeForm.value = "add";
    selectedRow.value = null;
    isFormOpen.value = true;
}

function handleEdit(row) {
    typeForm.value = "edit";
    selectedRow.value = row;
    isFormOpen.value = true;
}

function handleViewDetail(row) {
    router.push(`/contracts/${row.contractId}`);
}

async function handleSubmit(data) {
    try {
        if (typeForm.value === "edit" && selectedRow.value?.contractId) {
            await ContractsAPI.update(selectedRow.value.contractId, data);
            $toastSuccess("Cập nhật hợp đồng thành công");
        } else {
            await ContractsAPI.create(data);
            $toastSuccess("Thêm hợp đồng thành công");
        }

        isFormOpen.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Lưu hợp đồng thất bại");
        console.error(error);
    }
}

async function handleTerminate(row) {
    contractToTerminate.value = row;
    showTerminateConfirm.value = true;
}

async function confirmTerminate() {
    if (!contractToTerminate.value) return;
    try {
        const row = contractToTerminate.value;
        const payload = { ...row, terminatedAt: new Date().toISOString() };
        await ContractsAPI.update(row.contractId, payload);
        $toastSuccess("Đã chấm dứt hợp đồng");
        showTerminateConfirm.value = false;
        await loadDataForAPI();
    } catch (error) {
        $toastError("Thao tác thất bại");
    }
}

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case "active":
            return "#52c41a"; // Xanh lá đậm (Success)
        case "signed":
            return "#1890ff"; // Xanh dương (Processing)
        case "draft":
            return "#8c8c8c"; // Xám (Draft)
        case "expired":
            return "#faad14"; // Cam (Warning)
        case "terminated":
            return "#f5222d"; // Đỏ (Error)
        default:
            return "#d9d9d9";
    }
};

const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
        case "active":
            return "Đang hiệu lực";
        case "signed":
            return "Đã ký";
        case "draft":
            return "Bản nháp";
        case "expired":
            return "Hết hạn";
        case "terminated":
            return "Đã chấm dứt";
        default:
            return status;
    }
};

async function handleBatchExport(rows) {
    try {
        await exportSelectedRows(ContractsAPI, rows, "Contracts");
        $toastSuccess("Xuất excel hợp đồng thành công");
    } catch (error) {
        $toastError("Xuất excel hợp đồng thất bại");
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
            <div class="content__title">Hợp đồng nhân viên</div>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                :loading="loading"
                row-actions-name="Thao tác"
                :row-column-width="160"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
                @edit-row="handleEdit"
                @batch-export="handleBatchExport"
            >
                <template #contractStatus="{ value }">
                    <a-tag :color="getStatusColor(value)">
                        {{ getStatusText(value) }}
                    </a-tag>
                </template>

                <template #row-actions="{ row }">
                    <div class="d-flex gap-8">
                        <ms-button type="primary" size="small" @click="handleViewDetail(row)">
                            Xem
                        </ms-button>
                        <ms-button
                            v-if="
                                row.contractStatus !== 'terminated' &&
                                row.contractStatus !== 'expired'
                            "
                            type="danger-outline"
                            size="small"
                            @click="handleTerminate(row)"
                        >
                            Chấm dứt
                        </ms-button>
                    </div>
                </template>

                <template #more-actions="{ row }"> </template>
            </ms-table>

            <contract-form
                v-model="isFormOpen"
                :typeForm="typeForm"
                :data="selectedRow"
                @submit="handleSubmit"
            />

            <ms-alert
                v-model="showTerminateConfirm"
                title="Xác nhận chấm dứt"
                show-confirm
                confirm-text="Xác nhận"
                @confirm="confirmTerminate"
            >
                Bạn có chắc chắn muốn chấm dứt hợp đồng
                <b>{{ contractToTerminate?.contractCode }}</b> của nhân viên
                <b>{{ contractToTerminate?.employeeName }}</b> không?
            </ms-alert>
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";
</style>
