<script setup>
import {
    ref,
    defineProps,
    watch,
    computed,
    reactive,
    onMounted,
    onBeforeUnmount,
    nextTick,
} from "vue";
import { renderValue } from "@/utils/renderRowTable.js";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import { formatTimeHHMM, formatDateDDMMYYYY } from "@/utils/common.js";
import { Tooltip, InputNumber } from "ant-design-vue";
import { createFilter, createSort } from "@/common/model/shiftModel";

//#region Props & Emits
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
        default: () => ({
            page: 1,
            pageSize: 20,
            search: "",
            filters: [],
            sorts: [],
            totalRows: 0,
        }),
    },
    loading: {
        type: Boolean,
        default: false,
    },
    storageKey: {
        type: String,
        default: "",
    },
    showSelection: {
        type: Boolean,
        default: true,
    },
    showActiveActions: {
        type: Boolean,
        default: false,
    },
    showExportSelected: {
        type: Boolean,
        default: true,
    },
    showRowActions: {
        type: Boolean,
        default: true,
    },
    showSearch: {
        type: Boolean,
        default: true,
    },
    showReload: {
        type: Boolean,
        default: true,
    },
    showColumnConfig: {
        type: Boolean,
        default: true,
    },
    rowColumnWidth: {
        type: Number,

    },
    rowActionsName: {
        type: String,
        default: "Thao tác",
    },
});

const emit = defineEmits([
    "deleteRow",
    "editRow",
    "duplicate",
    "editActive",
    "reload",
    "update:pagination",
    "batchIsActive",
    "batchDelete",
    "batchExport",
    "update:selected",
    "row-click",
    "update:search",
]);
//#endregion

//#region State Data
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

const filterOptions = ref([
    {
        value: "eq",
        label: "Bằng",
        type: ["text", "number"],
    },
    {
        value: "neq",
        label: "Khác",
        type: ["text", "number"],
    },

    {
        value: "contains",
        label: "Chứa",
        type: ["text"],
    },
    {
        value: "notcontains",
        label: "Không chứa",
        type: ["text"],
    },
    {
        value: "starts",
        label: "Bắt đầu với",
        type: ["text"],
    },
    {
        value: "ends",
        label: "Kết thúc với",
        type: ["text"],
    },

    {
        value: "lt",
        label: "Nhỏ hơn",
        type: ["number"],
    },
    {
        value: "lte",
        label: "Nhỏ hơn hoặc bằng",
        type: ["number"],
    },
    {
        value: "gt",
        label: "Lớn hơn",
        type: ["number"],
    },
    {
        value: "gte",
        label: "Lớn hơn hoặc bằng",
        type: ["number"],
    },

    {
        value: "isnull",
        label: "(Trống)",
        type: ["text", "number"],
    },
    {
        value: "notnull",
        label: "(Không trống)",
        type: ["text", "number"],
    },

    {
        value: "active",
        label: "Đang sử dụng",
        type: ["boolean"],
    },
    {
        value: "inactive",
        label: "Ngừng sử dụng",
        type: ["boolean"],
    },
]);

const filterOperator = ref(null);
const filterValue = ref("");

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

/**
 * Trạng thái mở popup sắp xếp
 * createdBy: TMHieu (29/01/2026)
 */
const isShowSortPopup = ref(null);

/**
 * Popup lọc theo từng cột trong header table.
 * createdBy: TMHieu
 */
const isShowFilterPopup = ref(null);

/**
 * Danh sách key của các cột đã ghim.
 * Thứ tự phần tử quyết định thứ tự hiển thị cột ghim.
 * createdBy: TMHieu
 */
const pinnedColumns = ref([]);

/**
 * Vị trí transform mặc định của popup more
 * createdBy: TMHieu (29/01/2026)
 */
const popupTransform = ref("translate(-100%, 0)");

/**
 * Vị trí popup more (theo tọa độ chuột)
 * createdBy: TMHieu
 */
const popupPosition = ref({ x: 0, y: 0 });

/**
 * Dòng hiện tại đang thao tác (xem thêm, sửa, xóa...)
 * createdBy: TMHieu (29/01/2026)
 */
const currentRow = ref(null);

/**
 * Trạng thái popup tùy chỉnh cột.
 * Bao gồm tìm kiếm, sắp xếp, ghim và kéo thả.
 * createdBy: TMHieu
 */
const isColumnDrawerOpen = ref(false);
const columnSearch = ref("");
const columnSettings = ref([]);
const draggedColumnKey = ref(null);
const dragOverColumnKey = ref(null);
const datagridRef = ref(null);
const datagridWidth = ref(0);

const CHECKBOX_COLUMN_WIDTH = 48;
const ACTION_COLUMN_WIDTH = 80;

const selectionColumnWidth = computed(() => (props.showSelection ? CHECKBOX_COLUMN_WIDTH : 0));
const rowActionsColumnWidth = computed(() => (props.showRowActions ? ACTION_COLUMN_WIDTH : 0));

