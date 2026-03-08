// Tạo shift mới, dùng chung
// createdBy: TMHieu (22/01/2026)
export const createShift = () => ({
    shiftId: null,
    shiftCode: "",
    shiftName: "",
    shiftDescription: "",
    shiftBeginTime: null,
    shiftEndTime: null,
    beginBreakTime: null,
    endBreakTime: null,
    workingTime: 0,
    breakTime: 0,
    isActive: true,
    createdBy: "",
    createdDate: null,
    modifiedBy: "",
    modifiedDate: null,
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
