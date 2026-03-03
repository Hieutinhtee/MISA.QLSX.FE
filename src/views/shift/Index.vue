<script setup>
import { onMounted, ref, watch, reactive } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import shiftForm from "./ShiftForm.vue";
import { useToast } from "vue-toastification";
import ShiftsAPI from "@/apis/components/shifts/shiftsAPI";

const toast = useToast();
// #region Constants

/**
 * Dữ liệu cột bảng ca làm việc
 * @property {string} key - Mã cót.
 * @property {string} name - Tên cột.
 * @property {number} width - Chiều rộng cột (px).
 * createdBy: TMHieu (28/01/2026)
 */
const columns = ref([
    {
        key: "productionShiftCode",
        name: "Mã ca",
        width: 120,
    },
    {
        key: "productionShiftName",
        name: "Tên ca",
        width: 250,
    },
    {
        key: "productionShiftBeginTime",
        name: "Giờ vào ca",
        width: 130,
        type: "HH:mm",
    },
    {
        key: "productionShiftEndTime",
        name: "Giờ hết ca",
        width: 130,
        type: "HH:mm",
    },
    {
        key: "productionShiftBeginBreakTime",
        name: "Bắt đầu nghỉ giữa ca",
        width: 200,
        type: "HH:mm",
    },
    {
        key: "productionShiftEndBreakTime",
        name: "Kết thúc nghỉ giữa ca",
        width: 210,
        type: "HH:mm",
    },
    {
        key: "productionShiftWorkingTime",
        name: "Thời gian làm việc (giờ)",
        width: 210,
    },
    {
        key: "productionShiftBreakTime",
        name: "Thời gian nghỉ giữa ca (giờ)",
        width: 230,
    },
    {
        key: "productionShiftIsActive",
        name: "Trạng thái",
        width: 200,
        type: "custom",
    },
    {
        key: "productionShiftCreatedBy",
        name: "Người tạo",
        width: 160,
    },
    {
        key: "productionShiftModifiedBy",
        name: "Người sửa",
        width: 160,
    },
    {
        key: "productionShiftModifiedDate",
        name: "Ngày sửa",
        width: 160,
    },
]);

/**
 * Ref trỏ tới form để dùng các hàm được đẩy lên như
 * reset hoặc focus input
 */
const shiftFormRef = ref(null);

/**
 * Ref trỏ tới modal để dùng các hàm được đẩy lên như
 * reset hoặc focus input
 */
const shiftTableRef = ref(null);
//#endregion Constants

//#region State Data

const isOpenModal = ref(false);
const formText = ref("");
const showConfirm = ref(false);

/**
 * Dữ liệu bảng ca làm việc
 * createdBy: TMHieu (28/01/2026)
 */
const rows = ref([]);

// Payload phân trang và filter
/**
 * Dữ liệu payload để gọi API phân trang và filter
 * @type {Object}
 */
const payload = reactive({
    page: 1,
    pageSize: 20,
    search: "",
    totalRows: 0,
});

// /**
//  * Các trường dùng để tìm kiếm ca làm việc
//  * createdBy: TMHieu (29/01/2026)
//  */
// const searchFields = ref([
//     "productionShiftCode",
//     "productionShiftName",
//     "productionShiftModifiedBy",
//     "productionShiftCreatedBy",
// ]);

/**
 * Kiểu form hiện tại: thêm hoặc sửa
 * createdBy: TMHieu (29/01/2026)
 */
const typeForm = ref("add");

/**
 * Trạng thái mở/đóng form ca làm việc
 * createdBy: TMHieu (29/01/2026)
 */
const isFormOpen = ref(false);

/**
 * lưu lại row được gửi lên từ bảng
 * row xóa hoặc edit
 * createdBy: TMHieu (29/01/2026)
 */
const selectedRow = ref(null);

/**
 * lưu lại row được gửi lên từ bảng
 * row xóa hoặc edit
 * createdBy: TMHieu (29/01/2026)
 */
const selectedRows = ref(null);
//#endregion State Data

//#region Methods

/**
 * Hàm reload lại dữ liệu về trạng thái mặc định (trang 1, clear filter)
 * createdby: TMHieu - 09.12.2025
 */
function reloadData() {
    payload.page = 1;
    payload.pageSize = 20;
    payload.search = "";
    loadDataForAPI();
}

/**
 * Xử lý dữ liệu khi form gửi lên sự kiện submit
 * createdBy: TMHieu (22/01/2026)
 */
const handleSubmit = (shift) => {
    if (typeForm.value === "add" || typeForm.value === "duplicate") {
        try {
            addShift(shift);
            shiftFormRef.value?.handleCloseForm();
            toast.success("Thêm ca làm việc thành công");
        } catch (error) {
            toast.error(error);
        }
    }
    if (typeForm.value === "edit") {
        try {
            updateShift(shift);
            shiftFormRef.value?.handleCloseForm();
            toast.success("Chỉnh sửa ca làm việc thành công");
        } catch (error) {
            toast.error(error);
        }
    }
};

/**
 * Xử lý lưu thêm ca làm việc mới
 * @param {Object} shift Đối tượng ca làm việc
 * createdBy: TMHieu (22/01/2026)
 */
function addShift(shift) {
    ShiftsAPI.create(shift)
        .then((res) => {
            if (res.status === 201 || res.status === 200) {
                shiftFormRef.value?.handleCloseForm();
            }
        })
        .catch(() => {})
        .finally(() => {});
}

/**
 * Xử lý cập nhật ca làm việc
 * @param {Object} shift Đối tượng ca làm việc
 * createdBy: TMHieu (22/01/2026)
 */
function updateShift(shift) {
    ShiftsAPI.update(shift.productionShiftId, shift)
        .then((res) => {
            if (res.status === 201 || res.status === 200) {
                shiftFormRef.value?.handleCloseForm();
            }
        })
        .catch(() => {})
        .finally(() => {});
}

