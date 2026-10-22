# QUY ƯỚC LÀM VIỆC & PHÁT TRIỂN DỰ ÁN (TEAM CONVENTIONS)

Tài liệu này quy định toàn bộ tiêu chuẩn làm việc, quy ước Git, nhánh (branching strategy), commit message và quy trình review cho nhóm phát triển dự án **Hệ thống Quản trị Kinh doanh (Công ty ABC)**.

---

## 1. Phân chia Module & Scope

Hệ thống được thiết kế theo kiến trúc **Modular Monolith (.NET Core)**. Các module chuẩn và phạm vi công việc gồm:

| Module / Scope | Mô tả chức năng | Người phụ trách chính |
| :--- | :--- | :--- |
| `identity` | Quản trị tài khoản, phân quyền RBAC theo permission, JWT auth | Dũng |
| `customer` | Quản lý khách hàng, MST, đại diện, liên hệ | Hoàng |
| `contract` | Quản lý vòng đời hợp đồng dịch vụ, state machine, tải tệp | Hoàng |
| `addendum` | Quản lý phụ lục hợp đồng, điều chỉnh đơn giá, thời hạn | Hoàng |
| `pricing` | Quản lý bảng giá, versioning, chống chồng hiệu lực (PRC-03) | Hiệu |
| `production` | Ghi nhận sản lượng thực tế (container, tấn, ngày kho), khóa kỳ | Hiệu |
| `payment` | Tính bảng thanh toán, snapshot giá, hồ sơ điều chỉnh | Hiệu |
| `workflow` | Workflow engine cấu hình data-driven, lock chống race condition | Huy |
| `esign` | Mock E-Sign service, webhook ký số bất đồng bộ, HMAC | Dũng |
| `notification` | Nhận event bất đồng bộ, đẩy thông báo qua WebSocket/SignalR | Dũng |
| `audit` | EF Interceptor ghi log lịch sử thay đổi snapshot JSON | Dũng |
| `infra` | Docker Compose, RabbitMQ, CI/CD pipeline, health check | Dũng |
| `ui` / `frontend` | Giao diện React + Vite + TypeScript, component dùng chung | Hảo / Dũng |
| `docs` | Tài liệu phân tích, kiến trúc UML, ERD, hướng dẫn sử dụng | Hảo / Toàn nhóm |

---

## 2. Quy ước Nhánh (Git Branching Strategy)

Dự án sử dụng mô hình Git Flow rút gọn với 2 nhánh chính được bảo vệ (**Protected Branches**):

1. **`main`**:
   - Nhánh sản phẩm / release ổn định.
   - **BẮT BUỘC BẬT CHẾ ĐỘ BẢO VỆ (Protected)**: Tuyệt đối không push trực tiếp.
   - Chỉ được cập nhật thông qua Merge Request từ `develop` khi release phiên bản (ví dụ v1.0).

2. **`develop`**:
   - Nhánh tích hợp chính của nhóm.
   - **BẮT BUỘC BẬT CHẾ ĐỘ BẢO VỆ (Protected)**: Không cho phép push trực tiếp.
   - Tất cả các tính năng hoàn thành đều phải mở Merge Request vào nhánh này.

### Cấu trúc đặt tên nhánh tính năng / sửa lỗi:

- **Tính năng mới**:
  ```bash
  feature/<module>-<mô-tả-ngắn-gọn>
  ```
  *Ví dụ:*
  - `feature/identity-jwt-auth`
  - `feature/contract-state-machine`
  - `feature/pricing-exclude-constraint`
  - `feature/workflow-idempotency`
  - `feature/payment-calculator`
  - `feature/infra-docker-compose`
  - `feature/ui-contract-list`

- **Sửa lỗi**:
  ```bash
  bugfix/<module>-<mô-tả-lỗi>
  ```
  *Ví dụ:*
  - `bugfix/pricing-overlap-daterange`
  - `bugfix/workflow-duplicate-approve`

- **Sửa lỗi khẩn cấp (Hotfix)**:
  ```bash
  hotfix/<mô-tả-ngắn-gọn>
  ```

---

## 3. Quy ước Commit (Conventional Commits)

Toàn bộ thành viên **bắt buộc tuân thủ chuẩn Conventional Commits**.

