# Copilot Playbook

Tài liệu này là bộ khung dùng Copilot hiệu quả hơn trong dự án FE/BE.

## Cách dùng nhanh

1. Viết bối cảnh vào `docs` trước khi nhờ Copilot sửa.
2. Tách task lớn thành `skill`, `agent`, `subagent`.
3. Mỗi prompt nên có: mục tiêu, phạm vi, ràng buộc, đầu ra mong muốn.
4. Sau khi Copilot sửa, luôn yêu cầu kiểm tra lỗi và nêu giả định.

## Các file mẫu

- `.github/copilot-instructions.md`
- `docs/copilot/skill-template.md`
- `docs/copilot/agent-template.md`
- `docs/copilot/subagent-template.md`
- `docs/copilot/ui-layout-review-agent.md`

## Gợi ý thực tế

- Dùng `skill` cho việc lặp lại nhiều lần như CRUD, validate, test, review.
- Dùng `agent` khi task cần đọc nhiều file và sửa nhiều bước.
- Dùng `subagent` để chia vai: nghiên cứu, implement, review, verify.
- Viết tài liệu ngắn, rõ, có tiêu chí hoàn thành đo được.
