import { createContext, useState, useEffect, type ReactNode } from "react";
import client from "../api/client";
import { useAuthApi, type LoginPayload, type AuthResponse } from "../api/hooks/useAuthApi";
import { AuthEndpoints } from "../api/endpoints";
import { tokenStore } from "../utils/tokenStore";
import { decodeJwt, getUserGuidFromToken, getUserRoleFromToken } from "../utils/jwtUtils";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthCtx {
  user: AuthUser | null;
  userGuid: string | null;
  userRole: number | null;
  login: (data: LoginPayload) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthCtx>({
  user: null,
  userGuid: null,
  userRole: null,
  login: async () => {},
  logout: () => {},
  loading: false,
});

// TODO: remove once backend fixes /User/Login SQL bug
const TEMP_TOKEN = "temp-admin-token";
const TEMP_REFRESH = "temp-refresh-token";
const TEMP_USER: AuthUser = { id: "temp-admin", name: "Admin", email: "admin@bigdays.com" };

function userFromToken(token: string | null): AuthUser | null {
  if (!token || token === TEMP_TOKEN) return null;
  const payload = decodeJwt(token);
  if (!payload?.sub) return null;
  return {
    id: payload.sub,
    name: payload.email ?? payload.sub,
    email: payload.email ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { login: loginMutation, logout: logoutMutation } = useAuthApi();
  const [loading, setLoading] = useState(true);
  // Incrementing this forces a re-render when the in-memory token changes
  const [tokenVersion, setTokenVersion] = useState(0);

  // Silent session restore on app startup
  useEffect(() => {
    const stored = localStorage.getItem("refreshToken");
    if (!stored) {
      setLoading(false);
      return;
    }

    // Temp-admin shortcut
    if (stored === TEMP_REFRESH) {
      tokenStore.set(TEMP_TOKEN);
      setTokenVersion(v => v + 1);
      setLoading(false);
      return;
    }

    client
      .post<AuthResponse>(AuthEndpoints.refreshToken, { refreshToken: stored })
      .then(({ data }) => {
        tokenStore.set(data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        setTokenVersion(v => v + 1);
      })
      .catch(() => {
        tokenStore.clear();
        localStorage.removeItem("refreshToken");
      })
      .finally(() => setLoading(false));
  }, []);

  const accessToken = tokenStore.get();
  const isTempUser = accessToken === TEMP_TOKEN;
  const user = isTempUser ? TEMP_USER : userFromToken(accessToken);
  const userGuid = isTempUser ? "temp-admin" : getUserGuidFromToken(accessToken);
  const userRole = isTempUser ? 1 : getUserRoleFromToken(accessToken);

  const login = async (creds: LoginPayload): Promise<void> => {
    if (creds.email === TEMP_USER.email && creds.password === "Abc123") {
      tokenStore.set(TEMP_TOKEN);
      localStorage.setItem("refreshToken", TEMP_REFRESH);
      setTokenVersion(v => v + 1);
      return;
    }
    await loginMutation.mutateAsync(creds);
    setTokenVersion(v => v + 1);
  };

  const logout = async () => {
    try {
      if (!isTempUser) {
        await logoutMutation.mutateAsync();
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      tokenStore.clear();
      localStorage.removeItem("refreshToken");
      setTokenVersion(v => v + 1);
      window.location.replace("/login");
    }
  };

  // tokenVersion is used only to trigger re-renders when token changes
  void tokenVersion;

  return (
    <AuthContext.Provider
      value={{
        user,
        userGuid,
        userRole,
        login,
        logout,
        loading: loading || loginMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