let datagridResizeObserver = null;
//#endregion

//#region Computed

const columnStorageKey = computed(() => {
    const key = props.storageKey?.trim();
    if (key) return `ms-table-columns:${key}`;

    const path = typeof window !== "undefined" ? window.location.pathname : "default";
    const columnsKey = props.columns.map((c) => c.key).join("|");
    return `ms-table-columns:${path}:${columnsKey}`;
});

const orderedColumnSettings = computed(() => {
    return [...columnSettings.value].sort((a, b) => a.order - b.order);
});

const filteredColumnSettings = computed(() => {
    const keyword = columnSearch.value.trim().toLowerCase();
    if (!keyword) return orderedColumnSettings.value;

    return orderedColumnSettings.value.filter((item) =>
        (item.name || "").toLowerCase().includes(keyword),
    );
});

const isAllColumnsChecked = computed(() => {
    if (!columnSettings.value.length) return false;
    return columnSettings.value.every((item) => item.visible);
});

const displayColumns = computed(() => {
    const settingsMap = new Map(columnSettings.value.map((item) => [item.key, item]));

    const columns = [...props.columns]
        .filter((column) => settingsMap.get(column.key)?.visible !== false)
        .map((column) => {
            const setting = settingsMap.get(column.key);
            return {
                ...column,
                width: setting?.width ?? column.width ?? 100,
            };
        })
        .sort((a, b) => {
            const orderA = settingsMap.get(a.key)?.order ?? 0;
            const orderB = settingsMap.get(b.key)?.order ?? 0;
            return orderA - orderB;
        });

    if (!columns.length) return columns;

    const availableWidth = Math.max(
        datagridWidth.value - selectionColumnWidth.value - rowActionsColumnWidth.value,
        0,
    );
    const totalWidth = columns.reduce((sum, column) => sum + (Number(column.width) || 100), 0);

    if (availableWidth <= totalWidth) return columns;

    const lastIndex = columns.length - 1;
    const lastColumn = columns[lastIndex];
    const extraWidth = availableWidth - totalWidth;

    columns[lastIndex] = {
        ...lastColumn,
        width: (Number(lastColumn.width) || 100) + extraWidth,
    };

    return columns;
});

/**
 * Sắp xếp columns: cột đã ghim lên đầu, giữ nguyên thứ tự còn lại
 * createdBy: TMHieu
 */
const sortedColumns = computed(() => {
    const pinned = [];
    const unpinned = [];

    displayColumns.value.forEach((col) => {
        if (pinnedColumns.value.includes(col.key)) {
            pinned.push(col);
        } else {
            unpinned.push(col);
        }
    });

    // Sắp xếp pinned theo thứ tự trong pinnedColumns
    pinned.sort((a, b) => {
        return pinnedColumns.value.indexOf(a.key) - pinnedColumns.value.indexOf(b.key);
    });

    return [...pinned, ...unpinned];
});

/**
 * Tính toán vị trí left cho mỗi cột đã ghim
 * createdBy: TMHieu
 */
const getPinnedColumnLeft = (key) => {
    const visiblePinnedColumns = pinnedColumns.value.filter((pinnedKey) =>
        displayColumns.value.some((column) => column.key === pinnedKey),
    );

    const index = visiblePinnedColumns.indexOf(key);
    if (index === -1) return 0;

    let left = selectionColumnWidth.value;

    for (let i = 0; i < index; i++) {
        const col = displayColumns.value.find((c) => c.key === visiblePinnedColumns[i]);
        left += col?.width || 100;
    }

    return left;
};

/**
 * Kiểm tra cột có đang được ghim không
 * createdBy: TMHieu
 */
const isPinned = (key) => pinnedColumns.value.includes(key);

/**
 * Kiểm tra trạng thái checkbox all trên header
 * createdBy: TMHieu (29/01/2026)
 */
const isHeaderChecked = computed(() => {
    if (!props.rows.length) return false;

    const idsThisPage = props.rows.map((r) => getRowId(r));
    return idsThisPage.every((id) => selected.value.includes(id));
});

/**
 * Lọc ra các dòng đã chọn dựa trên mảng selected chứa id
 * createdBy: TMHieu (29/01/2026)
 */
const selectedRows = computed(() => props.rows.filter((r) => selected.value.includes(getRowId(r))));

// Kiểm tra trong các dòng đã chọn có dòng nào đang active hay không
const hasActive = computed(() => selectedRows.value.some((r) => r.isActive));

// Kiểm tra trong các dòng đã chọn có dòng nào đang inactive hay không
const hasInactive = computed(() => selectedRows.value.some((r) => !r.isActive));
//#endregion

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

/**
 * Theo dõi sự thay đổi của props.rows để reset selected khi dữ liệu thay đổi
 * createdBy: TMHieu (29/01/2026)
 */
