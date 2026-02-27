const AVATAR_COLORS = [
    "#f97316", // A
    "#fb923c", // B
    "#f59e0b", // C
    "#eab308", // D
    "#84cc16", // E
    "#22c55e", // F
    "#10b981", // G
    "#14b8a6", // H
    "#06b6d4", // I
    "#0ea5e9", // J
    "#3b82f6", // K
    "#6366f1", // L
    "#8b5cf6", // M
    "#a855f7", // N
    "#d946ef", // O
    "#ec4899", // P
    "#f43f5e", // Q
    "#ef4444", // R
    "#f87171", // S
    "#fb7185", // T
    "#34d399", // U
    "#2dd4bf", // V
    "#60a5fa", // W
    "#818cf8", // X
    "#c084fc", // Y
    "#f472b6", // Z
];

/**
 * Xử lý hiển thị giá trị
 * createdBy: TMHieu (22/01/2026)
 * @param {string} value Giá trị cần hiển thị
 * @returns Giá trị hiển thị
 */
export const renderValue = (value) => {
    return value && String(value).trim() !== "" ? value : "--";
};

/** Lấy màu nền avatar theo chữ cái đầu tên
 * createdBy: TMHieu (22/01/2026)
 * @param {string} name Tên ứng viên
 * @returns Màu nền avatar
 */
export const getAvatarColor = (name) => {
    const charCode = name.charCodeAt(0);
    return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
};

/** Lấy chữ cái đầu tiên của tên ứng viên
 * createdBy: TMHieu (22/01/2026)
 * @param {string} fullName Tên ứng viên
 * @returns Chữ cái đầu tiên của tên ứng viên
 */
export const getAvatarLetter = (fullName) => {
    if (!fullName) return "?";
    return fullName.trim().charAt(0).toUpperCase();
};
