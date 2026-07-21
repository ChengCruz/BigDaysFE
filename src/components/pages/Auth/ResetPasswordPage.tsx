// src/components/pages/Auth/ResetPasswordPage.tsx
// Production reset-password screen. Reached from the email CTA deep-link
// {{AppUrl}}/reset-password?email=<urlencoded>&token=<code>.
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthApi } from "../../../api/hooks/useAuthApi";
import { PasswordInput } from "../../molecules/PasswordInput";
import { FormField } from "../../molecules/FormField";
import { Button } from "../../atoms/Button";
import { validatePassword } from "../../../utils/passwordValidation";
import { isDevOrStaging } from "../../../utils/env";
import { apiErrorMessage } from "../../../utils/apiError";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { resetPassword } = useAuthApi();

  // URLSearchParams already decodes percent-encoding, so `email` (%40 → @) arrives ready to use.
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError("Password does not meet requirements:\n" + validation.errors.join("\n"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword.mutateAsync({ email, token, newPassword });
      toast.success("Password reset! Please sign in with your new password.");
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(apiErrorMessage(err, "Invalid or expired token. Please try again."));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-background rounded-2xl shadow-lg">
        {/* Dev/Staging banner — hidden in production */}
        {isDevOrStaging() && (
          <div className="bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-400 rounded-lg px-4 py-2 text-xs text-yellow-800 dark:text-yellow-300 font-medium text-center">
            DEV / STAGING — token is returned in the ForgotPassword response body (no email sent)
          </div>
        )}

        <h2 className="text-2xl font-semibold text-center">Reset Password</h2>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          Enter the reset code from your email and choose a new password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          <FormField
            label="Reset Code"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="Enter the code from your reset email"
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

          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm whitespace-pre-line">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/login")}
              className="flex-1"
            >
              Back to Login
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={resetPassword.isPending}
              className="flex-1"
            >
              {resetPassword.isPending ? "Resetting…" : "Reset Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
