# TÀI LIỆU HƯỚNG DẪN & ĐẶC TẢ GIAO DIỆN TASK 29 & TASK 32
**Dự án:** Hệ thống Quản trị Kinh doanh ABC Logistics  
**Sprint:** Sprint 01 | **Mục tiêu:** PB-08, PB-09  
**Người thực hiện:** Hiệu  

---

## 1. Tổng quan các màn hình đã cài đặt

| Mã Task | Tên Task | Màn hình tương ứng | Trạng thái |
| :--- | :--- | :--- | :--- |
| **TASK-29** | Giao diện form tạo hợp đồng | `ContractForm.tsx` (mode `create`) | ✅ Đã hoàn thành |
| **TASK-32** | Giao diện danh sách hợp đồng | `ContractList.tsx` | ✅ Đã hoàn thành |
| **TASK-32** | Giao diện chi tiết hợp đồng | `ContractForm.tsx` (mode `detail`) | ✅ Đã hoàn thành |

---

## 2. Công nghệ sử dụng (Frontend Stack)
- **Framework:** React 18 + TypeScript + Vite.
- **Styling:** Tailwind CSS + PostCSS (thiết kế theo phong cách B2B SaaS hiện đại).
- **Icons:** Lucide React (chuẩn giao diện doanh nghiệp).
- **Vị trí mã nguồn:** Thư mục `src/Web/`.

---

## 3. Cách chạy thử giao diện trên máy

Mở Terminal tại thư mục gốc của đồ án và chạy các lệnh sau:

```powershell
# 1. Di chuyển vào thư mục Frontend
cd src/Web

# 2. Khởi chạy môi trường phát triển (Development Server)
npm run dev
```

Trình duyệt sẽ tự động mở giao diện tại: **`http://localhost:3000`**

---

## 4. Chi tiết các tính năng & Quy tắc nghiệp vụ đã tích hợp

### 4.1. Màn hình Danh sách hợp đồng (Task 32)
- **4 Thẻ tóm tắt chỉ số KPI:**
  - Tổng hợp đồng (tự động cập nhật)
  - Bản nháp (điểm nhấn xám đậm)
  - Chờ duyệt (điểm nhấn vàng/cam)
  - Đã phê duyệt (điểm nhấn xanh lá)
- **Tab lọc nhanh:** Tất cả hợp đồng, Bản nháp, Chờ duyệt, Đã phê duyệt.
- **Tìm kiếm & Bộ lọc:**
  - Ô tìm kiếm tức thì theo mã hợp đồng, tên hợp đồng hoặc tên khách hàng.
  - Dropdown lọc theo từng trạng thái cụ thể.
- **Bảng dữ liệu (Data Table):**
  - Hiển thị: Mã hợp đồng, Tên HĐ / Khách hàng, Thời gian hiệu lực, Trạng thái (badge chuẩn màu), Người phụ trách.
  - Bấm vào bất kỳ dòng nào (hoặc mã hợp đồng) sẽ mở màn hình **Chi tiết hợp đồng**.
- **Nút `+ Tạo hợp đồng`:** Mở ngay form tạo mới.

### 4.2. Màn hình Tạo hợp đồng (Task 29)
Bố cục 2 cột (Tỷ lệ 8:4) gồm:
1. **Section 01 - Thông tin chung:**
   - Mã hợp đồng (tự động sinh mã tiếp theo, ví dụ `HĐ-2026-025`).
   - Tên hợp đồng (*bắt buộc*).
   - Khách hàng (*bắt buộc*): Dropdown tìm kiếm thông minh, **chỉ hiển thị khách hàng có trạng thái `Active`** kèm Mã và MST (loại bỏ khách hàng Suspended theo đúng nghiệp vụ).
2. **Section 02 - Thời gian và giá trị:**
   - Ngày bắt đầu và ngày kết thúc hiệu lực (*bắt buộc*). Ràng buộc ngày bắt đầu không được sau ngày kết thúc.
   - Giá trị hợp đồng (nhập số tiền, định dạng có dấu phẩy ngăn cách hàng nghìn).
   - Đơn vị tiền tệ (mặc định VND).
3. **Section 03 - Điều khoản:**
   - Điều khoản thanh toán (Textarea).
   - Điều khoản dịch vụ (Textarea).
4. **Section 04 - Tệp đính kèm:**
   - Khung kéo thả file (PDF, DOC, DOCX, XLS, XLSX).
   - Cho phép tải nhiều tệp và hiển thị dung lượng, thời gian tải.
   - **Tùy chọn Tệp chính (`isMainDocument`):** Cho phép chọn tệp làm hồ sơ chính.
   - Nút xóa tệp linh hoạt.
5. **Cột thông tin phụ bên phải:**
   - Thông tin người phụ trách: `VAN PHU HIEU` (Nhân viên Kinh doanh).
   - **Checklist động "Điều kiện gửi duyệt":**
     - [x] Khách hàng đang hoạt động
     - [x] Thời gian hiệu lực hợp lệ
     - [x] Có tệp chính được đánh dấu
6. **Thanh thao tác cố định dưới cùng (Sticky Bottom Bar):**
   - Nút **Hủy**: Quay về danh sách.
   - Nút **Lưu bản nháp**: Lưu hợp đồng ở trạng thái Draft.
   - Nút **Gửi duyệt**: Chỉ sáng khi đạt đủ 3 điều kiện trong checklist.

### 4.3. Màn hình Chi tiết hợp đồng (Task 32)
- Hiển thị tiêu đề chuẩn: `< Hợp đồng / Chi tiết hợp đồng` - `Chi tiết hợp đồng: HĐ-2026-xxx`.
- **Khi hợp đồng ở trạng thái `Bản nháp (Draft)` hoặc `Yêu cầu chỉnh sửa (RevisionRequested)`:**
  - Toàn bộ các trường dữ liệu đều được mở cho phép chỉnh sửa.
  - Tải sẵn danh sách tệp đính kèm và đánh dấu tệp chính.
  - Nút bấm dưới thanh công cụ: `Quay lại`, `Cập nhật bản nháp`, `Gửi duyệt`.
- **Khi hợp đồng ở trạng thái `Chờ duyệt (PendingApproval)` hoặc `Đã phê duyệt (Approved)`:**
  - Tự động chuyển toàn bộ trường sang chế độ **Chỉ đọc (Read-only / Disabled)**.
  - Ẩn nút lưu nháp và gửi duyệt để đảm bảo tính toàn vẹn dữ liệu.

### 4.4. Thông báo Toast phản hồi (Toast Banner)
- Sau khi Lưu bản nháp hoặc Gửi duyệt thành công, giao diện tự động chuyển về màn hình danh sách, cập nhật tức thì chỉ số KPI trên các thẻ thống kê và hiển thị Toast thông báo màu xanh lá ở góc phải bên dưới giống 100% bản mẫu.
