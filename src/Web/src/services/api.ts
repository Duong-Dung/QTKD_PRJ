import type {
  ApiProblem,
  CustomerDto,
  LoginResponse,
  PagedResult,
  UserDto,
} from "../types/identity";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5210"
).replace(/\/$/, "");
const REFRESH_TOKEN_KEY = "qtkd.refreshToken";

let accessToken: string | null = null;
let refreshInFlight: Promise<LoginResponse | null> | null = null;
let onSessionExpired: (() => void) | null = null;
let onTokensRefreshed: ((response: LoginResponse) => void) | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function setApiSessionHandlers(handlers: {
  onExpired: () => void;
  onRefreshed: (response: LoginResponse) => void;
}) {
  onSessionExpired = handlers.onExpired;
  onTokensRefreshed = handlers.onRefreshed;
}

export function getStoredRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveSession(response: LoginResponse) {
  accessToken = response.accessToken;
  sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
}

export function clearSession() {
  accessToken = null;
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function readError(response: Response) {
  let problem: ApiProblem = {};
  try {
    problem = (await response.json()) as ApiProblem;
  } catch {
    // Non-JSON error responses still receive a useful status-based message.
  }

  const validationMessage = problem.errors
    ? Object.values(problem.errors).flat().join(" ")
    : "";
  const message =
    problem.detail ||
    validationMessage ||
    problem.title ||
    `Yêu cầu không thành công (${response.status}).`;

  return new ApiError(message, response.status);
}

async function requestRefresh() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      let response: Response;
      try {
        response = await fetch(`${API_BASE_URL}/api/v1/identity/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        throw new ApiError(
          "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.",
          0,
        );
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          clearSession();
          return null;
        }
        throw await readError(response);
      }

      const refreshed = (await response.json()) as LoginResponse;
      saveSession(refreshed);
      onTokensRefreshed?.(refreshed);
      return refreshed;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    if (!(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      "Không thể kết nối máy chủ. Vui lòng kiểm tra máy chủ API và kết nối mạng.",
      0,
    );
  }

  if (response.status === 401 && retryAfterRefresh) {
    try {
      const refreshed = await requestRefresh();
      if (refreshed) return apiRequest<T>(path, init, false);
      clearSession();
      onSessionExpired?.();
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) throw error;
      if (error instanceof ApiError && error.status !== 401 && error.status !== 403) {
        throw error;
      }
      clearSession();
      onSessionExpired?.();
      throw error;
    }
  }

  if (!response.ok) throw await readError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function login(username: string, password: string) {
  const response = await apiRequest<LoginResponse>(
    "/api/v1/identity/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
    false,
  );
  saveSession(response);
  return response;
}

export function refreshSession() {
  return requestRefresh();
}

export function getCurrentUser() {
  return apiRequest<UserDto>("/api/v1/identity/me");
}

export function getUsers() {
  return apiRequest<UserDto[]>("/api/v1/identity/users");
}

export function getCustomers(searchTerm: string, pageIndex: number) {
  const query = new URLSearchParams({
    pageIndex: String(pageIndex),
    pageSize: "8",
  });
  if (searchTerm.trim()) query.set("searchTerm", searchTerm.trim());
  return apiRequest<PagedResult<CustomerDto>>(
    `/api/v1/customers?${query.toString()}`,
  );
}
