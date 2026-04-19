const shiftData = Array.from({ length: 100 }, (_, i) => ({
    shiftId: crypto.randomUUID(),
    shiftCode: `CA${String(i + 1).padStart(3, "0")}`,
    shiftName: `Ca làm việc ${i + 1}`,
    startTime: "08:00",
    endTime: "17:00",
    breakStartTime: "12:00",
    breakEndTime: "13:00",
    workingHours: 8,
    breakHours: 1,
    isActive: true,
    description: "",
    createdBy: "admin",
    createdAt: new Date(),
    updatedBy: "admin",
    updatedAt: new Date(),
}));

export default shiftData;
