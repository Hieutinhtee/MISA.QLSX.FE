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

    /**
     * Lấy danh sách cán bộ đại diện ký hợp đồng (Phòng HR)
     */
    getRepresentatives() {
        return api.get(`${this.controller}/representatives`);
    }

    /**
     * Lấy danh sách nhân viên đã nghỉ việc có phân trang
     */
    getPagingResigned(payload) {
        return api.post(`${this.controller}/paging-resigned`, payload);
    }

    /**
     * Xóa thông tin cá nhân của nhân viên
     */
    anonymize(id) {
        return api.post(`${this.controller}/${id}/anonymize`);
    }

    /**
     * Khôi phục nhân viên
     */
    restore(id) {
        return api.post(`${this.controller}/${id}/restore`);
    }
}

export default new EmployeesAPI();
