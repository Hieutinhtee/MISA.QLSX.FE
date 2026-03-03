<script setup>
import { ref, defineProps, watch, computed, reactive, onMounted, onBeforeUnmount } from "vue";
import { renderValue } from "@/utils/renderRowTable.js";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import { formatTimeHHMM } from "@/utils/common.js";

const pageSizeOptions = ref([
    {
        value: 10,
        label: "10",
    },
    {
        value: 20,
        label: "20",
    },
    {
        value: 30,
        label: "30",
    },
    {
        value: 50,
        label: "50",
    },
    {
        value: 100,
        label: "100",
    },
]);

//#region Props
const props = defineProps({
    columns: {
        type: Array,
        required: true,
    },
    rows: {
        type: Array,
        required: true,
    },
    type: {
        type: Array,
        default: () => [],
        validator: (value) => Array.isArray(value),
    },
    /** prop cho paging, sort */
    paginationData: {
        type: Object,
        required: true,
    },
});
//#endregion

//#region State Data

/**
 * Danh sách của bản ghi chọn
 * createdBy: TMHieu (29/01/2026)
 */
const selected = ref([]); // chứa id được chọn (khi isCheck = false)

/**
 * Copy local của dữ liệu phân trang để component con tự quản lý
 * @property {number} recordStart - Số thứ tự bản ghi đầu trang.
 * @property {number} recordEnd - Số thứ tự bản ghi cuối trang.
 */
const localData = reactive({
    ...props.paginationData,
    recordStart: 1,
    recordEnd: 1,
});

// Trạng thái các nút paging
const pagingState = ref({
    first: true,
    prev: true,
    next: false,
    last: false,
});

/**
 * Giá trị nhập trong ô tìm kiếm
 * createdBy: TMHieu (29/01/2026)
 */
const searchInput = ref("");

/**
 * Trạng thái mở popup xem thêm
 * createdBy: TMHieu (29/01/2026)
 */
const showMoreRowId = ref(null);

const popupTransform = ref("translate(-100%, 0)");
//#endregion State Data

//#region Methods

/**
 * Xử lý id cơ bản
 * @param {object} row - Các trường của table
 * createdBy: TMHieu (28/01/2026)
 */
const getRowId = (row) => {
    const idKey = Object.keys(row).find((k) => k.toLowerCase().endsWith("id"));
    return idKey ? row[idKey] : null;
};

/**
 * Xử lý kiểu field
 * @param {object} field - Các trường của table
 * createdBy: TMHieu (28/01/2026)
 */
const getFieldType = (field) => {
    const valid = ["text", "number", "date", "custom", "HH:mm"];
    return valid.includes(field) ? field : "text";
};

/**
 * Hàm tính lại recordStart (bản ghi đầu) và recordEnd (bản ghi cuối)
 * dựa trên pageSize và page (số trang).
 * @param {number} pageNumber - Số trang hiện tại.
 * createdby: TMHieu - 09.12.2025
 */
function computeRecordRange(pageNumber) {
    if (localData.totalRows === 0) {
        localData.recordStart = 0;
        localData.recordEnd = 0;
        return;
    }
    localData.recordStart = (pageNumber - 1) * localData.pageSize + 1;
    localData.recordEnd = Math.min(
        localData.recordStart + localData.pageSize - 1,
        localData.totalRows,
    );
}

/**
 * Xử lý khi đổi kích thước trang (pageSize) → reset về trang 1
 * @param {number} value - PageSize mới.
 * createdby: TMHieu - 09.12.2025
 */
function onChangePageSize(value) {
    localData.pageSize = value;
    localData.page = 1; // reset về trang 1
    computeRecordRange(localData.page);
    // Emit sự kiện lên cha để cha gọi API lấy dữ liệu mới
    emit("update:pagination", { ...localData });
}

/**
 * Thay đổi trang hiện tại khi nhấn các nút điều hướng (first, prev, next, last).
 * @param {('first'|'prev'|'next'|'last')} action - Hành động chuyển trang.
 * createdby: TMHieu - 09.12.2025
 */
