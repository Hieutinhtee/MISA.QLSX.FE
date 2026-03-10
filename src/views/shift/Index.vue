<script setup>
import { onMounted, ref, watch, reactive } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsAlert from "@/components/ms-alert/MsAlert.vue";
import shiftForm from "./ShiftForm.vue";
import ShiftsAPI from "@/apis/components/shifts/shiftsAPI";
import { createShift } from "@/common/model/shiftModel";
import { $toastSuccess, $toastError } from "@/utils/toastService";

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
        key: "shiftCode",
        name: "Mã ca",
        typeFilter: "text",

        width: 120,
    },
    {
        key: "shiftName",
        name: "Tên ca",
        typeFilter: "text",
        width: 250,
    },
    {
        key: "shiftBeginTime",
        name: "Giờ vào ca",
        width: 130,
        type: "HH:mm",
    },
    {
        key: "shiftEndTime",
        name: "Giờ hết ca",
        width: 130,
        type: "HH:mm",
    },
    {
        key: "beginBreakTime",
        name: "Bắt đầu nghỉ giữa ca",
        width: 200,
        type: "HH:mm",
    },
    {
        key: "endBreakTime",
        name: "Kết thúc nghỉ giữa ca",
        width: 210,
        type: "HH:mm",
    },
    {
        key: "workingTime",
        name: "Thời gian làm việc (giờ)",
        typeFilter: "number",
        width: 210,
    },
    {
        key: "breakTime",
        name: "Thời gian nghỉ giữa ca (giờ)",
        typeFilter: "number",
        width: 230,
    },
    {
        key: "isActive",
        name: "Trạng thái",
        typeFilter: "boolean",
        width: 200,
        type: "custom",
    },
    {
        key: "createdBy",
        name: "Người tạo",
        typeFilter: "text",
        width: 160,
    },
    {
        key: "createdDate",
        name: "Ngày tạo",
        width: 160,
        type: "date",
    },
    {
        key: "modifiedBy",
        name: "Người sửa",
        typeFilter: "text",
        width: 160,
    },
    {
        key: "modifiedDate",
        name: "Ngày sửa",

        width: 160,
        type: "date",
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

/**
 * Trạng thái đóng mở form xác nhan xóa
 * createdBy: TMHieu (28/01/2026)
 */
const isOpenModal = ref(false);

/**
 * Text hiển thị trong form xác nhận xóa
 * createdBy: TMHieu (28/01/2026)
 */
const formText = ref("");

/**
 * Trạng thái loading của table khi gọi API
 * createdBy: TMHieu (28/01/2026)
 */
const loading = ref(false);

/**
 * Dữ liệu bảng ca làm việc
 * createdBy: TMHieu (28/01/2026)
 */
const rows = ref([]);

/**
 * @typedef {Object} FilterItem
 * @property {string} field - Tên field cần filter
 * @property {"eq"|"contains"|"gt"|"lt"} operator - Toán tử filter
 * @property {string|number|boolean|null} value - Giá trị filter
 */

/**
 * @typedef {Object} SortItem
 * @property {string} field - Field cần sắp xếp
 * @property {"asc"|"desc"} direction - Hướng sắp xếp
 */

/**
 * @typedef {Object} TableQuery
 * @property {number} page - Trang hiện tại
 * @property {number} pageSize - Số bản ghi mỗi trang
 * @property {string} search - Từ khóa tìm kiếm
 * @property {FilterItem[]} filters - Danh sách filter
 * @property {SortItem[]} sorts - Danh sách sort
 */
const payload = reactive({
    page: 1,
    pageSize: 20,
    search: "",
    filters: [],
    sorts: [],
});

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
 * lưu lại các row được gửi lên từ bảng
 * row xóa hoặc edit khi xử lí hàng loạt
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
    payload.filters = [];
    payload.sorts = [];
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
        } catch (error) {
            $toastError("Có lỗi xảy ra khi thêm ca làm việc");
            console.log(error);
        }
    }
    if (typeForm.value === "edit") {
        try {
            updateShift(shift);
        } catch (error) {
            $toastError("Có lỗi xảy ra khi cập nhật ca làm việc");
            console.log(error);
        }
    }
};

const handleSubmitAndAdd = (shift) => {
    try {
        addShift(shift, true);
    } catch (error) {
        $toastError("Có lỗi xảy ra khi thêm ca làm việc");
        console.log(error);
    }
};

/**
 * Xử lý lưu thêm ca làm việc mới
 * @param {Object} shift Đối tượng ca làm việc
 * createdBy: TMHieu (22/01/2026)
 */
function addShift(shift, isSaveAndAdd = false) {
    ShiftsAPI.create(shift).then((res) => {
        if (res.status === 201 || res.status === 200) {
            const newShift = res.data.data || shift;

            newShift.shiftId = res.data.id;
            newShift.createdBy = shift.createdBy;
            newShift.createdDate = new Date().toISOString();
            newShift.modifiedBy = shift.createdBy;
            newShift.modifiedDate = new Date().toISOString();
            // thêm vào đầu bảng
            rows.value.unshift(newShift);

            // nếu vượt quá pageSize thì bỏ row cuối
            if (rows.value.length > payload.pageSize) {
                rows.value.pop();
            }

            payload.totalRows++;

            $toastSuccess("Thêm ca làm việc thành công");
            shiftFormRef.value?.handleCloseForm();
            if (isSaveAndAdd) {
                typeForm.value = "add";
                isFormOpen.value = true;
            }
        }
    });
}

