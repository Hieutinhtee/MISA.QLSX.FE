// Tạo shift mới, dùng chung
// createdBy: TMHieu (22/01/2026)
export const createShift = () => ({
    productionShiftId: null,
    productionShiftCode: "",
    productionShiftName: "",
    productionShiftDescription: "",
    productionShiftBeginTime: null,
    productionShiftEndTime: null,
    productionShiftBeginBreakTime: null,
    productionShiftEndBreakTime: null,
    productionShiftWorkingTime: 0,
    productionShiftBreakTime: 0,
    productionShiftIsActive: true,
    productionShiftCreatedBy: "",
    productionShiftCreatedDate: null,
    productionShiftModifiedBy: "",
    productionShiftModifiedDate: null,
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
