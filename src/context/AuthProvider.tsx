import { createContext, useState, useEffect, type ReactNode } from "react";
import client from "../api/client";
import { useAuthApi, type LoginPayload, type AuthResponse } from "../api/hooks/useAuthApi";
import { AuthEndpoints } from "../api/endpoints";
import { tokenStore, sessionHint } from "../utils/tokenStore";
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

function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
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

  // Silent session restore on app startup.
  // Only attempt refresh if the session hint flag exists, to avoid a noisy
  // 401 in the console when the user has never logged in.
  useEffect(() => {
    if (!sessionHint.exists()) {
      setLoading(false);
      return;
    }
    client
      .post<AuthResponse>(AuthEndpoints.refreshToken)
      .then(({ data }) => {
        tokenStore.set(data.data?.accessToken ?? data.accessToken);
        setTokenVersion(v => v + 1);
      })
      .catch(() => {
        tokenStore.clear();
        sessionHint.clear();
      })
      .finally(() => setLoading(false));
  }, []);

  const accessToken = tokenStore.get();
  const user = userFromToken(accessToken);
  const userGuid = getUserGuidFromToken(accessToken);
  const userRole = getUserRoleFromToken(accessToken);

  const login = async (creds: LoginPayload): Promise<void> => {
    await loginMutation.mutateAsync(creds);
    setTokenVersion(v => v + 1);
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      tokenStore.clear();
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