/**
 * Xử lý xóa ca làm việc
 * @param {Object} shift Đối tượng ca làm việc
 * createdBy: TMHieu (22/01/2026)
 */
function deleteShift(shift) {
    let ids = shift;
    if (!Array.isArray(shift)) {
        ids = [shift];
    }
    ShiftsAPI.delete(ids)
        .then((res) => {
            if (res.status === 201 || res.status === 200) {
                isOpenModal.value = false;
                selectedRow.value = null;
                selectedRows.value = null;
            }
        })
        .catch(() => {})
        .finally(() => {});
}

// #region delete
/**
 * Xử lý sự kiện xóa dòng trên bảng
 * @param row dữ liệu 1 row trên bảng
 * createdBy: TMHieu (02/02/2026)
 */
function handleDelete(row) {
    formText.value = "Ca làm việc <strong>" + row.productionShiftCode + "</strong>";
    selectedRow.value = row;
    isOpenModal.value = true;
}

/**
 * Xử lý sự kiện xóa dòng trên bảng
 * @param row dữ liệu 1 row trên bảng
 * createdBy: TMHieu (02/02/2026)
 */
function handleBatchDelete(rows) {
    formText.value = "Các <strong>Ca làm việc</strong>";
    isOpenModal.value = true;
    selectedRows.value = rows;
}

const handleConfirmDelete = () => {
    if (selectedRow.value) {
        deleteShift(selectedRow.value.productionShiftId);
        shiftTableRef.value?.clearChecked();
    }
    if (selectedRows.value) {
        deleteShift(selectedRows.value);
        shiftTableRef.value?.clearChecked();
    }
};
//#endregion delete

// #region edit

/**
 * Hàm xử lý sự kiện mở form sửa ca làm việc
 * @param row dữ liệu 1 row trên bảng
 * createdBy: TMHieu (29/01/2026)
 */
function handleEdit(row) {
    typeForm.value = "edit";
    isFormOpen.value = true;
    selectedRow.value = row;
}

function handleChangeActive(row) {
    selectedRow.value = row;
    updateShift(row);
}

function handleBatchActive(rows, isActive) {
    ShiftsAPI.batchActive(rows, isActive)
        .then((res) => {
            if (res.status === 201 || res.status === 200) {
                shiftTableRef.value?.clearChecked();
            }
        })
        .catch(() => {})
        .finally(() => {});
}
// #endregion edit
/**
 * Hàm xử lý sự kiện mở form thêm ca làm việc
 * createdBy: TMHieu (29/01/2026)
 */
function handleFormAddOpen() {
    typeForm.value = "add";
    isFormOpen.value = true;
}

/**
 * Hàm xử lý sự kiện mở form nhân bản ca làm việc
 * createdBy: TMHieu (29/01/2026)
 */
function handleDuplicate(row) {
    typeForm.value = "duplicate";
    selectedRow.value = row;
    isFormOpen.value = true;
}

/**
 * Hàm xử lý khi thay đổi phân trang (nhận từ component con)
 * @param {Object} newPayload - { page, pageSize }
 * createdby: TMHieu - 09.12.2025
 */
function onPaginationUpdate(newPayload) {
    Object.assign(payload, newPayload);
    loadDataForAPI();
}

const onSearchChange = (newPayload) => {
    Object.assign(payload, newPayload);
    loadDataForAPI();
};

/**
 * Hàm gọi API lấy danh sách khách hàng theo payload hiện tại
 * createdby: TMHieu - 09.12.2025
 */
async function loadDataForAPI() {
    setTimeout(async () => {
        try {
            const { page, pageSize, search } = payload;
            const result = await ShiftsAPI.paging({
                page,
                pageSize,
                search,
            });
            rows.value.splice(0, rows.value.length, ...result.data.data);
            payload.totalRows = result.data.meta.total;
        } catch (err) {
            console.error(err);
        }
    }, 0); // Dùng setTimeout 0ms để tách khỏi watch/ui thread
}
//#endregion Methods

//#region watchers

//endregion watchers

//#region Lifecycle Hooks
onMounted(() => {
    // Load dữ liệu ca làm việc khi component được mount
    loadDataForAPI();
});
//#endregion Lifecycle Hooks
</script>

<template>
    <ms-alert
        v-model="isOpenModal"
        title="Xác nhận xóa"
        :showConfirm="true"
        @close="showConfirm = false"
        @confirm="handleConfirmDelete"
    >
        <span v-html="formText"></span>
        sau khi bị xóa sẽ không thể khôi phục. Bạn có muốn tiếp tục xóa không?
    </ms-alert>

    <div class="content d-flex flex-1 flex-column">
        <!-- content header  -->
        <div class="content__header d-flex">
            <div class="content__title">Ca làm việc</div>

            <ms-button :icon-left="'icon-add'" @click="handleFormAddOpen">Thêm</ms-button>
        </div>
        <!-- content body -->
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
                @edit-active="handleChangeActive"
                @batch-is-active="handleBatchActive"
                @batch-delete="handleBatchDelete"
                @duplicate="handleDuplicate"
                ref="shiftTableRef"
            >
                <template #productionShiftIsActive="{ value }">
                    <div v-if="value" class="inactive inactive--true">Đang sử dụng</div>
                    <div v-else class="inactive inactive--false">Ngừng sử dụng</div>
                </template>
            </ms-table>

            <shift-form
                v-model="isFormOpen"
                :typeForm="typeForm"
                @submit="handleSubmit"
                ref="shiftFormRef"
                :data="selectedRow"
            ></shift-form>
        </div>
    </div>
</template>

<style scoped>
@import "Index.css";
</style>
