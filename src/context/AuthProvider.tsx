import { createContext, type ReactNode } from "react";
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
export function AuthProvider({ children }: { children: ReactNode }) {
  const { login: loginMutation } = useAuthApi();
  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["me"],
    queryFn: () => client.get(AuthEndpoints.me).then((r) => r.data),
    enabled: false,
  });

// Declaration of the login function (updated to use LoginPayload)
const login = async (creds: LoginPayload): Promise<void> => {
  await loginMutation.mutateAsync(creds);
};

  const logout = () => {
    localStorage.removeItem("token");
    window.location.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user: profile ?? null,
        login,
        logout,
        loading: isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

