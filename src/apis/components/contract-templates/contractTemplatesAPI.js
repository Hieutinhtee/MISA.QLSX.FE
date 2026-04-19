import BaseAPI from "@/apis/base/BaseAPI.js";

class ContractTemplatesAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "ContractTemplates";
    }
}

export default new ContractTemplatesAPI();
