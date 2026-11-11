# QTKD Web

Frontend React + TypeScript + Vite cho đăng nhập, phiên làm việc và khung ứng dụng QTKD Logistics.

## Chạy giao diện

Yêu cầu Node.js 20.19+ hoặc 22.12+.

```powershell
cd src\Web
npm install
npm run dev
```

Mở `http://localhost:5173`. API cần chạy tại `http://localhost:5210` (xem hướng dẫn ở README gốc). Có thể đặt URL API khác bằng biến môi trường `VITE_API_BASE_URL`.

## Kiểm tra bản dựng

```powershell
npm run build
```

Access token chỉ nằm trong bộ nhớ của tab; refresh token nằm trong `sessionStorage` và được xoay vòng khi API trả về 401. Menu được lọc theo `roles`/`permissions`; API vẫn phải kiểm tra quyền truy cập phía máy chủ.
