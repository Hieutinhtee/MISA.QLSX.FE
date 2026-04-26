import api from "@/apis/config/APIConfig.js";
import BaseAPI from "@/apis/base/BaseAPI.js";

class BusinessTripsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "BusinessTrips";
    }
}

export default new BusinessTripsAPI();
