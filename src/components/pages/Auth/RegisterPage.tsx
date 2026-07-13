// src/components/pages/Auth/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  validatePassword,
  getPasswordStrength,
  getPasswordStrengthLabel,
  PASSWORD_REQUIREMENTS,
} from "../../../utils/passwordValidation";
import { useAuthApi } from "../../../api/hooks/useAuthApi";
import { BrandWordmark } from "../../atoms/BrandWordmark";
import TurnstileWidget from "../../molecules/TurnstileWidget";
import { isTurnstileEnabled } from "../../../utils/turnstile";
import { EyeIcon, EyeOffIcon } from "@heroicons/react/solid";

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

// Cream-palette strength colours (inline hex — matches the botanical/underline aesthetic).
const STRENGTH_COLORS = ['#DC2626', '#EA580C', '#CA8A04', '#2563EB', '#16A34A'];
const STRENGTH_WIDTHS = ['20%', '40%', '60%', '80%', '100%'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthApi();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumping this remounts the widget to obtain a fresh single-use token after a failed submit.
  const [captchaNonce, setCaptchaNonce] = useState(0);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      setError("Password does not meet security requirements:\n" + validation.errors.join("\n"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (isTurnstileEnabled && !captchaToken) {
      setError("Please complete the CAPTCHA below.");
      return;
    }

    try {
      await register.mutateAsync({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        captchaToken: captchaToken ?? undefined,
      });
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (err: any) {
      // Token is single-use — refresh the widget so the user can retry.
      setCaptchaToken(null);
      setCaptchaNonce((n) => n + 1);
      if (err.response?.status === 409) {
        setError("email_taken");
      } else {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
      }
    }
  };

  const strength = getPasswordStrength(formData.password);
  const strengthLabel = getPasswordStrengthLabel(strength);

  return (
    <div
      style={{
        display: 'grid',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
      className="grid-cols-1 md:grid-cols-2"
    >
      {/* ── Left panel: brand showcase (cream) ── */}
      <div
        style={{
          background: 'linear-gradient(160deg, #FBF7F0 0%, #F3E9DC 55%, #EADBC6 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem',
        }}
        className="hidden md:flex"
      >
        {/* Botanical overlay — gold line art on cream */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600 800"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}
          aria-hidden
        >
          <g fill="none" stroke="#A9895A" strokeWidth="1.2">
            <path d="M150 780 Q160 600 180 450 Q200 280 190 120" />
            <path d="M175 520 Q140 500 115 470" />
            <path d="M180 470 Q215 450 240 420" />
            <path d="M175 400 Q145 385 120 355" />
            <path d="M180 350 Q215 330 240 300" />
            <ellipse cx="115" cy="470" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
            <ellipse cx="240" cy="420" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
            <ellipse cx="120" cy="355" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
            <ellipse cx="240" cy="300" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
            <path d="M450 780 Q445 650 460 530 Q475 410 470 270" />
            <path d="M460 580 Q495 560 520 530" />
            <path d="M455 500 Q420 485 395 455" />
            <ellipse cx="520" cy="530" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
            <ellipse cx="395" cy="455" rx="10" ry="5" fill="#A9895A" opacity="0.4" />
          </g>
        </svg>

        {/* Top: brand mark */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link to="/" aria-label="Go to homepage" style={{ display: 'inline-block' }}>
            <img
              src="/MYBigDay_logo_trimmed.png"
              alt="My Big Day"
              width={1399}
              height={1486}
              style={{ height: 168, width: 'auto', display: 'block' }}
            />
          </Link>
        </div>

        {/* Middle: headline */}
        <div style={{ position: 'relative', zIndex: 2, color: '#2A221E' }}>
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
              color: '#2A221E',
              letterSpacing: '-0.02em',
            }}
          >
            Every great day<br />starts with a{" "}
            <em style={{ fontStyle: 'italic', color: '#B4543A' }}>plan.</em>
          </h2>
          <p style={{ color: '#6B5D50', fontSize: '1.1rem', maxWidth: '28rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
            Create your account to build guest lists, seating charts, and RSVP pages — all in one place, made for your big day.
          </p>
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
            color: '#6B5D50',
          }}
        >
          <span>Planned with love</span>
        </div>
      </div>

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
          <div className="eyebrow" style={{ marginBottom: '1.25rem' }}>Get Started</div>

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
            Create <em style={{ fontStyle: 'italic', color: '#B4543A' }}>account.</em>
          </h1>

          <p style={{ color: '#6B5D50', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
            Sign up to start planning your big day.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleChange("name")}
                placeholder="John Doe"
                autoComplete="name"
                style={inputStyle}
                onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
              />
            </div>

            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                autoComplete="email"
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
                  value={formData.password}
                  onChange={handleChange("password")}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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

              {formData.password && (
                <div style={{ marginTop: '0.9rem' }}>
                  {/* Strength meter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1, height: '4px', background: '#EDE4D3', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: STRENGTH_WIDTHS[strength],
                          background: STRENGTH_COLORS[strength],
                          transition: 'width 0.3s ease, background 0.3s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: STRENGTH_COLORS[strength] }}>
                      {strengthLabel}
                    </span>
                  </div>

                  {/* Requirements checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const ok = req.validator(formData.password);
                      return (
                        <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-serif)', fontSize: '0.85rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '1rem',
                              height: '1rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              lineHeight: 1,
                              background: ok ? 'rgba(22,163,74,0.12)' : '#EDE4D3',
                              color: ok ? '#16A34A' : '#A9895A',
                            }}
                          >
                            {ok ? '✓' : '○'}
                          </span>
                          <span style={{ color: ok ? '#16A34A' : '#6B5D50' }}>{req.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: '2.5rem' }}
                  onFocus={e => (e.target.style.borderBottomColor = '#B4543A')}
                  onBlur={e => (e.target.style.borderBottomColor = '#EDE4D3')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#6B5D50' }}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOffIcon style={{ width: '1.1rem', height: '1.1rem' }} /> : <EyeIcon style={{ width: '1.1rem', height: '1.1rem' }} />}
                </button>
              </div>
            </div>

            {error && (
              error === "email_taken" ? (
                <p style={{ color: '#B4543A', fontSize: '0.9rem', fontFamily: 'var(--font-serif)' }}>
                  An account with this email already exists.{" "}
                  <Link to="/login" style={{ color: '#B4543A', borderBottom: '1px solid #B4543A', paddingBottom: '1px' }}>
                    Sign in instead?
                  </Link>
                </p>
              ) : (
                <p style={{ color: '#B4543A', fontSize: '0.9rem', fontFamily: 'var(--font-serif)', whiteSpace: 'pre-line' }}>{error}</p>
              )
            )}

            {isTurnstileEnabled && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <TurnstileWidget
                  key={captchaNonce}
                  action="register"
                  theme="light"
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={register.isPending || (isTurnstileEnabled && !captchaToken)}
              style={{
                width: '100%',
                padding: '1.2rem',
                background: register.isPending ? '#6B5D50' : '#2A221E',
                color: '#FAF6EF',
                border: 'none',
                fontFamily: 'var(--font-label)',
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase' as const,
                cursor: register.isPending ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={e => { if (!register.isPending) (e.currentTarget as HTMLElement).style.background = '#B4543A'; }}
              onMouseLeave={e => { if (!register.isPending) (e.currentTarget as HTMLElement).style.background = '#2A221E'; }}
            >
              {register.isPending ? "Creating Account…" : "Create Account →"}
            </button>

            <div style={{ textAlign: 'center', color: '#6B5D50', fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: '#B4543A', textDecoration: 'none', borderBottom: '1px solid #B4543A', paddingBottom: '1px' }}>
                Sign In
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
  );
}