### Cấu trúc commit:
```text
<type>(<scope>): <mô tả ngắn bằng tiếng Việt hoặc tiếng Anh> [Mã task nếu có]

[Phần thân - Mô tả chi tiết lý do và thay đổi (không bắt buộc)]

[Footer - Closes #issue (nếu có)]
```

### Các Loại (Types):
- `feat`: Thêm tính năng mới (chức năng nghiệp vụ, API mới, UI component mới).
- `fix`: Sửa lỗi phát sinh (bugfix).
- `docs`: Cập nhật tài liệu kỹ thuật, markdown, sơ đồ UML, README.
- `refactor`: Tái cấu trúc code (không đổi hành vi bên ngoài và không sửa bug).
- `test`: Thêm mới hoặc chỉnh sửa unit test, integration test.
- `chore`: Cập nhật cấu hình build, package dependencies, gitignore, tác vụ phụ trợ.
- `ci`: Cập nhật cấu hình CI/CD (`.gitlab-ci.yml`, Dockerfile).
- `perf`: Tối ưu hiệu năng, đánh index CSDL, truy vấn SQL.

### Ví dụ chuẩn:
```bash
git commit -m "feat(identity): add JWT authentication and login endpoint [T028]"
git commit -m "feat(contract): implement state machine validation CTR-01 to CTR-05 [T039]"
git commit -m "fix(pricing): prevent overlapping validity date range with gist index [T041]"
git commit -m "docs(workflow): write ADR for concurrency double submit and race conditions [T005]"
git commit -m "test(payment): add unit tests for tariff change mid-period [T072]"
git commit -m "chore(infra): add docker-compose with postgres, rabbitmq and pgadmin [T015]"
```

---

## 4. Quy trình Mở & Duyệt Merge Request (MR Workflow)

1. **Chuẩn bị trước khi mở MR**:
   - Chạy `git checkout develop && git pull origin develop`
   - Rebase hoặc merge nhánh `develop` mới nhất vào nhánh của mình: `git merge develop`
   - Chạy test local: Đảm bảo code build thành công và tất cả unit test đều xanh.
2. **Mở Merge Request trên GitLab**:
   - **Target branch**: Luôn là `develop` (không chọn `main`).
   - Chọn template: **Default** (đã được cấu hình tự động).
   - Điền đầy đủ mô tả, liên kết issue (`Closes #ID`).
   - Tích chọn đầy đủ checklist trong Definition of Done.
3. **Review chéo (Peer Review)**:
   - Gán ít nhất 1 thành viên khác trong nhóm làm **Reviewer** (hoặc gán Huy/Dũng/Hảo).
   - Reviewer phải kiểm tra diff code, kiểm tra logic nghiệp vụ và các rule (CTR, PRC, PAY, APR).
   - Nếu có nhận xét, tác giả sửa trên nhánh feature và push lên, MR sẽ tự cập nhật.
4. **Merge vào `develop`**:
   - Khi được chấp thuận (Approved) và pipeline CI báo xanh (sau khi T015 hoàn tất).
   - Chọn tùy chọn **Delete source branch** sau khi merge để giữ repo sạch sẽ.

---

## 5. Tiêu chuẩn Mã nguồn & Chất lượng (Code Standards)

- **C# / .NET**:
  - Tuân theo chuẩn Microsoft C# Coding Conventions.
  - Sử dụng async/await đúng chuẩn, không dùng `.Result` hay `.Wait()`.
  - Bắt buộc kiểm tra validation đầu vào bằng FluentValidation.
  - Xử lý lỗi tập trung qua Global Exception Handler trả về ProblemDetails (RFC 7807).
  - Không truy vấn DB ngoài DbContext của module được giao. Tương tác liên module qua Integration Event (Outbox / RabbitMQ) hoặc MediatR/In-memory Interface.
- **Database (PostgreSQL)**:
  - Tên bảng và tên cột dùng `snake_case` (theo quy ước của Hiệu trong `docs/db-conventions.md`).
  - Tiền tệ dùng `numeric(18,2)`, ngày giờ dùng `timestamptz` (UTC).
  - Không chỉnh sửa database thủ công; mọi thay đổi phải qua EF Core Migration.
- **Frontend (React + Vite + TypeScript)**:
  - Viết component rõ ràng, khai báo kiểu dữ liệu TypeScript chặt chẽ (không lạm dụng `any`).
  - Phân tách rõ ràng giữa UI Presentation và API Client / Hooks.
