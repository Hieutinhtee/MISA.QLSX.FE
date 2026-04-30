import api from "@/apis/config/APIConfig.js";

/**
 * API cho trang Tổng quan (Dashboard)
 */
class DashboardAPI {
    constructor() {
        this.controller = "Dashboard";
    }

    /**
     * Lấy dữ liệu tổng quan theo khoảng thời gian
     * @param {"week"|"month"|"year"} period
     */
    getDashboard(period = "month") {
        return api.get(`${this.controller}`, { params: { period } });
    }
}

export default new DashboardAPI();
