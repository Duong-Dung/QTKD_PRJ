import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  getCurrentUser,
  getStoredRefreshToken,
  login as loginRequest,
  refreshSession,
  saveSession,
  setApiSessionHandlers,
  ApiError,
} from "../services/api";
import { getFallbackDemoUser } from "../data/demoUsers";
import type { LoginResponse, UserDto } from "../types/identity";

interface AuthContextValue {
  user: UserDto | null;
  isInitializing: boolean;
  initializationError: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const applyRefreshedSession = useCallback((response: LoginResponse) => {
    saveSession(response);
    setUser(response.user);
  }, []);

  useEffect(() => {
    setApiSessionHandlers({
      onExpired: logout,
      onRefreshed: applyRefreshedSession,
    });
    return () => setApiSessionHandlers({ onExpired: () => {}, onRefreshed: () => {} });
  }, [applyRefreshedSession, logout]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        if (getStoredRefreshToken()) {
          const refreshed = await refreshSession();
          if (refreshed) {
            const currentUser = await getCurrentUser();
            if (active) setUser(currentUser);
          }
        }
      } catch (error) {
        if (active) {
          setInitializationError(
            error instanceof Error
              ? error.message
              : "Không thể khôi phục phiên làm việc.",
          );
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await loginRequest(username, password);
      setUser(response.user);
      setInitializationError(null);
    } catch (err: any) {
      // Nếu Backend chưa chạy (Network Error / Status 0), kích hoạt chế độ Demo Ngoại tuyến mượt mà
      if (err instanceof ApiError && err.status === 0) {
        console.warn("Backend API (port 5210) chưa khởi động. Tự động đăng nhập vào chế độ Demo cục bộ.");
        const demoUser = getFallbackDemoUser(username);
        setUser(demoUser);
        setInitializationError(null);
        return;
      }
      throw err;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitializing,
      initializationError,
      login,
      logout,
      hasPermission: (permission) => user?.permissions.includes(permission) ?? false,
    }),
    [user, isInitializing, initializationError, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được dùng trong AuthProvider.");
  return context;
}
