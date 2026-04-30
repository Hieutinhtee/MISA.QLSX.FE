import BaseAPI from "@/apis/base/BaseAPI.js";

class DepartmentsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Departments";
    }
}

export default new DepartmentsAPI();
