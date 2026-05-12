import { createContext, useState, useEffect, useRef, type ReactNode } from "react";
import client from "../api/client";
import { useAuthApi, useCrewLogin, type LoginPayload, type AuthResponse, type CrewLoginPayload } from "../api/hooks/useAuthApi";
import { AuthEndpoints } from "../api/endpoints";
import { tokenStore, sessionHint, crewTokenStore, crewEventGuidStore } from "../utils/tokenStore";
import { decodeJwt, getUserGuidFromToken, getUserRoleFromToken, isTokenExpired } from "../utils/jwtUtils";

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
  crewLogin: (data: CrewLoginPayload) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthCtx>({
  user: null,
  userGuid: null,
  userRole: null,
  login: async () => {},
  crewLogin: async () => {},
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
  const crewLoginMutation = useCrewLogin();
  const [loading, setLoading] = useState(true);
  // Incrementing this forces a re-render when the in-memory token changes
  const [tokenVersion, setTokenVersion] = useState(0);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Assigned fresh each render so the setTimeout callback always calls the
  // latest closure via the ref — avoids stale capture of setTokenVersion.
  const scheduleProactiveRefreshRef = useRef<(expiresIn: number) => void>(null!);
  scheduleProactiveRefreshRef.current = (expiresIn: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await client.post(AuthEndpoints.refreshToken);
        const authData = data.data ?? data;
        tokenStore.set(authData.accessToken);
        setTokenVersion(v => v + 1);
        if (authData.expiresIn) scheduleProactiveRefreshRef.current(authData.expiresIn);
      } catch {
        tokenStore.clear();
        sessionHint.clear();
        setTokenVersion(v => v + 1);
        if (window.location.pathname !== "/login") window.location.replace("/login");
      }
    }, expiresIn * 800); // fire at 80% of token lifetime
  };

  // Silent session restore on app startup.
  // Only attempt refresh if the session hint flag exists, to avoid a noisy
  // 401 in the console when the user has never logged in.
  useEffect(() => {
    if (!sessionHint.exists()) {
      setLoading(false);
      return;
    }
    client
      .post(AuthEndpoints.refreshToken)
      .then(({ data }) => {
        const authData = data.data ?? data;
        tokenStore.set(authData.accessToken);
        if (authData.expiresIn) scheduleProactiveRefreshRef.current(authData.expiresIn);
        setTokenVersion(v => v + 1);
      })
      .catch(() => {
        // Crew (Staff) tokens have no refresh cookie — fall back to the token
        // stored in sessionStorage if it hasn't expired yet.
        const crewToken = crewTokenStore.get();
        if (crewToken && !isTokenExpired(crewToken)) {
          tokenStore.set(crewToken);
          setTokenVersion(v => v + 1);
          return;
        }
        tokenStore.clear();
        crewTokenStore.clear();
        sessionHint.clear();
      })
      .finally(() => setLoading(false));
  }, []);

  const accessToken = tokenStore.get();
  const user = userFromToken(accessToken);
  const userGuid = getUserGuidFromToken(accessToken);
  const userRole = getUserRoleFromToken(accessToken);

  const login = async (creds: LoginPayload): Promise<void> => {
    const data = await loginMutation.mutateAsync(creds);
    if (data.expiresIn) scheduleProactiveRefreshRef.current(data.expiresIn);
    setTokenVersion(v => v + 1);
  };

  const crewLogin = async (creds: CrewLoginPayload): Promise<void> => {
    await crewLoginMutation.mutateAsync(creds);
    setTokenVersion(v => v + 1);
  };

  const logout = async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      tokenStore.clear();
      crewTokenStore.clear();
      crewEventGuidStore.clear();
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
        crewLogin,
        logout,
        loading: loading || loginMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
