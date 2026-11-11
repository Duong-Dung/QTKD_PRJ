import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import { LoadingScreen } from "./components/LoadingScreen";

export default function App() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) return <LoadingScreen />;

  return (
    <Routes>
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
