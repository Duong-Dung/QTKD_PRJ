export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <span className="brand-mark brand-mark--loading">Q</span>
      <span>Đang khởi tạo không gian làm việc…</span>
    </div>
  );
}
