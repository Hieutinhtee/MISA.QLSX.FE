<script setup>
import { ref, defineModel, watch } from "vue";
import MsTextarea from "@/components/ms-textarea/MsTextarea.vue";
import MsInput from "@/components/ms-input/MsInput.vue";
import MsDatePicker from "@/components/ms-date-picker/MsDatePicker.vue";
import MsSelect from "@/components/ms-select/MsSelect.vue";
import { createShift } from "@/common/model/shiftModel";
import { formatDateDDMMYYYY } from "@/utils/common";

//#region constants
/**
 * Tiêu đề form ứng viên
 * createdBy: TMHieu (22/01/2026)
 */
const TITLE_shift_FORM_ADD = "Thêm ứng viên";
const TITLE_shift_FORM_EDIT = "Chỉnh sửa ứng viên";

/**
 * Tùy chọn giới tính
 * createdBy: TMHieu (30/01/2026)
 */
const genderOptions = ref([
    {
        value: "nam",
        label: "Nam",
    },
    {
        value: "nu",
        label: "Nữ",
    },
    {
        value: "khac",
        label: "Khác",
    },
]);

/**
 * Tùy chọn nguồn ứng viên
 * createdBy: TMHieu (30/01/2026)
 */
const sourceOptions = ref([
    {
        value: "facebook",
        label: "Facebook",
    },
    {
        value: "linkedin",
        label: "LinkedIn",
    },
    {
        value: "tuyendung",
        label: "Tuyển dụng",
    },
    {
        value: "khac",
        label: "Khác",
    },
]);

/**
 * Tùy chọn nhân sự khai thác
 * createdBy: TMHieu (30/01/2026)
 */
const employeeOptions = ref([
    {
        value: "nguyen-van-a",
        label: "Nguyễn Văn A",
    },
    {
        value: "tran-thi-b",
        label: "Trần Thị B",
    },
]);
/**
 * Tùy cộng tác viên
 * createdBy: TMHieu (30/01/2026)
 */
const collaboratorOptions = ref([
    {
        value: "id1",
        label: "Dùng Thanh Nộ",
    },
    {
        value: "id2",
        label: "Trần Thị C",
    },
    {
        value: "khac",
        label: "Khác",
    },
]);
//#endregion constants

//#region Props
/**
 * Props của component shiftForm
 * @property {string} typeForm - Kiểu form hiện tại: thêm hoặc sửa. Mặc định là "add"
 * createdBy: TMHieu (29/01/2026)
 */
const props = defineProps({
    typeForm: {
        type: String,
        default: "add",
        validator: (value) => ["add", "edit"].includes(value),
    },
    data: {
        type: Object,
    },
});
//#endregion

//#region State Data
/** * Trạng thái mở/đóng form ứng viên
 * createdBy: TMHieu (30/01/2026)
 */
const isFormOpen = defineModel({
    type: Boolean,
    default: false,
});

/**
 * Thông báo lỗi của các trường trong
 * form nếu có valaidate liên quan nghiệp vụ
 * ví dụ trùng tên hoặc số điện thoại
 * createdBy: TMHieu (30/01/2026)
 */
// const errorMessage = ref({
//     fullName: "",
//     phone: "",
// });

/**
 * Trạng thái hợp lệ của các trường trong form
 * createdBy: TMHieu (30/01/2026)
 */
const fieldValid = ref({
    name: false,
    phone: false,
});

/**
 * Trạng thái đã submit form
 * createdBy: TMHieu (30/01/2026)
 */
const isSubmit = ref(false);

/**
 * Dữ liệu ứng viên trong form
 * createdBy: TMHieu (30/01/2026)
 */
const shift = ref(createShift());
//#endregion State Data

//#region Emit
/**
 * Khai báo emit sự kiện submit
 * createdBy: TMHieu (30/01/2026)
 */
const emit = defineEmits(["submit"]);
// #endregion emit

//#region Watch

