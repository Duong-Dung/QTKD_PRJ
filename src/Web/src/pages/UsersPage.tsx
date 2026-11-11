import { useEffect, useState } from "react";
import { ApiError, getUsers } from "../services/api";
import type { UserDto } from "../types/identity";
import { Icon } from "../components/Icon";

const roleLabels: Record<string, string> = {
  ADMIN: "Quản trị viên",
  DIRECTOR: "Ban giám đốc",
  MANAGER: "Trưởng phòng",
  STAFF: "Nhân viên",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
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

  return (
    <section className="page-enter">
      <div className="page-heading page-heading--split">
        <div><div className="breadcrumbs-inline">Quản trị <Icon name="chevron" size={13} /> Người dùng</div><h1>Người dùng</h1><p>Danh sách tài khoản và vai trò được cấp trong hệ thống.</p></div>
        <span className="module-count"><strong>{users.length.toString().padStart(2, "0")}</strong> tài khoản</span>
      </div>
      {error && <div className="form-alert table-alert" role="alert"><span className="alert-icon">!</span><span>{error}</span></div>}
      <div className="table-card">
        <div className="table-scroll"><table>
          <thead><tr><th>NGƯỜI DÙNG</th><th>TÊN ĐĂNG NHẬP</th><th>PHÒNG BAN</th><th>VAI TRÒ</th><th>QUYỀN HẠN</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5}><div className="table-loading"><span className="button-spinner button-spinner--dark" /> Đang tải danh sách…</div></td></tr>
              : users.length ? users.map((person) => (
                <tr key={person.id}><td><div className="user-cell"><span className="avatar avatar--table">{person.fullName.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase()}</span><span><strong className="customer-name">{person.fullName}</strong><span className="customer-address">{person.email}</span></span></div></td><td>{person.username}</td><td>{person.department?.name ?? "—"}</td><td><span className="role-pill">{person.roles.map((role) => roleLabels[role] ?? role).join(", ")}</span></td><td><span className="permission-count">{person.permissions.length} quyền</span></td></tr>
              ))
              : !error && <tr><td colSpan={5}><div className="table-empty"><span className="placeholder-icon"><Icon name="users" /></span><strong>Chưa có người dùng</strong><span>Danh sách tài khoản sẽ hiển thị tại đây.</span></div></td></tr>}
          </tbody>
        </table></div>
      </div>
    </section>
  );
}
