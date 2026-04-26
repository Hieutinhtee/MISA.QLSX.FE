import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI.js";

class AllowancesAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Allowances";
    }
}

export default new AllowancesAPI();