watch(
    () => props.rows,
    () => {
        selected.value = [];
        emit("update:selected", []);
    },
);

watch(
    () => props.columns,
    () => {
        initColumnSettings();
    },
    { immediate: true, deep: true },
);

watch(
    () => columnSettings.value,
    () => {
        saveColumnSettings();
    },
    { deep: true },
);

watch(
    () => [props.columns, columnSettings.value],
    () => {
        nextTick(() => {
            updateDatagridWidth();
        });
    },
    { deep: true, immediate: true },
);
//#endregion

//#region Lifecycle Hooks
onMounted(() => {
    document.addEventListener("click", handleClickOutsideShowMorePopup);
    // Khởi tạo range khi component mount lần đầu
    computeRecordRange(localData.page || 1);

    nextTick(() => {
        updateDatagridWidth();
    });

    if (typeof ResizeObserver !== "undefined") {
        datagridResizeObserver = new ResizeObserver(() => {
            updateDatagridWidth();
        });

        if (datagridRef.value) {
            datagridResizeObserver.observe(datagridRef.value);
        }
    } else {
        window.addEventListener("resize", updateDatagridWidth);
    }
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutsideShowMorePopup);

    if (datagridResizeObserver) {
        datagridResizeObserver.disconnect();
        datagridResizeObserver = null;
    } else {
        window.removeEventListener("resize", updateDatagridWidth);
    }
});
//#endregion

//#region Methods

/**
 * Ghim cột
 * @param {string} key - Key của cột cần ghim
 * createdBy: TMHieu
 */
const pinColumn = (key) => {
    if (!pinnedColumns.value.includes(key)) {
        pinnedColumns.value.push(key);
    }
    isShowSortPopup.value = null;
};

/**
 * Bỏ ghim cột
 * @param {string} key - Key của cột cần bỏ ghim
 * createdBy: TMHieu
 */
const unpinColumn = (key) => {
    const index = pinnedColumns.value.indexOf(key);
    if (index !== -1) {
        pinnedColumns.value.splice(index, 1);
    }
    isShowSortPopup.value = null;
};

/**
 * Xử lý sự kiện click vào icon filter để mở popup filter
 * createdBy: TMHieu (29/01/2026)
 * @param {string} key - Key của cột cần hiển thị popup filter
 */
const showFilterPopup = (key) => {
    if (isShowFilterPopup.value === key) {
        isShowFilterPopup.value = null;
        return;
    }

    isShowFilterPopup.value = key;

    // preload từ filter hiện có
    const current = localData.filters.find((f) => f.field === key);
    filterOperator.value = current?.operator ?? null;
    filterValue.value = current?.value ?? "";
};

/**
 * Áp dụng filter
 * @param {string} key - Key của cột cần áp dụng filter
 * createdBy: TMHieu
 */
const applyFilter = (key) => {
    if (!filterOperator.value) return;

    const noValueOps = ["isnull", "notnull"];
    const value = noValueOps.includes(filterOperator.value) ? null : filterValue.value;

    headerFilter(key, filterOperator.value, value);
};

/**
 * Xóa filter
 * @param {string} key - Key của cột cần xóa filter
 * createdBy: TMHieu
 */
const clearFilter = (key) => {
    headerFilter(key, null);
};

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
    const valid = ["text", "number", "custom", "HH:mm", "date"];
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

