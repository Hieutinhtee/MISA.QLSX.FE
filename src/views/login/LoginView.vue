<script setup>
import { inject, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const auth = inject("auth");

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isSubmitting = ref(false);

async function submitLogin() {
    errorMessage.value = "";
    isSubmitting.value = true;

    try {
        await auth.login(username.value, password.value);
        router.push("/shifts");
    } catch (error) {
        errorMessage.value =
            error?.response?.data?.error?.userMsg ||
            error?.response?.data?.message ||
            "Đăng nhập thất bại";
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<template>
    <div class="login-page">
        <div class="login-card">
            <h1>Đăng nhập hệ thống</h1>
            <p>Quản lý nhân sự MISEM</p>

            <form class="login-form" @submit.prevent="submitLogin">
                <label for="username">Tài khoản</label>
                <input
                    id="username"
                    v-model="username"
                    type="text"
                    autocomplete="username"
                    placeholder="Nhập username"
                    required
                />

                <label for="password">Mật khẩu</label>
                <input
                    id="password"
                    v-model="password"
                    type="password"
                    autocomplete="current-password"
                    placeholder="Nhập mật khẩu"
                    required
                />

                <button class="btn-login" type="submit" :disabled="isSubmitting">
                    {{ isSubmitting ? "Đang đăng nhập..." : "Đăng nhập" }}
                </button>
            </form>

            <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
        </div>
    </div>
</template>

<style scoped>
.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
        radial-gradient(circle at 20% 20%, rgba(0, 155, 113, 0.25), transparent 40%),
        radial-gradient(circle at 80% 0%, rgba(23, 95, 240, 0.2), transparent 35%),
        linear-gradient(180deg, #f4faf7 0%, #eff4ff 100%);
}

.login-card {
    width: min(420px, 100%);
    background: #ffffff;
    border-radius: 14px;
    padding: 28px;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
}

h1 {
    margin: 0;
    font-size: 26px;
    color: #0f172a;
}

p {
    margin: 8px 0 20px;
    color: #475569;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

label {
    color: #334155;
    font-weight: 600;
    font-size: 14px;
}

input {
    height: 42px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0 12px;
    font-size: 14px;
}

input:focus {
    outline: none;
    border-color: #009b71;
    box-shadow: 0 0 0 3px rgba(0, 155, 113, 0.18);
}

.btn-login {
    margin-top: 8px;
    height: 42px;
    border: none;
    border-radius: 8px;
    background: #009b71;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
}

.btn-login:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-login:not(:disabled):hover {
    background: #007a58;
}

.error-msg {
    margin-top: 12px;
    color: #dc2626;
    font-weight: 600;
}
</style>
