import type { UserDto } from "../types/identity";
import { Icon } from "../components/Icon";

const roleLabels: Record<string, string> = {
  ADMIN: "Quản trị viên",
  DIRECTOR: "Ban giám đốc",
  MANAGER: "Trưởng phòng",
  STAFF: "Nhân viên",
};

const permissionLabels: Record<string, string> = {
  "users.view": "Xem danh sách người dùng",
  "users.manage": "Quản lý tài khoản",
  "customers.view": "Xem hồ sơ khách hàng",
  "customers.manage": "Quản lý khách hàng",
  "contracts.view": "Xem hợp đồng",
  "contracts.create": "Tạo hợp đồng",
  "contracts.approve": "Phê duyệt hợp đồng",
  "workflow.approve": "Phê duyệt quy trình",
  "workflow.reject": "Từ chối hoặc yêu cầu chỉnh sửa",
};

export default function ProfilePage({ user }: { user: UserDto }) {
  return (
    <section className="page-enter">
      <div className="page-heading">
        <div><div className="breadcrumbs-inline">Tài khoản <Icon name="chevron" size={13} /> Hồ sơ cá nhân</div><h1>Hồ sơ cá nhân</h1><p>Thông tin tài khoản và quyền truy cập của bạn.</p></div>
      </div>
      <div className="profile-layout">
        <article className="profile-card">
          <div className="profile-card__cover"><span className="cover-orbit cover-orbit--one" /><span className="cover-orbit cover-orbit--two" /><span className="cover-mark">Q</span></div>
          <div className="profile-card__body">
            <span className="avatar avatar--profile">{user.fullName.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase()}</span>
            <h2>{user.fullName}</h2><p>{user.email}</p>
            <div className="profile-roles">{user.roles.map((role) => <span className="role-pill" key={role}>{roleLabels[role] ?? role}</span>)}</div>
            <div className="profile-facts">
              <div><span>TÊN ĐĂNG NHẬP</span><strong>{user.username}</strong></div>
              <div><span>PHÒNG BAN</span><strong>{user.department?.name ?? "Chưa cập nhật"}</strong></div>
              <div><span>MÃ PHÒNG BAN</span><strong>{user.department?.code ?? "—"}</strong></div>
              <div><span>SỐ ĐIỆN THOẠI</span><strong>{user.phone || "Chưa cập nhật"}</strong></div>
              <div><span>ĐĂNG NHẬP GẦN NHẤT</span><strong>{user.lastLoginAt ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(user.lastLoginAt)) : "—"}</strong></div>
            </div>
          </div>
        </article>
        <article className="permissions-card">
          <div className="permissions-card__heading"><span className="permissions-card__icon"><Icon name="lock" size={19} /></span><div><h2>Quyền hạn được cấp</h2><p>Danh sách quyền nhận từ hệ thống Identity.</p></div><span className="module-count"><strong>{user.permissions.length.toString().padStart(2, "0")}</strong> quyền</span></div>
          {user.permissions.length ? <ul className="permission-list">{user.permissions.map((permission) => <li key={permission}><span className="permission-check">✓</span><span><strong>{permissionLabels[permission] ?? permission}</strong><small>{permission}</small></span></li>)}</ul> : <div className="permission-empty">Tài khoản chưa được cấp quyền chi tiết.</div>}
          <p className="permissions-note">Quyền truy cập thực tế luôn được xác thực lại bởi máy chủ API.</p>
        </article>
      </div>
    </section>
  );
}
