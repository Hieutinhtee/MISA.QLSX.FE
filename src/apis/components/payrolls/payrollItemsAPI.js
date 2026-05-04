import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI.js";

class PayrollItemsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "PayrollItems";
    }

    /**
     * Lấy danh sách khoản mục lương theo payrollId.
     * @param {string} payrollId
     */
    getByPayrollId(payrollId) {
        return api.get(`${this.controller}/payroll/${payrollId}`);
    }
}

export default new PayrollItemsAPI();
