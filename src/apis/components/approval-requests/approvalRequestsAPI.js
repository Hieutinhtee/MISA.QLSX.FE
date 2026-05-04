import BaseAPI from "@/apis/base/BaseAPI.js";
import api from "@/apis/config/APIConfig.js";

class ApprovalRequestsAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "ApprovalRequests";
    }

    /**
     * Phê duyệt 1 bước.
     * @param {string} requestId - ID yêu cầu
     * @param {string} stepId - ID bước duyệt
     * @param {string|null} comment - Ghi chú
     */
    async approveStep(requestId, stepId, comment = null) {
        return await api.post(
            `${this.controller}/${requestId}/approve/${stepId}`,
            { comment },
        );
    }

    /**
     * Từ chối 1 bước.
     */
    async rejectStep(requestId, stepId, comment = null) {
        return await api.post(
            `${this.controller}/${requestId}/reject/${stepId}`,
            { comment },
        );
    }

    /**
     * Lấy danh sách bước phê duyệt của 1 yêu cầu.
     */
    async getSteps(requestId) {
        return await api.get(`${this.controller}/${requestId}/steps`);
    }
}

export default new ApprovalRequestsAPI();
