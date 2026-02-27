<script setup>
import { onMounted, ref, watch } from "vue";
import MsTable from "@/components/ms-table/MsTable.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import shiftForm from "./ShiftForm.vue";
import { renderValue, getAvatarColor, getAvatarLetter } from "@/utils/renderRowTable.js";
import shiftData from "@/common/datas/shift-data";
import { normalizeshiftData } from "@/utils/common.js";
import { Modal } from "ant-design-vue";
import { useToast } from "vue-toastification";

const toast = useToast();
// #region Constants

/**
 * Khóa lưu trữ dữ liệu ứng viên trong LocalStorage
 * createdBy: TMHieu (22/01/2026)
 */
const shift_STORAGE_KEY = "shiftData";

/**
 * Dữ liệu cột bảng ứng viên
 * @property {string} name - Tên cột.
 * @property {number} width - Chiều rộng cột (px).
 * createdBy: TMHieu (28/01/2026)
 */
const columns = ref([
    {
        key: "shiftCode",
        name: "Mã ca",
        width: 120,
    },
    {
        key: "shiftName",
        name: "Tên ca",
        width: 250,
    },
    {
        key: "beginShiftTime",
        name: "Giờ vào ca",
        width: 130,
    },
    {
        key: "endShiftTime",
        name: "Giờ hết ca",
        width: 130,
    },
    {
        key: "beginBreakTime",
        name: "Bắt đầu nghỉ giữa ca",
        width: 200,
    },
    {
        key: "endBreakTime",
        name: "Kết thúc nghỉ giữa ca",
        width: 210,
    },
    {
        key: "workingTime",
        name: "Thời gian làm việc (giờ)",
        width: 210,
    },
    {
        key: "workingTime",
        name: "Thời gian nghỉ giữa ca (giờ)",
        width: 230,
    },
    {
        key: "inactive",
        name: "Trạng thái",
        width: 200,
    },
    {
        key: "createdBy",
        name: "Người tạo",
        width: 160,
    },
    {
        key: "ModifiedBy",
        name: "Người sửa",
        width: 160,
    },
    {
        key: "ModifiedDate",
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
 * Dữ liệu bảng ứng viên
 * createdBy: TMHieu (28/01/2026)
 */
const rows = ref([]);

/**
 * Giá trị nhập trong ô tìm kiếm
 * createdBy: TMHieu (29/01/2026)
 */
const searchInput = ref("");

/**
 * Các trường dùng để tìm kiếm ứng viên
 * createdBy: TMHieu (29/01/2026)
 */
const searchFields = ref(["fullName", "email", "phone"]);

/**
 * Kiểu form hiện tại: thêm hoặc sửa
 * createdBy: TMHieu (29/01/2026)
 */
const typeForm = ref("add");

/**
 * Trạng thái mở/đóng form ứng viên
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
 * Lấy dữ liệu ứng viên từ LocalStorage
 * createdBy: TMHieu (22/01/2026)
 * @returns {Array}
 */
function getshiftData() {
    const dataLocal = localStorage.getItem(shift_STORAGE_KEY);

    if (dataLocal) {
        try {
            return JSON.parse(dataLocal);
        } catch (error) {
            console.error("LocalStorage data parse error", error);
        }
    }

    // Nếu chưa có hoặc lỗi → dùng data mặc định
    saveshiftToLocal(shiftData);
    return shiftData;
}

/**
 * Xử lý dữ liệu khi form gửi lên sự kiện submit
 * createdBy: TMHieu (22/01/2026)
 */
const handleSubmit = (shift) => {
    if (typeForm.value === "add") {
        try {
            addshift(shift);
            shiftFormRef.value?.handleCloseForm();
            toast.success("Thêm ứng viên thành công");
        } catch (error) {
            toast.error(error);
        }
    }
    if (typeForm.value === "edit") {
        try {
            updateshift(shift);
            shiftFormRef.value?.handleCloseForm();
            toast.success("Chỉnh sửa ứng viên thành công");
        } catch (error) {
            toast.error(error);
        }
    }
};

/**
 * Xử lý lưu thêm ứng viên mới
 * @param {Object} shift Đối tượng ứng viên
 * createdBy: TMHieu (22/01/2026)
 */
function addshift(shift) {
    let datas = getshiftData();

    //Tạo id tự động
    let newId = 1;
    if (datas.length > 0) {
        newId = Math.max(...datas.map((item) => Number(item.id) || 0)) + 1;
    }

    shift.id = newId;

    //Thêm dữ liệu vào mảng
    datas.unshift(shift);
    rows.value = datas;
    saveshiftToLocal(datas);
}

/**
 * Xử lý cập nhật ứng viên
 * @param {Object} shift Đối tượng ứng viên
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

/**
 * Lưu dữ liệu ứng viên vào LocalStorage
 * createdBy: TMHieu (22/01/2026)
 * @param {Array} datas Danh sách dữ liệu
 */
function saveshiftToLocal(datas) {
    if (!Array.isArray(datas)) return;

    const safeData = datas.map((item) => normalizeshiftData(item));

    localStorage.setItem(shift_STORAGE_KEY, JSON.stringify(safeData));
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
const handleOk = () => {
    const shiftId = parseInt(selectedRow.value.id);
    if (isNaN(shiftId)) return;
    let datas = getshiftData();

    //Xóa ứng viên khỏi mảng dữ liệu
    datas = datas.filter((item) => item.id !== shiftId);

    rows.value = datas;

    //Lưu lại dữ liệu vào LocalStorage
    saveshiftToLocal(datas);
    toast.success("Xóa ứng viên thành công");
    open.value = false;
};
//#endregion delete

// #region edit

/**
 * Hàm xử lý sự kiện mở form sửa ứng viên
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
 * Hàm xử lý sự kiện mở form thêm ứng viên
 * createdBy: TMHieu (29/01/2026)
 */
function handleFormAddOpen() {
    typeForm.value = "add";
    isFormOpen.value = true;
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
    // Cập nhật lại dữ liệu ứng viên từ LocalStorage khi component được mount
    rows.value = getshiftData();
});
//#endregion Lifecycle Hooks
</script>

<template>
    <modal v-model:open="open" title="Xác nhận xóa ứng viên" @ok="handleOk">
        <p>Bạn có chắc chắn muốn xóa ứng viên này</p>
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
                <template #fullName="{ value }">
                    <div class="d-flex align-items-center gap-8">
                        <div
                            class="shift-avatar"
                            :style="{ backgroundColor: getAvatarColor(value) }"
                        >
                            {{ getAvatarLetter(value) }}
                        </div>
                        <span>{{ renderValue(value) }}</span>
                    </div>
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
