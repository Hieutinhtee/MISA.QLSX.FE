import BaseAPI from "@/apis/base/BaseAPI.js";

class DegreesAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Degrees";
    }
}

export default new DegreesAPI();
