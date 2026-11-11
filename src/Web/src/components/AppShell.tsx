import { useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getMenuItem, getVisibleMenu } from "../navigation/menu";
import { Icon } from "./Icon";
import DashboardPage from "../pages/DashboardPage";
import CustomersPage from "../pages/CustomersPage";
import UsersPage from "../pages/UsersPage";
import ProfilePage from "../pages/ProfilePage";
import ContractsPage from "../pages/ContractsPage";

export default function AppShell() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const visibleMenu = useMemo(() => (user ? getVisibleMenu(user) : []), [user]);
  const currentId = location.pathname.split("/")[1] || "overview";
  const currentItem = getMenuItem(currentId);
  const isProfilePage = currentId === "profile";
  const pageTitle = isProfilePage ? "Hồ sơ cá nhân" : currentItem?.label;
  const role = user?.roles[0] ?? "STAFF";
  const searchResults = search.trim()
    ? visibleMenu.filter((item) =>
        item.label.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi")),
      )
    : [];

  if (
    !user ||
    (!isProfilePage &&
      (!currentItem || !visibleMenu.some((item) => item.id === currentId)))
  ) {
    return <Navigate to="/" replace />;
  }

  const sections = [...new Set(visibleMenu.map((item) => item.section))];
  const roleLabels: Record<string, string> = {
    ADMIN: "Quản trị viên",
    DIRECTOR: "Ban giám đốc",
    MANAGER: "Trưởng phòng",
    STAFF: "Nhân viên",
  };
  const initials = user.fullName
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <a className="brand brand--sidebar" href="/" onClick={(event) => { event.preventDefault(); navigate("/"); setSidebarOpen(false); }}>
          <span className="brand-mark">Q</span>
          <span className="brand-name">QTKD<span>LOGISTICS</span></span>
        </a>

        <div className="workspace-switcher">
          <span className="workspace-avatar">A</span>
          <span className="workspace-copy"><strong>ABC Logistics</strong><small>Không gian doanh nghiệp</small></span>
          <Icon name="down" size={15} />
        </div>

        <nav className="side-nav" aria-label="Điều hướng chính">
          {sections.map((section) => (
            <div className="nav-section" key={section}>
              <div className="nav-section__label">{section}</div>
              {visibleMenu.filter((item) => item.section === section).map((item) => (
                <button
                  type="button"
                  className={`nav-item ${currentId === item.id ? "nav-item--active" : ""}`}
                  key={item.id}
                  onClick={() => { navigate(`/${item.id}`); setSidebarOpen(false); }}
                >
                  <Icon name={item.icon as Parameters<typeof Icon>[0]["name"]} size={19} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <a className="help-card" href="mailto:support@qtkd.com"><span className="help-card__icon">?</span><div><strong>Cần trợ giúp?</strong><span>Liên hệ quản trị viên</span></div><Icon name="arrow" size={15} /></a>
          <div className="sidebar-version">ABC LOGISTICS <small>v1.0.0</small></div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button type="button" className="icon-button mobile-menu-button" aria-label="Mở menu" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button>
          <div className="breadcrumbs"><span>Không gian làm việc</span><Icon name="chevron" size={14} /><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <div className="global-search-wrap">
              <label className="global-search"><Icon name="search" size={18} /><input aria-label="Tìm phân hệ" placeholder="Tìm phân hệ..." value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); if (event.key === "Enter" && searchResults[0]) { navigate(`/${searchResults[0].id}`); setSearch(""); setSearchOpen(false); } }} /></label>
              {searchOpen && search.trim() && <div className="search-results">
                {searchResults.length ? searchResults.map((item) => <button type="button" key={item.id} onClick={() => { navigate(`/${item.id}`); setSearch(""); setSearchOpen(false); }}><Icon name={item.icon as Parameters<typeof Icon>[0]["name"]} size={16} /><span>{item.label}</span><Icon name="arrow" size={14} /></button>) : <span className="search-empty">Không tìm thấy phân hệ phù hợp.</span>}
              </div>}
            </div>
            <button
              type="button"
              onClick={() => navigate("/contracts-standalone")}
              style={{
                background: "#e9784518",
                color: "#e97845",
                border: "1px solid #e9784540",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
              title="Xem bản demo giao diện độc lập Task 29/32"
            >
              <span>Giao diện Task 29/32 (Hiệu)</span>
            </button>
            <span className="topbar-divider" />
            <div className="profile-wrap">
              <button type="button" className="profile-trigger" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
                <span className="avatar">{initials}</span>
                <span className="profile-copy"><strong>{user.fullName}</strong><small>{roleLabels[role] ?? role}</small></span>
                <Icon name="down" size={15} />
              </button>
              {profileOpen && <div className="profile-menu">
                <div className="profile-menu__identity"><strong>{user.fullName}</strong><span>{user.email}</span><small>{user.department?.name ?? "Chưa cập nhật phòng ban"}</small></div>
                <button type="button" onClick={() => { navigate("/profile"); setProfileOpen(false); }}><Icon name="userCog" size={17} /> Hồ sơ cá nhân</button>
                <button type="button" className="profile-menu__logout" onClick={logout}><Icon name="logout" size={17} /> Đăng xuất</button>
              </div>}
            </div>
          </div>
        </header>

        <main className="content-area">
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<DashboardPage user={user} menu={visibleMenu} />} />
            <Route path="/profile" element={<ProfilePage user={user} />} />
            <Route path="/customers" element={<CustomersPage canManage={hasPermission("customers.manage")} />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            {visibleMenu.filter((item) => !["overview", "customers", "users", "contracts"].includes(item.id)).map((item) => (
              <Route key={item.id} path={`/${item.id}`} element={<ModulePlaceholder title={item.label} description={item.description} />} />
            ))}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </main>
        <footer className="app-footer"><span>© 2026 ABC Logistics</span><span>Được thiết kế để vận hành tốt hơn <i>✳</i></span></footer>
      </div>
    </div>
  );
}

function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="page-enter">
      <div className="page-heading"><div><div className="breadcrumbs-inline">Không gian làm việc <Icon name="chevron" size={13} /> {title}</div><h1>{title}</h1><p>{description}</p></div></div>
      <div className="module-placeholder">
        <span className="placeholder-icon"><Icon name="activity" size={24} /></span>
        <span className="eyebrow">PHÂN HỆ ĐÃ ĐƯỢC PHÂN QUYỀN</span>
        <h2>Không gian {title.toLowerCase()} sẵn sàng mở rộng</h2>
        <p>Khung ứng dụng và quyền truy cập đã được thiết lập. Các API nghiệp vụ cho phân hệ này sẽ được kết nối khi sẵn sàng.</p>
        <span className="placeholder-note"><span className="status-dot" /> Bạn đang xem với quyền truy cập theo vai trò</span>
      </div>
    </section>
  );
}
