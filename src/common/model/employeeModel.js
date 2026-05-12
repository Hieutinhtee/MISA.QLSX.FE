export const createEmployee = () => ({
    // --- Định danh ---
    employeeId: null,
    employeeCode: "",

    // --- Thông tin cơ bản ---
    fullName: "",
    gender: "",
    dateOfBirth: null,
    placeOfBirth: "",
    hometown: "",
    ethnic: "Kinh",
    religion: "Không",
    nationality: "Việt Nam",
    maritalStatus: "Độc thân",
    nationalId: "",
    avatarUrl: "profile.jpg",
    cvUrl: "",

    // --- Liên lạc ---
    address: "",
    temporaryAddress: "",
    phoneNumber: "",
    email: "",
    personalEmail: "",
    facebookUrl: "",
    zaloNumber: "",

    // --- Công việc ---
    joinDate: null,
    departmentId: null,
    shiftId: null,
    positionId: null,
    degreeId: null,
    contractId: null,
    accountId: null,

    // --- Ngân hàng ---
    bankAccountNumber: "",
    bankName: "",
    bankBranch: "",

    // --- Liên hệ khẩn cấp ---
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",

    // --- Sức khỏe ---
    height: null,
    weight: null,
    bloodGroup: "",
    healthStatus: "",

    // --- Bảo hiểm ---
    socialInsuranceNumber: "",

    // --- Audit ---
    createdAt: null,
    createdBy: "",
    updatedBy: "",
    updatedAt: null,
});
