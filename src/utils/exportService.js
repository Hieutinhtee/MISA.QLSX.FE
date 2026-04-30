/**
 * Tải file excel từ blob response.
 * @param {BlobPart} data dữ liệu dạng blob từ API
 * @param {string} filePrefix tiền tố tên file tải về
 */
export function downloadExcelBlob(data, filePrefix = "Export") {
    const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    link.href = url;
    link.download = `${filePrefix}-${timestamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

/**
 * Gọi API export selected và tải file excel.
 * @param {object} apiClient api client có hàm exportSelected(ids)
 * @param {Array<string>} ids danh sách id được chọn
 * @param {string} filePrefix tiền tố tên file tải về
 */
export async function exportSelectedRows(apiClient, ids, filePrefix = "Export") {
    if (!Array.isArray(ids) || ids.length === 0) {
        return;
    }

    const response = await apiClient.exportSelected(ids);
    downloadExcelBlob(response.data, filePrefix);
}