function changePage(action) {
    const totalPages = Math.ceil(localData.totalRows / localData.pageSize);
    let currentPage = localData.page || 1;

    switch (action) {
        case "first":
            currentPage = 1;
            break;
        case "prev":
            currentPage = Math.max(currentPage - 1, 1);
            break;
        case "next":
            currentPage = Math.min(currentPage + 1, totalPages);
            break;
        case "last":
            currentPage = totalPages;
            break;
    }

    // Ngăn chặn gọi API nếu không có thay đổi trang (hoặc trang cuối/đầu)
    if (localData.page === currentPage) return;

    localData.page = currentPage;
    computeRecordRange(currentPage);
    // Emit sự kiện lên cha để cha gọi API lấy dữ liệu mới
    emit("update:pagination", { ...localData });
}

// Khởi tạo range khi component mount lần đầu
computeRecordRange(localData.page || 1);

/**
 * Xử lý khi nhấn nút xóa trên row table
 * emit data row lên cho index xử lý
 * createdBy: TMHieu (29/01/2026)
 */
const handleDelete = (row) => {
    emit("deleteRow", row);
};

/**
 * Xử lý khi nhấn nút reload table
 * emit data row lên cho index xử lý
 * createdBy: TMHieu (29/01/2026)
 */
const handleReload = () => {
    emit("reload");
};

/**
 * Xử lý khi nhấn nút sửa trên row table
 * emit data row lên cho index xử lý
 * createdBy: TMHieu (29/01/2026)
 */
const handleEdit = (row) => {
    emit("editRow", row);
};

const handleDuplicate = (row) => {
    emit("duplicate", row);
};

const handleActive = (rows, isActive) => {
    emit("batchIsActive", rows, isActive);
};

const handleChangeActive = (row) => {
    if (row.productionShiftIsActive) row.productionShiftIsActive = false;
    else row.productionShiftIsActive = true;
    emit("editActive", row);
};

const handleBatchDelete = (rows) => {
    emit("batchDelete", rows);
};

/**
 * Vị trí popup more (theo tọa độ chuột)
 * createdBy: TMHieu
 */
const popupPosition = ref({ x: 0, y: 0 });

const currentRow = ref(null);

/**
 * Xử lý khi nhấn nút ... trên row table
 * Lưu vị trí chuột để render popup đúng chỗ
 * createdBy: TMHieu (29/01/2026)
 */

