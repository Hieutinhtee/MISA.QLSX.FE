import BaseAPI from "@/apis/base/BaseAPI.js";
import api from "@/apis/config/APIConfig.js";

class LeaveRequestsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "LeaveRequests";
    }

    /**
     * Thu hồi đơn nghỉ phép.
     * @param {string} leaveRequestId - ID đơn nghỉ phép.
     */
    withdraw(leaveRequestId) {
        return api.post(`${this.controller}/${leaveRequestId}/withdraw`);
    }
}

export default new LeaveRequestsAPI();
