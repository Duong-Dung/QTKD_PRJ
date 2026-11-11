# 📘 Tài Liệu API Identity & Xác Thực (Dành Cho Frontend Dev / Prompt UI)

> **Dự án**: QTKD ABC Logistics (Modular Monolith)  
> **Module**: Identity & Access Management (TASK-18, TASK-19)  
> **Người thực hiện Backend**: Dũng  
> **Mục đích**: Cung cấp tài liệu đặc tả API chuẩn, TypeScript types và Prompt mẫu để Hảo (Frontend) xây dựng giao diện Đăng nhập, Quản lý phiên, Phân quyền giao diện (RBAC) và Profile người dùng.

---

## 1. Thông Tin Chung

- **Base URL (Local)**: `http://localhost:5210`
- **Swagger UI**: `http://localhost:5210/swagger`
- **Format dữ liệu**: `application/json`
- **Chuẩn xác thực**: `Bearer Token` (JSON Web Token - JWT)
- **Chuẩn báo lỗi**: Chuẩn RFC 7807 (`ProblemDetails` gồm `status`, `title`, `detail`, `traceId`)

---

## 2. Danh Sách Tài Khoản Dùng Thử (Test Accounts)

Tất cả các tài khoản dưới đây đều dùng chung mật khẩu: **`Password123!`**

| Username | Họ và tên | Vai trò (`roles`) | Phòng ban | Mục đích test UI |
| :--- | :--- | :--- | :--- | :--- |
| **`admin`** | Quản Trị Viên Hệ Thống | `ADMIN` | Quản trị hệ thống (`QTHU`) | Test full quyền, menu Quản trị người dùng |
| **`giamdoc`** | Nguyễn Văn Giám Đốc | `DIRECTOR` | Ban Giám Đốc (`BGD`) | Test giao diện phê duyệt cấp cao |
| **`truongphong_kd`** | Trần Thị Trưởng Phòng KD | `MANAGER` | Phòng Kinh doanh (`PKD`) | Test giao diện quản lý phòng ban |
| **`nhanvien_kd`** | Lê Văn Kinh Doanh | `STAFF` | Phòng Kinh doanh (`PKD`) | Test giao diện nhân viên (bị ẩn các nút quản trị) |
| **`nhanvien_cs`** | Phạm Thị Chăm Sóc KH | `STAFF` | Chăm sóc khách hàng (`CSKH`) | Test giao diện CSKH |
| **`nhanvien_sx`** | Hoàng Văn Điều Phối | `STAFF` | Phòng Sản xuất (`PSX`) | Test giao diện vận hành sản xuất |

---

## 3. Chi Tiết Các Endpoint (API Specifications)

### 3.1. Đăng Nhập (`POST /api/v1/identity/login`)
- **Mô tả**: Xác thực bằng Username/Email và Password. Trả về JWT Access Token và Refresh Token.
- **Quyền truy cập**: Public (Không cần token)
- **Method**: `POST`
- **URL**: `http://localhost:5210/api/v1/identity/login`

#### 📥 Request Body
```json
{
  "username": "admin",
  "password": "Password123!"
}
```

#### 📤 Response Thành Công (`200 OK`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "+SrJNPD7Al2LYDwMJSXzBgvVsKBc0L+P5S6Oaakbj0pt8/EB5hqOm2a0pfEKcR/AQC/pIJgSiKZUo9449MiAlA==",
  "tokenType": "Bearer",
  "expiresIn": 7200,
  "user": {
    "id": "01a1b3b3-8a10-70df-8ba4-5364694873db",
    "username": "admin",
    "fullName": "Quản Trị Viên Hệ Thống",
    "email": "admin@qtkd.com",
    "phone": "0901000001",
    "department": {
      "id": "01a1b3b3-878a-7bfa-8c1e-24369e77feb6",
      "code": "QTHU",
      "name": "Phòng Quản trị hệ thống"
    },
    "roles": [
      "ADMIN"
    ],
    "permissions": [
      "contracts.create",
      "contracts.view",
      "contracts.approve",
      "customers.view",
      "customers.manage",
      "users.view",
      "users.manage",
      "workflow.approve",
      "workflow.reject"
    ],
    "lastLoginAt": "2026-11-07T01:54:17.481Z"
  }
}
```

#### ❌ Response Lỗi Thường Gặp
- **`400 Bad Request`**: Thiếu username hoặc password.
- **`401 Unauthorized`**: Tên đăng nhập hoặc mật khẩu sai.
- **`403 Forbidden`**: Tài khoản bị khóa (`isActive = false`).

---

### 3.2. Cấp Mới Token (`POST /api/v1/identity/refresh-token`)
- **Mô tả**: Khi Access Token hết hạn (sau 2 tiếng), Frontend gửi `refreshToken` lên để lấy Access Token mới mà không bắt người dùng đăng nhập lại (Token Rotation).
- **Quyền truy cập**: Public
- **Method**: `POST`
- **URL**: `http://localhost:5210/api/v1/identity/refresh-token`

