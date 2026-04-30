import BaseAPI from "@/apis/base/BaseAPI.js";

class PositionsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Positions";
    }
}

export default new PositionsAPI();
