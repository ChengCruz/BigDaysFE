// src/api/hooks/useAuthApi.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../client";
import { AuthEndpoints, CrewEndpoints } from "../endpoints";
import { tokenStore, sessionHint, crewTokenStore, crewEventGuidStore } from "../../utils/tokenStore";
import { turnstileHeaders } from "../../utils/turnstile";
import { trackEvent } from "../../utils/analytics";
import { clearDemoArtifacts } from "../../demo";

export interface LoginPayload {
  email: string;
  password: string;
  /** Cloudflare Turnstile token; sent as a header, not part of the body. */
  captchaToken?: string;
}

export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
  /** Cloudflare Turnstile token; sent as a header, not part of the body. */
  captchaToken?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationCodePayload {
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  userGuid: string;
  role: number;
  eventGuid?: string;
}

export interface LogoutResponse {
  message: string;
}

export interface CrewLoginPayload {
  crewCode: string;
  pin: string;
  eventCode: string;
}

export function useAuthApi() {
  const qc = useQueryClient();

  const login = useMutation<AuthResponse, Error, LoginPayload>({
    mutationFn: ({ captchaToken, ...data }: LoginPayload) =>
      client
        .post<{ data: AuthResponse }>(AuthEndpoints.login, data, { headers: turnstileHeaders(captchaToken) })
        .then(r => r.data.data),
    onSuccess: (data) => {
      tokenStore.set(data.accessToken);
      sessionHint.set();
      // A real session invalidates demo mode; drop any leftovers before the
      // event query runs, so the adapter never serves sample data to this user.
      clearDemoArtifacts();
      qc.invalidateQueries({ queryKey: ["me"] });
      trackEvent("login", { method: "password" });
    },
  });

  const register = useMutation<{ data: number; message: string; isSuccess: boolean }, Error, RegisterPayload>({
    mutationFn: ({ captchaToken, ...data }: RegisterPayload) =>
      client.post(AuthEndpoints.register, data, { headers: turnstileHeaders(captchaToken) }).then(r => r.data),
    onSuccess: (res) => {
      // The BE returns some failures as HTTP 200 with isSuccess:false, so a
      // resolved mutation is not proof the account was created.
      if (res?.isSuccess !== false) trackEvent("sign_up_submitted");
    },
  });

  const forgotPassword = useMutation<{ data: boolean; message: string; isSuccess: boolean }, Error, ForgotPasswordPayload>({
    mutationFn: (data: ForgotPasswordPayload) =>
      client.post(AuthEndpoints.forgotPassword, data).then(r => r.data),
  });

  const resetPassword = useMutation<{ data: boolean; message: string; isSuccess: boolean }, Error, ResetPasswordPayload>({
    mutationFn: (data: ResetPasswordPayload) =>
      client.post(AuthEndpoints.resetPassword, data).then(r => r.data),
  });

  const verifyEmail = useMutation<{ data: boolean; message: string; isSuccess: boolean }, Error, VerifyEmailPayload>({
    mutationFn: (data: VerifyEmailPayload) =>
      client.post(AuthEndpoints.verifyEmail, data).then(r => r.data),
  });

  // Issues a fresh code and invalidates the previous one. The backend answers the same way
  // whether or not the address is pending, so the response can never confirm an account exists.
  const resendVerificationCode = useMutation<{ data: boolean; message: string; isSuccess: boolean }, Error, ResendVerificationCodePayload>({
    mutationFn: (data: ResendVerificationCodePayload) =>
      client.post(AuthEndpoints.resendVerificationCode, data).then(r => r.data),
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
      clearDemoArtifacts();
    },
  });

  return { login, register, logout, forgotPassword, resetPassword, verifyEmail, resendVerificationCode };
}

export function useCrewLogin() {
  const qc = useQueryClient();
  return useMutation<AuthResponse, Error, CrewLoginPayload>({
    mutationFn: (data: CrewLoginPayload) =>
      client.post<{ data: AuthResponse }>(CrewEndpoints.login, data).then(r => r.data.data),
    onSuccess: (data) => {
      tokenStore.set(data.accessToken);
      crewTokenStore.set(data.accessToken);
      if (data.eventGuid) crewEventGuidStore.set(data.eventGuid);
      sessionHint.set();
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