#### 📥 Request Body
```json
{
  "refreshToken": "+SrJNPD7Al2LYDwMJSXzBgvVsKBc0L+P5S6Oaakbj0pt8/EB5hqOm2a0pfEKcR/AQC/pIJgSiKZUo9449MiAlA=="
}
```

#### 📤 Response Thành Công (`200 OK`)
Trả về cấu trúc y hệt `POST /login` với `accessToken` mới và `refreshToken` mới.
> ⚠️ **Lưu ý**: Refresh Token cũ sẽ bị thu hồi ngay lập tức, Frontend cần cập nhật cả `accessToken` lẫn `refreshToken` mới vào bộ nhớ.

---

### 3.3. Lấy Thông Tin Người Dùng Đang Đăng Nhập (`GET /api/v1/identity/me`)
- **Mô tả**: Dùng để khôi phục phiên đăng nhập khi F5 hoặc mở lại ứng dụng.
- **Quyền truy cập**: Bắt buộc có Token (`Bearer <accessToken>`)
- **Method**: `GET`
- **URL**: `http://localhost:5210/api/v1/identity/me`
- **Headers**:
  ```http
  Authorization: Bearer <accessToken>
  ```

#### 📤 Response Thành Công (`200 OK`)
```json
{
  "id": "01a1b3b3-8a10-70df-8ba4-5364694873db",
  "username": "admin",
  "fullName": "Quản Trị Viên Hệ Thống",
  "email": "admin@qtkd.com",
  "phone": "0901000001",
  "department": {
    "id": "01a1b3b3-878a-7bfa-8c1e-24369e77feb6",
    "code": "QTHU",
    "name": "Phòng Quản trị hệ thống"
  },
  "roles": ["ADMIN"],
  "permissions": ["users.view", "users.manage", "contracts.view"],
  "lastLoginAt": "2026-11-07T01:54:17.481Z"
}
```

---

### 3.4. Danh Sách Người Dùng (`GET /api/v1/identity/users`)
- **Mô tả**: Lấy danh sách toàn bộ nhân sự (Dùng cho bảng quản trị nhân sự / gán người xử lý).
- **Quyền truy cập**: Bắt buộc Token có vai trò `ADMIN` hoặc `MANAGER`.
- **Method**: `GET`
- **URL**: `http://localhost:5210/api/v1/identity/users`
- **Headers**: `Authorization: Bearer <accessToken>`

#### 📤 Response Thành Công (`200 OK`)
```json
[
  {
    "id": "01a1b3b3-8a10-70df-8ba4-5364694873db",
    "username": "admin",
    "fullName": "Quản Trị Viên Hệ Thống",
    "email": "admin@qtkd.com",
    "phone": "0901000001",
    "department": {
      "id": "01a1b3b3-878a-7bfa-8c1e-24369e77feb6",
      "code": "QTHU",
      "name": "Phòng Quản trị hệ thống"
    },
    "roles": ["ADMIN"],
    "permissions": ["users.manage", "users.view"],
    "lastLoginAt": "2026-11-07T01:54:17.481Z"
  }
]
```

---

### 3.5. Danh Sách Vai Trò & Quyền Hạn (`GET /api/v1/identity/roles`)
- **Mô tả**: Lấy danh mục các vai trò và quyền hạn tương ứng.
- **Quyền truy cập**: Bắt buộc đăng nhập.
- **Method**: `GET`
- **URL**: `http://localhost:5210/api/v1/identity/roles`

#### 📤 Response Thành Công (`200 OK`)
```json
[
  {
    "id": "01a1b3b3-8822-7945-8eb3-2287b325ee10",
    "code": "ADMIN",
    "name": "Quản trị viên hệ thống",
    "permissions": ["users.manage", "users.view", "contracts.approve", "customers.manage"]
  },
  {
    "id": "01a1b3b3-8822-7945-8eb3-2287b325ee11",
    "code": "DIRECTOR",
    "name": "Ban Giám đốc",
    "permissions": ["contracts.approve", "workflow.approve", "contracts.view"]
  },
  {
    "id": "01a1b3b3-8822-7945-8eb3-2287b325ee12",
    "code": "MANAGER",
    "name": "Trưởng phòng",
    "permissions": ["workflow.approve", "customers.manage", "contracts.create"]
  },
  {
    "id": "01a1b3b3-8822-7945-8eb3-2287b325ee13",
    "code": "STAFF",
    "name": "Nhân viên",
    "permissions": ["contracts.view", "customers.view", "contracts.create"]
  }
]
```

---

### 3.6. Các Endpoint Kiểm Tra Phân Quyền (RBAC Test)

