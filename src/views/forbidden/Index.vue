<template>
    <div class="forbidden-page">
        <div class="forbidden-card">
            <h1>403</h1>
            <p>Bạn không có quyền truy cập trang này.</p>
            <RouterLink to="/shifts" class="back-link">Quay về trang chủ</RouterLink>
        </div>
    </div>
</template>

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

.back-link {
    color: #009b71;
    font-weight: 700;
    text-decoration: none;
}
</style>
