import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/baseAPI";

class DependentsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Dependents";
    }

    /**
     * Lấy danh sách người phụ thuộc theo ID nhân viên
     * @param {string} employeeId - ID của nhân viên
     * @returns {Promise} - Kết quả trả về từ API
     */
    getByEmployeeId(employeeId) {
        return api.get(`${this.controller}/employee/${employeeId}`);
    }
}

export default new DependentsAPI();
