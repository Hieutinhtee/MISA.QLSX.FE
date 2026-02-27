// Tạo shift mới, dùng chung
// createdBy: TMHieu (22/01/2026)
export const createShift = () => ({
    shiftId: "",
    shiftCode: "",
    shiftName: "",
    beginShiftTime: null,
    endShiftTime: null,
    beginBreakTime: null,
    endBreakTime: null,
    workingTime: 0,
    breakingTime: 0,
    inactive: false,
    createdBy: "",
    createdDate: null,
    modifiedBy: "",
    modifiedDate: null,
});