const handleMore = (row, event) => {
    if (showMoreRowId.value === getRowId(row)) {
        showMoreRowId.value = null;
        currentRow.value = null;
        return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const screenHeight = window.innerHeight;

    // Kiểm tra nếu click ở 1/3 dưới màn hình
    const isBottomThird = rect.top > (screenHeight * 2) / 3;

    popupPosition.value = {
        x: rect.right,
        y: isBottomThird ? rect.top - 4 : rect.bottom + 4,
    };

    // Đổi transform
    popupTransform.value = isBottomThird ? "translate(-100%, -100%)" : "translate(-100%, 0)";

    showMoreRowId.value = getRowId(row);
    currentRow.value = row;
};

//#endregion Methods

//#region Methods - Row & Selection, All checkbox

const calculateChecked = () => {
    return selected.value.length;
};

/**
 * Xử lý sự kiện click vào một hàng (row) trên bảng, emit data của dòng đó lên cha xử lý
 * @param {Object} event - Sự kiện click từ PrimeVue DataTable.
 * createdby: TMHieu - 09.12.2025
 */
function handleRowClick(event) {
    emit("row-click", event.data); // event.data là row được click
}

/**
 * Xử lý sự kiện click vào allCheckbox trên bảng đổi state đánh dấu, trạng thái hiển thị,
 * emit mảng đã tick và mảng đã bỏ tick lên cha mỗi khi thay đổi
 * createdby: TMHieu - 12.12.2025
 */
const onHeaderCheck = () => {
    const idsThisPage = props.rows.map((r) => getRowId(r));

    const allSelected = idsThisPage.every((id) => selected.value.includes(id));

    if (allSelected) {
        // bỏ chọn hết
        selected.value = selected.value.filter((id) => !idsThisPage.includes(id));
    } else {
        // chọn tất cả trên trang
        selected.value = [...new Set([...selected.value, ...idsThisPage])];
    }

    emit("update:selected", [...selected.value]);
};

/**
 * Dòng được chọn hay không
 * @param {Object} row - data của dòng được chọn
 * createdby: TMHieu - 12.12.2025
 */
const isRowChecked = (id) => {
    return selected.value.includes(id);
};

/**
 * Xử lý hiển thị và trạng thái khi user tick/untick trên dòng
 * @param {Object} row - data của dòng được chọn
 * createdby: TMHieu - 12.12.2025
 */
const toggleRow = (id) => {
    const idx = selected.value.indexOf(id);

    if (idx >= 0) {
        selected.value.splice(idx, 1);
    } else {
        selected.value.push(id);
    }

    emit("update:selected", [...selected.value]);
};

const selectedRows = computed(() => props.rows.filter((r) => selected.value.includes(getRowId(r))));

const hasActive = computed(() => selectedRows.value.some((r) => r.productionShiftIsActive));

const hasInactive = computed(() => selectedRows.value.some((r) => !r.productionShiftIsActive));

const clearChecked = () => {
    selected.value = [];
};
//#endregion

//#Region emit

const emit = defineEmits([
    "deleteRow",
    "editRow",
    "duplicate",
    "editActive",
    "reload",
    "update:pagination",
    "batchIsActive",
    "batchDelete",
]);

//#Endregion emit

//#region Computed

const isHeaderChecked = computed(() => {
    if (!props.rows.length) return false;

    const idsThisPage = props.rows.map((r) => getRowId(r));
    return idsThisPage.every((id) => selected.value.includes(id));
});

//#endregion Computed

//#region Watchers

/**
 * Khởi tạo thời gian debounce
 */
let debounceTimer = null;

/**
 * Theo dõi sự thay đổi của text search (Debounce)
 * createdby: TMHieu - 09.12.2025
 */
watch(
    () => searchInput,
    (newVal) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            localData.page = 1; // Reset về trang 1 khi search
            localData.search = newVal;
            emit("update:search", { ...localData });
        }, 350);
    },
    { deep: true },
);

/**
 * Theo dõi sự thay đổi của props.paginationData từ component cha
 * và cập nhật localData, đồng thời tính lại range hiển thị.
 */
watch(
    () => props.paginationData,
    (newVal) => {
        Object.assign(localData, newVal);
        computeRecordRange(localData.page);
    },
    { deep: true },
);

/**
 * Theo dõi thứ tự bản ghi đầu cuối trên trang
 * Cập nhật lại trạng thái các nút paging
 */
watch(
    () => [localData.recordStart, localData.recordEnd],
    ([newStart, newEnd]) => {
        // Nếu không có dữ liệu
        if (localData.totalRows === 0) {
            pagingState.value.first = true;
            pagingState.value.prev = true;
            pagingState.value.next = true;
            pagingState.value.last = true;
            return;
        }

        // Disable first + prev nếu đang ở đầu
        const isAtStart = newStart <= 1;

        // Disable next + last nếu đang ở cuối
        const isAtEnd = newEnd >= localData.totalRows;

        pagingState.value.first = isAtStart;
        pagingState.value.prev = isAtStart;
        pagingState.value.next = isAtEnd;
        pagingState.value.last = isAtEnd;
    },
    { immediate: true },
);

watch(
    () => props.rows,
    () => {
        selected.value = [];
        emit("update:selected", []);
    },
);
//#endregion Watchers

const handleClickOutside = (event) => {
    const popup = document.querySelector(".content__table-popup-more");

    if (!popup) return;

    if (!popup.contains(event.target)) {
        showMoreRowId.value = null;
        currentRow.value = null;
    }
};

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
});

