// src/api/hooks/useAuthApi.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { AuthEndpoints, CrewEndpoints } from "../endpoints";
import { tokenStore, sessionHint } from "../../utils/tokenStore";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
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

export interface CrewLoginPayload {
  crewCode: string;
  pin: string;
  eventId: string;
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

  const register = useMutation<{ data: number; message: string; isSuccess: boolean }, Error, RegisterPayload>({
    mutationFn: (data: RegisterPayload) =>
      client.post(AuthEndpoints.register, data).then(r => r.data),
  });

  const forgotPassword = useMutation<{ data: boolean; message: string; isSuccess: boolean }, Error, ForgotPasswordPayload>({
    mutationFn: (data: ForgotPasswordPayload) =>
      client.post(AuthEndpoints.forgotPassword, data).then(r => r.data),
  });

  const resetPassword = useMutation<{ data: boolean; message: string; isSuccess: boolean }, Error, ResetPasswordPayload>({
    mutationFn: (data: ResetPasswordPayload) =>
      client.post(AuthEndpoints.resetPassword, data).then(r => r.data),
  });

  const logout = useMutation<LogoutResponse, Error, void>({
    mutationFn: () =>
      client.post<LogoutResponse>(AuthEndpoints.logout).then(r => r.data),
    onSettled: () => {
      tokenStore.clear();
      sessionHint.clear();
      qc.clear();
      localStorage.removeItem("eventId");
      const walletKeys = Object.keys(localStorage).filter(k => k.startsWith("wallet-budget-"));
      walletKeys.forEach(k => localStorage.removeItem(k));
    },
  });

  return { login, register, logout, forgotPassword, resetPassword };
}

export function useCrewLogin() {
  const qc = useQueryClient();
  return useMutation<AuthResponse, Error, CrewLoginPayload>({
    mutationFn: (data: CrewLoginPayload) =>
      client.post<AuthResponse>(CrewEndpoints.login, data).then(r => r.data),
    onSuccess: (data) => {
      tokenStore.set(data.accessToken);
      sessionHint.set();
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
