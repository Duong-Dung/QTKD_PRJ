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
    DIRECTOR: "Ban Giám đốc",
    MANAGER: "Trưởng phòng",
    STAFF: "Chuyên viên",
  };

  const initials = user.fullName
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. SIDEBAR NAVIGATION: Minimalist, Crisp, Modern */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Workspace header */}
          <div className="p-5 border-b border-slate-100">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 group"
            >
              <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-orange-600/25 group-hover:scale-105 transition-transform duration-200">
                Q
              </span>
              <div>
                <span className="block text-sm font-black tracking-wider text-slate-900 leading-none">
                  QTKD LOGISTICS
                </span>
                <span className="block text-[10px] font-semibold text-slate-400 tracking-widest mt-1 uppercase">
                  ENTERPRISE 4.0
                </span>
              </div>
            </a>

            {/* Current Workspace Pill */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center">
                A
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  ABC Logistics
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user.department?.name ?? "Doanh nghiệp"}
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Trực tuyến" />
            </div>
          </div>

          {/* Navigation Items List */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6" aria-label="Menu chính">
            {sections.map((section) => (
              <div key={section} className="space-y-1.5">
                <span className="block px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {section}
                </span>

                <div className="space-y-1">
                  {visibleMenu
                    .filter((item) => item.section === section)
                    .map((item) => {
                      const isActive = currentId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            navigate(`/${item.id}`);
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left ${
                            isActive
                              ? "bg-orange-50 text-orange-600 shadow-sm font-bold border border-orange-200/60"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`transition-colors ${
                              isActive ? "text-orange-600" : "text-slate-400"
                            }`}
                          >
                            <Icon
                              name={item.icon as Parameters<typeof Icon>[0]["name"]}
                              size={18}
                            />
                          </span>
                          <span className="flex-1 truncate">{item.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer / Support card */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-xs shrink-0">
              ?
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800">Cần hỗ trợ?</p>
              <p className="text-[10px] text-slate-500 truncate">
                support@qtkd.com
              </p>
            </div>
            <a
              href="mailto:support@qtkd.com"
              className="text-slate-400 hover:text-orange-600 transition-colors"
            >
              <Icon name="arrow" size={14} />
            </a>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>ABC LOGISTICS</span>
            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
              v1.0.0
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APP CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* STICKY TOPBAR: Minimalist, clean backdrop-blur */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Mở Menu"
            >
              <Icon name="menu" size={20} />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:inline">Không gian làm việc</span>
              <Icon name="chevron" size={12} />
              <span className="font-bold text-slate-800 text-sm">{pageTitle}</span>
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Global Search */}
            <div className="relative">
              <div className="hidden sm:flex items-center gap-2 w-56 md:w-64 h-9 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 text-slate-400 text-xs transition-all focus-within:w-72 focus-within:bg-white focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/10">
                <Icon name="search" size={16} />
                <input
                  type="text"
                  placeholder="Tìm kiếm phân hệ..."
                  value={search}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchOpen(false);
                    if (e.key === "Enter" && searchResults[0]) {
                      navigate(`/${searchResults[0].id}`);
                      setSearch("");
                      setSearchOpen(false);
                    }
                  }}
                  className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 text-xs"
                />
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
                  ESC
                </kbd>
              </div>

              {/* Search dropdown results */}
              {searchOpen && search.trim() && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-40 space-y-1">
                  {searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          navigate(`/${item.id}`);
                          setSearch("");
                          setSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 text-xs font-semibold text-slate-700 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            name={item.icon as Parameters<typeof Icon>[0]["name"]}
                            size={16}
                          />
                          <span>{item.label}</span>
                        </div>
                        <Icon name="arrow" size={12} />
                      </button>
                    ))
                  ) : (
                    <p className="p-3 text-xs text-slate-400 text-center">
                      Không tìm thấy phân hệ nào
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                aria-expanded={profileOpen}
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {initials}
                </span>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] font-medium text-orange-600">
                    {roleLabels[role] ?? role}
                  </p>
                </div>
                <Icon name="down" size={14} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-2 z-50 animate-fadeIn">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      {user.department?.name ?? "Quản trị hệ thống"}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/profile");
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Icon name="userCog" size={16} />
                      <span>Hồ sơ cá nhân & Quyền</span>
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <Icon name="logout" size={16} />
                      <span>Đăng xuất hệ thống</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. MAIN ROUTE VIEW */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route
              path="/overview"
              element={<DashboardPage user={user} menu={visibleMenu} />}
            />
            <Route path="/profile" element={<ProfilePage user={user} />} />
            <Route
              path="/customers"
              element={
                <CustomersPage canManage={hasPermission("customers.manage")} />
              }
            />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/users" element={<UsersPage />} />
            {visibleMenu
              .filter(
                (item) =>
                  !["overview", "customers", "contracts", "users"].includes(
                    item.id,
                  ),
              )
              .map((item) => (
                <Route
                  key={item.id}
                  path={`/${item.id}`}
                  element={
                    <ModulePlaceholder
                      title={item.label}
                      description={item.description}
                    />
                  }
                />
              ))}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </main>

        {/* 4. FOOTER: Minimalist & Clean */}
        <footer className="border-t border-slate-200/80 px-6 lg:px-8 py-5 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 QTKD ABC Logistics Solution. Nền tảng Doanh nghiệp Số.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Vận hành ổn định & An toàn dữ liệu
          </span>
        </footer>
      </div>
    </div>
  );
}

function ModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
        <Icon name="activity" size={30} />
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-orange-500" />
        PHÂN HỆ NGHIỆP VỤ
      </div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-600 max-w-sm mx-auto shadow-sm">
        Khung phân quyền RBAC và giao diện đã sẵn sàng kết nối API mở rộng trong
        sprint tiếp theo.
      </div>
    </div>
  );
}
