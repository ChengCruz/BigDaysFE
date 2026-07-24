// src/components/pages/Auth/LoginPage.tsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../../../api/hooks/useAuth";
import { useAuthApi } from "../../../api/hooks/useAuthApi";
import { FormField } from "../../molecules/FormField";
import { PasswordInput } from "../../molecules/PasswordInput";
import { Button } from "../../atoms/Button";
import { BrandWordmark } from "../../atoms/BrandWordmark";
import AuthBrandPanel from "./AuthBrandPanel";
import { Modal } from "../../molecules/Modal";
import { validatePassword } from "../../../utils/passwordValidation";
import { isDevOrStaging } from "../../../utils/env";
import { apiErrorMessage } from "../../../utils/apiError";
import TurnstileWidget from "../../molecules/TurnstileWidget";
import { isTurnstileEnabled } from "../../../utils/turnstile";
import toast from "react-hot-toast";
import { EyeIcon, EyeOffIcon } from "@heroicons/react/solid";

type ForgotStep = "request" | "reset";

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 0',
  border: 'none',
  borderBottom: '1px solid #EDE4D3',
  background: 'transparent',
  fontFamily: 'var(--font-serif)',
  fontSize: '1.1rem',
  color: '#2A221E',
  outline: 'none',
  transition: 'border-color 0.3s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-label)',
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: '#6B5D50',
  marginBottom: '0.6rem',
};

