# HỆ THỐNG QUẢN TRỊ KINH DOANH (CÔNG TY ABC)
### Đồ án môn học: Phát Triển Ứng Dụng Hệ Thống Thông Tin Hiện Đại
**Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM | Khoa Công Nghệ Thông Tin**

---

## 📖 1. Giới thiệu Đề tài

Hệ thống được phát triển nhằm tin học hóa và tối ưu hóa toàn diện vòng đời hồ sơ kinh doanh cho **Công ty Cổ phần ABC** – một doanh nghiệp hoạt động trong lĩnh vực cung cấp dịch vụ logistics, khai thác cảng biển, vận tải hàng hóa, bốc xếp và lưu kho.

### 🎯 Mục tiêu cốt lõi:
- **Tập trung hóa dữ liệu**: Quản lý thống nhất thông tin khách hàng, hợp đồng dịch vụ, phụ lục hợp đồng, biểu giá linh hoạt theo thời gian, sản lượng thực tế và bảng thanh toán.
- **Workflow phê duyệt tự động & linh hoạt**: Hỗ trợ quy trình trình duyệt nhiều cấp (Kinh doanh -> Pháp chế -> Ban Giám đốc), loại bỏ hoàn toàn việc phê duyệt qua giấy tờ thủ công hoặc email rời rạc.
- **Tính toán chính xác & Chống thất thoát**: Tự động tính toán bảng thanh toán đối soát giữa sản lượng khai thác thực tế và biểu giá có hiệu lực, hỗ trợ snapshot đơn giá tại thời điểm phát sinh để đảm bảo toàn vẹn dữ liệu lịch sử.
- **Chữ ký điện tử (E-Signature) & Thông báo**: Tích hợp luồng ký điện tử sau phê duyệt và hệ thống thông báo đa kênh theo thời gian thực.
- **Bảo mật & Kiểm toán chặt chẽ**: Phân quyền RBAC theo ngữ cảnh công việc và ghi nhận nhật ký kiểm toán (Audit Trail) bất biến qua cơ chế snapshot.

---

## 👥 2. Thành viên Nhóm & Phân công Trách nhiệm

Dự án gồm **5 thành viên**, đảm nhiệm các module và vai trò chuyên trách như sau:

| STT | Thành viên | Vai trò chính | Module / Trách nhiệm chính |
| :---: | :--- | :--- | :--- |
| 1 | **Hảo** | Quản lý dự án, UI/UX & Frontend Lead | Quản lý tiến độ GitHub Projects/Issues, thiết kế Figma Style Guide/Prototype, xây dựng nền tảng giao diện React và các màn hình chính (Khách hàng, Hợp đồng, Phê duyệt, Bảng giá, Thanh toán). |
| 2 | **Huy** | Technical Architect & Workflow Specialist | Thiết kế và lập trình Workflow Engine data-driven, xử lý chống double-submit và race condition khi duyệt, tối ưu optimistic locking và review chéo kiến trúc. |
| 3 | **Hoàng** | Business Logic Lead (Hợp đồng & Nghiệp vụ) | Thiết kế và cài đặt module Khách hàng, Hợp đồng, Phụ lục hợp đồng; Contract State Machine (CTR-01..07); kiểm thử tích hợp và E2E. |
| 4 | **Hiệu** | Database & Financial Calculation Specialist | Thiết kế ERD chuẩn, quy ước CSDL, migration PostgreSQL; lập trình module Bảng giá (versioning, daterange), Sản lượng khai thác và Bộ tính bảng thanh toán (Payment Calculator). |
| 5 | **Dũng** | DevOps, Platform & Infrastructure Lead | Khởi tạo repo GitHub, thiết lập hạ tầng Docker Compose (PostgreSQL, RabbitMQ), dựng khung Solution .NET Modular Monolith, GitHub Actions CI/CD pipeline, module Identity (JWT/RBAC), Outbox Pattern, Notification, Audit Log và E-Sign Service mô phỏng. |

---

## 🏛️ 3. Kiến trúc Hệ thống & Ngăn xếp Công nghệ (Tech Stack)

### 3.1. Kiến trúc phần mềm: **Modular Monolith**
Hệ thống được tổ chức theo mô hình **Modular Monolith** kết hợp nguyên lý **Domain-Driven Design (DDD)** và **Clean Architecture** bên trong từng module:
- Mỗi module nghiệp vụ sở hữu DbContext, domain model, repository và logic độc lập.
- Giảm thiểu phụ thuộc trực tiếp giữa các module: giao tiếp qua **In-memory Contracts/Interfaces** hoặc thông qua **Domain/Integration Events** bất đồng bộ qua RabbitMQ với **Outbox Pattern** để đảm bảo tính nhất quán (Eventual Consistency).

