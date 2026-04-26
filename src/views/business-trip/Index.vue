<script setup>
import { onMounted, ref } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import BusinessTripForm from "./BusinessTripForm.vue";
import BusinessTripsAPI from "@/apis/components/business-trips/businessTripsAPI";
import { $toastSuccess, $toastError } from "@/utils/toastService";
import { usePagingTable } from "@/composables/usePagingTable";

const columns = ref([
    { key: "businessTripCode", name: "Mã công tác", typeFilter: "text", width: 150 },
    { key: "employeeCode", name: "Mã nhân viên", typeFilter: "text", width: 120 },
    { key: "employeeName", name: "Tên nhân viên", typeFilter: "text", width: 200 },
    { key: "startDate", name: "Ngày bắt đầu", width: 150, type: "date" },
    { key: "endDate", name: "Ngày kết thúc", width: 150, type: "date" },
    { key: "location", name: "Địa điểm", typeFilter: "text", width: 200 },
    { key: "purpose", name: "Mục đích", typeFilter: "text", width: 250 },
    { key: "supportAmount", name: "Mức hỗ trợ", typeFilter: "number", width: 150 },
    { key: "createdAt", name: "Ngày tạo", width: 150, type: "date" },
    { key: "updatedAt", name: "Ngày sửa", width: 150, type: "date" },
    { key: "actions", name: "Thao tác", width: 120 },
]);

const businessTripFormRef = ref(null);
const businessTripTableRef = ref(null);
const isOpenModal = ref(false);
const formText = ref("");
const typeForm = ref("add");
const isFormOpen = ref(false);
const selectedRow = ref(null);
const selectedRows = ref(null);

const { loading, rows, payload, reloadData, onPaginationUpdate, onSearchChange, loadDataForAPI } =
    usePagingTable(BusinessTripsAPI);

const handleSubmit = (businessTrip) => {
    if (typeForm.value === "add" || typeForm.value === "duplicate") {
        try {
            addBusinessTrip(businessTrip);
        } catch (error) {
            $toastError("Có lỗi xảy ra khi thêm công tác");
            console.log(error);
        }
    }
    if (typeForm.value === "edit") {
        try {
            updateBusinessTrip(businessTrip);
        } catch (error) {
            $toastError("Có lỗi xảy ra khi cập nhật công tác");
            console.log(error);
        }
    }
};

const handleSubmitAndAdd = (businessTrip) => {
    try {
        addBusinessTrip(businessTrip, true);
    } catch (error) {
        $toastError("Có lỗi xảy ra khi thêm công tác");
        console.log(error);
    }
};

function addBusinessTrip(businessTrip, isSaveAndAdd = false) {
    BusinessTripsAPI.create(businessTrip).then((res) => {
        if (res.status === 201 || res.status === 200) {
            const newBusinessTrip = res.data.data || businessTrip;
            newBusinessTrip.businessTripId = res.data.id;
            newBusinessTrip.createdAt = new Date().toISOString();
            newBusinessTrip.updatedAt = new Date().toISOString();
            rows.value.unshift(newBusinessTrip);

            if (rows.value.length > payload.pageSize) {
                rows.value.pop();
            }

            payload.totalRows++;
            $toastSuccess("Thêm công tác thành công");
            businessTripFormRef.value?.handleCloseForm();
            if (isSaveAndAdd) {
                typeForm.value = "add";
                isFormOpen.value = true;
            }
        }
    });
}

function updateBusinessTrip(businessTrip) {
    BusinessTripsAPI.update(businessTrip.businessTripId, businessTrip)
        .then((res) => {
            if (res.status === 201 || res.status === 200) {
                const index = rows.value.findIndex((x) => x.businessTripId === businessTrip.businessTripId);
                if (index !== -1) {
                    rows.value[index] = { ...businessTrip };
                }
                $toastSuccess("Cập nhật công tác thành công");
                businessTripFormRef.value?.handleCloseForm();
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

function deleteBusinessTrip(businessTrip) {
    let ids = businessTrip;
    if (!Array.isArray(businessTrip)) {
        ids = [businessTrip];
    }

    BusinessTripsAPI.delete(ids).then((res) => {
        if (res.status === 201 || res.status === 200) {
            rows.value = rows.value.filter((row) => !ids.includes(row.businessTripId));
            payload.totalRows -= ids.length;
            isOpenModal.value = false;
            selectedRow.value = null;
            selectedRows.value = null;
            $toastSuccess("Xóa công tác thành công");
        }
    });
}

function handleDelete(row) {
    formText.value = "Công tác <strong>" + row.businessTripCode + "</strong>";
    selectedRow.value = row;
    isOpenModal.value = true;
}

function handleBatchDelete(rows) {
    formText.value = "Các <strong>Công tác</strong>";
    isOpenModal.value = true;
    selectedRows.value = rows;
}

const handleConfirmDelete = () => {
    if (selectedRow.value) {
        deleteBusinessTrip(selectedRow.value.businessTripId);
        businessTripTableRef.value?.clearChecked();
    }
    if (selectedRows.value) {
        deleteBusinessTrip(selectedRows.value);
        businessTripTableRef.value?.clearChecked();
    }
};

function handleEdit(row) {
    typeForm.value = "edit";
    isFormOpen.value = true;
    selectedRow.value = row;
}

function handleFormAddOpen() {
    typeForm.value = "add";
    isFormOpen.value = true;
}

function handleDuplicate(row) {
    typeForm.value = "duplicate";
    selectedRow.value = row;
    isFormOpen.value = true;
}

onMounted(() => {
    loadDataForAPI();
});
</script>

<template>
    <ms-alert
        v-model="isOpenModal"
        title="Xác nhận xóa"
        :showConfirm="true"
        @confirm="handleConfirmDelete"
    >
        <span v-html="formText"></span>
        sau khi bị xóa sẽ không thể khôi phục. Bạn có muốn tiếp tục xóa không?
    </ms-alert>

    <div class="content d-flex flex-1 flex-column">
        <div class="content__header d-flex">
            <div class="content__title">Công tác</div>
            <ms-button icon-left="icon-add" @click="handleFormAddOpen">Thêm</ms-button>
        </div>

        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :pagination-data="payload"
                @update:pagination="onPaginationUpdate"
                @update:search="onSearchChange"
                @reload="reloadData"
                @delete-row="handleDelete"
                @edit-row="handleEdit"
                @batch-delete="handleBatchDelete"
                @duplicate="handleDuplicate"
                :loading="loading"
                ref="businessTripTableRef"
            ></ms-table>

            <business-trip-form
                v-model="isFormOpen"
                :typeForm="typeForm"
                @submit="handleSubmit"
                @submit-and-add="handleSubmitAndAdd"
                ref="businessTripFormRef"
                :data="selectedRow"
            ></business-trip-form>
        </div>
    </div>
</template>

<style scoped>
@import "../shift/Index.css";
</style>
