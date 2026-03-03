import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI.js";

class ShiftsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Shifts";
    }
}

export default new ShiftsAPI();
