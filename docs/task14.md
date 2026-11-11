# BÁO CÁO THỰC HIỆN TASK-14: SEED DỮ LIỆU MẪU
> **Hệ thống Quản trị Kinh doanh (QTKD ABC Logistics)**  
> **Sprint 01** · **PBI: PB-03** · **Người thực hiện: Hiệu** · **Story Points: 3**  
> Dựa trên TASK-10 v2 (Phân tích thực thể), TASK-12 (Quy ước đặt tên) và TASK-13 (DbContext & Migration).

---

## 🎯 1. Mục tiêu & Ý nghĩa của Task 14

Sau khi hoàn thành **TASK-13** (tạo DbContext và migration `InitialCreate` cho 18 bảng trên PostgreSQL), cơ sở dữ liệu ở trạng thái hoàn toàn rỗng. **TASK-14** thực hiện khởi tạo (seed) bộ dữ liệu mẫu ban đầu để:
1. **Phục vụ Dũng (DevOps/Identity):** Có sẵn danh mục phòng ban, vai trò, quyền hạn và tài khoản để phát triển API đăng nhập JWT, phân quyền RBAC (**TASK-18, TASK-28, TASK-29**).
2. **Phục vụ Huy (Workflow Architect):** Có sẵn người dùng thuộc các phòng ban khác nhau (Kinh doanh, Pháp chế, Ban Giám đốc) để kiểm thử luồng phê duyệt hồ sơ nhiều cấp và kiểm tra chặn quyền theo ngữ cảnh.
3. **Phục vụ Hoàng (Hợp đồng) & Hảo (Frontend):** Có sẵn tài khoản đăng nhập để thao tác tạo hợp đồng, submit duyệt và hiển thị giao diện UI/UX ngay lập tức.

---

## 🔑 2. Cấu trúc & Ý nghĩa dãy Deterministic UUIDv7

### 2.1. Tại sao không dùng `Guid.NewGuid()` ngẫu nhiên?
- Khi seed dữ liệu nền (Master Data), nếu dùng `Guid.NewGuid()`, mỗi lần chạy lại seeder hoặc xóa database dựng lại thì ID sẽ sinh ra một chuỗi ngẫu nhiên hoàn toàn khác nhau.
- Các thành viên khác trong nhóm (Dũng làm Auth, Huy làm Workflow, Hoàng làm Hợp đồng) khi viết code gọi API hoặc viết Integration Test sẽ **không thể hardcode ID** để kiểm thử. Khóa ngoại liên kết giữa các bảng (`User` ➔ `Department`, `User` ➔ `Role`) cũng sẽ rất dễ bị lệch.
- Do đó, trong kỹ thuật phần mềm, dữ liệu seed luôn sử dụng **Deterministic GUID (GUID xác định trước có quy luật)**.

### 2.2. Quy tắc cấu tạo dãy UUIDv7 của Task 14
Theo quy chuẩn **UUIDv7 (RFC 9562)**, một chuỗi GUID gồm 32 ký tự hex chia làm 5 nhóm:  
`8 ký tự - 4 ký tự - 4 ký tự - 4 ký tự - 12 ký tự`

Dãy ID trong `QtkdDataSeeder` được thiết kế theo mẫu:  
`019318a0 - [Phân loại] - 7000 - 8000 - [Số định danh trực quan]`

| Khối GUID | Mẫu giá trị | Ý nghĩa kỹ thuật |
| :--- | :---: | :--- |
| **Nhóm 1 (8 ký tự)** | `019318a0` | Phần Unix Epoch Timestamp đại diện, giữ đúng cấu trúc header chuẩn của UUIDv7. |
| **Nhóm 2 (4 ký tự)** | `XXXX` | **Mã phân loại đối tượng nghiệp vụ**: <br>• `0001` - `0006`: Nhóm Phòng ban (Department)<br>• `0010` - `0040`: Nhóm Vai trò (Role)<br>• `0100` - `0700`: Nhóm Người dùng (User)<br>• `0800` - `0801`: Nhóm Khách hàng (Customer)<br>• `0900` - `0902`: Nhóm Workflow |
| **Nhóm 3 (4 ký tự)** | `7000` | Bắt đầu bằng số **`7`** — đây là bit phiên bản bắt buộc của chuẩn quốc tế RFC 9562 để xác định đây là **UUID Version 7**. |
| **Nhóm 4 (4 ký tự)** | `8000` | Bắt đầu bằng số **`8`** — xác định Variant chuẩn của UUID (RFC 4122/9562). |
| **Nhóm 5 (12 ký tự)** | `YYYYYYYYYYYY` | **Số định danh trực quan**: nhìn vào đuôi là nhận diện được ngay đối tượng nào. |