/**
 * lắng nghe mở form, xử lí mở form add hoặc edit
 * đổ dữ liệu nếu là edit
 * createdBy: TMHieu (30/01/2026)
 */
watch(
    () => isFormOpen.value,
    (open) => {
        if (!open) return;

        if (props.typeForm === "edit" && props.data) {
            shift.value = { ...props.data };
        }

        if (props.typeForm === "add") {
            shift.value = createShift();
        }
    },
);

//#endregion watch

//#region Methods

/**
 * Hàm xử lý sự kiện submit form
 * createdBy: TMHieu (29/01/2026)
 */
const handleSubmit = () => {
    isSubmit.value = true;

    const allValid = Object.values(fieldValid.value).every(Boolean);
    if (allValid) {
        emit("submit", { ...shift.value });
    }
};

const handleCloseForm = () => {
    isFormOpen.value = false;
    isSubmit.value = false;
    shift.value.id = "";
    shift.value.fullName = "";
    shift.value.phone = "";
    shift.value.source = "";
    shift.value.email = "";
    shift.value.country = "";
    shift.value.address = "";
    shift.value.educationLevel = "";
    shift.value.educationPlace = "";
    shift.value.major = "";
};

// Đẩy lên cho phép cha gọi đến để đóng và reset form
defineExpose({
    handleCloseForm,
});

const valueDate = ref(null);
//#endregion Methods
</script>

