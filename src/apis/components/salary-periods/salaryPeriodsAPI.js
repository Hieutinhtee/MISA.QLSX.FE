import BaseAPI from "@/apis/base/BaseAPI.js";

class SalaryPeriodsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "SalaryPeriods";
    }
}

export default new SalaryPeriodsAPI();
