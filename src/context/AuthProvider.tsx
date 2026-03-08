import { createContext, useState, type ReactNode } from "react";
import client from "../api/client";
import { useAuthApi, type LoginPayload } from "../api/hooks/useAuthApi";
import { useQuery } from "@tanstack/react-query";
import { AuthEndpoints } from "../api/endpoints";
import { getUserGuidFromToken, getUserRoleFromToken } from "../utils/jwtUtils";

interface AuthCtx {
  user: { id: string; name: string; email: string } | null;
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
const TEMP_USER = { id: "temp-admin", name: "Admin", email: "admin@bigdays.com" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const { login: loginMutation, logout: logoutMutation } = useAuthApi();

  const [tempUser, setTempUser] = useState<typeof TEMP_USER | null>(() =>
    localStorage.getItem("token") === TEMP_TOKEN ? TEMP_USER : null
  );
  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => client.get(AuthEndpoints.me).then((r) => r.data),
    enabled: false,
  });

  const token = localStorage.getItem("token");
  const userGuid = token !== TEMP_TOKEN ? getUserGuidFromToken(token) : "temp-admin";
  const userRole = token !== TEMP_TOKEN ? getUserRoleFromToken(token) : 1;

  const login = async (creds: LoginPayload): Promise<void> => {
    if (creds.email === TEMP_USER.email && creds.password === "Abc123") {
      localStorage.setItem("token", TEMP_TOKEN);
      setTempUser(TEMP_USER);
      return;
    }
    await loginMutation.mutateAsync(creds);
  };

  const logout = async () => {
    const token = localStorage.getItem("token");
    
    // If temp user, just clear locally
    if (token === TEMP_TOKEN) {
      localStorage.removeItem("token");
      setTempUser(null);
      window.location.replace("/login");
      return;
    }
    
    // Call backend logout API
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always clear local state and redirect
      setTempUser(null);
      window.location.replace("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: tempUser ?? profile ?? null,
        userGuid,
        userRole,
        login,
        logout,
        loading: isLoading || loginMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

