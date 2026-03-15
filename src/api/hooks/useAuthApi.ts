// src/api/hooks/useAuthApi.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { AuthEndpoints } from "../endpoints";
import { tokenStore, sessionHint } from "../../utils/tokenStore";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  userGuid: string;
  role: number;
}

export interface LogoutResponse {
  message: string;
}

export function useAuthApi() {
  const qc = useQueryClient();

  const login = useMutation<AuthResponse, Error, LoginPayload>({
    mutationFn: (data: LoginPayload) =>
      client.post<AuthResponse>(AuthEndpoints.login, data).then(r => r.data),
    onSuccess: (data) => {
      tokenStore.set(data.accessToken);
      sessionHint.set();
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const logout = useMutation<LogoutResponse, Error, void>({
    mutationFn: () =>
      client.post<LogoutResponse>(AuthEndpoints.logout).then(r => r.data),
    onSettled: () => {
      tokenStore.clear();
      sessionHint.clear();
      qc.clear();
    },
  });

  return { login, logout };
}