### 2.3. Bảng tra cứu ID trực quan
- **Phòng ban (`000X`):**
  - Ban Giám đốc (`BGD`): `019318a0-0001-7000-8000-000000000001` (đuôi `...0001`)
  - Phòng Kinh doanh (`KD`): `019318a0-0002-7000-8000-000000000002` (đuôi `...0002`)
  - Phòng Pháp chế (`PC`): `019318a0-0003-7000-8000-000000000003` (đuôi `...0003`)
  - Phòng Khai thác (`KT`): `019318a0-0004-7000-8000-000000000004` (đuôi `...0004`)
  - Phòng Kế toán (`TCKT`): `019318a0-0005-7000-8000-000000000005` (đuôi `...0005`)
  - Phòng Quản trị (`QT`): `019318a0-0006-7000-8000-000000000006` (đuôi `...0006`)
- **Vai trò (`00X0`):**
  - Vai trò `ADMIN`: `019318a0-0010-7000-8000-000000000010` (đuôi `...0010`)
  - Vai trò `DIRECTOR`: `019318a0-0020-7000-8000-000000000020` (đuôi `...0020`)
  - Vai trò `MANAGER`: `019318a0-0030-7000-8000-000000000030` (đuôi `...0030`)
  - Vai trò `STAFF`: `019318a0-0040-7000-8000-000000000040` (đuôi `...0040`)
- **Người dùng (`0X00`):**
  - User `admin`: `019318a0-0100-7000-8000-000000000100` (đuôi `...0100`)
  - User `giamdoc`: `019318a0-0200-7000-8000-000000000200` (đuôi `...0200`)
  - User `tp_kinhdoanh`: `019318a0-0300-7000-8000-000000000300` (đuôi `...0300`)
  - User `nv_kinhdoanh`: `019318a0-0400-7000-8000-000000000400` (đuôi `...0400`)
  - User `tp_phapche`: `019318a0-0500-7000-8000-000000000500` (đuôi `...0500`)
  - User `tp_ketoan`: `019318a0-0600-7000-8000-000000000600` (đuôi `...0600`)
  - User `nv_khaithac`: `019318a0-0700-7000-8000-000000000700` (đuôi `...0700`)

---

## 🗄️ 3. Chi tiết các nhóm dữ liệu đã Seed

### 3.1. 6 Phòng ban (`departments`)
| Code | Tên phòng ban | ID cố định | Mục đích sử dụng |
| :---: | :--- | :--- | :--- |
| `BGD` | Ban Giám đốc | `019318a0-0001-7000-8000-000000000001` | Phê duyệt cấp cao nhất, ký hợp đồng |
| `KD` | Phòng Kinh doanh | `019318a0-0002-7000-8000-000000000002` | Quản lý khách hàng, tạo hợp đồng nháp, gửi duyệt |
| `PC` | Phòng Pháp chế | `019318a0-0003-7000-8000-000000000003` | Rà soát điều khoản pháp lý của hợp đồng ở bước 1 |
| `KT` | Phòng Khai thác | `019318a0-0004-7000-8000-000000000004` | Quản lý sản lượng dịch vụ cảng/kho bãi |
| `TCKT`| Phòng Tài chính Kế toán | `019318a0-0005-7000-8000-000000000005` | Quản lý bảng giá, đối soát bảng thanh toán |
| `QT` | Phòng Quản trị hệ thống | `019318a0-0006-7000-8000-000000000006` | Quản trị tài khoản, phân quyền, cấu hình hệ thống |

---

### 3.2. 4 Vai trò chức năng (`roles`)
| Code | Tên vai trò | ID cố định | Mô tả quyền hạn |
| :---: | :--- | :--- | :--- |
| `ADMIN` | Quản trị viên hệ thống | `019318a0-0010-7000-8000-000000000010` | Toàn quyền quản trị hệ thống, tài khoản, cấu hình workflow |
| `DIRECTOR` | Giám đốc | `019318a0-0020-7000-8000-000000000020` | Phê duyệt hợp đồng bước cuối, hủy hợp đồng, xem báo cáo |
| `MANAGER` | Trưởng phòng / Quản lý | `019318a0-0030-7000-8000-000000000030` | Quản lý phòng ban, rà soát nghiệp vụ, duyệt bước trung gian |
| `STAFF` | Chuyên viên / Nhân viên | `019318a0-0040-7000-8000-000000000040` | Soạn thảo hợp đồng, gửi duyệt, quản lý khách hàng |

---

### 3.3. Danh mục 21 Quyền hạn (`permissions`) & Bảng nối (`role_permissions`)
Quy ước mã quyền: `resource.action` (chữ thường, ngăn cách bởi dấu chấm).

