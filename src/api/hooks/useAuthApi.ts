// src/api/hooks/useAuthApi.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { AuthEndpoints } from "../endpoints";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface LogoutResponse {
  message: string;
}

export function useAuthApi() {
  const qc = useQueryClient();

  const login = useMutation<LoginResponse, Error, LoginPayload>(
    {
      mutationFn: (data: LoginPayload) =>
        client.post<LoginResponse>(AuthEndpoints.login, data).then(r => r.data),
      onSuccess: ({ token }) => {
        localStorage.setItem("token", token);
        qc.invalidateQueries({ queryKey: ["me"] });
      },
    }
  );

  const logout = useMutation<LogoutResponse, Error, void>(
    {
      mutationFn: () =>
        client.post<LogoutResponse>(AuthEndpoints.logout).then(r => r.data),
      onSettled: () => {
        localStorage.removeItem("token");
        qc.clear();
      },
    }
  );

  return { login, logout };
}
