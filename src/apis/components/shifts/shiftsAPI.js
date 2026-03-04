import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI.js";

class ShiftsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Shifts";
    }

    /**
     * Export Excel ca làm việc
     */
    exportExcel() {
        return api.get(`${this.controller}/export`, {
            responseType: "blob",
        });
    }

    /**
     * Hàm xóa hàng loạt khách hàng
     * @returns {int} số bản ghi khách hàng xóa thành công
     * createdby: TMHieu - 9.12.2025
     */
    batchActive(ids, isActive) {
        return api.put(`${this.controller}/batch-active?isActive=${isActive}`, ids);
    }
}

export default new ShiftsAPI();
