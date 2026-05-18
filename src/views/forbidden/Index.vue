<template>
    <div class="forbidden-page">
        <div class="forbidden-card">
            <h1>403</h1>
            <p>Bạn không có quyền truy cập trang này.</p>
            <button @click="handleBackHome" class="back-link-btn">Quay về trang đăng nhập</button>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const handleBackHome = () => {
    // Xóa session để thoát khỏi vòng lặp redirect vô tận
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
};
</script>

<style scoped>
.forbidden-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    padding: 20px;
}

.forbidden-card {
    text-align: center;
    background: #fff;
    padding: 28px;
    border-radius: 14px;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

h1 {
    margin: 0;
    font-size: 54px;
    color: #dc2626;
}

p {
    margin: 10px 0 16px;
    color: #334155;
}

.back-link-btn {
    background: #009b71;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.back-link-btn:hover {
    background: #007d5c;
}
</style>