/**
 * Xử lý cập nhật ca làm việc
 * @param {Object} shift Đối tượng ca làm việc
 * createdBy: TMHieu (22/01/2026)
 */
function updateShift(shift) {
    ShiftsAPI.update(shift.shiftId, shift)
        .then((res) => {
            if (res.status === 201 || res.status === 200) {
                const index = rows.value.findIndex((x) => x.shiftId === shift.shiftId);

                if (index !== -1) {
                    rows.value[index] = { ...shift };
                }

                $toastSuccess("Cập nhật ca làm việc thành công");
                shiftFormRef.value?.handleCloseForm();
            }
        })
        .catch((error) => {
            console.log(error);
        });
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

    ShiftsAPI.delete(ids).then((res) => {
        if (res.status === 201 || res.status === 200) {
            rows.value = rows.value.filter((row) => !ids.includes(row.shiftId));

            payload.totalRows -= ids.length;

            isOpenModal.value = false;
            selectedRow.value = null;
            selectedRows.value = null;

            $toastSuccess("Xóa ca làm việc thành công");
        }
    });
}

// #region delete
/**
 * Xử lý sự kiện xóa dòng trên bảng
 * @param row dữ liệu 1 row trên bảng
 * createdBy: TMHieu (02/02/2026)
 */
function handleDelete(row) {
    formText.value = "Ca làm việc <strong>" + row.shiftCode + "</strong>";
    selectedRow.value = row;
    isOpenModal.value = true;
}

/**
 * Xử lý sự kiện xóa nhiều dòng cùng lúc trên bảng
 * @param row dữ liệu 1 row trên bảng
 * createdBy: TMHieu (02/02/2026)
 */
function handleBatchDelete(rows) {
    formText.value = "Các <strong>Ca làm việc</strong>";
    isOpenModal.value = true;
    selectedRows.value = rows;
}

/**
 * Xử lý sự kiện xác nhận xóa trong modal
 * createdBy: TMHieu (02/02/2026)
 */
const handleConfirmDelete = () => {
    if (selectedRow.value) {
        deleteShift(selectedRow.value.shiftId);
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

/**
 * Xử lý sự kiện thay đổi trạng thái hoạt động của 1 ca làm việc
 * @param {Object} row dữ liệu 1 row trên bảng
 * createdBy: TMHieu (02/02/2026)
 */
function handleChangeActive(row) {
    ShiftsAPI.update(row.shiftId, row).then(() => {
        const index = rows.value.findIndex((x) => x.shiftId === row.shiftId);

        if (index !== -1) {
            rows.value[index] = { ...row };
        }
    });
}

/**
 * Xử lý sự kiện thay đổi trạng thái hoạt động của nhiều ca làm việc cùng lúc
 * @param {Array} ids mảng id của các ca làm việc
 * @param {boolean} isActive trạng thái hoạt động mới
 * createdBy: TMHieu (02/02/2026)
 */
function handleBatchActive(ids, isActive) {
    ShiftsAPI.batchActive(ids, isActive).then((res) => {
        if (res.status === 201 || res.status === 200) {
            // cập nhật trạng thái trong table
            rows.value = rows.value.map((row) => {
                if (ids.includes(row.shiftId)) {
                    return {
                        ...row,
                        isActive: isActive,
                    };
                }
                return row;
            });

            shiftTableRef.value?.clearChecked();
        }
    });
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
    loading.value = true;
    setTimeout(async () => {
        try {
            // const { page, pageSize, search } = payload;
            const result = await ShiftsAPI.paging(JSON.parse(JSON.stringify(payload)));
            rows.value.splice(0, rows.value.length, ...result.data.data);
            payload.totalRows = result.data.meta.total;
        } catch (err) {
            console.error(err);
        } finally {
            loading.value = false;
        }
    }, 300); // Dùng setTimeout 300ms để thấy loading
}
//#endregion Methods

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
        @confirm="handleConfirmDelete"
    >
        <span v-html="formText"></span>
        sau khi bị xóa sẽ không thể khôi phục. Bạn có muốn tiếp tục xóa không?
    </ms-alert>

    <div class="content d-flex flex-1 flex-column">
        <!-- content header  -->
        <div class="content__header d-flex">
            <div class="content__title">Ca làm việc</div>

            <ms-button icon-left="icon-add" @click="handleFormAddOpen">Thêm</ms-button>
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
                :loading="loading"
                ref="shiftTableRef"
            >
                <template #isActive="{ value }">
                    <div v-if="value" class="inactive inactive--true">Đang sử dụng</div>
                    <div v-else class="inactive inactive--false">Ngừng sử dụng</div>
                </template>
            </ms-table>

            <shift-form
                v-model="isFormOpen"
                :typeForm="typeForm"
                @submit="handleSubmit"
                @submit-and-add="handleSubmitAndAdd"
                ref="shiftFormRef"
                :data="selectedRow"
            ></shift-form>
        </div>
    </div>
</template>

<style scoped>
@import "Index.css";
</style>