- **Hợp đồng (Contracts):** `contract.create`, `contract.read`, `contract.update`, `contract.submit`, `contract.approve`, `contract.reject`, `contract.cancel`.
- **Khách hàng (Customers):** `customer.create`, `customer.read`, `customer.update`, `customer.manage`.
- **Workflow:** `workflow.read`, `workflow.approve`, `workflow.reject`, `workflow.configure`.
- **Định danh & Kiểm toán:** `user.manage`, `role.manage`, `audit.read`.
- **Bảng giá & Thanh toán:** `pricing.manage`, `payment.manage`.

**Ma trận gán quyền cho vai trò:**
- `ADMIN`: Sở hữu toàn bộ 21 quyền.
- `DIRECTOR`: Các quyền phê duyệt, xem báo cáo, kiểm toán (`contract.read`, `contract.approve`, `contract.reject`, `contract.cancel`, `customer.read`, `workflow.read`, `workflow.approve`, `workflow.reject`, `audit.read`, `pricing.manage`, `payment.manage`).
- `MANAGER`: Soạn thảo, gửi duyệt và phê duyệt bước nghiệp vụ chuyên môn (`contract.create`, `contract.read`, `contract.update`, `contract.submit`, `contract.approve`, `contract.reject`, `customer.create`, `customer.read`, `customer.update`, `workflow.read`, `workflow.approve`, `workflow.reject`, `pricing.manage`, `payment.manage`).
- `STAFF`: Soạn thảo, submit và xem dữ liệu (`contract.create`, `contract.read`, `contract.update`, `contract.submit`, `customer.create`, `customer.read`, `customer.update`, `workflow.read`).

---

### 3.4. Danh sách 7 Người dùng mẫu (`users` & `user_roles`)
*Tất cả tài khoản đều có mật khẩu mặc định là `P@ssword123!`, được băm bảo mật bằng `Microsoft.AspNetCore.Identity.PasswordHasher<User>` (PBKDF2).*

| Username | Họ và tên | Email | Phòng ban | Vai trò | ID người dùng |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `admin` | Nguyễn Quản Trị | `admin@qtkd.com` | `QT` | `ADMIN` | `019318a0-0100-7000-8000-000000000100` |
| `giamdoc` | Trần Giám Đốc | `director@qtkd.com` | `BGD` | `DIRECTOR` | `019318a0-0200-7000-8000-000000000200` |
| `tp_kinhdoanh` | Lê Trưởng Kinh Doanh | `manager.kd@qtkd.com` | `KD` | `MANAGER` | `019318a0-0300-7000-8000-000000000300` |
| `nv_kinhdoanh` | Phạm Nhân Viên KD | `staff.kd@qtkd.com` | `KD` | `STAFF` | `019318a0-0400-7000-8000-000000000400` |
| `tp_phapche` | Hoàng Pháp Chế | `manager.pc@qtkd.com` | `PC` | `MANAGER` | `019318a0-0500-7000-8000-000000000500` |
| `tp_ketoan` | Đỗ Kế Toán Trưởng | `manager.tc@qtkd.com` | `TCKT` | `MANAGER` | `019318a0-0600-7000-8000-000000000600` |
| `nv_khaithac` | Vũ Khai Thác | `staff.kt@qtkd.com` | `KT` | `STAFF` | `019318a0-0700-7000-8000-000000000700` |

---

### 3.5. Dữ liệu bổ trợ phục vụ Test nghiệp vụ
1. **2 Khách hàng mẫu (`customers`):**
   - `CUST-0001`: Công ty Cổ phần Vận tải Biển Đông (MST: `0101234567`, Trạng thái: `Active`).
   - `CUST-0002`: Công ty TNHH Logistics Nam Á (MST: `0309876543-001`, Trạng thái: `Active`).
2. **1 Quy trình duyệt mẫu (`workflow_definitions` & `workflow_step_definitions`):**
   - Mã: `CONTRACT_APPROVAL` (Version 1, `is_active = true`, Áp dụng cho: `Contract`).
   - Bước 1: **Phòng Pháp chế rà soát hồ sơ & pháp lý** (Gán cho `RoleManager` thuộc `DeptPhapChe`, từ chối trả về `RevisionRequested`).
   - Bước 2: **Ban Giám đốc phê duyệt hợp đồng** (Gán cho `RoleDirector` thuộc `DeptBanGiamDoc`, từ chối trả về `Rejected`).

---

## 🏗️ 4. Kiến trúc Triển khai Kỹ thuật

1. **Lớp Seeder: `src/Api/Persistence/QtkdDataSeeder.cs`**
   - Thiết kế theo nguyên lý **Idempotent**: Luôn kiểm tra sự tồn tại của dữ liệu trước khi thêm mới (`AnyAsync` hoặc so sánh mã). Chạy lại nhiều lần không sinh lỗi trùng khóa (`duplicate key`), không nhân đôi bản ghi.
