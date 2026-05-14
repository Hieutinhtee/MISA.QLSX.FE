<script setup>
import { defineProps, ref, watch, onMounted } from "vue";
import { Table, Modal, Space, Popconfirm, Tag } from "ant-design-vue";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import DependentsAPI from "@/apis/components/dependents/dependentsAPI";
import MsButton from "@/components/ms-button/MsButton.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import MsDatePicker from "@/components/ms-date-picker/MsDatePicker.vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import { $toastSuccess, $toastError } from "@/utils/toastService";

const props = defineProps({
    employeeId: {
        type: String,
        required: true,
    },
});

const loading = ref(false);
const dependents = ref([]);
const isModalOpen = ref(false);
const modalTitle = ref("Thêm người phụ thuộc");

const defaultForm = () => ({
    dependentId: null,
    employeeId: props.employeeId,
    fullName: "",
    dateOfBirth: null,
    relationship: "Con",
    taxCode: "",
    identityNumber: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    isActive: true,
    note: "",
});

const formState = ref(defaultForm());

function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

const columns = [
    { title: "Họ và tên", dataIndex: "fullName", key: "fullName", width: 200 },
    { title: "Mối quan hệ", dataIndex: "relationship", key: "relationship", width: 120 },
    { 
        title: "Ngày sinh", 
        dataIndex: "dateOfBirth", 
        key: "dateOfBirth", 
        width: 120,
        customRender: ({ text }) => formatDate(text)
    },
    { title: "Mã số thuế", dataIndex: "taxCode", key: "taxCode", width: 130 },
    { 
        title: "Trạng thái", 
        dataIndex: "isActive", 
        key: "isActive", 
        width: 100,
    },
    { title: "Thao tác", key: "action", width: 100, fixed: "right" },
];

const relationshipOptions = [
    { value: "Con", label: "Con" },
    { value: "Vợ/Chồng", label: "Vợ/Chồng" },
    { value: "Bố/Mẹ", label: "Bố/Mẹ" },
    { value: "Khác", label: "Khác" },
];

function toDateString(value) {
    if (!value) return null;
    if (typeof value === 'string' && value.includes('T')) {
        return value.split('T')[0];
    }
    return value;
}

async function loadDependents() {
    if (!props.employeeId) return;
    loading.value = true;
    try {
        const res = await DependentsAPI.getByEmployeeId(props.employeeId);
        dependents.value = res.data || [];
    } catch (error) {
        console.error(error);
        $toastError("Không thể tải danh sách người phụ thuộc");
    } finally {
        loading.value = false;
    }
}

function handleAdd() {
    modalTitle.value = "Thêm người phụ thuộc";
    formState.value = defaultForm();
    isModalOpen.value = true;
}

function handleEdit(record) {
    modalTitle.value = "Sửa người phụ thuộc";
    formState.value = { 
        ...record,
        dateOfBirth: toDateString(record.dateOfBirth),
        startDate: toDateString(record.startDate),
        endDate: toDateString(record.endDate),
    };
    isModalOpen.value = true;
}

async function handleDelete(id) {
    try {
        await DependentsAPI.delete([id]);
        $toastSuccess("Đã xóa người phụ thuộc");
        loadDependents();
    } catch (error) {
        console.error(error);
        $toastError("Lỗi khi xóa dữ liệu");
    }
}

async function handleOk() {
    if (!formState.value.fullName || !formState.value.dateOfBirth || !formState.value.relationship) {
        $toastError("Vui lòng điền đầy đủ các trường bắt buộc");
        return;
    }

    try {
        if (!props.employeeId) {
            $toastError("Không xác định được nhân viên");
            return;
        }

        const values = {
            ...formState.value,
            employeeId: props.employeeId, // Force the current employeeId
            isActive: !!formState.value.isActive,
        };

        if (values.dependentId) {
            await DependentsAPI.update(values.dependentId, values);
            $toastSuccess("Cập nhật thành công");
        } else {
            await DependentsAPI.create(values);
            $toastSuccess("Thêm mới thành công");
        }
        isModalOpen.value = false;
        loadDependents();
    } catch (error) {
        console.error(error);
        $toastError("Vui lòng kiểm tra lại thông tin");
    }
}

