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

/**
 * Format thời gian từ HH:mm:ss về HH:mm
 * createdBy: TMHieu (28/02/2026)
 * @param {string} time Chuỗi thời gian dạng HH:mm:ss
 * @returns {string} HH:mm
 */
export function formatTimeHHMM(time) {
    if (!time) return "";

    // Nếu là chuỗi kiểu 08:00:00
    if (typeof time === "string") {
        const parts = time.split(":");
        if (parts.length >= 2) {
            const hour = parts[0].padStart(2, "0");
            const minute = parts[1].padStart(2, "0");
            return `${hour}:${minute}`;
        }
        return "";
    }

    // Nếu truyền vào Date object
    if (time instanceof Date && !isNaN(time)) {
        const hour = String(time.getHours()).padStart(2, "0");
        const minute = String(time.getMinutes()).padStart(2, "0");
        return `${hour}:${minute}`;
    }

    return "";
}

/**
 * Format ngày tháng theo định dạng dd/mm/YYYY
 * createdBy: TMHieu (22/01/2026)
 * @param {string} time - thời gian cần format
 */
export function formatTime(time) {
    if (!time) return null;

    // Nếu đã là HH:mm:ss thì giữ nguyên
    if (time.length === 8) return time;

    // Nếu là HH:mm thì thêm :00
    if (time.length === 5) return time + ":00";

    return null;
}
