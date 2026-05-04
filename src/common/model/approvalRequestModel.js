export const createApprovalRequest = () => ({
    approvalRequestId: null,
    requestCode: "",
    requestType: "",
    title: "",
    description: "",
    payload: "{}",
    effectiveDate: null,
    status: "pending",
    currentStep: 1,
    totalSteps: 1,
    createdBy: "",
    createdAt: null,
    updatedBy: "",
    updatedAt: null,
});

/**
 * Map request_type sang label tiếng Việt
 */
export const REQUEST_TYPE_LABELS = {
    department_member_transfer: "Thuyên chuyển thành viên phòng ban",
    department_manager_change: "Đổi trưởng phòng",
    contract_change: "Thay đổi hợp đồng",
    leave_request: "Đơn nghỉ phép",
};

/**
 * Map status sang label tiếng Việt + màu
 */
export const STATUS_CONFIG = {
    pending: { label: "Chờ duyệt", color: "#faad14", bg: "#fffbe6" },
    approved: { label: "Đã duyệt", color: "#52c41a", bg: "#f6ffed" },
    rejected: { label: "Từ chối", color: "#ff4d4f", bg: "#fff2f0" },
    cancelled: { label: "Đã hủy", color: "#8c8c8c", bg: "#fafafa" },
};
