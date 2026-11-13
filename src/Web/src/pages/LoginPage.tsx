import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../services/api";
import { Icon } from "../components/Icon";

export default function LoginPage() {
  const { login, initializationError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (loginError) {
      if (loginError instanceof ApiError && loginError.status === 401) {
        setError("Tên đăng nhập hoặc mật khẩu chưa chính xác.");
      } else if (loginError instanceof ApiError && loginError.status === 403) {
        setError("Tài khoản hiện không hoạt động. Vui lòng liên hệ quản trị viên.");
      } else {
        setError(
          loginError instanceof Error
            ? loginError.message
            : "Đăng nhập chưa thành công. Vui lòng thử lại.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual__top">
          <a className="brand brand--light" href="/login" aria-label="ABC Logistics">
            <span className="brand-mark">ABC</span>
            <span className="brand-name">ABC LOGISTICS<span>HỆ THỐNG QUẢN TRỊ KINH DOANH</span></span>
          </a>
          <span className="visual-tag"><span className="status-dot" /> NỀN TẢNG DOANH NGHIỆP 4.0</span>
        </div>

        <div className="visual-copy">
          <span className="eyebrow eyebrow--light">VẬN HÀNH TINH GỌN · PHÊ DUYỆT ĐA CẤP</span>
          <h1>Quản trị hợp đồng &amp;<br />chuỗi cung ứng cảng biển.</h1>
          <p>Không gian quản trị tập trung toàn diện cho hoạt động kinh doanh, khách hàng, hợp đồng và dịch vụ logistics của ABC Logistics.</p>
        </div>

        <div className="visual-art" aria-hidden="true">
          <div className="art-glow" />
          <div className="art-orbit art-orbit--one" />
          <div className="art-orbit art-orbit--two" />
          <div className="art-route"><i /><i /><i /><i /></div>
          <div className="art-card art-card--main">
            <div className="art-card__top"><span className="art-icon">⚓</span><span className="art-label">QUY TRÌNH HỢP ĐỒNG LOGISTICS</span><span className="art-live">ACTIVE</span></div>
            <div className="art-number">ABC<span> Logistics</span></div>
            <div className="art-caption">Liền mạch từ kinh doanh, rà soát pháp chế đến ký duyệt.</div>
            <div className="art-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="art-card__bottom"><span>KẾT NỐI VẬN HÀNH</span><strong>QTKD WORKSPACE</strong></div>
          </div>
          <div className="art-card art-card--float"><span className="float-icon">🚢</span><div><strong>Cảng &amp; Kho ICD</strong><small>Dịch vụ · Khai thác cảng</small></div><span className="float-check">✓</span></div>
          <div className="art-annotation"><span /> FIGMA SPEC DESIGN COMPLIANT</div>
        </div>

        <div className="login-visual__footer">
          <span>© 2026 ABC Logistics Solution</span>
          <span className="footer-dash" />
          <span>Thiết kế theo chuẩn Figma Design Pack QTKD.</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-mobile-brand brand">
          <span className="brand-mark">ABC</span>
          <span className="brand-name">ABC LOGISTICS<span>QTKD 4.0</span></span>
        </div>
        <div className="login-form-wrap">
          <div className="login-heading">
            <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
            <h2>Đăng nhập</h2>
            <p>Đăng nhập để vào hệ thống Quản trị kinh doanh ABC Logistics.</p>
          </div>

          {(error || initializationError) && (
            <div className="form-alert" role="alert">
              <span className="alert-icon">!</span>
              <span>{error || `Không thể khôi phục phiên trước: ${initializationError}`}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="username">Tên đăng nhập hoặc email</label>
            <div className="input-wrap">
              <Icon name="userCog" size={18} />
              <input
                autoComplete="username"
                id="username"
                name="username"
                placeholder="Nhập tên đăng nhập hoặc email"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="password-label">
              <label htmlFor="password">Mật khẩu</label>
              <button type="button" className="text-button" onClick={() => setError("Nếu bạn quên mật khẩu, vui lòng liên hệ quản trị viên IT để được cấp lại.")}>Quên mật khẩu?</button>
            </div>
            <div className="input-wrap">
              <Icon name="lock" size={18} />
              <input
                autoComplete="current-password"
                id="password"
                name="password"
                placeholder="Nhập mật khẩu"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="icon-button password-toggle"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>

            <button type="submit" className="button button--primary login-submit" disabled={isSubmitting}>
              {isSubmitting ? <><span className="button-spinner" /> Đang xác thực…</> : <>Đăng nhập hệ thống <Icon name="arrow" size={17} /></>}
            </button>
          </form>

          {/* Quick-fill Test User Accounts */}
          <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px dashed #e2e8f0", fontSize: "0.82rem" }}>
            <div style={{ fontWeight: 600, color: "#1e3a8a", marginBottom: "0.5rem" }}>
              Tài khoản mẫu (Bấm để điền nhanh &amp; đăng nhập):
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              <button
                type="button"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  textAlign: "left",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => { setUsername("nv_kinhdoanh"); setPassword("Password123!"); setError(""); }}
              >
                📋 Chuyên viên KD
              </button>
              <button
                type="button"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  textAlign: "left",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => { setUsername("tp_kinhdoanh"); setPassword("Password123!"); setError(""); }}
              >
                💼 Trưởng phòng KD
              </button>
              <button
                type="button"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  textAlign: "left",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => { setUsername("giamdoc"); setPassword("Password123!"); setError(""); }}
              >
                👔 Ban Giám đốc
              </button>
              <button
                type="button"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  textAlign: "left",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => { setUsername("admin"); setPassword("Password123!"); setError(""); }}
              >
                🔑 Quản trị hệ thống
              </button>
            </div>
          </div>

          <div className="login-security">
            <Icon name="lock" size={15} />
            <span>Kết nối bảo mật chuẩn SSL &amp; JWT Bearer Authentication</span>
          </div>
          <div className="login-help">
            Cần hỗ trợ kỹ thuật? <a href="mailto:support@abclogistics.vn">support@abclogistics.vn</a>
          </div>
        </div>
        <div className="login-panel__footer">
          <span>ABC LOGISTICS SOLUTION</span>
          <span>BẢO MẬT &nbsp;·&nbsp; QUYỀN RIÊNG TƯ &nbsp;·&nbsp; SPRINT 01</span>
        </div>
      </section>
    </main>
  );
}