### 3.2. Công nghệ sử dụng:
- **Backend**: C# 12 / .NET Core 8 / 9 Web API
- **Database**: PostgreSQL 16 (hỗ trợ kiểu `numeric(18,2)`, `timestamptz`, `daterange` với `EXCLUDE USING gist`)
- **Event Bus / Message Broker**: RabbitMQ
- **Object Storage / Attachments**: Local Volume / MinIO
- **Frontend**: React 18 / 19 + TypeScript + Vite + Tailwind CSS / Vanilla CSS
- **Containerization & CI**: Docker, Docker Compose, GitHub Actions CI/CD
- **Testing**: xUnit, FluentAssertions, Moq, Testcontainers
- **Tài liệu & Thiết kế**: Swagger/OpenAPI, PlantUML, Draw.io, Figma

---

## 📁 4. Cấu trúc Dự án (Dự kiến)

```text
QTKD_Project/
├── .github/                             # GitHub config & workflows
│   ├── ISSUE_TEMPLATE/                  # Template Issue cho Feature/Bug
│   ├── workflows/ci.yml                 # Pipeline GitHub Actions CI tự động build & test
│   └── pull_request_template.md         # Template PR có checklist DoD
├── docs/                                # Tài liệu kỹ thuật dự án
│   ├── design/                          # Quyết định kiến trúc (concurrency, addendum, payment)
│   ├── uml/                             # Sơ đồ Use case, Class, Sequence diagrams
│   ├── db-conventions.md                # Quy ước thiết kế CSDL
│   └── sprint1-db-migration-guide.md    # Hướng dẫn CSDL & Migration Sprint 1 (TASK-13)
├── src/                                 # Mã nguồn chính
│   ├── Api/                             # Web API Host (chứa Entrypoint, Swagger, Middleware)
│   ├── BuildingBlocks/                  # Thư viện dùng chung (Outbox, MediatR, EventBus, Common)
│   ├── Modules/                         # Các module nghiệp vụ độc lập
│   │   ├── Identity/                    # Xác thực JWT, User, Role, Phân quyền RBAC
│   │   ├── Customers/                   # Quản lý khách hàng
│   │   ├── Contracts/                   # Hợp đồng & Phụ lục, State machine
│   │   ├── Pricing/                     # Biểu giá, Versioning, GiST constraint
│   │   ├── Production/                  # Ghi nhận sản lượng theo kỳ, khóa kỳ
│   │   ├── Payments/                    # Bảng thanh toán, snapshot đơn giá
│   │   ├── Workflow/                    # Engine phê duyệt data-driven, Inbox, Timeline
│   │   ├── ESign/                       # Dịch vụ mô phỏng ký số, Webhook HMAC
│   │   ├── Notification/                # Thông báo người dùng, SignalR
│   │   └── Audit/                       # Audit interceptor ghi snapshot JSON
│   └── Web/                             # Giao diện Frontend (React + Vite + TypeScript)
├── tests/                               # Kiểm thử tự động
│   ├── UnitTests/                       # Kiểm thử đơn vị các domain rule & calculator
│   └── IntegrationTests/                # Kiểm thử tích hợp với Testcontainers
├── docker-compose.yml                   # Khởi chạy PostgreSQL, RabbitMQ, pgAdmin
├── CONTRIBUTING.md                      # Quy ước nhánh, commit & quy trình review
├── README.md                            # Giới thiệu tổng quan & hướng dẫn
└── .gitignore                           # Cấu hình bỏ qua file rác / build output
```

---

## 🚀 5. Hướng Dẫn Chạy Cục Bộ Dành Cho Cả 5 Thành Viên (Local Quickstart)

Tất cả 5 thành viên nhóm (**Hảo, Huy, Hoàng, Hiệu, Dũng**) cần thực hiện các bước sau để thiết lập môi trường và chạy dự án trên máy cá nhân:

