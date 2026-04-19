# Skill Template

## Tên skill

Ví dụ: `fix-api-error`, `create-form`, `write-tests`, `review-component`.

## Mục tiêu

- Skill này dùng để làm gì?
- Kết quả cuối cùng cần đạt là gì?

## Khi nào dùng

- Trường hợp nào nên gọi skill này?
- Trường hợp nào không nên dùng?

## Bối cảnh dự án

- Module / màn hình / API liên quan
- File chính cần xem
- Quy ước code cần giữ

## Ràng buộc

- Không sửa code ngoài phạm vi cần thiết.
- Giữ nguyên style hiện tại.
- Ưu tiên root cause hơn là vá tạm.

## Các bước thực hiện

1. Đọc file liên quan.
2. Xác định nguyên nhân chính.
3. Sửa ít nhất có thể.
4. Kiểm tra lỗi hoặc luồng ảnh hưởng.

## Đầu ra mong muốn

- Danh sách file đã sửa
- Tóm tắt nguyên nhân
- Tóm tắt cách fix
- Ghi chú rủi ro còn lại nếu có

## Prompt mẫu

> Hãy thực hiện skill này cho module sau. Đọc bối cảnh, làm đúng phạm vi, sửa root cause, và sau cùng liệt kê file đã thay đổi cùng kết quả kiểm tra.
