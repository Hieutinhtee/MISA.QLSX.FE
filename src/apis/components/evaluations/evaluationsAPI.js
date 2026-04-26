import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI.js";

class EvaluationsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Evaluations";
    }
}

export default new EvaluationsAPI();
