import { createContext, useState, type ReactNode } from "react";
import client from "../api/client";
import { useAuthApi, type LoginPayload } from "../api/hooks/useAuthApi";
import { useQuery } from "@tanstack/react-query";
import { AuthEndpoints } from "../api/endpoints";

interface AuthCtx {
  user: { id: string; name: string; email: string } | null;
  login: (data: LoginPayload) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthCtx>({
  user: null,
  login: async () => {},
  logout: () => {},
  loading: false,
});
// TODO: remove once backend fixes /User/Login SQL bug
const TEMP_TOKEN = "temp-admin-token";
const TEMP_USER = { id: "temp-admin", name: "Admin", email: "admin@bigdays.com" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const { login: loginMutation } = useAuthApi();

  const [tempUser, setTempUser] = useState<typeof TEMP_USER | null>(() =>
    localStorage.getItem("token") === TEMP_TOKEN ? TEMP_USER : null
  );
  const [hasToken, setHasToken] = useState(
    () => !!localStorage.getItem("token") && localStorage.getItem("token") !== TEMP_TOKEN
  );

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => client.get(AuthEndpoints.me).then((r) => r.data),
    enabled: hasToken,
  });

  const login = async (creds: LoginPayload): Promise<void> => {
    if (creds.email === TEMP_USER.email && creds.password === "Abc123") {
      localStorage.setItem("token", TEMP_TOKEN);
      setTempUser(TEMP_USER);
      return;
    }
    await loginMutation.mutateAsync(creds);
    setHasToken(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setHasToken(false);
    setTempUser(null);
    window.location.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user: tempUser ?? profile ?? null,
        login,
        logout,
        loading: isLoading || loginMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

