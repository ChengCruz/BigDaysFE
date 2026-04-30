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
import { EyeIcon, EyeOffIcon } from "@heroicons/react/solid";

type ForgotStep = "request" | "reset";
type LoginMode = "admin" | "staff";

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '1rem 0',
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
  color: '#7A6B5D',
  marginBottom: '0.6rem',
};

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

  const [crewCode, setCrewCode] = useState("");
  const [crewPin, setCrewPin] = useState("");
  const [crewEventId, setCrewEventId] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showCrewPin, setShowCrewPin] = useState(false);

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
    if (!crewCode.trim() || !crewPin) { setError("Crew ID and PIN are required."); return; }
    if (!crewEventId.trim()) { setError("Event ID is required."); return; }
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
    setForgotEmail(email);
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError(null);
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (isDevOrStaging()) {
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
    if (newPassword !== confirmPassword) { setForgotError("Passwords do not match."); return; }
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
      {/* Split-panel layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: 'calc(100vh - 77px)',
        }}
        className="grid-cols-1 md:grid-cols-2"
      >
        {/* ── Left panel: brand visual ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #B4543A 0%, #5C1F1B 60%, #2A221E 100%)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '3rem',
          }}
          className="hidden md:flex"
        >
          {/* Botanical overlay */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 800"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}
            aria-hidden
          >
            <g fill="none" stroke="#FAF6EF" strokeWidth="1.2">
              <path d="M150 780 Q160 600 180 450 Q200 280 190 120" />
              <path d="M175 520 Q140 500 115 470" />
              <path d="M180 470 Q215 450 240 420" />
              <path d="M175 400 Q145 385 120 355" />
              <path d="M180 350 Q215 330 240 300" />
              <ellipse cx="115" cy="470" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
              <ellipse cx="240" cy="420" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
              <ellipse cx="120" cy="355" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
              <ellipse cx="240" cy="300" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
              <path d="M450 780 Q445 650 460 530 Q475 410 470 270" />
              <path d="M460 580 Q495 560 520 530" />
              <path d="M455 500 Q420 485 395 455" />
              <ellipse cx="520" cy="530" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
              <ellipse cx="395" cy="455" rx="10" ry="5" fill="#FAF6EF" opacity="0.5" />
            </g>
          </svg>

          {/* Top: brand mark */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.6rem', color: '#FAF6EF', letterSpacing: '0.1em' }}>
              My<span style={{ color: '#A9895A' }}>·</span>Big<span style={{ color: '#A9895A' }}>·</span>Day
            </span>
          </div>

          {/* Middle: headline */}
          <div style={{ position: 'relative', zIndex: 2, color: '#FAF6EF' }}>
            <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#A9895A', marginBottom: '1.5rem' }}>
              Client Portal
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                lineHeight: 1.1,
                marginBottom: '2rem',
                color: '#FAF6EF',
                letterSpacing: '-0.02em',
              }}
            >
              Your planning,<br />all in{" "}
              <em style={{ fontStyle: 'italic', color: '#A9895A' }}>one place.</em>
            </h2>
            <p style={{ color: 'rgba(250,246,239,0.75)', fontSize: '1.1rem', maxWidth: '28rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
              Access your events, guest lists, seating charts, and RSVP responses — everything built together, whenever you need it.
            </p>
            <blockquote
              style={{
                borderLeft: '1px solid #A9895A',
                paddingLeft: '1.25rem',
                marginTop: '2rem',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '1.1rem',
                color: 'rgba(250,246,239,0.9)',
                maxWidth: '26rem',
              }}
            >
              "I logged in the week of the wedding and realised how much had been quietly handled. Everything accounted for."
              <span style={{ display: 'block', marginTop: '0.75rem', fontFamily: 'var(--font-label)', fontStyle: 'normal', fontSize: '0.65rem', letterSpacing: '0.25em', color: '#A9895A', textTransform: 'uppercase' }}>
                — Sarah &amp; James · London, 2025
              </span>
            </blockquote>
          </div>

          {/* Bottom */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-label)',
              fontSize: '0.65rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(250,246,239,0.5)',
            }}
          >
            <span>Secure · Encrypted</span>
            <span>Est. 2024</span>
          </div>
        </div>

        {/* ── Right panel: form ── */}
        <div
          style={{
            background: '#FAF6EF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '3rem 5rem',
            position: 'relative',
          }}
          className="px-6 md:px-20"
        >
          <div style={{ maxWidth: '26rem', width: '100%', margin: '0 auto' }}>

            {/* Eyebrow */}
            <div className="eyebrow" style={{ marginBottom: '2rem' }}>Welcome Back</div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                marginBottom: '1rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
              }}
            >
              Sign <em style={{ fontStyle: 'italic', color: '#B4543A' }}>in.</em>
            </h1>

            <p style={{ color: '#7A6B5D', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
              Enter your credentials to access your planning dashboard.
            </p>

            {/* Mode toggle */}
            <div
              style={{
                display: 'flex',
                background: '#EDE4D3',
                borderRadius: '2px',
                padding: '3px',
                gap: '3px',
                marginBottom: '2rem',
              }}
            >
              {(['admin', 'staff'] as LoginMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setLoginMode(mode); setError(null); }}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontFamily: 'var(--font-label)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase' as const,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: loginMode === mode ? '#FAF6EF' : 'transparent',
                    color: loginMode === mode ? '#2A221E' : '#7A6B5D',
                    boxShadow: loginMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {mode === 'admin' ? 'Admin' : 'Staff'}
                </button>
              ))}
            </div>

            {/* Admin form */}
            {loginMode === "admin" ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#7A6B5D' }}
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

                {error && <p style={{ color: '#B4543A', fontSize: '0.9rem', fontFamily: 'var(--font-serif)' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    background: loading ? '#7A6B5D' : '#2A221E',
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

                <div style={{ textAlign: 'center', color: '#7A6B5D', fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>
                  Don't have an account?{" "}
                  <Link to="/register" style={{ color: '#B4543A', textDecoration: 'none', borderBottom: '1px solid #B4543A', paddingBottom: '1px' }}>
                    Create Account
                  </Link>
                </div>
              </form>
            ) : (
              /* Staff form */
              <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <p style={{ color: '#7A6B5D', fontSize: '1rem', fontFamily: 'var(--font-serif)', lineHeight: 1.6 }}>
                  Enter the Crew ID and PIN provided by your event admin.
                </p>
                <div>
                  <label style={labelStyle}>Event ID</label>
                  <input
                    type="text"
                    required
                    value={crewEventId}
                    onChange={e => setCrewEventId(e.target.value)}
                    placeholder="Event ID from your admin"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                    onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Crew ID</label>
                  <input
                    type="text"
                    required
                    value={crewCode}
                    onChange={e => setCrewCode(e.target.value)}
                    placeholder="e.g. CR-001"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                    onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>PIN</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCrewPin ? "text" : "password"}
                      required
                      value={crewPin}
                      onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setCrewPin(v); }}
                      placeholder="4–6 digit PIN"
                      style={{ ...inputStyle, paddingRight: '2.5rem' }}
                      onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                      onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCrewPin(v => !v)}
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#7A6B5D' }}
                      aria-label={showCrewPin ? "Hide PIN" : "Show PIN"}
                    >
                      {showCrewPin ? <EyeOffIcon style={{ width: '1.1rem', height: '1.1rem' }} /> : <EyeIcon style={{ width: '1.1rem', height: '1.1rem' }} />}
                    </button>
                  </div>
                </div>
                {error && <p style={{ color: '#B4543A', fontSize: '0.9rem' }}>{error}</p>}
                <button
                  type="submit"
                  disabled={crewLogin.isPending}
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    background: '#2A221E',
                    color: '#FAF6EF',
                    border: 'none',
                    fontFamily: 'var(--font-label)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase' as const,
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#B4543A'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#2A221E'}
                >
                  {crewLogin.isPending ? "Signing in…" : "Sign In as Staff →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (existing logic, preserved) */}
      <Modal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset Password" className="max-w-sm">
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
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setForgotStep("request")} className="flex-1">Back</Button>
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
