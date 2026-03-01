import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI.js";

class ShiftsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Shifts";
    }

    /**
     * Hàm xóa hàng loạt ca làm việc
     * @param {*} payload
     * @returns {int} số bản ghi khách hàng xóa thành công
     * createdby: TMHieu - 9.12.2025
     */
    deleteCustomer(payload) {
        return api.put(`${this.controller}/soft-delete-many`, payload);
    }
}

export default new ShiftsAPI();
