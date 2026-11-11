import type { UserDto } from "../types/identity";
import { Icon } from "../components/Icon";

const roleLabels: Record<string, string> = {
  ADMIN: "Quản trị viên",
  DIRECTOR: "Ban Giám đốc",
  MANAGER: "Trưởng phòng",
  STAFF: "Chuyên viên",
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
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>TÀI KHOẢN</span>
          <span>•</span>
          <span className="text-orange-600">THÔNG TIN ĐỊNH DANH</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Hồ sơ Cá nhân
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Chi tiết tài khoản, phân bổ tổ chức và các quyền hạn được hệ thống phê duyệt.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header banner */}
            <div className="h-28 bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-4 relative">
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                ACTIVE
              </span>
            </div>

            <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="-mt-12 mb-4 w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-2xl flex items-center justify-center border-4 border-white shadow-md">
                {initials}
              </div>

              <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>

              {/* Roles Badge */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200"
                  >
                    {roleLabels[r] ?? r}
                  </span>
                ))}
              </div>

              {/* User Metadata Grid */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Tên đăng nhập:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    @{user.username}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Phòng ban:</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {user.department?.name ?? "Quản trị hệ thống"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Mã phòng:</span>
                  <span className="font-semibold text-slate-800">
                    {user.department?.code ?? "QT"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <span className="font-semibold text-slate-800">
                    {user.phone || "0901 000 001"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Trạng thái bảo mật</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Đã xác thực JWT
            </span>
          </div>
        </div>

        {/* Right Permissions Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quyền Hạn Được Cấp (RBAC)
              </h3>
              <p className="text-xs text-slate-500">
                Các quyền truy cập tài nguyên theo chính sách kiểm soát của doanh nghiệp
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              {user.permissions.length} Quyền
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user.permissions.map((perm) => (
              <div
                key={perm}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-orange-500/30 hover:bg-orange-50/30 transition-all flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {permissionLabels[perm] ?? perm}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    {perm}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
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
