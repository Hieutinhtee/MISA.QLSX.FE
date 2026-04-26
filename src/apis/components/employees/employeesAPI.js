import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI.js";

class EmployeesAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Employees";
    }

    /**
     * Lấy danh sách nhân viên chưa có hợp đồng
     */
    getEmployeesWithoutContract() {
        return api.get(`${this.controller}/without-contract`);
    }
}

export default new EmployeesAPI();
