<script setup>
import { onMounted, ref, watch } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import shiftForm from "./ShiftForm.vue";
import { Modal } from "ant-design-vue";
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
//#endregion Constants

//#region State Data

/**
 * Dữ liệu bảng ca làm việc
 * createdBy: TMHieu (28/01/2026)
 */
const rows = ref([]);

/**
 * Giá trị nhập trong ô tìm kiếm
 * createdBy: TMHieu (29/01/2026)
 */
const searchInput = ref("");

/**
 * Các trường dùng để tìm kiếm ca làm việc
 * createdBy: TMHieu (29/01/2026)
 */
const searchFields = ref(["fullName", "email", "phone"]);

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
 * Giá trị tìm kiếm đã được debounce
 * createdBy: TMHieu (29/01/2026)
 */
const searchDebounced = ref("");

/**
 * lưu lại row được gửi lên từ bảng
 * row xóa hoặc edit
 * createdBy: TMHieu (29/01/2026)
 */
const selectedRow = ref(null);

//#endregion State Data

//#region Methods

/**
 * Xử lý dữ liệu khi form gửi lên sự kiện submit
 * createdBy: TMHieu (22/01/2026)
 */
const handleSubmit = (shift) => {
    if (typeForm.value === "add") {
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
            updateshift(shift);
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
function addShift(shift) {}

/**
 * Xử lý cập nhật ca làm việc
 * @param {Object} shift Đối tượng ca làm việc
 * createdBy: TMHieu (22/01/2026)
 */
function updateshift(shift) {
    const editshiftId = parseInt(selectedRow.value.id);
    if (isNaN(editshiftId)) return;

    let datas = getshiftData();

    const newshift = shift;
    const index = datas.findIndex((e) => e.id === editshiftId);
    if (index !== -1) {
        datas[index] = {
            ...datas[index],
            ...newshift,
            id: editshiftId,
        };
    }
    rows.value = datas;
    saveshiftToLocal(datas);
}

// #region delete
/**
 * Xử lý sự kiện xóa dòng trên bảng
 * @param row dữ liệu 1 row trên bảng
 * createdBy: TMHieu (02/02/2026)
 */
function handleDelete(row) {
    showModal();
    selectedRow.value = row;
}

/**
 * Trạng thái đóng mở modal xác nhận xóa
 * createdBy: TMHieu (02/02/2026)
 */
const open = ref(false);

/**
 * Hàm xử lý sư kiện mở modal
 * createdBy: TMHieu (02/02/2026)
 */
const showModal = () => {
    open.value = true;
};

/**
 * Hàm xử lý sự kiện xác nhận xóa
 * createdBy: TMHieu (02/02/2026)
 */
const handleOk = () => {};
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
 * Hàm gọi API lấy danh sách khách hàng theo payload hiện tại
 * createdby: TMHieu - 09.12.2025
 */
async function loadDataForAPI() {
    setTimeout(async () => {
        try {
            const result = await ShiftsAPI.getAll({});
            rows.value.splice(0, rows.value.length, ...result.data.data);
        } catch (err) {
            console.error(err);
        }
    }, 100); // Dùng setTimeout 0ms để tách khỏi watch/ui thread
}
//#endregion Methods

//#region watchers

/**
 * debounceTimer giá trị tìm kiếm
 * createdBy: TMHieu (29/01/2026)
 */
let debounceTimer = null;

/**
 * Thay đổi giá trị tìm kiếm
 * createdBy: TMHieu (29/01/2026)
 */
watch(searchInput, (value) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        searchDebounced.value = value;
    }, 300);
});

//endregion watchers

//#region Lifecycle Hooks
onMounted(() => {
    // Cập nhật lại dữ liệu ca làm việc từ LocalStorage khi component được mount
    loadDataForAPI();
});
//#endregion Lifecycle Hooks
</script>

<template>
    <modal v-model:open="open" title="Xác nhận xóa ca làm việc" @ok="handleOk">
        <p>Bạn có chắc chắn muốn xóa ca làm việc này</p>
    </modal>
    <div class="content d-flex flex-1 flex-column">
        <!-- content header  -->
        <div class="content__header d-flex">
            <div class="content__title">Ca làm việc</div>

            <ms-button :icon-left="'add'" @click="handleFormAddOpen">Thêm</ms-button>
        </div>
        <!-- content body -->
        <div class="content__body d-flex flex-1">
            <ms-table
                :columns="columns"
                :rows="rows"
                :search="searchDebounced"
                :searchFields="searchFields"
                @delete-row="handleDelete"
                @edit-row="handleEdit"
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
