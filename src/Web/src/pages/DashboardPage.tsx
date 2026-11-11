import { Link, useNavigate } from "react-router-dom";
import type { MenuItem } from "../navigation/menu";
import type { UserDto } from "../types/identity";
import { Icon } from "../components/Icon";

const moduleConfig: Record<
  string,
  {
    tag: string;
    badgeColor: string;
    accentClass: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  customers: {
    tag: "CRM & ĐỐI TÁC",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accentClass: "group-hover:border-emerald-500/40",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  contracts: {
    tag: "PHÁP LÝ & HỢP ĐỒNG",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    accentClass: "group-hover:border-orange-500/40",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  pricing: {
    tag: "CƯỚC PHÍ & PHỤ PHÍ",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    accentClass: "group-hover:border-amber-500/40",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  approvals: {
    tag: "QUY TRÌNH DUYỆT",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
    accentClass: "group-hover:border-violet-500/40",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  production: {
    tag: "SẢN LƯỢNG & ĐIỀU PHỐI",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    accentClass: "group-hover:border-sky-500/40",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  payments: {
    tag: "CÔNG NỢ & ĐỐI SOÁT",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    accentClass: "group-hover:border-teal-500/40",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  users: {
    tag: "TÀI KHOẢN & VAI TRÒ",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    accentClass: "group-hover:border-indigo-500/40",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  audit: {
    tag: "NHẬT KÝ HỆ THỐNG",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    accentClass: "group-hover:border-slate-500/40",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
};

export default function DashboardPage({
  user,
  menu,
}: {
  user: UserDto;
  menu: MenuItem[];
}) {
  const navigate = useNavigate();
  const modules = menu.filter((item) => item.id !== "overview");
  const firstName = user.fullName.split(" ").slice(-1)[0];

  const currentDateFormatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. HERO SECTION: Impressive, Minimalist, Modern, High Contrast */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#0F172A] to-[#1E293B] text-white p-8 sm:p-10 lg:p-12 shadow-2xl border border-slate-800">
        {/* Subtle decorative background glow and mesh */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-orange-300 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>QTKD ABC LOGISTICS 4.0</span>
              <span className="text-white/40">•</span>
              <span className="text-slate-300 font-normal">{currentDateFormatted}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Chào buổi sáng, {firstName}!
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Nền tảng quản trị kinh doanh và chuỗi cung ứng tập trung. Mọi quy trình từ
              hồ sơ khách hàng, hợp đồng pháp lý đến phê duyệt đa cấp đều được tối ưu hóa
              tinh gọn và chuẩn xác.
            </p>

            {/* Primary & Secondary Call to Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => navigate("/contracts")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm shadow-lg shadow-orange-600/30 hover:shadow-orange-600/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>+ Lập Hợp đồng mới</span>
                <Icon name="arrow" size={16} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md border border-white/15 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Icon name="users" size={16} />
                <span>Quản lý Khách hàng</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/overview")}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-slate-300 hover:text-white font-medium text-sm hover:underline transition-colors"
              >
                <span>Xem nhanh chỉ số SLA</span>
                <Icon name="chevron" size={14} />
              </button>
            </div>
          </div>

          {/* Key Metric Highlights on Hero Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3.5 shrink-0">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
              <span className="block text-2xl font-bold text-white tracking-tight">
                99.4%
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Tỷ lệ tuân thủ SLA
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
              <span className="block text-2xl font-bold text-orange-400 tracking-tight">
                2.4h
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Thời gian duyệt TB
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors col-span-2 sm:col-span-1">
              <span className="block text-2xl font-bold text-emerald-400 tracking-tight">
                100%
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Bảo đảm số hóa RBAC
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS OVERVIEW CARDS: Clean Grid with Soft Hover Effects */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Khách hàng đối tác
            </span>
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icon name="users" size={20} />
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              86
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              +4 tháng này
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Doanh nghiệp logistics & kho bãi
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hợp đồng đang thực hiện
            </span>
            <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Icon name="file" size={20} />
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              142
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
              +12.5%
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Số hóa điện tử & lưu trữ an toàn
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Giá trị cam kết
            </span>
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icon name="activity" size={20} />
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              48.5 Tỷ
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              VND
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Tổng giá trị hợp đồng lũy kế 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hồ sơ chờ phê duyệt
            </span>
            <span className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Icon name="check" size={20} />
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              7
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
              Cần xử lý
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Quy trình Pháp chế & Ban Giám đốc
          </p>
        </div>
      </section>

      {/* 3. CORE FUNCTIONAL MODULES: Clean Grid with Modern Minimalist Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              KHÔNG GIAN LÀM VIỆC
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Phân hệ Chức năng
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Truy cập nhanh các phân hệ nghiệp vụ theo vai trò và quyền hạn được cấp.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
            <strong className="text-slate-800">{modules.length}</strong> phân hệ khả dụng
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((item) => {
            const config = moduleConfig[item.id] ?? {
              tag: "NGHIỆP VỤ",
              badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
              accentClass: "group-hover:border-slate-400",
              iconBg: "bg-slate-100",
              iconColor: "text-slate-600",
            };

            return (
              <Link
                key={item.id}
                to={`/${item.id}`}
                className={`group relative flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ${config.accentClass}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`w-12 h-12 rounded-xl ${config.iconBg} ${config.iconColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-200`}
                    >
                      <Icon
                        name={item.icon as Parameters<typeof Icon>[0]["name"]}
                        size={22}
                      />
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md border tracking-wider ${config.badgeColor}`}
                    >
                      {config.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-orange-600 transition-colors">
                  <span>Mở phân hệ</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">
                    <Icon name="arrow" size={15} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. WORKFLOW STATUS & SECURITY OVERVIEW: Split Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Workflow highlights */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quy trình & Hợp đồng cần lưu ý
              </h3>
              <p className="text-xs text-slate-500">
                Các hồ sơ đang trong vòng đời phê duyệt đa cấp
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/contracts")}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                  HĐ
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    HĐ-2026-001 — Vận chuyển Container Cát Lái - Đà Nẵng
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Công ty Cổ phần Vận tải Biển Đông • 1,250,000,000 VND
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Chờ Pháp chế
              </span>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                  HĐ
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    HĐ-2026-002 — Kho bãi ICD Long Bình & Dịch vụ Khai thác
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Công ty TNHH Logistics Nam Á • 850,000,000 VND
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đã phê duyệt
              </span>
            </div>

            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  HĐ
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    HĐ-2026-003 — Dịch vụ Logistics Hải Quan Trọn gói
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Tập đoàn Thủy sản Minh Phú • 2,100,000,000 VND
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Chờ Giám đốc
              </span>
            </div>
          </div>
        </div>

        {/* Right: Security & Role Information Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                TÀI KHOẢN ĐANG HOẠT ĐỘNG
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đang trực tuyến
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3.5">
              <span className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-orange-500/20">
                {user.fullName
                  .split(" ")
                  .slice(-2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {user.fullName}
                </h4>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                <p className="text-[11px] font-semibold text-orange-600 mt-0.5">
                  {user.department?.name ?? "Quản trị hệ thống"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Vai trò RBAC:</span>
              <span className="font-bold text-slate-800">
                {user.roles.join(", ")}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Mã phòng ban:</span>
              <span className="font-bold text-slate-800">
                {user.department?.code ?? "QT"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Bảo mật:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <Icon name="lock" size={13} />
                JWT RSA Token
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-orange-500/50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-semibold transition-all text-center"
          >
            Xem chi tiết Hồ sơ & Quyền hạn →
          </button>
        </div>
      </section>
    </div>
  );
}
