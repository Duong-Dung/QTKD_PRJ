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
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>HỆ THỐNG</span>
            <span>•</span>
            <span className="text-orange-600">QUẢN TRỊ TÀI KHOẢN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Người dùng & Phân quyền
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Danh sách nhân sự, phân bổ phòng ban và vai trò quyền hạn chuẩn RBAC.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-700">
            Tổng cộng: <strong className="text-slate-900">{users.length}</strong> tài khoản
          </span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Icon name="search" size={17} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, email, tên đăng nhập, phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
        </div>

        <span className="text-xs text-slate-400">
          Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} người dùng
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <Icon name="activity" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Modern Minimalist Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">NHÂN SỰ</th>
                <th className="py-3.5 px-4">TÊN ĐĂNG NHẬP</th>
                <th className="py-3.5 px-4">PHÒNG BAN</th>
                <th className="py-3.5 px-4">VAI TRÒ RBAC</th>
                <th className="py-3.5 px-6 text-right">QUYỀN HẠN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {person.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {person.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-medium text-slate-700">
                        @{person.username}
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {person.department?.name ?? "—"}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide ${roleInfo.badge}`}
                        >
                          {roleInfo.label}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {person.permissions.length} quyền
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
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
