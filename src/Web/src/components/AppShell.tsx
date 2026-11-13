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

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: "contract" | "customer" | "approval";
  link?: string;
}

export default function AppShell() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Danh sách thông báo mẫu đồng bộ với Section 4.9 của Figma Design Pack
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Hợp đồng chờ rà soát",
      desc: "HĐ-2026-0007 (Cty Nam Á) đã được gửi duyệt, chuyển sang bước Pháp chế rà soát.",
      time: "10 phút trước",
      read: false,
      type: "approval",
      link: "/contracts",
    },
    {
      id: "notif-2",
      title: "Yêu cầu hoàn tất hồ sơ",
      desc: "Khách hàng Cty TNHH Vận tải Biển Đông cần cập nhật mã số thuế bổ sung.",
      time: "1 giờ trước",
      read: false,
      type: "customer",
      link: "/customers",
    },
    {
      id: "notif-3",
      title: "Hợp đồng đã phê duyệt",
      desc: "Ban Giám đốc đã ký duyệt hợp đồng dịch vụ kho bãi HĐ-2026-0003.",
      time: "3 giờ trước",
      read: false,
      type: "contract",
      link: "/contracts",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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
    STAFF: "Chuyên viên Kinh doanh",
    LEGAL: "Pháp chế",
    ACCOUNTANT: "Kế toán",
  };

  const initials = user.fullName
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827] flex font-sans antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. SIDEBAR NAVIGATION: 240px Fixed, Figma primary/700 Deep Navy branding */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Workspace Header - ABC Logistics */}
          <div className="p-4 border-b border-[#E5E7EB]">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 group"
            >
              <span className="w-10 h-10 rounded-lg bg-[#1E3A8A] text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform duration-200">
                ABC
              </span>
              <div>
                <span className="block text-sm font-bold tracking-tight text-[#111827] leading-tight">
                  ABC LOGISTICS
                </span>
                <span className="block text-[11px] font-medium text-[#2563EB] tracking-wider uppercase mt-0.5">
                  Hệ thống Quản trị QTKD
                </span>
              </div>
            </a>

            {/* Current Department / User Pill */}
            <div className="mt-3.5 p-2 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-[#1E3A8A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#1E3A8A] truncate leading-tight">
                  {user.department?.name ?? "Phòng Kinh doanh"}
                </p>
                <p className="text-[10px] text-[#4B5563] truncate">
                  {roleLabels[role] ?? role}
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" title="Trực tuyến" />
            </div>
          </div>

          {/* Navigation Items List */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-5" aria-label="Menu chính">
            {sections.map((section) => (
              <div key={section} className="space-y-1">
                <span className="block px-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  {section}
                </span>

                <div className="space-y-0.5">
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
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-left ${
                            isActive
                              ? "bg-[#EFF6FF] text-[#2563EB] font-semibold border-l-4 border-[#2563EB]"
                              : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          <span
                            className={`transition-colors ${
                              isActive ? "text-[#2563EB]" : "text-[#9CA3AF]"
                            }`}
                          >
                            <Icon
                              name={item.icon as Parameters<typeof Icon>[0]["name"]}
                              size={18}
                            />
                          </span>
                          <span className="flex-1 truncate">{item.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#E5E7EB] space-y-2">
          <div className="p-2.5 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-[#DBEAFE] text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0">
              ?
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#111827]">Hỗ trợ kỹ thuật</p>
              <p className="text-[10px] text-[#4B5563] truncate">
                support@abclogistics.vn
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] px-1">
            <span>ABC LOGISTICS</span>
            <span className="font-mono text-[10px] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[#4B5563]">
              Sprint 01
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APP CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* STICKY TOPBAR: 64px height, Figma specs Section 3.1 & 3.2.1 */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] focus:outline-none"
              aria-label="Mở Menu"
            >
              <Icon name="menu" size={20} />
            </button>

            {/* Breadcrumbs matching Section 3.1: Trang chủ / Module / Màn hình */}
            <div className="flex items-center gap-2 text-xs text-[#4B5563]">
              <span
                onClick={() => navigate("/")}
                className="hover:text-[#2563EB] cursor-pointer hidden sm:inline"
              >
                Trang chủ
              </span>
              <Icon name="chevron" size={12} className="text-[#9CA3AF]" />
              <span className="font-semibold text-[#111827] text-sm">{pageTitle}</span>
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Global Search */}
            <div className="relative">
              <div className="hidden sm:flex items-center gap-2 w-56 md:w-64 h-9 px-3 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563] text-xs transition-all focus-within:w-72 focus-within:bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15">
                <Icon name="search" size={16} className="text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phân hệ... (Ctrl + K)"
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
                  className="w-full bg-transparent border-0 outline-none text-[#111827] placeholder-[#9CA3AF] text-xs"
                />
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono text-[#9CA3AF] bg-white border border-[#E5E7EB] rounded">
                  ESC
                </kbd>
              </div>

              {/* Search dropdown results */}
              {searchOpen && search.trim() && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#E5E7EB] p-2 z-40 space-y-1">
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
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#EFF6FF] hover:text-[#2563EB] text-xs font-medium text-[#111827] text-left transition-colors"
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
                    <p className="p-3 text-xs text-[#9CA3AF] text-center">
                      Không tìm thấy phân hệ nào
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell (Figma Section 3.1 & 4.9: Icon chuông + badge đỏ số chưa đọc vd "3") */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className="relative p-2 rounded-lg text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                aria-label="Thông báo"
                title="Thông báo hệ thống"
              >
                <Icon name="bell" size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#DC2626] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden animate-fadeIn">
                  <div className="p-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#111827]">Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#DC2626] text-white">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-medium text-[#2563EB] hover:underline"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-[#E5E7EB] max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.link) {
                              navigate(n.link);
                              setNotificationsOpen(false);
                            }
                          }}
                          className={`p-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-start gap-3 ${
                            !n.read ? "bg-[#EFF6FF]/40" : ""
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              !n.read ? "bg-[#2563EB]" : "bg-transparent"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#111827] truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-[#4B5563] mt-0.5 line-clamp-2">
                              {n.desc}
                            </p>
                            <span className="text-[10px] text-[#9CA3AF] mt-1 block">
                              {n.time}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="p-6 text-xs text-[#9CA3AF] text-center">
                        Không có thông báo mới nào
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-[#E5E7EB] hidden sm:block" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#F3F4F6] transition-colors"
                aria-expanded={profileOpen}
              >
                <span className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {initials}
                </span>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-[#111827] leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] font-medium text-[#2563EB]">
                    {roleLabels[role] ?? role}
                  </p>
                </div>
                <Icon name="down" size={14} className="text-[#9CA3AF]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-2 z-50 animate-fadeIn">
                  <div className="p-3 border-b border-[#E5E7EB]">
                    <p className="text-xs font-semibold text-[#111827] truncate">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-[#4B5563] truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-[#1E3A8A] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                      {user.department?.name ?? "Phòng Kinh doanh"}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/profile");
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#111827] hover:bg-[#F3F4F6] transition-colors text-left"
                    >
                      <Icon name="userCog" size={16} />
                      <span>Hồ sơ cá nhân &amp; Quyền</span>
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#DC2626] hover:bg-rose-50 transition-colors text-left"
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

        {/* 3. MAIN ROUTE VIEW - max-w-[1200px] as specified in Figma Section 2.3 */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto">
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
      </div>
    </div>
  );
}

function ModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center shadow-sm">
      <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto mb-4 font-bold text-lg">
        {title.charAt(0)}
      </div>
      <h2 className="text-lg font-bold text-[#111827]">{title}</h2>
      <p className="text-sm text-[#4B5563] max-w-md mx-auto mt-2">
        {description || "Phân hệ đang trong lộ trình phát triển của Sprint tiếp theo."}
      </p>
    </div>
  );
}
