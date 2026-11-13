# HƯỚNG DẪN CSDL & MIGRATION SPRINT 1 (TASK-13)
> **Tài liệu dành cho thành viên nhóm (Hảo, Huy, Hoàng, Hiệu, Dũng)**  
> Dựa trên TASK-10 (Phân tích thực thể), TASK-11 (ERD v1), TASK-12 (Quy ước đặt tên) và TASK-13 (DbContext & Migration).

---

## 📌 1. Tóm tắt những gì đã hoàn thành trong Task 13

### 1.1. Cấu trúc CSDL: 17 thực thể ERD & 18 bảng trên PostgreSQL
Trong Sprint 1, hệ thống tập trung vào 4 phân hệ chính với **17 thực thể nghiệp vụ** được định nghĩa trên schema `public`:
1. **Khách hàng (1 bảng):**
   - `customers`: Quản lý thông tin khách hàng, mã số thuế, đại diện pháp luật, liên hệ.
2. **Hợp đồng (3 bảng):**
   - `contracts`: Hồ sơ hợp đồng, trích yếu, giá trị, ngày hiệu lực, trạng thái, người phụ trách.
   - `contract_attachments`: Tệp đính kèm hợp đồng/phụ lục, cờ `is_main_document`, mã băm SHA-256.
   - `contract_addenda`: Phụ lục thay đổi đơn giá, gia hạn thời hạn, điều khoản thanh toán.
3. **Tài khoản & Phân quyền (7 bảng):**
   - `departments`: 6 phòng ban của công ty (KD, KT, PC, BGĐ, QTHƯ, KTNV).
   - `roles`: Vai trò chức năng (STAFF, MANAGER, DIRECTOR, ADMIN).
   - `permissions`: Danh mục quyền chi tiết theo module.
   - `role_permissions`: Bảng nối N-N giữa vai trò và quyền hạn.
   - `users`: Tài khoản người dùng hệ thống.
   - `user_roles`: Bảng nối N-N giữa người dùng và vai trò.
   - `refresh_tokens`: Lưu trữ phiên đăng nhập và token hash.
4. **Workflow Engine (6 bảng):**
   - `workflow_definitions`: Định nghĩa quy trình phê duyệt hồ sơ theo phiên bản.
   - `workflow_step_definitions`: Các bước duyệt của một quy trình (chỉ định User hoặc Role theo Phòng ban).
   - `workflow_instances`: Lần chạy quy trình cho một hồ sơ cụ thể (liên kết đa hình `entity_type` + `entity_id`).
   - `workflow_step_instances`: Các bước thực tế của một lần chạy, gán người xử lý cụ thể.
   - `workflow_history`: Lịch sử thao tác duyệt bất biến (chỉ thêm, không sửa/xóa).
   - `idempotency_records`: Lưu kết quả theo `Idempotency-Key` để chống Submit trùng lặp.

> **💡 Tại sao gọi là 18 bảng?**  
> Khi áp dụng migration vào PostgreSQL, Entity Framework Core tự động sinh thêm bảng kỹ thuật `__ef_migrations_history` để theo dõi phiên bản migration. Do đó, lệnh `\dt public.*` trên PostgreSQL sẽ hiển thị đúng **18 bảng** (17 bảng nghiệp vụ + 1 bảng `__ef_migrations_history`).

---

### 1.2. Các quy ước kỹ thuật quan trọng đã cài đặt

1. **Quy ước đặt tên (Naming Convention):**
   - Sử dụng package `EFCore.NamingConventions` với `UseSnakeCaseNamingConvention()`: toàn bộ bảng, cột, index, foreign key, check constraint tự động chuyển thành `snake_case` chữ thường, không dấu.
   - Khóa ngoại được chuẩn hóa hậu tố `_id` (ví dụ: `started_by_user_id`, `acted_by_user_id`).
   - Khóa ngoại dài quá 63 ký tự đã được cắt gọn thủ công (`fk_workflow_step_instances_step_definition_id`).