defineExpose({
    clearChecked,
});
</script>

<template>
    <div class="content__body-header d-flex justify-content-between">
        <div class="content__search-left d-flex align-items-center gap-12">
            <div class="content__search-icon"></div>
            <input class="content__search-input" placeholder="Tìm kiếm" v-model="searchInput" />
            <div v-if="calculateChecked()">
                Đã chọn <strong>{{ calculateChecked() }}</strong>
            </div>
            <ms-button @click="clearChecked" v-if="calculateChecked()" type="text"
                >Bỏ chọn</ms-button
            >
            <ms-button
                icon-left="content__table-active-icon"
                type="primary-outline"
                v-if="hasInactive"
                @click="handleActive(selected, true)"
                >Sử dụng</ms-button
            >
            <ms-button
                v-if="hasActive"
                icon-left="content__table-empty-icon"
                type="danger-outline"
                @click="handleActive(selected, false)"
                >Ngừng sử dụng</ms-button
            >
            <ms-button
                v-if="calculateChecked()"
                icon-left="content__table-bin-icon"
                type="danger-outline"
                @click="handleBatchDelete(selected)"
                >Xóa</ms-button
            >
        </div>
        <ms-button :type="'outline'">
            <div class="content__reload-icon" @click="handleReload"></div>
        </ms-button>
    </div>
    <div class="content__datagrid">
        <table class="content__table">
            <thead class="content__table-header">
                <tr>
                    <th class="content__table-checkbox content__table-checkbox-header">
                        <input type="checkbox" :checked="isHeaderChecked" @change="onHeaderCheck" />
                    </th>
                    <th
                        :style="['width: ' + item.width + 'px']"
                        v-for="item in columns"
                        :key="item"
                    >
                        <div class="content__table-header-wrapper d-flex align-items-center">
                            <div class="content__table-header-line"></div>
                            <div class="content__table-header-title">{{ item.name }}</div>
                        </div>
                    </th>
                    <th class="col-delete" style="width: 80px"></th>
                </tr>
            </thead>
            <tbody class="table-shift__tbody">
                <!-- Dữ liệu bảng sẽ được hiển thị ở đây -->
                <tr v-for="row in rows" :key="getRowId(row)" tabindex="0">
                    <td class="content__table-checkbox col-checkbox">
                        <input
                            type="checkbox"
                            :data-id="row"
                            :checked="isRowChecked(getRowId(row))"
                            @change="toggleRow(getRowId(row))"
                        />
                    </td>

                    <td v-for="column in columns" :key="column.key">
                        <!-- Tùy chỉnh hiển thị cột trong bảng -->
                        <template v-if="getFieldType(column.type) === 'custom'">
                            <slot :name="column.key" :row="row" :value="row[column.key]">
                                <!-- {{ renderValue(row[column.key]) }} -->
                            </slot>
                        </template>

                        <template v-else-if="getFieldType(column.type) === 'HH:mm'">
                            <span>{{ renderValue(formatTimeHHMM(row[column.key])) }}</span>
                        </template>

                        <!-- Các cột khác nếu không phải kiểu custom -->
                        <template v-else>
                            {{ renderValue(row[column.key]) }}
                        </template>
                    </td>

                    <!-- Hành động sửa xóa trên bảng -->
                    <td class="col-delete d-flex justify-content-between align-items-center">
                        <div class="btn-modify-wrapper">
                            <div
                                class="content__table-btn-modify content__table-btn-edit"
                                title="Chỉnh sửa"
                                @click="handleEdit(row)"
                            ></div>
                        </div>
                        <div class="btn-modify-wrapper">
                            <div
                                class="content__table-btn-modify content__table-btn-delete"
                                title="Xóa"
                                @click.stop="handleMore(row, $event)"
                            ></div>
                        </div>
                        <Teleport to="body">
                            <div v-if="showMoreRowId !== null"></div>

                            <div
                                v-if="showMoreRowId !== null"
                                class="content__table-popup-more"
                                :style="{
                                    position: 'fixed',
                                    left: popupPosition.x + 'px',
                                    top: popupPosition.y + 'px',
                                    zIndex: 5,
                                    transform: popupTransform,
                                }"
                            >
                                <div
                                    class="content__table-popup-item d-flex"
                                    @click="handleDuplicate(currentRow)"
                                >
                                    <div class="content__table-duplicate-icon"></div>
                                    <div class="content__table-popup-text">Nhân bản</div>
                                </div>
                                <div
                                    v-if="currentRow?.productionShiftIsActive"
                                    class="content__table-popup-item d-flex"
                                    @click="handleChangeActive(currentRow)"
                                >
                                    <div class="content__table-empty-icon"></div>
                                    <div class="content__table-popup-text">Ngừng sử dụng</div>
                                </div>
                                <div
                                    v-else
                                    class="content__table-popup-item d-flex"
                                    @click="handleChangeActive(currentRow)"
                                >
                                    <div class="content__table-active-icon"></div>
                                    <div class="content__table-popup-text">Sử dụng</div>
                                </div>
                                <!-- Cần biết row hiện tại để check isActive, xem bên dưới -->
                                <div
                                    class="content__table-popup-item d-flex"
                                    @click="handleDelete(currentRow)"
                                >
                                    <div class="content__table-bin-icon"></div>
                                    <div class="content__table-popup-text">Xóa</div>
                                </div>
                            </div>
                        </Teleport>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <!-- Phân trang table -->
    <div class="content__paging d-flex justify-content-between align-items-center">
        <div class="content__paging-info m-r-12">
            Tổng: <b class="total-row">{{ localData.totalRows }}</b> bản ghi
        </div>
        <div class="content__paging-controls d-flex align-items-center gap-16">
            <div class="content__paging-controls-title">Số dòng/trang</div>

            <div class="content__paging-page-size pointer">
                <ms-select
                    style="width: 75px"
                    :options="pageSizeOptions"
                    v-model:value="localData.pageSize"
                    @change="onChangePageSize"
                >
                    <div class="content__paging-icon-down"></div>
                </ms-select>
            </div>

            <div class="content__paging-start-page">
                <strong>{{ localData.recordStart }}</strong>
            </div>
            <div class="content__paging--">-</div>
            <div class="content__paging-end-page">
                <strong>{{ localData.recordEnd }}</strong>
            </div>

            <div class="content__paging-btn-wrapper d-flex align-items-center">
                <button
                    class="content__paging-backward-btn"
                    :disabled="pagingState.first"
                    :class="pagingState.first ? 'content__paging-btn--disabled' : ''"
                    @click="changePage('first')"
                ></button>
                <button
                    class="content__paging-prev-btn"
                    :disabled="pagingState.prev"
                    :class="pagingState.prev ? 'content__paging-btn--disabled' : ''"
                    @click="changePage('prev')"
                ></button>
                <button
                    class="content__paging-next-btn"
                    :disabled="pagingState.next"
                    :class="pagingState.next ? 'content__paging-btn--disabled' : ''"
                    @click="changePage('next')"
                ></button>

                <button
                    class="content__paging-forward-btn"
                    :disabled="pagingState.last"
                    :class="pagingState.last ? 'content__paging-btn--disabled' : ''"
                    @click="changePage('last')"
                ></button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "MsTable.css";

select {
    height: 34px;
    width: 100%;
    min-width: 0;
    padding: 2px 16px 0;
    border-radius: var(--border-radius);
    outline: none;
    border: 1px solid #dcdce3;
}

select:focus {
    border-color: var(--primary-color);
}

select:hover {
    border-color: var(--primary-color);
}

.content__paging-btn--disabled {
    background-color: #c9cdd4;
}

.content__paging-btn-wrapper {
    margin-left: 16px;
    column-gap: 24px;
}
</style>
