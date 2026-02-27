<template>
    <textarea
        type="textarea"
        class="form-candidate__work-detail-input"
        placeholder="Nhập mô tả công việc"
    ></textarea>
</template>

<style scoped>
textarea {
    height: 34px;
    width: 100%;
    min-width: 0;
    padding: 8px 16px;
    border-radius: var(--border-radius);
    outline: none;
    border: 1px solid #dcdce3;
}

textarea::placeholder {
    color: #9e9e9e;
    font-size: 14px;
}

textarea:focus {
    border-color: var(--primary-color);
}

textarea:hover {
    border-color: var(--primary-color);
}
</style>