<template>
    <!-- Form thêm ứng viên  -->
    <div v-if="isFormOpen" class="form-shift-modal">
        <div class="form-shift__overlay"></div>
        <div class="form-shift__content d-flex flex-column">
            <div class="form-shift__header d-flex justify-content-between align-items-center">
                <div class="form-shift__title">
                    {{ props.typeForm === "add" ? TITLE_shift_FORM_ADD : TITLE_shift_FORM_EDIT }}
                </div>
                <div class="form-shift__close-icon pointer" @click="handleCloseForm"></div>
            </div>
            <div class="form-shift__body d-flex flex-column">
                <!-- Form body content -->
                <div
                    class="form-shift__file d-flex flex-column align-items-center justify-content-center"
                >
                    <!-- <input type="file" class="form-shift__input-file" /> -->
                    <div class="form-shift__input-file-title">
                        Kéo thả hoặc bấm vào đây để tải CV lên
                    </div>
                    <div class="form-shift__input-file-note">
                        Chấp nhận file .docx, .pdf, .doc, .jpg, .jpeg, .png (Dung lượng nhỏ &lt;
                        15MB)
                    </div>
                </div>

                <!-- <div>{{ formatDateDDMMYYYY(valueDate) }}</div> -->

                <div class="form-shift__infor d-flex">
                    <div
                        class="form-shift__image-upload d-flex justify-content-center align-items-center"
                    >
                        Ảnh
                    </div>
                    <form class="form-shift__details">
                        <div class="form-shift__name">
                            <div class="form-shift__label form-shift__label--required">
                                Họ và tên
                            </div>
                            <ms-input
                                v-model="shift.fullName"
                                :placeholder="'Nhập họ và tên'"
                                :type="'name'"
                                v-model:isSubmit="isSubmit"
                                v-model:isValid="fieldValid.name"
                                required
                            ></ms-input>
                        </div>
                        <div class="d-flex gap-12 m-y-8 w-100 flex-1">
                            <div class="flex-1">
                                <div class="form-shift__label">Ngày sinh</div>
                                <ms-date-picker
                                    format="DD/MM/YYYY"
                                    :placeholder="'dd/MM/yyyy'"
                                    v-model="valueDate"
                                ></ms-date-picker>
                            </div>
                            <div class="flex-1">
                                <div class="form-shift__label">Giới tính</div>
                                <ms-select
                                    :placeholder="'Chọn giới tính'"
                                    :options="genderOptions"
                                ></ms-select>
                            </div>
                        </div>
                        <div class="form-shift__area">
                            <div class="form-shift__label">Khu vực</div>
                            <div class="d-flex">
                                <ms-input :placeholder="'Nhập khu vực'"></ms-input>
                                <div
                                    class="form-shift__icon-wrapper d-flex justify-content-center align-items-center"
                                >
                                    <div class="form-shift__icon-more"></div>
                                </div>
                            </div>
                        </div>
                        <div class="d-flex gap-12 m-y-8 w-100 flex-1">
                            <div class="flex-1">
                                <div class="form-shift__label form-shift__label--required">
                                    Số điện thoại
                                </div>
                                <ms-input
                                    :placeholder="'Nhập số điện thoại'"
                                    v-model="shift.phone"
                                    :type="'phone'"
                                    v-model:isSubmit="isSubmit"
                                    v-model:isValid="fieldValid.phone"
                                    required
                                ></ms-input>
                            </div>
                            <div class="flex-1">
                                <div class="form-shift__label">Email</div>
                                <ms-input :placeholder="'Nhập email'" v-model="shift.email" />
                            </div>
                        </div>
                        <div class="form-shift__country m-y-8">
                            <div class="form-shift__label">Quốc gia</div>
                            <ms-input :placeholder="'Nhập quốc gia'" v-model="shift.country" />
                        </div>
                        <div class="form-shift__city m-y-8">
                            <div class="form-shift__label">Tỉnh/Thành phố</div>
                            <ms-input :placeholder="'Nhập tỉnh/thành phố'" disabled />
                        </div>
                        <div class="form-shift__district m-y-8">
                            <div class="form-shift__label">Phường/Xã</div>
                            <ms-input :placeholder="'Nhập phường/xã'" disabled />
                        </div>
                        <div class="form-shift__address m-y-8">
                            <div class="form-shift__label">Địa chỉ</div>
                            <ms-input :placeholder="'Nhập địa chỉ'" v-model="shift.address" />
                        </div>
                        <div class="form-shift__education m-y-8">
                            <div class="form-shift__label">HỌC VẤN</div>
                            <div
                                class="d-flex form-shift__education-level align-items-center m-y-16"
                            >
                                <div class="dot"></div>
                                <div class="form-shift__label form-shift__label-edu">
                                    Trình độ học vấn
                                </div>
                                <div class="form-shift__input-add d-flex flex-1">
                                    <ms-input
                                        :placeholder="'Nhập trình độ đào tạo'"
                                        v-model="shift.educationLevel"
                                    />
                                    <div
                                        class="form-shift__icon-add-wrapper d-flex justify-content-center align-items-center"
                                    >
                                        <div class="form-shift__icon-add"></div>
                                    </div>
                                    <div
                                        class="form-shift__icon-dropdown-wrapper d-flex justify-content-center align-items-center"
                                    >
                                        <div class="form-shift__icon-dropdown"></div>
                                    </div>
                                </div>
                            </div>
                            <div
                                class="d-flex form-shift__education-level align-items-center m-y-16"
                            >
                                <div class="dot"></div>
                                <div class="form-shift__label form-shift__label-edu">
                                    Nơi dào tạo
                                </div>
                                <div class="form-shift__input-add d-flex flex-1">
                                    <ms-input
                                        :placeholder="'Nhập nơi đào tạo'"
                                        v-model="shift.educationPlace"
                                    />
                                    <div
                                        class="form-shift__icon-add-wrapper d-flex justify-content-center align-items-center"
                                    >
                                        <div class="form-shift__icon-add"></div>
                                    </div>
                                    <div
                                        class="form-shift__icon-dropdown-wrapper d-flex justify-content-center align-items-center"
                                    >
                                        <div class="form-shift__icon-dropdown"></div>
                                    </div>
                                </div>
                            </div>
                            <div
                                class="d-flex form-shift__education-level align-items-center m-y-16"
                            >
                                <div class="dot"></div>
                                <div class="form-shift__label form-shift__label-edu">
                                    Chuyên ngành
                                </div>
                                <div class="form-shift__input-add d-flex flex-1">
                                    <ms-input
                                        :placeholder="'Nhập chuyên ngành'"
                                        v-model="shift.major"
                                    />
                                    <div
                                        class="form-shift__icon-add-wrapper d-flex justify-content-center align-items-center"
                                    >
                                        <div class="form-shift__icon-add"></div>
                                    </div>
                                    <div
                                        class="form-shift__icon-dropdown-wrapper d-flex justify-content-center align-items-center"
                                    >
                                        <div class="form-shift__icon-dropdown"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-shift__add-education-btn d-flex align-items-center">
                            <div class="form-shift__icon-add"></div>
                            <div class="form-shift__add-education-btn-text">Thêm học vấn</div>
                        </div>
                        <div class="d-flex gap-12 m-y-8 w-100 flex-1">
                            <div class="flex-1">
                                <div class="form-shift__label form-shift__label--required">
                                    Ngày ứng tuyển
                                </div>
                                <ms-date-picker :placeholder="'dd/MM/yyyy'" />
                            </div>
                            <div class="flex-1">
                                <div class="form-shift__label">Nguồn ứng viên</div>

                                <ms-select
                                    :placeholder="'Chọn nguồn ứng viên'"
                                    :options="sourceOptions"
                                    v-model="shift.source"
                                ></ms-select>
                            </div>
                        </div>
                        <div class="d-flex gap-12 m-y-8 w-100 flex-1">
                            <div class="flex-1">
                                <div class="form-shift__label">Nhân sự khai thác</div>
                                <ms-select
                                    :placeholder="'Chọn nhân sự khai thác'"
                                    :options="employeeOptions"
                                ></ms-select>
                            </div>
                            <div class="flex-1">
                                <div class="form-shift__label">Cộng tác viên</div>

                                <ms-select
                                    :placeholder="'Chọn cộng tác viên'"
                                    :options="collaboratorOptions"
                                ></ms-select>
                            </div>
                        </div>
                        <div class="form-shift__quick-reference m-y-16 d-flex align-items-center">
                            <input type="checkbox" class="form-shift__quick-reference-input" />
                            <div class="form-shift__label">
                                Thêm nhanh người tham chiếu vào kho ứng viên
                            </div>
                        </div>
                        <div class="form-shift__add-education-btn d-flex align-items-center">
                            <div class="form-shift__icon-add"></div>
                            <div class="form-shift__add-education-btn-text">
                                Thêm người giới thiệu
                            </div>
                        </div>
                        <div class="form-shift__address-work m-y-16">
                            <div class="form-shift__label">Nơi làm việc gần đây</div>
                            <ms-input :placeholder="'Nhập nơi làm việc'" />
                        </div>
                        <div class="form-shift__add-education-btn d-flex align-items-center">
                            <div class="form-shift__icon-add"></div>
                            <div class="form-shift__add-education-btn-text">
                                Thêm kinh nghiệm làm việc
                            </div>
                        </div>
                        <div class="form-shift__work m-y-16">
                            <div class="form-shift__label">Nơi làm việc</div>
                            <ms-input :placeholder="'Nhập nơi làm việc'" />
                        </div>
                        <div class="form-shift__work-time m-y-16">
                            <div class="form-shift__label">Thời gian</div>
                            <div class="form-shift__work-time-input d-flex align-items-center">
                                <ms-date-picker
                                    picker="month"
                                    :placeholder="'MM/yyyy'"
                                    format="MM/YYYY"
                                />
                                <div class="line-v m-x-8"></div>
                                <ms-date-picker
                                    picker="month"
                                    :placeholder="'MM/yyyy'"
                                    format="MM/YYYY"
                                />
                            </div>
                        </div>
                        <div class="form-shift__position m-y-16">
                            <div class="form-shift__label">Vị trí công việc</div>
                            <ms-input :placeholder="'Nhập vị trí công việc'" />
                        </div>
                        <div class="form-shift__work-detail m-y-16">
                            <div class="form-shift__label">Mô tả công việc</div>
                            <ms-textarea></ms-textarea>
                        </div>
                    </form>
                </div>
            </div>
            <div class="form-shift__footer d-flex align-items-center justify-content-end">
                <div class="form-shift__footer-buttons d-flex align-items-center">
                    <div class="form-shift__cancel-btn pointer" @click="handleCloseForm">Hủy</div>
                    <div class="form-shift__save-btn pointer" @click="handleSubmit">Lưu</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Style phần form thêm ứng viên  */
