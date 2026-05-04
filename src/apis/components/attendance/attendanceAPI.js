import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI";

class AttendanceAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Attendances";
    }

    /**
     * Lấy dữ liệu dashboard chấm công
     * @param {string} date - Ngày định dạng YYYY-MM-DD
     */
    getDashboard(date) {
        return api.get(`${this.controller}/dashboard`, { params: { date } });
    }

    /**
     * Lấy lịch sử chấm công chi tiết của nhân viên
     * @param {string} employeeId - ID nhân viên
     * @param {number} month - Tháng
     * @param {number} year - Năm
     */
    getEmployeeCalendar(employeeId, month, year) {
        return api.get(`${this.controller}/employee/${employeeId}/calendar`, {
            params: { month, year }
        });
    }
}

export default new AttendanceAPI();
