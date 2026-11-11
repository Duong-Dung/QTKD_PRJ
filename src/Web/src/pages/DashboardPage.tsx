import { Link } from "react-router-dom";
import type { MenuItem } from "../navigation/menu";
import type { UserDto } from "../types/identity";
import { Icon } from "../components/Icon";

const moduleMeta: Record<string, { number: string; accent: string }> = {
  customers: { number: "01", accent: "mint" },
  contracts: { number: "02", accent: "blue" },
  pricing: { number: "03", accent: "amber" },
  approvals: { number: "04", accent: "violet" },
  production: { number: "05", accent: "orange" },
  payments: { number: "06", accent: "teal" },
  users: { number: "07", accent: "blue" },
  audit: { number: "08", accent: "slate" },
};

export default function DashboardPage({ user, menu }: { user: UserDto; menu: MenuItem[] }) {
  const date = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const modules = menu.filter((item) => item.id !== "overview");
  const firstName = user.fullName.split(" ").slice(-1)[0];

  return (
    <div className="page-enter">
      <section className="welcome-banner">
        <div className="welcome-banner__copy">
          <span className="eyebrow eyebrow--light">{date}</span>
          <h1>Chào buổi sáng, {firstName}<span className="wave">✳</span></h1>
          <p>Chào mừng bạn quay lại. Mọi hoạt động của {user.department?.name ?? "doanh nghiệp"} đều bắt đầu từ đây.</p>
          <div className="welcome-banner__status"><span className="status-dot" /> Không gian của bạn đã sẵn sàng</div>
        </div>
        <div className="welcome-banner__art" aria-hidden="true"><div className="banner-ring banner-ring--one" /><div className="banner-ring banner-ring--two" /><div className="banner-orb">Q</div><span className="banner-spark banner-spark--one">✳</span><span className="banner-spark banner-spark--two">✦</span><span className="banner-coordinate">10° 49' N<br />106° 39' E</span></div>
        <div className="welcome-banner__index">01 <span>/ 04</span></div>
      </section>

      <div className="section-heading">
        <div><span className="eyebrow">ĐIỂM ĐẾN CỦA BẠN</span><h2>Không gian làm việc</h2><p>Truy cập nhanh các phân hệ theo vai trò và quyền hạn.</p></div>
        <span className="module-count"><strong>{String(modules.length).padStart(2, "0")}</strong> phân hệ khả dụng</span>
      </div>

      {modules.length > 0 ? (
        <div className="module-grid">
          {modules.map((item) => {
            const meta = moduleMeta[item.id] ?? { number: "09", accent: "blue" };
            return (
              <Link to={`/${item.id}`} className={`module-card module-card--${meta.accent}`} key={item.id}>
                <div className="module-card__top"><span className="module-card__icon"><Icon name={item.icon as Parameters<typeof Icon>[0]["name"]} size={20} /></span><span className="module-card__number">{meta.number}</span></div>
                <div className="module-card__body"><h3>{item.label}</h3><p>{item.description}</p></div>
                <div className="module-card__bottom"><span>MỞ PHÂN HỆ</span><Icon name="arrow" size={16} /></div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state"><span className="placeholder-icon"><Icon name="grid" /></span><h3>Chưa có phân hệ khả dụng</h3><p>Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.</p></div>
      )}

      <div className="dashboard-bottom">
        <div className="info-card"><div className="info-card__icon"><Icon name="lock" size={19} /></div><div><strong>Quyền truy cập của bạn</strong><p>Menu được cá nhân hóa theo vai trò <b>{user.roles.join(", ")}</b>. API luôn kiểm tra quyền ở máy chủ.</p></div><span className="info-card__badge">RBAC</span></div>
        <div className="profile-mini"><span className="avatar avatar--large">{user.fullName.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase()}</span><div><span className="eyebrow">ĐANG ĐĂNG NHẬP</span><strong>{user.fullName}</strong><span>{user.department?.code ?? "ABC"} · {user.username}</span></div><span className="profile-mini__online" title="Đang hoạt động" /></div>
      </div>
    </div>
  );
}