| Endpoint | Method | Yêu cầu quyền | Trả về khi thành công | Trả về khi sai quyền |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/identity/rbac/admin-only` | `GET` | Chỉ `ADMIN` | `200 OK` | `403 Forbidden` |
| `/api/v1/identity/rbac/director-only` | `GET` | `DIRECTOR`, `ADMIN` | `200 OK` | `403 Forbidden` |
| `/api/v1/identity/rbac/manager-only` | `GET` | `MANAGER`, `DIRECTOR`, `ADMIN` | `200 OK` | `403 Forbidden` |
| `/api/v1/identity/rbac/staff-only` | `GET` | `STAFF`, `MANAGER`, `DIRECTOR`, `ADMIN` | `200 OK` | `403 Forbidden` |

---

## 4. TypeScript Types Chuẩn (Copy Thẳng Vào Dự Án Frontend)

```typescript
// types/auth.ts

export interface DepartmentDto {
  id: string;
  code: string;
  name: string;
}

export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string | null;
  department?: DepartmentDto | null;
  roles: string[];
  permissions: string[];
  lastLoginAt?: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number; // 7200 seconds (2h)
  user: UserDto;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RoleDto {
  id: string;
  code: string;
  name: string;
  permissions: string[];
}

export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  detail?: string;
  traceId?: string;
}
```

---

## 5. Hướng Dẫn Luồng Xử Lý Phía Frontend (Best Practices)

1. **Lưu trữ Token:**
   - `accessToken`: Lưu vào Memory (React State / Zustand / Redux) hoặc `localStorage`/`sessionStorage`.
   - `refreshToken`: Lưu vào `localStorage` hoặc HttpOnly Cookie.
2. **Axios / Fetch Interceptor:**
   - **Request Interceptor**: Tự động đính kèm header `Authorization: Bearer ${accessToken}` vào mọi request.
   - **Response Interceptor**:
     - Khi gặp mã lỗi `401 Unauthorized`:
       - Gọi API `POST /api/v1/identity/refresh-token` với `refreshToken` hiện có.
       - Nếu refresh thành công: Lưu token mới và tự động chạy lại request ban đầu.
       - Nếu refresh thất bại: Xóa toàn bộ token và redirect người dùng về trang `/login`.
3. **Phân Quyền Giao Diện (Client-side RBAC):**
   - Ẩn/Hiện nút bấm theo quyền:
     ```tsx
     {user?.permissions.includes('contracts.approve') && (
       <Button variant="primary">Phê Duyệt Hợp Đồng</Button>
     )}
     ```
   - Bảo vệ Route quản trị:
     ```tsx
     <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
       <UserManagementPage />
     </ProtectedRoute>
     ```

---

## 6. Prompt Mẫu Gợi Ý Cho Hảo Dùng Để Tạo Giao Diện

> 💡 **Hảo chỉ cần copy toàn bộ đoạn khung dưới đây dán vào AI (ChatGPT / Claude / Cursor) để tạo code UI:**

```text
Bạn là một lập trình viên Frontend Senior. Hãy giúp tôi xây dựng module Xác thực & Quản lý phiên làm việc cho ứng dụng Web QTKD Logistics dựa trên tài liệu API sau:

1. Công nghệ: React / Next.js, TypeScript, Tailwind CSS, Axios, Lucide React Icons.
2. Các màn hình & chức năng cần tạo:
   - Màn hình Đăng nhập (/login): Thiết kế hiện đại, responsive, form nhập Username/Password, nút Show/Hide mật khẩu, hiển thị thông báo lỗi thân thiện khi API trả về 401 hoặc 400.
   - AuthContext & Provider: Quản lý trạng thái user hiện tại, isLoggedIn, login(), logout().
   - Axios Interceptor: Tự động gắn Bearer Token vào header; tự động bắt lỗi 401 để gọi POST /api/v1/identity/refresh-token xoay vòng token; nếu thất bại thì logout.
   - User Profile Dropdown trên Header: Hiển thị Avatar, Họ tên, Email, Tên phòng ban, Badge vai trò (ADMIN, DIRECTOR, MANAGER, STAFF) và nút Đăng xuất.
   - Component ProtectedRoute & CanAccess: Phân quyền truy cập component hoặc trang dựa trên mảng user.roles và user.permissions.

3. Chi tiết API Backend (Chạy tại http://localhost:5210):
   - POST /api/v1/identity/login: body { username, password } -> trả về { accessToken, refreshToken, expiresIn, user }
   - POST /api/v1/identity/refresh-token: body { refreshToken } -> trả về token mới
   - GET /api/v1/identity/me: headers { Authorization: Bearer <token> } -> trả về thông tin user

Hãy viết code đầy đủ, phân tách thư mục chuẩn (types, services, context, components, pages) và chú thích chi tiết.
```

