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
          <a className="brand brand--light" href="/login" aria-label="QTKD Logistics">
            <span className="brand-mark">Q</span>
            <span className="brand-name">QTKD<span>LOGISTICS</span></span>
          </a>
          <span className="visual-tag"><span className="status-dot" /> NỀN TẢNG QUẢN TRỊ DOANH NGHIỆP</span>
        </div>

        <div className="visual-copy">
          <span className="eyebrow eyebrow--light">VẬN HÀNH TINH GỌN · TĂNG TRƯỞNG BỀN VỮNG</span>
          <h1>Mọi chuyển động<br />trong tầm kiểm soát.</h1>
          <p>Không gian quản trị tập trung cho hoạt động kinh doanh và vận hành logistics của bạn.</p>
        </div>

        <div className="visual-art" aria-hidden="true">
          <div className="art-glow" />
          <div className="art-orbit art-orbit--one" />
          <div className="art-orbit art-orbit--two" />
          <div className="art-route"><i /><i /><i /><i /></div>
          <div className="art-card art-card--main">
            <div className="art-card__top"><span className="art-icon">↗</span><span className="art-label">QUY TRÌNH VẬN HÀNH</span><span className="art-live">CORE</span></div>
            <div className="art-number">Một<span> hệ thống</span></div>
            <div className="art-caption">Liền mạch từ kinh doanh đến vận hành.</div>
            <div className="art-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="art-card__bottom"><span>KẾT NỐI QUY TRÌNH</span><strong>QTKD WORKSPACE</strong></div>
          </div>
          <div className="art-card art-card--float"><span className="float-icon">✳</span><div><strong>Một không gian</strong><small>Kinh doanh · vận hành</small></div><span className="float-check">✓</span></div>
          <div className="art-annotation"><span /> KẾT NỐI MỌI QUY TRÌNH</div>
        </div>

        <div className="login-visual__footer">
          <span>© 2026 QTKD ABC Logistics</span>
          <span className="footer-dash" />
          <span>Được thiết kế cho những hành trình lớn.</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-mobile-brand brand">
          <span className="brand-mark">Q</span>
          <span className="brand-name">QTKD<span>LOGISTICS</span></span>
        </div>
        <div className="login-form-wrap">
          <div className="login-heading">
            <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
            <h2>Đăng nhập</h2>
            <p>Đăng nhập để tiếp tục vào không gian làm việc của bạn.</p>
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
              <button type="button" className="text-button" onClick={() => setError("Nếu bạn quên mật khẩu, vui lòng liên hệ quản trị viên để được hỗ trợ.")}>Quên mật khẩu?</button>
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
              {isSubmitting ? <><span className="button-spinner" /> Đang xác thực…</> : <>Đăng nhập <Icon name="arrow" size={17} /></>}
            </button>
          </form>

          {/* Cụm tài khoản mẫu điền nhanh */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
            <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              🔑 Tài khoản mẫu dùng thử (Click để điền nhanh):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => { setUsername('admin'); setPassword('P@ssword123!'); }}
                style={{ textAlign: 'left', padding: '6px 8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
              >
                <strong>admin</strong> <span style={{ color: '#64748b' }}>(Quản trị)</span>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('giamdoc'); setPassword('P@ssword123!'); }}
                style={{ textAlign: 'left', padding: '6px 8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
              >
                <strong>giamdoc</strong> <span style={{ color: '#64748b' }}>(Giám đốc)</span>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('tp_kinhdoanh'); setPassword('P@ssword123!'); }}
                style={{ textAlign: 'left', padding: '6px 8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
              >
                <strong>tp_kinhdoanh</strong> <span style={{ color: '#64748b' }}>(Trưởng phòng)</span>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('nv_kinhdoanh'); setPassword('P@ssword123!'); }}
                style={{ textAlign: 'left', padding: '6px 8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
              >
                <strong>nv_kinhdoanh</strong> <span style={{ color: '#64748b' }}>(Nhân viên)</span>
              </button>
            </div>
            <div style={{ marginTop: '8px', color: '#64748b', fontSize: '11px' }}>
              Mật khẩu mặc định: <code style={{ background: '#e2e8f0', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>P@ssword123!</code>
            </div>
          </div>

          <div className="login-security"><Icon name="lock" size={15} /><span>Phiên làm việc được duy trì an toàn trên tab này</span></div>
          <div className="login-help">Cần hỗ trợ? <a href="mailto:support@qtkd.com">Liên hệ bộ phận quản trị</a></div>
        </div>
        <div className="login-panel__footer"><span>QTKD LOGISTICS</span><span>ĐIỀU KHOẢN &nbsp;·&nbsp; QUYỀN RIÊNG TƯ</span></div>
      </section>
    </main>
  );
}
