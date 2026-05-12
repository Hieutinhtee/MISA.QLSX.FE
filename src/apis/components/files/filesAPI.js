import BaseAPI from "@/apis/base/baseAPI";
import api from "@/apis/config/APIConfig.js";

class FilesAPI extends BaseAPI {
    constructor() {
        super();
        this.controller = "Files";
    }

    /**
     * Tải file lên hệ thống
     * @param {File} file File cần upload
     * @param {Object} meta Metadata { moduleName, entityName, entityId, purpose }
     */
    async upload(file, meta) {
        const formData = new FormData();
        formData.append("file", file);
        if (meta.moduleName) formData.append("moduleName", meta.moduleName);
        if (meta.entityName) formData.append("entityName", meta.entityName);
        if (meta.entityId) formData.append("entityId", String(meta.entityId));
        if (meta.purpose) formData.append("purpose", meta.purpose);

        return await api.post(`${this.controller}/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    }

    /**
     * Lấy danh sách file theo entity
     * @param {Object} meta Metadata { moduleName, entityName, entityId }
     */
    async getByEntity(meta) {
        return await api.get(`${this.controller}/by-entity`, {
            params: {
                moduleName: meta.moduleName,
                entityName: meta.entityName,
                entityId: meta.entityId,
            },
        });
    }

    /**
     * Download file (lấy raw blob data)
     * @param {String} fileId 
     */
    async download(fileId) {
        return await api.get(`${this.controller}/${fileId}/download`, {
            responseType: "blob",
        });
    }

    /**
     * Xoá file
     * @param {String} fileId 
     */
    async deleteFile(fileId) {
        return await api.delete(`${this.controller}/${fileId}`);
    }
}

export default new FilesAPI();
