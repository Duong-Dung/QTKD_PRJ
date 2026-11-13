import type { UserDto } from "../types/identity";
import { Icon } from "../components/Icon";

const roleLabels: Record<string, string> = {
  ADMIN: "Quản trị viên",
  DIRECTOR: "Ban Giám đốc",
  MANAGER: "Trưởng phòng",
  STAFF: "Chuyên viên Kinh doanh",
  LEGAL: "Pháp chế",
  ACCOUNTANT: "Kế toán",
};

const permissionLabels: Record<string, string> = {
  "users.view": "Xem danh sách người dùng",
  "users.manage": "Quản lý tài khoản & phân quyền",
  "customers.view": "Xem hồ sơ khách hàng",
  "customers.manage": "Thêm mới & cập nhật khách hàng",
  "contracts.view": "Xem danh sách hợp đồng & phụ lục",
  "contracts.create": "Khởi tạo & chỉnh sửa hợp đồng nháp",
  "contracts.approve": "Phê duyệt hợp đồng cấp cao",
  "workflow.approve": "Phê duyệt các bước trong quy trình",
  "workflow.reject": "Từ chối hoặc yêu cầu chỉnh sửa hồ sơ",
};

export default function ProfilePage({ user }: { user: UserDto }) {
  const initials = user.fullName
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
          <span>TÀI KHOẢN NHÂN SỰ</span>
          <span>•</span>
          <span className="text-[#2563EB]">THÔNG TIN ĐỊNH DANH &amp; PHÂN QUYỀN</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
          Hồ sơ Cá nhân
        </h1>
        <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
          Chi tiết tài khoản, phân bổ tổ chức và các quyền hạn được hệ thống phê duyệt chuẩn RBAC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Profile Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header banner */}
            <div className="h-28 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] p-4 relative">
              <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/30">
                ACTIVE
              </span>
            </div>

            <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="-mt-12 mb-4 w-20 h-20 rounded-xl bg-[#1E3A8A] text-white font-black text-2xl flex items-center justify-center border-4 border-white shadow-md">
                {initials}
              </div>

              <h2 className="text-xl font-bold text-[#111827]">{user.fullName}</h2>
              <p className="text-xs text-[#4B5563] mt-0.5">{user.email}</p>

              {/* Roles Badge */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded bg-[#EFF6FF] text-[#1E3A8A] border border-[#DBEAFE]"
                  >
                    {roleLabels[r] ?? r}
                  </span>
                ))}
              </div>

              {/* User Metadata Grid */}
              <div className="mt-6 pt-5 border-t border-[#E5E7EB] space-y-3 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-[#4B5563]">Tên đăng nhập:</span>
                  <span className="font-mono font-semibold text-[#111827]">
                    @{user.username}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#4B5563]">Phòng ban:</span>
                  <span className="font-semibold text-[#111827] text-right">
                    {user.department?.name ?? "Phòng Kinh doanh"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#4B5563]">Mã phòng ban:</span>
                  <span className="font-semibold text-[#111827]">
                    {user.department?.code ?? "KD"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#4B5563]">Số điện thoại:</span>
                  <span className="font-semibold text-[#111827]">
                    {user.phone || "0901 000 001"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#F8FAFC] border-t border-[#E5E7EB] text-[11px] text-[#4B5563] flex items-center justify-between">
            <span>Trạng thái bảo mật</span>
            <span className="text-[#16A34A] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              Đã xác thực JWT
            </span>
          </div>
        </div>

        {/* Right Permissions Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Quyền Hạn Được Cấp (RBAC)
              </h3>
              <p className="text-xs text-[#4B5563]">
                Các quyền truy cập tài nguyên theo chính sách kiểm soát của ABC Logistics
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-xs font-bold text-[#1E3A8A]">
              {user.permissions.length} Quyền
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user.permissions.map((perm) => (
              <div
                key={perm}
                className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]/40 transition-all flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-md bg-emerald-100 text-[#16A34A] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#111827] leading-tight">
                    {permissionLabels[perm] ?? perm}
                  </p>
                  <p className="text-[10px] font-mono text-[#9CA3AF] mt-0.5 truncate">
                    {perm}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-[#1E3A8A] flex items-start gap-2.5">
            <Icon name="lock" size={16} />
            <p className="leading-relaxed">
              <strong>Lưu ý bảo mật:</strong> Mọi thao tác ghi nhận hoặc sửa đổi dữ liệu
              đều được kiểm tra nghiêm ngặt bằng JWT Token và phân quyền RBAC ở phía
              máy chủ API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
