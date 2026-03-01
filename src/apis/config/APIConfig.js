import axios from "axios";

/**
 * Lấy các hàm hiển thị thông báo toast.
 */
// const { showToastSuccess, showToastError, showToastInfo } = useToastMessage()

//#region Configuration
/**
 * URL cơ sở cho các API endpoint.
 * @type {string}
 */
const baseURL = "https://localhost:7124/api/v1";

/**
 * Tạo một Axios instance với cấu hình mặc định.
 * @type {axios.AxiosInstance}
 */
let api = axios.create({
    baseURL: baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});
//#endregion

//#region Interceptor - Xử lý lỗi API chung

/**
 * Interceptor bắt lỗi chung từ phản hồi API.
 * Nó kiểm tra mã trạng thái và cấu trúc lỗi từ backend để hiển thị thông báo
 * lỗi phù hợp cho người dùng.
 */
api.interceptors.response.use(
    // 1. Thành công: Trả về response nguyên vẹn
    (response) => response,

    // 2. Thất bại: Xử lý lỗi
    (error) => {
        const res = error?.response;

        //  Xử lý Lỗi Kết nối (Không nhận được response)
        if (!res) {
            console.error("Lỗi kết nối đến máy chủ:", error.message);
            alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc server.");
            return Promise.reject(error);
        }

        //  Xử lý Lỗi 400 - Validation Mặc định của ASP.NET Core
        // Khi sử dụng Data Annotation, ASP.NET Core trả lỗi 400 với format { errors: { field: [msg1, msg2] } }
        if (res.status === 400 && res.data?.errors) {
            let messages = [];

            for (let key in res.data.errors) {
                // messages.push(...res.data.errors[key]);
                // Chỉ lấy lỗi đầu tiên của mỗi field để tránh quá tải toast
                if (res.data.errors[key].length > 0) {
                    messages.push(res.data.errors[key][0]);
                }
            }

            // Nếu có nhiều lỗi validation, hiển thị lỗi đầu tiên hoặc tất cả
            alert(messages.join("\n"));
            return Promise.reject(error);
        }

        //  Xử lý Lỗi Custom từ Middleware BE (Ví dụ: 400, 409, 500)
        // Backend trả về: { error: { userMsg, devMsg, traceId } }
        if (res.data?.error) {
            const userMsg = res.data.error.userMsg || "Có lỗi xảy ra, vui lòng thử lại";

            // Log lỗi devMsg/traceId cho quá trình debug
            console.error("Lỗi API Custom:", res.data.error);

            alert(userMsg);
            return Promise.reject(error);
        }

        //  Xử lý Lỗi 404 - NotFound
        if (res.status === 404) {
            alert("Không tìm thấy tài nguyên yêu cầu (404)");
            return Promise.reject(error);
        }

        //  Xử lý Lỗi 5xx - Lỗi Hệ thống
        if (res.status >= 500) {
            alert("Lỗi hệ thống (5xx), vui lòng thử lại sau.");
            return Promise.reject(error);
        }

        //  Lỗi Không xác định
        alert(`Đã xảy ra lỗi không xác định (Status: ${res.status || "Unknown"})`);
        return Promise.reject(error);
    },
);
//#endregion

export default api;