2. **Phương thức mở rộng: `src/Api/Extensions/PersistenceExtensions.cs`**
   - Thêm phương thức `SeedQtkdDataAsync(this WebApplication app)`.
   - Kiểm tra cờ cấu hình `Database:SeedOnStartup` (mặc định kích hoạt ở môi trường `Development`).
3. **Pipeline khởi động: `src/Api/Program.cs`**
   ```csharp
   app.ApplyQtkdMigrations();
   await app.SeedQtkdDataAsync();
   ```

---

## 🧪 5. Hướng dẫn Kiểm thử & Các Trường hợp Test (Test Cases)

Để kiểm tra bộ dữ liệu seed hoạt động chuẩn xác, có thể áp dụng 3 phương pháp kiểm thử sau:

### 5.1. Phương pháp 1: Chạy kiểm thử tự động (Integration Test)
Chạy bộ test tích hợp chuyên biệt cho Seeder:
```bash
dotnet test tests/IntegrationTests/Qtkd.IntegrationTests.csproj --filter "DataSeederTests"
```
*(Nếu đường dẫn thư mục có dấu tiếng Việt, thêm cờ `-m:1`)*

**Các trường hợp kiểm thử tự động trong `DataSeederTests.cs`:**
- **TC-01 (Phòng ban):** Kiểm tra có đúng 6 phòng ban với mã `BGD`, `KD`, `PC`, `KT`, `TCKT`, `QT`.
- **TC-02 (Vai trò):** Kiểm tra có đủ 4 vai trò `ADMIN`, `DIRECTOR`, `MANAGER`, `STAFF`.
- **TC-03 (Quyền hạn):** Kiểm tra danh mục có đủ 21 permissions nghiệp vụ và ma trận gán quyền `RolePermissions`.
- **TC-04 (Người dùng):** Kiểm tra đủ 7 tài khoản mẫu liên kết đúng phòng ban và vai trò.
- **TC-05 (Bảo mật mật khẩu):** Dùng `hasher.VerifyHashedPassword` xác minh chuỗi mật khẩu `P@ssword123!` khớp với hash của `admin`.
- **TC-06 (Tính Idempotent):** Gọi `SeedAsync` liên tiếp 2 lần, xác nhận số lượng bản ghi không tăng gấp đôi và không ném ngoại lệ trùng khóa.
- **TC-07 (Khách hàng & Workflow):** Kiểm tra 2 khách hàng mẫu và quy trình duyệt `CONTRACT_APPROVAL` gồm đúng 2 bước.

*Kết quả thực tế:* **15/15 Integration Tests PASSED (100%)**.

---

### 5.2. Phương pháp 2: Kiểm tra trực tiếp trong PostgreSQL (SQL / pgAdmin)
Truy cập qua pgAdmin (`http://localhost:5050`) hoặc chạy câu lệnh `psql`:

1. **Kiểm tra 6 Phòng ban:**
   ```sql
   SELECT code, name, is_active FROM public.departments ORDER BY code;
   ```
2. **Kiểm tra 4 Vai trò:**
   ```sql
   SELECT code, name FROM public.roles ORDER BY code;
   ```
3. **Kiểm tra 7 Tài khoản người dùng kèm phòng ban và vai trò:**
   ```sql
   SELECT 
       u.username, 
       u.full_name, 
       u.email, 
       d.name AS department, 
       r.code AS role
   FROM public.users u
   JOIN public.departments d ON u.department_id = d.id
   JOIN public.user_roles ur ON u.id = ur.user_id
   JOIN public.roles r ON ur.role_id = r.id
   ORDER BY u.username;
   ```
4. **Kiểm tra Khách hàng mẫu:**
   ```sql
   SELECT code, name, tax_code, status FROM public.customers;
   ```
5. **Kiểm tra Quy trình duyệt mẫu và các bước:**
   ```sql
   SELECT 
       w.code AS workflow_code, 
       w.name AS workflow_name, 
       s.step_order, 
       s.name AS step_name,
       s.assignee_type,
       s.on_reject
   FROM public.workflow_definitions w
   JOIN public.workflow_step_definitions s ON w.id = s.definition_id
   ORDER BY s.step_order;
   ```

---

### 5.3. Phương pháp 3: Kiểm tra qua Web API & Swagger UI
1. Khởi động Web API:
   ```bash
   dotnet run --project src/Api/Qtkd.Api.csproj
   ```
2. Mở trình duyệt vào Swagger: [http://localhost:5210/swagger](http://localhost:5210/swagger).
3. Kiểm tra endpoint hệ thống: [http://localhost:5210/api/v1/system/status](http://localhost:5210/api/v1/system/status).
4. Khi Dũng hoàn thành API đăng nhập ở TASK-18, có thể dùng ngay các cặp tài khoản trên với mật khẩu `P@ssword123!` để nhận token JWT và phân quyền.
