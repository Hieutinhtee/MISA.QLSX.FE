/**
 * Tránh lỗi dữ liệu save vào LocalStorage
 * lọc bỏ các giá trị null hoặc undefined
 * createdBy: TMHieu (22/01/2026)
 * @returns {Array} Mảng dữ liệu hợp lệ
 */
export function normalizeshiftData(data) {
    const normalized = {};

    for (const key in data) {
        normalized[key] = data[key] !== null && data[key] !== undefined ? data[key] : "";
    }

    return normalized;
}

/**
 * Format ngày tháng theo định dạng dd/mm/YYYY
 * createdBy: TMHieu (22/01/2026)
 * @param {Date} date Date cần format
 * @returns {string} dd/mm/YYYY
 */
export function formatDateDDMMYYYY(date) {
    if (!date) return "";

    const d = new Date(date);
    if (isNaN(d)) return "";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
}