### 5.1. Yêu cầu tiên quyết:
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download).
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã được cài đặt và đang chạy.
- [Git](https://git-scm.com/).

### 5.2. Bước 1: Khởi chạy hạ tầng qua Docker Compose (PostgreSQL, RabbitMQ, pgAdmin)
Tại thư mục gốc dự án `QTKD_Project`, chạy một trong các lệnh sau:

- **Trên Windows PowerShell**:
  ```powershell
  # Cách 1: Sử dụng script tự động
  .\scripts\run-infra.ps1

  # Cách 2: Dùng lệnh docker compose trực tiếp
  docker compose up -d postgres rabbitmq pgadmin
  # (hoặc docker-compose up -d postgres rabbitmq pgadmin)
  ```
- **Trên macOS / Linux**:
  ```bash
  chmod +x ./scripts/*.sh
  ./scripts/run-infra.sh
  ```

#### 📌 Thông tin truy cập các dịch vụ hạ tầng:
| Dịch vụ | Địa chỉ truy cập | Thông tin đăng nhập | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 16** | `localhost:5432` | User: `postgres`<br>Pass: `postgres`<br>Database: `qtkd_db` | Cơ sở dữ liệu chính, tự động khởi tạo 10 schemas cho các module |
| **pgAdmin 4 (Web UI)** | [http://localhost:5050](http://localhost:5050) | Email: `admin@qtkd.com`<br>Pass: `admin` | Giao diện đồ họa xem bảng, truy vấn SQL, kiểm tra dữ liệu |
| **RabbitMQ Management** | [http://localhost:15672](http://localhost:15672) | User: `guest`<br>Pass: `guest` | Bảng điều khiển giám sát Message Queues & Event Bus |
| **RabbitMQ AMQP** | `localhost:5672` | User: `guest`<br>Pass: `guest` | Cổng kết nối trao đổi sự kiện bất đồng bộ |

> **Khi muốn dừng toàn bộ hạ tầng**: Chạy `.\scripts\stop-infra.ps1` (hoặc `docker compose down`).

---

### 5.3. Bước 2: Chạy kiểm thử tự động (Unit Tests & Integration Tests)
Kiểm tra tính toàn vẹn của mã nguồn trên máy bạn bằng lệnh:
```bash
dotnet test QtkdSolution.sln
```
*Kết quả kỳ vọng:* Toàn bộ các bộ kiểm thử `Qtkd.UnitTests` và `Qtkd.IntegrationTests` đều vượt qua 100% (**Passed**).

---

### 5.4. Bước 3: Khởi chạy Backend Web API (.NET Modular Monolith)
Khởi chạy máy chủ API:
```bash
dotnet run --project src/Api/Qtkd.Api.csproj --launch-profile http
```

Mở trình duyệt truy cập:
- **Swagger UI (Danh mục API đầy đủ 10 Module)**: [http://localhost:5210/swagger](http://localhost:5210/swagger) (hoặc [http://localhost:5210/](http://localhost:5210/))
- **Health Check Endpoint**: [http://localhost:5210/health](http://localhost:5210/health) (Trả về `Healthy`)
- **System Status Endpoint**: [http://localhost:5210/api/v1/system/status](http://localhost:5210/api/v1/system/status)

### Chạy Frontend React

Với Node.js 20.19+ hoặc 22.12+, chạy giao diện trong terminal riêng:
```powershell
cd src\Web
npm install
npm run dev
```
Mở [http://localhost:5173](http://localhost:5173). Chi tiết cấu hình và build tại [src/Web/README.md](./src/Web/README.md).

---

### 5.5. Quy trình làm việc với Git (Dành cho thành viên nhóm)
1. Cập nhật nhánh `develop` mới nhất:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Tạo nhánh tính năng mới theo quy ước:
   ```bash
   git checkout -b feature/<tên-module>-<mô-tả-ngắn>
   ```
   *Ví dụ:* `feature/contract-state-machine`, `feature/pricing-exclude-constraint`.
3. Commit tuân thủ chuẩn **Conventional Commits**:
   ```bash
   git commit -m "feat(<module>): <mô tả ngắn> [Mã task]"
   ```
4. Đẩy nhánh lên GitHub và tạo **Pull Request** vào nhánh `develop`:
   ```bash
   git push -u origin feature/<tên-module>-<mô-tả-ngắn>
   ```
5. Đọc chi tiết quy ước tại [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 📜 6. Giấy phép & Thông tin Đồ án
- Đồ án phục vụ mục đích học tập môn **Phát Triển Ứng Dụng Hệ Thống Thông Tin Hiện Đại** - Khoa CNTT, Trường ĐH KHTN TP.HCM.
- GitHub Repository: [Duong-Dung / QTKD_PRJ](https://github.com/Duong-Dung/QTKD_PRJ)
