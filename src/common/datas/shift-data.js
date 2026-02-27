const shiftData = Array.from({ length: 100 }, (_, i) => ({
    shiftID: crypto.randomUUID(),
    shiftCode: `CA${String(i + 1).padStart(3, "0")}`,
    shiftName: `Ca làm việc ${i + 1}`,
    beginShiftTime: "08:00",
    endShiftTime: "17:00",
    beginBreakTime: "12:00",
    endBreakTime: "13:00",
    workingTime: 8,
    breakingTime: 1,
    inactive: false,
    createdBy: "admin",
    createdDate: new Date(),
    modifiedBy: "admin",
    modifiedDate: new Date(),
}));

export default shiftData;