2. **Kiểu dữ liệu:**
   - Khóa chính: Kiểu `uuid`, ứng dụng sinh bằng `Guid.CreateVersion7()` (UUIDv7 tối ưu index B-Tree theo thời gian).
   - Concurrency Token (Khóa lạc quan): Sử dụng cột hệ thống `xmin` của PostgreSQL (`IsRowVersion()`) trên `contracts`, `workflow_instances`, `workflow_step_instances`. Không tạo cột vật lý trên database.
   - Thời gian: `DateTimeOffset` (lưu dạng `timestamptz` UTC).
   - Ngày: `DateOnly` (lưu dạng `date` không kèm giờ).
   - Tiền tệ: `decimal` (lưu dạng `numeric(18,2)`), đơn vị tiền tệ `char(3)` mặc định `VND`.
   - JSON: `jsonb` cho trường `response_body` trong `idempotency_records`.
   - Enum: Lưu dạng chuỗi `varchar` PascalCase (`HasConversion<string>()`) kết hợp ràng buộc `CHECK`.
3. **Các ràng buộc nghiệp vụ (CHECK Constraints):**
   - `ck_customers_tax_code_format`: Regex chuẩn hóa MST 10 hoặc 13 số (`^[0-9]{10}(-[0-9]{3})?$`).
   - `ck_contracts_effective_dates`: `effective_from <= effective_to`.
   - `ck_contracts_value_non_negative`: `contract_value >= 0`.
   - `ck_contract_attachments_size_positive`: `size_bytes > 0`.
   - `ck_workflow_step_definitions_assignee_by_type`: Ràng buộc bắt buộc nhập `assignee_user_id` khi là `User`, hoặc `assignee_role_id` + `assignee_department_id` khi là `RoleInDepartment`.
   - `ck_workflow_step_instances_comment_required`: Bắt buộc nhập comment khi từ chối (`Rejected`) hoặc yêu cầu sửa (`RevisionRequested`).
4. **Các chỉ mục đặc thù (Partial Unique Indexes):**
   - `uq_workflow_instances_entity_running`: Chặn double submit — một hồ sơ chỉ có tối đa 1 workflow ở trạng thái `Running`.
   - `uq_workflow_step_instances_instance_pending`: Chống race condition — một lượt duyệt chỉ có tối đa 1 bước ở trạng thái `Pending`.
   - `uq_workflow_definitions_entity_type_active`: Mỗi loại hồ sơ chỉ có tối đa 1 quy trình được kích hoạt (`is_active = true`).
   - `uq_users_username_lower` & `uq_users_email_lower`: Chặn trùng lặp username/email không phân biệt hoa thường.

---

## 🚀 2. Hướng dẫn chạy dự án sau khi Pull code

### Bước 1: Kéo mã nguồn mới nhất
```bash
git checkout develop
git pull origin develop
```

### Bước 2: Khởi động dịch vụ nền (PostgreSQL, RabbitMQ, pgAdmin)
```bash
# Trên Windows PowerShell:
.\scripts\run-infra.ps1
# Hoặc dùng lệnh trực tiếp (chỉ khởi chạy 3 dịch vụ hạ tầng, KHÔNG chạy container api):
docker compose up -d postgres rabbitmq pgadmin
```
*Đảm bảo Docker Desktop đang chạy. Lưu ý: Không chạy trực tiếp container `api` để tránh chiếm dụng cổng `5210` khi bạn chạy `dotnet run` ở Bước 5.*

### Bước 3: Cập nhật Migration vào Cơ sở dữ liệu
Ứng dụng đã được cấu hình hàm `app.ApplyQtkdMigrations()` trong `Program.cs`. Khi bạn khởi động API ở môi trường `Development`, migration sẽ **tự động được áp dụng** vào database nếu chưa có.

Nếu muốn cập nhật database thủ công từ dòng lệnh:
```bash
dotnet ef database update --project src/Api/Qtkd.Api.csproj
```

