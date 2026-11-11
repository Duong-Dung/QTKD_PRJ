import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import { LoadingScreen } from "./components/LoadingScreen";
import { StandaloneContractApp } from "./pages/StandaloneContractApp";

export default function App() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) return <LoadingScreen />;

  return (
    <Routes>
      {/* 1. Tuyến đường xem trực tiếp Giao diện độc lập Task 29 & Task 32 (Hiệu) - Có thể mở demo ngay mà không cần login */}
      <Route path="/contracts-standalone" element={<StandaloneContractApp />} />
      <Route path="/standalone" element={<StandaloneContractApp />} />

      {/* 2. Cổng đăng nhập & Không gian làm việc tích hợp (Duy Hảo) */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={user ? <AppShell /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
