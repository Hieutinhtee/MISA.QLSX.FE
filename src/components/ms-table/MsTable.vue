<script setup>
import { ref, defineProps, watch, computed } from "vue";
import { renderValue } from "@/utils/renderRowTable.js";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsButton from "@/components/ms-button/MsButton.vue";

const pageSizeOptions = ref([
    {
        value: "15",
        label: "15",
    },
    {
        value: "25",
        label: "25",
    },
    {
        value: "50",
        label: "50",
    },
    {
        value: "100",
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
    search: {
        type: String,
        default: "",
    },
    searchFields: {
        type: Array,
        default: () => [],
    },
});
//#endregion

//#region State Data
/**
 * Dữ liệu phân trang
 * @property {number} page - Trang hiện tại.
 * @property {number} pageSize - Số bản ghi trên mỗi trang.
 * createdBy: TMHieu (28/01/2026)
 */
let pagingData = ref({
    page: 1,
    pageSize: 15,
});
//#endregion State Data

//#region Methods
/**
 * Xử lý khi nhấn nút Prev
 * createdBy: TMHieu (29/01/2026)
 */
const handlePrevPage = () => {
    if (pagingData.value.page > 1) {
        pagingData.value.page--;
    }
};

/**
 * Xử lý khi nhấn nút Next
 * createdBy: TMHieu (29/01/2026)
 */
const handleNextPage = () => {
    if (pagingData.value.page < totalPages.value) {
        pagingData.value.page++;
    }
};

/**
 * Xử lý khi nhấn nút xóa trên row table
 * emit data row lên cho index xử lý
 * createdBy: TMHieu (29/01/2026)
 */
const handleDelete = (row) => {
    emit("deleteRow", row);
};

/**
 * Xử lý khi nhấn nút sửa trên row table
 * emit data row lên cho index xử lý
 * createdBy: TMHieu (29/01/2026)
 */
const handleEdit = (row) => {
    emit("editRow", row);
};
//#endregion Methods

//#Region emit

const emit = defineEmits(["deleteRow", "editRow"]);

//#Endregion emit

//#region Computed
/**
 * Hàm lọc dữ liệu dựa trên từ khóa tìm kiếm
 * @param {string} keyword Từ khóa tìm kiếm
 * @returns Dữ liệu đã lọc
 * createdBy: TMHieu (24/01/2026)
 */
const filteredRows = computed(() => {
    if (!props.search) {
        return props.rows;
    }

    const value = props.search.toLowerCase();

    return props.rows.filter((item) =>
        props.searchFields.some((field) =>
            String(item[field] ?? "")
                .toLowerCase()
                .includes(value),
        ),
    );
});

/**
 * Tính tổng số trang dựa trên dữ liệu đã lọc
 * createdBy: TMHieu (29/01/2026)
 */
const totalPages = computed(() => Math.ceil(filteredRows.value.length / pagingData.value.pageSize));

/**
 * Tính tổng số bản ghi đã lọc
 * createdBy: TMHieu (29/01/2026)
 */
const totalRows = computed(() => filteredRows.value.length);

/**
 * Kiểm tra trạng thái nút Prev
 * createdBy: TMHieu (29/01/2026)
 */
const isDisabledPrev = computed(() => pagingData.value.page <= 1);

/**
 * Kiểm tra trạng thái nút Next
 * createdBy: TMHieu (29/01/2026)
 */
const isDisabledNext = computed(() => pagingData.value.page >= totalPages.value);

/**
 * Tính số thứ tự của bản ghi đầu trang
 * createdBy: TMHieu (29/01/2026)
 */
const recordStart = computed(() => {
    if (!pagedRows.value) return 0;
    return (pagingData.value.page - 1) * pagingData.value.pageSize + 1;
});

/**
 * Tính số thứ tự của bản ghi cuối trang
 * createdBy: TMHieu (29/01/2026)
 */
const recordEnd = computed(() => {
    return Math.min(pagingData.value.page * pagingData.value.pageSize, filteredRows.value.length);
});

/**
 * Lấy dữ liệu bản ghi cho trang hiện tại
 * createdBy: TMHieu (29/01/2026)
 */
const pagedRows = computed(() => {
    const start = (pagingData.value.page - 1) * pagingData.value.pageSize;
    const end = recordEnd.value;

    return filteredRows.value.slice(start, end);
});

//#endregion Computed

//#region Watchers

/**
 * Theo dõi sự thay đổi của pageSize
 * createdBy: TMHieu (29/01/2026)
 */
watch(
    () => pagingData.value.pageSize,
    () => {
        pagingData.value.page = 1;
    },
);

/**
 * Khi search thay đổi thì reset trang va tinh lai ban ghi
 * createdBy TMHieu 29/01/2026
 */
watch(
    () => props.search,
    () => {
        pagingData.value.page = 1;
    },
);

//#endregion Watchers
</script>

<template>
    <div class="content__body-header d-flex justify-content-between">
        <div class="content__search-left d-flex align-items-center">
            <div class="content__search-icon"></div>
            <input class="content__search-input" placeholder="Tìm kiếm" v-model="searchInput" />
        </div>
        <ms-button :type="'outline'">
            <div class="content__reload-icon"></div>
        </ms-button>
    </div>
    <div class="content__datagrid">
        <table class="content__table">
            <thead class="content__table-header">
                <tr>
                    <th class="content__table-checkbox content__table-checkbox-header">
                        <input type="checkbox" />
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
                <tr v-for="row in pagedRows" :key="row.id" tabindex="0">
                    <td class="content__table-checkbox col-checkbox">
                        <input type="checkbox" :data-id="row.id" />
                    </td>

                    <td v-for="column in columns" :key="column.key">
                        <!-- Tùy chỉnh hiển thị cột trong bảng -->
                        <template v-if="column.type === 'custom'">
                            <slot :name="column.key" :row="row" :value="row[column.key]">
                                {{ renderValue(row[column.key]) }}
                            </slot>
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
                                @click="handleDelete(row)"
                            ></div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <!-- Phân trang table -->
    <div class="content__paging d-flex justify-content-between align-items-center">
        <div class="content__paging-info m-r-12">
            Tổng: <b class="total-row">{{ totalRows }}</b> bản ghi
        </div>
        <div class="content__paging-controls d-flex align-items-center gap-12">
            <div class="content__paging-controls-title">Số bản ghi/trang</div>

            <div class="content__paging-page-size pointer">
                <ms-select
                    style="width: 75px"
                    :options="pageSizeOptions"
                    v-model="pagingData.pageSize"
                ></ms-select>
            </div>

            <div class="content__paging-start-page">{{ recordStart }}</div>
            <div class="content__paging--">-</div>
            <div class="content__paging-end-page">{{ recordEnd }}</div>
            <div class="content__paging-title">bản ghi</div>

            <button
                class="content__paging-prev-btn"
                :disabled="isDisabledPrev"
                :class="isDisabledPrev ? 'content__paging-btn--disabled' : ''"
                @click="handlePrevPage"
            ></button>
            <button
                class="content__paging-next-btn"
                :disabled="isDisabledNext"
                :class="isDisabledNext ? 'content__paging-btn--disabled' : ''"
                @click="handleNextPage"
            ></button>
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
</style>