.form-shift__overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.45);
    z-index: 10;
}

.form-shift__content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    max-width: 560px;
    max-height: 815px;
    background-color: white;
    border-radius: var(--border-radius);
    z-index: 11;
    overflow: hidden;
}

.form-shift__header {
    margin: 24px 16px 0 24px;
}

.form-shift__title {
    font-size: 24px;
    font-weight: 700;
}

.form-shift__body {
    flex: 1;
    overflow-y: auto;
    padding: 24px 16px 24px 24px;
    min-height: 0;
}

.form-shift__input-file-note {
    margin-top: 10px;
    font-size: 13px;
    color: #6a727d;
}

.form-shift__input-file-title {
    color: #2970f6;
    font-size: 13px;
}

.form-shift__file {
    padding: 30px 0;
    border-radius: var(--border-radius);
    border: 1px dashed #e0e0e0;
}

.form-shift__infor {
    margin-top: 24px;
    margin-right: 8px;
}

.form-shift__image-upload {
    border: 1px dashed #e0e0e0;
    border-radius: 50%;
    width: 63px;
    height: 63px;
    margin-top: 10px;
    margin-right: 16px;
    color: #b2b2b2;
}

.form-shift__details {
    flex: 1;
}

.form-shift__footer {
    height: 56px;
    width: 100%;
    background-color: #f1f2f5;
}