function updateDatagridWidth() {
    if (!datagridRef.value) return;
    datagridWidth.value = Math.floor(datagridRef.value.clientWidth || 0);
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

/**
 * Xử lý khi nhấn nút xóa trên row table
 * emit data row lên cho index xử lý
 * createdBy: TMHieu (29/01/2026)
 */
const handleDelete = (row) => {
    emit("deleteRow", row);
};

const openColumnDrawer = () => {
    isColumnDrawerOpen.value = true;
};

const closeColumnDrawer = () => {
    isColumnDrawerOpen.value = false;
};

function createDefaultColumnSettings() {
    return props.columns.map((column, index) => ({
        key: column.key,
        name: column.name,
        visible: true,
        order: index,
        width: Number(column.width) || 100,
    }));
}

function normalizeColumnOrder() {
    columnSettings.value = [...columnSettings.value]
        .sort((a, b) => a.order - b.order)
        .map((item, index) => ({
            ...item,
            order: index,
        }));
}

function initColumnSettings() {
    const defaults = createDefaultColumnSettings();

    try {
        const raw = localStorage.getItem(columnStorageKey.value);
        if (!raw) {
            columnSettings.value = defaults;
            return;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            columnSettings.value = defaults;
            return;
        }

        const merged = defaults.map((defaultItem) => {
            const existed = parsed.find((item) => item.key === defaultItem.key);

            return {
                ...defaultItem,
                visible: existed?.visible ?? true,
                order: Number.isFinite(existed?.order) ? existed.order : defaultItem.order,
                width: Number(existed?.width) || defaultItem.width,
            };
        });

        columnSettings.value = merged;
        normalizeColumnOrder();
    } catch {
        columnSettings.value = defaults;
    }
}

function saveColumnSettings() {
    try {
        const payload = columnSettings.value.map((item) => ({
            key: item.key,
            visible: item.visible,
            order: item.order,
            width: item.width,
        }));

        localStorage.setItem(columnStorageKey.value, JSON.stringify(payload));
    } catch {
        // ignore local storage exception
    }
}

const toggleColumnVisible = (key) => {
    const target = columnSettings.value.find((item) => item.key === key);
    if (!target) return;

    const visibleCount = columnSettings.value.filter((item) => item.visible).length;
    if (target.visible && visibleCount <= 1) return;

    target.visible = !target.visible;

    if (!target.visible) {
        pinnedColumns.value = pinnedColumns.value.filter((pinnedKey) => pinnedKey !== key);
    }
};

/**
 * Bắt đầu kéo một dòng trong popup tùy chỉnh cột.
 * createdBy: TMHieu
 */
const startColumnDrag = (key, event) => {
    draggedColumnKey.value = key;
    event.dataTransfer.effectAllowed = "move";
};

/**
 * Đánh dấu dòng đang hover khi kéo thả để hiển thị vùng thả.
 * createdBy: TMHieu
 */
const handleDragOverColumn = (key) => {
    dragOverColumnKey.value = key;
};

/**
 * Reset state kéo thả sau khi kết thúc thao tác.
 * createdBy: TMHieu
 */
const endColumnDrag = () => {
    draggedColumnKey.value = null;
    dragOverColumnKey.value = null;
};

/**
 * Thả cột vào vị trí mới và lưu lại thứ tự.
 * createdBy: TMHieu
 */
const dropColumn = (targetKey) => {
    const sourceKey = draggedColumnKey.value;
    endColumnDrag();

    if (!sourceKey || sourceKey === targetKey) return;

    const sorted = [...orderedColumnSettings.value];
    const sourceIndex = sorted.findIndex((item) => item.key === sourceKey);
    const targetIndex = sorted.findIndex((item) => item.key === targetKey);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [moved] = sorted.splice(sourceIndex, 1);
    sorted.splice(targetIndex, 0, moved);

    columnSettings.value = sorted.map((item, index) => ({
        ...item,
        order: index,
    }));
};

/**
 * Cập nhật độ rộng cột với giới hạn min/max để tránh layout vỡ.
 * createdBy: TMHieu
 */
const updateColumnWidth = (key, width) => {
    const target = columnSettings.value.find((item) => item.key === key);
    if (!target) return;

    const value = Number(width);
    if (!Number.isFinite(value)) return;

    target.width = Math.min(1000, Math.max(60, Math.round(value)));
};

/**
 * Chọn hoặc bỏ chọn tất cả cột trong popup.
 * Khi bỏ chọn, vẫn giữ 1 cột hiển thị để table không bị rỗng.
 * createdBy: TMHieu
 */
const toggleAllColumnsVisible = () => {
    if (!columnSettings.value.length) return;

    const nextVisible = !isAllColumnsChecked.value;

    if (nextVisible) {
        columnSettings.value.forEach((item) => {
            item.visible = true;
        });
        return;
    }

    const ordered = [...orderedColumnSettings.value];
    const keepKey = ordered[0]?.key;

    columnSettings.value.forEach((item) => {
        item.visible = item.key === keepKey;
    });

    pinnedColumns.value = pinnedColumns.value.filter((key) => key === keepKey);
};

/**
 * Ghim hoặc bỏ ghim cột hiện tại.
 * Nếu cột đang ẩn thì bật hiển thị trước khi ghim.
 * createdBy: TMHieu
 */
const togglePinnedColumn = (key) => {
    const target = columnSettings.value.find((item) => item.key === key);
    if (!target) return;

    if (!target.visible) target.visible = true;

    if (isPinned(key)) {
        const index = pinnedColumns.value.indexOf(key);
        if (index !== -1) pinnedColumns.value.splice(index, 1);
    } else {
        pinnedColumns.value.push(key);
    }
};

const restoreDefaultColumns = () => {
    columnSettings.value = createDefaultColumnSettings();
    pinnedColumns.value = [];
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
    if (row.isActive) row.isActive = false;
    else row.isActive = true;
    emit("editActive", row);
};

const handleBatchDelete = (rows) => {
    emit("batchDelete", rows);
};

const handleBatchExport = (rows) => {
    emit("batchExport", rows);
};

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

/**
 * Xử lý sự kiện click ra ngoài để đóng popup xem thêm
 * createdBy: TMHieu (29/01/2026)
 */
const handleClickOutsideShowMorePopup = (event) => {
    const popup = document.querySelector(".content__table-popup-more");

    if (!popup) return;

    if (!popup.contains(event.target)) {
        showMoreRowId.value = null;
        currentRow.value = null;
    }
};

/**
 * Xử lý sự kiện click vào header để mở popup sắp xếp
 * createdBy: TMHieu (29/01/2026)
 */
const showSortPopup = (key) => {
    if (isShowSortPopup.value === key) {
        isShowSortPopup.value = null;
    } else {
        isShowSortPopup.value = key;
    }
};

/**
 * Xử lý sự kiện chọn sắp xếp trong popup
 * @param {string} key - Khóa của cột cần sắp xếp.
 * @param {('asc'|'desc'|null)} order - Thứ tự sắp xếp (tăng dần, giảm dần, hoặc không sắp xếp).
 * createdBy: TMHieu (29/01/2026)
 */
const headerSort = (key, order) => {
    const index = localData.sorts.findIndex((s) => s.field === key);
    let changed = false;

    if (order === null) {
        // Xóa sort
        if (index !== -1) {
            localData.sorts.splice(index, 1);
            changed = true;
        }
    } else {
        if (index !== -1) {
            // Nếu direction khác thì mới update
            if (localData.sorts[index].direction !== order) {
                localData.sorts[index].direction = order;
                changed = true;
            }
        } else {
            // Thêm sort mới
            localData.sorts.push(createSort(key, order));
            changed = true;
        }
    }

    if (changed) {
        emit("update:pagination", { ...localData });
    }

    isShowSortPopup.value = null;
};

const getIconSort = (key) => {
    const sort = localData.sorts.find((s) => s.field === key);
    if (!sort) return "";
    return sort.direction === "asc" ? "arrow__up-icon" : "arrow__down-icon";
};

const headerFilter = (field, operator, value = null) => {
    const index = localData.filters.findIndex((f) => f.field === field);
    let changed = false;

    if (operator === null) {
        // Xóa filter
        if (index !== -1) {
            localData.filters.splice(index, 1);
            changed = true;
        }
    } else {
        if (index !== -1) {
            // Nếu operator hoặc value khác thì update
            if (
                localData.filters[index].operator !== operator ||
                localData.filters[index].value !== value
            ) {
                localData.filters[index].operator = operator;
                localData.filters[index].value = value;
                changed = true;
            }
        } else {
            // Thêm filter mới
            localData.filters.push(createFilter(field, operator, value));
            changed = true;
        }
    }

    if (changed) {
        localData.page = 1; // reset về trang đầu
        emit("update:pagination", { ...localData });
    }

    isShowFilterPopup.value = null;
};
//#endregion

//#region Methods - Row & Selection, All checkbox

/**
 * Tính số lượng dòng đã được chọn
 * createdby: TMHieu - 12.12.2025
 */
const calculateChecked = () => {
    return selected.value.length;
};

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

/**
 * Bỏ chọn tất cả các dòng đã chọn
 * createdby: TMHieu - 12.12.2025
 */
const clearChecked = () => {
    selected.value = [];
};

/**
 * Kiểm tra cột có đang được lọc không
 * createdBy: TMHieu
 */
const hasFilter = (field) => {
    if (!Array.isArray(localData.filters)) return false;
    return localData.filters.some((f) => f.field === field);
};
//#endregion

//#region Expose
/**
 * Expose hàm clearChecked để cha có thể gọi khi cần thiết (ví dụ sau khi xóa hàng loạt thành công)
 * createdby: TMHieu - 12.12.2025
 */
defineExpose({
    clearChecked,
});
//#endregion
</script>

<template>
    <div class="content__body-header d-flex justify-content-between">
        <div class="content__search-left d-flex align-items-center gap-12">
            <div v-if="props.showSearch" class="content__search-icon"></div>
            <input
                v-if="props.showSearch"
                class="content__search-input"
                placeholder="Tìm kiếm"
                v-model="searchInput"
            />

            <div v-if="props.showSelection && calculateChecked()">
                Đã chọn <strong>{{ calculateChecked() }}</strong>
            </div>
            <ms-button
                v-if="props.showSelection && calculateChecked()"
                @click="clearChecked"
                type="text"
                >Bỏ chọn</ms-button
            >
            <ms-button
                v-if="props.showSelection && props.showActiveActions && hasInactive"
                icon-left="content__table-active-icon"
                type="primary-outline"
                @click="handleActive(selected, true)"
                >Sử dụng</ms-button
            >
            <ms-button
                v-if="props.showSelection && props.showActiveActions && hasActive"
                icon-left="content__table-empty-icon"
                type="danger-outline"
                @click="handleActive(selected, false)"
                >Ngừng sử dụng</ms-button
            >
            <ms-button
                v-if="props.showSelection && props.showExportSelected && calculateChecked()"
                type="outline"
                @click="handleBatchExport(selected)"
                >Xuất excel</ms-button
            >
            <ms-button
                v-if="props.showSelection && calculateChecked()"
                icon-left="content__table-bin-icon"
                type="danger-outline"
                @click="handleBatchDelete(selected)"
                >Xóa</ms-button
            >
        </div>
        <div class="d-flex gap-8">
            <tooltip
                v-if="props.showReload"
                placement="top"
                :align="{ offset: [0, 4] }"
                :trigger="['hover', 'focus']"
            >
                <template #title>
                    <span>Lấy lại dữ liệu</span>
                </template>
                <ms-button :type="'outline'" @click="handleReload">
                    <div class="content__reload-icon"></div>
                </ms-button>
            </tooltip>

            <tooltip
                v-if="props.showColumnConfig"
                placement="top"
                :align="{ offset: [0, 4] }"
                :trigger="['hover', 'focus']"
            >
                <template #title>
                    <span>Thiết lập</span>
                </template>
                <ms-button :type="'outline'" @click="openColumnDrawer">
                    <div class="content__table-setting-icon"></div>
                </ms-button>
            </tooltip>
        </div>
    </div>

    <div class="content__datagrid" ref="datagridRef">
        <div
            class="table__empty d-flex flex-column align-items-center gap-12"
            v-if="!props.rows.length && !loading"
        >
            <img src="/src/assets/image/background/empty-data.svg" alt="Empty" class="empty__img" />
            <div class="empty__title">Không có dữ liệu</div>
        </div>
        <table class="content__table">
            <thead class="content__table-header">
                <tr>
                    <th
                        v-if="props.showSelection"
                        class="content__table-checkbox content__table-checkbox-header"
                    >
                        <input type="checkbox" :checked="isHeaderChecked" @change="onHeaderCheck" />
                    </th>
                    <th
                        :style="[
                            'width: ' + item.width + 'px',
                            isPinned(item.key) ? `left: ${getPinnedColumnLeft(item.key)}px` : '',
                        ]"
                        :class="{ 'pinned-column': isPinned(item.key) }"
                        v-for="item in sortedColumns"
                        :key="item.key"
                    >
                        <div class="content__table-header-wrapper d-flex align-items-center">
                            <div class="content__table-header-line"></div>
                            <div
                                class="content__table-header-title flex-1 d-flex gap-8"
                                @click.stop="showSortPopup(item.key)"
                            >
                                <div v-if="isPinned(item.key)" class="table__header-pin-icon"></div>
                                {{ item.name }}
                                <div :class="getIconSort(item.key)"></div>
                            </div>

                            <!-- Popup sort -->
                            <div
                                v-if="isShowSortPopup === item.key"
                                class="table__header-sort-popup"
                            >
                                <div class="sort__popup-item" @click="headerSort(item.key, null)">
                                    <div
                                        class="sort__popup-item-icon content__table-empty-icon"
                                    ></div>
                                    <div class="sort__popup-item-text">Không sắp xếp</div>
                                </div>
                                <div class="sort__popup-item" @click="headerSort(item.key, 'asc')">
                                    <div class="sort__popup-item-icon arrow__up-icon"></div>
                                    <div class="sort__popup-item-text">Tăng dần</div>
                                </div>
                                <div class="sort__popup-item" @click="headerSort(item.key, 'desc')">
                                    <div class="sort__popup-item-icon arrow__down-icon"></div>
                                    <div class="sort__popup-item-text">Giảm dần</div>
                                </div>
                                <div class="sort__popup-line"></div>

                                <div
                                    class="sort__popup-item"
                                    @click="pinColumn(item.key)"
                                    v-if="!isPinned(item.key)"
                                >
                                    <div class="sort__popup-item-icon pin-icon"></div>
                                    <div class="sort__popup-item-text">Ghim cột</div>
                                </div>

                                <div class="sort__popup-item" @click="unpinColumn(item.key)" v-else>
                                    <div class="sort__popup-item-icon unpin-icon"></div>
                                    <div class="sort__popup-item-text">Bỏ ghim cột</div>
                                </div>
                            </div>

                            <div
                                v-if="item.typeFilter"
                                :class="
                                    hasFilter(item.key)
                                        ? 'content__table-filter-icon--active'
                                        : 'content__table-filter-icon'
                                "
                                @click.stop="showFilterPopup(item.key)"
                            ></div>

                            <div
                                class="filter__popup-item d-flex flex-column gap-16"
                                v-if="isShowFilterPopup === item.key"
                            >
                                <div
                                    class="filter__popup-header d-flex justify-content-between align-items-center gap-12"
                                >
                                    <div class="popup__header-title">Lọc {{ item.name }}</div>
                                    <div
                                        class="popup__header-close-btn"
                                        @click="isShowFilterPopup = null"
                                    >
                                        <div class="icon-close"></div>
                                    </div>
                                </div>
                                <div class="popup__body d-flex flex-column gap-8">
                                    <ms-select
                                        :type="item.typeFilter"
                                        style="width: 318px"
                                        :options="filterOptions"
                                        placeholder="Chọn điều kiện lọc"
                                        v-model="filterOperator"
                                    ></ms-select>

                                    <ms-input
                                        v-if="item.typeFilter != 'boolean'"
                                        label="Giá trị lọc"
                                        placeholder="Nhập giá trị lọc"
                                        v-model="filterValue"
                                    ></ms-input>
                                </div>
                                <div
                                    class="popup-footer d-flex justify-content-between align-items-center"
                                >
                                    <div class="popup__footer-left">
                                        <ms-button type="ghost" @click="clearFilter(item.key)"
                                            >Bỏ lọc</ms-button
                                        >
                                    </div>
                                    <div class="popup__footer-right d-flex gap-8">
                                        <ms-button type="outline" @click="isShowFilterPopup = null"
                                            >Hủy</ms-button
                                        >
                                        <ms-button type="primary" @click="applyFilter(item.key)"
                                            >Áp dụng</ms-button
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>
                    </th>
                    <th
                        v-if="props.showRowActions"
                        class="col-delete"
                        :style="{ width: props.rowColumnWidth + 'px' }"
                    >
                        <slot name="header-actions">
                            {{ props.rowActionsName }}
                        </slot>
                    </th>
                </tr>
            </thead>

            <tbody class="table-shift__tbody">
                <!-- Loading skeleton -->
                <template v-if="loading">
                    <tr v-for="n in localData.pageSize" :key="'skeleton-' + n">
                        <td v-if="props.showSelection" class="col-checkbox">
                            <div class="skeleton skeleton-checkbox"></div>
                        </td>
                        <td v-for="col in sortedColumns" :key="col.key">
                            <div class="skeleton"></div>
                        </td>
                        <td v-if="props.showRowActions" class="col-delete">
                            <div class="skeleton skeleton-action"></div>
                        </td>
                    </tr>
                </template>

                <template v-else>
                    <!-- Dữ liệu bảng sẽ được hiển thị ở đây -->
                    <tr
                        v-for="row in rows"
                        :key="getRowId(row)"
                        tabindex="0"
                        @dblclick="props.showRowActions ? handleEdit(row) : null"
                    >
                        <td v-if="props.showSelection" class="content__table-checkbox col-checkbox">
                            <input
                                type="checkbox"
                                :data-id="row"
                                :checked="isRowChecked(getRowId(row))"
                                @change="toggleRow(getRowId(row))"
                                @dblclick.stop
                            />
                        </td>

                        <td
                            v-for="column in sortedColumns"
                            :key="column.key"
                            :class="{ 'pinned-column': isPinned(column.key) }"
                            :style="
                                isPinned(column.key)
                                    ? `left: ${getPinnedColumnLeft(column.key)}px`
                                    : ''
                            "
                        >
                            <!-- Tùy chỉnh hiển thị cột trong bảng -->
                            <template
                                v-if="$slots[column.key] || getFieldType(column.type) === 'custom'"
                            >
                                <slot :name="column.key" :row="row" :value="row[column.key]">
                                    {{ renderValue(row[column.key]) }}
                                </slot>
                            </template>

                            <template v-else-if="getFieldType(column.type) === 'HH:mm'">
                                <span>{{ renderValue(formatTimeHHMM(row[column.key])) }}</span>
                            </template>

                            <template v-else-if="getFieldType(column.type) === 'date'">
                                <span>{{ renderValue(formatDateDDMMYYYY(row[column.key])) }}</span>
                            </template>
                            <!-- Các cột khác nếu không phải kiểu custom -->
                            <template v-else>
                                {{ renderValue(row[column.key]) }}
                            </template>
                        </td>

                        <!-- Hành động sửa xóa trên bảng -->
                        <td
                            v-if="props.showRowActions"
                            class="col-delete d-flex justify-content-between align-items-center"
                            :style="{ width: props.rowColumnWidth + 'px' }"
                        >
                            <slot
                                name="row-actions"
                                :row="row"
                                :handleEdit="handleEdit"
                                :handleMore="handleMore"
                            >
                                <div class="btn-modify-wrapper" @click="handleEdit(row)">
                                    <div
                                        class="content__table-btn-modify content__table-btn-edit"
                                        title="Chỉnh sửa"
                                    ></div>
                                </div>
                                <div class="btn-modify-wrapper" @click.stop="handleMore(row, $event)">
                                    <div
                                        class="content__table-btn-modify content__table-btn-showmore"
                                        title="Xem thêm"
                                    ></div>
                                </div>
                            </slot>

                            <!--  Popup xem thêm (sửa, xóa, nhân bản, thay đổi trạng thái) -->
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
                                        v-if="props.showActiveActions && currentRow?.isActive"
                                        class="content__table-popup-item d-flex"
                                        @click="handleChangeActive(currentRow)"
                                    >
                                        <div class="content__table-empty-icon"></div>
                                        <div class="content__table-popup-text">Ngừng sử dụng</div>
                                    </div>
                                    <div
                                        v-else-if="props.showActiveActions"
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
                </template>
            </tbody>
        </table>
    </div>

    <!-- Phân trang table -->
    <div
        v-if="props.showPagination"
        class="content__paging d-flex justify-content-between align-items-center"
    >
        <div class="content__paging-info m-r-12">
            Tổng: <b class="total-row">{{ localData.totalRows }}</b> bản ghi
        </div>
        <div class="content__paging-controls d-flex align-items-center gap-16">
            <div class="content__paging-controls-title">Số dòng/trang</div>

            <div class="content__paging-page-size pointer d-flex">
                <ms-select
                    :model-value="localData.pageSize"
                    style="width: 80px"
                    dropdown-position="top"
                    @update:model-value="onChangePageSize"
                    :options="pageSizeOptions"
                ></ms-select>
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

    <Teleport to="body">
        <div v-if="isColumnDrawerOpen" class="table-column-drawer">
            <div class="table-column-drawer__overlay" @click="closeColumnDrawer"></div>

            <div class="table-column-drawer__panel d-flex flex-column">
                <div
                    class="table-column-drawer__header d-flex justify-content-between align-items-center"
                >
                    <div class="table-column-drawer__title">Tùy chỉnh giao diện</div>
                    <div class="table-column-drawer__close" @click="closeColumnDrawer">×</div>
                </div>

                <div class="table-column-drawer__search-wrap">
                    <ms-input
                        v-model="columnSearch"
                        class="table-column-drawer__search"
                        placeholder="Tìm kiếm"
                        :width="300"
                    />
                </div>

                <div class="table-column-drawer__table-head">
                    <!-- Check all: bật/tắt toàn bộ cột hiển thị -->
                    <div class="drawer-col-check d-flex">
                        <input
                            type="checkbox"
                            :checked="isAllColumnsChecked"
                            @change="toggleAllColumnsVisible"
                        />
                    </div>
                    <!-- Tên cột dữ liệu -->
                    <div class="drawer-col-name">Tên cột dữ liệu</div>
                    <!-- Độ rộng cột -->
                    <div class="drawer-col-width">Độ rộng</div>
                    <!-- Ghim cột -->
                    <div class="drawer-col-pin">Ghim</div>
                    <!-- Kéo thả sắp xếp -->
                    <div class="drawer-col-order">Kéo thả</div>
                </div>

                <div class="table-column-drawer__body">
                    <div
                        v-for="item in filteredColumnSettings"
                        :key="item.key"
                        class="table-column-drawer__row"
                        :class="{
                            'table-column-drawer__row--dragging': draggedColumnKey === item.key,
                            'table-column-drawer__row--drag-over': dragOverColumnKey === item.key,
                        }"
                        draggable="true"
                        @dragstart="startColumnDrag(item.key, $event)"
                        @dragend="endColumnDrag"
                        @dragover.prevent="handleDragOverColumn(item.key)"
                        @drop="dropColumn(item.key)"
                    >
                        <!-- Checkbox bật/tắt hiển thị cột -->
                        <div class="drawer-col-check">
                            <input
                                type="checkbox"
                                :checked="item.visible"
                                @change="toggleColumnVisible(item.key)"
                            />
                        </div>
                        <!-- Tên cột -->
                        <div class="drawer-col-name">{{ item.name }}</div>
                        <!-- Chỉnh độ rộng -->
                        <div class="drawer-col-width">
                            <InputNumber
                                :min="60"
                                :max="1000"
                                :step="10"
                                size="small"
                                class="table-column-drawer__width-input"
                                :value="item.width"
                                @change="(value) => updateColumnWidth(item.key, value)"
                            />
                        </div>
                        <!-- Nút ghim / bỏ ghim -->
                        <div
                            class="drawer-col-pin d-flex justify-content-center align-items-center"
                        >
                            <button
                                class="drawer-pin-btn"
                                type="button"
                                :title="isPinned(item.key) ? 'Bỏ ghim cột' : 'Ghim cột'"
                                @click.stop="togglePinnedColumn(item.key)"
                            >
                                <div :class="isPinned(item.key) ? 'unpin-icon' : 'pin-icon'"></div>
                            </button>
                        </div>
                        <!-- Tay nắm kéo thả -->
                        <div
                            class="drawer-col-order d-flex justify-content-center align-items-center"
                        >
                            <button class="drawer-drag-handle" type="button" title="Kéo để sắp xếp">
                                ⋮⋮
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    class="table-column-drawer__footer d-flex justify-content-between align-items-center"
                >
                    <ms-button :type="'outline'" @click="restoreDefaultColumns"
                        >Lấy lại mặc định</ms-button
                    >
                    <ms-button @click="closeColumnDrawer">Đóng</ms-button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
@import "MsTable.css";
</style>
