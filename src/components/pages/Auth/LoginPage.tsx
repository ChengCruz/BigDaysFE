// src/components/pages/Auth/LoginPage.tsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../api/hooks/useAuth";
import { useAuthApi, useCrewLogin } from "../../../api/hooks/useAuthApi";
import { FormField } from "../../molecules/FormField";
import { PasswordInput } from "../../molecules/PasswordInput";
import { Button } from "../../atoms/Button";
import { Modal } from "../../molecules/Modal";
import { validatePassword } from "../../../utils/passwordValidation";
import { isDevOrStaging } from "../../../utils/env";
import toast from "react-hot-toast";

type ForgotStep = "request" | "reset";
type LoginMode = "admin" | "staff";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { forgotPassword, resetPassword } = useAuthApi();
  const crewLogin = useCrewLogin();
  const nav = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/app";

  const [loginMode, setLoginMode] = useState<LoginMode>("admin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Staff login state
  const [crewCode, setCrewCode] = useState("");
  const [crewPin, setCrewPin] = useState("");
  const [crewEventId, setCrewEventId] = useState("");

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      nav(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!crewCode.trim() || !crewPin) {
      setError("Crew ID and PIN are required.");
      return;
    }
    if (!crewEventId.trim()) {
      setError("Event ID is required.");
      return;
    }
    try {
      await crewLogin.mutateAsync({ crewCode: crewCode.trim(), pin: crewPin, eventId: crewEventId.trim() });
      nav("/app/checkin", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid Crew ID, PIN, or Event ID.");
    }
  };

  const handleOpenForgot = () => {
    setForgotOpen(true);
    setForgotStep("request");
    setForgotEmail(email); // pre-fill with whatever is in the login email field
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError(null);
  };

  const handleCloseForgot = () => {
    setForgotOpen(false);
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (isDevOrStaging()) {
      // Bypass API call in local/staging — navigate directly to the reset page.
      // Manually paste the token from BE logs / console on the reset page.
      setForgotOpen(false);
      nav(`/reset-password?email=${encodeURIComponent(forgotEmail)}`);
      return;
    }

    try {
      await forgotPassword.mutateAsync({ email: forgotEmail });
      setForgotStep("reset");
    } catch (err: any) {
      setForgotError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setForgotError("Password does not meet security requirements:\n" + validation.errors.join("\n"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword.mutateAsync({ email: forgotEmail, token: resetToken, newPassword });
      toast.success("Password reset! Please sign in with your new password.");
      setForgotOpen(false);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || "Invalid or expired token. Please try again.");
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto p-6 bg-background text-text space-y-6">
        <h2 className="text-2xl font-semibold text-center">Sign In</h2>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-white/10 p-1 gap-1">
          <button
            type="button"
            onClick={() => { setLoginMode("admin"); setError(null); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              loginMode === "admin"
                ? "bg-white dark:bg-slate-800 shadow text-text"
                : "text-text/50 dark:text-white/40 hover:text-text dark:hover:text-white"
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode("staff"); setError(null); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              loginMode === "staff"
                ? "bg-white dark:bg-slate-800 shadow text-text"
                : "text-text/50 dark:text-white/40 hover:text-text dark:hover:text-white"
            }`}
          >
            Staff
          </button>
        </div>

        {loginMode === "admin" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="space-y-1">
              <FormField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleOpenForgot}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted">Don't have an account? </span>
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                Create Account
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStaffSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the Crew ID and PIN provided by your event admin.
            </p>
            <FormField
              label="Event ID"
              type="text"
              value={crewEventId}
              onChange={(e) => setCrewEventId(e.target.value)}
              placeholder="Event ID from your admin"
              required
            />
            <FormField
              label="Crew ID"
              type="text"
              value={crewCode}
              onChange={(e) => setCrewCode(e.target.value)}
              placeholder="e.g. CR-001"
              required
            />
            <FormField
              label="PIN"
              type="password"
              value={crewPin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCrewPin(v);
              }}
              placeholder="4–6 digit PIN"
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" variant="primary" disabled={crewLogin.isPending}>
              {crewLogin.isPending ? "Signing in…" : "Sign In as Staff"}
            </Button>
          </form>
        )}
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotOpen}
        onClose={handleCloseForgot}
        title="Reset Password"
        className="max-w-sm"
      >
        {forgotStep === "request" ? (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we'll send you a reset link.
            </p>
            <FormField
              label="Email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            {forgotError && (
              <p className="text-red-500 dark:text-red-400 text-sm whitespace-pre-line">{forgotError}</p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={handleCloseForgot} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={forgotPassword.isPending} className="flex-1">
                {forgotPassword.isPending ? "Sending…" : "Send Reset Link"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the reset token sent to <span className="font-medium text-gray-700 dark:text-gray-300">{forgotEmail}</span> and choose a new password.
            </p>
            <FormField
              label="Reset Token"
              type="text"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              required
              placeholder="Paste your reset token"
            />
            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showValidation
              showStrength
              required
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              showValidation={false}
              showStrength={false}
              required
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            {forgotError && (
              <p className="text-red-500 dark:text-red-400 text-sm whitespace-pre-line">{forgotError}</p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setForgotStep("request")} className="flex-1">
                Back
              </Button>
              <Button type="submit" variant="primary" disabled={resetPassword.isPending} className="flex-1">
                {resetPassword.isPending ? "Resetting…" : "Reset Password"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
