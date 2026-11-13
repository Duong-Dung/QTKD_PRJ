import { useEffect, useState } from "react";
import { ApiError, getUsers } from "../services/api";
import type { UserDto } from "../types/identity";
import { Icon } from "../components/Icon";

const roleLabels: Record<string, { label: string; badge: string }> = {
  ADMIN: {
    label: "Quản trị viên",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  DIRECTOR: {
    label: "Ban Giám đốc",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  MANAGER: {
    label: "Trưởng phòng",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  STAFF: {
    label: "Chuyên viên",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getUsers()
      .then((result) => {
        if (active) {
          setUsers(result);
          setError("");
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "Không thể tải danh sách người dùng.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      (u.department?.name && u.department.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
            <span>HỆ THỐNG ABC LOGISTICS</span>
            <span>•</span>
            <span className="text-[#2563EB]">QUẢN TRỊ TÀI KHOẢN RBAC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
            Người dùng &amp; Phân quyền
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Danh sách nhân sự, phân bổ phòng ban và vai trò quyền hạn chuẩn RBAC.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] shadow-sm text-xs font-semibold text-[#111827]">
            Tổng cộng: <strong className="text-[#1E3A8A]">{users.length}</strong> tài khoản
          </span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9CA3AF]">
            <Icon name="search" size={17} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, email, tên đăng nhập, phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs text-[#111827] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
          />
        </div>

        <span className="text-xs text-[#4B5563]">
          Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} người dùng
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <Icon name="activity" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1E3A8A] text-white text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-6">NHÂN SỰ</th>
                <th className="py-3 px-4">TÊN ĐĂNG NHẬP</th>
                <th className="py-3 px-4">PHÒNG BAN</th>
                <th className="py-3 px-4">VAI TRÒ RBAC</th>
                <th className="py-3 px-6 text-right">QUYỀN HẠN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#9CA3AF]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách người dùng…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((person) => {
                  const roleKey = person.roles[0] ?? "STAFF";
                  const roleInfo = roleLabels[roleKey] ?? {
                    label: roleKey,
                    badge: "bg-slate-50 text-slate-700 border-slate-200",
                  };
                  const initials = person.fullName
                    .split(" ")
                    .slice(-2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={person.id}
                      className="hover:bg-[#EFF6FF] transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#111827] truncate">
                              {person.fullName}
                            </p>
                            <p className="text-[11px] text-[#4B5563] truncate">
                              {person.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-[#111827]">
                        @{person.username}
                      </td>

                      <td className="py-3.5 px-4 text-[#4B5563] font-medium">
                        {person.department?.name ?? "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded border tracking-wide ${roleInfo.badge}`}
                        >
                          {roleInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563]">
                          {person.permissions.length} quyền
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#9CA3AF]">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