export default function LoginPage() {
  const { login, loading, user } = useAuth();
  const { forgotPassword, resetPassword } = useAuthApi();
  const nav = useNavigate();
  const location = useLocation();
  const rawFrom = (location.state as any)?.from?.pathname || "/app";
  const FULLSCREEN_FALLBACKS: Record<string, string> = {
    "/app/tables/fullscreen": "/app/tables",
    "/app/rsvps/designer-v3": "/app/events",
  };
  const from = FULLSCREEN_FALLBACKS[rawFrom] ?? rawFrom;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumping this remounts the widget to obtain a fresh single-use token after a failed submit.
  const [captchaNonce, setCaptchaNonce] = useState(0);

  const [showPassword, setShowPassword] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isTurnstileEnabled && !captchaToken) {
      setError("Please complete the CAPTCHA below.");
      return;
    }
    try {
      await login({ email, password, captchaToken: captchaToken ?? undefined });
      nav(from, { replace: true });
    } catch (err: any) {
      // Token is single-use — refresh the widget so the user can retry.
      setCaptchaToken(null);
      setCaptchaNonce((n) => n + 1);
      const errorCode = err.response?.data?.errorCode;
      if (errorCode === "ACCOUNT_NOT_ACTIVE") {
        setError("account_not_active");
      } else {
        setError(apiErrorMessage(err, "Login failed"));
      }
    }
  };

  const handleOpenForgot = () => {
    setForgotOpen(true);
    setForgotStep("request");
    setForgotEmail(email);
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError(null);
  };

  const handleUseDifferentEmail = () => {
    // Re-requesting issues a fresh token, so drop the old one — leaving it in the
    // field means the next submit fails with a confusing "invalid token".
    setForgotStep("request");
    setResetToken("");
    setForgotError(null);
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (isDevOrStaging()) {
      // Non-prod: ForgotPassword sends no email and returns the reset token in the
      // response message. Fetch it and deep-link into the reset screen with the token
      // pre-filled so the dev test path works now that the token is validated everywhere.
      try {
        const res = await forgotPassword.mutateAsync({ email: forgotEmail });
        const devToken = /reset password:\s*(\S+)/i.exec(res.message ?? "")?.[1] ?? "";
        // No token in the response means this env emails it instead — fall through
        // to the in-modal reset step rather than deep-linking with an empty token.
        if (!devToken) { setForgotStep("reset"); return; }
        setForgotOpen(false);
        const q = new URLSearchParams({ email: forgotEmail, token: devToken });
        nav(`/reset-password?${q.toString()}`);
      } catch (err: any) {
        setForgotError(apiErrorMessage(err, "Something went wrong. Please try again."));
      }
      return;
    }
    try {
      await forgotPassword.mutateAsync({ email: forgotEmail });
      setForgotStep("reset");
    } catch (err: any) {
      setForgotError(apiErrorMessage(err, "Something went wrong. Please try again."));
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
    if (newPassword !== confirmPassword) { setForgotError("Passwords do not match."); return; }
    try {
      await resetPassword.mutateAsync({ email: forgotEmail, token: resetToken, newPassword });
      toast.success("Password reset! Please sign in with your new password.");
      setForgotOpen(false);
    } catch (err: any) {
      setForgotError(apiErrorMessage(err, "Invalid or expired token. Please try again."));
    }
  };

  return (
    <>
      {/* Split-panel layout */}
      <div
        style={{
          display: 'grid',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
        className="grid-cols-1 md:grid-cols-2 content-start md:content-stretch"
      >
        {/* ── Left panel: brand showcase (cream) ── */}
        <AuthBrandPanel />

        {/* ── Right panel: form ── */}
        <div
          style={{
            background: '#FAF6EF',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
          className="px-6 md:px-20"
        >
          <div style={{ maxWidth: '26rem', width: '100%', margin: 'auto', padding: '2rem 0' }}>

            {/* Eyebrow */}
            <div className="eyebrow" style={{ marginBottom: '1.25rem' }}>Welcome Back</div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                marginBottom: '0.75rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
              }}
            >
              Sign <em style={{ fontStyle: 'italic', color: '#B4543A' }}>in.</em>
            </h1>

            <p style={{ color: '#6B5D50', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
              Sign in with the email and password you registered with to access your planning dashboard.
            </p>

            {/* Admin form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                    onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{ ...inputStyle, paddingRight: '2.5rem' }}
                      onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                      onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#6B5D50' }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon style={{ width: '1.1rem', height: '1.1rem' }} /> : <EyeIcon style={{ width: '1.1rem', height: '1.1rem' }} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleOpenForgot}
                    style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B4543A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>

                {error && (
                  error === "account_not_active" ? (
                    <p style={{ color: '#EF4444', fontSize: '0.9rem', fontFamily: 'var(--font-serif)' }}>
                      Your email isn't verified yet.
                      <br />
                      <Link to="/verify-email" style={{ color: '#EF4444', borderBottom: '1px solid #EF4444', paddingBottom: '1px' }}>
                        Enter your verification code
                      </Link>
                    </p>
                  ) : (
                    <p style={{ color: '#EF4444', fontSize: '0.9rem', fontFamily: 'var(--font-serif)' }}>{error}</p>
                  )
                )}

                {isTurnstileEnabled && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <TurnstileWidget
                      key={captchaNonce}
                      action="login"
                      theme="light"
                      onVerify={setCaptchaToken}
                      onExpire={() => setCaptchaToken(null)}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (isTurnstileEnabled && !captchaToken)}
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    background: loading ? '#6B5D50' : '#2A221E',
                    color: '#FAF6EF',
                    border: 'none',
                    fontFamily: 'var(--font-label)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase' as const,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.3s ease',
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#B4543A'; }}
                  onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#2A221E'; }}
                >
                  {loading ? "Signing in…" : "Enter the Portal →"}
                </button>

                <div style={{ textAlign: 'center', color: '#6B5D50', fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>
                  Don't have an account?{" "}
                  <Link to="/register" style={{ color: '#B4543A', textDecoration: 'none', borderBottom: '1px solid #B4543A', paddingBottom: '1px' }}>
                    Create Account
                  </Link>
                </div>

                {/* Quiet crew entry point — kept off the public nav; crew normally arrive via the invite link */}
                <div style={{ textAlign: 'center', marginTop: '0.25rem', paddingTop: '1.25rem', borderTop: '1px solid #EDE4D3', fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  <Link to="/crew-login" style={{ color: '#6B5D50', textDecoration: 'none' }}>
                    Checking in guests as event crew? <span style={{ color: '#B4543A' }}>Crew sign-in →</span>
                  </Link>
                </div>
              </form>
          </div>

          {/* Mobile-only footer — brand context the desktop left panel already provides */}
          <footer
            className="md:hidden"
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              paddingBottom: '0.5rem',
              borderTop: '1px solid #EDE4D3',
              textAlign: 'center',
            }}
          >
            <BrandWordmark size="1.1rem" />
            <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-label)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6B5D50' }}>
              Planned with love · © {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </div>

      {/* Forgot Password Modal (existing logic, preserved) */}
      <Modal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset Password" className="max-w-sm" showCloseButton>
        {forgotStep === "request" ? (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we'll send you a reset link.
            </p>
            <FormField label="Email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required placeholder="you@example.com" />
            {forgotError && <p className="text-red-500 text-sm whitespace-pre-line">{forgotError}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setForgotOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" variant="primary" disabled={forgotPassword.isPending} className="flex-1">
                {forgotPassword.isPending ? "Sending…" : "Send Reset Link"}
              </Button>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline" onClick={() => setForgotOpen(false)}>
                Create one
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the reset token sent to <span className="font-medium text-gray-700 dark:text-gray-300">{forgotEmail}</span> and choose a new password.
            </p>
            <FormField label="Reset Token" type="text" value={resetToken} onChange={e => setResetToken(e.target.value)} required placeholder="Paste your reset token" />
            <PasswordInput label="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} showValidation showStrength required placeholder="Create a strong password" autoComplete="new-password" />
            <PasswordInput label="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} showValidation={false} showStrength={false} required placeholder="Re-enter your password" autoComplete="new-password" />
            {forgotError && <p className="text-red-500 text-sm whitespace-pre-line">{forgotError}</p>}
            <div className="flex flex-col gap-2">
              <Button type="submit" variant="primary" disabled={resetPassword.isPending} className="w-full">
                {resetPassword.isPending ? "Resetting…" : "Reset Password"}
              </Button>
              <Button type="button" variant="ghost" onClick={handleUseDifferentEmail} className="w-full">Use a different email</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
