import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI.js";

class PayrollsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Payrolls";
    }

    /**
     * Tạo bảng lương nháp cho kỳ lương.
     * @param {string} salaryPeriodId
     */
    generateByPeriod(salaryPeriodId) {
        return api.post(`${this.controller}/periods/${salaryPeriodId}/generate`);
    }

    /**
     * Tính bảng lương theo kỳ (hoặc 1 nhân viên nếu truyền employeeId).
     * @param {string} salaryPeriodId
     * @param {string|null} employeeId
     */
    calculateByPeriod(salaryPeriodId, employeeId = null) {
        return api.post(`${this.controller}/periods/${salaryPeriodId}/calculate`, null, {
            params: {
                employeeId: employeeId || undefined,
            },
        });
    }

    /**
     * Khóa bảng lương của kỳ lương.
     * @param {string} salaryPeriodId
     */
    lockByPeriod(salaryPeriodId) {
        return api.post(`${this.controller}/periods/${salaryPeriodId}/lock`);
    }

    /**
     * Đánh dấu đã chi trả bảng lương của kỳ lương.
     * @param {string} salaryPeriodId
     */
    payByPeriod(salaryPeriodId) {
        return api.post(`${this.controller}/periods/${salaryPeriodId}/pay`);
    }
}

export default new PayrollsAPI();