.form-shift__save-btn {
    height: 36px;
    background-color: var(--primary-color);
    padding: 10px 24px;
    color: white;
    border-radius: var(--border-radius);
    margin-right: 25px;
}

.form-shift__cancel-btn {
    height: 36px;
    padding: 10px 24px;
    margin-right: 6px;
}

.form-shift__label {
    font-size: 14px;
    font-weight: 500;
    line-height: 25px;
}

.form-shift__label--required::after {
    content: "*";
    color: red;
    margin-left: 3px;
}

.form-shift__icon-wrapper {
    width: 34px;
    height: 34px;
    background-color: #f5f5f5;
    border: 1px solid #dcdce3;
    border-radius: var(--border-radius);
}

.form-shift__icon-dropdown-wrapper {
    width: 34px;
    height: 34px;
    border: 1px solid #dcdce3;
    border-radius: var(--border-radius);
}

.form-shift__input-add {
    position: relative;
}

.form-shift__icon-add-wrapper {
    position: absolute;
    top: 50%;
    right: 40px;
    transform: translateY(-50%);
}

.form-shift__label-edu {
    min-width: 130px;
}

.dot {
    width: 5px;
    height: 5px;
    background-color: #9e9e9e;
    border-radius: 50%;
    margin-right: 5px;
}

.form-shift__education {
    border-bottom: 1px solid #dee2e6 !important;
    margin-bottom: 16px;
    padding-bottom: 6px;
}

.form-shift__add-education-btn-text {
    color: #2970f6;
    margin-left: 3px;
}

.form-shift__quick-reference-input {
    margin-right: 10px;
}

.form-shift__address-work {
    border-bottom: 1px solid #dee2e6 !important;
    margin-bottom: 16px;
    padding-bottom: 16px;
}

.line-v {
    width: 10px;
    height: 1px;
    background-color: black;
}

.form-shift__work-detail-input {
    height: 100px;
}

.modal--hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}
/* Kết thúc Style phần form thêm ứng viên  */
</style>