watch(() => props.employeeId, (newId) => {
    if (newId) loadDependents();
}, { immediate: true });

onMounted(() => {
    if (props.employeeId) loadDependents();
});
</script>

<template>
    <div class="employee-dependent-container">
        <div class="d-flex justify-content-between align-items-center mb-12">
            <div class="section-title">Danh sách người phụ thuộc</div>
            <ms-button type="primary" @click="handleAdd">
                <template #icon><plus-outlined /></template>
                Thêm mới
            </ms-button>
        </div>

        <Table 
            :columns="columns" 
            :data-source="dependents" 
            :loading="loading" 
            :pagination="false"
            size="small"
            bordered
            :scroll="{ x: 800 }"
        >
            <template #bodyCell="{ column, record, text }">
                <template v-if="column.key === 'isActive'">
                    <Tag :color="text ? 'green' : 'red'">{{ text ? 'Hoạt động' : 'Ngừng' }}</Tag>
                </template>
                <template v-if="column.key === 'action'">
                    <Space>
                        <a @click="handleEdit(record)" title="Sửa"><edit-outlined /></a>
                        <popconfirm
                            title="Bạn có chắc chắn muốn xóa?"
                            ok-text="Xóa"
                            cancel-text="Hủy"
                            @confirm="handleDelete(record.dependentId)"
                        >
                            <a class="text-danger" title="Xóa"><delete-outlined /></a>
                        </popconfirm>
                    </Space>
                </template>
            </template>
        </Table>

        <Modal
            v-model:open="isModalOpen"
            :title="modalTitle"
            @ok="handleOk"
            width="600px"
            centered
            ok-text="Lưu"
            cancel-text="Hủy"
        >
            <div class="mt-16 custom-form">
                <div class="row mb-12">
                    <div class="col-12">
                        <div class="form-label required">Họ và tên</div>
                        <ms-input v-model="formState.fullName" placeholder="Nhập họ và tên" />
                    </div>
                </div>
                <div class="row mb-12">
                    <div class="col-6">
                        <div class="form-label required">Mối quan hệ</div>
                        <ms-select v-model="formState.relationship" :options="relationshipOptions" />
                    </div>
                    <div class="col-6">
                        <div class="form-label required">Ngày sinh</div>
                        <ms-date-picker v-model="formState.dateOfBirth" format="DD/MM/YYYY" value-format="YYYY-MM-DD" />
                    </div>
                </div>
                <div class="row mb-12">
                    <div class="col-6">
                        <div class="form-label">Mã số thuế</div>
                        <ms-input v-model="formState.taxCode" placeholder="Nhập mã số thuế" />
                    </div>
                    <div class="col-6">
                        <div class="form-label">CCCD / Giấy khai sinh</div>
                        <ms-input v-model="formState.identityNumber" placeholder="Nhập số định danh" />
                    </div>
                </div>
                <div class="row mb-12">
                    <div class="col-6">
                        <div class="form-label required">Bắt đầu giảm trừ</div>
                        <ms-date-picker v-model="formState.startDate" format="DD/MM/YYYY" value-format="YYYY-MM-DD" />
                    </div>
                    <div class="col-6">
                        <div class="form-label">Kết thúc giảm trừ</div>
                        <ms-date-picker v-model="formState.endDate" format="DD/MM/YYYY" value-format="YYYY-MM-DD" />
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <div class="form-label">Ghi chú</div>
                        <ms-textarea v-model="formState.note" :rows="2" />
                    </div>
                </div>
            </div>
        </Modal>
    </div>
</template>

<style scoped>
.employee-dependent-container {
    padding: 8px 0;
}
.section-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
}
.mt-16 {
    margin-top: 16px;
}
.mb-12 {
    margin-bottom: 12px;
}
.row {
    display: flex;
    flex-wrap: wrap;
    margin-right: -8px;
    margin-left: -8px;
}
.col-6 {
    flex: 0 0 50%;
    max-width: 50%;
    padding-right: 8px;
    padding-left: 8px;
}
.col-12 {
    flex: 0 0 100%;
    max-width: 100%;
    padding-right: 8px;
    padding-left: 8px;
}
.text-danger {
    color: #ff4d4f;
}
.form-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 4px;
}
.form-label.required::after {
    content: " *";
    color: #ff4d4f;
}
</style>
