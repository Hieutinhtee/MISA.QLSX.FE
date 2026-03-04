import { defineStore } from "pinia";
import { ref } from "vue";
import ShiftApi from "@/apis/components/ShiftApi";

export const useShiftStore = defineStore("shift", () => {
    // State
    const shifts = ref([]);
    const totalRecords = ref(0);
    const currentPage = ref(1);
    const currentPageSize = ref(20);
    const isLoading = ref(false);
    const searchQuery = ref("");
    const newlyAddedShiftId = ref(null);

    // Load data với pagination
    const loadData = async (page = 1, pageSize = 10, keyword = "") => {
        isLoading.value = true;
        try {
            const res = await ShiftApi.getShifts(keyword, page, pageSize);
            shifts.value = res.data.data;
            totalRecords.value = res.data.totalCount;
            currentPage.value = res.data.page;
            currentPageSize.value = res.data.pageSize;
            searchQuery.value = keyword;
        } catch (error) {
            console.error("Load data failed:", error);
        } finally {
            isLoading.value = false;
        }
    };

    // Thêm ca làm việc mới và hiển thị ở đầu datagrid
    const addShiftToTop = (newShift) => {
        shifts.value.unshift(newShift);

        newlyAddedShiftId.value = newShift.productionShiftId;

        totalRecords.value += 1;

        if (shifts.value.length > currentPageSize.value) {
            shifts.value.pop();
        }
    };

    // Clear newly added shift ID
    const clearNewlyAddedShiftId = () => {
        newlyAddedShiftId.value = null;
    };

    // Refresh data
    const refresh = async () => {
        await loadData(currentPage.value, currentPageSize.value, searchQuery.value);
    };

    return {
        // State
        shifts,
        totalRecords,
        currentPage,
        currentPageSize,
        isLoading,
        searchQuery,
        newlyAddedShiftId,
        // Actions
        loadData,
        addShiftToTop,
        clearNewlyAddedShiftId,
        refresh,
    };
});
