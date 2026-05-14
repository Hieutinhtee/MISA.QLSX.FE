import BaseAPI from "@/apis/base/BaseAPI.js";
import api from "@/apis/config/APIConfig.js";

class ContractsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Contracts";
    }

    getAllowances(contractId) {
        return api.get(`${this.controller}/${contractId}/allowances`);
    }
}

export default new ContractsAPI();
