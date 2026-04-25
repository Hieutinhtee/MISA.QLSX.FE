// Tạo payroll mới, dùng chung
// createdBy: TMHieu (25/04/2026)
export const createPayroll = () => ({
    payrollId: null,
    payrollCode: "",
    salaryPeriodId: null,
    employeeId: null,
    status: "draft",
    grossSalary: 0,
    netSalary: 0,
    taxableSalary: 0,
    pitTaxAmount: 0,
    insuranceDeduction: 0,
    workingDaysActual: 0,
    workingDaysStandard: 0,
    totalAllowance: 0,
    totalAddition: 0,
    totalDeduction: 0,
    lockedAt: null,
    paidAt: null,
    salaryPolicyId: null,
    deductionPolicyId: null,
    employeeTaxProfileId: null,
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