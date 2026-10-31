## 📌 Tóm tắt thay đổi (Summary)
<!-- Tóm tắt ngắn gọn mục đích và nội dung của Pull Request này (1-3 câu) -->
- 

## 🎯 Issue liên quan
<!-- Ghi rõ mã Issue để GitHub tự động đóng khi merge -->
Closes #
Ref #

## 🏷️ Module ảnh hưởng
<!-- Chọn module liên quan -->
- [ ] `Identity`
- [ ] `Customer`
- [ ] `Contract`
- [ ] `Pricing`
- [ ] `Production`
- [ ] `Payment`
- [ ] `Workflow`
- [ ] `ESign`
- [ ] `Notification`
- [ ] `Audit`
- [ ] `BuildingBlocks / Infra`
- [ ] `Frontend / UI`

## 📋 Checklist kiểm tra chất lượng (Definition of Done)
*Vui lòng tích chọn trước khi yêu cầu review:*

- [ ] **Build & Compile**: Code build thành công ở máy local (`dotnet build` / `npm run build`), không có warning/error nghiêm trọng.
- [ ] **Kiểm thử (Tests)**:
  - [ ] Đã chạy toàn bộ unit/integration test cục bộ và tất cả đều **PASS** (`dotnet test QtkdSolution.sln`).
  - [ ] Đã bổ sung/cập nhật unit test hoặc integration test cho logic mới (nếu có).
- [ ] **Tự rà soát (Self-Review)**:
  - [ ] Đã tự review lại toàn bộ diff thay đổi của mình trên Git.
  - [ ] Đã xóa các lệnh `Console.WriteLine`, `console.log`, code nháp, comment thừa không cần thiết.
- [ ] **Tuân thủ quy ước (Conventions)**:
  - [ ] Tên nhánh đúng quy chuẩn: `feature/<module>-<mô tả>` hoặc `bugfix/<module>-<mô tả>`.
  - [ ] Các commit tuân thủ chuẩn **Conventional Commits** (`feat(...)`, `fix(...)`,...).
  - [ ] Không sửa đổi trực tiếp vào database mà không thông qua migration.
- [ ] **Business Rules (Quy tắc nghiệp vụ)**:
  - [ ] Đã đối chiếu các rule liên quan trong đề bài (CTR-*, PRC-*, PAY-*, APR-*).
  - [ ] Không vi phạm ràng buộc toàn vẹn dữ liệu và phân quyền ngữ cảnh.
- [ ] **Tài liệu & Đặc tả (Documentation)**:
  - [ ] Đã cập nhật tài liệu kỹ thuật / docs thiết kế / ERD / OpenAPI / README (nếu có thay đổi liên quan).

## 🧪 Hướng dẫn kiểm thử thủ công (Test Plan / Steps)
1. Bước 1: ...
2. Bước 2: ...
3. Kết quả mong đợi: ...

## 📸 Ảnh chụp màn hình / Minh chứng (Screenshots / Logs)
*(Đính kèm ảnh minh họa UI hoặc ảnh chạy Swagger/Test nếu có)*

---
**Reviewers:** @... @...
