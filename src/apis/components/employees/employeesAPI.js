import BaseAPI from "@/apis/base/BaseAPI.js";

class EmployeesAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Employees";
    }
}

export default new EmployeesAPI();
