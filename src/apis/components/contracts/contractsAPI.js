import BaseAPI from "@/apis/base/BaseAPI.js";

class ContractsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Contracts";
    }
}

export default new ContractsAPI();