### Bước 4: Chạy kiểm thử tự động (Tests)
Để xác nhận mọi schema và logic đều hoạt động chính xác:
```bash
dotnet test
```
> **⚠️ Lưu ý nếu gặp lỗi khi build trên Windows:**  
> Nếu thư mục chứa project của bạn có ký tự tiếng Việt có dấu (ví dụ: `Đồ án`), trình biên dịch MSBuild có thể gặp lỗi phân giải đường dẫn giữa các tiến trình worker. Hãy thêm cờ `-m:1` (đơn tiến trình):
> ```bash
> dotnet test -m:1
> ```

### Bước 5: Khởi chạy Web API
```bash
dotnet run --project src/Api/Qtkd.Api.csproj
```
Sau khi chạy, mở trình duyệt truy cập:
- **Swagger Documentation:** [http://localhost:5210/swagger](http://localhost:5210/swagger)
- **Health Check:** [http://localhost:5210/health](http://localhost:5210/health) (kết quả `Healthy`)
- **System Status:** [http://localhost:5210/api/v1/system/status](http://localhost:5210/api/v1/system/status)

### Bước 6: Kiểm tra dữ liệu trên pgAdmin (Web UI)
1. **Truy cập:** Mở trình duyệt vào [http://localhost:5050](http://localhost:5050) (pgAdmin đã cấu hình tự động đăng nhập).
2. **Nếu gặp hộp thoại "Master Password":** Nhập `admin` rồi nhấn **OK** (hoặc bấm **Cancel** / **Reset Master Password** để bỏ qua).
3. **Thêm kết nối tới Server (chỉ cần làm 1 lần đầu):**
   - Click chuột phải vào **Servers** (cột trái) $\rightarrow$ **Register** $\rightarrow$ **Server...**
   - **Tab General:** Đặt Name bất kỳ (ví dụ: `QTKD Postgres`).
   - **Tab Connection:**
     - **Host name:** `postgres` *(Lưu ý: Bắt buộc dùng `postgres` vì pgAdmin và Database cùng chạy trong Docker network)*
     - **Port:** `5432`
     - **Maintenance database:** `qtkd_db`
     - **Username:** `postgres`
     - **Password:** `postgres`
     - Tích chọn **Save password?** rồi nhấn **Save**.
4. **Xem bảng và dữ liệu:** Vào `Servers` $\rightarrow$ `QTKD Postgres` $\rightarrow$ `Databases` $\rightarrow$ `qtkd_db` $\rightarrow$ `Schemas` $\rightarrow$ `public` $\rightarrow$ `Tables`. Bạn sẽ thấy đủ **18 bảng** tại schema `public`. *(Dữ liệu lưu an toàn vào Volume `qtkd_postgres_data`, không bị mất khi tắt máy/tắt Docker).*

---

## 💡 3. Lưu ý dành cho các bạn khi phát triển Module tiếp theo

1. **Tạo Entity mới:**
   - Kế thừa `AuditableEntity` nếu bảng cần theo dõi `created_at`, `created_by`, `updated_at`, `updated_by` và khóa chính UUIDv7.
   - Kế thừa `BaseEntity` nếu bảng chỉ cần `id`, `created_at`, `updated_at` và `row_version`.
2. **Cấu hình Entity (`IEntityTypeConfiguration<T>`):**
   - Đặt trong thư mục `Persistence/Configurations/` của từng module tương ứng.
   - Luôn đặt tên ràng buộc theo mẫu của TASK-12: `pk_...`, `fk_...`, `uq_...`, `ck_...`, `ix_...`.
3. **Migration:**
   - `QtkdDbContext` trong `src/Api/Persistence/QtkdDbContext.cs` là DbContext thống nhất của toàn bộ giải pháp cho giai đoạn hiện tại.
   - Khi sửa đổi entity thuộc 4 module Sprint 1, thêm migration bằng lệnh:
     ```bash
     dotnet ef migrations add <TenMigration> --project src/Api/Qtkd.Api.csproj
     dotnet ef database update --project src/Api/Qtkd.Api.csproj
     ```
