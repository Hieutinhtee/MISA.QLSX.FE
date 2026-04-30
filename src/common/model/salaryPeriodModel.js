// Tạo salary period mới, dùng chung
// createdBy: TMHieu (25/04/2026)
export const createSalaryPeriod = () => ({
    salaryPeriodId: null,
    startDate: null,
    endDate: null,
    status: "draft",
    createdBy: "",
    createdAt: null,
    updatedBy: "",
    updatedAt: null,
});

export const createFilter = (field, operator, value) => ({
    field,
    operator,
    value,
});

export const createSort = (field, direction) => ({
    field,
    direction,
});
