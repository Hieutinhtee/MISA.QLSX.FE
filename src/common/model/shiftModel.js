// Tạo shift mới, dùng chung
// createdBy: TMHieu (22/01/2026)
export const createShift = () => ({
    shiftId: null,
    shiftCode: "",
    shiftName: "",
    description: "",
    startTime: null,
    endTime: null,
    breakStartTime: null,
    breakEndTime: null,
    workingHours: 0,
    breakHours: 0,
    isActive: true,
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
