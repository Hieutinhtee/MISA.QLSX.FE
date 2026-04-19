import { reactive, ref } from "vue";

const createDefaultPayload = () => ({
    page: 1,
    pageSize: 20,
    search: "",
    filters: [],
    sorts: [],
    totalRows: 0,
});

export function usePagingTable(apiInstance) {
    const delayMs = 300; // Thời gian delay để tránh gọi API quá nhiều khi search

    const loading = ref(false);
    const rows = ref([]);
    const payload = reactive(createDefaultPayload());

    const executePaging =
        typeof apiInstance === "function" ? apiInstance : (body) => apiInstance.paging(body);

    const loadDataForAPI = async () => {
        loading.value = true;
        try {
            if (delayMs > 0) {
                await new Promise((resolve) => {
                    setTimeout(resolve, delayMs);
                });
            }

            const result = await executePaging(JSON.parse(JSON.stringify(payload)));
            rows.value.splice(0, rows.value.length, ...(result.data?.data || []));
            payload.totalRows = result.data?.meta?.total || 0;
        } catch (err) {
            console.error(err);
        } finally {
            loading.value = false;
        }
    };

    const reloadData = () => {
        Object.assign(payload, createDefaultPayload());
        loadDataForAPI();
    };

    const onPaginationUpdate = (newPayload) => {
        Object.assign(payload, newPayload);
        loadDataForAPI();
    };

    const onSearchChange = (newPayload) => {
        Object.assign(payload, newPayload);
        loadDataForAPI();
    };

    return {
        loading,
        rows,
        payload,
        loadDataForAPI,
        reloadData,
        onPaginationUpdate,
        onSearchChange,
    };
}
