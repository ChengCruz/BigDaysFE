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
  user: { id: string; name: string; email: string };
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

  return { login };
}
